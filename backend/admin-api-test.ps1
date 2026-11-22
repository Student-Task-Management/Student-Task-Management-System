$ErrorActionPreference = 'Stop'

function Call {
  param($Method, $Path, $Body = $null, $Token = $null)
  $a = @('-s', '-w', "`n%{http_code}", '-X', $Method, "http://localhost:5000/api$Path")
  if ($Token) { $a += @('-H', "Authorization: Bearer $Token") }
  $tmp = $null
  if ($Body) {
    $tmp = [IO.Path]::GetTempFileName()
    [IO.File]::WriteAllText($tmp, ($Body | ConvertTo-Json -Depth 5), (New-Object Text.UTF8Encoding $false))
    $a += @('-H', 'Content-Type: application/json', '--data-binary', "@$tmp")
  }
  $out = @(curl.exe @a)
  if ($tmp) { Remove-Item $tmp }
  $status = [int]$out[-1]
  $json = $null
  if ($out.Count -gt 1) { try { $json = ($out[0..($out.Count - 2)] -join "`n") | ConvertFrom-Json } catch {} }
  [pscustomobject]@{ Status = $status; Json = $json }
}

$script:pass = 0
$script:fail = 0
function Check($name, $ok) {
  if ($ok) { $script:pass++; Write-Host "PASS  $name" -ForegroundColor Green }
  else { $script:fail++; Write-Host "FAIL  $name" -ForegroundColor Red }
}

$adminEmail = (Read-Host 'Admin email').Trim()
$sec = Read-Host 'Admin password' -AsSecureString
$adminPass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))

$today = (Get-Date).ToString('yyyy-MM-dd')
$s = Get-Random
$pw = 'Passw0rd123'

$r = Call POST '/auth/login' @{ email = $adminEmail; password = $adminPass }
if ($r.Status -ne 200) { Write-Host 'Admin login failed. Check the email and password, and that the API is running.' -ForegroundColor Red; return }
$at = $r.Json.data.token
$adminId = $r.Json.data.user.id
Check 'admin account has the admin role' ($r.Json.data.user.role -eq 'admin')

# ---------- test accounts ----------
$emailA = "a$s@test.com"; $emailB = "b$s@test.com"; $emailC = "c$s@test.com"; $emailD = "d$s@test.com"; $emailAdm = "adm$s@test.com"

$r = Call POST '/auth/register' @{ name = 'Student A'; email = $emailA; password = $pw; role = 'admin' }
Check 'sign-up ignores a role sent by the client' ($r.Status -eq 201 -and $r.Json.data.user.role -eq 'user')
$aId = $r.Json.data.user.id; $aTok = $r.Json.data.token
$r = Call POST '/auth/register' @{ name = 'Student B'; email = $emailB; password = $pw }
$bId = $r.Json.data.user.id; $bTok = $r.Json.data.token

# ---------- access control ----------
foreach ($p in '/admin/stats', '/admin/users', '/admin/tasks', '/admin/subjects') {
  Check "no token on $p gives 401" ((Call GET $p).Status -eq 401)
  Check "student on $p gives 403" ((Call GET $p $null $aTok).Status -eq 403)
}
Check 'student cannot create users through the admin API' ((Call POST '/admin/users' @{ name = 'X Y'; email = "x$s@test.com"; password = $pw; role = 'admin' } $aTok).Status -eq 403)
Check 'student cannot change roles' ((Call PATCH "/admin/users/$aId/role" @{ role = 'admin' } $aTok).Status -eq 403)
Check 'student cannot delete tasks through the admin API' ((Call DELETE "/admin/tasks/000000000000000000000000" $null $aTok).Status -eq 403)
$r = Call PUT '/users/profile' @{ name = 'Student A'; email = $emailA; role = 'admin' } $aTok
Check 'a profile update cannot change the role' ($r.Status -eq 200 -and $r.Json.data.user.role -eq 'user')
Check 'student still has no admin access afterwards' ((Call GET '/admin/stats' $null $aTok).Status -eq 403)

