# Windhawk UI Translator

A Windhawk mod that translates the content other mods write — mod names,
one-line summaries, READMEs, changelogs, and everything on a mod's settings
page — in place, inside the Windhawk 2.0 window.

Windhawk 2.0 localizes its own interface, but not what mod authors write.
Names and summaries only have the narrow `@name:zh-CN` /
`$description:zh-CN` / `$options:zh-CN` metadata channel, and READMEs and
changelogs have no localization mechanism at all. This mod fills that gap.
The existing community tools patch Windhawk 1.x (VSCodium/Electron) files on
disk and cannot reach the Tauri-based 2.0 UI (`windhawk-ui.exe`, WebView2), so
this one works from inside the UI process instead.

![Details page with a translated README](docs/images/details.png)

## What gets translated

| Where | What | Scope switch |
| --- | --- | --- |
| Details page | README, changelog | `scopeReadme`, `scopeChangelog` |
| Details page, explore grid, installed table | mod name and one-line summary | `scopeModName`, `scopeModSummary` |
| Settings page | titles, descriptions, tooltips, dropdown values and options, reset labels | `scopeSettings` |
| Update dialog | mod names, and the changelog of each offered update | `scopeModName`, `scopeChangelog` |

The settings page is the densest surface — it works in both densities:

![Settings page, comfortable density](docs/images/settings-comfortable.png)

![Settings page, compact density](docs/images/settings-compact.png)

![Explore tiles](docs/images/explore.png)

Two things are deliberately left alone: the Source tab (a CodeMirror
virtualized view) and Windhawk's own interface strings, which are already
localized by Windhawk itself.

## Behaviour

* The translation replaces the original text in place; nothing is added to
  the layout.
* Rest the pointer on a translated block to see the original; move away to
  get the translation back. On a touch screen, tap once for the original and
  tap again for the translation.
* `Alt+Q` toggles translation on or off, as does a two-finger double-tap on
  touch screens. Both are configurable, and the toggle works in both
  directions.
* Translations are cached by the mod (not in the page's storage) for 30 days,
  capped at 8 MB with the oldest entries evicted first. The cache key includes
  the provider and model, so switching providers does not serve stale text.
* The default target language follows Windhawk's UI language, then the
  Windows display language.

## Providers and the API key

* **OpenAI-compatible LLM** — any `/chat/completions` endpoint. Batched JSON
  requests with a glossary and placeholder preservation. Recommended.
* **Microsoft Edge** — the free endpoint; no key needed, and the fallback
  whenever the LLM is unavailable.
* **Google** — not offered in the settings and **not implemented**; a configuration
  that still says `provider: google` falls back to Edge.
* `auto` prefers the LLM only when a key is configured; after one retry a
  failing LLM batch falls back to Edge for the rest of the session.

The page's CSP does not allow connections to translation APIs, so the page
sends every request through the mod over a plain-text web-message protocol;
the mod does the HTTP itself with WinHTTP. This is also what keeps the key
safe: the mod reads it from Windows Credential Manager (a plaintext setting
exists as fallback), and injects `Authorization` only for requests to the
configured `llmBaseUrl` host, only over HTTPS, and never for the free
endpoints. The key is never sent to the page and never logged.

```powershell
# store the key in Windows Credential Manager
cmdkey /generic:windhawk-ui-translator /user:translator /pass:<your key>
```

## Install

Requires Windhawk 2.0.0-alpha.8 (the Tauri UI). Enable the mod while the UI
is closed, or restart the UI process (`windhawk-ui.exe`) afterwards — in a
running UI process the WebView2 environment already exists, and the mod can
only hook its creation. Restarting only the Windhawk tray icon is not enough.

```powershell
# compile and install from the repository source
& "C:\Program Files\Windhawk\windhawk-cli.exe" mod install --file "mods\windhawk-ui-translator.wh.cpp"
```

If the UI fails to start afterwards:

```powershell
windhawk.exe -safe-mode
# or
& "C:\Program Files\Windhawk\windhawk-cli.exe" mod disable windhawk-ui-translator
```

## Development

```powershell
bun tools/build.ts          # inline src/js/engine.js into the mod source
bun tools/test.mjs          # jsdom suites (all checks must pass)
scripts\dev.ps1 install     # compile + install (admin, no restart)
scripts\dev.ps1 restart     # restart windhawk-ui.exe
scripts\dev.ps1 log -Seconds 60
```

`docs/PLAN.md` records the verified WebView2 facts the design depends on and
the injection chain, `docs/PROTOCOL.md` the page↔mod message protocol,
`docs/FINDINGS-p0.md` the runtime observations, and `docs/PUBLISHING.md` the
release checklist.

## Privacy

Translated text is sent to the provider you configure. No telemetry, no
analytics, no other network access. The API key is read from Windows Credential
Manager; the optional plaintext setting is the fallback and is stored in
Windhawk's own settings.

## License

GPL-3.0. The in-page engine derives in part from
[kiss-translator](https://github.com/fishjar/kiss-translator) (GPL-3.0); see
[NOTICE](NOTICE).
