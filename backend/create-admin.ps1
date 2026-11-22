$email = (Read-Host 'Admin email').Trim()
$name  = (Read-Host 'Admin name').Trim()
$p1 = Read-Host 'Admin password (min 8 characters, letter + number)' -AsSecureString
$p2 = Read-Host 'Repeat password' -AsSecureString

function ToPlain($s) { [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)) }
$plain1 = ToPlain $p1
$plain2 = ToPlain $p2

if ($email -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') {
  Write-Host 'That is not a valid email address. Nothing was changed.' -ForegroundColor Red
} elseif ($plain1 -ne $plain2) {
  Write-Host 'The passwords do not match. Nothing was changed.' -ForegroundColor Red
} elseif ($plain1.Length -lt 8 -or $plain1 -notmatch '[A-Za-z]' -or $plain1 -notmatch '\d') {
  Write-Host 'The password needs at least 8 characters, with a letter and a number. Nothing was changed.' -ForegroundColor Red
} else {
  try {
    $env:ADMIN_EMAIL = $email
    $env:ADMIN_NAME = if ($name) { $name } else { 'Administrator' }
    $env:ADMIN_PASSWORD = $plain1
    npm run create-admin
  } finally {
    Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_NAME, Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
  }
}