# ---------- overview ----------
$r = Call GET "/admin/stats?today=$today" $null $at
Check 'admin stats work' ($r.Status -eq 200 -and $r.Json.data.students.total -ge 2 -and @($r.Json.data.activity).Count -eq 14)
Check 'stats include tasks, subjects and charts data' ($null -ne $r.Json.data.tasks.overdue -and $null -ne $r.Json.data.subjects.total -and $null -ne $r.Json.data.priorities)

# ---------- student tasks (as the student) ----------
$subName = "Test $s"
$r = Call POST '/subjects' @{ name = $subName; color = '#6366f1'; description = '' } $aTok
$sid = $r.Json.data.subject.id
$r = Call POST '/tasks' @{ title = 'Old overdue task'; description = ''; subjectId = $sid; priority = 'High'; status = 'Pending'; dueDate = '2020-01-01' } $aTok
$t1 = $r.Json.data.task.id
$r = Call POST '/tasks' @{ title = 'Finished task'; description = ''; subjectId = $sid; priority = 'Low'; status = 'Completed'; dueDate = '2020-01-02' } $aTok
$t2 = $r.Json.data.task.id

# ---------- task management ----------
$r = Call GET "/admin/tasks?userId=$aId&today=$today" $null $at
Check 'admin sees the student tasks' ($r.Status -eq 200 -and @($r.Json.data.tasks).Count -eq 2)
Check 'task rows include student and subject' ($r.Json.data.tasks[0].user.email -eq $emailA -and $r.Json.data.tasks[0].subject.name -eq $subName)
Check 'response has pagination, summary and subject names' ($r.Json.data.pagination.total -eq 2 -and $null -ne $r.Json.data.summary.overdue -and @($r.Json.data.subjectNames).Count -ge 1)
$r = Call GET "/admin/tasks?userId=$aId&overdue=true&today=$today" $null $at
Check 'overdue filter returns only the unfinished late task' (@($r.Json.data.tasks).Count -eq 1 -and $r.Json.data.tasks[0].overdue -eq $true)
Check 'status filter works' (@((Call GET "/admin/tasks?userId=$aId&status=Completed" $null $at).Json.data.tasks).Count -eq 1)
Check 'priority and subject filters work together' (@((Call GET "/admin/tasks?userId=$aId&priority=High&subject=$subName" $null $at).Json.data.tasks).Count -eq 1)
Check 'title search works' (@((Call GET "/admin/tasks?userId=$aId&q=overdue" $null $at).Json.data.tasks).Count -eq 1)
Check 'empty filter values are ignored' ((Call GET "/admin/tasks?userId=$aId&status=&priority=" $null $at).Status -eq 200)
Check 'invalid status filter gives 400' ((Call GET '/admin/tasks?status=Nope' $null $at).Status -eq 400)
Check 'invalid student id gives 400' ((Call GET '/admin/tasks?userId=abc' $null $at).Status -eq 400)
Check 'student B sees none of the tasks of student A' (@((Call GET '/tasks' $null $bTok).Json.data.tasks).Count -eq 0)

# ---------- student details ----------
$r = Call GET "/admin/users/$aId?today=$today" $null $at
Check 'student detail shows totals' ($r.Status -eq 200 -and $r.Json.data.totals.total -eq 2 -and $r.Json.data.totals.overdue -eq 1 -and $r.Json.data.totals.completed -eq 1)
Check 'student detail shows subjects and recent tasks' (@($r.Json.data.subjects).Count -ge 1 -and @($r.Json.data.recentTasks).Count -eq 2)
Check 'unknown student gives 404' ((Call GET '/admin/users/000000000000000000000000' $null $at).Status -eq 404)

# ---------- delete a task ----------
Check 'admin can delete a task' ((Call DELETE "/admin/tasks/$t2" $null $at).Status -eq 200)
Check 'the deleted task is gone for the student' ((Call GET "/tasks/$t2" $null $aTok).Status -eq 404)
Check 'deleting it twice gives 404' ((Call DELETE "/admin/tasks/$t2" $null $at).Status -eq 404)

