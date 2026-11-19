$ErrorActionPreference = 'Continue'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$frontendRoot = Join-Path $repoRoot 'frontend'
$script:checks = [System.Collections.Generic.List[object]]::new()

function Add-Check {
    param([string]$Name, [bool]$Passed, [string]$Details = '')
    $script:checks.Add([pscustomobject]@{ Name = $Name; Passed = $Passed; Details = $Details })
    $label = if ($Passed) { 'PASS' } else { 'FAIL' }
    if ($Details) { Write-Host "[$label] $Name - $Details" } else { Write-Host "[$label] $Name" }
}

function Invoke-ProjectCommand {
    param([string]$Name, [string]$Directory, [string]$Command, [string[]]$Arguments)
    Push-Location $Directory
    try {
        $commandOutput = @(& $Command @Arguments 2>&1)
        $commandExit = $LASTEXITCODE
        Add-Check $Name ($commandExit -eq 0) "exit code $commandExit"
        if ($commandExit -ne 0) {
            Write-Host "Salida final de $Name`:"
            $commandOutput | Select-Object -Last 60 | ForEach-Object { Write-Host $_ }
        }
        return $commandExit
    } catch {
        Add-Check $Name $false $_.Exception.Message
        return 1
    } finally {
        Pop-Location
    }
}

function Invoke-ApiRequest {
    param(
        [System.Net.Http.HttpClient]$Client,
        [string]$Method,
        [string]$Uri,
        [object]$Payload = $null,
        [string]$Token = ''
    )
    $httpMethod = [System.Net.Http.HttpMethod]::new($Method)
    $request = [System.Net.Http.HttpRequestMessage]::new($httpMethod, $Uri)
    if ($Token) { [void]$request.Headers.TryAddWithoutValidation('Authorization', "Bearer $Token") }
    if ($null -ne $Payload) {
        $json = ConvertTo-Json -InputObject $Payload -Depth 10 -Compress
        $request.Content = [System.Net.Http.StringContent]::new($json, [System.Text.Encoding]::UTF8, 'application/json')
    }
    $response = $Client.SendAsync($request).GetAwaiter().GetResult()
    $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $result = [pscustomobject]@{ Status = [int]$response.StatusCode; Content = $content }
    $response.Dispose()
    $request.Dispose()
    return $result
}

function Restore-ProcessEnvironment {
    param([hashtable]$PreviousValues)
    foreach ($key in $PreviousValues.Keys) {
        [Environment]::SetEnvironmentVariable($key, $PreviousValues[$key], 'Process')
    }
}

Write-Host 'VH Masajes - verificación integrada'
Write-Host '1/4 Seguridad de dependencias, lint y build del frontend'

Push-Location $frontendRoot
try {
    $auditOutput = (& npm audit --json 2>$null | Out-String)
    $auditExit = $LASTEXITCODE
    $auditTotal = $null
    try {
        $auditData = $auditOutput | ConvertFrom-Json -ErrorAction Stop
        $auditTotal = [int]$auditData.metadata.vulnerabilities.total
    } catch { }
    Add-Check 'npm audit' ($auditExit -eq 0 -and $auditTotal -eq 0) "exit code $auditExit; vulnerabilities=$auditTotal"
} catch {
    Add-Check 'npm audit' $false $_.Exception.Message
} finally {
    Pop-Location
}

[void](Invoke-ProjectCommand 'Frontend lint' $frontendRoot 'npm' @('run', 'lint'))
[void](Invoke-ProjectCommand 'Frontend production build' $frontendRoot 'npm' @('run', 'build'))

