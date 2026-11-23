Set-Location $PSScriptRoot
$email = (Read-Host 'Admin email').Trim()
$name  = (Read-Host 'Admin name').Trim()
$p1 = Read-Host 'Admin password (min 8 characters, letter + number)' -AsSecureString
$p2 = Read-Host 'Repeat password' -AsSecureString
function ToPlain($s) { [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)) }
$a = ToPlain $p1
$b = ToPlain $p2

if ($email -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') { Write-Host 'Not a valid email. Nothing was changed.' -ForegroundColor Red }
elseif ($a -ne $b) { Write-Host 'The passwords do not match. Nothing was changed.' -ForegroundColor Red }
elseif ($a.Length -lt 8 -or $a -notmatch '[A-Za-z]' -or $a -notmatch '\d') { Write-Host 'The password needs 8+ characters with a letter and a number.' -ForegroundColor Red }
else { docker compose exec -T -e ADMIN_EMAIL=$email -e ADMIN_NAME=$name -e ADMIN_PASSWORD=$a backend node dist/scripts/createAdmin.js }
