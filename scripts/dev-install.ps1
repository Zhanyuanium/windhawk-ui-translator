# Install (and optionally restart) the local mod build.
# Requires elevation: Windhawk lives in Program Files and compiles into ProgramData.
param(
    [string]$Source = (Join-Path $PSScriptRoot '..\mods\windhawk-ui-translator.wh.cpp'),
    [switch]$Disabled,
    # Restarting from an elevated shell proved unreliable here, so restarting is
    # opt-in and normally done from the caller's own (non-elevated) session.
    [switch]$Restart
)

$ErrorActionPreference = 'Stop'
$cli = 'C:\Program Files\Windhawk\windhawk-cli.exe'
$app = 'C:\Program Files\Windhawk\windhawk.exe'

if (-not (Test-Path $Source)) { throw "mod source not found: $Source" }

$installArgs = @('mod', 'install', '--file', (Resolve-Path $Source).Path)
if ($Disabled) { $installArgs += '--disabled' }

Write-Host "==> $cli $($installArgs -join ' ')"
& $cli @installArgs
if ($LASTEXITCODE -ne 0) { throw "install failed (exit $LASTEXITCODE)" }

if (-not $Restart) {
    Write-Host '==> installed; restart windhawk-ui.exe to load it'
    return
}

# The WebView2 environment is created once per UI process, so the mod only takes
# effect in a freshly started windhawk-ui.exe.
Write-Host '==> restarting Windhawk'
foreach ($name in 'windhawk-ui', 'windhawk') {
    Get-Process -Name $name -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Milliseconds 800
Start-Process -FilePath $app
Start-Sleep -Seconds 4
Get-Process -Name 'windhawk', 'windhawk-ui' -ErrorAction SilentlyContinue |
    Select-Object Id, ProcessName, StartTime | Format-Table -AutoSize
