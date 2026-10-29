# Restart windhawk-ui.exe so a freshly built mod is loaded.
# Run this from a normal (non-elevated) shell: killing the processes there works,
# while doing it from an elevated shell has been unreliable.
$ErrorActionPreference = 'Stop'
$app = 'C:\Program Files\Windhawk\windhawk.exe'

Get-Process -Name 'windhawk-ui' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 800
Start-Process -FilePath $app
Start-Sleep -Seconds 6
Get-Process -Name 'windhawk', 'windhawk-ui' -ErrorAction SilentlyContinue |
    Select-Object Id, ProcessName, StartTime | Format-Table -AutoSize