# ---------- user management ----------
$r = Call POST '/admin/users' @{ name = 'Created By Admin'; email = $emailC; password = $pw } $at
Check 'admin can create a student' ($r.Status -eq 201 -and $r.Json.data.user.role -eq 'user')
$cId = $r.Json.data.user.id
Check 'the new student can log in' ((Call POST '/auth/login' @{ email = $emailC; password = $pw }).Status -eq 200)
Check 'duplicate email gives 409' ((Call POST '/admin/users' @{ name = 'Created By Admin'; email = $emailC; password = $pw } $at).Status -eq 409)
Check 'weak password gives 400' ((Call POST '/admin/users' @{ name = 'Weak Pass'; email = "w$s@test.com"; password = 'abc' } $at).Status -eq 400)
$r = Call POST '/admin/users' @{ name = 'Second Admin'; email = $emailAdm; password = $pw; role = 'admin' } $at
Check 'admin can create another admin' ($r.Status -eq 201 -and $r.Json.data.user.role -eq 'admin')
$admId = $r.Json.data.user.id
Check 'the new admin can use the admin API' ((Call GET '/admin/stats' $null ((Call POST '/auth/login' @{ email = $emailAdm; password = $pw }).Json.data.token)).Status -eq 200)

$r = Call GET "/admin/users?q=$emailC" $null $at
Check 'search finds a user by email' ($r.Status -eq 200 -and @($r.Json.data.users).Count -eq 1)
$r = Call GET '/admin/users?role=user' $null $at
Check 'role filter student excludes admins' (@($r.Json.data.users | Where-Object { $_.role -eq 'admin' }).Count -eq 0)
$r = Call GET '/admin/users?role=admin' $null $at
Check 'role filter admin only lists admins' (@($r.Json.data.users).Count -ge 2 -and @($r.Json.data.users | Where-Object { $_.role -ne 'admin' }).Count -eq 0)
Check 'user list never exposes passwords' (-not $r.Json.data.users[0].PSObject.Properties['password'])

$r = Call PUT "/admin/users/$cId" @{ name = 'Renamed Student'; email = $emailC } $at
Check 'admin can edit a student' ($r.Status -eq 200 -and $r.Json.data.user.name -eq 'Renamed Student')
Check 'using the email of another account gives 409' ((Call PUT "/admin/users/$cId" @{ name = 'Renamed Student'; email = $emailA } $at).Status -eq 409)
Check 'admin can set a new password' ((Call PUT "/admin/users/$cId" @{ name = 'Renamed Student'; email = $emailC; password = 'NewPassw0rd1' } $at).Status -eq 200)
Check 'the new password works and the old one does not' (((Call POST '/auth/login' @{ email = $emailC; password = 'NewPassw0rd1' }).Status -eq 200) -and ((Call POST '/auth/login' @{ email = $emailC; password = $pw }).Status -eq 401))
Check 'admin can edit their own profile' ((Call PUT "/admin/users/$adminId" @{ name = 'Site Admin'; email = $adminEmail } $at).Status -eq 200)

# ---------- disable and enable ----------
Check 'admin can disable a student' ((Call PATCH "/admin/users/$bId/status" @{ disabled = $true } $at).Status -eq 200)
Check 'a disabled student cannot log in (403)' ((Call POST '/auth/login' @{ email = $emailB; password = $pw }).Status -eq 403)
Check 'the token of a disabled student stops working (401)' ((Call GET '/auth/me' $null $bTok).Status -eq 401)
Check 'admin can enable the student again' ((Call PATCH "/admin/users/$bId/status" @{ disabled = $false } $at).Status -eq 200)
Check 'an enabled student can log in again' ((Call POST '/auth/login' @{ email = $emailB; password = $pw }).Status -eq 200)

