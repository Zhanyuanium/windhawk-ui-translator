# P0 findings (runtime-verified)

Environment: Windhawk 2.0.0-alpha.8, WebView2 runtime 156.0.4314.50, Windows 11.
Everything below was observed on this machine, not inferred from documentation.

This is a historical record of the injection proof. The file logger and the
`p0:` probe protocol mentioned below were removed later; the evidence was
captured through `Wh_Log` (and its then-current file mirror) at the time. The
vtable slot numbers and the behaviour notes still apply.

## What works

| Step | Evidence (log excerpt) |
| --- | --- |
| Mod loads into `windhawk-ui.exe` | `mod init: pid=… exe=C:\Program Files\Windhawk\windhawk-ui.exe` |
| `GetProcAddress` hook installed | `hook GetProcAddress installed` |
| Shim reached | `CreateEnvShim: fromClientDll=… runtimeType=…` |
| Environment vtable patched | `env patched (slot3=… valid=1, slot21=… valid=1)` |
| Controller intercepted | `env->CreateCoreWebView2ControllerWithOptions(...)` then `controller Invoke hr=0` |
| `CoreWebView2` obtained | `controller=… CoreWebView2=…` |
| Web messages already enabled | `webMessageEnabled(before)=1` |
| Script registered | `AddScript hr=0 id=2` |
| Message channel registered | `add_WebMessageReceived hr=0 token=20` |
| JS → mod | `msg received: p0:hello:about:blank|||complete|immediate` |
| mod → JS | `ack posted hr=0` |
| App page reached | `navstarting uri=http://tauri.localhost/`, `navcompleted … success=1` |

The page keeps rendering normally with the hooks in place, and the mod runs in the
UI process without touching `msedgewebview2.exe`.

## Corrections to the original design notes

1. **Vtable indices were off by one.** The numbers in the first design brief were
   1-based field ordinals. The real 0-based indices, read from `WebView2.h`
   (Microsoft.Web.WebView2 1.0.3719.77 and 1.0.992.28), are:
   `ICoreWebView2`: `get_Settings` 3, `add_NavigationStarting` 7,
   `remove_NavigationStarting` 8, `add_NavigationCompleted` 15,
   `remove_NavigationCompleted` 16, `AddScriptToExecuteOnDocumentCreated` 27,
   `ExecuteScript` 29, `PostWebMessageAsString` 33, `add_WebMessageReceived` 34,
   `remove_WebMessageReceived` 35.
   `ICoreWebView2Controller::get_CoreWebView2` = 25.
   `ICoreWebView2Settings`: `get_IsWebMessageEnabled` 5, `put_…` 6.
   `ICoreWebView2WebMessageReceivedEventArgs::TryGetWebMessageAsString` = 5.
   `ICoreWebView2NavigationStartingEventArgs::get_Uri` = 3.
2. **`AddScriptToExecuteOnDocumentCreated` loses the first race.** Its completion
   (the script id) arrives after wry has already started navigating, so the first
   real document does not run the script. A `NavigationCompleted` handler that runs
   `ExecuteScript` fills the gap; the script must be idempotent.
3. **`window.chrome.webview` is not available when the document-created script
   runs** in this app. A bootstrap that sets its "already initialised" marker
   before checking the channel silently disables every later injection. Set the
   marker only after the channel exists, and retry briefly.
4. **Two `windhawk-ui.exe` processes exist** (the Tauri UI plus a helper). Only one
   of them loads `EmbeddedBrowserWebView.dll`; the other runs the mod but never
   sees a WebView2 environment. Per-process logging (pid in every line) is
   therefore mandatory.
5. **Restarting from an elevated shell is unreliable.** Install needs elevation
   (Program Files / ProgramData), restarting the UI does not. Do them from
   different shells.

## Installed layout produced by `windhawk-cli mod install --file`

* Mod id becomes `local@windhawk-ui-translator`.
* DLL: `C:\ProgramData\Windhawk\Engine\Mods\64\local@windhawk-ui-translator_<version>_<id>.dll`
* Source copy: `C:\ProgramData\Windhawk\ModsSource\local@windhawk-ui-translator.wh.cpp`
* Mod storage (`Wh_GetModStoragePath`):
  `C:\ProgramData\Windhawk\Engine\ModsWritable\mod-storage\local@windhawk-ui-translator\`
* Settings are plain text in `HKLM\SOFTWARE\Windhawk\Engine\Mods\<mod id>`.
