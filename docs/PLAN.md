# Implementation plan

Status: P0–P2 complete; P3 partially done (batching and the cache are in, the LLM and
Google providers are not). This document is the agreed scope; update it when decisions
change.

## Problem

Windhawk 2.0 UI text is localized (`zh-CN` included), but mod-authored content is not:
mod names/summaries only support the `@name:zh-CN` / `$options:zh-CN` metadata path, and
READMEs and changelogs have no language dimension at all. Every mod is read in English.

## Target

Windhawk 2.0.0-alpha.8, whose UI is `windhawk-ui.exe`: a Tauri 3 (alpha) shell around
WebView2, front end built from React 19 + antd 6 and compiled into the exe (brotli).
`windhawk.exe` is only the tray/launcher and hosts no webview.

## Verified facts the design depends on

| Fact | How it was established |
| --- | --- |
| UI process is `windhawk-ui.exe`; `windhawk.dll` (mod host) is already loaded there | local process tree + module list |
| Tauri links `WebView2LoaderStatic.lib`, so `CreateCoreWebView2EnvironmentWithOptions` is neither import nor export | PE import/export dump of the installed binaries |
| `EmbeddedBrowserWebView.dll` exports `CreateWebViewEnvironmentWithOptionsInternal` and the static loader resolves it with `GetProcAddress` | `objdump -p` on the installed WebView2 runtime |
| Page CSP is `default-src 'none'; connect-src 'self' ipc: http://ipc.localhost https://mods.windhawk.net …` | installed `tauri.conf.json` |
| Page origin is `http://tauri.localhost`; all host data arrives through `window.postMessage` envelopes `{type, command, data, messageId}` | front-end sources `tauriApi.ts` / `webviewIPC.ts` |
| Mod content surface: `[data-testid="mod-details"]`, `.windhawk-row-meta-title`, `.windhawk-row-meta-description`, `.ant-card-meta-title`, `.ant-card-meta-description`, `.ant-typography`, `[data-testid="installed-mods-table"]`, `[data-testid="mod-setting-description-text"]`, `.ant-select-item-option-content` | front-end sources |

## Architecture

```
windhawk-ui.exe (Tauri/wry, STA UI thread)
  GetProcAddress("CreateWebViewEnvironmentWithOptionsInternal")   <- hooked
    +- wrap the environment-completed handler
         +- environment vtable [3] / [21] wrapped (controller creation)
              +- controller-completed handler -> get_CoreWebView2
                   +- AddScriptToExecuteOnDocumentCreated(engine.js)
                   +- add_WebMessageReceived(bridge)
  settings (Wh_GetStringSetting) + Wh_ModSettingsChanged
  worker threads: WinHTTP requests; results marshalled back with PostMessage
```

* The page cannot reach translation APIs: CSP `connect-src` blocks them. All HTTP happens
  in the mod (WinHTTP), so the API key never reaches JavaScript.
* The C++/JS protocol is a plain-text, `\x1f`-separated framing carried over
  `PostWebMessageAsString` / `TryGetWebMessageAsString`. The mod needs no JSON parser;
  request bodies, prompts, and response parsing live in JavaScript.
* Fail-soft everywhere: a hook that does not match the expected shape logs and does
  nothing. `WH_TRANSLATOR_DISABLE=1` short-circuits the mod; safe mode and
  `windhawk-cli mod disable` are documented recovery paths.

## Interaction

* **There is no display-mode switch.** The page always shows the translation in place; the
  earlier idea of a replace/bilingual mode selector was dropped. Original text is one
  hover or tap away.
* Desktop: pointer over a translated block shows the original; leaving restores the
  translation.
* Touch: a tap toggles the original for that block. Tapping twice with two fingers toggles
  translation itself on or off, like `shortcutToggle`; `gestureToggle` disables the
  gesture.
* Covered surfaces, each with its own switch (`scopeReadme`, `scopeSettings`, `scopeModName`,
  `scopeModSummary`, `scopeChangelog`): README/description and changelogs on the details
  page, settings (names, descriptions, option labels, nested list items), and mod names
  plus one-line summaries in the tile grid, the table view and the details header.
