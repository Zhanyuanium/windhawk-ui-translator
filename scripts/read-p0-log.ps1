# Show the P0 log written by the mod (the mod writes it itself because Wh_Log only
# reaches Windhawk's log pane).
param([int]$Lines = 60, [switch]$Follow)

$candidates = @(
    (Join-Path $env:ProgramData 'Windhawk\Engine\ModsWritable\mod-storage\windhawk-ui-translator\p0.log'),
    (Join-Path $env:ProgramData 'Windhawk\Engine\ModsWritable\mod-storage\windhawk-ui-translator\p0.old.log')
)
$log = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $log) {
    Write-Host "no p0.log found; looked in:"
    $candidates | ForEach-Object { Write-Host "  $_" }
    Get-ChildItem (Join-Path $env:ProgramData 'Windhawk\Engine\ModsWritable\mod-storage') -Recurse -Filter '*.log' -ErrorAction SilentlyContinue |
        Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize
    exit 1
}

Write-Host "==> $log"
if ($Follow) { Get-Content $log -Tail $Lines -Wait } else { Get-Content $log -Tail $Lines }
