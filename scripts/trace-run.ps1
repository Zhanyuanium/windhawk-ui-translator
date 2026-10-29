# Enable debug logging, restart the UI on a mod's details page and dump the trace.
# Run elevated (mod settings live in HKLM).
param(
    [string]$Mod = 'alt-tab-flip-3d',
    [int]$WaitSeconds = 14
)

$cli = 'C:\Program Files\Windhawk\windhawk-cli.exe'
$app = 'C:\Program Files\Windhawk\windhawk.exe'
$modId = 'local@windhawk-ui-translator'
$log = Join-Path $env:ProgramData 'Windhawk\Engine\ModsWritable\mod-storage\local@windhawk-ui-translator\p0.log'

& $cli mod settings set $modId debug=1 | Out-Null
Write-Host "debug=1 set"

Get-Process -Name 'windhawk-ui' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 900
Start-Process -FilePath $app
Start-Sleep -Seconds 8
Start-Process "windhawk://mods/$Mod"
Start-Sleep -Seconds $WaitSeconds

Write-Host "== log tail =="
Get-Content $log -Tail 120
