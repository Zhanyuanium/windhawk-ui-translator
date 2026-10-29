# Restart Windhawk with the WebView2 DevTools port open, for DOM inspection.
# Run elevated: the tray process (windhawk.exe) runs with an elevated token here.
$env:WINDHAWK_UI_WEBVIEW2_ARGS = '--remote-debugging-port=9222 --remote-allow-origins=*'
Get-Process -Name 'windhawk-ui', 'windhawk' -ErrorAction SilentlyContinue |
    Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 900
Start-Process -FilePath 'C:\Program Files\Windhawk\windhawk.exe'
Start-Sleep -Seconds 8
try {
    $list = (Invoke-WebRequest 'http://127.0.0.1:9222/json/list' -UseBasicParsing -TimeoutSec 5).Content
    Write-Host 'CDP OK:'
    Write-Host $list
} catch {
    Write-Host "CDP not reachable: $($_.Exception.Message)"
}