Write-Host '2/4 Pruebas y empaquetado del backend'
$environmentKeys = @('SPRING_PROFILES_ACTIVE', 'SPRING_DATASOURCE_URL', 'SERVER_PORT')
$previousEnvironment = @{}
foreach ($key in $environmentKeys) { $previousEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
$testDatabaseUrl = 'jdbc:h2:mem:vhmasajes_verify_tests;MODE=PostgreSQL;DB_CLOSE_DELAY=-1'
[Environment]::SetEnvironmentVariable('SPRING_PROFILES_ACTIVE', 'local', 'Process')
[Environment]::SetEnvironmentVariable('SPRING_DATASOURCE_URL', $testDatabaseUrl, 'Process')

$mavenWrapper = Join-Path $repoRoot 'mvnw.cmd'
$buildId = [guid]::NewGuid().ToString('N')
$buildDirectory = "target/verify-$buildId"
$null = Invoke-ProjectCommand 'Backend tests and package (Maven verify)' $repoRoot $mavenWrapper @('verify', "-Dvh.build.directory=$buildDirectory")
$mavenResult = $script:checks | Where-Object { $_.Name -eq 'Backend tests and package (Maven verify)' } | Select-Object -Last 1

Write-Host '3/4 Smoke checks HTTP con base temporal'
if ($mavenResult.Passed) {
    $jarPath = Join-Path $repoRoot (Join-Path $buildDirectory 'app-0.0.1-SNAPSHOT.jar')
    $javaCommand = Get-Command java -ErrorAction SilentlyContinue
    if (-not (Test-Path -LiteralPath $jarPath) -or -not $javaCommand) {
        Add-Check 'API smoke checks' $false 'No se encontró el JAR empaquetado o Java.'
    } else {
        $portProbe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
        $portProbe.Start()
        $port = $portProbe.LocalEndpoint.Port
        $portProbe.Stop()

        $smokeDatabaseUrl = "jdbc:h2:mem:vhmasajes_verify_$port;MODE=PostgreSQL;DB_CLOSE_DELAY=-1"
        [Environment]::SetEnvironmentVariable('SPRING_DATASOURCE_URL', $smokeDatabaseUrl, 'Process')
        [Environment]::SetEnvironmentVariable('SERVER_PORT', [string]$port, 'Process')

        $tempRoot = [System.IO.Path]::GetTempPath()
        $runId = [guid]::NewGuid().ToString('N')
        $stdoutPath = Join-Path $tempRoot "vhmasajes-verify-$runId.out.log"
        $stderrPath = Join-Path $tempRoot "vhmasajes-verify-$runId.err.log"
        $backendProcess = $null
        $client = [System.Net.Http.HttpClient]::new()
        $client.Timeout = [TimeSpan]::FromSeconds(8)

        try {
            $backendProcess = Start-Process -FilePath $javaCommand.Source `
                -ArgumentList @('-jar', $jarPath) `
                -WorkingDirectory $repoRoot `
                -WindowStyle Hidden -PassThru `
                -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath

            $baseUrl = "http://127.0.0.1:$port"
            $ready = $false
            for ($attempt = 0; $attempt -lt 60; $attempt++) {
                if ($backendProcess.HasExited) { break }
                try {
                    $servicesResponse = Invoke-ApiRequest $client 'GET' "$baseUrl/api/servicios"
                    if ($servicesResponse.Status -eq 200) { $ready = $true; break }
                } catch { }
                Start-Sleep -Seconds 1
            }
            Add-Check 'Backend starts with local profile and in-memory H2' $ready

            if ($ready) {
                $services = @($servicesResponse.Content | ConvertFrom-Json)
                Add-Check 'Public service catalog' ($services.Count -gt 0) "services=$($services.Count)"

                $businessDate = (Get-Date).Date.AddDays(1)
                while ($businessDate.DayOfWeek -in @([DayOfWeek]::Saturday, [DayOfWeek]::Sunday)) { $businessDate = $businessDate.AddDays(1) }
                $dateText = $businessDate.ToString('yyyy-MM-dd')
                $serviceId = $services[0].id
                $availability = Invoke-ApiRequest $client 'GET' "$baseUrl/api/turnos/disponibilidad/$dateText`?servicioId=$serviceId"
                $slots = @($availability.Content | ConvertFrom-Json)
                Add-Check 'Availability uses configured service duration and schedule' ($availability.Status -eq 200 -and $slots.Count -gt 0) "HTTP $($availability.Status); slots=$($slots.Count)"

                $apiDocs = Invoke-ApiRequest $client 'GET' "$baseUrl/api-docs"
                Add-Check 'OpenAPI endpoint is reachable' ($apiDocs.Status -eq 200) "HTTP $($apiDocs.Status)"

                $adminLogin = Invoke-ApiRequest $client 'POST' "$baseUrl/api/auth/login" @{ email = 'admin@masajes.local'; password = 'local-only-change-on-first-use' }
                $adminToken = ''
                if ($adminLogin.Status -eq 200) { $adminToken = (ConvertFrom-Json $adminLogin.Content).token }
                Add-Check 'Local admin can sign in' ($adminLogin.Status -eq 200 -and $adminToken) "HTTP $($adminLogin.Status)"

                $anonymousPasswordChange = Invoke-ApiRequest $client 'POST' "$baseUrl/api/auth/change-password" @{ passwordActual = 'x'; passwordNuevo = 'Smoke-Test-Password-2026'; passwordConfirmacion = 'Smoke-Test-Password-2026' }
                Add-Check 'Password change requires authentication' ($anonymousPasswordChange.Status -in @(401, 403)) "HTTP $($anonymousPasswordChange.Status)"

                $clientEmail = "verify-$runId@example.test"
                $registration = Invoke-ApiRequest $client 'POST' "$baseUrl/api/auth/register" @{ nombre = 'Cliente de verificación'; email = $clientEmail; password = 'Smoke-Client-Password-2026'; passwordConfirm = 'Smoke-Client-Password-2026'; telefono = '' }
                $clientToken = ''
                if ($registration.Status -eq 201) { $clientToken = (ConvertFrom-Json $registration.Content).token }
                Add-Check 'Patient registration returns an authenticated session' ($registration.Status -eq 201 -and $clientToken) "HTTP $($registration.Status)"

                $forbiddenStats = Invoke-ApiRequest $client 'GET' "$baseUrl/api/admin/stats/dashboard?anio=$((Get-Date).Year)" $null $clientToken
                Add-Check 'Patient cannot read admin reports' ($forbiddenStats.Status -eq 403) "HTTP $($forbiddenStats.Status)"

                if ($adminToken) {
                    $stats = Invoke-ApiRequest $client 'GET' "$baseUrl/api/admin/stats/dashboard?anio=$((Get-Date).Year)" $null $adminToken
                    $monthCount = 0
                    if ($stats.Status -eq 200) { $monthCount = @((ConvertFrom-Json $stats.Content).gananciasMensuales).Count }
                    Add-Check 'Admin monthly report returns all 12 months' ($stats.Status -eq 200 -and $monthCount -eq 12) "HTTP $($stats.Status); months=$monthCount"

                    $newAdminPassword = 'Smoke-Admin-Password-2026'
                    $passwordChange = Invoke-ApiRequest $client 'POST' "$baseUrl/api/auth/change-password" @{ passwordActual = 'local-only-change-on-first-use'; passwordNuevo = $newAdminPassword; passwordConfirmacion = $newAdminPassword } $adminToken
                    Add-Check 'Authenticated admin can change password' ($passwordChange.Status -eq 200) "HTTP $($passwordChange.Status)"
                    $newLogin = Invoke-ApiRequest $client 'POST' "$baseUrl/api/auth/login" @{ email = 'admin@masajes.local'; password = $newAdminPassword }
                    Add-Check 'Changed password works for the next login' ($newLogin.Status -eq 200) "HTTP $($newLogin.Status)"
                }

                if ($clientToken -and $availability.Status -eq 200 -and $slots.Count -gt 0) {
                    $chosenTime = [string]$slots[0]
                    if ($chosenTime.Length -eq 5) { $chosenTime = "$chosenTime`:00" }
                    $appointment = @{ fecha = "${dateText}T${chosenTime}"; cliente = 'Cliente de verificación'; servicioId = [int]$serviceId; notas = 'Verificación automática' }
                    $firstBooking = Invoke-ApiRequest $client 'POST' "$baseUrl/api/turnos" $appointment $clientToken
                    Add-Check 'Patient can book a free appointment' ($firstBooking.Status -eq 201) "HTTP $($firstBooking.Status)"

                    if ($firstBooking.Status -eq 201) {
                        $duplicateBooking = Invoke-ApiRequest $client 'POST' "$baseUrl/api/turnos" $appointment $clientToken
                        Add-Check 'Duplicate appointment is rejected' ($duplicateBooking.Status -eq 409) "HTTP $($duplicateBooking.Status)"
                    } else {
                        Add-Check 'Duplicate appointment is rejected' $false 'Skipped because the first booking failed.'
                    }
                } else {
                    Add-Check 'Patient can book a free appointment' $false 'Skipped: no authenticated patient or available slot.'
                    Add-Check 'Duplicate appointment is rejected' $false 'Skipped: no first booking was created.'
                }
            }
        } catch {
            Add-Check 'API smoke checks' $false $_.Exception.Message
            if (Test-Path -LiteralPath $stderrPath) { Get-Content -LiteralPath $stderrPath -Tail 30 }
        } finally {
            $client.Dispose()
            if ($backendProcess -and -not $backendProcess.HasExited) {
                Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
                [void]$backendProcess.WaitForExit(10000)
            }
            Remove-Item -LiteralPath $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue
        }
    }
} else {
    Add-Check 'API smoke checks' $false 'Skipped because Maven verify failed.'
}

Restore-ProcessEnvironment $previousEnvironment
Write-Host '4/4 Resumen'
$failedChecks = @($script:checks | Where-Object { -not $_.Passed })
Write-Host "Checks: $($script:checks.Count); passed: $($script:checks.Count - $failedChecks.Count); failed: $($failedChecks.Count)"
if ($failedChecks.Count -gt 0) { exit 1 }
exit 0
