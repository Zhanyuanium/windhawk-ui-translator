#Requires -Version 7.0
<#
.SYNOPSIS
Development helper for the Windhawk UI Translator mod.

.DESCRIPTION
One entry point for the local development loop: compile and install the mod,
restart Windhawk's UI, read the mod's own log, and flip the debug setting.

Every path (Windhawk install, mod source, mod id, log directory) lives in the
$Paths table below; change it there and nowhere else.

Subcommands and elevation:

  install   Compile mods\windhawk-ui-translator.wh.cpp and install it with
            windhawk-cli. Needs an elevated shell (Windhawk lives in
            Program Files and compiles into ProgramData), unless -AppRoot
            points at a writable portable app root. Does NOT restart Windhawk.
  restart   Kill windhawk-ui.exe and start windhawk.exe again so a freshly
            installed mod is loaded. Does NOT need elevation; run it from a
            normal shell.
  log       Print the tail of p0.log (or follow it). Does NOT need elevation.
  trace     Turn debug logging on, restart, open a mod's details page and dump
            the log. Needs elevation (mod settings live in HKLM).
  debug     "debug on" or "debug off": set the debug setting and let the mod
            push it to the running page. Needs elevation.

.PARAMETER Command
install | restart | log | trace | debug

.PARAMETER Argument
Only for "debug": on or off.

.EXAMPLE
pwsh -NoProfile -File scripts/dev.ps1 install -Disabled
Compile and install disabled, without restarting.

.EXAMPLE
pwsh -NoProfile -File scripts/dev.ps1 install -AppRoot "$env:TEMP\wh-portable" -Disabled
Compile into an isolated portable app root; no elevation and no change to the
real Windhawk installation.

.EXAMPLE
pwsh -NoProfile -File scripts/dev.ps1 restart
Restart the UI so the installed mod is picked up.

.EXAMPLE
pwsh -NoProfile -File scripts/dev.ps1 log -Tail 40 -Follow
Watch the mod log while using the app.

.EXAMPLE
pwsh -NoProfile -File scripts/dev.ps1 trace -Mod alt-tab-flip-3d
Enable debug logging, restart, open that mod and print the trace.
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('install', 'restart', 'log', 'trace', 'debug')]
    [string]$Command,

    [Parameter(Position = 1)]
    [string]$Argument,

    # install: mod source file, defaults to the repository copy.
    [string]$Source,

    # install: install in disabled state.
    [switch]$Disabled,

    # install: restart Windhawk after a successful install (off by default).
    [switch]$Restart,

    # restart: also expose the WebView2 DevTools port (DOM inspection).
    [switch]$Cdp,

    # install: portable Windhawk app root (the directory holding windhawk.ini).
    [string]$AppRoot,

    # log/trace: number of trailing lines.
    [int]$Tail = 60,

    # log: keep the file open and print new lines.
    [switch]$Follow,

    # trace: mod id to open after the restart.
    [string]$Mod = 'alt-tab-flip-3d',

    # trace: seconds to let the page settle before dumping the log.
    [int]$WaitSeconds = 14
)

$ErrorActionPreference = 'Stop'

if (-not $Command) {
    Get-Help $PSCommandPath -Detailed
    exit 1
}

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

