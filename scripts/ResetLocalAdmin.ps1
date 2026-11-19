$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

function Convert-SecureStringToPlainText {
    param([Security.SecureString]$Value)
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

$securePassword = Read-Host 'Nueva contraseña del administrador (mínimo 12 caracteres)' -AsSecureString
$secureConfirmation = Read-Host 'Repetí la nueva contraseña' -AsSecureString
$newPassword = Convert-SecureStringToPlainText $securePassword
$confirmation = Convert-SecureStringToPlainText $secureConfirmation

if ($newPassword.Length -lt 12) { throw 'La contraseña debe tener al menos 12 caracteres.' }
if ($newPassword -cne $confirmation) { throw 'Las contraseñas no coinciden.' }

$previousProfile = [Environment]::GetEnvironmentVariable('SPRING_PROFILES_ACTIVE', 'Process')
$previousResetPassword = [Environment]::GetEnvironmentVariable('LOCAL_ADMIN_RESETPASSWORD', 'Process')
[Environment]::SetEnvironmentVariable('SPRING_PROFILES_ACTIVE', 'local', 'Process')
[Environment]::SetEnvironmentVariable('LOCAL_ADMIN_RESETPASSWORD', $newPassword, 'Process')

try {
    Push-Location $repoRoot
    Write-Host 'Iniciando el backend local para restablecer la contraseña...'
    Write-Host 'Cuando aparezca el mensaje de restablecimiento, iniciá sesión en la app.'
    Write-Host 'Dejá el backend abierto mientras probás. Para detenerlo, presioná Ctrl+C.'
    & .\mvnw.cmd spring-boot:run
    if ($LASTEXITCODE -ne 0) { throw "El backend terminó con código $LASTEXITCODE." }
} finally {
    if ((Get-Location).Path -eq $repoRoot) { Pop-Location }
    [Environment]::SetEnvironmentVariable('SPRING_PROFILES_ACTIVE', $previousProfile, 'Process')
    [Environment]::SetEnvironmentVariable('LOCAL_ADMIN_RESETPASSWORD', $previousResetPassword, 'Process')
    $newPassword = $null
    $confirmation = $null
}
