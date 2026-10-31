# Implementation plan

Status: P0, P1, P2, P4 and P5 complete; P3 is dropped (the Google provider is
not implemented and not planned); P6 optional. This document is the agreed
scope — update it when decisions change.

## Problem

Windhawk 2.0's UI text is localized (`zh-CN` included), but mod-authored
content is not. Mod names and summaries only have the `@name:zh-CN` /
`$description:zh-CN` / `$options:zh-CN` metadata channel, and READMEs and
changelogs have no language dimension at all: every mod is read in English.

## Target

Windhawk 2.0.0-alpha.8. Its UI is `windhawk-ui.exe`: a Tauri 3 (alpha) shell
around WebView2, with a React 19 + antd 6 front end compiled into the exe
(brotli). `windhawk.exe` is only the tray/launcher and hosts no webview.

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
  saver thread: debounced cache persistence (the UI thread never serializes it)
```

* The page cannot reach translation APIs — its CSP `connect-src` blocks them —
  so every HTTP request is made by the mod (WinHTTP) on the page's behalf.
  The API key therefore never reaches JavaScript.
* The C++/JS protocol is plain-text framing: fields separated by `\x1f`,
  carried over `PostWebMessageAsString` / `TryGetWebMessageAsString`. The mod
  parses no JSON; request bodies, prompts and response parsing all live in
  JavaScript.
* Fail-soft everywhere: a hook that does not match the expected shape logs and
  does nothing. Safe mode and `windhawk-cli mod disable` are the documented
  recovery paths.

## Interaction

* There is no display-mode switch: the page always shows the translation in
  place (the earlier replace/bilingual selector was dropped). The original is
  one hover or tap away.
* Desktop: rest the pointer on a translated block to see the original; leaving
  restores the translation.
* Touch: a tap shows the original for that block, a second tap restores the
  translation. Tapping twice with two fingers toggles translation itself, like
  `shortcutToggle`; `gestureToggle` disables the gesture.
* Covered surfaces, each with its own switch (`scopeReadme`, `scopeSettings`,
  `scopeModName`, `scopeModSummary`, `scopeChangelog`): README and changelogs
  on the details page; setting titles, descriptions, tooltips, dropdown
  values/options and reset labels on the settings page; mod names and one-line
  summaries in the tile grid, the table view and the details header. The Source
  tab (a CodeMirror virtualized view) and Windhawk's own interface strings are
  not translated.
* Implementation, chosen so React re-renders cannot throw:
  * prose blocks (README/changelog markdown) get `data-wh-orig="1"` plus a
    hidden CSS rule, and a translated clone is inserted in their place; React
    keeps its own nodes;
  * compact/interactive hosts (setting titles, descriptions, options, mod
    names and summaries) use text-node value swapping, keeping every node in
    the DOM;
  * a `MutationObserver` re-applies both after React reconciles.
* No floating button. Errors go to the mod log (`Wh_Log`). In-app notification
  is not implemented: it would require fabricating an IPC reply and corrupting
  request correlation.

## Translation engine (JavaScript)

* Scanning is restricted to known content containers, with a generic fallback
  for English block hosts and a deny list (code, editors, our own nodes, URLs,
  identifiers, versions, numbers, and text that already contains CJK when the
  target language is itself CJK).
* Inline markup is protected with the placeholder scheme ported from
  kiss-translator.
* Batching: ≤20 segments / ≤10000 chars / 400 ms window, concurrency 4–6,
  retry 2× with backoff on 429/5xx.
* Default target language follows the app: `document.documentElement.lang`,
  falling back to `navigator.language` (the Windows display language).
* Cache: the mod owns the store, not the page (the page's origin storage is
  not used). An in-memory map under `Wh_GetModStoragePath()` is persisted by a
  single saver thread with a 2 s debounce; entries expire after
  `cacheTtlDays` and the store is capped at 8 MB, oldest entries evicted first
  only while over the cap. The key includes provider and model (v4 prefix),
  the target language and a text hash; any non-empty key and value is accepted,
  so an LLM→Edge fallback result can be stored.

## Providers

The `provider` setting resolves as follows:

* `edge` — Microsoft's free endpoint; never the LLM.
* `google` — not implemented and not planned. The value is still accepted by
  the setting for compatibility; it resolves to Edge with one log line.
* `llm` — the OpenAI-compatible endpoint. A missing key is not a reason to
  switch: the request goes out without `Authorization` and the endpoint
  decides.
* `auto` — the LLM only when a key is configured and `llmBaseUrl` is set
  (`llmModel` is optional: the endpoint's default applies); otherwise Edge.
  "A key is configured" means
  `llmKeySource` is `credential` (a credential was actually read) or `setting`
  (the plaintext field is non-empty). A missing credential with an empty
  plaintext field reports `none`, so `auto` stays on Edge.

### LLM request shape

One chat-completions request per batch:

```
POST <llmBaseUrl>/chat/completions
Content-Type: application/json
Authorization: Bearer <key>        <- added by the mod, never by the page

