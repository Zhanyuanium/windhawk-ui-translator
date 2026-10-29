# Windhawk UI Translator

> **Status: pre-alpha.** Only the injection proof (P0) exists. Nothing is translated yet
> and the mod is not installable for end users.

A Windhawk mod that translates Windhawk's *mod content* in place: mod descriptions and
READMEs, settings labels and descriptions, list summaries, and changelogs.

Windhawk 2.0 already localizes its own interface, but content written by mod authors has
only a narrow localization path (`@name:zh-CN`, `$description:zh-CN`, `$options:zh-CN`);
READMEs and changelogs have none. This mod fills that gap for the Tauri-based Windhawk 2.0
UI (`windhawk-ui.exe`, WebView2), which previous community tools do not support — they all
patch the VSCodium-based Windhawk 1.x webview files on disk.

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

* Translations replace the original text in place.
* Pointer over a block shows the original; moving away restores the translation.
* On a touch screen, tap shows the original and tapping again restores the translation.
* Default target language follows Windhawk's UI language, then the Windows display
  language.
* Providers: any OpenAI-compatible endpoint, with free Microsoft Edge and Google endpoints
  as fallbacks.

## Privacy

Translated text is sent to the provider you configure. No telemetry, no analytics, no
network access other than the configured translation provider. The LLM key is read from
Windows Credential Manager when available and is never logged.

## Build

```powershell
# compile and install locally (installs disabled)
& "C:\Program Files\Windhawk\windhawk-cli.exe" mod install --file "mods\windhawk-ui-translator.wh.cpp" --disabled
```

The mod must be enabled while Windhawk's UI is not running, or Windhawk restarted
afterwards, because the WebView2 environment already exists in a running UI process.

Recovery if the UI fails to start: `windhawk.exe -safe-mode`, or
`windhawk-cli.exe mod disable windhawk-ui-translator`. Setting the environment variable
`WH_TRANSLATOR_DISABLE=1` also disables the mod without touching its configuration.

## License

GPL-3.0. The in-page engine derives in part from
[kiss-translator](https://github.com/fishjar/kiss-translator) (GPL-3.0); see
[NOTICE](NOTICE).