$Paths = @{
    Cli     = 'C:\Program Files\Windhawk\windhawk-cli.exe'
    App     = 'C:\Program Files\Windhawk\windhawk.exe'
    ModId   = 'local@windhawk-ui-translator'
    Source  = Join-Path $PSScriptRoot '..\mods\windhawk-ui-translator.wh.cpp'
    Storage = Join-Path $env:ProgramData 'Windhawk\Engine\ModsWritable\mod-storage\local@windhawk-ui-translator'
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Test-Elevated {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Assert-Elevated([string]$What) {
    if (Test-Elevated) { return }
    throw "$What needs an elevated shell (Windhawk lives in Program Files and its mod settings live in HKLM). Re-run from an administrator PowerShell."
}

function Get-ModLogPath {
    $candidates = @(
        (Join-Path $Paths.Storage 'p0.log'),
        (Join-Path $Paths.Storage 'p0.old.log')
    )
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }

    # The storage folder is named after the installed mod id, which differs
    # between a local build and a repository install; fall back to a search.
    $storageRoot = Split-Path -Parent $Paths.Storage
    $found = Get-ChildItem -LiteralPath $storageRoot -Recurse -Filter 'p0.log' -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($found) { return $found.FullName }
    return $null
}

function Show-ModLog([int]$Lines, [switch]$Wait) {
    $log = Get-ModLogPath
    if (-not $log) {
        Write-Host 'no p0.log found; looked in:'
        Write-Host "  $($Paths.Storage)\p0.log"
        Get-ChildItem -LiteralPath (Split-Path -Parent $Paths.Storage) -Recurse -Filter '*.log' -ErrorAction SilentlyContinue |
            Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize
        exit 1
    }

    Write-Host "==> $log"
    if ($Wait) { Get-Content -LiteralPath $log -Tail $Lines -Wait } else { Get-Content -LiteralPath $log -Tail $Lines }
}

function Restart-WindhawkUi {
    # -Cdp must restart the tray too: windhawk.exe launches the UI and passes
    # WINDHAWK_UI_WEBVIEW2_ARGS on to it.
    $names = if ($Cdp) { @('windhawk-ui', 'windhawk') } else { @('windhawk-ui') }
    if ($Cdp) {
        $env:WINDHAWK_UI_WEBVIEW2_ARGS = '--remote-debugging-port=9222 --remote-allow-origins=*'
    }

    Get-Process -Name $names -ErrorAction SilentlyContinue |
        Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 800
    Start-Process -FilePath $Paths.App
    Start-Sleep -Seconds $(if ($Cdp) { 8 } else { 6 })

    Get-Process -Name 'windhawk', 'windhawk-ui' -ErrorAction SilentlyContinue |
        Select-Object Id, ProcessName, StartTime | Format-Table -AutoSize

    if ($Cdp) {
        try {
            $list = (Invoke-WebRequest 'http://127.0.0.1:9222/json/list' -UseBasicParsing -TimeoutSec 5).Content
            Write-Host 'CDP OK:'
            Write-Host $list
        } catch {
            Write-Host "CDP not reachable: $($_.Exception.Message)"
        }
    }
}

# ---------------------------------------------------------------------------
# Subcommands
# ---------------------------------------------------------------------------

switch ($Command) {
    'install' {
        $path = if ($Source) { $Source } else { $Paths.Source }
        if (-not (Test-Path -LiteralPath $path)) { throw "mod source not found: $path" }
        # A portable app root is writable by the current user, so the isolated
        # verification build does not need elevation.
        if (-not $AppRoot) { Assert-Elevated 'install' }

        $cliArgs = @()
        if ($AppRoot) { $cliArgs += @('--app-root', (Resolve-Path -LiteralPath $AppRoot).Path) }
        $cliArgs += @('mod', 'install', '--file', (Resolve-Path -LiteralPath $path).Path)
        if ($Disabled) { $cliArgs += '--disabled' }

        Write-Host "==> $($Paths.Cli) $($cliArgs -join ' ')"
        & $Paths.Cli @cliArgs
        if ($LASTEXITCODE -ne 0) { throw "install failed (exit $LASTEXITCODE)" }

        if (-not $Restart) {
            Write-Host '==> installed; run scripts/dev.ps1 restart to load it'
            return
        }
        # The WebView2 environment is created once per UI process, so the mod
        # only takes effect in a freshly started windhawk-ui.exe.
        Restart-WindhawkUi
    }

    'restart' {
        if ((Test-Elevated) -and -not $Cdp) {
            Write-Warning 'restarting from an elevated shell has been unreliable; prefer a normal shell.'
        }
        Restart-WindhawkUi
    }

    'log' {
        Show-ModLog -Lines $Tail -Wait:$Follow
    }

    'trace' {
        Assert-Elevated 'trace'
        & $Paths.Cli mod settings set $Paths.ModId debug=1 | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "setting debug=1 failed (exit $LASTEXITCODE)" }
        Write-Host '==> debug=1 set'
        Restart-WindhawkUi
        Start-Process "windhawk://mods/$Mod"
        Start-Sleep -Seconds $WaitSeconds
        Show-ModLog -Lines 120
    }

    'debug' {
        $value = switch ($Argument) {
            'on' { '1' }
            'off' { '0' }
            default { throw "debug needs 'on' or 'off', got '$Argument'" }
        }
        Assert-Elevated 'debug'
        & $Paths.Cli mod settings set $Paths.ModId "debug=$value" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "setting debug=$value failed (exit $LASTEXITCODE)" }
        Write-Host "==> debug=$value set; the mod pushes it to the running page"
    }
}
