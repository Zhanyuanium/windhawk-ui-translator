# Windhawk UI Translator

> **Status: working prototype.** Translation works on the mod details page, in the
> settings panel and in the mod list. The mod is not published yet.

A Windhawk mod that translates Windhawk's *mod content* in place: mod descriptions and
READMEs, settings names and descriptions, mod names and one-line summaries, and
changelogs.

Windhawk 2.0 already localizes its own interface, but content written by mod authors has
only a narrow localization path (`@name:zh-CN`, `$description:zh-CN`, `$options:zh-CN`);
READMEs and changelogs have none. This mod fills that gap for the Tauri-based Windhawk 2.0
UI (`windhawk-ui.exe`, WebView2), which previous community tools do not support — they all
patch the VSCodium-based Windhawk 1.x webview files on disk.

## What gets translated

Every surface has its own switch in the mod settings, all on by default:

| Setting | Surface |
| --- | --- |
| `scopeReadme` | The mod's README/description on the details page |
| `scopeSettings` | Setting names, descriptions, option labels and nested list items |
| `scopeModName` | Mod names in the tile grid, the table view and the details header |
| `scopeModSummary` | The one-line mod summaries in the tile grid, the table view and the details header |
| `scopeChangelog` | Changelog sections on the details page |

Code blocks, editors, search inputs, URLs, identifiers, versions and text that is already
in the target script are left alone.

## How it works

The mod is injected into `windhawk-ui.exe`, hooks `GetProcAddress` for the WebView2
internal entry point that the statically linked loader resolves, wraps the environment and
controller completion handlers, and finally calls
`AddScriptToExecuteOnDocumentCreated` to install a translation engine before the app's own
scripts run. Requests are relayed to the mod over the WebView2 web-message channel, so all
network access happens in C++ — the page's CSP forbids cross-origin `fetch`, and the API
key never reaches the page.

See [docs/PLAN.md](docs/PLAN.md) for the verified technical facts, architecture, and
phases.

## Behaviour

* Translations replace the original text in place. There is no display-mode switch: the
  page always shows the translation, and the original stays one hover or tap away.
* Desktop: resting the pointer on a translated block shows the original after
  `hoverDelayMs`; moving away restores the translation.
* Touch: a tap toggles the original for that block. Tapping twice with two fingers turns
  translation itself on or off, like the shortcut; `gestureToggle` disables the gesture.
* `Alt+Q` toggles translation; the shortcut is configurable and an empty value disables it.
* Default target language follows Windhawk's UI language, then the Windows display
  language.
* The translation backend implemented today is Microsoft's free Edge endpoint
  (`provider: edge`, and `auto` currently resolves to it). The OpenAI-compatible and
  Google options exist in the settings but are not implemented yet.
* Results are cached in `localStorage` for `cacheTtlDays`; `clearCache` clears the cache
  once on the next start.

## Privacy

Translated text is sent to the provider you configure. No telemetry, no analytics, no
network access other than the configured translation provider. The LLM key is read from
Windows Credential Manager when available and is never logged.

## Development

`scripts/dev.ps1` is the only script; it keeps every path (Windhawk install, mod source,
mod id, log directory) in one place.

| Command | What it does | Elevation |
| --- | --- | --- |
| `pwsh -NoProfile -File scripts/dev.ps1 install [-Disabled]` | Compiles `mods\windhawk-ui-translator.wh.cpp` with `windhawk-cli mod install --file` and installs it; does not restart | administrator (none with `-AppRoot`) |
| `pwsh -NoProfile -File scripts/dev.ps1 restart` | Restarts `windhawk-ui.exe` so the installed mod is loaded | none |
| `pwsh -NoProfile -File scripts/dev.ps1 log -Tail 40 [-Follow]` | Prints (or follows) the mod's own `p0.log` | none |
| `pwsh -NoProfile -File scripts/dev.ps1 debug on\|off` | Sets the `debug` setting; the mod pushes it to the running page | administrator |
| `pwsh -NoProfile -File scripts/dev.ps1 trace [-Mod <id>]` | `debug on`, restart, open that mod's page, dump the log | administrator |

`restart -Cdp` also opens the WebView2 DevTools port (9222) for DOM inspection.

To compile without touching the real Windhawk installation, install into an isolated
portable app root — a directory that contains `windhawk.ini`:

```powershell
pwsh -NoProfile -File scripts/dev.ps1 install -AppRoot "$env:TEMP\wh-portable" -Disabled
```

The mod only takes effect in a freshly started UI process, because the WebView2
environment already exists in a running one.

Recovery if the UI fails to start: `windhawk.exe -safe-mode`, or
`windhawk-cli.exe mod disable windhawk-ui-translator`. Setting the environment variable
`WH_TRANSLATOR_DISABLE=1` also disables the mod without touching its configuration.

## License

GPL-3.0. The in-page engine derives in part from
[kiss-translator](https://github.com/fishjar/kiss-translator) (GPL-3.0); see
[NOTICE](NOTICE).
