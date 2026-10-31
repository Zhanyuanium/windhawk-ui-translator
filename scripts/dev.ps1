#Requires -Version 7.0
<#
.SYNOPSIS
Development helper for the Windhawk UI Translator mod.

.DESCRIPTION
One entry point for the local development loop: compile and install the mod,
restart Windhawk's UI, and watch Wh_Log output.

The mod logs through Wh_Log only; there is no file log. `log` starts
scripts/dbwin-log.ps1, which captures OutputDebugString from the UI process.
Only one DBWIN listener can exist at a time: close DebugView or any attached
debugger first.

Subcommands and elevation:

  install   Compile mods\windhawk-ui-translator.wh.cpp and install it with
            windhawk-cli. Needs an elevated shell (Windhawk lives in
            Program Files and compiles into ProgramData), unless -AppRoot
            points at a writable portable app root. Does NOT restart Windhawk.
  restart   Kill windhawk-ui.exe and start windhawk.exe again so a freshly
            installed mod is loaded. Does NOT need elevation; run it from a
            normal shell.
  log       Capture OutputDebugString from windhawk-ui.exe. Does NOT need
            elevation.

.PARAMETER Command
install | restart | log

.PARAMETER Source
install: mod source file, defaults to the repository copy.

.PARAMETER Disabled
install: install in disabled state.

.PARAMETER Restart
install: restart Windhawk after a successful install (off by default).

.PARAMETER Cdp
restart: also expose the WebView2 DevTools port (DOM inspection).

.PARAMETER AppRoot
install: portable Windhawk app root (the directory holding windhawk.ini).

.PARAMETER Seconds
log: stop after this many seconds; 0 runs until Ctrl+C.

.PARAMETER ShowPid
log: prefix every line with the source process id.

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
pwsh -NoProfile -File scripts/dev.ps1 log
Watch Wh_Log output until Ctrl+C.
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('install', 'restart', 'log')]
    [string]$Command,

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

    # log: stop after this many seconds; 0 runs until Ctrl+C.
    [int]$Seconds = 0,

    # log: prefix every line with the source process id.
    [switch]$ShowPid
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
    Cli    = 'C:\Program Files\Windhawk\windhawk-cli.exe'
    App    = 'C:\Program Files\Windhawk\windhawk.exe'
    ModId  = 'local@windhawk-ui-translator'
    Source = Join-Path $PSScriptRoot '..\mods\windhawk-ui-translator.wh.cpp'
    Dbwin  = Join-Path $PSScriptRoot 'dbwin-log.ps1'
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
        if (-not (Test-Path -LiteralPath $Paths.Dbwin)) { throw "dbwin-log.ps1 not found: $($Paths.Dbwin)" }
        $dbwinArgs = @('-ProcessName', 'windhawk-ui', '-Seconds', $Seconds)
        if ($ShowPid) { $dbwinArgs += '-ShowPid' }
        & $Paths.Dbwin @dbwinArgs
    }
}