# ---------- roles ----------
Check 'admin can promote a student to admin' ((Call PATCH "/admin/users/$bId/role" @{ role = 'admin' } $at).Status -eq 200)
Check 'the promoted user gets admin access immediately' ((Call GET '/admin/stats' $null $bTok).Status -eq 200)
Check 'admin can demote them back to student' ((Call PATCH "/admin/users/$bId/role" @{ role = 'user' } $at).Status -eq 200)
Check 'the demoted user loses admin access immediately' ((Call GET '/admin/stats' $null $bTok).Status -eq 403)
Check 'an invalid role gives 400' ((Call PATCH "/admin/users/$bId/role" @{ role = 'boss' } $at).Status -eq 400)
Check 'an admin cannot change their own role' ((Call PATCH "/admin/users/$adminId/role" @{ role = 'user' } $at).Status -eq 400)
Check 'an admin cannot disable their own account' ((Call PATCH "/admin/users/$adminId/status" @{ disabled = $true } $at).Status -eq 400)
Check 'an admin cannot delete their own account' ((Call DELETE "/admin/users/$adminId" $null $at).Status -eq 400)
Check 'another admin cannot be disabled directly' ((Call PATCH "/admin/users/$admId/status" @{ disabled = $true } $at).Status -eq 403)
Check 'another admin cannot be deleted directly' ((Call DELETE "/admin/users/$admId" $null $at).Status -eq 403)
Check 'another admin cannot be edited directly' ((Call PUT "/admin/users/$admId" @{ name = 'Hacked'; email = $emailAdm } $at).Status -eq 403)

# ---------- subject catalog ----------
$r = Call GET '/admin/subjects' $null $at
Check 'catalog list works and shows usage' ($r.Status -eq 200 -and @($r.Json.data.subjects).Count -ge 1 -and $null -ne $r.Json.data.subjects[0].studentCount)
$catName = "Cat $s"
$r = Call POST '/admin/subjects' @{ name = $catName; color = '#14b8a6'; description = 'Test subject' } $at
Check 'admin can add a catalog subject' ($r.Status -eq 201)
$catId = $r.Json.data.subject.id
Check 'a duplicate name in another case gives 409' ((Call POST '/admin/subjects' @{ name = $catName.ToLower(); color = '#14b8a6'; description = '' } $at).Status -eq 409)
Check 'a bad color gives 400' ((Call POST '/admin/subjects' @{ name = "Bad $s"; color = 'red'; description = '' } $at).Status -eq 400)
$catName2 = "Cat2 $s"
Check 'admin can edit a catalog subject' ((Call PUT "/admin/subjects/$catId" @{ name = $catName2; color = '#ef4444'; description = 'Edited' } $at).Status -eq 200)
$r = Call POST '/auth/register' @{ name = 'Student D'; email = $emailD; password = $pw }
$dId = $r.Json.data.user.id; $dTok = $r.Json.data.token
Check 'new students receive the catalog subjects' (@((Call GET '/subjects' $null $dTok).Json.data.subjects | Where-Object { $_.name -eq $catName2 }).Count -eq 1)
Check 'admin can remove a catalog subject' ((Call DELETE "/admin/subjects/$catId" $null $at).Status -eq 200)
Check 'the removed subject stays with students who have it' (@((Call GET '/subjects' $null $dTok).Json.data.subjects | Where-Object { $_.name -eq $catName2 }).Count -eq 1)
Check 'removing it twice gives 404' ((Call DELETE "/admin/subjects/$catId" $null $at).Status -eq 404)
Check 'student cannot edit the catalog' ((Call POST '/admin/subjects' @{ name = "Nope $s"; color = '#14b8a6'; description = '' } $dTok).Status -eq 403)

# ---------- delete users and clean up ----------
Check 'demote the second admin before removing it' ((Call PATCH "/admin/users/$admId/role" @{ role = 'user' } $at).Status -eq 200)
$deleted = 0
foreach ($id in $aId, $bId, $cId, $dId, $admId) { if ((Call DELETE "/admin/users/$id" $null $at).Status -eq 200) { $deleted++ } }
Check 'admin can delete users (5 test accounts removed)' ($deleted -eq 5)
Check 'a deleted user cannot log in' ((Call POST '/auth/login' @{ email = $emailA; password = $pw }).Status -eq 401)
Check 'the deleted user token stops working' ((Call GET '/auth/me' $null $aTok).Status -eq 401)

Write-Host ''
$color = if ($script:fail -eq 0) { 'Green' } else { 'Red' }
Write-Host "$($script:pass) passed, $($script:fail) failed" -ForegroundColor $color