* Implementation, chosen so React re-renders cannot throw:
  * prose blocks (README/changelog markdown) get `data-wh-orig="1"` plus a hidden CSS
    rule, and a translated clone is inserted in their place; React keeps its own nodes.
  * compact/interactive hosts (setting titles, descriptions, options, mod names and
    summaries) use text-node value swapping, keeping every node in the DOM.
  * a `MutationObserver` re-applies both after React reconciles.
* No floating button. Errors go to the mod log (`Wh_Log`). In-app notification is not
  implemented: it would require fabricating an IPC reply and corrupting request
  correlation.

## Translation engine (JavaScript)

* Scanning is restricted to known content containers, with a generic fallback for
  English block hosts and a deny list (code, editors, our own nodes, URLs, identifiers,
  versions, numbers, text that already contains CJK).
* Inline markup is protected with the placeholder scheme ported from kiss-translator.
* Batching: ≤20 segments / ≤10000 chars / 400 ms window, concurrency 4–6, retry 2× with
  backoff on 429/5xx.
* Providers: only the Microsoft Edge free endpoint is implemented; `auto` resolves to it.
  OpenAI-compatible chat completions (JSON batch protocol, glossary) and Google
  `translateHtml` / `gtx` are still P3 work.
* Default target language follows the app: `document.documentElement.lang`, falling back
  to `navigator.language` (the Windows display language).
* Cache: `localStorage` (`http://tauri.localhost` is a secure context), key
  `provider|lang|sha1(text)`, 30-day TTL, LRU trim at 3 MB.

## Secrets

The LLM key is read in C++ from Windows Credential Manager (`CredReadW`, generic
credential target named in the settings) with a plaintext settings field as fallback.
Write the credential with `cmdkey /generic:<target> /user:translator /pass:<key>`; the mod
reads it at start and whenever the settings change. The key is never logged and never sent
to the page.

## Phases

| Phase | Scope | Done when |
| --- | --- | --- |
| P0 ✅ | hook chain, script injection, message bridge, logging | log shows hook + injection + `p0:ack` round trip |
| P1 ✅ | bridge, settings, one provider (Edge) | hovering a block on the details page yields Chinese |
| P2 ✅ | scanner coverage: README, settings, mod names, summaries, changelog | all five surfaces covered, code blocks untouched |
| P3 🚧 | LLM and Google providers, glossary | batching and the cache are done; the LLM and Google backends are still idle |
| P4 ✅ | interaction: in-place swap, hover-revert, tap toggle, two-finger double tap, shortcut | implemented; no React errors seen when switching tabs or mods |
| P5 🚧 | unload safety, long documents, docs, build script | safe mode recovers; docs complete |
| P6 (optional) | source-tab comments (CodeMirror decorations) | — |

## Development loop

`scripts/dev.ps1` is the only script: `install` (administrator; compiles with
`windhawk-cli mod install --file` and does not restart), `restart` (no elevation), `log`
(no elevation), `debug on|off` and `trace` (administrator, because mod settings live in
HKLM). `install -AppRoot <dir>` compiles into a portable app root instead of the real
installation. README.md has the command table.

## Risks

1. `CreateWebViewEnvironmentWithOptionsInternal` is a private export; an Evergreen
   WebView2 update can change it. Mitigation: validate the module and vtable slot
   addresses at runtime, log the WebView2 version, fail soft.
2. A crash in `windhawk-ui.exe` locks the user out of the UI that disables the mod.
   Mitigation: kill switch, safe mode, CLI, fail-soft defaults.
3. COM lifetime/threading mistakes. Mitigation: all WebView2 calls on the UI thread,
   strict reference counting, cleanup in `Wh_ModBeforeUninit`.
4. React reconciliation undoing the swap. Mitigation: never move React nodes; re-apply
   from a MutationObserver.
5. Privacy: page text leaves the machine. Mitigation: README disclosure, per-surface
   toggles, no telemetry.