{"model": "<llmModel>", "temperature": 0, "messages": [
  {"role": "system", "content": "<prompt>"},
  {"role": "user", "content": "{\"targetLanguage\":\"<tag>\",\"segments\":[{\"id\":1,\"text\":\"...\"}],\"glossary\":{\"source\":\"target\"}}"}
]}
```

* The user message is the batch as a JSON string; `glossary` is present only
  when the setting has entries.
* The prompt asks for one raw JSON object
  `{"translations":[{"id": 1, "text": "..."}]}`. Ids are 1-based positions in
  `segments`; the reply may be fenced or wrapped in prose, so the page takes
  the first `{` through the last `}`.
* At most 12 segments / 6000 characters per request, one retry on
  timeout/429/5xx; a failed LLM session falls back to Edge until the page
  reloads.

## Secrets

The LLM key is read in C++ from Windows Credential Manager (`CredReadW`,
generic credential target named in the settings) with a plaintext settings
field as fallback. Write the credential with
`cmdkey /generic:<target> /user:translator /pass:<key>`; the mod reads it at
start and whenever the settings change. A missing credential logs one line
with the target name and the Win32 error, then falls back to the plaintext
setting if it has a value; `llmKeySource` reports `credential` only when a key
was actually read, `setting` when the plaintext field supplies it, `none`
otherwise. The `Authorization` header is added only for requests whose host
equals `llmBaseUrl`'s host (case-insensitive; port and path ignored, so
`<llmBaseUrl>/chat/completions` matches) and never for `edge.microsoft.com` or
`translate.googleapis.com`. The key is never logged and never sent to the
page.

## Phases

| Phase | Scope | Done when |
| --- | --- | --- |
| P0 ✅ | hook chain, script injection, message bridge, logging | log shows hook + injection + `p0:ack` round trip |
| P1 ✅ | bridge, settings, one provider (Edge) | hovering a block on the details page yields Chinese |
| P2 ✅ | scanner coverage (README, settings, mod names, summaries, changelog) and the OpenAI-compatible LLM provider: chat completions, glossary, credential-backed key injection | all five surfaces covered, code blocks untouched; LLM translations work with a configured key |
| P3 ❌ | Google provider | dropped; `google` resolves to Edge with one log line |
| P4 ✅ | interaction: in-place swap, hover-revert, tap toggle, two-finger double tap, shortcut | implemented; no React errors seen when switching tabs or mods |
| P5 ✅ | unload safety, long documents, docs, screenshots, release checklist | safe mode recovers; docs complete |
| P6 (optional) | source-tab comments (CodeMirror decorations) | — |

## Development loop

`scripts/dev.ps1` is the only script: `install` (administrator; compiles with
`windhawk-cli mod install --file` and does not restart), `restart` and `log`
(no elevation), `debug on|off` and `trace` (administrator, because mod
settings live in HKLM). `install -AppRoot <dir>` compiles into a portable app
root instead of the real installation. README.md has the command table.

## Risks

1. `CreateWebViewEnvironmentWithOptionsInternal` is a private export; an
   Evergreen WebView2 update can change it. Mitigation: validate the module
   and vtable slot addresses at runtime, log the WebView2 version, fail soft.
2. A crash in `windhawk-ui.exe` locks the user out of the UI that disables the
   mod. Mitigation: safe mode, CLI disable, fail-soft defaults.
3. COM lifetime/threading mistakes. Mitigation: all WebView2 calls on the UI
   thread, strict reference counting, a single `Init → Running → Stopping →
   Stopped` lifecycle, and a teardown that waits for every callback object
   handed to WebView2 to reach its final Release.
4. React reconciliation undoing the swap. Mitigation: never move React nodes;
   re-apply from a MutationObserver.
5. Privacy: page text leaves the machine. Mitigation: README disclosure,
   per-surface toggles, no telemetry.

## Unload policy

Unload happens only after WebView2 has released everything it was given.

`Wh_ModBeforeUninit` runs on Windhawk's engine thread. It stops the HTTP workers
and the cache saver (both joined with `INFINITE`), posts a teardown request to
the message-only window on the WebView2 UI thread, and waits on an event. The
handler runs on the UI thread: it tells the page to restore its text, removes
the document-created script, removes the event handlers, restores the
environment vtable and releases the webview reference. The event is signalled
only after that cleanup completed and the two outstanding counters — wrappers
handed to WebView2 and held `AddScript` references — both reached zero on the
UI thread. The UI thread keeps running Tauri's own message loop while the
engine thread waits, so the completions arrive without a nested message pump.
A final blocking `SendMessageW` destroys the dispatch window and unregisters its
class; it returns after the UI thread came back through its own message loop,
and the module's entry points never pump messages, so it cannot be inside one
when that happens. A cleanup step that fails is not treated as success: the
unload does not return rather than unload code that may still be reachable.

There is no deadline and no self-pin: the mod never takes a loader reference to
keep itself resident. A completion that never fires, or a release on a thread
other than the UI thread, leaves the unload waiting instead of leaving code
pointers into an unmapped image.

