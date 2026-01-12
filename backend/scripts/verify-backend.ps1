Param(
    [int]$ServerCheckSeconds = 5
)

$ErrorActionPreference = 'Stop'

function Write-Section([string]$Title) {
    Write-Host "`n=== $Title ===" -ForegroundColor Cyan
}

function Run-NodeInline([string]$Name, [string]$Js) {
    Write-Host "-> $Name" -ForegroundColor Yellow
    $p = Start-Process -FilePath node -ArgumentList @('-e', $Js) -NoNewWindow -PassThru -Wait -RedirectStandardOutput "$env:TEMP\ycd_$Name.out" -RedirectStandardError "$env:TEMP\ycd_$Name.err"
    $out = Get-Content "$env:TEMP\ycd_$Name.out" -ErrorAction SilentlyContinue
    $err = Get-Content "$env:TEMP\ycd_$Name.err" -ErrorAction SilentlyContinue
    if ($out) { $out | ForEach-Object { Write-Host $_ } }
    if ($err) { $err | ForEach-Object { Write-Host $_ -ForegroundColor Red } }
    return $p.ExitCode
}

function Require-Smoke([string]$Name, [string]$ModulePath) {
    Write-Host "-> $Name ($ModulePath)" -ForegroundColor Yellow
    $outFile = "$env:TEMP\ycd_smoke_${Name}.out"
    $errFile = "$env:TEMP\ycd_smoke_${Name}.err"

    if (Test-Path $outFile) { Remove-Item $outFile -Force -ErrorAction SilentlyContinue }
    if (Test-Path $errFile) { Remove-Item $errFile -Force -ErrorAction SilentlyContinue }

    $p = Start-Process -FilePath node -ArgumentList @('.\\scripts\\require-smoke.js', $ModulePath) -NoNewWindow -PassThru -Wait -RedirectStandardOutput $outFile -RedirectStandardError $errFile

    $out = Get-Content $outFile -ErrorAction SilentlyContinue
    $err = Get-Content $errFile -ErrorAction SilentlyContinue
    if ($out) { $out | ForEach-Object { Write-Host $_ } }
    if ($err) { $err | ForEach-Object { Write-Host $_ -ForegroundColor Red } }

    return $p.ExitCode
}

try {
    Write-Section 'Workspace'
    Write-Host "PWD: $(Get-Location)"

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw 'Node.js not found in PATH.'
    }

    Write-Section 'Logger Import Check'
    node .\scripts\check-logger-imports.js

    Write-Section 'Module Import Smoke Tests'

    $exit1 = Require-Smoke 'require_logger' './src/config/logger'
    if ($exit1 -ne 0) { throw 'Failed requiring ./src/config/logger' }

    $exit2 = Require-Smoke 'require_socketService' './src/services/socketService'
    if ($exit2 -ne 0) { throw 'Failed requiring ./src/services/socketService' }

    $exit3 = Require-Smoke 'require_authController' './src/controllers/authController'
    if ($exit3 -ne 0) { throw 'Failed requiring ./src/controllers/authController' }

    Write-Section 'Server Startup Check (timeout + auto-kill)'
    Write-Host "Starting server for up to ${ServerCheckSeconds}s..." -ForegroundColor Yellow

    if (-not $env:NODE_ENV -or $env:NODE_ENV.Trim().Length -eq 0) {
        $env:NODE_ENV = 'production'
    }

    $server = Start-Process -FilePath node -ArgumentList @('src/index.js') -NoNewWindow -PassThru -RedirectStandardOutput "$env:TEMP\ycd_server.out" -RedirectStandardError "$env:TEMP\ycd_server.err"

    Start-Sleep -Seconds $ServerCheckSeconds

    if ($server.HasExited) {
        $out = Get-Content "$env:TEMP\ycd_server.out" -ErrorAction SilentlyContinue
        $err = Get-Content "$env:TEMP\ycd_server.err" -ErrorAction SilentlyContinue
        if ($out) { $out | Select-Object -First 200 | ForEach-Object { Write-Host $_ } }
        if ($err) { $err | Select-Object -First 200 | ForEach-Object { Write-Host $_ -ForegroundColor Red } }
        throw "Server exited early with code $($server.ExitCode)"
    }

    Write-Host 'Server stayed up during the check window. Stopping it now...' -ForegroundColor Green
    Stop-Process -Id $server.Id -Force

    Write-Host "`nOK: verify-backend passed." -ForegroundColor Green
    exit 0
}
catch {
    Write-Host "`nFAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
