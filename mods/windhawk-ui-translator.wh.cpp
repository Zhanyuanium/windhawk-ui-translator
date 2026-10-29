// ==WindhawkMod==
// @id              windhawk-ui-translator
// @name            Windhawk UI Translator
// @name:zh-CN      Windhawk 界面翻译
// @description     Translates Windhawk mod descriptions, settings and changelogs in place
// @description:zh-CN 就地翻译 Windhawk 的模组说明、设置项与更新日志
// @version         0.0.1
// @author          Zhanyuanium
// @github          https://github.com/Zhanyuanium/windhawk-ui-translator
// @include         windhawk-ui.exe
// @architecture    x86-64
// @compilerOptions -lole32 -luuid -ladvapi32 -lshell32 -lwinhttp -fms-extensions
// @license         GPL-3.0
// ==/WindhawkMod==

// ==WindhawkModSettings==
/*
- targetLang: auto
  $name: Target language
  $name:zh-CN: 目标语言
  $description: Language the mod content is translated into. "auto" follows the Windhawk UI language.
  $description:zh-CN: 把模组内容翻译成哪种语言。选“自动”时跟随 Windhawk 界面语言。
  $options:
  - auto: Automatic
  - zh-CN: Chinese (Simplified)
  - zh-TW: Chinese (Traditional)
  - ja: Japanese
  - ko: Korean
  - en: English
  - de: German
  - fr: French
  - ru: Russian
  - es: Spanish
  - pt-BR: Portuguese (Brazil)
  $options:zh-CN:
  - auto: 自动
  - zh-CN: 简体中文
  - zh-TW: 繁体中文
  - ja: 日语
  - ko: 韩语
  - en: 英语
  - de: 德语
  - fr: 法语
  - ru: 俄语
  - es: 西班牙语
  - pt-BR: 葡萄牙语（巴西）
- provider: auto
  $name: Translation provider
  $name:zh-CN: 翻译服务
  $description: Which translation backend the page uses. "auto" lets the page decide between the LLM and the free endpoints.
  $description:zh-CN: 页面使用哪种翻译后端。选“自动”时由页面在大模型与免费接口之间选择。
  $options:
  - auto: Automatic
  - edge: Microsoft Edge (free, no key)
  - google: Google Translate (free, no key)
  - llm: OpenAI-compatible LLM
  $options:zh-CN:
  - auto: 自动
  - edge: 微软 Edge（免费，无需密钥）
  - google: 谷歌翻译（免费，无需密钥）
  - llm: 兼容 OpenAI 的大模型
- llmBaseUrl: https://api.openai.com/v1
  $name: LLM base URL
  $name:zh-CN: 大模型 API 地址
  $description: OpenAI-compatible API base URL, for example https://api.openai.com/v1
  $description:zh-CN: 兼容 OpenAI 的接口根地址，例如 https://api.openai.com/v1
- llmModel: ""
  $name: LLM model
  $name:zh-CN: 模型名称
  $description: Model name sent to the LLM endpoint. Leave empty to use the provider default.
  $description:zh-CN: 发送给大模型接口的模型名称。留空则使用服务端默认模型。
- credentialTarget: windhawk-ui-translator
  $name: Credential target
  $name:zh-CN: 凭据名称
  $description: Windows Credential Manager target that holds the API key as a generic credential.
  $description:zh-CN: 在 Windows 凭据管理器中保存 API 密钥的凭据名称（普通凭据）。
- llmApiKey: ""
  $name: API key (plaintext fallback)
  $name:zh-CN: API 密钥（明文备用）
  $description: Used when the key source is "setting", and as the fallback when the credential is missing. It is stored as plain text in the registry, so prefer the credential source.
  $description:zh-CN: 在密钥来源为“设置项”时使用，凭据缺失时也会作为备用。密钥会以明文写入注册表，建议优先使用凭据管理器。
- llmKeySource: credential
  $name: API key source
  $name:zh-CN: 密钥来源
  $description: Where the LLM API key comes from. "credential" reads Windows Credential Manager, "setting" uses the field above, "none" sends requests without a key.
  $description:zh-CN: 大模型 API 密钥的来源。“凭据”从 Windows 凭据管理器读取，“设置项”使用上面的字段，“无”表示请求不带密钥。
  $options:
  - credential: Windows Credential Manager
  - setting: The API key setting above
  - none: No key
  $options:zh-CN:
  - credential: Windows 凭据管理器
  - setting: 上面的 API 密钥设置项
  - none: 不使用密钥
- glossary:
    - ""
  $name: Glossary
  $name:zh-CN: 术语表
  $description: "One entry per line, written as source=target. Sent with every LLM request and takes priority over the model's own wording. Ignored by the free providers."
  $description:zh-CN: 每行一条，写成“原文=译文”。随每个大模型请求一起发送，优先级高于模型自己的措辞。免费接口不使用本项。
- scopeReadme: true
  $name: Translate mod descriptions
  $name:zh-CN: 翻译模组说明
  $description: Translate README content on the mod details page.
  $description:zh-CN: 翻译模组详情页中的说明文档。
- scopeSettings: true
  $name: Translate mod settings
  $name:zh-CN: 翻译设置项
  $description: Translate setting names, descriptions and option labels.
  $description:zh-CN: 翻译设置项名称、说明与选项文字。
- scopeModName: true
  $name: Translate mod names
  $name:zh-CN: 翻译模组名称
  $description: "Translate mod names everywhere they appear: the tile grid, the table view and the details header."
  $description:zh-CN: 翻译所有出现模组名称的位置：磁贴视图、列表视图和详情页标题。
- scopeModSummary: true
  $name: Translate mod summaries
  $name:zh-CN: 翻译模组简介
  $description: "Translate the one-line mod summary everywhere it appears: the tile grid, the table view and the details header."
  $description:zh-CN: 翻译所有出现模组简介的位置：磁贴视图、列表视图和详情页标题。
- scopeChangelog: true
  $name: Translate changelogs
  $name:zh-CN: 翻译更新日志
  $description: Translate changelog sections on the mod details page.
  $description:zh-CN: 翻译模组详情页中的更新日志。
- hoverDelayMs: 120
  $name: Hover delay (milliseconds)
  $name:zh-CN: 悬停延迟（毫秒）
  $description: How long the pointer must rest on a translated block before the original text appears. 0 to 2000.
  $description:zh-CN: 鼠标在已翻译的文本块上停留多久后显示原文。可填 0 到 2000。
- shortcutToggle: "Alt+Q"
  $name: Toggle translation shortcut
  $name:zh-CN: 翻译开关快捷键
  $description: Keyboard shortcut that turns translation on or off. Leave empty to disable it.
  $description:zh-CN: 开、关翻译的快捷键。留空表示不启用。
- gestureToggle: true
  $name: Two-finger double-tap toggles translation
  $name:zh-CN: 双指双击开关翻译
  $description: On a touch screen, tapping twice with two fingers turns translation off or on, like the toggle shortcut.
  $description:zh-CN: 在触屏上双指连点两次即可关闭或重新开启翻译，效果与翻译开关快捷键相同。
- batchSize: 20
  $name: Segments per batch
  $name:zh-CN: 每批文本段数
  $description: Maximum number of text segments sent in one translation request.
  $description:zh-CN: 单次翻译请求最多包含的文本段数。
- batchChars: 10000
  $name: Characters per batch
  $name:zh-CN: 每批字符数
  $description: Maximum number of characters sent in one translation request.
  $description:zh-CN: 单次翻译请求最多包含的字符数。
- batchIntervalMs: 400
  $name: Batch window (milliseconds)
  $name:zh-CN: 批处理间隔（毫秒）
  $description: How long newly seen text is collected before a request is sent.
  $description:zh-CN: 新出现的文本先收集多久再发送请求。
- concurrency: 4
  $name: Parallel requests
  $name:zh-CN: 并发请求数
  $description: Maximum number of translation requests in flight at the same time.
  $description:zh-CN: 同时进行的翻译请求数量上限。
- timeoutMs: 20000
  $name: Request timeout (milliseconds)
  $name:zh-CN: 请求超时（毫秒）
  $description: Timeout for each HTTP request made through the mod.
  $description:zh-CN: 每个经模组发出的 HTTP 请求的超时时间。
- cacheEnabled: true
  $name: Cache translations
  $name:zh-CN: 缓存翻译结果
  $description: Reuse translations that were already requested.
  $description:zh-CN: 复用已经请求过的翻译结果。
- cacheTtlDays: 30
  $name: Cache lifetime (days)
  $name:zh-CN: 缓存有效天数
  $description: How long a cached translation stays valid.
  $description:zh-CN: 缓存翻译结果的有效天数。
- clearCache: false
  $name: Clear the cache on the next page load
  $name:zh-CN: 下次页面加载时清除缓存
  $description: One-shot trigger for the first page load of each app start. The page receives clearCache=true once, then false forever. Turn this setting off again afterwards, otherwise the cache is cleared once on every start.
  $description:zh-CN: 仅对每次启动后的第一次页面加载生效。页面只会收到一次 clearCache=true，之后一直是 false。生效后请手动关闭本项，否则每次启动都会清空一次缓存。
- debug: false
  $name: Verbose logging
  $name:zh-CN: 详细日志
  $description: Let the page write its debug lines to p0.log through the log channel.
  $description:zh-CN: 允许页面通过日志通道把调试信息写入 p0.log。
*/
// ==/WindhawkModSettings==

// Injects the page-side translator into Windhawk's WebView2 UI.
//
// windhawk-ui.exe is a Tauri app which hosts WebView2. Tauri/wry links the
// static WebView2 loader, so CreateCoreWebView2EnvironmentWithOptions is not an
// import of windhawk-ui.exe: the loader resolves
// CreateWebViewEnvironmentWithOptionsInternal from EmbeddedBrowserWebView.dll
// via GetProcAddress, which is what this mod intercepts.
//
// Everything here is best-effort and fail-soft: every unexpected condition is
// logged and then ignored. The mod must never take down Windhawk's own UI.
//
// Wh_Log only reaches Windhawk's log pane, so every line is mirrored to
// <mod storage>\p0.log as UTF-8. A heartbeat thread keeps writing while the mod
// is loaded, so "mod not loaded", "loaded but the hook never fired" and "hook
// fired but the page never answered" can be told apart from outside the app.
//
// Vtable slots are 0-based COM indices taken from the official WebView2.h
// (1.0.3719.77 and 1.0.992.28 declare the interfaces in the same order, so the
// navigation slots 7/8/15/16 line up with AddScript = 27 and ExecuteScript =
// 29). The named constants below are the reference; every slot is still
// range-validated against EmbeddedBrowserWebView.dll before it is called.

#define WIN32_LEAN_AND_MEAN
#include <windows.h>

#include <objbase.h>
#include <shlobj.h>
#include <wincred.h>
#include <winhttp.h>

#include <algorithm>
#include <atomic>
#include <cstdarg>
#include <cstring>
#include <cwchar>
#include <deque>
#include <mutex>
#include <new>
#include <string>
#include <utility>
#include <vector>

#include <windhawk_api.h>

// ---------------------------------------------------------------------------
// File logger
//
// p0.log lives in the mod's storage directory (Wh_GetModStoragePath, which
// Windhawk maps to ...\Engine\ModsWritable\mod-storage\<mod id>). Every line is
// written with its own open/close, so the file can be read while Windhawk runs;
// it rotates to p0.old.log once it grows past 1 MB. Line format:
// YYYY-MM-DD HH:MM:SS.mmm [pid:tid] [seq] message
//
// Nothing here may throw or take the app down: every failure is swallowed.
// ---------------------------------------------------------------------------

static constexpr wchar_t kP0LogName[] = L"p0.log";
static constexpr wchar_t kP0LogOldName[] = L"p0.old.log";
static constexpr unsigned long long kP0LogRotateSize = 1024ull * 1024ull;
static constexpr size_t kP0LogBodyChars = 2048;
static constexpr size_t kP0LogTruncateChars = 200;

struct P0LogState {
    std::mutex mtx;
    std::wstring path;
    std::wstring oldPath;
    unsigned long long seq = 0;
    bool ready = false;
};

static P0LogState& P0LogGlobal() {
    static P0LogState state;
    return state;
}

static wchar_t g_p0LogPathDisplay[600] = L"(not resolved)";

// Thread-local truncated copy of a long string (or the original pointer when it
// already fits), so a log line can never become huge.
static const wchar_t* P0Trunc(const wchar_t* text,
                              size_t maxChars = kP0LogTruncateChars) {
    static thread_local wchar_t buffer[kP0LogTruncateChars + 16];
    if (!text) {
        return L"(null)";
    }
    if (maxChars > kP0LogTruncateChars) {
        maxChars = kP0LogTruncateChars;
    }
    size_t length = 0;
    while (length < maxChars && text[length] != L'\0') {
        ++length;
    }
    if (text[length] == L'\0') {
        return text;
    }
    for (size_t i = 0; i < maxChars; ++i) {
        buffer[i] = text[i];
    }
    buffer[maxChars] = L'.';
    buffer[maxChars + 1] = L'.';
    buffer[maxChars + 2] = L'.';
    buffer[maxChars + 3] = L'\0';
    return buffer;
}

static bool P0ResolveLogDirectory(std::wstring& dir) {
    wchar_t storage[MAX_PATH]{};
    size_t storageLength = Wh_GetModStoragePath(storage, ARRAYSIZE(storage));
    if (storageLength > 0 && storageLength < ARRAYSIZE(storage)) {
        dir.assign(storage, storageLength);
    } else {
        // No Wh_GetModStoragePath answer; use the documented on-disk location.
        wchar_t commonAppData[MAX_PATH]{};
        DWORD commonLength =
            GetEnvironmentVariableW(L"ProgramData", commonAppData,
                                    ARRAYSIZE(commonAppData));
        if (commonLength == 0 ||
            commonLength >= ARRAYSIZE(commonAppData) ||
            commonAppData[0] == L'\0') {
            if (FAILED(SHGetFolderPathW(nullptr, CSIDL_COMMON_APPDATA, nullptr,
                                        SHGFP_TYPE_CURRENT, commonAppData))) {
                return false;
            }
        }
        dir = commonAppData;
        dir += L"\\Windhawk\\Engine\\ModsWritable\\mod-storage\\"
               L"windhawk-ui-translator";
    }

    int createResult = SHCreateDirectoryExW(nullptr, dir.c_str(), nullptr);
    if (createResult != ERROR_SUCCESS &&
        createResult != ERROR_ALREADY_EXISTS &&
        createResult != ERROR_FILE_EXISTS) {
        // Keep going: the directory may exist but not be creatable/queryable.
        Wh_Log(L"[p0] cannot create log directory %s (%d)", dir.c_str(),
               createResult);
    }
    return true;
}

static void P0RotateLogIfNeeded(const std::wstring& path,
                                const std::wstring& oldPath) {
    WIN32_FILE_ATTRIBUTE_DATA data{};
    if (!GetFileAttributesExW(path.c_str(), GetFileExInfoStandard, &data)) {
        return;
    }
    unsigned long long size =
        (static_cast<unsigned long long>(data.nFileSizeHigh) << 32) |
        static_cast<unsigned long long>(data.nFileSizeLow);
    if (size <= kP0LogRotateSize) {
        return;
    }
    MoveFileExW(path.c_str(), oldPath.c_str(), MOVEFILE_REPLACE_EXISTING);
}

static void P0LogInit() {
    try {
        P0LogState& state = P0LogGlobal();
        std::lock_guard<std::mutex> lock(state.mtx);

        std::wstring dir;
        if (!P0ResolveLogDirectory(dir)) {
            Wh_Log(L"[p0] no usable storage directory; file logging disabled");
            return;
        }
        if (dir.empty() || dir.back() != L'\\') {
            dir.push_back(L'\\');
        }

        state.path = dir + kP0LogName;
        state.oldPath = dir + kP0LogOldName;
        P0RotateLogIfNeeded(state.path, state.oldPath);
        state.ready = true;

        wcsncpy_s(g_p0LogPathDisplay, ARRAYSIZE(g_p0LogPathDisplay),
                  state.path.c_str(), _TRUNCATE);
    } catch (...) {
    }
}

static void P0WriteFileLog(const wchar_t* fmt, ...) {
    try {
        P0LogState& state = P0LogGlobal();
        std::lock_guard<std::mutex> lock(state.mtx);
        if (!state.ready) {
            return;
        }

        wchar_t body[kP0LogBodyChars] = {};
        va_list args;
        va_start(args, fmt);
        vswprintf_s(body, ARRAYSIZE(body), fmt ? fmt : L"", args);
        va_end(args);
        body[ARRAYSIZE(body) - 1] = L'\0';

        SYSTEMTIME now{};
        GetLocalTime(&now);
        unsigned long long seq = ++state.seq;

        wchar_t line[kP0LogBodyChars + 96] = {};
        swprintf_s(line, ARRAYSIZE(line),
                   L"%04u-%02u-%02u %02u:%02u:%02u.%03u [%lu:%lu] [%llu] %s\r\n",
                   now.wYear, now.wMonth, now.wDay, now.wHour, now.wMinute,
                   now.wSecond, now.wMilliseconds,
                   static_cast<unsigned long>(GetCurrentProcessId()),
                   static_cast<unsigned long>(GetCurrentThreadId()), seq, body);
        line[ARRAYSIZE(line) - 1] = L'\0';

        char utf8[(kP0LogBodyChars + 128) * 3] = {};
        int utf8Length =
            WideCharToMultiByte(CP_UTF8, 0, line, -1, utf8,
                                static_cast<int>(sizeof(utf8)), nullptr,
                                nullptr);
        if (utf8Length <= 1) {
            return;
        }
        --utf8Length;

        HANDLE file = CreateFileW(state.path.c_str(), FILE_APPEND_DATA,
                                  FILE_SHARE_READ | FILE_SHARE_WRITE, nullptr,
                                  OPEN_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);
        if (file == INVALID_HANDLE_VALUE) {
            return;
        }

        DWORD written = 0;
        WriteFile(file, utf8, static_cast<DWORD>(utf8Length), &written, nullptr);
        CloseHandle(file);
    } catch (...) {
    }
}

// Mirrors every P0_LOG call to p0.log with the same text. The arguments are
// evaluated twice; every call site passes side-effect-free values.
#define P0_LOG(...)                  \
    do {                             \
        Wh_Log(__VA_ARGS__);         \
        P0WriteFileLog(__VA_ARGS__); \
    } while (0)

// ---------------------------------------------------------------------------
// Slot numbers
// ---------------------------------------------------------------------------

static constexpr size_t kEnvSlotCreateController = 3;
static constexpr size_t kEnvSlotCreateControllerWithOptions = 21;
static constexpr size_t kSlotAddRef = 1;
static constexpr size_t kSlotRelease = 2;

static constexpr size_t kControllerSlotGetCoreWebView2 = 25;

static constexpr size_t kWebViewSlotGetSettings = 3;
static constexpr size_t kWebViewSlotAddNavigationStarting = 7;
static constexpr size_t kWebViewSlotRemoveNavigationStarting = 8;
static constexpr size_t kWebViewSlotAddNavigationCompleted = 15;
static constexpr size_t kWebViewSlotRemoveNavigationCompleted = 16;
static constexpr size_t kWebViewSlotAddScript = 27;
static constexpr size_t kWebViewSlotExecuteScript = 29;
static constexpr size_t kWebViewSlotPostWebMessageAsString = 33;
static constexpr size_t kWebViewSlotAddWebMessageReceived = 34;
static constexpr size_t kWebViewSlotRemoveWebMessageReceived = 35;

static constexpr size_t kSettingsSlotGetIsWebMessageEnabled = 5;
static constexpr size_t kSettingsSlotPutIsWebMessageEnabled = 6;

static constexpr size_t kArgsSlotTryGetWebMessageAsString = 5;
static constexpr size_t kNavigationStartingArgsSlotGetUri = 3;
static constexpr size_t kNavigationCompletedArgsSlotGetIsSuccess = 3;
static constexpr size_t kNavigationCompletedArgsSlotGetWebErrorStatus = 4;
static constexpr size_t kNavigationCompletedArgsSlotGetNavigationId = 5;

// The callback object always has Invoke at vtable index 3.
static constexpr size_t kCallbackSlotInvoke = 3;

// ICoreWebView2Environment12+ has well under 64 methods. Copying a few extra
// entries is harmless (the same words would be read from the original vtable
// area anyway) and keeps future callers from running off the copy.
static constexpr size_t kEnvVtblSlots = 64;

// ---------------------------------------------------------------------------
// P0 JavaScript
//
// The same text runs twice: at document-created time (AddScriptToExecute...) and
// again on the current document from ExecuteScript. At document-created time
// window.chrome.webview does not exist yet; WebView2 installs it later, after
// that page script has run. Creating the "already initialised" marker at that
// point would therefore disable every later injection without ever having sent
// anything. So the marker is only created once the channel exists; until then
// a bounded setTimeout retry waits for it. `installed` (message listener
// registered) and `sent` (hello posted) are independent flags, and the page
// stays untouched when the channel never appears.
//
// The IIFE's return value is a JSON probe. ExecuteScript returns the value of
// the script's last expression, so the mod's "... result=%s" log line shows
// the state of the document the script actually reached.
// ---------------------------------------------------------------------------

static constexpr wchar_t kP0Js[] = LR"WHTR_JS(
/*!
 * windhawk-ui-translator - page-side engine (P2)
 *
 * Runs inside the Windhawk 2.0 UI, injected at document-created time and again
 * on navigation completion. Self-contained ES2020 IIFE: no imports, no eval,
 * no network access; every byte leaves the page through the mod's `whtr1`
 * channel (see docs/PROTOCOL.md). Translation renders in place; pointer over a
 * block shows the original, and on touch a tap toggles that block.
 */
(() => {
  'use strict';

  const VERSION = '1.0.0-p2';
  const TAG = 'whtr1';
  const SEP = '\x1f';

  // Attributes we own: the hidden React node, our clone and a text-node swap.
  const ATTR_ORIG = 'data-wh-orig';
  const ATTR_CLONE = 'data-wh-clone';
  const ATTR_SWAPPED = 'data-wh-swapped';
  const ATTR_UNIT = 'data-wh-unit';

  // ---------------------------------------------------------------------------
  // Tiny helpers
  // ---------------------------------------------------------------------------

  const safe = (fn, where) => {
    try {
      return fn();
    } catch (e) {
      try {
        problem(where + ': ' + (e && e.message ? e.message : e));
      } catch (_) {
        /* nothing else we can do */
      }
      return undefined;
    }
  };

  const clamp = (n, lo, hi) => {
    n = Number(n);
    if (!isFinite(n)) return lo;
    return Math.min(hi, Math.max(lo, n));
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const clean = (s) => String(s == null ? '' : s).replace(/\x1f/g, ' ');

  // Cache keys, provider requests and in-flight keys all use this normalised
  // form; the DOM keeps its own whitespace for restoring the original.
  const normalizeSource = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

  const hash32 = (s) => {
    // FNV-1a, 32 bit; the cache key also carries the length against collisions.
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= s.length;
    return (h >>> 0).toString(16).padStart(8, '0');
  };

  const idle = (fn) => {
    if (typeof window.requestIdleCallback === 'function') {
      return window.requestIdleCallback(fn, { timeout: 500 });
    }
    return setTimeout(() => fn({ timeRemaining: () => 8, didTimeout: true }), 16);
  };

  const CHANNEL = () => {
    try {
      return (window.chrome && window.chrome.webview) || null;
    } catch (_) {
      return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Settings, state, diagnostics
  // ---------------------------------------------------------------------------

  function defaultSettings() {
    return {
      targetLang: 'auto',
      provider: 'auto',
      llmBaseUrl: '',
      llmModel: '',
      llmKeySource: 'none',
      glossary: [],
      scopeReadme: true,
      scopeSettings: true,
      scopeModName: true,
      scopeModSummary: true,
      scopeChangelog: true,
      hoverDelayMs: 120,
      shortcutToggle: 'Alt+Q',
      gestureToggle: true,
      batchSize: 20,
      batchChars: 10000,
      batchIntervalMs: 400,
      concurrency: 4,
      timeoutMs: 30000,
      cacheEnabled: true,
      cacheTtlDays: 30,
      clearCache: false,
      debug: false
    };
  }

  const state = {
    settings: defaultSettings(),
    settingsSeen: false,
    settingsCount: 0,
    connected: false,
    enabled: true,
    targetLang: '',
    provider: 'edge',
    // Set once an LLM batch failed: the rest of the session stays on Edge.
    llmFallback: false,
    llmWarned: false,
    googleWarned: false,
    epoch: 0,
    units: new Set(),
    unitByHost: new WeakMap(),
    unitByDisplay: new WeakMap(),
    written: new WeakMap(), // Text node -> value we wrote last
    origText: new WeakMap(), // Text node -> last known React-authored value
    nextUnitId: 1,
    nextRequestId: 1,
    pending: new Map(),
    // Normalised source -> shared translation entry, so a distinct string is
    // requested once per epoch.
    textEntries: new Map(),
    queue: [],
    inflight: 0,
    flushTimer: 0,
    scanTimer: 0,
    observer: null,
    renderQueue: new Set(),
    renderScheduled: false,
    scanQueue: null,
    scanScheduled: false,
    shortcuts: { toggle: null },
    settingsAttempts: 0,
    stats: {
      scans: 0,
      scannedHosts: 0,
      requests: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      batches: 0,
      batchesFailed: 0,
      translations: 0,
      startedAt: Date.now()
    }
  };

  function log(msg) {
    if (!state.settings.debug) return;
    send(TAG + SEP + 'log' + SEP + clean(msg).slice(0, 500));
  }

  function problem(msg) {
    // Errors go to p0.log even when verbose logging is off.
    send(TAG + SEP + 'log' + SEP + ('whtr: ' + clean(msg)).slice(0, 500));
  }

  function send(text) {
    const wv = CHANNEL();
    if (!wv) return false;
    try {
      wv.postMessage(text);
      return true;
    } catch (e) {
      return false;
    }
  }

  function snapshot() {
    let translated = 0;
    let rendered = 0;
    for (const u of state.units) {
      if (u.translatedOk) translated++;
      if (u.rendered) rendered++;
    }
    return {
      version: VERSION,
      enabled: state.enabled,
      settingsSeen: state.settingsSeen,
      connected: state.connected,
      targetLang: state.targetLang,
      provider: state.provider,
      activeProvider: activeProvider(),
      llmFallback: state.llmFallback,
      units: state.units.size,
      translated: translated,
      rendered: rendered,
      queued: state.queue.length,
      inflight: state.inflight,
      requests: state.stats.requests,
      errors: state.stats.errors,
      scans: state.stats.scans,
      scannedHosts: state.stats.scannedHosts,
      cacheHits: state.stats.cacheHits,
      cacheMisses: state.stats.cacheMisses,
      uptimeMs: Date.now() - state.stats.startedAt
    };
  }

  // ---------------------------------------------------------------------------
  // HTTP through the mod
  // ---------------------------------------------------------------------------

  function httpRequest(opts) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (v) => {
        if (settled) return;
        settled = true;
        resolve(v);
      };
      try {
        const wv = CHANNEL();
        if (!wv) {
          done({ status: 0, body: '', error: -1 });
          return;
        }
        const method = String((opts && opts.method) || 'GET').toUpperCase();
        const url = String((opts && opts.url) || '');
        if (!url) {
          done({ status: 0, body: '', error: -1 });
          return;
        }
        const headers = [];
        const raw = opts && opts.headers;
        if (Array.isArray(raw)) {
          for (const pair of raw) {
            if (Array.isArray(pair) && pair.length >= 2) headers.push([pair[0], pair[1]]);
          }
        } else if (raw && typeof raw === 'object') {
          for (const name of Object.keys(raw)) headers.push([name, raw[name]]);
        }
        const cleanHeaders = [];
        for (const [name, value] of headers) {
          const n = String(name);
          const v = String(value == null ? '' : value);
          if (!n || n.indexOf(SEP) !== -1 || v.indexOf(SEP) !== -1) continue;
          if (cleanHeaders.length >= 32) break;
          cleanHeaders.push([n, v]);
        }
        const body = String(opts && opts.body != null ? opts.body : '');
        const id = state.nextRequestId++;
        const fields = [TAG, 'http', String(id), method, url, String(cleanHeaders.length)];
        for (const pair of cleanHeaders) fields.push(pair[0], pair[1]);
        fields.push(body);

        const ms = clamp(state.settings.timeoutMs, 1000, 120000) || 30000;
        const timer = setTimeout(() => {
          if (!state.pending.has(id)) return;
          state.pending.delete(id);
          state.stats.errors++;
          done({ status: 0, body: '', error: -2 });
        }, ms);

        state.pending.set(id, { resolve: done, timer: timer });
        state.stats.requests++;
        wv.postMessage(fields.join(SEP));
      } catch (e) {
        state.stats.errors++;
        done({ status: 0, body: '', error: -3 });
      }
    });
  }

  function onHttpReply(parts) {
    // parts: [tag, 'http', id, status, error, body]
    const id = Number(parts[2]);
    const entry = state.pending.get(id);
    if (!entry) return;
    state.pending.delete(id);
    try {
      clearTimeout(entry.timer);
    } catch (_) {
      /* ignore */
    }
    const status = Number(parts[3]);
    const error = Number(parts[4]);
    const body = parts[5] == null ? '' : parts[5];
    entry.resolve({
      status: isFinite(status) ? status : 0,
      error: isFinite(error) ? error : -1,
      body: body
    });
  }

  // ---------------------------------------------------------------------------
  // Shortcuts
  // ---------------------------------------------------------------------------

  const NAMED_CODES = {
    space: 'Space',
    escape: 'Escape',
    esc: 'Escape',
    enter: 'Enter',
    tab: 'Tab',
    backspace: 'Backspace',
    delete: 'Delete',
    insert: 'Insert',
    home: 'Home',
    end: 'End',
    pageup: 'PageUp',
    pagedown: 'PageDown',
    arrowup: 'ArrowUp',
    arrowdown: 'ArrowDown',
    arrowleft: 'ArrowLeft',
    arrowright: 'ArrowRight',
    '`': 'Backquote',
    '-': 'Minus',
    '=': 'Equal',
    '[': 'BracketLeft',
    ']': 'BracketRight',
    '\\': 'Backslash',
    ';': 'Semicolon',
    "'": 'Quote',
    ',': 'Comma',
    '.': 'Period',
    '/': 'Slash'
  };

  function parseShortcut(text) {
    const s = String(text == null ? '' : text).trim();
    if (!s) return null;
    const want = { ctrl: false, alt: false, shift: false, meta: false };
    const codes = new Set();
    for (const raw of s.split('+')) {
      const token = raw.trim();
      if (!token) continue;
      const low = token.toLowerCase();
      if (low === 'ctrl' || low === 'control') {
        want.ctrl = true;
        continue;
      }
      if (low === 'alt' || low === 'option') {
        want.alt = true;
        continue;
      }
      if (low === 'shift') {
        want.shift = true;
        continue;
      }
      if (low === 'meta' || low === 'win' || low === 'cmd' || low === 'command') {
        want.meta = true;
        continue;
      }
      if (/^f([1-9]|1[0-9]|2[0-4])$/.test(low)) {
        codes.add('F' + low.slice(1));
      } else if (/^[a-z]$/.test(low)) {
        codes.add('Key' + low.toUpperCase());
      } else if (/^[0-9]$/.test(low)) {
        codes.add('Digit' + low);
      } else if (NAMED_CODES[low]) {
        codes.add(NAMED_CODES[low]);
      } else if (low.length > 1) {
        codes.add(token);
      }
    }
    if (!codes.size) return null;
    return { want: want, codes: codes };
  }

  function shortcutMatches(combo, e) {
    if (!combo) return false;
    if (!!e.ctrlKey !== combo.want.ctrl) return false;
    if (!!e.altKey !== combo.want.alt) return false;
    if (!!e.shiftKey !== combo.want.shift) return false;
    if (!!e.metaKey !== combo.want.meta) return false;
    return combo.codes.has(e.code);
  }

  function isTypingTarget(target) {
    if (!target || target.nodeType !== 1) return false;
    try {
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION') return true;
      if (target.isContentEditable) return true;
      if (target.closest('.cm-editor, .monaco-editor, [contenteditable], [role="textbox"]')) return true;
    } catch (_) {
      /* ignore */
    }
    return false;
  }

  function onKeyDown(e) {
    if (!e || e.repeat) return;
    if (isTypingTarget(e.target)) return;
    try {
      if (isTypingTarget(document.activeElement)) return;
    } catch (_) {
      /* ignore */
    }
    try {
      if (shortcutMatches(state.shortcuts.toggle, e)) {
        e.preventDefault();
        setEnabled(!state.enabled);
      }
    } catch (err) {
      problem('shortcut: ' + (err && err.message ? err.message : err));
    }
  }

  // ---------------------------------------------------------------------------
  // Scanning
  // ---------------------------------------------------------------------------

  const PROSE_SEL = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th';
  // Block-level elements that make a prose host "mixed": it owns text and also
  // wraps other blocks, which are translated as their own units.
  const BLOCK_TAGS = new Set([
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DD', 'DETAILS', 'DIV', 'DL',
    'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2',
    'H3', 'H4', 'H5', 'H6', 'HEADER', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P',
    'PRE', 'SECTION', 'SUMMARY', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH',
    'THEAD', 'TR', 'UL'
  ]);
  // Closed select hosts. antd 6 renders a single select's value as a text node
  // in `.ant-select-content` (which also carries `title` and the search input);
  // `.ant-select-selection-item` remains for antd 5 and multiple/tags mode.
  const SELECT_HOST_SELECTORS = [
    '.ant-select-single .ant-select-content',
    '.ant-select-content-value',
    '.ant-select-placeholder',
    '.ant-select-selection-item',
    '.ant-select-selection-placeholder'
  ];
  const SELECT_HOST_SET = new Set(SELECT_HOST_SELECTORS);
  // A setting description. Inside the compact title row it belongs to the
  // tooltip, not the title unit; the visible portal copy translates normally.
  const DESC_TEXT_SEL = '[data-testid="mod-setting-description-text"]';
  // The collapsed current-value summary ("Non-default"): a string of its own.
  const SUMMARY_TEXT_SEL = '[data-testid="mod-setting-summary"]';
  const TITLE_SEL = '.windhawk-row-meta-title';
  // styled-components keeps the component name as the class prefix, so a
  // substring match survives the generated suffix.
  const TITLE_TEXT_SEL = '[class*="SettingTitleText"]';
  const SETTINGS_SELECTORS = [
    DESC_TEXT_SEL,
    // Claimed before the title host so a summary nested in the title row stays
    // its own unit.
    SUMMARY_TEXT_SEL,
    '.ant-select-item-option-content',
    // Only the text of a closed control's value/placeholder is swapped; the
    // search input stays atomic.
    ...SELECT_HOST_SELECTORS,
    // Claimed before the title host so a copy nested in the title row is its
    // own unit; the title reads only the title text.
    '.windhawk-row-meta-description',
    '.windhawk-row-meta-title',
    '[data-testid="mod-setting-reset"]'
  ];
  // Mod names: installed-list row title, tile Card.Meta title and the details
  // header's name div. On a tile only the Typography inside the mod-card-title
  // box is the name; the ribbon, local-mod icon and metadata line are siblings.
  const NAME_LIST_SELECTORS = ['.windhawk-row-meta-title', '.ant-card-meta-title'];
  const MOD_CARD_TITLE_SEL = '[data-testid="mod-card-title"]';
  // Never part of a name unit: an icon, the status ribbon, a metadata line.
  const NAME_IMPURE_SEL =
    'svg,[class*="ant-ribbon"],[class*="MetadataLine"],[data-testid*="metadata"]';
  // Mod summaries: tile/table descriptions and the details header Typography.
  const SUMMARY_LIST_SELECTORS = [
    '.windhawk-row-meta-description',
    '.ant-card-meta-description',
    '.ant-typography'
  ];
  const MODS_TABLE_SEL = '[data-testid="installed-mods-table"]';
  const ROW_SELECT_SEL = '[data-testid="mod-row-select"]';

  // Subtrees left alone; everything else is an inline wrapper or an atomic
  // placeholder (see serializeHost).
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META', 'BASE', 'TITLE']);
  const ATOMIC_TAGS = new Set([
    'CODE', 'PRE', 'KBD', 'SAMP', 'VAR', 'IMG', 'BR', 'HR', 'SVG', 'MATH',
    'VIDEO', 'AUDIO', 'CANVAS', 'IFRAME', 'OBJECT', 'EMBED', 'BUTTON',
    'WBR', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'PROGRESS', 'METER',
    'COLGROUP', 'COL'
  ]);
  const STRUCT_TAGS = new Set([
    'A', 'SPAN', 'EM', 'STRONG', 'B', 'I', 'U', 'MARK', 'SMALL', 'SUP',
    'SUB', 'ABBR', 'DEL', 'INS', 'Q', 'CITE', 'TIME', 'BDI', 'BDO', 'FONT',
    'LABEL', 'RUBY', 'RT', 'RP', 'S'
  ]);
  const DENY_ANCESTOR_SEL =
    'script,style,noscript,template,textarea,input,select,option,code,pre,kbd,' +
    '.cm-editor,.monaco-editor,[contenteditable],[translate="no"]';

  const CJK_RE = /[\u2e80-\u2eff\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;
  const URL_RE = /^https?:\/\/\S+$/i;
  const EMAIL_RE = /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/;
  const WINPATH_RE = /^[a-z]:\\\S*$/i;
  const UNIXPATH_RE = /^(?:\.{0,2}\/|\/)[\w./\\-]*$/;
  const VERSION_RE = /^v?\d+(?:\.\d+){1,3}(?:[-+][\w.]+)?$/i;
  const NUMERIC_RE = /^[\d\s.,:;%+\-()[\]{}]+$/;
  const LETTER_RE = /\p{L}/u;

  function isTranslatable(src) {
    if (typeof src !== 'string') return false;
    const t = src.replace(/\s+/g, ' ').trim();
    if (t.length < 2) return false;
    if (CJK_RE.test(t)) return false;
    if (!LETTER_RE.test(t)) return false;
    if (URL_RE.test(t)) return false;
    if (EMAIL_RE.test(t)) return false;
    if (WINPATH_RE.test(t)) return false;
    if (UNIXPATH_RE.test(t)) return false;
    if (VERSION_RE.test(t)) return false;
    if (NUMERIC_RE.test(t)) return false;
    return true;
  }

  function scopeEnabled(surface) {
    const s = state.settings;
    if (surface === 'readme') return !!s.scopeReadme;
    if (surface === 'changelog') return !!s.scopeChangelog;
    if (surface === 'settings') return !!s.scopeSettings;
    if (surface === 'name') return !!s.scopeModName;
    if (surface === 'summary') return !!s.scopeModSummary;
    return !!s.scopeModSummary;
  }

  function classifyProse(body) {
    let node = body;
    for (let i = 0; node && i < 14; i++, node = node.parentElement) {
      let testid = '';
      try {
        testid = node.getAttribute('data-testid') || '';
      } catch (_) {
        testid = '';
      }
      if (/changelog|changes|version-history|release-notes/i.test(testid)) return 'changelog';
    }
    const card = body.closest ? body.closest('.ant-card') : null;
    const head = card ? card.querySelector('.ant-card-head-title, .ant-card-head') : null;
    if (head && /changelog|what'?s new|change ?log|history|\u66f4\u65b0|\u53d8\u66f4|\u5386\u53f2/i.test(head.textContent || '')) {
      return 'changelog';
    }
    const pane = body.closest ? body.closest('[role="tabpanel"]') : null;
    if (pane) {
      const labelled = pane.getAttribute('aria-labelledby');
      const tab = labelled ? document.getElementById(labelled) : null;
      if (tab && /changelog|changes|history|\u66f4\u65b0|\u53d8\u66f4|\u5386\u53f2/i.test(tab.textContent || '')) return 'changelog';
    }
    return 'readme';
  }

  function compactSurface(el) {
    try {
      if (el.closest('[data-testid*="setting"], .ant-select-dropdown, .ant-modal, .ant-drawer, .ant-form')) {
        return 'settings';
      }
      const row = el.closest('.windhawk-row');
      if (
        row &&
        row.querySelector(
          '.ant-select,.ant-switch,.ant-input,.ant-btn,[data-testid="mod-setting-reset"],' +
          '[data-testid="mod-setting-description"],[data-testid="mod-setting-description-text"]'
        )
      ) {
        return 'settings';
      }
    } catch (_) {
      /* ignore */
    }
    return 'list';
  }

  function hasText(el) {
    try {
      return (el.textContent || '').trim().length >= 2;
    } catch (_) {
      return false;
    }
  }

  // Debug-only trail for skipped select hosts, capped per scan.
  let debugSelectBudget = 0;

  function debugSelectReject(el, sel, reason) {
    if (!state.settings.debug || debugSelectBudget <= 0) return;
    debugSelectBudget--;
    let name = '?';
    let text = '';
    try {
      name = String(el.tagName || '?').toLowerCase();
      const cls = String(el.className || '').trim().split(/\s+/).slice(0, 2).join('.');
      if (cls) name += '.' + cls;
      text = String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    } catch (_) {
      /* ignore */
    }
    log('select host rejected (' + reason + '): ' + sel + ' <' + name + '> "' + text + '"');
  }

  // Debug-only diagnosis for an untranslated setting title: one line per row,
  // six rows per scan, tag/class skeleton only, never text.
  const DEBUG_ROW_BUDGET = 6;

  function elementSignature(el) {
    if (!el || el.nodeType !== 1) return '?';
    let out = String(el.tagName || '?').toLowerCase();
    try {
      const cls = String(el.className || '').trim();
      if (cls) out += '.' + cls.split(/\s+/).filter(Boolean).slice(0, 4).join('.');
      const testid = el.getAttribute('data-testid');
      if (testid) out += '[data-testid=' + testid + ']';
    } catch (_) {
      /* ignore */
    }
    return out;
  }

  function shallowSkeleton(el, depth) {
    if (!el || el.nodeType !== 1 || depth < 0) return '';
    let out = elementSignature(el);
    const kids = [];
    try {
      for (let c = el.firstElementChild; c; c = c.nextElementSibling) {
        const s = shallowSkeleton(c, depth - 1);
        if (s) kids.push(s);
      }
    } catch (_) {
      /* ignore */
    }
    if (kids.length) out += '>' + kids.join(',');
    return out;
  }

  function debugSettingsRows(claimed) {
    if (!state.settings.debug) return;
    let rows = [];
    try {
      rows = Array.from(document.querySelectorAll('[data-testid="mod-setting"]'));
      if (!rows.length) rows = Array.from(document.querySelectorAll('.windhawk-row'));
    } catch (_) {
      rows = [];
    }
    let lines = 0;
    for (const row of rows) {
      if (lines >= DEBUG_ROW_BUDGET) break;
      let testid = '';
      let key = '';
      try {
        testid = row.getAttribute('data-testid') || '';
        key = row.getAttribute('data-setting-key') || '';
      } catch (_) {
        testid = '';
        key = '';
      }
      let title = null;
      try {
        title = row.querySelector('.windhawk-row-meta-title') || row.querySelector('h4');
      } catch (_) {
        title = null;
      }
      const index = title ? claimed.indexOf(title) : -1;
      let claimedBy = '';
      if (title && index === -1) {
        for (const host of claimed) {
          if (host !== title && title.contains(host)) {
            claimedBy = elementSignature(host);
            break;
          }
        }
      }
      log(
        'row ' + lines +
        ' testid=' + (testid || '-') +
        ' key=' + (key || '-') +
        ' title=' + (title ? elementSignature(title) : '-') +
        ' claimed=' + (index !== -1 ? 'true' : 'false') +
        (claimedBy ? ' claimedBy=' + claimedBy : '') +
        ' skeleton=' + (title ? shallowSkeleton(title, 2).slice(0, 220) : '-')
      );
      lines++;
    }
  }

  function settingsRejectReason(el) {
    try {
      if (el.closest('[' + ATTR_CLONE + '="1"]')) return 'inside our clone';
      if (el.closest(DENY_ANCESTOR_SEL)) return 'denied ancestor';
    } catch (_) {
      return 'unreadable';
    }
    if (!eligibleHost(el)) return 'card head';
    if (compactSurface(el) !== 'settings') return 'not a settings surface';
    // Inline wrappers are flattened by the serializer; only a host with no text
    // at all is skipped.
    if (!hasText(el)) return hasDirectText(el) ? 'no text' : 'no direct text';
    return '';
  }

  // The details header packs the mod name, id chip, metadata line and buttons
  // into one subtree. Only its summary Typography is prose, so the card-head
  // rule wins over every other selector.
  function isCardHeadHost(el) {
    try {
      return !!el.closest('.ant-card-head');
    } catch (_) {
      return false;
    }
  }

  function isTypography(el) {
    try {
      return !!el.matches('.ant-typography');
    } catch (_) {
      return false;
    }
  }

  // Metadata rows are Typography too but carry an icon and are proper nouns.
  // Only inside the card head does that disqualify a host.
  function hasSvgIcon(el) {
    try {
      return !!el.querySelector('svg');
    } catch (_) {
      return false;
    }
  }

  // A name unit is name text only: no icon, no status ribbon, no metadata line
  // text. Checked when a host is resolved and again before a unit is made.
  function nameHostClean(el) {
    if (!el || el.nodeType !== 1) return false;
    try {
      if (el.matches(NAME_IMPURE_SEL)) return false;
      if (el.closest('[class*="MetadataLine"],[data-testid*="metadata"]')) return false;
      if (el.querySelector(NAME_IMPURE_SEL)) return false;
    } catch (_) {
      return false;
    }
    return true;
  }

  // The details header's name is the first bare div in the meta title that owns
  // text directly; the metadata items hold theirs in icon-bearing spans.
  function headerNameHost(meta) {
    let divs = [];
    try {
      divs = Array.from(meta.querySelectorAll('div'));
    } catch (_) {
      divs = [];
    }
    for (const el of divs) {
      if (el.closest('.ant-typography')) continue;
      if (!hasDirectText(el)) continue;
      if (!hasText(el)) continue;
      if (!nameHostClean(el)) continue;
      return el;
    }
    return null;
  }

  // A tile's Card.Meta title: the name is the EllipsisText Typography inside
  // the mod-card-title box. The ribbon, local-mod icon and metadata line sit
  // beside it and must never join the unit.
  function tileNameHost(meta) {
    let box = null;
    try {
      box = meta.querySelector(MOD_CARD_TITLE_SEL);
    } catch (_) {
      box = null;
    }
    let typo = null;
    try {
      typo = (box || meta).querySelector('.ant-typography');
    } catch (_) {
      typo = null;
    }
    if (typo && typo !== meta && nameHostClean(typo)) return typo;
    // The older shape puts the name straight in the meta title; use it only
    // when it carries nothing but the name.
    if (!box && nameHostClean(meta)) return meta;
    return null;
  }

  // One resolver for every name surface: installed-list row title, tile name,
  // details header name.
  function resolveNameHost(el) {
    if (!el || el.nodeType !== 1) return null;
    try {
      if (el.matches('.windhawk-row-meta-title')) return nameHostClean(el) ? el : null;
      if (el.matches('.ant-card-meta-title')) {
        if (el.closest('.ant-card-head') || el.closest('[data-testid="mod-details"]')) {
          return headerNameHost(el);
        }
        return tileNameHost(el);
      }
    } catch (_) {
      return null;
    }
    return nameHostClean(el) ? el : null;
  }

  function detailsNameHosts() {
    const out = [];
    let metas = [];
    try {
      metas = Array.from(
        document.querySelectorAll(
          '.ant-card-head .ant-card-meta-title, [data-testid="mod-details"] .ant-card-meta-title'
        )
      );
    } catch (_) {
      return out;
    }
    for (const meta of metas) {
      const el = resolveNameHost(meta);
      if (el) out.push(el);
    }
    return out;
  }

  // Every name surface: tile/explore titles, table name link, details name div.
  // Settings titles share the row-title class and are kept out by compactSurface.
  function nameHosts() {
    const out = [];
    const add = (el) => {
      if (el && out.indexOf(el) === -1) out.push(el);
    };
    try {
      for (const a of document.querySelectorAll(MODS_TABLE_SEL + ' tbody a')) add(resolveNameHost(a));
    } catch (_) {
      /* ignore */
    }
    try {
      for (const box of document.querySelectorAll(ROW_SELECT_SEL)) {
        const cell = box.closest('td');
        if (cell) add(resolveNameHost(cell.querySelector('a')));
      }
    } catch (_) {
      /* ignore */
    }
    for (const sel of NAME_LIST_SELECTORS) {
      try {
        for (const el of document.querySelectorAll(sel)) {
          // A title inside a card head is header metadata, not a mod name.
          if (el.closest('.ant-card-head')) continue;
          add(resolveNameHost(el));
        }
      } catch (_) {
        /* ignore */
      }
    }
    for (const el of detailsNameHosts()) add(el);
    return out;
  }

  function summaryHosts() {
    const out = [];
    for (const sel of SUMMARY_LIST_SELECTORS) {
      try {
        for (const el of document.querySelectorAll(sel)) {
          // A tile's name Typography is never a summary, even with the name
          // scope off.
          if (sel === '.ant-typography' && el.closest(MOD_CARD_TITLE_SEL)) continue;
          if (out.indexOf(el) === -1) out.push(el);
        }
      } catch (_) {
        /* ignore */
      }
    }
    return out;
  }

  function eligibleHost(el, kind) {
    if (!el || el.nodeType !== 1) return false;
    if (!isCardHeadHost(el)) return true;
    if (kind === 'name') return !isTypography(el) && !hasSvgIcon(el);
    return isTypography(el) && !hasSvgIcon(el);
  }

  function hasDirectText(el) {
    try {
      for (let n = el.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3 && /\S/.test(n.nodeValue || '')) return true;
      }
    } catch (_) {
      /* ignore */
    }
    return false;
  }

  function hasBlockChild(el, atomic, skipAria) {
    try {
      for (let n = el.firstElementChild; n; n = n.nextElementSibling) {
        // A claimed descendant or the excluded screen-reader copy is a
        // placeholder, not a block that makes this wrapper a container.
        if (atomic && atomic.has(n)) continue;
        if (isAriaCopy(n, skipAria)) continue;
        if (BLOCK_TAGS.has(n.tagName)) return true;
      }
    } catch (_) {
      /* ignore */
    }
    return false;
  }

  // Own sentence plus nested blocks: cloning would duplicate the nested items.
  function isMixedProseHost(el) {
    return hasDirectText(el) && hasBlockChild(el);
  }

  function scanAll() {
    // The document-created injection may run before <head> exists.
    installCss();
    if (!state.enabled || !state.settingsSeen) return;
    state.stats.scans++;
    pruneUnits();

    const claimed = [];
    const candidates = [];
    const claim = (el) => {
      for (const host of claimed) {
        if (host === el) return false;
        if (host.contains(el) || el.contains(host)) return false;
      }
      claimed.push(el);
      return true;
    };
    // A swap host may contain units claimed before it (deepest first); those
    // stay atomic placeholders and are never translated twice.
    const claimSwap = (el) => {
      for (const host of claimed) {
        if (host === el || host.contains(el)) return null;
      }
      const atomic = [];
      for (const host of claimed) {
        if (el.contains(host)) atomic.push(host);
      }
      claimed.push(el);
      return atomic;
    };
    // A control nested in a claimed host (the reset button) gets its own unit.
    const claimInner = (el) => {
      for (const host of claimed) {
        if (host === el) return false;
        if (el.contains(host)) return false;
      }
      claimed.push(el);
      return true;
    };

    // README / changelog prose: React owns the nodes, so render a translated clone.
    if (state.settings.scopeReadme || state.settings.scopeChangelog) {
      let bodies = [];
      try {
        bodies = Array.from(document.querySelectorAll('[data-testid="mod-details"] .ant-card-body'));
      } catch (_) {
        bodies = [];
      }
      for (const body of bodies) {
        const surface = classifyProse(body);
        if (!scopeEnabled(surface)) continue;
        let blocks = [];
        try {
          blocks = Array.from(body.querySelectorAll(PROSE_SEL));
        } catch (_) {
          blocks = [];
        }
        const mixed = [];
        for (const block of blocks) {
          if (block.closest('[' + ATTR_CLONE + '="1"]')) continue;
          if (block.closest(DENY_ANCESTOR_SEL)) continue;
          // A settings row inside the card body belongs to the swap pass, never a clone.
          if (
            block.closest('.windhawk-row') ||
            block.matches('.windhawk-row-meta-title, .windhawk-row-meta-description')
          ) {
            continue;
          }
          if (!eligibleHost(block)) continue;
          // Own sentence plus nested blocks: swap only the host's own text.
          if (isMixedProseHost(block)) {
            mixed.push(block);
            continue;
          }
          // Keep only the innermost block so a <li><p> pair is not rendered twice.
          try {
            if (block.querySelector(PROSE_SEL)) continue;
          } catch (_) {
            /* ignore */
          }
          if (!hasText(block)) continue;
          if (!claim(block)) continue;
          candidates.push({ el: block, mode: 'clone', surface: surface });
        }
        // Deepest first: each keeps the nested blocks as atomic placeholders.
        for (let i = mixed.length - 1; i >= 0; i--) {
          const block = mixed[i];
          if (!hasText(block)) continue;
          const atomic = claimSwap(block);
          if (!atomic) continue;
          candidates.push({ el: block, mode: 'swap', surface: surface, atomic: atomic });
        }
      }
    }

    // Settings surfaces: text-node swap, never a clone.
    if (state.settings.scopeSettings) {
      debugSelectBudget = state.settings.debug ? 5 : 0;
      for (const sel of SETTINGS_SELECTORS) {
        let list = [];
        try {
          list = Array.from(document.querySelectorAll(sel));
        } catch (_) {
          list = [];
        }
        const selectHost = SELECT_HOST_SET.has(sel);
        for (const el of list) {
          // A hidden copy nested in a title is never its own unit; the visible
          // tooltip portal outside the title is claimed like any description.
          if (sel === DESC_TEXT_SEL && el.closest(TITLE_SEL)) continue;
          const reason = settingsRejectReason(el);
          if (reason) {
            if (selectHost) debugSelectReject(el, sel, reason);
            continue;
          }
          // A title with no text but the excluded copy gets no unit.
          if (isTitleHost(el) && !isTranslatable(normalizeSource(titleHostText(el, claimed)))) continue;
          const atomic = claimSwap(el);
          if (!atomic) {
            if (selectHost) debugSelectReject(el, sel, 'already claimed');
            continue;
          }
          candidates.push({ el: el, mode: 'swap', surface: 'settings', atomic: atomic });
        }
      }
      // The reset button is an atomic token in the title's source; give its
      // label a nested unit so it translates too.
      let resets = [];
      try {
        resets = Array.from(document.querySelectorAll('[data-testid="mod-setting-reset"]'));
      } catch (_) {
        resets = [];
      }
      for (const el of resets) {
        if (el.closest('[' + ATTR_CLONE + '="1"]')) continue;
        if (el.closest(DENY_ANCESTOR_SEL)) continue;
        if (!eligibleHost(el)) continue;
        if (compactSurface(el) !== 'settings') continue;
        if (!hasText(el)) continue;
        if (!claimInner(el)) continue;
        candidates.push({ el: el, mode: 'swap', surface: 'settings' });
      }
    }

    // Mod names: swap mode keeps the link/div and replaces only its text node.
    if (scopeEnabled('name')) {
      for (const el of nameHosts()) {
        if (el.closest('[' + ATTR_CLONE + '="1"]')) continue;
        if (el.closest(DENY_ANCESTOR_SEL)) continue;
        if (!eligibleHost(el, 'name')) continue;
        if (compactSurface(el) !== 'list') continue;
        if (!hasText(el)) continue;
        const atomic = claimSwap(el);
        if (!atomic) continue;
        candidates.push({ el: el, mode: 'swap', surface: 'name', atomic: atomic });
      }
    }

    // Mod summaries: same swap rule.
    if (scopeEnabled('summary')) {
      for (const el of summaryHosts()) {
        if (el.closest('[' + ATTR_CLONE + '="1"]')) continue;
        if (el.closest(DENY_ANCESTOR_SEL)) continue;
        if (!eligibleHost(el, 'summary')) continue;
        if (compactSurface(el) !== 'list') continue;
        if (!hasText(el)) continue;
        const atomic = claimSwap(el);
        if (!atomic) continue;
        candidates.push({ el: el, mode: 'swap', surface: 'summary', atomic: atomic });
      }
    }

    if (state.settings.debug) safe(() => debugSettingsRows(claimed), 'debug-rows');

    state.stats.scannedHosts += candidates.length;
    state.scanQueue = { items: candidates, at: 0, epoch: state.epoch };
    scheduleScanChunk();
  }

  function scheduleScanChunk() {
    if (state.scanScheduled) return;
    state.scanScheduled = true;
    idle((deadline) => {
      state.scanScheduled = false;
      safe(() => runScanChunk(deadline), 'scan-chunk');
    });
  }

  function runScanChunk(deadline) {
    if (!state.enabled) {
      state.scanQueue = null;
      return;
    }
    const queue = state.scanQueue;
    if (!queue) return;
    if (queue.epoch !== state.epoch) {
      state.scanQueue = null;
      return;
    }
    let n = 0;
    while (queue.at < queue.items.length) {
      const item = queue.items[queue.at++];
      if (item && item.el && item.el.isConnected) {
        safe(() => processHost(item.el, item.mode, item.surface, item.atomic), 'scan-host');
      }
      n++;
      const left = deadline && typeof deadline.timeRemaining === 'function' ? deadline.timeRemaining() : 8;
      if (n >= 25 || left < 2) break;
    }
    if (queue.at < queue.items.length) scheduleScanChunk();
    else if (state.scanQueue === queue) state.scanQueue = null;
  }

  function scheduleScan(delay) {
    if (state.scanTimer) clearTimeout(state.scanTimer);
    state.scanTimer = setTimeout(() => {
      state.scanTimer = 0;
      safe(scanAll, 'scan');
    }, Math.max(0, delay || 0));
  }

  function pruneUnits() {
    for (const u of Array.from(state.units)) {
      if (!u.el || !u.el.isConnected) dropUnit(u);
    }
  }

  // ---------------------------------------------------------------------------
  // Serialization: text with placeholders
  //
  // clone mode: <n>inner</n> structural wrapper, {{n}} atomic node
  // swap mode:  {{n}} only; inline wrappers are flattened into text
  // ---------------------------------------------------------------------------

  function isSkippedElement(el) {
    if (!el || el.nodeType !== 1) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.matches('.cm-editor, .monaco-editor, [contenteditable], [translate="no"]')) return true;
    return false;
  }

  function isAtomicElement(el) {
    if (ATOMIC_TAGS.has(el.tagName)) return true;
    if (el.matches('.cm-editor, .monaco-editor, [contenteditable], [translate="no"]')) return true;
    return false;
  }

  // Swap mode treats inline wrappers as text flow (a title span, a select's
  // value span); clone mode keeps structural markup.
  function isInlineWrapper(el, mode, atomic, skipAria) {
    if (STRUCT_TAGS.has(el.tagName)) return true;
    if (mode !== 'swap') return false;
    if (!BLOCK_TAGS.has(el.tagName)) return true;
    // A bare div used as a label line is still part of the text flow.
    return el.tagName === 'DIV' && !hasBlockChild(el, atomic, skipAria);
  }

  // A setting title host: only its title text is the unit.
  function isTitleHost(el) {
    try {
      return !!el.matches(TITLE_SEL);
    } catch (_) {
      return false;
    }
  }

  // The hidden description copy duplicates the tooltip; inside a title it is
  // dropped from the source entirely, not even emitted as a placeholder.
  function isAriaCopy(el, hostIsTitle) {
    try {
      if (!el.matches(DESC_TEXT_SEL)) return false;
      return hostIsTitle || !!el.closest(TITLE_SEL);
    } catch (_) {
      return false;
    }
  }

  // The title text span inside the row; the closest-title check keeps a nested
  // row's title from being taken for this row's.
  function titleTextHost(host) {
    try {
      const el = host.querySelector(TITLE_TEXT_SEL);
      if (el && el !== host && el.closest(TITLE_SEL) === host && !isTitleExtra(el)) return el;
    } catch (_) {
      /* ignore */
    }
    return null;
  }

  // Row content that shares the title row but never joins the title text.
  function isTitleExtra(el) {
    try {
      return !!el.closest(SUMMARY_TEXT_SEL) || !!el.closest('[data-testid="mod-setting-reset"]');
    } catch (_) {
      return false;
    }
  }

  // Walk the title text span, or the host's direct text when there is none.
  // Claimed descendants are skipped: they never become a placeholder here.
  function walkTitleText(root, directOnly, onText, atomic) {
    const atomics = atomic && atomic.length ? new Set(atomic) : null;
    const visit = (node) => {
      for (let child = node.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === 3) {
          onText(child, child.nodeValue || '');
          continue;
        }
        if (child.nodeType !== 1) continue;
        if (directOnly) continue;
        if (atomics && atomics.has(child)) continue;
        if (isSkippedElement(child)) continue;
        if (isAtomicElement(child)) continue;
        if (isAriaCopy(child, true)) continue;
        if (isTitleExtra(child)) continue;
        visit(child);
      }
    };
    visit(root);
  }

  function titleHostText(host, atomic) {
    const target = titleTextHost(host);
    let text = '';
    walkTitleText(target || host, !target, (node, value) => {
      text += value;
    }, atomic);
    return text;
  }

  // Title units are text only: no refs, no placeholders.
  function serializeTitleHost(host, atomic) {
    const target = titleTextHost(host);
    const segs = [];
    let text = '';
    walkTitleText(target || host, !target, (node, value) => {
      segs.push({ kind: 'text', node: node, orig: value, out: value });
      state.origText.set(node, value);
      text += value;
    }, atomic);
    return { text: text, refs: [], segs: segs };
  }

  // `atomic` descendants are emitted as placeholders and never walked;
  // `skipAria` drops the hidden description copy without a placeholder.
  function serializeHost(host, mode, atomic, skipAria) {
    const atomics = atomic && atomic.length ? new Set(atomic) : null;
    const refs = [];
    const segs = [];
    let out = '';
    const walk = (node) => {
      let child = node.firstChild;
      while (child) {
        if (child.nodeType === 3) {
          const value = child.nodeValue || '';
          if (mode === 'swap') {
            segs.push({ kind: 'text', node: child, orig: value, out: value });
            state.origText.set(child, value);
          }
          out += value;
        } else if (child.nodeType === 1) {
          const el = child;
          if (!isSkippedElement(el) && !isAriaCopy(el, skipAria)) {
            if ((atomics && atomics.has(el)) || isAtomicElement(el)) {
              const index = refs.length;
              refs.push(el);
              out += '{{' + index + '}}';
              if (mode === 'swap') segs.push({ kind: 'token', index: index, el: el });
            } else if (isInlineWrapper(el, mode, atomics, skipAria)) {
              if (mode === 'clone') {
                const index = refs.length;
                refs.push(el);
                out += '<' + index + '>';
                walk(el);
                out += '</' + index + '>';
              } else {
                walk(el);
              }
            } else {
              const index = refs.length;
              refs.push(el);
              out += '{{' + index + '}}';
              if (mode === 'swap') segs.push({ kind: 'token', index: index, el: el });
            }
          }
        }
        child = child.nextSibling;
      }
    };
    walk(host);
    return { text: out, refs: refs, segs: segs };
  }

  function splitSerialized(src, limit) {
    if (src.length <= limit) return [src];
    const cuts = [];
    let depth = 0;
    for (let i = 0; i < src.length; ) {
      const c = src[i];
      if (c === '{' && src[i + 1] === '{') {
        const end = src.indexOf('}}', i + 2);
        if (end !== -1) {
          i = end + 2;
          continue;
        }
      }
      if (c === '<') {
        const m = /^<(\/?)(\d+)>/.exec(src.slice(i, i + 12));
        if (m) {
          depth += m[1] ? -1 : 1;
          i += m[0].length;
          continue;
        }
      }
      if (depth <= 0) {
        const boundary =
          c === '.' || c === '!' || c === '?' || c === ';' ||
          c === '\u3002' || c === '\uff01' || c === '\uff1f' || c === '\uff1b' ||
          c === '\n';
        if (boundary && /[\s"'\u201d\u2019)\]]/.test(src[i + 1] || ' ')) cuts.push(i + 1);
      }
      i++;
    }
    if (!cuts.length) return [src];

    const parts = [];
    let start = 0;
    let k = 0;
    while (src.length - start > limit) {
      let chosen = -1;
      while (k < cuts.length && cuts[k] <= start) k++;
      for (let j = k; j < cuts.length; j++) {
        if (cuts[j] - start > limit) break;
        chosen = cuts[j];
      }
      if (chosen <= start) {
        if (k < cuts.length) chosen = cuts[k];
        else break;
      }
      if (chosen <= start) break;
      parts.push(src.slice(start, chosen));
      start = chosen;
    }
    if (start < src.length) parts.push(src.slice(start));
    return parts.filter((p) => p.length > 0);
  }

  // ---------------------------------------------------------------------------
  // Units
  // ---------------------------------------------------------------------------

  function makeUnit(el, mode, surface) {
    const u = {
      id: state.nextUnitId++,
      el: el,
      mode: mode,
      surface: surface,
      source: '',
      sourceHash: '',
      leadTokens: '',
      trailTokens: '',
      refs: [],
      segs: [],
      parts: [],
      translatedOk: false,
      noop: false,
      rendered: false,
      skip: false,
      clone: null,
      hoverOrig: false,
      tapOrig: false,
      hoverTimer: 0,
      leaveTimer: 0,
      appliedShowOrig: null
    };
    state.unitByHost.set(el, u);
    state.units.add(u);
    return u;
  }

  function restoreSwapText(u) {
    if (!u || !u.segs) return;
    for (const seg of u.segs) {
      if (seg.kind !== 'text') continue;
      const node = seg.node;
      if (!node || !node.isConnected) continue;
      const orig = state.origText.has(node) ? state.origText.get(node) : seg.orig;
      // Only undo our own translation; never overwrite text React just wrote.
      if (seg.out !== orig && node.nodeValue === seg.out) {
        node.nodeValue = orig;
        state.written.set(node, orig);
      }
    }
  }

  function swapChanged(u) {
    if (!u.segs || !u.segs.length) return true;
    for (const seg of u.segs) {
      if (seg.kind !== 'text') continue;
      if (!seg.node || !seg.node.isConnected) return true;
      const value = seg.node.nodeValue;
      if (value !== seg.orig && value !== seg.out) return true;
    }
    return false;
  }

  // A closed select renders its value with the search input as an edge token
  // ("Where the mouse cursor is{{0}}"), the dropdown option without it. Both
  // must share one source and translation, so edge tokens are split off and
  // re-attached around the output; their DOM nodes never move.
  function splitEdgeTokens(text) {
    let lead = '';
    let trail = '';
    let rest = text;
    const head = /^(?:\{\{\d+\}\})+/.exec(rest);
    if (head) {
      lead = head[0];
      rest = rest.slice(lead.length);
    }
    const tail = /(?:\{\{\d+\}\})+$/.exec(rest);
    if (tail) {
      trail = tail[0];
      rest = rest.slice(0, rest.length - trail.length);
    }
    return { text: normalizeSource(rest), lead: lead, trail: trail };
  }

  // "<prefix>: <tail>" whose tail is an option label with a known translation:
  // reuse that translation instead of wording the sentence differently.
  const RESET_LABEL_RE = /^([^:：]{1,80}?)([:：][ ]?)(\S(?:[\s\S]*\S)?)$/;

  function resetLabelParts(u, source) {
    if (u.surface !== 'settings') return null;
    const m = RESET_LABEL_RE.exec(source);
    if (!m) return null;
    const prefix = m[1].trim();
    const sep = m[2];
    const tail = m[3].trim();
    if (!prefix || !tail) return null;
    if (!isTranslatable(prefix)) return null;
    // Only compose when the tail is already translated; otherwise translate the
    // whole sentence as one piece.
    const tailTranslated = lookupTranslation(tail);
    if (tailTranslated === undefined) return null;
    return [
      {
        text: prefix,
        translated: null,
        state: 0,
        unit: u,
        sep: sep,
        tail: tail,
        tailTranslated: tailTranslated
      }
    ];
  }

  function buildParts(u, source) {
    const reset = resetLabelParts(u, source);
    if (reset) return reset;
    return splitSerialized(source, 1000).map((text) => ({
      text: text,
      translated: null,
      state: 0,
      unit: u
    }));
  }

  function resetForSource(u, serialized) {
    // Downstream keys use the normalised source; the DOM keeps its whitespace.
    const source = normalizeSource(serialized.text);
    const edge = u.mode === 'swap' ? splitEdgeTokens(source) : { text: source, lead: '', trail: '' };
    u.refs = serialized.refs;
    u.segs = serialized.segs;
    u.source = source;
    u.sourceHash = hash32(source);
    u.leadTokens = edge.lead;
    u.trailTokens = edge.trail;
    u.translatedOk = false;
    u.noop = false;
    u.rendered = false;
    u.appliedShowOrig = null;
    u.hoverOrig = false;
    u.tapOrig = false;
    if (u.hoverTimer) {
      clearTimeout(u.hoverTimer);
      u.hoverTimer = 0;
    }
    if (u.leaveTimer) {
      clearTimeout(u.leaveTimer);
      u.leaveTimer = 0;
    }
    if (u.clone) {
      try {
        u.clone.remove();
      } catch (_) {
        /* ignore */
      }
      u.clone = null;
    }
    try {
      u.el.removeAttribute(ATTR_ORIG);
      u.el.removeAttribute(ATTR_SWAPPED);
      u.el.setAttribute(ATTR_UNIT, String(u.id));
    } catch (_) {
      /* ignore */
    }
    // u.source keeps the edge tokens for the no-op comparison; requests do not.
    if (!isTranslatable(edge.text)) {
      u.skip = true;
      u.parts = [];
      return;
    }
    u.skip = false;
    u.parts = buildParts(u, edge.text);
    for (const part of u.parts) enqueuePart(u, part);
  }

  function processHost(el, mode, surface, atomic) {
    const atomics = atomic || [];
    // A settings title is a unit of its title text only; the rest of the row is
    // other units or excluded.
    const titleUnit = surface === 'settings' && isTitleHost(el);
    let u = state.unitByHost.get(el);
    if (!el.isConnected) {
      if (u) dropUnit(u);
      return;
    }
    // A name unit is name text only; refuse an icon, ribbon or metadata host
    // even if a caller ever hands one over.
    if (surface === 'name' && !nameHostClean(el)) {
      if (u) dropUnit(u);
      return;
    }
    // A title stripped down to the hidden copy keeps no unit.
    if (titleUnit && !isTranslatable(normalizeSource(titleHostText(el, atomics)))) {
      if (u) dropUnit(u);
      return;
    }
    // A hidden copy moved inside a title is no longer a unit.
    if (isAriaCopy(el, false)) {
      if (u) dropUnit(u);
      return;
    }
    if (!u) {
      u = makeUnit(el, mode, surface);
    } else {
      u.surface = surface;
    }

    if (u.mode !== mode) {
      if (u.mode === 'swap') restoreSwapText(u);
      if (u.clone) {
        try {
          u.clone.remove();
        } catch (_) {
          /* ignore */
        }
        u.clone = null;
      }
      u.rendered = false;
      try {
        u.el.removeAttribute(ATTR_ORIG);
      } catch (_) {
        /* ignore */
      }
    }
    u.mode = mode;

    let serialized = null;
    if (mode === 'swap' && u.segs && u.segs.length) {
      if (!swapChanged(u)) {
        ensureUnitRendered(u, true);
        return;
      }
      restoreSwapText(u);
      serialized = titleUnit ? serializeTitleHost(el, atomics) : serializeHost(el, 'swap', atomics, false);
    } else {
      serialized = titleUnit ? serializeTitleHost(el, atomics) : serializeHost(el, mode, atomics, false);
    }

    const hash = hash32(normalizeSource(serialized.text));
    if (u.sourceHash === hash && (u.translatedOk || u.parts.length)) {
      const refsSame = refsEqual(u.refs, serialized.refs);
      u.refs = serialized.refs;
      u.segs = serialized.segs;
      if (mode === 'swap') {
        // React replaced the text nodes with identical text: remap the outputs.
        if (u.translatedOk && !u.noop && u.parts.length) {
          computeSwapOutputs(u);
          u.rendered = true;
          state.unitByDisplay.set(el, u);
        }
        ensureUnitRendered(u, true);
        return;
      }
      if (!refsSame && u.rendered) {
        if (u.clone) {
          try {
            u.clone.remove();
          } catch (_) {
            /* ignore */
          }
          u.clone = null;
        }
        u.rendered = false;
        try {
          u.el.removeAttribute(ATTR_ORIG);
        } catch (_) {
          /* ignore */
        }
        scheduleRender(u);
      } else {
        ensureUnitRendered(u, true);
      }
      return;
    }

    resetForSource(u, serialized);
  }

  function refsEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function dropUnit(u) {
    if (!u) return;
    if (u.hoverTimer) clearTimeout(u.hoverTimer);
    if (u.leaveTimer) clearTimeout(u.leaveTimer);
    u.hoverTimer = 0;
    u.leaveTimer = 0;
    try {
      if (u.mode === 'swap') restoreSwapText(u);
      if (u.clone) u.clone.remove();
      if (u.el) {
        u.el.removeAttribute(ATTR_ORIG);
        u.el.removeAttribute(ATTR_SWAPPED);
        u.el.removeAttribute(ATTR_UNIT);
      }
    } catch (_) {
      /* ignore */
    }
    if (u.clone) state.unitByDisplay.delete(u.clone);
    u.clone = null;
    if (u.el) {
      state.unitByHost.delete(u.el);
      state.unitByDisplay.delete(u.el);
    }
    state.units.delete(u);
    state.renderQueue.delete(u);
  }

  function teardownAll() {
    for (const u of Array.from(state.units)) dropUnit(u);
    state.queue.length = 0;
    // The dedupe map is keyed by language/provider, so a rebuild must not reuse it.
    state.textEntries.clear();
    state.renderQueue.clear();
    if (state.flushTimer) {
      clearTimeout(state.flushTimer);
      state.flushTimer = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Translation queue
  // ---------------------------------------------------------------------------

  // The provider actually serving requests right now. A failed LLM session
  // falls back to Edge and never retries the LLM until the page reloads.
  function activeProvider() {
    return state.provider === 'llm' && !state.llmFallback ? 'llm' : 'edge';
  }

  function llmConfigured() {
    const s = state.settings;
    return !!(String(s.llmBaseUrl || '').trim() && String(s.llmModel || '').trim());
  }

  // Settings JSON has no glossary key yet; read it when a build adds one.
  // Entries are `source=target` strings (also accept an object map).
  function glossaryEntries() {
    const raw = state.settings.glossary;
    const out = [];
    const seen = new Set();
    const add = (src, dst) => {
      const a = String(src == null ? '' : src).trim();
      const b = String(dst == null ? '' : dst).trim();
      if (!a || !b) return;
      const key = a.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push([a, b]);
    };
    if (Array.isArray(raw)) {
      for (const item of raw) {
        const line = String(item == null ? '' : item).trim();
        if (!line) continue;
        const at = line.indexOf('=');
        if (at <= 0) continue;
        add(line.slice(0, at), line.slice(at + 1));
      }
    } else if (raw && typeof raw === 'object') {
      for (const key of Object.keys(raw)) add(key, raw[key]);
    }
    return out;
  }

  function glossarySignature(settings) {
    const raw = settings && settings.glossary;
    if (!Array.isArray(raw)) return raw && typeof raw === 'object' ? JSON.stringify(raw) : '';
    return raw.map((item) => String(item == null ? '' : item).trim()).filter(Boolean).join('\u0001');
  }

  function glossaryObject(entries) {
    const out = {};
    for (const [src, dst] of entries) out[src] = dst;
    return out;
  }

  function buildLlmSystemPrompt(entries) {
    const lines = [
      'You are a translation API. Translate every input segment into ' +
        (state.targetLang || 'the target language') + '.',
      'Return one raw JSON object and nothing else: {"translations":[{"id":<n>,"text":"<translation>"}]}',
      'No prose, no explanations, no markdown and no code fences.',
      'Keep every placeholder exactly as given: {{n}} atomic tokens and <n>...</n> structural tags ' +
        '(also written <n>…</n>). Never translate, rename, drop, duplicate or reorder them.',
      'Translate only human-readable text. Never translate code, identifiers, URLs, version numbers, ' +
        'or text that is already in the target language.',
      'Keep the id, count and order of the input segments.'
    ];
    if (entries.length) {
      lines.push('Glossary (mandatory, takes priority over any other wording; apply every glossary entry):');
      for (const [src, dst] of entries) lines.push('- ' + src + '=' + dst);
    }
    return lines.join('\n');
  }

  function llmUrl() {
    const base = String(state.settings.llmBaseUrl || '').trim().replace(/\/+$/, '');
    if (!base) return '';
    return base + '/chat/completions';
  }

  function buildLlmBody(entries) {
    const glossary = glossaryEntries();
    const user = {
      targetLanguage: state.targetLang,
      segments: entries.map((entry, index) => ({ id: index + 1, text: entry.text }))
    };
    if (glossary.length) user.glossary = glossaryObject(glossary);
    return JSON.stringify({
      model: String(state.settings.llmModel || '').trim(),
      temperature: 0,
      messages: [
        { role: 'system', content: buildLlmSystemPrompt(glossary) },
        { role: 'user', content: JSON.stringify(user) }
      ]
    });
  }

  function warnLlmOnce(why) {
    if (state.llmWarned) return;
    state.llmWarned = true;
    log(
      'llm: ' + why + '; falling back to Edge (Edge fallback)' +
      (state.llmFallback ? ' for this session' : ' for these segments')
    );
  }

  function disableLlm(why) {
    state.llmFallback = true;
    warnLlmOnce(why);
  }

  // A part's output, composing the cached tail for a reset label.
  function partOutput(p) {
    if (!p || p.translated == null) return null;
    if (p.tailTranslated != null) return p.translated + p.sep + p.tailTranslated;
    return p.translated;
  }

  // The unit's rendered text including edge tokens, for the no-op comparison.
  function unitOutput(u) {
    if (!u || !u.parts) return '';
    return (u.leadTokens || '') + u.parts.map((p) => partOutput(p) || '').join('') + (u.trailTokens || '');
  }

  // A string already known this session (completed entry, then the persistent
  // cache); used so a reset label never disagrees with the option label.
  function lookupTranslation(text) {
    const entry = state.textEntries.get(text);
    if (entry && entry.state === 3 && typeof entry.translated === 'string') return entry.translated;
    return cacheGet(text);
  }

  function attachPart(entry, u, part) {
    part.entry = entry;
    if (entry.state === 3) {
      // Already translated: fan the result out, no request and no bookkeeping.
      part.translated = entry.translated;
      part.state = 3;
      state.stats.cacheHits++;
      maybeFinishUnit(u);
      return;
    }
    if (entry.state === 4) {
      part.state = 4;
      return;
    }
    entry.parts.push(part);
    part.state = 1;
  }

  function enqueuePart(u, part) {
    if (!state.enabled) return;
    if (!state.targetLang) {
      part.state = 4;
      return;
    }
    const provider = activeProvider();
    const text = part.text;
    const existing = state.textEntries.get(text);
    if (existing) {
      // The same normalised string as another unit: share its request and result.
      attachPart(existing, u, part);
      return;
    }
    const cached = cacheGet(text, provider);
    if (cached !== undefined) {
      const hit = { text: text, state: 3, translated: cached, parts: [], provider: provider };
      state.textEntries.set(text, hit);
      attachPart(hit, u, part);
      return;
    }
    state.stats.cacheMisses++;
    const entry = { text: text, state: 1, translated: null, parts: [], provider: provider };
    state.textEntries.set(text, entry);
    attachPart(entry, u, part);
    state.queue.push(entry);
    scheduleFlush();
  }

  function scheduleFlush() {
    if (state.flushTimer) return;
    const ms = clamp(state.settings.batchIntervalMs, 0, 10000);
    state.flushTimer = setTimeout(() => {
      state.flushTimer = 0;
      safe(flushQueue, 'flush');
    }, ms);
  }

  function flushQueue() {
    if (!state.enabled || !state.targetLang) return;
    const s = state.settings;
    // The LLM protocol is capped harder than Edge: 12 segments / 6000 chars.
    const llm = activeProvider() === 'llm';
    const maxSegments = llm ? Math.min(s.batchSize, LLM_MAX_SEGMENTS) : s.batchSize;
    const maxChars = llm ? Math.min(s.batchChars, LLM_MAX_CHARS) : s.batchChars;
    while (state.queue.length && state.inflight < s.concurrency) {
      const batch = [];
      let chars = 0;
      while (state.queue.length && batch.length < maxSegments) {
        // The queue holds distinct normalised strings only.
        const entry = state.queue[0];
        if (batch.length && chars + entry.text.length > maxChars) break;
        state.queue.shift();
        batch.push(entry);
        chars += entry.text.length;
      }
      if (!batch.length) break;
      state.inflight++;
      state.stats.batches++;
      const epoch = state.epoch;
      runBatch(batch, epoch)
        .catch((e) => problem('batch: ' + (e && e.message ? e.message : e)))
        .finally(() => {
          state.inflight--;
          safe(flushQueue, 'flush-next');
        });
    }
    if (state.queue.length) scheduleFlush();
  }

  function finishEntry(entry, translated, provider) {
    entry.translated = translated;
    entry.state = 3;
    entry.provider = provider || activeProvider();
    cacheSet(entry.text, translated, entry.provider);
    state.stats.translations++;
    const units = new Set();
    const live = [];
    for (const p of entry.parts) {
      p.translated = translated;
      p.state = 3;
      // A part whose unit was dropped or re-sourced is dead: release it.
      if (p.unit && p.unit.parts && p.unit.parts.indexOf(p) !== -1) {
        live.push(p);
        units.add(p.unit);
      }
    }
    entry.parts = live;
    for (const u of units) maybeFinishUnit(u);
  }

  function failEntry(entry) {
    entry.state = 4;
    for (const p of entry.parts) p.state = 4;
    entry.parts = [];
    // Forget the failed string so a later unit may retry it.
    if (state.textEntries.get(entry.text) === entry) state.textEntries.delete(entry.text);
  }

  async function runBatch(entries, epoch) {
    const provider = activeProvider();
    const chunkSize = provider === 'llm' ? LLM_MAX_SEGMENTS : 10;
    for (let i = 0; i < entries.length; i += chunkSize) {
      if (!state.enabled || state.epoch !== epoch) return;
      const chunk = entries.slice(i, i + chunkSize);
      if (provider === 'llm' && !state.llmFallback) {
        const result = await translateLlmBatch(chunk, epoch);
        if (!result) return; // disabled or epoch changed
        if (result.texts && result.texts.length === chunk.length) {
          const missing = [];
          for (let j = 0; j < chunk.length; j++) {
            if (result.texts[j] != null) finishEntry(chunk[j], result.texts[j], 'llm');
            else missing.push(chunk[j]);
          }
          if (missing.length) {
            // Valid ids keep their LLM text; the omitted ones go to Edge.
            warnLlmOnce('reply omitted ' + missing.length + ' segment(s)');
            await runEdgeEntries(missing, epoch);
          }
          continue;
        }
        // Network error, non-2xx, unparseable reply or no id matched: this
        // batch goes to Edge and the rest of the session stays there.
        disableLlm(result.why || 'request failed');
        state.stats.batchesFailed++;
        state.stats.errors++;
        await runEdgeEntries(chunk, epoch);
        continue;
      }
      await runEdgeEntries(chunk, epoch);
    }
  }

  async function runEdgeEntries(entries, epoch) {
    if (!entries.length) return;
    const texts = entries.map((e) => e.text);
    let translated = null;
    try {
      translated = await translateEdgeChunk(texts, epoch);
    } catch (_) {
      translated = null;
    }
    if (state.epoch !== epoch) return;
    if (!translated || translated.length !== entries.length) {
      for (const e of entries) failEntry(e);
      state.stats.batchesFailed++;
      state.stats.errors++;
      return;
    }
    for (let j = 0; j < entries.length; j++) finishEntry(entries[j], translated[j], 'edge');
  }

  const EDGE_URL =
    'https://edge.microsoft.com/translate/translatetext?from=&to=';
  const LLM_MAX_SEGMENTS = 12;
  const LLM_MAX_CHARS = 6000;

  async function translateEdgeChunk(texts, epoch) {
    const url = EDGE_URL + encodeURIComponent(state.targetLang) + '&isEnterpriseClient=false';
    let why = '';
    for (let attempt = 0; attempt <= 2; attempt++) {
      if (!state.enabled || state.epoch !== epoch) return null;
      const res = await httpRequest({
        method: 'POST',
        url: url,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(texts)
      });
      if (!state.enabled || state.epoch !== epoch) return null;
      if (res.error === 0 && res.status === 200) {
        const parsed = parseEdgeResponse(res.body, texts.length);
        if (parsed) return parsed;
        why = 'malformed response';
        problem('edge: malformed response');
        break;
      }
      why = 'status=' + res.status + ' error=' + res.error;
      const retryable =
        res.error !== 0 || res.status === 429 || (res.status >= 500 && res.status <= 599);
      if (!retryable) break;
      if (attempt < 2) await sleep(400 * Math.pow(2, attempt) + Math.random() * 200);
    }
    problem('edge failed: ' + why);
    return null;
  }

  async function translateLlmBatch(entries, epoch) {
    const url = llmUrl();
    if (!url) return { why: 'no LLM endpoint configured', texts: null };
    const body = buildLlmBody(entries);
    if (state.settings.debug) {
      // Debug only, truncated; the API key never exists on this side. Strip a
      // query string so a key embedded in the base URL cannot leak either.
      const logUrl = url.replace(/[?#].*$/, '');
      log('llm POST ' + logUrl + ' body=' + body.slice(0, 240) + (body.length > 240 ? '...' : ''));
    }
    let why = '';
    for (let attempt = 0; attempt <= 1; attempt++) {
      if (!state.enabled || state.epoch !== epoch) return null;
      if (state.llmFallback) return { why: 'fallback active', texts: null };
      // No Authorization header here: the page never sees the key; the mod
      // injects it for the llmBaseUrl host (docs/PROTOCOL.md).
      const res = await httpRequest({
        method: 'POST',
        url: url,
        headers: { 'Content-Type': 'application/json' },
        body: body
      });
      if (!state.enabled || state.epoch !== epoch) return null;
      if (res.error === 0 && res.status >= 200 && res.status < 300) {
        const map = parseLlmReply(res.body, entries.length);
        if (map && map.size) {
          const texts = entries.map((entry, index) => (map.has(index + 1) ? map.get(index + 1) : null));
          return { why: '', texts: texts };
        }
        why = map ? 'reply had no usable translations' : 'unparseable reply';
        break;
      }
      why = 'status=' + res.status + ' error=' + res.error;
      // -2 is the page-side timeout; 12002 is ERROR_WINHTTP_TIMEOUT from the
      // mod. Other transport errors fall back without a retry.
      const retryable =
        res.error === -2 || res.error === 12002 ||
        res.status === 429 || (res.status >= 500 && res.status <= 599);
      if (!retryable || attempt >= 1) break;
      log('llm retry after ' + why);
      await sleep(400 + Math.random() * 200);
    }
    return { why: why, texts: null };
  }

  // The chat reply's message content may be fenced or surrounded by prose;
  // only the first `{` through the last `}` is the JSON object.
  function llmContent(outer) {
    if (!outer || typeof outer !== 'object') return null;
    // Some OpenAI-compatible proxies answer with the object itself.
    if (Array.isArray(outer.translations)) return JSON.stringify(outer);
    const choice = Array.isArray(outer.choices) ? outer.choices[0] : null;
    const message = choice && choice.message ? choice.message : null;
    if (!message) return null;
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.content)) {
      let out = '';
      for (const part of message.content) if (part && typeof part.text === 'string') out += part.text;
      return out;
    }
    return null;
  }

  function parseLlmReply(body, count) {
    let outer = null;
    try {
      outer = JSON.parse(body);
    } catch (_) {
      outer = null;
    }
    // Prefer the chat envelope's message content; a proxy may also answer with
    // the JSON object or a fenced block as the raw body.
    let content = outer ? llmContent(outer) : null;
    if (content == null) content = String(body == null ? '' : body);
    const first = content.indexOf('{');
    const last = content.lastIndexOf('}');
    if (first === -1 || last <= first) return null;
    let data = null;
    try {
      data = JSON.parse(content.slice(first, last + 1));
    } catch (_) {
      return null;
    }
    if (!data || !Array.isArray(data.translations)) return null;
    const map = new Map();
    for (const item of data.translations) {
      if (!item) continue;
      const id = Number(item.id);
      if (!isFinite(id) || id < 1 || id > count) continue;
      if (typeof item.text !== 'string' || !item.text.trim()) continue;
      if (!map.has(id)) map.set(id, item.text);
    }
    return map;
  }

  function parseEdgeResponse(body, count) {
    let data;
    try {
      data = JSON.parse(body);
    } catch (_) {
      return null;
    }
    if (!Array.isArray(data) || data.length < count) return null;
    const out = [];
    for (let i = 0; i < count; i++) {
      const item = data[i];
      const first = item && Array.isArray(item.translations) ? item.translations[0] : null;
      if (!first || typeof first.text !== 'string') return null;
      out.push(first.text);
    }
    return out;
  }

  function maybeFinishUnit(u) {
    if (!u || !u.parts || !u.parts.length) return;
    for (const p of u.parts) if (p.state !== 3) return;
    u.translatedOk = true;
    u.noop = unitOutput(u) === u.source;
    if (u.noop) {
      u.rendered = false;
      return;
    }
    scheduleRender(u);
  }

  // ---------------------------------------------------------------------------
  // Cache (localStorage, keyed by provider|model|lang|hash, 3 MB LRU)
  // ---------------------------------------------------------------------------

  // v1 keys were keyed by raw whitespace and may hold a different wording, so
  // they are purged rather than read. v3 adds provider and model to every key.
  const CACHE_ROOT = 'whtr1|';
  const CACHE_VERSION = 'v3';
  const CACHE_PREFIX = CACHE_ROOT + CACHE_VERSION + '|';
  const CACHE_LIMIT = 3 * 1024 * 1024;
  const CACHE_TARGET = Math.floor(CACHE_LIMIT * 0.8);
  let cacheIndex = null;
  let cacheTotal = 0;
  let cacheWarned = false;

  function storage() {
    try {
      return window.localStorage || null;
    } catch (_) {
      return null;
    }
  }

  function cacheKey(text, provider) {
    const p = provider || activeProvider();
    return (
      CACHE_PREFIX + p + '|' + String(state.settings.llmModel || '').trim() + '|' + state.targetLang + '|' +
      hash32(text) + '|' + text.length
    );
  }

  function cacheTtlMs() {
    const days = clamp(state.settings.cacheTtlDays, 0, 3650);
    return days > 0 ? days * 86400000 : 0;
  }

  function cacheEnsureIndex() {
    if (cacheIndex) return;
    cacheIndex = new Map();
    cacheTotal = 0;
    const ls = storage();
    if (!ls) return;
    const keys = [];
    const stale = [];
    try {
      for (let i = 0; i < ls.length; i++) {
        const key = ls.key(i);
        if (!key || key.indexOf(CACHE_ROOT) !== 0) continue;
        if (key.indexOf(CACHE_PREFIX) === 0) keys.push(key);
        else stale.push(key);
      }
    } catch (_) {
      return;
    }
    for (const key of stale) {
      try {
        ls.removeItem(key);
      } catch (_) {
        /* ignore */
      }
    }
    for (const key of keys) {
      let value = null;
      try {
        value = ls.getItem(key);
      } catch (_) {
        value = null;
      }
      if (value == null) continue;
      let rec = null;
      try {
        rec = JSON.parse(value);
      } catch (_) {
        rec = null;
      }
      if (!rec || typeof rec.t !== 'string' || typeof rec.at !== 'number') {
        try {
          ls.removeItem(key);
        } catch (_) {
          /* ignore */
        }
        continue;
      }
      const bytes = (key.length + value.length) * 2;
      cacheIndex.set(key, { bytes: bytes, at: rec.at, used: rec.used || rec.at });
      cacheTotal += bytes;
    }
  }

  function cacheGet(text, provider) {
    if (!state.settings.cacheEnabled) return undefined;
    const ls = storage();
    if (!ls) return undefined;
    cacheEnsureIndex();
    const key = cacheKey(text, provider);
    let raw = null;
    try {
      raw = ls.getItem(key);
    } catch (_) {
      return undefined;
    }
    if (raw == null) return undefined;
    let rec = null;
    try {
      rec = JSON.parse(raw);
    } catch (_) {
      rec = null;
    }
    if (!rec || typeof rec.t !== 'string' || typeof rec.at !== 'number') {
      try {
        ls.removeItem(key);
      } catch (_) {
        /* ignore */
      }
      const old = cacheIndex.get(key);
      if (old) {
        cacheTotal -= old.bytes;
        cacheIndex.delete(key);
      }
      return undefined;
    }
    const ttl = cacheTtlMs();
    if (ttl > 0 && Date.now() - rec.at > ttl) {
      try {
        ls.removeItem(key);
      } catch (_) {
        /* ignore */
      }
      const old = cacheIndex.get(key);
      if (old) {
        cacheTotal -= old.bytes;
        cacheIndex.delete(key);
      }
      return undefined;
    }
    // LRU touch at most once an hour to keep writes rare.
    const used = rec.used || rec.at;
    if (Date.now() - used > 3600000) {
      rec.used = Date.now();
      try {
        ls.setItem(key, JSON.stringify(rec));
      } catch (_) {
        /* ignore */
      }
    }
    const info = cacheIndex.get(key);
    if (info) info.used = Date.now();
    return rec.t;
  }

  function cacheSet(text, translated, provider) {
    if (!state.settings.cacheEnabled) return;
    if (typeof translated !== 'string') return;
    const ls = storage();
    if (!ls) return;
    cacheEnsureIndex();
    const key = cacheKey(text, provider);
    const value = JSON.stringify({ t: translated, at: Date.now(), used: Date.now() });
    try {
      ls.setItem(key, value);
    } catch (e) {
      if (!cacheWarned) {
        cacheWarned = true;
        log('cache write failed: ' + (e && e.message ? e.message : e));
      }
      cacheTrimHard();
      try {
        ls.setItem(key, value);
      } catch (_) {
        return;
      }
    }
    const old = cacheIndex.get(key);
    if (old) cacheTotal -= old.bytes;
    const bytes = (key.length + value.length) * 2;
    cacheIndex.set(key, { bytes: bytes, at: Date.now(), used: Date.now() });
    cacheTotal += bytes;
    if (cacheTotal > CACHE_LIMIT) cacheTrim(CACHE_TARGET);
  }

  function cacheTrim(limit) {
    if (!cacheIndex) return;
    const ls = storage();
    if (!ls) return;
    const ttl = cacheTtlMs();
    const now = Date.now();
    const entries = Array.from(cacheIndex.entries()).sort((a, b) => {
      return (a[1].used || a[1].at) - (b[1].used || b[1].at);
    });
    for (const [key, info] of entries) {
      const expired = ttl > 0 && now - info.at > ttl;
      if (!expired && cacheTotal <= limit) break;
      try {
        ls.removeItem(key);
      } catch (_) {
        /* ignore */
      }
      cacheIndex.delete(key);
      cacheTotal -= info.bytes;
    }
  }

  function cacheTrimHard() {
    if (!cacheIndex) return;
    const ls = storage();
    if (!ls) return;
    const entries = Array.from(cacheIndex.entries()).sort((a, b) => {
      return (a[1].used || a[1].at) - (b[1].used || b[1].at);
    });
    const target = Math.floor(cacheTotal / 2);
    for (const [key, info] of entries) {
      if (cacheTotal <= target) break;
      try {
        ls.removeItem(key);
      } catch (_) {
        /* ignore */
      }
      cacheIndex.delete(key);
      cacheTotal -= info.bytes;
    }
  }

  function cacheClear() {
    const ls = storage();
    cacheIndex = new Map();
    cacheTotal = 0;
    // Completed in-session entries are part of the cache; in-flight ones stay.
    for (const [text, entry] of Array.from(state.textEntries)) {
      if (entry.state === 3) state.textEntries.delete(text);
    }
    if (!ls) return;
    const keys = [];
    try {
      for (let i = 0; i < ls.length; i++) {
        const key = ls.key(i);
        if (key && key.indexOf(CACHE_ROOT) === 0) keys.push(key);
      }
    } catch (_) {
      return;
    }
    for (const key of keys) {
      try {
        ls.removeItem(key);
      } catch (_) {
        /* ignore */
      }
    }
    log('cache cleared');
  }

  // ---------------------------------------------------------------------------
  // Rendering: clone mode
  // ---------------------------------------------------------------------------

  function sanitizeClone(el) {
    try {
      if (el.removeAttribute) {
        el.removeAttribute('id');
        el.removeAttribute('data-testid');
        el.removeAttribute(ATTR_UNIT);
        el.removeAttribute(ATTR_CLONE);
        el.removeAttribute(ATTR_ORIG);
        el.removeAttribute(ATTR_SWAPPED);
      }
      let all = [];
      try {
        all = el.querySelectorAll('[id], [data-testid]');
      } catch (_) {
        all = [];
      }
      for (const node of all) {
        node.removeAttribute('id');
        node.removeAttribute('data-testid');
      }
    } catch (_) {
      /* ignore */
    }
  }

  function cloneForDisplay(el) {
    const copy = el.cloneNode(true);
    sanitizeClone(copy);
    return copy;
  }

  function cloneShell(el) {
    const copy = el.cloneNode(false);
    sanitizeClone(copy);
    return copy;
  }

  function buildFragment(src, refs) {
    const frag = document.createDocumentFragment();
    const stack = [{ node: frag, index: -1 }];
    const used = new Set();
    let buf = '';
    let last = 0;
    const flush = () => {
      if (!buf) return;
      const top = stack[stack.length - 1];
      try {
        top.node.appendChild(document.createTextNode(buf));
      } catch (_) {
        /* ignore */
      }
      buf = '';
    };
    const re = /\{\{(\d+)\}\}|<(\/?)(\d+)>/g;
    let m;
    while ((m = re.exec(src))) {
      buf += src.slice(last, m.index);
      last = re.lastIndex;
      if (m[1] !== undefined) {
        const index = Number(m[1]);
        const el = refs[index];
        if (el && !used.has(index)) {
          used.add(index);
          flush();
          try {
            stack[stack.length - 1].node.appendChild(cloneForDisplay(el));
          } catch (_) {
            /* ignore */
          }
        }
        // Unknown / repeated placeholders are dropped, as agreed.
      } else if (m[2] === '/') {
        const index = Number(m[3]);
        let k = stack.length - 1;
        while (k > 0 && stack[k].index !== index) k--;
        if (k > 0) {
          flush();
          stack.length = k;
        }
      } else {
        const index = Number(m[3]);
        const el = refs[index];
        flush();
        if (el && !used.has(index) && stack.length < 200) {
          used.add(index);
          const shell = cloneShell(el);
          try {
            stack[stack.length - 1].node.appendChild(shell);
          } catch (_) {
            /* ignore */
          }
          stack.push({ node: shell, index: index });
        } else {
          // Transparent frame: interior text still lands in the current parent.
          stack.push({ node: stack[stack.length - 1].node, index: -2 });
        }
      }
    }
    buf += src.slice(last);
    flush();
    return frag;
  }

  function buildClone(u) {
    const clone = cloneShell(u.el);
    clone.setAttribute(ATTR_CLONE, '1');
    clone.setAttribute(ATTR_UNIT, String(u.id));
    for (const part of u.parts) {
      const text = partOutput(part);
      if (text == null) continue;
      try {
        clone.appendChild(buildFragment(text, u.refs));
      } catch (e) {
        problem('build clone: ' + (e && e.message ? e.message : e));
      }
    }
    return clone;
  }

  function ensureCloneAttached(u) {
    if (!u.clone) return false;
    const parent = u.el.parentNode;
    if (!parent) return false;
    if (u.clone.parentNode !== parent || u.clone.nextSibling !== u.el) {
      try {
        parent.insertBefore(u.clone, u.el);
      } catch (_) {
        return false;
      }
    }
    state.unitByDisplay.set(u.clone, u);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Rendering: swap mode
  // ---------------------------------------------------------------------------

  function edgeSpaces(original, text) {
    if (!text) return '';
    const lead = /^\s/.test(original);
    const trail = /\s$/.test(original);
    let out = text.trim();
    if (!out) return '';
    if (lead && !/^\s/.test(out)) out = ' ' + out;
    if (trail && !/\s$/.test(out)) out = out + ' ';
    return out;
  }

  function distribute(text, segs) {
    if (!segs || !segs.length) return;
    if (!text) {
      for (const seg of segs) seg.out = '';
      return;
    }
    // Whitespace-only nodes must not receive part of the translation.
    let targets = segs.filter((seg) => /[^\s]/.test(seg.orig || ''));
    if (!targets.length) targets = segs;
    for (const seg of segs) if (targets.indexOf(seg) === -1) seg.out = seg.orig;
    if (targets.length === 1) {
      targets[0].out = edgeSpaces(targets[0].orig, text);
      return;
    }
    let total = 0;
    for (const seg of targets) total += Math.max(1, (seg.orig || '').length);
    const chars = Array.from(text);
    let index = 0;
    let acc = 0;
    for (let i = 0; i < targets.length; i++) {
      const seg = targets[i];
      acc += Math.max(1, (seg.orig || '').length);
      let end = i === targets.length - 1 ? chars.length : Math.round((chars.length * acc) / total);
      if (end < index) end = index;
      const piece = chars.slice(index, end).join('');
      index = end;
      seg.out = edgeSpaces(seg.orig, piece);
    }
  }

  function computeSwapOutputs(u) {
    const source =
      (u.leadTokens || '') + u.parts.map((p) => partOutput(p) || '').join('') + (u.trailTokens || '');
    const groups = [[]];
    for (const seg of u.segs) {
      if (seg.kind === 'token') groups.push([]);
      else groups[groups.length - 1].push(seg);
    }

    const chunks = [];
    let current = '';
    let tokenCount = 0;
    const used = new Set();
    const re = /\{\{(\d+)\}\}/g;
    let last = 0;
    let m;
    while ((m = re.exec(source))) {
      current += source.slice(last, m.index);
      last = re.lastIndex;
      const index = Number(m[1]);
      if (u.refs[index] && !used.has(index)) {
        used.add(index);
        chunks.push(current);
        current = '';
        tokenCount++;
      }
      // A token we cannot restore is dropped from the text stream.
    }
    current += source.slice(last);
    chunks.push(current);

    if (tokenCount === 0) {
      // The translation lost every placeholder: spread it over the whole host.
      const all = [];
      for (const group of groups) for (const seg of group) all.push(seg);
      distribute(chunks[0] || '', all);
      return;
    }

    for (let g = 0; g < groups.length; g++) {
      let text = g < chunks.length ? chunks[g] : '';
      if (g === groups.length - 1 && chunks.length > groups.length) {
        text += chunks.slice(groups.length).join('');
      }
      distribute(text, groups[g]);
    }
  }

  function applySwapText(u) {
    for (const seg of u.segs) {
      if (seg.kind !== 'text') continue;
      const node = seg.node;
      if (!node || !node.isConnected) continue;
      const want = seg.out == null ? seg.orig : seg.out;
      if (node.nodeValue === want) continue;
      // A third value means React re-rendered the node; let the observer rescan.
      if (node.nodeValue !== seg.orig && node.nodeValue !== seg.out) continue;
      node.nodeValue = want;
      state.written.set(node, want);
    }
  }

  function swapOutputsReady(u) {
    return u.parts.length > 0 && u.parts.every((p) => partOutput(p) != null);
  }

  // ---------------------------------------------------------------------------
  // Rendering: shared
  // ---------------------------------------------------------------------------

  function scheduleRender(u) {
    if (!u) return;
    state.renderQueue.add(u);
    if (state.renderScheduled) return;
    state.renderScheduled = true;
    idle(() => {
      state.renderScheduled = false;
      safe(runRenderChunk, 'render-chunk');
    });
  }

  function runRenderChunk(deadline) {
    let n = 0;
    for (const u of Array.from(state.renderQueue)) {
      state.renderQueue.delete(u);
      if (u.el && u.el.isConnected) safe(() => renderUnit(u), 'render-unit');
      n++;
      const left = deadline && typeof deadline.timeRemaining === 'function' ? deadline.timeRemaining() : 8;
      if (n >= 30 || left < 2) break;
    }
    if (state.renderQueue.size) scheduleRenderIdle();
  }

  function scheduleRenderIdle() {
    if (state.renderScheduled) return;
    state.renderScheduled = true;
    idle(() => {
      state.renderScheduled = false;
      safe(runRenderChunk, 'render-chunk2');
    });
  }

  function renderUnit(u) {
    if (!state.enabled || !u || !u.el || !u.el.isConnected) return;
    if (!u.translatedOk || u.noop || u.skip) return;
    if (u.mode === 'clone') {
      if (!u.clone) {
        u.clone = buildClone(u);
        state.unitByDisplay.set(u.clone, u);
        state.unitByDisplay.set(u.el, u);
      }
      if (!ensureCloneAttached(u)) return;
      u.rendered = true;
      applyUnit(u, true);
      return;
    }
    if (!swapOutputsReady(u)) return;
    if (swapChanged(u)) {
      // React rewrote the host while the request was in flight; rescan instead.
      scheduleScan(120);
      return;
    }
    computeSwapOutputs(u);
    u.rendered = true;
    state.unitByDisplay.set(u.el, u);
    applyUnit(u, true);
  }

  function ensureUnitRendered(u, force) {
    if (!u || !u.el || !u.el.isConnected) return;
    if (u.mode === 'clone') {
      if (u.rendered && u.clone && u.clone.isConnected) {
        ensureCloneAttached(u);
        applyUnit(u, !!force);
      } else if (u.translatedOk && !u.noop) {
        scheduleRender(u);
      }
      return;
    }
    if (u.rendered) applyUnit(u, !!force);
  }

  function effectiveShowOrig(u) {
    return !state.enabled || u.hoverOrig || u.tapOrig;
  }

  function applyUnit(u, force) {
    if (!u || !u.el || !u.el.isConnected) return;
    const showOrig = effectiveShowOrig(u);
    if (!force && u.appliedShowOrig === showOrig) return;
    u.appliedShowOrig = showOrig;

    if (u.mode === 'clone') {
      if (!u.clone) return;
      try {
        u.clone.style.display = showOrig ? 'none' : '';
        if (showOrig) u.el.removeAttribute(ATTR_ORIG);
        else u.el.setAttribute(ATTR_ORIG, '1');
      } catch (_) {
        /* ignore */
      }
      return;
    }

    if (!u.rendered) return;
    if (showOrig) {
      for (const seg of u.segs) {
        if (seg.kind !== 'text') continue;
        const node = seg.node;
        if (!node || !node.isConnected) continue;
        const orig = state.origText.has(node) ? state.origText.get(node) : seg.orig;
        if (node.nodeValue === seg.out && node.nodeValue !== orig) {
          node.nodeValue = orig;
          state.written.set(node, orig);
        }
      }
      try {
        u.el.removeAttribute(ATTR_SWAPPED);
      } catch (_) {
        /* ignore */
      }
    } else {
      if (swapChanged(u)) {
        scheduleScan(120);
        return;
      }
      applySwapText(u);
      try {
        u.el.setAttribute(ATTR_SWAPPED, '1');
      } catch (_) {
        /* ignore */
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Pointer / touch interaction (delegated, one listener each)
  // ---------------------------------------------------------------------------

  function unitFromEvent(e) {
    let node = e && e.target;
    if (!node || node.nodeType !== 1) {
      node = node && node.parentElement ? node.parentElement : null;
    }
    while (node) {
      const u = state.unitByDisplay.get(node);
      if (u) return u;
      node = node.parentElement;
    }
    return null;
  }

  function withinUnit(u, node) {
    if (!u || !node || node.nodeType !== 1) return false;
    try {
      if (u.el && u.el.contains(node)) return true;
      if (u.clone && u.clone.contains(node)) return true;
    } catch (_) {
      /* ignore */
    }
    return false;
  }

  function onPointerOver(e) {
    if (!state.enabled) return;
    if (e.pointerType === 'touch') return;
    const u = unitFromEvent(e);
    if (!u) return;
    if (withinUnit(u, e.relatedTarget)) return;
    if (u.leaveTimer) {
      clearTimeout(u.leaveTimer);
      u.leaveTimer = 0;
    }
    if (u.hoverTimer) clearTimeout(u.hoverTimer);
    const delay = clamp(state.settings.hoverDelayMs, 0, 2000);
    if (delay <= 0) {
      u.hoverOrig = true;
      applyUnit(u);
      return;
    }
    u.hoverTimer = setTimeout(() => {
      u.hoverTimer = 0;
      safe(() => {
        u.hoverOrig = true;
        applyUnit(u);
      }, 'hover');
    }, delay);
  }

  function onPointerOut(e) {
    if (!state.enabled) return;
    if (e.pointerType === 'touch') return;
    const u = unitFromEvent(e);
    if (!u) return;
    if (withinUnit(u, e.relatedTarget)) return;
    if (u.hoverTimer) {
      clearTimeout(u.hoverTimer);
      u.hoverTimer = 0;
    }
    if (!u.hoverOrig) return;
    if (u.leaveTimer) clearTimeout(u.leaveTimer);
    // Short grace: hiding the clone must not immediately restart the hover loop.
    const grace = Math.max(120, clamp(state.settings.hoverDelayMs, 0, 2000));
    u.leaveTimer = setTimeout(() => {
      u.leaveTimer = 0;
      safe(() => {
        u.hoverOrig = false;
        applyUnit(u);
      }, 'hover-out');
    }, grace);
  }

  // ---------------------------------------------------------------------------
  // Touch: per-block single tap and the two-finger double tap.
  //
  // The single tap is deferred briefly so a second finger can cancel it. Two
  // pointers down and both lifted, twice within 400 ms, toggles translation
  // globally like the keyboard shortcut. Each pointer may wander at most 30 px.
  // ---------------------------------------------------------------------------

  const GESTURE_WINDOW_MS = 400;
  const GESTURE_SLOP_PX = 30;
  const TAP_SLOP_PX = 10;
  const SINGLE_TAP_DELAY_MS = 160;

  let touchStart = null;
  let pendingTapTimer = 0;
  const touchPointers = new Map(); // pointerId -> { x, y, at, moved, tapMoved }
  let twoFingerTap = null; // { ids: [id, id], at, ok }
  let lastTwoFingerTapAt = 0;

  function cancelPendingTap() {
    if (!pendingTapTimer) return;
    clearTimeout(pendingTapTimer);
    pendingTapTimer = 0;
  }

  function toggleTapOrig(u) {
    if (!state.enabled || !u || !u.el || !u.el.isConnected) return;
    u.tapOrig = !u.tapOrig;
    if (u.hoverTimer) {
      clearTimeout(u.hoverTimer);
      u.hoverTimer = 0;
    }
    u.hoverOrig = false;
    if (u.leaveTimer) {
      clearTimeout(u.leaveTimer);
      u.leaveTimer = 0;
    }
    applyUnit(u, true);
  }

  function queueSingleTap(u) {
    cancelPendingTap();
    pendingTapTimer = setTimeout(() => {
      pendingTapTimer = 0;
      safe(() => toggleTapOrig(u), 'tap');
    }, SINGLE_TAP_DELAY_MS);
  }

  function pointerDistance(start, e) {
    const dx = Number(e.clientX) - start.x;
    const dy = Number(e.clientY) - start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onPointerDown(e) {
    if (e.pointerType !== 'touch') return;
    // Gesture tracking runs whether or not translation is enabled; only the
    // per-block tap is gated on it. Any new touch cancels a queued tap.
    cancelPendingTap();
    if (isTypingTarget(e.target)) return;
    const now = Date.now();
    touchPointers.set(e.pointerId, {
      x: Number(e.clientX),
      y: Number(e.clientY),
      at: now,
      moved: false,
      tapMoved: false
    });
    if (touchPointers.size === 1) {
      touchStart = { x: Number(e.clientX), y: Number(e.clientY), t: now, id: e.pointerId };
      twoFingerTap = null;
      return;
    }
    // A second finger cancels the block tap the first one may have queued.
    touchStart = null;
    if (touchPointers.size === 2) {
      let at = now;
      for (const p of touchPointers.values()) at = Math.min(at, p.at);
      twoFingerTap = { ids: Array.from(touchPointers.keys()), at: at, ok: true };
    } else if (twoFingerTap) {
      twoFingerTap.ok = false;
    }
  }

  function onPointerMove(e) {
    if (e.pointerType !== 'touch') return;
    const start = touchPointers.get(e.pointerId);
    if (!start) return;
    const dist = pointerDistance(start, e);
    if (dist > TAP_SLOP_PX) start.tapMoved = true;
    if (start.moved || dist <= GESTURE_SLOP_PX) return;
    start.moved = true;
    if (twoFingerTap && twoFingerTap.ids.indexOf(e.pointerId) !== -1) twoFingerTap.ok = false;
  }

  function onPointerUp(e) {
    if (e.pointerType !== 'touch') return;
    const start = touchPointers.get(e.pointerId);

    if (!start) {
      // Synthetic pointerup without a matching pointerdown: still a tap.
      if (isTypingTarget(e.target)) return;
      if (!state.enabled) return;
      const u = unitFromEvent(e);
      if (u) queueSingleTap(u);
      return;
    }

    touchPointers.delete(e.pointerId);
    const now = Date.now();
    const dist = pointerDistance(start, e);
    const moved = start.moved || dist > GESTURE_SLOP_PX;
    const tapMoved = start.tapMoved || dist > TAP_SLOP_PX;
    if (twoFingerTap && twoFingerTap.ids.indexOf(e.pointerId) !== -1 && moved) twoFingerTap.ok = false;

    if (twoFingerTap) {
      // A two-finger attempt never taps a single block.
      if (touchPointers.size === 0) {
        const tap = twoFingerTap;
        twoFingerTap = null;
        const ok = tap.ok && now - tap.at <= GESTURE_WINDOW_MS;
        if (!ok) return;
        const on = !!state.settings.gestureToggle;
        if (on && lastTwoFingerTapAt && now - lastTwoFingerTapAt <= GESTURE_WINDOW_MS) {
          lastTwoFingerTapAt = 0;
          setEnabled(!state.enabled);
        } else if (on) {
          lastTwoFingerTapAt = now;
        }
      }
      return;
    }

    if (touchPointers.size > 0) return; // another finger is still down
    if (touchStart && touchStart.id === e.pointerId) {
      const elapsed = now - touchStart.t;
      touchStart = null;
      if (tapMoved || elapsed > 900) return;
    } else {
      touchStart = null;
    }
    if (!state.enabled) return;
    const u = unitFromEvent(e);
    if (u) queueSingleTap(u);
  }

  function onPointerCancel(e) {
    const id = e && e.pointerId;
    if (id == null) touchPointers.clear();
    else touchPointers.delete(id);
    touchStart = null;
    if (touchPointers.size === 0) twoFingerTap = null;
    else if (twoFingerTap) twoFingerTap.ok = false;
    cancelPendingTap();
  }

  // Called on every enable/disable: a pointer or half-finished gesture from
  // before the switch must not be paired with the next one.
  function resetPointerState() {
    touchPointers.clear();
    touchStart = null;
    twoFingerTap = null;
    lastTwoFingerTapAt = 0;
    cancelPendingTap();
  }

  // ---------------------------------------------------------------------------
  // Mutation observer
  // ---------------------------------------------------------------------------

  function isOurNode(node) {
    if (!node) return false;
    if (node.nodeType === 1) {
      try {
        return !!node.closest('[' + ATTR_CLONE + '="1"]');
      } catch (_) {
        return false;
      }
    }
    if (node.nodeType === 3) {
      const parent = node.parentElement;
      if (!parent) return false;
      try {
        return !!parent.closest('[' + ATTR_CLONE + '="1"]');
      } catch (_) {
        return false;
      }
    }
    return false;
  }

  function isOurMutation(record) {
    if (record.type === 'characterData') {
      const target = record.target;
      return state.written.get(target) === target.nodeValue;
    }
    const nodes = [];
    try {
      for (const n of record.addedNodes) nodes.push(n);
      for (const n of record.removedNodes) nodes.push(n);
    } catch (_) {
      return false;
    }
    if (!nodes.length) return true;
    for (const node of nodes) if (!isOurNode(node)) return false;
    return true;
  }

  function onMutations(records) {
    if (!state.enabled || !state.settingsSeen) return;
    for (const record of records) {
      if (!isOurMutation(record)) {
        // A settings tab can mount in one React commit; scan on the next task.
        scheduleScan(0);
        return;
      }
    }
  }

  function startObserver() {
    if (state.observer || typeof MutationObserver !== 'function') return;
    try {
      const target = document.documentElement || document;
      const observer = new MutationObserver((records) => {
        safe(() => onMutations(records), 'observer');
      });
      observer.observe(target, { childList: true, subtree: true, characterData: true });
      state.observer = observer;
    } catch (e) {
      log('observer unavailable: ' + (e && e.message ? e.message : e));
    }
  }

  // ---------------------------------------------------------------------------
  // Settings and lifecycle
  // ---------------------------------------------------------------------------

  function normalizeLang(raw) {
    let lang = String(raw == null ? '' : raw).trim().replace(/_/g, '-');
    if (!lang) return '';
    const low = lang.toLowerCase();
    if (low === 'zh' || low.indexOf('zh-') === 0) {
      return /hant|tw|hk|mo/.test(low) ? 'zh-Hant' : 'zh-Hans';
    }
    return low.split('-')[0];
  }

  function resolveTarget(raw) {
    if (raw && String(raw).toLowerCase() !== 'auto') return normalizeLang(raw);
    let lang = '';
    try {
      lang = document.documentElement ? document.documentElement.lang : '';
    } catch (_) {
      lang = '';
    }
    if (!lang) {
      try {
        lang = navigator.language || '';
      } catch (_) {
        lang = '';
      }
    }
    return normalizeLang(lang);
  }

  function resolveProvider() {
    const p = String(state.settings.provider || 'auto').toLowerCase();
    if (p === 'google') {
      if (!state.googleWarned) {
        state.googleWarned = true;
        log('provider "google" is not implemented; using Edge');
      }
      return 'edge';
    }
    if (p === 'llm') return 'llm';
    if (p === 'auto') {
      const keySource = String(state.settings.llmKeySource || 'none').toLowerCase();
      return keySource !== 'none' && llmConfigured() ? 'llm' : 'edge';
    }
    return 'edge';
  }

  function rebuildKeysChanged(prev, next) {
    return (
      prev.targetLang !== next.targetLang ||
      prev.provider !== next.provider ||
      prev.llmBaseUrl !== next.llmBaseUrl ||
      prev.llmModel !== next.llmModel ||
      prev.llmKeySource !== next.llmKeySource ||
      glossarySignature(prev) !== glossarySignature(next) ||
      prev.scopeReadme !== next.scopeReadme ||
      prev.scopeSettings !== next.scopeSettings ||
      prev.scopeModName !== next.scopeModName ||
      prev.scopeModSummary !== next.scopeModSummary ||
      prev.scopeChangelog !== next.scopeChangelog
    );
  }

  // The first protocol revision had a single `scopeList`; a payload without the
  // split keys keeps its choice, and no key at all means both are on.
  function applyScopeSettings(raw, next) {
    const has = (key) => Object.prototype.hasOwnProperty.call(raw, key);
    const legacy = has('scopeList') ? !!raw.scopeList : undefined;
    const fallback = legacy === undefined ? true : legacy;
    if (!has('scopeModName')) next.scopeModName = fallback;
    if (!has('scopeModSummary')) next.scopeModSummary = fallback;
    next.scopeModName = next.scopeModName !== false;
    next.scopeModSummary = next.scopeModSummary !== false;
    delete next.scopeList;
  }

  function applySettings(raw) {
    if (!raw || typeof raw !== 'object') return;
    const prev = state.settings;
    const next = Object.assign(defaultSettings(), prev, raw);
    applyScopeSettings(raw, next);
    next.hoverDelayMs = clamp(next.hoverDelayMs, 0, 2000);
    next.batchSize = clamp(next.batchSize, 1, 100);
    next.batchChars = clamp(next.batchChars, 200, 200000);
    next.batchIntervalMs = clamp(next.batchIntervalMs, 0, 10000);
    next.concurrency = clamp(next.concurrency, 1, 8);
    next.timeoutMs = clamp(next.timeoutMs, 1000, 120000);
    next.cacheTtlDays = clamp(next.cacheTtlDays, 0, 3650);
    next.gestureToggle = next.gestureToggle !== false;
    if (!next.gestureToggle) lastTwoFingerTapAt = 0;
    next.debug = !!next.debug;

    state.settings = next;
    state.settingsSeen = true;
    state.settingsAttempts = 0;

    state.targetLang = resolveTarget(next.targetLang);
    const prevProvider = state.provider;
    const provider = resolveProvider();
    if (prevProvider !== provider) {
      // A new provider choice is a fresh start; a previous LLM failure must not
      // pin this configuration to Edge.
      state.llmFallback = false;
      state.llmWarned = false;
    }
    state.provider = provider;
    state.shortcuts.toggle = parseShortcut(next.shortcutToggle);

    if (next.clearCache) {
      cacheClear();
      next.clearCache = false;
    }
    if (next.cacheEnabled) cacheEnsureIndex();

    const isFirst = state.settingsCount === 0;
    state.settingsCount++;
    const changed = isFirst || prevProvider !== provider || rebuildKeysChanged(prev, next);

    log(
      'settings: lang=' + state.targetLang + ' provider=' + state.provider +
      ' scopes=' + [next.scopeReadme, next.scopeSettings, next.scopeModName, next.scopeModSummary, next.scopeChangelog].join('') +
      ' debug=' + next.debug
    );

    if (!state.targetLang) problem('no target language resolved; idle');

    if (changed) {
      state.epoch++;
      teardownAll();
      scheduleScan(0);
    } else {
      // Re-apply hover state (delay may have changed); rendered units stay as they are.
      for (const u of state.units) applyUnit(u, true);
    }
  }

  function setEnabled(on) {
    on = !!on;
    resetPointerState();
    if (state.enabled === on) {
      if (on) {
        if (!state.settingsSeen) requestSettings();
        else scheduleScan(0);
      }
      return;
    }
    state.enabled = on;
    state.epoch++;
    teardownAll();
    if (on) {
      log('enabled');
      // Recovery from any state: without settings there is nothing to scan.
      if (!state.settingsSeen) {
        if (!state.connected) connect();
        requestSettings();
      } else {
        scheduleScan(0);
      }
    } else {
      log('disabled');
    }
  }

  function onMessage(e) {
    try {
      const data = e && e.data;
      if (typeof data !== 'string' || data.indexOf(TAG + SEP) !== 0) return;
      if (data.indexOf(TAG + SEP + 'http' + SEP) === 0) {
        const parts = data.split(SEP, 6);
        onHttpReply(parts);
        return;
      }
      if (data.indexOf(TAG + SEP + 'settings' + SEP) === 0) {
        const parts = data.split(SEP, 3);
        let json = null;
        try {
          json = JSON.parse(parts[2]);
        } catch (_) {
          json = null;
        }
        if (json && typeof json === 'object') applySettings(json);
      }
    } catch (err) {
      problem('message: ' + (err && err.message ? err.message : err));
    }
  }

  function requestSettings() {
    state.settingsAttempts++;
    send(TAG + SEP + 'settings?');
    if (!state.settingsSeen && state.settingsAttempts < 3) {
      setTimeout(() => {
        if (!state.settingsSeen) safe(requestSettings, 'settings-retry');
      }, 1500 * state.settingsAttempts);
    }
  }

  function connect() {
    const wv = CHANNEL();
    if (!wv) return false;
    if (!state.connected) {
      try {
        wv.addEventListener('message', (e) => safe(() => onMessage(e), 'message'));
        state.connected = true;
      } catch (e) {
        problem('message listener: ' + (e && e.message ? e.message : e));
        return false;
      }
      log('engine ' + VERSION + ' connected; href=' + location.href);
      requestSettings();
      scheduleScan(250);
    }
    return true;
  }

  function installCss() {
    try {
      if (document.getElementById('whtr-style')) return;
      const style = document.createElement('style');
      style.id = 'whtr-style';
      style.textContent =
        '[' + ATTR_ORIG + '="1"]{display:none !important}' +
        '[' + ATTR_CLONE + '="1"]{box-shadow:inset 2px 0 0 rgba(99,150,255,.35)}';
      const parent = document.head || document.documentElement;
      if (parent) parent.appendChild(style);
    } catch (_) {
      /* CSP should allow inline styles, but stay quiet if not */
    }
  }

  function installInputHandlers() {
    try {
      document.addEventListener('pointerover', (e) => safe(() => onPointerOver(e), 'pointerover'), true);
      document.addEventListener('pointerout', (e) => safe(() => onPointerOut(e), 'pointerout'), true);
      document.addEventListener('pointerdown', (e) => safe(() => onPointerDown(e), 'pointerdown'), true);
      document.addEventListener('pointermove', (e) => safe(() => onPointerMove(e), 'pointermove'), true);
      document.addEventListener('pointerup', (e) => safe(() => onPointerUp(e), 'pointerup'), true);
      document.addEventListener('pointercancel', (e) => safe(() => onPointerCancel(e), 'pointercancel'), true);
      window.addEventListener('keydown', (e) => safe(() => onKeyDown(e), 'keydown'));
      window.addEventListener('load', () => {
        safe(() => {
          if (state.settingsSeen) scheduleScan(200);
        }, 'load');
      });
    } catch (e) {
      problem('listeners: ' + (e && e.message ? e.message : e));
    }
  }

  function revivify() {
    if (!state.connected) connect();
    if (!state.settingsSeen) requestSettings();
    if (state.enabled && state.settingsSeen) scheduleScan(0);
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  try {
    if (window.__WHTR__ && window.__WHTR__.__engine) {
      // The navigation-completed injection must not build a second engine.
      try {
        window.__WHTR__.__engine.revive();
      } catch (_) {
        /* ignore */
      }
      return;
    }
  } catch (_) {
    /* ignore */
  }

  try {
    installCss();
    startObserver();
    installInputHandlers();

    const deadline = Date.now() + 5000;
    const boot = () => {
      if (connect()) return;
      if (Date.now() < deadline) setTimeout(() => safe(boot, 'boot'), 50);
    };
    boot();

    window.__WHTR__ = {
      __engine: { revive: revivify },
      version: VERSION,
      enable: () => safe(() => setEnabled(true), 'api.enable'),
      disable: () => safe(() => setEnabled(false), 'api.disable'),
      stats: () => safe(snapshot, 'api.stats') || {},
      rescan: () => safe(() => scheduleScan(0), 'api.rescan')
    };
    log('engine armed ' + VERSION);
  } catch (e) {
    try {
      problem('boot: ' + (e && e.message ? e.message : e));
    } catch (_) {
      /* ignore */
    }
  }
})();
)WHTR_JS";

// Prepended to kP0Js so the page can report which injection path reached it.
// The script itself stays byte-identical after this marker and defaults to
// 'immediate' when the marker is absent.
static constexpr wchar_t kP0JsWhenAfterAddScript[] =
    L"window.__WH_TRANSLATOR_P0_WHEN__='afteraddscript';";
static constexpr wchar_t kP0JsWhenNavCompleted[] =
    L"window.__WH_TRANSLATOR_P0_WHEN__='navcompleted';";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// ABI-compatible with WebView2's EventRegistrationToken (a single 64-bit
// value passed by value on x86-64).
struct EventRegistrationToken {
    LONGLONG value;
};
static_assert(sizeof(EventRegistrationToken) == sizeof(LONGLONG));

using FnQueryInterface = HRESULT(STDMETHODCALLTYPE*)(void*, const IID&, void**);
using FnAddRef = ULONG(STDMETHODCALLTYPE*)(void*);
using FnRelease = ULONG(STDMETHODCALLTYPE*)(void*);

using FnEnvCreateController =
    HRESULT(STDMETHODCALLTYPE*)(void*, HWND, void*);
using FnEnvCreateControllerWithOptions =
    HRESULT(STDMETHODCALLTYPE*)(void*, HWND, void*, void*);
using FnEnvHandlerInvoke = HRESULT(STDMETHODCALLTYPE*)(void*, HRESULT, void*);

using FnControllerGetCoreWebView2 =
    HRESULT(STDMETHODCALLTYPE*)(void*, void**);
using FnControllerHandlerInvoke =
    HRESULT(STDMETHODCALLTYPE*)(void*, HRESULT, void*);

using FnGetSettings = HRESULT(STDMETHODCALLTYPE*)(void*, void**);
using FnGetBool = HRESULT(STDMETHODCALLTYPE*)(void*, BOOL*);
using FnPutBool = HRESULT(STDMETHODCALLTYPE*)(void*, BOOL);
using FnAddScript =
    HRESULT(STDMETHODCALLTYPE*)(void*, LPCWSTR, void*);
using FnExecuteScript =
    HRESULT(STDMETHODCALLTYPE*)(void*, LPCWSTR, void*);
using FnPostWebMessageAsString =
    HRESULT(STDMETHODCALLTYPE*)(void*, LPCWSTR);
using FnAddWebMessageReceived =
    HRESULT(STDMETHODCALLTYPE*)(void*, void*, EventRegistrationToken*);
using FnRemoveWebMessageReceived =
    HRESULT(STDMETHODCALLTYPE*)(void*, EventRegistrationToken);
using FnTryGetWebMessageAsString =
    HRESULT(STDMETHODCALLTYPE*)(void*, LPWSTR*);
using FnScriptHandlerInvoke =
    HRESULT(STDMETHODCALLTYPE*)(void*, HRESULT, LPCWSTR);

// Navigation starting/completed events and their args. The event handler
// signature is Invoke(ICoreWebView2* sender, <args>* args).
using FnGetString = HRESULT(STDMETHODCALLTYPE*)(void*, LPWSTR*);
using FnGetInt32 = HRESULT(STDMETHODCALLTYPE*)(void*, int*);
using FnGetUInt64 = HRESULT(STDMETHODCALLTYPE*)(void*, UINT64*);
using FnAddNavigationEventHandler =
    HRESULT(STDMETHODCALLTYPE*)(void*, void*, EventRegistrationToken*);
using FnRemoveNavigationEventHandler =
    HRESULT(STDMETHODCALLTYPE*)(void*, EventRegistrationToken);
using FnNavigationEventHandlerInvoke =
    HRESULT(STDMETHODCALLTYPE*)(void*, void*, void*);

using FnCreateEnv = HRESULT(STDMETHODCALLTYPE*)(
    BOOL fromClientDll,
    int runtimeType,
    PCWSTR userDataFolder,
    IUnknown* environmentOptions,
    void* handler);

using FnGetProcAddress = FARPROC(WINAPI*)(HMODULE, LPCSTR);

// ---------------------------------------------------------------------------
// Module / vtable helpers
// ---------------------------------------------------------------------------

static std::atomic<HMODULE> g_embeddedBrowserModule{nullptr};

static HMODULE P0GetEmbeddedBrowserModule() {
    HMODULE module = g_embeddedBrowserModule.load(std::memory_order_acquire);
    if (module) {
        return module;
    }

    // Cheap atomic load on the hot path; the API call only happens until the
    // DLL is loaded for the first time.
    module = GetModuleHandleW(L"EmbeddedBrowserWebView.dll");
    if (module) {
        g_embeddedBrowserModule.store(module, std::memory_order_release);
    }
    return module;
}

// Checks that a function pointer belongs to EmbeddedBrowserWebView.dll. This
// is deliberately stricter than "is executable": the WebView2 COM objects are
// implemented by that module, so every slot we call must live there.
static bool P0IsModuleCode(const void* code) {
    if (!code) {
        return false;
    }

    HMODULE module = P0GetEmbeddedBrowserModule();
    if (!module) {
        return false;
    }

    MEMORY_BASIC_INFORMATION mbi{};
    if (!VirtualQuery(code, &mbi, sizeof(mbi))) {
        return false;
    }

    return mbi.AllocationBase == module;
}

static void* P0GetRawSlot(void* object, size_t index) {
    if (!object) {
        return nullptr;
    }
    void** vtbl = *reinterpret_cast<void***>(object);
    return vtbl ? vtbl[index] : nullptr;
}

static bool P0GetValidatedSlot(void* object, size_t index, void** out) {
    if (!object || !out) {
        return false;
    }
    void* fn = P0GetRawSlot(object, index);
    if (!P0IsModuleCode(fn)) {
        return false;
    }
    *out = fn;
    return true;
}

// Copying from an untrusted-looking vtable pointer must never fault. This
// helper intentionally contains no C++ objects so SEH can be used.
static bool P0CopyVtable(void** dst, void** src, size_t count) {
    __try {
        for (size_t i = 0; i < count; ++i) {
            dst[i] = src[i];
        }
        return true;
    } __except (EXCEPTION_EXECUTE_HANDLER) {
        return false;
    }
}

static HRESULT P0SafeForwardEnvHandler(void* app, HRESULT hr, void* env) {
    if (!app) {
        return S_OK;
    }
    __try {
        auto fn =
            reinterpret_cast<FnEnvHandlerInvoke>(P0GetRawSlot(app, kCallbackSlotInvoke));
        if (!fn) {
            return E_FAIL;
        }
        return fn(app, hr, env);
    } __except (EXCEPTION_EXECUTE_HANDLER) {
        return E_FAIL;
    }
}

static HRESULT P0SafeForwardControllerHandler(void* app,
                                              HRESULT hr,
                                              void* controller) {
    if (!app) {
        return S_OK;
    }
    __try {
        auto fn = reinterpret_cast<FnControllerHandlerInvoke>(
            P0GetRawSlot(app, kCallbackSlotInvoke));
        if (!fn) {
            return E_FAIL;
        }
        return fn(app, hr, controller);
    } __except (EXCEPTION_EXECUTE_HANDLER) {
        return E_FAIL;
    }
}

// ---------------------------------------------------------------------------
// Ref-counted callback wrappers
//
// The wrappers are plain structs whose first bytes are the COM vptr. The
// vtable is built by hand: QueryInterface, AddRef, Release, Invoke.
// ---------------------------------------------------------------------------

struct P0WrapperBase {
    const void* const* vtbl;
    volatile LONG ref;
    void (*finalize)(P0WrapperBase*);
};

struct P0EnvHandler : P0WrapperBase {
    void* app;
};

struct P0ControllerHandler : P0WrapperBase {
    void* app;
};

struct P0MessageHandler : P0WrapperBase {};

struct P0ScriptHandler : P0WrapperBase {
    const wchar_t* label;
    // HRESULT of the call that created this handler, filled in right after the
    // call returns so the (asynchronous) completion log can include it.
    HRESULT immediateHr;
};

struct P0NavigationStartingHandler : P0WrapperBase {};

struct P0NavigationCompletedHandler : P0WrapperBase {};

static HRESULT STDMETHODCALLTYPE P0WrapperQueryInterface(P0WrapperBase* self,
                                                         const IID& riid,
                                                         void** ppv);
static ULONG STDMETHODCALLTYPE P0WrapperAddRef(P0WrapperBase* self);
static ULONG STDMETHODCALLTYPE P0WrapperRelease(P0WrapperBase* self);

static void P0EnvHandlerFinalize(P0WrapperBase* self);
static void P0ControllerHandlerFinalize(P0WrapperBase* self);
static void P0MessageHandlerFinalize(P0WrapperBase* self);
static void P0ScriptHandlerFinalize(P0WrapperBase* self);
static void P0NavigationStartingHandlerFinalize(P0WrapperBase* self);
static void P0NavigationCompletedHandlerFinalize(P0WrapperBase* self);

static HRESULT STDMETHODCALLTYPE P0EnvHandlerInvoke(P0EnvHandler* self,
                                                    HRESULT hr,
                                                    void* env);
static HRESULT STDMETHODCALLTYPE P0ControllerHandlerInvoke(
    P0ControllerHandler* self,
    HRESULT hr,
    void* controller);
static HRESULT STDMETHODCALLTYPE P0MessageHandlerInvoke(
    P0MessageHandler* self,
    void* sender,
    void* args);
static HRESULT STDMETHODCALLTYPE P0ScriptHandlerInvoke(
    P0ScriptHandler* self,
    HRESULT hr,
    LPCWSTR text);
static HRESULT STDMETHODCALLTYPE P0NavigationStartingInvoke(
    P0NavigationStartingHandler* self,
    void* sender,
    void* args);
static HRESULT STDMETHODCALLTYPE P0NavigationCompletedInvoke(
    P0NavigationCompletedHandler* self,
    void* sender,
    void* args);

static HRESULT STDMETHODCALLTYPE P0EnvCreateControllerThunk(void* self,
                                                            HWND parent,
                                                            void* handler);
static HRESULT STDMETHODCALLTYPE P0EnvCreateControllerWithOptionsThunk(
    void* self,
    HWND parent,
    void* options,
    void* handler);

static const void* const kEnvHandlerVtbl[4] = {
    reinterpret_cast<const void*>(&P0WrapperQueryInterface),
    reinterpret_cast<const void*>(&P0WrapperAddRef),
    reinterpret_cast<const void*>(&P0WrapperRelease),
    reinterpret_cast<const void*>(&P0EnvHandlerInvoke),
};

static const void* const kControllerHandlerVtbl[4] = {
    reinterpret_cast<const void*>(&P0WrapperQueryInterface),
    reinterpret_cast<const void*>(&P0WrapperAddRef),
    reinterpret_cast<const void*>(&P0WrapperRelease),
    reinterpret_cast<const void*>(&P0ControllerHandlerInvoke),
};

static const void* const kMessageHandlerVtbl[4] = {
    reinterpret_cast<const void*>(&P0WrapperQueryInterface),
    reinterpret_cast<const void*>(&P0WrapperAddRef),
    reinterpret_cast<const void*>(&P0WrapperRelease),
    reinterpret_cast<const void*>(&P0MessageHandlerInvoke),
};

static const void* const kScriptHandlerVtbl[4] = {
    reinterpret_cast<const void*>(&P0WrapperQueryInterface),
    reinterpret_cast<const void*>(&P0WrapperAddRef),
    reinterpret_cast<const void*>(&P0WrapperRelease),
    reinterpret_cast<const void*>(&P0ScriptHandlerInvoke),
};

static const void* const kNavigationStartingHandlerVtbl[4] = {
    reinterpret_cast<const void*>(&P0WrapperQueryInterface),
    reinterpret_cast<const void*>(&P0WrapperAddRef),
    reinterpret_cast<const void*>(&P0WrapperRelease),
    reinterpret_cast<const void*>(&P0NavigationStartingInvoke),
};

static const void* const kNavigationCompletedHandlerVtbl[4] = {
    reinterpret_cast<const void*>(&P0WrapperQueryInterface),
    reinterpret_cast<const void*>(&P0WrapperAddRef),
    reinterpret_cast<const void*>(&P0WrapperRelease),
    reinterpret_cast<const void*>(&P0NavigationCompletedInvoke),
};

// The wrappers are only ever handed to WebView2 as completion/event handlers,
// which the consumer calls through the pointer it already has; it never uses QI
// to get a different interface from them. Returning `this` for every IID is
// therefore safe for that narrow role and keeps E_NOINTERFACE out of the middle
// of the callback chain. The first QI is logged so the requested IIDs show up in
// p0.log.
static std::atomic<bool> g_qiLogged{false};

static HRESULT STDMETHODCALLTYPE P0WrapperQueryInterface(P0WrapperBase* self,
                                                         const IID& riid,
                                                         void** ppv) {
    if (!ppv) {
        return E_POINTER;
    }

    *ppv = self;
    InterlockedIncrement(&self->ref);

    if (!g_qiLogged.exchange(true, std::memory_order_relaxed)) {
        const DWORD* d = reinterpret_cast<const DWORD*>(&riid);
        P0_LOG(L"[p0] wrapper QueryInterface {%08X-%08X-%08X-%08X} -> this",
               d[0], d[1], d[2], d[3]);
    }

    return S_OK;
}

static ULONG STDMETHODCALLTYPE P0WrapperAddRef(P0WrapperBase* self) {
    if (!self) {
        return 0;
    }
    return static_cast<ULONG>(InterlockedIncrement(&self->ref));
}

static ULONG STDMETHODCALLTYPE P0WrapperRelease(P0WrapperBase* self) {
    if (!self) {
        return 0;
    }

    LONG count = InterlockedDecrement(&self->ref);
    if (count == 0) {
        void (*finalize)(P0WrapperBase*) = self->finalize;
        if (finalize) {
            finalize(self);
        }
    }
    return static_cast<ULONG>(count);
}

static void P0EnvHandlerFinalize(P0WrapperBase* self) {
    auto* handler = static_cast<P0EnvHandler*>(self);
    if (handler->app) {
        auto release =
            reinterpret_cast<FnRelease>(P0GetRawSlot(handler->app, kSlotRelease));
        if (release) {
            release(handler->app);
        }
    }
    delete handler;
}

static void P0ControllerHandlerFinalize(P0WrapperBase* self) {
    auto* handler = static_cast<P0ControllerHandler*>(self);
    if (handler->app) {
        auto release =
            reinterpret_cast<FnRelease>(P0GetRawSlot(handler->app, kSlotRelease));
        if (release) {
            release(handler->app);
        }
    }
    delete handler;
}

static void P0MessageHandlerFinalize(P0WrapperBase* self) {
    delete static_cast<P0MessageHandler*>(self);
}

static void P0ScriptHandlerFinalize(P0WrapperBase* self) {
    delete static_cast<P0ScriptHandler*>(self);
}

static void P0NavigationStartingHandlerFinalize(P0WrapperBase* self) {
    delete static_cast<P0NavigationStartingHandler*>(self);
}

static void P0NavigationCompletedHandlerFinalize(P0WrapperBase* self) {
    delete static_cast<P0NavigationCompletedHandler*>(self);
}

static P0EnvHandler* P0CreateEnvHandler(void* app) {
    auto* handler = new (std::nothrow) P0EnvHandler();
    if (!handler) {
        return nullptr;
    }

    handler->vtbl = kEnvHandlerVtbl;
    handler->ref = 1;
    handler->finalize = &P0EnvHandlerFinalize;
    handler->app = app;

    if (app) {
        auto addRef = reinterpret_cast<FnAddRef>(P0GetRawSlot(app, kSlotAddRef));
        if (!addRef) {
            delete handler;
            return nullptr;
        }
        addRef(app);
    }

    return handler;
}

static P0ControllerHandler* P0CreateControllerHandler(void* app) {
    auto* handler = new (std::nothrow) P0ControllerHandler();
    if (!handler) {
        return nullptr;
    }

    handler->vtbl = kControllerHandlerVtbl;
    handler->ref = 1;
    handler->finalize = &P0ControllerHandlerFinalize;
    handler->app = app;

    if (app) {
        auto addRef = reinterpret_cast<FnAddRef>(P0GetRawSlot(app, kSlotAddRef));
        if (!addRef) {
            delete handler;
            return nullptr;
        }
        addRef(app);
    }

    return handler;
}

static P0MessageHandler* P0CreateMessageHandler() {
    auto* handler = new (std::nothrow) P0MessageHandler();
    if (!handler) {
        return nullptr;
    }

    handler->vtbl = kMessageHandlerVtbl;
    handler->ref = 1;
    handler->finalize = &P0MessageHandlerFinalize;
    return handler;
}

static P0ScriptHandler* P0CreateScriptHandler(const wchar_t* label) {
    auto* handler = new (std::nothrow) P0ScriptHandler();
    if (!handler) {
        return nullptr;
    }

    handler->vtbl = kScriptHandlerVtbl;
    handler->ref = 1;
    handler->finalize = &P0ScriptHandlerFinalize;
    handler->label = label;
    handler->immediateHr = E_FAIL;
    return handler;
}

static P0NavigationStartingHandler* P0CreateNavigationStartingHandler() {
    auto* handler = new (std::nothrow) P0NavigationStartingHandler();
    if (!handler) {
        return nullptr;
    }

    handler->vtbl = kNavigationStartingHandlerVtbl;
    handler->ref = 1;
    handler->finalize = &P0NavigationStartingHandlerFinalize;
    return handler;
}

static P0NavigationCompletedHandler* P0CreateNavigationCompletedHandler() {
    auto* handler = new (std::nothrow) P0NavigationCompletedHandler();
    if (!handler) {
        return nullptr;
    }

    handler->vtbl = kNavigationCompletedHandlerVtbl;
    handler->ref = 1;
    handler->finalize = &P0NavigationCompletedHandlerFinalize;
    return handler;
}

// ---------------------------------------------------------------------------
// Environment vtable patching
// ---------------------------------------------------------------------------

struct P0EnvPatchState {
    std::mutex mtx;
    void* env = nullptr;  // owns a reference while patched
    void** originalVtbl = nullptr;
    void** patchedVtbl = nullptr;
    bool installed = false;
};

static P0EnvPatchState g_envPatch;
static std::atomic<void*> g_origEnvCreateController{nullptr};
static std::atomic<void*> g_origEnvCreateControllerWithOptions{nullptr};

static void P0PatchEnvironment(void* env) {
    if (!env) {
        P0_LOG(L"env not patched: null environment");
        return;
    }

    void** originalVtbl = *reinterpret_cast<void***>(env);
    if (!originalVtbl || !P0IsModuleCode(originalVtbl)) {
        P0_LOG(L"env vtable: base=%p slot3=(unreadable) slot21=(unreadable) "
               L"slot3InModule=0 slot21InModule=0",
               static_cast<void*>(originalVtbl));
        P0_LOG(L"[p0] env=%p has unexpected vtable %p; not patching", env,
               originalVtbl);
        P0_LOG(L"env not patched: vtable %p is not inside "
               L"EmbeddedBrowserWebView.dll",
               static_cast<void*>(originalVtbl));
        return;
    }

    void* slot3 = P0GetRawSlot(env, kEnvSlotCreateController);
    void* slot21 = P0GetRawSlot(env, kEnvSlotCreateControllerWithOptions);
    bool slot3InModule = P0IsModuleCode(slot3);
    bool slot21InModule = P0IsModuleCode(slot21);
    bool has3 = slot3InModule;
    bool has21 = slot21InModule;

    P0_LOG(L"env vtable: base=%p slot3=%p slot21=%p slot3InModule=%d "
           L"slot21InModule=%d",
           static_cast<void*>(originalVtbl), slot3, slot21,
           slot3InModule ? 1 : 0, slot21InModule ? 1 : 0);

    if (!has3 && !has21) {
        P0_LOG(L"[p0] env=%p: neither slot 3 nor slot 21 is in %s; not patching",
               env, L"EmbeddedBrowserWebView.dll");
        P0_LOG(L"env not patched: neither slot 3 nor slot 21 is module code");
        return;
    }

    std::lock_guard<std::mutex> lock(g_envPatch.mtx);
    if (g_envPatch.installed) {
        P0_LOG(L"[p0] env=%p: another environment is already patched; skipping",
               env);
        P0_LOG(L"env not patched: another environment is already patched");
        return;
    }

    auto* copy = new (std::nothrow) void*[kEnvVtblSlots];
    if (!copy) {
        P0_LOG(L"[p0] env=%p: out of memory for vtable copy", env);
        P0_LOG(L"env not patched: out of memory for the vtable copy");
        return;
    }

    if (!P0CopyVtable(copy, originalVtbl, kEnvVtblSlots)) {
        P0_LOG(L"[p0] env=%p: vtable copy faulted; not patching", env);
        P0_LOG(L"env not patched: the vtable copy faulted");
        delete[] copy;
        return;
    }

    if (has3) {
        copy[kEnvSlotCreateController] =
            reinterpret_cast<void*>(&P0EnvCreateControllerThunk);
    }
    if (has21) {
        copy[kEnvSlotCreateControllerWithOptions] =
            reinterpret_cast<void*>(&P0EnvCreateControllerWithOptionsThunk);
    }

    auto addRef =
        reinterpret_cast<FnAddRef>(P0GetRawSlot(env, kSlotAddRef));
    if (!addRef) {
        P0_LOG(L"[p0] env=%p: AddRef slot missing; not patching", env);
        P0_LOG(L"env not patched: no AddRef slot");
        delete[] copy;
        return;
    }
    addRef(env);

    g_envPatch.env = env;
    g_envPatch.originalVtbl = originalVtbl;
    g_envPatch.patchedVtbl = copy;
    g_envPatch.installed = true;

    // Publish the originals before switching the vptr: a thunk may fire on
    // another thread as soon as the swap is visible.
    if (has3) {
        g_origEnvCreateController.store(slot3, std::memory_order_release);
    }
    if (has21) {
        g_origEnvCreateControllerWithOptions.store(slot21,
                                                   std::memory_order_release);
    }

    *reinterpret_cast<void***>(env) = copy;

    P0_LOG(L"[p0] env=%p patched (slot3=%p valid=%d, slot21=%p valid=%d)",
           env, slot3, has3 ? 1 : 0, slot21, has21 ? 1 : 0);
    P0_LOG(L"env patched");
}

static void P0RestoreEnvironment() {
    std::lock_guard<std::mutex> lock(g_envPatch.mtx);
    if (!g_envPatch.installed) {
        P0_LOG(L"cleanup: environment not patched, nothing to restore hr=0x00000000");
        return;
    }

    if (g_envPatch.env) {
        void** current = *reinterpret_cast<void***>(g_envPatch.env);
        if (current == g_envPatch.patchedVtbl) {
            *reinterpret_cast<void***>(g_envPatch.env) =
                g_envPatch.originalVtbl;
            P0_LOG(L"[p0] env=%p vtable restored", g_envPatch.env);
            P0_LOG(L"cleanup: env vtable restored hr=0x00000000");
        } else {
            P0_LOG(L"[p0] env=%p vptr changed externally (%p); not restoring",
                   g_envPatch.env, current);
            P0_LOG(L"cleanup: env vptr changed externally (%p), not restoring "
                   L"hr=0x00000000", current);
        }

        auto release = reinterpret_cast<FnRelease>(
            P0GetRawSlot(g_envPatch.env, kSlotRelease));
        if (release) {
            release(g_envPatch.env);
            P0_LOG(L"cleanup: env reference released hr=0x00000000");
        }
    }

    delete[] g_envPatch.patchedVtbl;
    P0_LOG(L"cleanup: env vtable copy freed hr=0x00000000");

    g_envPatch.installed = false;
    g_envPatch.env = nullptr;
    g_envPatch.originalVtbl = nullptr;
    g_envPatch.patchedVtbl = nullptr;
    g_origEnvCreateController.store(nullptr);
    g_origEnvCreateControllerWithOptions.store(nullptr);
}

// ---------------------------------------------------------------------------
// WebView state
// ---------------------------------------------------------------------------

static std::mutex g_webViewMutex;
static void* g_webView = nullptr;
static EventRegistrationToken g_webMessageToken{};
static P0MessageHandler* g_webMessageHandler = nullptr;
static EventRegistrationToken g_navigationStartingToken{};
static EventRegistrationToken g_navigationCompletedToken{};
static P0NavigationStartingHandler* g_navigationStartingHandler = nullptr;
static P0NavigationCompletedHandler* g_navigationCompletedHandler = nullptr;

// Last URI seen by NavigationStarting. NavigationCompleted's args expose only
// IsSuccess/WebErrorStatus/NavigationId, and get_Source on the webview is
// deliberately not used, so the URI is carried over from the previous event.
static std::mutex g_navigationMutex;
static std::wstring g_lastNavigationUri;

// One-shot: inject once more when AddScriptToExecuteOnDocumentCreated finishes
// asynchronously after the controller path already ran its fallback.
static std::atomic<bool> g_postAddScriptInjectionDone{false};

static void P0SetLastNavigationUri(const std::wstring& uri) {
    try {
        std::lock_guard<std::mutex> lock(g_navigationMutex);
        g_lastNavigationUri = uri;
    } catch (...) {
    }
}

static std::wstring P0GetLastNavigationUri() {
    try {
        std::lock_guard<std::mutex> lock(g_navigationMutex);
        return g_lastNavigationUri;
    } catch (...) {
        return std::wstring();
    }
}

// Immediate HRESULT of the AddScript call. The completion handler reports the
// asynchronous result (and the script id), which is logged together with it.
// ExecuteScript's immediate HRESULT travels in the handler itself
// (P0ScriptHandler::immediateHr), so repeated injections cannot overwrite it.
static std::atomic<unsigned long> g_addScriptHr{0xFFFFFFFFul};

// RAII holder for a COM reference that is released through slot 2.
struct P0ComRef {
    void* object = nullptr;

    ~P0ComRef() {
        if (object) {
            auto release =
                reinterpret_cast<FnRelease>(P0GetRawSlot(object, kSlotRelease));
            if (release) {
                release(object);
            }
        }
    }

    P0ComRef() = default;
    P0ComRef(const P0ComRef&) = delete;
    P0ComRef& operator=(const P0ComRef&) = delete;
};

struct P0HandlerRef {
    P0WrapperBase* handler = nullptr;

    ~P0HandlerRef() {
        if (handler) {
            P0WrapperRelease(handler);
        }
    }

    P0HandlerRef() = default;
    P0HandlerRef(const P0HandlerRef&) = delete;
    P0HandlerRef& operator=(const P0HandlerRef&) = delete;
};

static bool P0StoreWebView(void* webView,
                           EventRegistrationToken token,
                           P0MessageHandler* handler) {
    std::lock_guard<std::mutex> lock(g_webViewMutex);
    if (g_webView) {
        return false;
    }

    auto addRef = reinterpret_cast<FnAddRef>(P0GetRawSlot(webView, kSlotAddRef));
    if (!addRef) {
        return false;
    }
    addRef(webView);

    g_webView = webView;
    g_webMessageToken = token;
    g_webMessageHandler = handler;
    return true;
}

static void P0CleanupWebView() {
    void* webView = nullptr;
    EventRegistrationToken token{};
    P0MessageHandler* handler = nullptr;
    EventRegistrationToken navStartingToken{};
    EventRegistrationToken navCompletedToken{};
    P0NavigationStartingHandler* navStartingHandler = nullptr;
    P0NavigationCompletedHandler* navCompletedHandler = nullptr;

    {
        std::lock_guard<std::mutex> lock(g_webViewMutex);
        webView = g_webView;
        g_webView = nullptr;
        token = g_webMessageToken;
        g_webMessageToken = {};
        handler = g_webMessageHandler;
        g_webMessageHandler = nullptr;
        navStartingToken = g_navigationStartingToken;
        g_navigationStartingToken = {};
        navCompletedToken = g_navigationCompletedToken;
        g_navigationCompletedToken = {};
        navStartingHandler = g_navigationStartingHandler;
        g_navigationStartingHandler = nullptr;
        navCompletedHandler = g_navigationCompletedHandler;
        g_navigationCompletedHandler = nullptr;
    }

    if (webView) {
        if (navStartingToken.value != 0) {
            void* removeFn = nullptr;
            if (P0GetValidatedSlot(webView, kWebViewSlotRemoveNavigationStarting,
                                   &removeFn)) {
                HRESULT hr = reinterpret_cast<FnRemoveNavigationEventHandler>(
                    removeFn)(webView, navStartingToken);
                P0_LOG(L"[p0] remove_NavigationStarting token=%lld -> %08X",
                       static_cast<long long>(navStartingToken.value),
                       static_cast<unsigned>(hr));
                P0_LOG(L"cleanup: remove_NavigationStarting token=%lld "
                       L"hr=0x%08X",
                       static_cast<long long>(navStartingToken.value),
                       static_cast<unsigned>(hr));
            } else {
                P0_LOG(L"[p0] remove_NavigationStarting slot invalid");
                P0_LOG(L"cleanup: remove_NavigationStarting slot invalid "
                       L"hr=0x80004005");
            }
        }

        if (navCompletedToken.value != 0) {
            void* removeFn = nullptr;
            if (P0GetValidatedSlot(webView,
                                   kWebViewSlotRemoveNavigationCompleted,
                                   &removeFn)) {
                HRESULT hr = reinterpret_cast<FnRemoveNavigationEventHandler>(
                    removeFn)(webView, navCompletedToken);
                P0_LOG(L"[p0] remove_NavigationCompleted token=%lld -> %08X",
                       static_cast<long long>(navCompletedToken.value),
                       static_cast<unsigned>(hr));
                P0_LOG(L"cleanup: remove_NavigationCompleted token=%lld "
                       L"hr=0x%08X",
                       static_cast<long long>(navCompletedToken.value),
                       static_cast<unsigned>(hr));
            } else {
                P0_LOG(L"[p0] remove_NavigationCompleted slot invalid");
                P0_LOG(L"cleanup: remove_NavigationCompleted slot invalid "
                       L"hr=0x80004005");
            }
        }

        if (token.value != 0) {
            void* removeFn = nullptr;
            if (P0GetValidatedSlot(webView, kWebViewSlotRemoveWebMessageReceived,
                                   &removeFn)) {
                HRESULT hr = reinterpret_cast<FnRemoveWebMessageReceived>(
                    removeFn)(webView, token);
                P0_LOG(L"[p0] remove_WebMessageReceived token=%lld -> %08X",
                       static_cast<long long>(token.value),
                       static_cast<unsigned>(hr));
                P0_LOG(L"cleanup: remove_WebMessageReceived token=%lld "
                       L"hr=0x%08X",
                       static_cast<long long>(token.value),
                       static_cast<unsigned>(hr));
            } else {
                P0_LOG(L"[p0] remove_WebMessageReceived slot invalid");
                P0_LOG(L"cleanup: remove_WebMessageReceived slot invalid "
                       L"hr=0x80004005");
            }
        }

        auto release =
            reinterpret_cast<FnRelease>(P0GetRawSlot(webView, kSlotRelease));
        if (release) {
            release(webView);
            P0_LOG(L"cleanup: WebView2 reference released hr=0x00000000");
        }
    }

    if (handler) {
        P0WrapperRelease(handler);
        P0_LOG(L"cleanup: message handler released hr=0x00000000");
    }

    if (navStartingHandler) {
        P0WrapperRelease(navStartingHandler);
        P0_LOG(L"cleanup: NavigationStarting handler released hr=0x00000000");
    }

    if (navCompletedHandler) {
        P0WrapperRelease(navCompletedHandler);
        P0_LOG(L"cleanup: NavigationCompleted handler released hr=0x00000000");
    }
}

// Returns a referenced WebView2 pointer, or nullptr when none is stored yet.
// The caller releases it (P0ComRef is the usual holder).
static void* P0AcquireWebView() {
    std::lock_guard<std::mutex> lock(g_webViewMutex);
    void* webView = g_webView;
    if (!webView) {
        return nullptr;
    }
    auto addRef = reinterpret_cast<FnAddRef>(P0GetRawSlot(webView, kSlotAddRef));
    if (!addRef) {
        return nullptr;
    }
    addRef(webView);
    return webView;
}

// ---------------------------------------------------------------------------
// P1: settings, HTTP relay and the page bridge
//
// The page owns request building and response parsing; the mod only moves
// bytes. Every whtr1 message is handled on the WebView2 UI thread. The HTTP
// work runs on a small worker pool, and results travel back through a hidden
// message-only window owned by the UI thread, so PostWebMessageAsString is
// always called on the thread that owns the webview.
//
// The protocol is documented in docs/PROTOCOL.md. Messages are separated by
// U+001F and the last field may contain it, so every split uses a field limit.
// ---------------------------------------------------------------------------

static constexpr wchar_t kP1Tag[] = L"whtr1";
static constexpr wchar_t kP1DispatchClass[] = L"WindhawkUITranslator.P1Dispatch";
static constexpr UINT kP1MsgDrainReplies = WM_APP + 0x51;
static constexpr UINT kP1MsgSettingsChanged = WM_APP + 0x52;
static constexpr UINT kP1MsgDestroyWindow = WM_APP + 0x53;

static constexpr size_t kP1MaxMessageChars = 4u * 1024u * 1024u;
static constexpr size_t kP1MaxUrlChars = 4096;
static constexpr size_t kP1MaxHeaderCount = 32;
static constexpr size_t kP1MaxHeaderNameChars = 256;
static constexpr size_t kP1MaxHeaderValueChars = 8192;
static constexpr size_t kP1MaxHeadersChars = 64u * 1024u;
static constexpr size_t kP1MaxBodyBytes = 1024u * 1024u;
static constexpr size_t kP1MaxReplyBytes = 1024u * 1024u;
static constexpr size_t kP1MaxJsLogChars = 500;
static constexpr size_t kP1HttpWorkers = 4;
static constexpr size_t kP1HttpQueueLimit = 32;

// ---------------------------------------------------------------------------
// Small text helpers
// ---------------------------------------------------------------------------

static std::string P1WideToUtf8(const std::wstring& text) {
    std::string result;
    try {
        if (text.empty()) {
            return result;
        }
        int length = WideCharToMultiByte(CP_UTF8, 0, text.c_str(),
                                         static_cast<int>(text.size()), nullptr,
                                         0, nullptr, nullptr);
        if (length <= 0) {
            return result;
        }
        result.resize(static_cast<size_t>(length));
        WideCharToMultiByte(CP_UTF8, 0, text.c_str(),
                            static_cast<int>(text.size()), &result[0], length,
                            nullptr, nullptr);
    } catch (...) {
        result.clear();
    }
    return result;
}

static std::wstring P1Utf8ToWide(const std::string& text) {
    std::wstring result;
    try {
        if (text.empty()) {
            return result;
        }
        // Flags 0: invalid sequences become U+FFFD instead of failing.
        int length = MultiByteToWideChar(CP_UTF8, 0, text.data(),
                                         static_cast<int>(text.size()), nullptr,
                                         0);
        if (length <= 0) {
            return result;
        }
        result.resize(static_cast<size_t>(length));
        MultiByteToWideChar(CP_UTF8, 0, text.data(),
                            static_cast<int>(text.size()), &result[0], length);
    } catch (...) {
        result.clear();
    }
    return result;
}

static wchar_t P1AsciiLower(wchar_t ch) {
    if (ch >= L'A' && ch <= L'Z') {
        return static_cast<wchar_t>(ch - L'A' + L'a');
    }
    return ch;
}

static wchar_t P1AsciiUpper(wchar_t ch) {
    if (ch >= L'a' && ch <= L'z') {
        return static_cast<wchar_t>(ch - L'a' + L'A');
    }
    return ch;
}

static std::wstring P1Lower(const std::wstring& text) {
    std::wstring result = text;
    for (wchar_t& ch : result) {
        ch = P1AsciiLower(ch);
    }
    return result;
}

static bool P1EqualsNoCase(const std::wstring& a, const std::wstring& b) {
    if (a.size() != b.size()) {
        return false;
    }
    for (size_t i = 0; i < a.size(); ++i) {
        if (P1AsciiLower(a[i]) != P1AsciiLower(b[i])) {
            return false;
        }
    }
    return true;
}

// Splits on `sep` into at most maxFields entries. The last entry receives the
// rest of the text unchanged, which is what the protocol needs for bodies and
// for the settings JSON.
static void P1Split(const std::wstring& text,
                    wchar_t sep,
                    size_t maxFields,
                    std::vector<std::wstring>& out) {
    out.clear();
    if (maxFields == 0) {
        return;
    }
    size_t start = 0;
    while (out.size() + 1 < maxFields) {
        size_t pos = text.find(sep, start);
        if (pos == std::wstring::npos) {
            break;
        }
        out.push_back(text.substr(start, pos - start));
        start = pos + 1;
    }
    out.push_back(text.substr(start));
}

static bool P1ParseUInt64(const std::wstring& text, unsigned long long& value) {
    // 20 digits is the longest possible uint64; the overflow check below
    // rejects anything above 18446744073709551615.
    if (text.empty() || text.size() > 20) {
        return false;
    }
    unsigned long long result = 0;
    for (wchar_t ch : text) {
        if (ch < L'0' || ch > L'9') {
            return false;
        }
        unsigned digit = static_cast<unsigned>(ch - L'0');
        if (result > (~0ull - digit) / 10ull) {
            return false;
        }
        result = result * 10ull + digit;
    }
    if (result == 0) {
        return false;
    }
    value = result;
    return true;
}

static int P1ClampInt(int value, int low, int high) {
    if (value < low) {
        return low;
    }
    if (value > high) {
        return high;
    }
    return value;
}

static std::wstring P1ClipForLog(const std::wstring& text, size_t maxChars) {
    if (text.size() <= maxChars) {
        return text;
    }
    std::wstring result = text.substr(0, maxChars);
    result += L"...";
    return result;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

struct P1SettingsSnapshot {
    std::wstring targetLang;
    std::wstring provider;
    std::wstring llmBaseUrl;
    std::wstring llmModel;
    std::wstring credentialTarget;
    std::wstring llmApiKey;
    std::wstring keySourceSetting;
    std::vector<std::wstring> glossary;
    std::wstring shortcutToggle;
    bool gestureToggle = true;
    bool scopeReadme = true;
    bool scopeSettings = true;
    bool scopeModName = true;
    bool scopeModSummary = true;
    bool scopeChangelog = true;
    int hoverDelayMs = 120;
    int batchSize = 20;
    int batchChars = 10000;
    int batchIntervalMs = 400;
    int concurrency = 4;
    int timeoutMs = 20000;
    bool cacheEnabled = true;
    int cacheTtlDays = 30;
    bool debug = false;
    bool clearCacheRequested = false;
};

static std::wstring P1ReadStringSetting(PCWSTR name,
                                        PCWSTR fallback,
                                        bool allowEmpty) {
    PCWSTR value = Wh_GetStringSetting(name);
    std::wstring result;
    try {
        if (value) {
            result.assign(value);
        }
    } catch (...) {
    }
    if (value) {
        Wh_FreeStringSetting(value);
    }
    if (result.empty() && !allowEmpty && fallback) {
        try {
            result.assign(fallback);
        } catch (...) {
        }
    }
    return result;
}

static P1SettingsSnapshot P1ReadSettings() {
    P1SettingsSnapshot s;
    s.targetLang = P1ReadStringSetting(L"targetLang", L"auto", false);
    s.provider = P1ReadStringSetting(L"provider", L"auto", false);
    s.llmBaseUrl =
        P1ReadStringSetting(L"llmBaseUrl", L"https://api.openai.com/v1", false);
    s.llmModel = P1ReadStringSetting(L"llmModel", L"", true);
    s.credentialTarget = P1ReadStringSetting(L"credentialTarget",
                                             L"windhawk-ui-translator", false);
    s.llmApiKey = P1ReadStringSetting(L"llmApiKey", L"", true);
    s.keySourceSetting =
        P1ReadStringSetting(L"llmKeySource", L"credential", false);
    // A list setting: elements are read as `glossary[0]`, `glossary[1]`, ... and
    // the first missing (or empty) entry ends the list. The settings block needs
    // one default row because Windhawk rejects an empty array; that row is empty
    // and therefore reads back as an empty list.
    s.glossary.clear();
    for (int index = 0;; ++index) {
        PCWSTR value = Wh_GetStringSetting(L"glossary[%d]", index);
        std::wstring entry;
        if (value) {
            try {
                entry.assign(value);
            } catch (...) {
            }
            Wh_FreeStringSetting(value);
        }
        if (entry.empty()) {
            break;
        }
        try {
            s.glossary.push_back(entry);
        } catch (...) {
            break;
        }
    }
    // Empty is a valid value for the shortcut: it disables it.
    s.shortcutToggle = P1ReadStringSetting(L"shortcutToggle", L"Alt+Q", true);
    s.gestureToggle = Wh_GetIntSetting(L"gestureToggle") != 0;

    s.scopeReadme = Wh_GetIntSetting(L"scopeReadme") != 0;
    s.scopeSettings = Wh_GetIntSetting(L"scopeSettings") != 0;
    s.scopeModName = Wh_GetIntSetting(L"scopeModName") != 0;
    s.scopeModSummary = Wh_GetIntSetting(L"scopeModSummary") != 0;
    s.scopeChangelog = Wh_GetIntSetting(L"scopeChangelog") != 0;
    s.cacheEnabled = Wh_GetIntSetting(L"cacheEnabled") != 0;
    s.debug = Wh_GetIntSetting(L"debug") != 0;
    s.clearCacheRequested = Wh_GetIntSetting(L"clearCache") != 0;

    s.hoverDelayMs = P1ClampInt(Wh_GetIntSetting(L"hoverDelayMs"), 0, 2000);
    s.batchSize = P1ClampInt(Wh_GetIntSetting(L"batchSize"), 1, 100);
    s.batchChars = P1ClampInt(Wh_GetIntSetting(L"batchChars"), 256, 200000);
    s.batchIntervalMs =
        P1ClampInt(Wh_GetIntSetting(L"batchIntervalMs"), 0, 5000);
    s.concurrency = P1ClampInt(Wh_GetIntSetting(L"concurrency"), 1, 8);
    s.timeoutMs = P1ClampInt(Wh_GetIntSetting(L"timeoutMs"), 1000, 120000);
    s.cacheTtlDays = P1ClampInt(Wh_GetIntSetting(L"cacheTtlDays"), 0, 3650);
    return s;
}

static void P1JsonEscapeAppend(std::wstring& out, const std::wstring& value) {
    out.push_back(L'"');
    for (wchar_t ch : value) {
        switch (ch) {
            case L'"':
                out += L"\\\"";
                break;
            case L'\\':
                out += L"\\\\";
                break;
            case L'\b':
                out += L"\\b";
                break;
            case L'\f':
                out += L"\\f";
                break;
            case L'\n':
                out += L"\\n";
                break;
            case L'\r':
                out += L"\\r";
                break;
            case L'\t':
                out += L"\\t";
                break;
            default:
                if (ch < 0x20) {
                    wchar_t buffer[8] = {};
                    swprintf_s(buffer, ARRAYSIZE(buffer), L"\\u%04X",
                               static_cast<unsigned>(ch));
                    out += buffer;
                } else {
                    out.push_back(ch);
                }
                break;
        }
    }
    out.push_back(L'"');
}

static std::wstring P1BuildSettingsJson(const P1SettingsSnapshot& s,
                                        const std::wstring& keySource,
                                        bool clearCache) {
    std::wstring json;
    json.reserve(1024);
    json += L"{";
    bool first = true;
    auto sepName = [&](const wchar_t* name) {
        if (!first) {
            json += L",";
        }
        first = false;
        json += L'"';
        json += name;
        json += L"\":";
    };
    auto appendString = [&](const wchar_t* name, const std::wstring& value) {
        sepName(name);
        P1JsonEscapeAppend(json, value);
    };
    auto appendNumber = [&](const wchar_t* name, int value) {
        sepName(name);
        json += std::to_wstring(value);
    };
    auto appendBool = [&](const wchar_t* name, bool value) {
        sepName(name);
        json += value ? L"true" : L"false";
    };
    auto appendStringArray = [&](const wchar_t* name,
                                 const std::vector<std::wstring>& values) {
        sepName(name);
        json += L"[";
        bool firstItem = true;
        for (const std::wstring& value : values) {
            if (!firstItem) {
                json += L",";
            }
            firstItem = false;
            P1JsonEscapeAppend(json, value);
        }
        json += L"]";
    };

    appendString(L"targetLang", s.targetLang);
    appendString(L"provider", s.provider);
    appendString(L"llmBaseUrl", s.llmBaseUrl);
    appendString(L"llmModel", s.llmModel);
    appendString(L"llmKeySource", keySource);
    appendStringArray(L"glossary", s.glossary);
    appendBool(L"scopeReadme", s.scopeReadme);
    appendBool(L"scopeSettings", s.scopeSettings);
    appendBool(L"scopeModName", s.scopeModName);
    appendBool(L"scopeModSummary", s.scopeModSummary);
    appendBool(L"scopeChangelog", s.scopeChangelog);
    appendNumber(L"hoverDelayMs", s.hoverDelayMs);
    appendString(L"shortcutToggle", s.shortcutToggle);
    appendBool(L"gestureToggle", s.gestureToggle);
    appendNumber(L"batchSize", s.batchSize);
    appendNumber(L"batchChars", s.batchChars);
    appendNumber(L"batchIntervalMs", s.batchIntervalMs);
    appendNumber(L"concurrency", s.concurrency);
    appendNumber(L"timeoutMs", s.timeoutMs);
    appendBool(L"cacheEnabled", s.cacheEnabled);
    appendNumber(L"cacheTtlDays", s.cacheTtlDays);
    appendBool(L"clearCache", clearCache);
    appendBool(L"debug", s.debug);
    json += L"}";
    return json;
}

// ---------------------------------------------------------------------------
// API key
// ---------------------------------------------------------------------------

struct P1KeyInfo {
    std::wstring source;  // none | credential | setting
    std::string key;      // UTF-8, empty when there is no key
    std::wstring host;    // lower-case host of llmBaseUrl, may be empty
};

// Hosts that never receive the LLM key, whatever llmBaseUrl says: these are the
// free translation endpoints, which need no auth. Compared case-insensitively.
static bool P1HostExcludedFromAuth(const std::wstring& host) {
    return P1EqualsNoCase(host, L"edge.microsoft.com") ||
           P1EqualsNoCase(host, L"translate.googleapis.com");
}

// Only the host decides whether a request gets the key: ports and paths are
// ignored. `llmBaseUrl` of `https://api.example.com/v1` therefore covers
// `https://api.example.com/v1/chat/completions`, any port, and any letter case
// in the host.
static bool P1HostMatchesKey(const std::wstring& requestHost,
                             const std::wstring& keyHost) {
    if (requestHost.empty() || keyHost.empty()) {
        return false;
    }
    return P1EqualsNoCase(requestHost, keyHost);
}

static std::mutex g_p1KeyMutex;
static bool g_p1KeyCacheValid = false;
static long g_p1KeyCacheGeneration = -1;
static P1KeyInfo g_p1KeyCache;
static std::atomic<long> g_p1SettingsGeneration{0};

static bool P1DecodeCredentialBlob(const CREDENTIALW* credential,
                                   std::string& out) {
    out.clear();
    if (!credential || !credential->CredentialBlob ||
        credential->CredentialBlobSize < 2) {
        return false;
    }

    const BYTE* bytes = credential->CredentialBlob;
    DWORD size = credential->CredentialBlobSize;

    if (size >= 2 && bytes[0] == 0xFF && bytes[1] == 0xFE) {
        size_t chars = (size - 2) / sizeof(wchar_t);
        std::wstring text(reinterpret_cast<const wchar_t*>(bytes + 2), chars);
        while (!text.empty() && text.back() == L'\0') {
            text.pop_back();
        }
        out = P1WideToUtf8(text);
        return !out.empty();
    }

    const BYTE* data = bytes;
    DWORD dataSize = size;
    bool utf16Likely = false;
    if (size >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB &&
        bytes[2] == 0xBF) {
        data = bytes + 3;
        dataSize = size - 3;
    } else if ((dataSize % 2) == 0) {
        // BOM-less UTF-16LE text has NUL bytes at the odd offsets. It is valid
        // UTF-8 as well (all bytes below 0x80), so the NUL pattern has to win
        // before the "try UTF-8" rule. The last UTF-16 code unit (usually the
        // NUL terminator) is excluded from the pattern check.
        size_t scanSize = dataSize >= 2 ? dataSize - 2 : dataSize;
        size_t oddNuls = 0;
        size_t evenNuls = 0;
        for (size_t i = 0; i < scanSize; ++i) {
            if (data[i] == 0) {
                if (i % 2) {
                    ++oddNuls;
                } else {
                    ++evenNuls;
                }
            }
        }
        utf16Likely = oddNuls > 0 && evenNuls == 0;
    }

    if (utf16Likely) {
        std::wstring text(reinterpret_cast<const wchar_t*>(data),
                          dataSize / sizeof(wchar_t));
        while (!text.empty() && text.back() == L'\0') {
            text.pop_back();
        }
        out = P1WideToUtf8(text);
        return !out.empty();
    }

    // No BOM and no UTF-16 pattern: UTF-8 if it decodes cleanly, otherwise
    // UTF-16 LE as a last attempt (the form cmdkey writes on some systems).
    int wideLength =
        MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS,
                            reinterpret_cast<const char*>(data),
                            static_cast<int>(dataSize), nullptr, 0);
    if (wideLength <= 0 && (dataSize % 2) == 0) {
        std::wstring text(reinterpret_cast<const wchar_t*>(data),
                          dataSize / sizeof(wchar_t));
        while (!text.empty() && text.back() == L'\0') {
            text.pop_back();
        }
        out = P1WideToUtf8(text);
        return !out.empty();
    }

    out.assign(reinterpret_cast<const char*>(data), dataSize);
    while (!out.empty() && out.back() == '\0') {
        out.pop_back();
    }
    return !out.empty();
}

static bool P1ReadCredentialKey(const std::wstring& target,
                                std::string& key,
                                DWORD& error) {
    key.clear();
    error = 0;
    PCREDENTIALW credential = nullptr;
    if (!CredReadW(target.c_str(), CRED_TYPE_GENERIC, 0, &credential) ||
        !credential) {
        error = GetLastError();
        return false;
    }

    bool ok = P1DecodeCredentialBlob(credential, key);
    if (credential->CredentialBlob && credential->CredentialBlobSize) {
        SecureZeroMemory(credential->CredentialBlob,
                         credential->CredentialBlobSize);
    }
    CredFree(credential);
    if (!ok) {
        error = ERROR_INVALID_DATA;
    }
    return ok;
}

struct P1UrlParts {
    std::wstring host;
    std::wstring path;
    INTERNET_PORT port = INTERNET_DEFAULT_HTTPS_PORT;
    bool secure = true;
};

static bool P1ParseUrl(const std::wstring& url, P1UrlParts& parts) {
    if (url.empty() || url.size() > kP1MaxUrlChars) {
        return false;
    }

    URL_COMPONENTS components{};
    components.dwStructSize = sizeof(components);
    components.dwSchemeLength = static_cast<DWORD>(-1);
    components.dwHostNameLength = static_cast<DWORD>(-1);
    components.dwUserNameLength = static_cast<DWORD>(-1);
    components.dwPasswordLength = static_cast<DWORD>(-1);
    components.dwUrlPathLength = static_cast<DWORD>(-1);
    components.dwExtraInfoLength = static_cast<DWORD>(-1);

    if (!WinHttpCrackUrl(url.c_str(), 0, 0, &components)) {
        return false;
    }
    if (components.nScheme != INTERNET_SCHEME_HTTP &&
        components.nScheme != INTERNET_SCHEME_HTTPS) {
        return false;
    }
    if (!components.lpszHostName || components.dwHostNameLength == 0) {
        return false;
    }
    // Credentials in the URL are not part of the protocol.
    if (components.dwUserNameLength != 0 || components.dwPasswordLength != 0) {
        return false;
    }

    parts.host.assign(components.lpszHostName, components.dwHostNameLength);
    parts.secure = components.nScheme == INTERNET_SCHEME_HTTPS;
    parts.port = components.nPort;
    if (parts.port == 0) {
        parts.port = parts.secure ? INTERNET_DEFAULT_HTTPS_PORT
                                  : INTERNET_DEFAULT_HTTP_PORT;
    }

    std::wstring path;
    if (components.lpszUrlPath && components.dwUrlPathLength) {
        path.assign(components.lpszUrlPath, components.dwUrlPathLength);
    }
    if (components.lpszExtraInfo && components.dwExtraInfoLength) {
        path.append(components.lpszExtraInfo, components.dwExtraInfoLength);
    }
    if (path.empty()) {
        path = L"/";
    } else if (path[0] != L'/') {
        path.insert(path.begin(), L'/');
    }
    parts.path = path;
    return true;
}

// A key with CR/LF/NUL in it must never reach the header block: it would
// either break the request or inject extra headers.
static void P1SanitizeKey(std::string& key) {
    std::string cleaned;
    cleaned.reserve(key.size());
    for (char ch : key) {
        if (ch != '\r' && ch != '\n' && ch != '\0') {
            cleaned.push_back(ch);
        }
    }
    key.swap(cleaned);
}

static P1KeyInfo P1BuildKeyInfo(const P1SettingsSnapshot& s) {
    P1KeyInfo info;
    P1UrlParts base;
    if (P1ParseUrl(s.llmBaseUrl, base)) {
        info.host = P1Lower(base.host);
    } else {
        P0_LOG(L"[p1] llmBaseUrl has no usable http(s) host; auth injection "
               L"disabled");
    }

    // Anything but the three documented values is treated as none, with one
    // line, so a typo can never silently send a key.
    std::wstring source = P1Lower(s.keySourceSetting);
    if (source != L"credential" && source != L"setting" && source != L"none") {
        P0_LOG(L"[p1] unknown llmKeySource '%s'; treating it as none",
               s.keySourceSetting.c_str());
        source = L"none";
    }

    if (source == L"none") {
        // The user asked for no key: neither the credential nor the plaintext
        // field is read.
        info.source = L"none";
        return info;
    }

    if (source == L"credential") {
        std::string key;
        DWORD error = 0;
        if (P1ReadCredentialKey(s.credentialTarget, key, error)) {
            P1SanitizeKey(key);
            if (!key.empty()) {
                P0_LOG(L"[p1] credential target=%s found=1 bytes=%llu",
                       s.credentialTarget.c_str(),
                       static_cast<unsigned long long>(key.size()));
                info.source = L"credential";
                info.key = std::move(key);
                return info;
            }
            // A blob that decodes to nothing is a missing key as well.
            error = ERROR_INVALID_DATA;
        }
        // Exactly one line, with the target name and the Win32 error, so a
        // missing credential is diagnosable from p0.log. The key value itself
        // is never part of any log call. Then the plaintext setting is used if
        // it has anything in it.
        P0_LOG(L"[p1] credential target=%s found=0 error=%lu; plaintext "
               L"fallback=%s",
               s.credentialTarget.c_str(), error,
               s.llmApiKey.empty() ? L"absent" : L"used");
        source = L"setting";
    }

    std::string fallback = P1WideToUtf8(s.llmApiKey);
    P1SanitizeKey(fallback);
    if (fallback.empty()) {
        // No key anywhere: report none, so the page knows the key is missing.
        info.source = L"none";
        info.key.clear();
        return info;
    }
    info.source = L"setting";
    info.key = std::move(fallback);
    return info;
}

static P1KeyInfo P1GetKeyInfo() {
    long generation = g_p1SettingsGeneration.load(std::memory_order_acquire);
    std::lock_guard<std::mutex> lock(g_p1KeyMutex);
    if (g_p1KeyCacheValid && g_p1KeyCacheGeneration == generation) {
        return g_p1KeyCache;
    }
    P1SettingsSnapshot s = P1ReadSettings();
    P1KeyInfo info = P1BuildKeyInfo(s);
    g_p1KeyCache = info;
    g_p1KeyCacheGeneration = generation;
    g_p1KeyCacheValid = true;
    return info;
}

static void P1ClearKeyCache() {
    std::lock_guard<std::mutex> lock(g_p1KeyMutex);
    if (!g_p1KeyCache.key.empty()) {
        SecureZeroMemory(&g_p1KeyCache.key[0], g_p1KeyCache.key.size());
    }
    g_p1KeyCache = P1KeyInfo();
    g_p1KeyCacheValid = false;
}

// ---------------------------------------------------------------------------
// UI-thread dispatcher
//
// Win32 marshalling: the window is created on the WebView2 UI thread, workers
// only PostMessage to it, and the window procedure runs on the UI thread. A
// message-only window is never visible and is not enumerated.
// ---------------------------------------------------------------------------

static std::atomic<HWND> g_p1DispatchWindow{nullptr};
static std::atomic<DWORD> g_p1UiThreadId{0};
static std::atomic<bool> g_p1DispatchClassRegistered{false};
static std::atomic<bool> g_p1PageReady{false};
static std::atomic<bool> g_p1SettingsDirty{false};
static std::atomic<bool> g_p1FirstSettingsPush{true};

static void P1NoteUiThread() {
    DWORD current = GetCurrentThreadId();
    DWORD expected = 0;
    g_p1UiThreadId.compare_exchange_strong(expected, current);
}

static void P1DrainRepliesOnUiThread();
static void P1PushSettingsToAll(const wchar_t* reason);

static LRESULT CALLBACK P1DispatchWndProc(HWND hwnd,
                                          UINT message,
                                          WPARAM wParam,
                                          LPARAM lParam) {
    (void)wParam;
    (void)lParam;
    try {
        switch (message) {
            case kP1MsgDrainReplies:
                P1DrainRepliesOnUiThread();
                return 0;
            case kP1MsgSettingsChanged:
                P1DrainRepliesOnUiThread();
                if (g_p1SettingsDirty.exchange(false) &&
                    g_p1PageReady.load()) {
                    P1PushSettingsToAll(L"settings-changed");
                }
                return 0;
            case kP1MsgDestroyWindow:
                g_p1DispatchWindow.store(nullptr);
                DestroyWindow(hwnd);
                UnregisterClassW(kP1DispatchClass, GetModuleHandleW(nullptr));
                return 0;
            default:
                break;
        }
    } catch (...) {
    }
    return DefWindowProcW(hwnd, message, wParam, lParam);
}

static bool P1EnsureDispatchWindow() {
    if (g_p1DispatchWindow.load(std::memory_order_acquire)) {
        return true;
    }

    DWORD uiThread = g_p1UiThreadId.load(std::memory_order_acquire);
    if (uiThread == 0 || GetCurrentThreadId() != uiThread) {
        return false;
    }

    if (!g_p1DispatchClassRegistered.load(std::memory_order_acquire)) {
        WNDCLASSEXW windowClass{};
        windowClass.cbSize = sizeof(windowClass);
        windowClass.lpfnWndProc = &P1DispatchWndProc;
        windowClass.hInstance = GetModuleHandleW(nullptr);
        windowClass.lpszClassName = kP1DispatchClass;
        if (!RegisterClassExW(&windowClass)) {
            DWORD error = GetLastError();
            if (error != ERROR_CLASS_ALREADY_EXISTS) {
                P0_LOG(L"[p1] RegisterClassExW failed (%lu); replies will be "
                       L"flushed on the next page message",
                       error);
                return false;
            }
        }
        g_p1DispatchClassRegistered.store(true, std::memory_order_release);
    }

    HWND window = CreateWindowExW(0, kP1DispatchClass, L"", 0, 0, 0, 0, 0,
                                  HWND_MESSAGE, nullptr,
                                  GetModuleHandleW(nullptr), nullptr);
    if (!window) {
        P0_LOG(L"[p1] CreateWindowExW failed (%lu); replies will be flushed on "
               L"the next page message",
               GetLastError());
        return false;
    }

    g_p1DispatchWindow.store(window, std::memory_order_release);
    return true;
}

static void P1WakeUi() {
    HWND window = g_p1DispatchWindow.load(std::memory_order_acquire);
    if (window) {
        PostMessageW(window, kP1MsgDrainReplies, 0, 0);
    }
}

static void P1RequestSettingsPush() {
    g_p1SettingsDirty.store(true);

    DWORD uiThread = g_p1UiThreadId.load(std::memory_order_acquire);
    if (uiThread != 0 && GetCurrentThreadId() == uiThread) {
        if (g_p1PageReady.load()) {
            g_p1SettingsDirty.store(false);
            P1PushSettingsToAll(L"settings-changed");
        }
        return;
    }

    HWND window = g_p1DispatchWindow.load(std::memory_order_acquire);
    if (window) {
        PostMessageW(window, kP1MsgSettingsChanged, 0, 0);
    }
}

static void P1PinModule() {
    HMODULE module = nullptr;
    if (GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS |
                               GET_MODULE_HANDLE_EX_FLAG_PIN,
                           reinterpret_cast<LPCWSTR>(&P1PinModule), &module)) {
        P0_LOG(L"[p1] a background thread is still busy at unload; the mod DLL "
               L"is pinned so the thread cannot return into unloaded code");
    } else {
        P0_LOG(L"[p1] a background thread is still busy at unload and the DLL "
               L"could not be pinned (error=%lu)",
               GetLastError());
    }
}

static void P1DestroyDispatchWindow() {
    HWND window = g_p1DispatchWindow.exchange(nullptr);
    if (!window) {
        return;
    }

    DWORD uiThread = g_p1UiThreadId.load(std::memory_order_acquire);
    if (uiThread != 0 && GetCurrentThreadId() == uiThread) {
        DestroyWindow(window);
        UnregisterClassW(kP1DispatchClass, GetModuleHandleW(nullptr));
        P0_LOG(L"[p1] dispatch window destroyed");
        return;
    }

    DWORD_PTR result = 0;
    if (!SendMessageTimeoutW(window, kP1MsgDestroyWindow, 0, 0,
                             SMTO_ABORTIFHUNG | SMTO_BLOCK, 2000, &result)) {
        P0_LOG(L"[p1] dispatch window could not be destroyed (error=%lu); "
               L"pinning the module",
               GetLastError());
        P1PinModule();
    } else {
        P0_LOG(L"[p1] dispatch window destroyed");
    }
}

// ---------------------------------------------------------------------------
// Debug trace of the HTTP relay
//
// Only active while the "debug" setting is on, so the normal path builds no
// trace strings at all. It answers one question from outside the app: is the
// same source string relayed more than once, and in which batches. Only the
// request body is logged, never the headers, so neither the API key nor the
// injected Authorization header can reach the log.
//
// The page sends a JSON array of strings; the segment count is the number of
// occurrences of "," plus one (inside a JSON string a quote is escaped as \", so
// the sequence can only sit between two elements). Bodies reach 1 MB, so only a
// short, control-character-escaped prefix is logged, at most 40 lines per
// minute, with one "[trace] throttled" notice when the budget runs out.
// ---------------------------------------------------------------------------

static constexpr unsigned kP1TraceLinesPerMinute = 40;
static constexpr size_t kP1TraceBodyChars = 300;
static constexpr size_t kP1TraceRespChars = 120;

static SRWLOCK g_p1TraceLock = SRWLOCK_INIT;
static unsigned long long g_p1TraceWindowStart = 0;
static unsigned g_p1TraceLines = 0;
static bool g_p1TraceThrottleLogged = false;

enum class P1TraceDecision { Allow, Throttled, Suppress };

static P1TraceDecision P1TraceReserve() {
    AcquireSRWLockExclusive(&g_p1TraceLock);
    unsigned long long now = GetTickCount64();
    if (g_p1TraceWindowStart == 0 ||
        now - g_p1TraceWindowStart >= 60ull * 1000ull) {
        g_p1TraceWindowStart = now;
        g_p1TraceLines = 0;
        g_p1TraceThrottleLogged = false;
    }
    P1TraceDecision decision = P1TraceDecision::Suppress;
    if (g_p1TraceLines < kP1TraceLinesPerMinute) {
        ++g_p1TraceLines;
        decision = P1TraceDecision::Allow;
    } else if (!g_p1TraceThrottleLogged) {
        g_p1TraceThrottleLogged = true;
        decision = P1TraceDecision::Throttled;
    }
    ReleaseSRWLockExclusive(&g_p1TraceLock);
    return decision;
}

// Returns true when the caller may write one trace line. Writes the single
// "[trace] throttled" notice itself, so callers never repeat it.
static bool P1TraceBegin() {
    P1TraceDecision decision = P1TraceReserve();
    if (decision == P1TraceDecision::Throttled) {
        P0WriteFileLog(L"[trace] throttled");
        return false;
    }
    return decision == P1TraceDecision::Allow;
}

// Appends at most maxChars characters of text to out, escaping anything that
// would break the one-line rule or smuggle a control character into the log.
static void P1TraceAppendEscaped(std::wstring& out,
                                 const std::wstring& text,
                                 size_t maxChars) {
    size_t count = std::min(maxChars, text.size());
    for (size_t i = 0; i < count; ++i) {
        wchar_t ch = text[i];
        switch (ch) {
            case L'\\':
                out += L"\\\\";
                break;
            case L'\r':
                out += L"\\r";
                break;
            case L'\n':
                out += L"\\n";
                break;
            case L'\t':
                out += L"\\t";
                break;
            default:
                if (ch < 0x20 || ch == 0x7f) {
                    wchar_t buffer[8] = {};
                    swprintf_s(buffer, ARRAYSIZE(buffer), L"\\u%04X",
                               static_cast<unsigned>(ch));
                    out += buffer;
                } else {
                    out.push_back(ch);
                }
                break;
        }
    }
}

// Converts a short UTF-8 prefix, cut on a code-point boundary, and escapes it.
static std::wstring P1TracePreviewUtf8(const std::string& utf8,
                                       size_t maxChars) {
    std::wstring preview;
    if (utf8.empty()) {
        return preview;
    }
    size_t limit = std::min(utf8.size(), maxChars * 4);
    while (limit > 0 && limit < utf8.size() &&
           (static_cast<unsigned char>(utf8[limit]) & 0xC0) == 0x80) {
        --limit;
    }
    std::wstring wide = P1Utf8ToWide(utf8.substr(0, limit));
    P1TraceAppendEscaped(preview, wide, maxChars);
    return preview;
}

static unsigned long long P1TraceCountSegments(const std::string& body) {
    if (body.empty()) {
        return 0;
    }
    unsigned long long count = 1;
    for (size_t i = 0; i + 2 < body.size(); ++i) {
        if (body[i] == '"' && body[i + 1] == ',' && body[i + 2] == '"') {
            ++count;
        }
    }
    return count;
}

// Two lines per relayed request: size/batch, then the escaped body prefix.
static void P1TraceHttpRequest(unsigned long long id,
                               const std::string& body) {
    if (P1TraceBegin()) {
        P0WriteFileLog(L"[trace] http id=%llu bytes=%llu batch=%llu", id,
                       static_cast<unsigned long long>(body.size()),
                       P1TraceCountSegments(body));
    }
    if (P1TraceBegin()) {
        std::wstring preview = P1TracePreviewUtf8(body, kP1TraceBodyChars);
        P0WriteFileLog(L"[trace] body id=%llu %s", id, preview.c_str());
    }
}

static void P1TraceHttpResponse(unsigned long long id,
                                int status,
                                const std::string& body) {
    if (!P1TraceBegin()) {
        return;
    }
    std::wstring preview = P1TracePreviewUtf8(body, kP1TraceRespChars);
    P0WriteFileLog(L"[trace] resp id=%llu status=%d bytes=%llu first=%s", id,
                   status, static_cast<unsigned long long>(body.size()),
                   preview.c_str());
}

// ---------------------------------------------------------------------------
// HTTP request/response structures
// ---------------------------------------------------------------------------

struct P1HttpRequest {
    unsigned long long id = 0;
    std::wstring method;
    std::wstring url;
    std::vector<std::pair<std::wstring, std::wstring>> headers;
    std::string body;
    unsigned long long timeoutMs = 20000;
    std::string apiKey;       // never passed to a log call; header only
    std::wstring apiKeyHost;  // lower-case host the key is allowed for
    bool trace = false;       // debug setting at relay time
    void* webView = nullptr;  // owned reference, released on the UI thread
};

struct P1HttpReply {
    unsigned long long id = 0;
    int status = 0;
    unsigned long error = 0;
    std::string body;
    void* webView = nullptr;  // owned reference, released on the UI thread
};

static SRWLOCK g_p1HttpLock = SRWLOCK_INIT;
static CONDITION_VARIABLE g_p1HttpCv = CONDITION_VARIABLE_INIT;
static std::deque<P1HttpRequest*> g_p1HttpQueue;
static std::vector<HANDLE> g_p1Workers;
static bool g_p1HttpStarted = false;
static bool g_p1HttpStop = false;

static SRWLOCK g_p1ReplyLock = SRWLOCK_INIT;
static std::deque<P1HttpReply*> g_p1ReplyQueue;

static void P1ReleaseWebViewRef(void* webView) {
    if (!webView) {
        return;
    }
    auto release =
        reinterpret_cast<FnRelease>(P0GetRawSlot(webView, kSlotRelease));
    if (release) {
        release(webView);
    }
}

static std::wstring P1BuildHttpReplyMessage(unsigned long long id,
                                           int status,
                                           unsigned long error,
                                           const std::string& bodyUtf8) {
    std::wstring text;
    text.reserve(bodyUtf8.size() + 96);
    text += kP1Tag;
    text.push_back(0x1f);
    text += L"http";
    text.push_back(0x1f);
    text += std::to_wstring(id);
    text.push_back(0x1f);
    text += std::to_wstring(status);
    text.push_back(0x1f);
    text += std::to_wstring(error);
    text.push_back(0x1f);
    text += P1Utf8ToWide(bodyUtf8);
    return text;
}

static void P1PostHttpReply(void* webView,
                            unsigned long long id,
                            int status,
                            unsigned long error,
                            const std::string& bodyUtf8) {
    if (!webView) {
        return;
    }
    void* postFn = nullptr;
    if (!P0GetValidatedSlot(webView, kWebViewSlotPostWebMessageAsString,
                            &postFn)) {
        return;
    }
    std::wstring text = P1BuildHttpReplyMessage(id, status, error, bodyUtf8);
    HRESULT hr = reinterpret_cast<FnPostWebMessageAsString>(postFn)(
        webView, text.c_str());
    if (FAILED(hr)) {
        P0_LOG(L"[p1] http reply id=%llu could not be posted (hr=%08X)", id,
               static_cast<unsigned>(hr));
    }
}

static void P1DrainRepliesOnUiThread() {
    std::deque<P1HttpReply*> replies;
    AcquireSRWLockExclusive(&g_p1ReplyLock);
    replies.swap(g_p1ReplyQueue);
    ReleaseSRWLockExclusive(&g_p1ReplyLock);

    for (P1HttpReply* reply : replies) {
        if (!reply) {
            continue;
        }
        try {
            P1PostHttpReply(reply->webView, reply->id, reply->status,
                            reply->error, reply->body);
        } catch (...) {
            P0_LOG(L"[p1] exception while posting http reply id=%llu",
                   reply->id);
        }
        P1ReleaseWebViewRef(reply->webView);
        delete reply;
    }
}

// ---------------------------------------------------------------------------
// HTTP worker pool
// ---------------------------------------------------------------------------

static P1HttpReply* P1PerformHttp(const P1HttpRequest* request) {
    auto* reply = new (std::nothrow) P1HttpReply();
    if (!reply) {
        return nullptr;
    }
    reply->id = request->id;
    reply->webView = request->webView;

    unsigned long long started = GetTickCount64();
    std::wstring hostForLog = L"(invalid)";
    std::wstring methodForLog = request->method;
    const wchar_t* stage = L"parse-url";
    bool truncated = false;

    try {
        P1UrlParts parts;
        if (!P1ParseUrl(request->url, parts)) {
            reply->error = ERROR_INVALID_PARAMETER;
            P0WriteFileLog(L"[p1] http id=%llu method=%s host=%s stage=%s "
                           L"error=%lu ms=%llu",
                           request->id, methodForLog.c_str(),
                           hostForLog.c_str(), stage, reply->error,
                           GetTickCount64() - started);
            if (request->trace) {
                P1TraceHttpResponse(request->id, reply->status, reply->body);
            }
            return reply;
        }
        hostForLog = P1ClipForLog(parts.host, 80);

        struct Handles {
            HINTERNET session = nullptr;
            HINTERNET connect = nullptr;
            HINTERNET request = nullptr;
            ~Handles() {
                if (request) {
                    WinHttpCloseHandle(request);
                }
                if (connect) {
                    WinHttpCloseHandle(connect);
                }
                if (session) {
                    WinHttpCloseHandle(session);
                }
            }
        } handles;

        stage = L"open";
        handles.session = WinHttpOpen(
            L"WindhawkUITranslator/1.0", WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY,
            WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
        if (!handles.session) {
            reply->error = GetLastError();
            throw reply->error;
        }

        int timeout = static_cast<int>(request->timeoutMs);
        WinHttpSetTimeouts(handles.session, timeout, timeout, timeout, timeout);

        stage = L"connect";
        handles.connect = WinHttpConnect(handles.session, parts.host.c_str(),
                                         parts.port, 0);
        if (!handles.connect) {
            reply->error = GetLastError();
            throw reply->error;
        }

        stage = L"open-request";
        handles.request = WinHttpOpenRequest(
            handles.connect, request->method.c_str(), parts.path.c_str(),
            nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES,
            parts.secure ? WINHTTP_FLAG_SECURE : 0);
        if (!handles.request) {
            reply->error = GetLastError();
            throw reply->error;
        }

        DWORD decompression = WINHTTP_DECOMPRESSION_FLAG_ALL;
        if (!WinHttpSetOption(handles.request, WINHTTP_OPTION_DECOMPRESSION,
                              &decompression, sizeof(decompression))) {
            P0WriteFileLog(L"[p1] http id=%llu decompression option failed "
                           L"(%lu); continuing",
                           request->id, GetLastError());
        }

        stage = L"headers";
        // The key lives in P1HttpRequest::apiKey and in this header block, and
        // nowhere else. Neither is ever passed to a log call: every log line in
        // this function takes only the host, the stage, an error/status code or
        // a body, and the trace functions receive the request body alone.
        std::wstring headerBlock;
        for (const auto& header : request->headers) {
            headerBlock += header.first;
            headerBlock += L": ";
            headerBlock += header.second;
            headerBlock += L"\r\n";
        }

        bool hasAuthorization = false;
        for (const auto& header : request->headers) {
            if (P1EqualsNoCase(header.first, L"authorization")) {
                hasAuthorization = true;
                break;
            }
        }

        bool hostMatchesKey =
            !request->apiKey.empty() &&
            P1HostMatchesKey(parts.host, request->apiKeyHost);
        // The free endpoints never take the key, even when llmBaseUrl is
        // misconfigured to point at one of them.
        if (hostMatchesKey && P1HostExcludedFromAuth(parts.host)) {
            hostMatchesKey = false;
        }
        if (hostMatchesKey && parts.secure && !hasAuthorization) {
            headerBlock += L"Authorization: Bearer ";
            headerBlock += P1Utf8ToWide(request->apiKey);
            headerBlock += L"\r\n";
            P0WriteFileLog(L"[p1] injected auth for host=%s",
                           hostForLog.c_str());
        } else if (hostMatchesKey && !hasAuthorization) {
            P0WriteFileLog(L"[p1] not injecting auth for non-https host=%s",
                           hostForLog.c_str());
        }

        const wchar_t* headers =
            headerBlock.empty() ? WINHTTP_NO_ADDITIONAL_HEADERS
                                : headerBlock.c_str();
        DWORD headersLength = headerBlock.empty() ? 0 : static_cast<DWORD>(-1);

        LPVOID body = nullptr;
        DWORD bodyLength = 0;
        if (request->method != L"GET" && !request->body.empty()) {
            body = const_cast<char*>(request->body.data());
            bodyLength = static_cast<DWORD>(request->body.size());
        }

        stage = L"send";
        if (!WinHttpSendRequest(handles.request, headers, headersLength, body,
                                bodyLength, bodyLength, 0)) {
            reply->error = GetLastError();
            throw reply->error;
        }

        stage = L"receive";
        if (!WinHttpReceiveResponse(handles.request, nullptr)) {
            reply->error = GetLastError();
            throw reply->error;
        }

        stage = L"status";
        DWORD statusCode = 0;
        DWORD statusSize = sizeof(statusCode);
        if (!WinHttpQueryHeaders(handles.request,
                                 WINHTTP_QUERY_STATUS_CODE |
                                     WINHTTP_QUERY_FLAG_NUMBER,
                                 WINHTTP_HEADER_NAME_BY_INDEX, &statusCode,
                                 &statusSize, WINHTTP_NO_HEADER_INDEX)) {
            reply->error = GetLastError();
            throw reply->error;
        }
        reply->status = static_cast<int>(statusCode);

        stage = L"read";
        std::string bodyText;
        bodyText.reserve(64 * 1024);
        for (;;) {
            DWORD available = 0;
            if (!WinHttpQueryDataAvailable(handles.request, &available)) {
                reply->error = GetLastError();
                break;
            }
            if (available == 0) {
                break;
            }

            size_t room = kP1MaxReplyBytes - bodyText.size();
            if (room == 0) {
                DWORD more = 0;
                if (WinHttpQueryDataAvailable(handles.request, &more) &&
                    more > 0) {
                    truncated = true;
                }
                break;
            }

            char buffer[16384];
            DWORD toRead = static_cast<DWORD>(
                std::min<size_t>(room, sizeof(buffer)));
            DWORD read = 0;
            if (!WinHttpReadData(handles.request, buffer, toRead, &read)) {
                reply->error = GetLastError();
                break;
            }
            if (read == 0) {
                break;
            }
            bodyText.append(buffer, read);
            if (bodyText.size() >= kP1MaxReplyBytes) {
                DWORD more = 0;
                if (WinHttpQueryDataAvailable(handles.request, &more) &&
                    more > 0) {
                    truncated = true;
                }
                break;
            }
        }
        reply->body = std::move(bodyText);

        if (reply->error != 0) {
            // Protocol: the body is empty when the request did not complete
            // cleanly, even if a partial response had been read.
            reply->body.clear();
            stage = L"read";
        } else {
            stage = L"done";
        }

        unsigned long long elapsed = GetTickCount64() - started;
        P0WriteFileLog(L"[p1] http id=%llu method=%s host=%s status=%d "
                       L"error=%lu bytes=%llu ms=%llu%s",
                       request->id, methodForLog.c_str(),
                       hostForLog.c_str(), reply->status, reply->error,
                       static_cast<unsigned long long>(reply->body.size()),
                       elapsed, truncated ? L" truncated=1" : L"");
        if (truncated) {
            P0WriteFileLog(L"[p1] http id=%llu response truncated at %llu "
                           L"bytes",
                           request->id,
                           static_cast<unsigned long long>(kP1MaxReplyBytes));
        }
        if (request->trace) {
            P1TraceHttpResponse(request->id, reply->status, reply->body);
        }
        return reply;
    } catch (...) {
        if (reply->error == 0) {
            reply->error = ERROR_NOT_ENOUGH_MEMORY;
        }
        unsigned long long elapsed = GetTickCount64() - started;
        P0WriteFileLog(L"[p1] http id=%llu method=%s host=%s status=%d "
                       L"stage=%s error=%lu bytes=%llu ms=%llu",
                       request->id, methodForLog.c_str(), hostForLog.c_str(),
                       reply->status, stage, reply->error,
                       static_cast<unsigned long long>(reply->body.size()),
                       elapsed);
        if (request->trace) {
            P1TraceHttpResponse(request->id, reply->status, reply->body);
        }
        return reply;
    }
}

static DWORD WINAPI P1HttpWorkerProc(void*) {
    for (;;) {
        P1HttpRequest* request = nullptr;

        AcquireSRWLockExclusive(&g_p1HttpLock);
        while (!g_p1HttpStop && g_p1HttpQueue.empty()) {
            SleepConditionVariableSRW(&g_p1HttpCv, &g_p1HttpLock, INFINITE, 0);
        }
        if (g_p1HttpStop) {
            ReleaseSRWLockExclusive(&g_p1HttpLock);
            break;
        }
        request = g_p1HttpQueue.front();
        g_p1HttpQueue.pop_front();
        ReleaseSRWLockExclusive(&g_p1HttpLock);

        P1HttpReply* reply = nullptr;
        try {
            reply = P1PerformHttp(request);
        } catch (...) {
            reply = nullptr;
        }
        if (!reply) {
            // P1PerformHttp failed before taking over the webview reference.
            P1ReleaseWebViewRef(request->webView);
            delete request;
            continue;
        }
        delete request;

        bool stored = false;
        AcquireSRWLockExclusive(&g_p1ReplyLock);
        try {
            g_p1ReplyQueue.push_back(reply);
            stored = true;
        } catch (...) {
        }
        ReleaseSRWLockExclusive(&g_p1ReplyLock);

        if (stored) {
            P1WakeUi();
        } else {
            P1ReleaseWebViewRef(reply->webView);
            delete reply;
        }
    }
    return 0;
}

static bool P1StartHttpWorkers() {
    AcquireSRWLockExclusive(&g_p1HttpLock);
    if (g_p1HttpStarted) {
        ReleaseSRWLockExclusive(&g_p1HttpLock);
        return true;
    }
    g_p1HttpStarted = true;
    g_p1HttpStop = false;
    ReleaseSRWLockExclusive(&g_p1HttpLock);

    for (size_t i = 0; i < kP1HttpWorkers; ++i) {
        HANDLE thread =
            CreateThread(nullptr, 0, &P1HttpWorkerProc, nullptr, 0, nullptr);
        if (!thread) {
            P0_LOG(L"[p1] CreateThread for an http worker failed (%lu)",
                   GetLastError());
            continue;
        }
        try {
            g_p1Workers.push_back(thread);
        } catch (...) {
            CloseHandle(thread);
        }
    }

    if (g_p1Workers.empty()) {
        AcquireSRWLockExclusive(&g_p1HttpLock);
        g_p1HttpStarted = false;
        ReleaseSRWLockExclusive(&g_p1HttpLock);
        P0_LOG(L"[p1] no http worker could be started");
        return false;
    }

    P0_LOG(L"[p1] %llu http workers started",
           static_cast<unsigned long long>(g_p1Workers.size()));
    return true;
}

static bool P1EnqueueHttpRequest(P1HttpRequest* request) {
    if (!P1StartHttpWorkers()) {
        return false;
    }

    AcquireSRWLockExclusive(&g_p1HttpLock);
    if (g_p1HttpStop || g_p1HttpQueue.size() >= kP1HttpQueueLimit) {
        ReleaseSRWLockExclusive(&g_p1HttpLock);
        return false;
    }
    bool queued = false;
    try {
        g_p1HttpQueue.push_back(request);
        queued = true;
    } catch (...) {
    }
    ReleaseSRWLockExclusive(&g_p1HttpLock);

    if (queued) {
        WakeAllConditionVariable(&g_p1HttpCv);
    }
    return queued;
}

static void P1StopHttpWorkers() {
    AcquireSRWLockExclusive(&g_p1HttpLock);
    g_p1HttpStop = true;
    std::deque<P1HttpRequest*> pending;
    pending.swap(g_p1HttpQueue);
    ReleaseSRWLockExclusive(&g_p1HttpLock);
    WakeAllConditionVariable(&g_p1HttpCv);

    for (P1HttpRequest* request : pending) {
        if (request) {
            P1ReleaseWebViewRef(request->webView);
            delete request;
        }
    }

    if (!g_p1Workers.empty()) {
        // Idle workers exit at once. A worker that is still inside a request
        // would otherwise block the unload (possibly on the UI thread), so the
        // wait is short; the module is pinned if one is still busy.
        DWORD wait = WaitForMultipleObjects(
            static_cast<DWORD>(g_p1Workers.size()), g_p1Workers.data(), TRUE,
            2000);
        if (wait == WAIT_TIMEOUT) {
            P1PinModule();
        }
        for (HANDLE thread : g_p1Workers) {
            CloseHandle(thread);
        }
        g_p1Workers.clear();
    }

    std::deque<P1HttpReply*> replies;
    AcquireSRWLockExclusive(&g_p1ReplyLock);
    replies.swap(g_p1ReplyQueue);
    ReleaseSRWLockExclusive(&g_p1ReplyLock);
    for (P1HttpReply* reply : replies) {
        if (reply) {
            P1ReleaseWebViewRef(reply->webView);
            delete reply;
        }
    }
}

// ---------------------------------------------------------------------------
// Settings push
// ---------------------------------------------------------------------------

// clearCache is a write-once trigger: only the first settings push of this
// process may carry true. Wh_SetIntSetting is not available for mod settings,
// so the user has to switch the checkbox off again by hand.
static bool P1ConsumeClearCache(bool requested) {
    bool firstPush = g_p1FirstSettingsPush.exchange(false);
    if (!requested) {
        return false;
    }
    if (!firstPush) {
        P0_LOG(L"[p1] clearCache is on but this is not the first settings push "
               L"of this process; it is ignored until the next start");
        return false;
    }
    P0_LOG(L"[p1] clearCache=true pushed once; turn the clearCache setting off "
           L"again or the cache is cleared once on every start");
    return true;
}

static void P1PushSettingsToWebView(void* webView, const wchar_t* reason) {
    if (!webView) {
        return;
    }

    P1SettingsSnapshot snapshot = P1ReadSettings();
    P1KeyInfo key = P1GetKeyInfo();
    bool clearCache = P1ConsumeClearCache(snapshot.clearCacheRequested);
    std::wstring json =
        P1BuildSettingsJson(snapshot, key.source, clearCache);

    void* postFn = nullptr;
    if (!P0GetValidatedSlot(webView, kWebViewSlotPostWebMessageAsString,
                            &postFn)) {
        P0_LOG(L"[p1] settings not pushed: PostWebMessageAsString slot invalid");
        return;
    }

    std::wstring message = kP1Tag;
    message.push_back(0x1f);
    message += L"settings";
    message.push_back(0x1f);
    message += json;

    HRESULT hr = reinterpret_cast<FnPostWebMessageAsString>(postFn)(
        webView, message.c_str());
    P0_LOG(L"[p1] settings pushed (%s): targetLang=%s provider=%s key=%s "
           L"clearCache=%d hr=%08X",
           reason ? reason : L"?", snapshot.targetLang.c_str(),
           snapshot.provider.c_str(), key.source.c_str(),
           clearCache ? 1 : 0, static_cast<unsigned>(hr));
}

static void P1PushSettingsToAll(const wchar_t* reason) {
    void* webView = P0AcquireWebView();
    if (!webView) {
        return;
    }
    P0ComRef webViewRef;
    webViewRef.object = webView;
    P1PushSettingsToWebView(webView, reason);
}

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------

static void P1HandleJsLog(const std::wstring& text) {
    std::wstring line;
    try {
        line.assign(text, 0, std::min<size_t>(text.size(), kP1MaxJsLogChars));
    } catch (...) {
        return;
    }
    for (wchar_t& ch : line) {
        if (ch == L'\r' || ch == L'\n') {
            ch = L' ';
        }
    }
    P0WriteFileLog(L"[js] %s", line.c_str());
}

static void P1RejectHttp(void* webView,
                         unsigned long long id,
                         const wchar_t* reason,
                         unsigned long error) {
    P0_LOG(L"[p1] http rejected id=%llu: %s", id, reason);
    P1PostHttpReply(webView, id, 0, error, std::string());
}

static void P1HandleHttp(void* sender, const std::wstring& rest) {
    std::vector<std::wstring> head;
    P1Split(rest, 0x1f, 4, head);
    if (head.size() < 4) {
        P0_LOG(L"[p1] http message malformed (fields=%llu); ignored",
               static_cast<unsigned long long>(head.size()));
        return;
    }

    unsigned long long id = 0;
    if (!P1ParseUInt64(head[0], id)) {
        P0_LOG(L"[p1] http message has no usable request id; ignored");
        return;
    }

    std::wstring method = head[1];
    if (method.empty() || method.size() > 16) {
        P1RejectHttp(sender, id, L"bad method", ERROR_INVALID_PARAMETER);
        return;
    }
    for (wchar_t& ch : method) {
        ch = P1AsciiUpper(ch);
    }
    if (method != L"GET" && method != L"POST") {
        P1RejectHttp(sender, id, L"unsupported method", ERROR_INVALID_PARAMETER);
        return;
    }

    const std::wstring& url = head[2];
    if (url.size() > kP1MaxUrlChars) {
        P1RejectHttp(sender, id, L"url too long", ERROR_INVALID_PARAMETER);
        return;
    }
    P1UrlParts parts;
    if (!P1ParseUrl(url, parts)) {
        P1RejectHttp(sender, id, L"bad url", ERROR_INVALID_PARAMETER);
        return;
    }

    std::vector<std::wstring> countAndRest;
    P1Split(head[3], 0x1f, 2, countAndRest);
    unsigned long long headerCount = 0;
    if (!P1ParseUInt64(countAndRest[0], headerCount) && countAndRest[0] != L"0") {
        P1RejectHttp(sender, id, L"bad header count", ERROR_INVALID_PARAMETER);
        return;
    }
    if (headerCount > kP1MaxHeaderCount) {
        P1RejectHttp(sender, id, L"too many headers", ERROR_INVALID_PARAMETER);
        return;
    }

    std::wstring afterCount = countAndRest.size() > 1 ? countAndRest[1]
                                                      : std::wstring();
    std::vector<std::wstring> tail;
    size_t expectedFields = static_cast<size_t>(headerCount) * 2 + 1;
    P1Split(afterCount, 0x1f, expectedFields, tail);
    if (tail.size() != expectedFields) {
        P1RejectHttp(sender, id, L"header fields missing",
                     ERROR_INVALID_PARAMETER);
        return;
    }

    std::vector<std::pair<std::wstring, std::wstring>> headers;
    size_t headerChars = 0;
    try {
        headers.reserve(static_cast<size_t>(headerCount));
        for (size_t i = 0; i < static_cast<size_t>(headerCount); ++i) {
            const std::wstring& name = tail[i * 2];
            const std::wstring& value = tail[i * 2 + 1];
            if (name.empty() || name.size() > kP1MaxHeaderNameChars ||
                value.size() > kP1MaxHeaderValueChars) {
                P1RejectHttp(sender, id, L"header name or value has a bad length",
                             ERROR_INVALID_PARAMETER);
                return;
            }
            if (name.find_first_of(L":\r\n") != std::wstring::npos ||
                value.find_first_of(L"\r\n") != std::wstring::npos) {
                P1RejectHttp(sender, id, L"header contains a forbidden character",
                             ERROR_INVALID_PARAMETER);
                return;
            }
            headerChars += name.size() + value.size();
            if (headerChars > kP1MaxHeadersChars) {
                P1RejectHttp(sender, id, L"headers too large",
                             ERROR_INVALID_PARAMETER);
                return;
            }
            headers.emplace_back(name, value);
        }
    } catch (...) {
        P1RejectHttp(sender, id, L"out of memory while reading headers",
                     ERROR_NOT_ENOUGH_MEMORY);
        return;
    }

    const std::wstring& bodyWide = tail[expectedFields - 1];
    if (bodyWide.size() > kP1MaxBodyBytes) {
        P1RejectHttp(sender, id, L"body too large", ERROR_INVALID_PARAMETER);
        return;
    }
    if (method == L"GET" && !bodyWide.empty()) {
        P0_LOG(L"[p1] http id=%llu: GET with a body; the body is ignored", id);
    }

    std::string body;
    if (method != L"GET") {
        body = P1WideToUtf8(bodyWide);
        if (body.size() > kP1MaxBodyBytes) {
            P1RejectHttp(sender, id, L"body too large after utf-8 encoding",
                         ERROR_INVALID_PARAMETER);
            return;
        }
    }

    P1SettingsSnapshot snapshot = P1ReadSettings();
    P1KeyInfo key = P1GetKeyInfo();

    // Debug trace: only the body, never the headers, so the key cannot leak.
    if (snapshot.debug) {
        P1TraceHttpRequest(id, body);
    }

    auto* request = new (std::nothrow) P1HttpRequest();
    if (!request) {
        P1RejectHttp(sender, id, L"out of memory for the request",
                     ERROR_NOT_ENOUGH_MEMORY);
        return;
    }
    request->id = id;
    request->method = method;
    request->url = url;
    request->headers = std::move(headers);
    request->body = std::move(body);
    request->timeoutMs =
        static_cast<unsigned long long>(snapshot.timeoutMs);
    request->apiKey = key.key;
    request->apiKeyHost = key.host;
    request->trace = snapshot.debug;

    auto addRef =
        reinterpret_cast<FnAddRef>(P0GetRawSlot(sender, kSlotAddRef));
    if (!addRef) {
        delete request;
        P1RejectHttp(sender, id, L"no AddRef slot on the webview",
                     ERROR_INVALID_HANDLE);
        return;
    }
    addRef(sender);
    request->webView = sender;

    if (!P1EnqueueHttpRequest(request)) {
        P1ReleaseWebViewRef(request->webView);
        delete request;
        P1RejectHttp(sender, id, L"http queue is busy", ERROR_BUSY);
    }
}

static void P1HandleMessage(void* sender, const std::wstring& text) {
    P1NoteUiThread();
    P1EnsureDispatchWindow();
    P1DrainRepliesOnUiThread();

    if (g_p1SettingsDirty.exchange(false) && g_p1PageReady.load()) {
        P1PushSettingsToAll(L"deferred");
    }

    if (text.size() > kP1MaxMessageChars) {
        P0_LOG(L"[p1] message too large (%llu chars); ignored",
               static_cast<unsigned long long>(text.size()));
        return;
    }

    std::vector<std::wstring> parts;
    P1Split(text, 0x1f, 3, parts);
    if (parts.size() < 2 || parts[0] != kP1Tag) {
        P0_LOG(L"[p1] malformed message ignored (len=%llu)",
               static_cast<unsigned long long>(text.size()));
        return;
    }

    const std::wstring& kind = parts[1];
    const std::wstring& rest = parts.size() >= 3 ? parts[2] : std::wstring();

    if (kind == L"settings?") {
        g_p1PageReady.store(true);
        P0_LOG(L"[p1] settings requested (page ready)");
        P1PushSettingsToWebView(sender, L"settings?");
        return;
    }

    if (kind == L"log") {
        g_p1PageReady.store(true);
        P1HandleJsLog(rest);
        return;
    }

    if (kind == L"http") {
        g_p1PageReady.store(true);
        P1HandleHttp(sender, rest);
        return;
    }

    std::wstring kindForLog = P1ClipForLog(kind, 32);
    P0_LOG(L"[p1] unknown message kind '%s' ignored", kindForLog.c_str());
}

// Runs the P0 script in the webview's current document. `label` must be a
// string literal: the completion handler stores the pointer and runs later.
// `when`, when not null, marks the first hello so the log shows which injection
// path reached the document.
static HRESULT P0ExecuteScript(void* webView,
                               const wchar_t* label,
                               const wchar_t* when) {
    if (!webView) {
        P0_LOG(L"[p0] ExecuteScript(%s): no webview", label);
        P0_LOG(L"ExecuteScript %s skipped: no webview", label);
        return E_POINTER;
    }

    void* executeScriptFn = nullptr;
    if (!P0GetValidatedSlot(webView, kWebViewSlotExecuteScript,
                            &executeScriptFn)) {
        P0_LOG(L"[p0] ExecuteScript(%s): slot invalid", label);
        P0_LOG(L"ExecuteScript %s skipped: slot invalid", label);
        return E_FAIL;
    }

    P0ScriptHandler* handler = P0CreateScriptHandler(label);
    if (!handler) {
        P0_LOG(L"[p0] ExecuteScript(%s): out of memory for the completion "
               L"handler", label);
        P0_LOG(L"ExecuteScript %s skipped: no completion handler", label);
        return E_OUTOFMEMORY;
    }
    P0HandlerRef handlerRef;
    handlerRef.handler = handler;

    // The prefix only sets a window flag; the P0 script after it is unchanged
    // and idempotent through its window.__WH_TRANSLATOR_P0__ guard.
    std::wstring markedScript;
    const wchar_t* script = kP0Js;
    try {
        if (when) {
            markedScript = L"window.__WH_TRANSLATOR_P0_WHEN__='";
            markedScript += when;
            markedScript += L"';";
            markedScript += kP0Js;
            script = markedScript.c_str();
        }
    } catch (...) {
        P0_LOG(L"[p0] ExecuteScript(%s): exception while building the script; "
               L"using the plain P0 script", label);
        script = kP0Js;
    }

    HRESULT hr = reinterpret_cast<FnExecuteScript>(executeScriptFn)(
        webView, script, handler);
    handler->immediateHr = hr;

    P0_LOG(L"%s hr=0x%08X", label, static_cast<unsigned>(hr));
    P0_LOG(L"[p0] %s (when=%s) -> %08X", label, when ? when : L"immediate",
           static_cast<unsigned>(hr));
    return hr;
}

// ---------------------------------------------------------------------------
// Controller -> WebView2 setup
// ---------------------------------------------------------------------------

static void P0OnControllerReady(void* controller) {
    if (!controller) {
        return;
    }

    // This callback runs on the WebView2 UI thread: remember it and create the
    // dispatcher window here, before any page message can need it.
    P1NoteUiThread();
    P1EnsureDispatchWindow();

    {
        std::lock_guard<std::mutex> lock(g_webViewMutex);
        if (g_webView) {
            P0_LOG(L"[p0] controller=%p: a webview is already set up; ignoring",
                   controller);
            return;
        }
    }

    void* getWebViewFn = nullptr;
    if (!P0GetValidatedSlot(controller, kControllerSlotGetCoreWebView2,
                            &getWebViewFn)) {
        P0_LOG(L"[p0] controller=%p: get_CoreWebView2 slot invalid", controller);
        return;
    }

    void* webView = nullptr;
    HRESULT hr =
        reinterpret_cast<FnControllerGetCoreWebView2>(getWebViewFn)(
            controller, &webView);
    if (FAILED(hr) || !webView) {
        P0_LOG(L"[p0] controller=%p: get_CoreWebView2 -> %08X, webview=%p",
               controller, static_cast<unsigned>(hr), webView);
        return;
    }

    P0_LOG(L"[p0] controller=%p CoreWebView2=%p", controller, webView);

    P0ComRef webViewRef;
    webViewRef.object = webView;

    // 1) Make sure the page may post messages.
    void* getSettingsFn = nullptr;
    if (P0GetValidatedSlot(webView, kWebViewSlotGetSettings, &getSettingsFn)) {
        void* settings = nullptr;
        hr = reinterpret_cast<FnGetSettings>(getSettingsFn)(webView, &settings);
        if (SUCCEEDED(hr) && settings) {
            P0ComRef settingsRef;
            settingsRef.object = settings;

            BOOL enabled = TRUE;
            void* getEnabledFn = nullptr;
            if (P0GetValidatedSlot(settings, kSettingsSlotGetIsWebMessageEnabled,
                                   &getEnabledFn)) {
                HRESULT getHr =
                    reinterpret_cast<FnGetBool>(getEnabledFn)(settings, &enabled);
                if (FAILED(getHr)) {
                    enabled = TRUE;
                    P0_LOG(L"[p0] get_IsWebMessageEnabled -> %08X",
                           static_cast<unsigned>(getHr));
                }
            } else {
                P0_LOG(L"[p0] get_IsWebMessageEnabled slot invalid");
            }

            P0_LOG(L"webview=%p settings=%p webMessageEnabled(before)=%d",
                   webView, settings, enabled ? 1 : 0);
            P0_LOG(L"[p0] IsWebMessageEnabled=%d", enabled ? 1 : 0);
            if (!enabled) {
                void* putEnabledFn = nullptr;
                if (P0GetValidatedSlot(settings,
                                       kSettingsSlotPutIsWebMessageEnabled,
                                       &putEnabledFn)) {
                    HRESULT putHr = reinterpret_cast<FnPutBool>(putEnabledFn)(
                        settings, TRUE);
                    P0_LOG(L"[p0] put_IsWebMessageEnabled(TRUE) -> %08X",
                           static_cast<unsigned>(putHr));
                } else {
                    P0_LOG(L"[p0] put_IsWebMessageEnabled slot invalid");
                }
            }
        } else {
            P0_LOG(L"webview=%p settings=%p webMessageEnabled(before)=unknown",
                   webView, settings);
            P0_LOG(L"[p0] get_Settings -> %08X, settings=%p",
                   static_cast<unsigned>(hr), settings);
        }
    } else {
        P0_LOG(L"webview=%p settings=%p webMessageEnabled(before)=unknown",
               webView, static_cast<void*>(nullptr));
        P0_LOG(L"[p0] get_Settings slot invalid");
    }

    // 2) Register the script for future documents.
    void* addScriptFn = nullptr;
    if (P0GetValidatedSlot(webView, kWebViewSlotAddScript, &addScriptFn)) {
        P0HandlerRef scriptHandler;
        scriptHandler.handler = P0CreateScriptHandler(L"AddScript");
        HRESULT addHr = reinterpret_cast<FnAddScript>(addScriptFn)(
            webView, kP0Js, scriptHandler.handler);
        g_addScriptHr.store(static_cast<unsigned long>(addHr));
        P0_LOG(L"AddScript hr=0x%08X", static_cast<unsigned>(addHr));
        P0_LOG(L"[p0] AddScriptToExecuteOnDocumentCreated -> %08X",
               static_cast<unsigned>(addHr));
    } else {
        P0_LOG(L"[p0] AddScriptToExecuteOnDocumentCreated slot invalid");
    }

    // 3) Register the message handler before running any script, so that the
    //    hello message can be answered.
    void* addMessageFn = nullptr;
    if (P0GetValidatedSlot(webView, kWebViewSlotAddWebMessageReceived,
                           &addMessageFn)) {
        P0HandlerRef messageHandler;
        messageHandler.handler = P0CreateMessageHandler();
        if (messageHandler.handler) {
            EventRegistrationToken token{};
            HRESULT addHr = reinterpret_cast<FnAddWebMessageReceived>(
                addMessageFn)(webView, messageHandler.handler, &token);
            P0_LOG(L"add_WebMessageReceived hr=0x%08X token=%lld",
                   static_cast<unsigned>(addHr),
                   static_cast<long long>(token.value));
            if (SUCCEEDED(addHr) && token.value != 0) {
                if (P0StoreWebView(webView, token, static_cast<P0MessageHandler*>(
                                                      messageHandler.handler))) {
                    // The global state now owns the handler reference.
                    messageHandler.handler = nullptr;
                    P0_LOG(L"[p0] add_WebMessageReceived -> %08X token=%lld",
                           static_cast<unsigned>(addHr),
                           static_cast<long long>(token.value));
                } else {
                    void* removeFn = nullptr;
                    if (P0GetValidatedSlot(webView,
                                           kWebViewSlotRemoveWebMessageReceived,
                                           &removeFn)) {
                        reinterpret_cast<FnRemoveWebMessageReceived>(removeFn)(
                            webView, token);
                    }
                    P0_LOG(L"[p0] add_WebMessageReceived raced; removed token");
                }
            } else {
                P0_LOG(L"[p0] add_WebMessageReceived -> %08X token=%lld",
                       static_cast<unsigned>(addHr),
                       static_cast<long long>(token.value));
            }
        } else {
            P0_LOG(L"[p0] out of memory for message handler");
        }
    } else {
        P0_LOG(L"[p0] add_WebMessageReceived slot invalid");
    }

    // 4) Navigation events. AddScriptToExecuteOnDocumentCreated completes
    //    asynchronously, after wry has already started navigating, so the first
    //    real document can miss the registered script. Logging both events and
    //    injecting again on NavigationCompleted makes that visible and fixed.
    bool webViewStored = false;
    {
        std::lock_guard<std::mutex> lock(g_webViewMutex);
        webViewStored = (g_webView == webView);
    }

    if (!webViewStored) {
        P0_LOG(L"add_NavigationStarting skipped: webview not stored");
        P0_LOG(L"add_NavigationCompleted skipped: webview not stored");
        P0_LOG(L"[p0] navigation events not registered: webview was not stored");
    } else {
        void* addNavStartingFn = nullptr;
        if (P0GetValidatedSlot(webView, kWebViewSlotAddNavigationStarting,
                               &addNavStartingFn)) {
            P0HandlerRef navHandler;
            navHandler.handler = P0CreateNavigationStartingHandler();
            if (navHandler.handler) {
                EventRegistrationToken navToken{};
                HRESULT addHr = reinterpret_cast<FnAddNavigationEventHandler>(
                    addNavStartingFn)(webView, navHandler.handler, &navToken);
                P0_LOG(L"add_NavigationStarting hr=0x%08X token=%lld",
                       static_cast<unsigned>(addHr),
                       static_cast<long long>(navToken.value));
                if (SUCCEEDED(addHr) && navToken.value != 0) {
                    {
                        std::lock_guard<std::mutex> lock(g_webViewMutex);
                        g_navigationStartingToken = navToken;
                        g_navigationStartingHandler =
                            static_cast<P0NavigationStartingHandler*>(
                                navHandler.handler);
                        // The global state now owns the handler reference.
                        navHandler.handler = nullptr;
                    }
                    P0_LOG(L"[p0] add_NavigationStarting -> %08X token=%lld",
                           static_cast<unsigned>(addHr),
                           static_cast<long long>(navToken.value));
                } else {
                    P0_LOG(L"[p0] add_NavigationStarting -> %08X token=%lld "
                           L"(not registered)",
                           static_cast<unsigned>(addHr),
                           static_cast<long long>(navToken.value));
                }
            } else {
                P0_LOG(L"[p0] out of memory for NavigationStarting handler");
            }
        } else {
            P0_LOG(L"[p0] add_NavigationStarting slot invalid");
            P0_LOG(L"add_NavigationStarting skipped: slot invalid");
        }

        void* addNavCompletedFn = nullptr;
        if (P0GetValidatedSlot(webView, kWebViewSlotAddNavigationCompleted,
                               &addNavCompletedFn)) {
            P0HandlerRef navHandler;
            navHandler.handler = P0CreateNavigationCompletedHandler();
            if (navHandler.handler) {
                EventRegistrationToken navToken{};
                HRESULT addHr = reinterpret_cast<FnAddNavigationEventHandler>(
                    addNavCompletedFn)(webView, navHandler.handler, &navToken);
                P0_LOG(L"add_NavigationCompleted hr=0x%08X token=%lld",
                       static_cast<unsigned>(addHr),
                       static_cast<long long>(navToken.value));
                if (SUCCEEDED(addHr) && navToken.value != 0) {
                    {
                        std::lock_guard<std::mutex> lock(g_webViewMutex);
                        g_navigationCompletedToken = navToken;
                        g_navigationCompletedHandler =
                            static_cast<P0NavigationCompletedHandler*>(
                                navHandler.handler);
                        navHandler.handler = nullptr;
                    }
                    P0_LOG(L"[p0] add_NavigationCompleted -> %08X token=%lld",
                           static_cast<unsigned>(addHr),
                           static_cast<long long>(navToken.value));
                } else {
                    P0_LOG(L"[p0] add_NavigationCompleted -> %08X token=%lld "
                           L"(not registered)",
                           static_cast<unsigned>(addHr),
                           static_cast<long long>(navToken.value));
                }
            } else {
                P0_LOG(L"[p0] out of memory for NavigationCompleted handler");
            }
        } else {
            P0_LOG(L"[p0] add_NavigationCompleted slot invalid");
            P0_LOG(L"add_NavigationCompleted skipped: slot invalid");
        }
    }

    // 5) Fallback for the current document, often still about:blank; that is why
    //    NavigationCompleted injects again. The script is idempotent.
    HRESULT execHr = P0ExecuteScript(webView, L"ExecuteScript-fallback", nullptr);
    P0_LOG(L"ExecuteScript fallback hr=0x%08X", static_cast<unsigned>(execHr));
}

// ---------------------------------------------------------------------------
// Callback implementations
// ---------------------------------------------------------------------------

static HRESULT STDMETHODCALLTYPE P0EnvHandlerInvoke(P0EnvHandler* self,
                                                    HRESULT hr,
                                                    void* env) {
    try {
        P0_LOG(L"env handler Invoke hr=0x%08X env=%p",
               static_cast<unsigned>(hr), env);
        P0_LOG(L"[p0] environment completed: hr=%08X env=%p",
               static_cast<unsigned>(hr), env);

        if (SUCCEEDED(hr) && env) {
            P0PatchEnvironment(env);
        } else {
            P0_LOG(L"[p0] no environment to patch; forwarding as-is");
        }

        return P0SafeForwardEnvHandler(self ? self->app : nullptr, hr, env);
    } catch (...) {
        P0_LOG(L"[p0] exception in environment callback");
        return S_OK;
    }
}

static HRESULT STDMETHODCALLTYPE P0ControllerHandlerInvoke(
    P0ControllerHandler* self,
    HRESULT hr,
    void* controller) {
    try {
        P0_LOG(L"controller Invoke hr=0x%08X controller=%p",
               static_cast<unsigned>(hr), controller);
        P0_LOG(L"[p0] controller completed: hr=%08X controller=%p",
               static_cast<unsigned>(hr), controller);

        if (SUCCEEDED(hr) && controller) {
            P0OnControllerReady(controller);
        }

        return P0SafeForwardControllerHandler(self ? self->app : nullptr, hr,
                                              controller);
    } catch (...) {
        P0_LOG(L"[p0] exception in controller callback");
        return S_OK;
    }
}

static HRESULT STDMETHODCALLTYPE P0MessageHandlerInvoke(
    P0MessageHandler* self,
    void* sender,
    void* args) {
    (void)self;

    try {
        if (!sender || !args) {
            return S_OK;
        }

        // WebView2 raises this event on the UI thread. Remember it here too so
        // the P1 dispatcher can be created even if the controller path missed
        // its chance (for example after a renderer swap).
        P1NoteUiThread();
        P1EnsureDispatchWindow();
        P1DrainRepliesOnUiThread();

        if (g_p1SettingsDirty.exchange(false) && g_p1PageReady.load()) {
            P1PushSettingsToAll(L"deferred");
        }

        void* tryGetFn = nullptr;
        if (!P0GetValidatedSlot(args, kArgsSlotTryGetWebMessageAsString,
                                &tryGetFn)) {
            P0_LOG(L"[p0] TryGetWebMessageAsString slot invalid");
            return S_OK;
        }

        LPWSTR text = nullptr;
        HRESULT hr =
            reinterpret_cast<FnTryGetWebMessageAsString>(tryGetFn)(args, &text);
        if (FAILED(hr) || !text) {
            // Non-string messages are not part of the protocol.
            P0_LOG(L"[p0] TryGetWebMessageAsString -> %08X",
                   static_cast<unsigned>(hr));
            return S_OK;
        }

        if (wcsncmp(text, L"p0:", 3) == 0) {
            P0_LOG(L"msg received: %s", P0Trunc(text));
            P0_LOG(L"[p0] JS -> mod: %s", P0Trunc(text));

            HRESULT postHr = E_FAIL;
            void* postFn = nullptr;
            if (P0GetValidatedSlot(sender, kWebViewSlotPostWebMessageAsString,
                                   &postFn)) {
                try {
                    std::wstring reply = L"p0:ack:";
                    reply += text;
                    postHr = reinterpret_cast<FnPostWebMessageAsString>(postFn)(
                        sender, reply.c_str());
                } catch (...) {
                    P0_LOG(L"[p0] exception while building the reply");
                }
            } else {
                P0_LOG(L"[p0] PostWebMessageAsString slot invalid");
            }

            P0_LOG(L"ack posted hr=0x%08X", static_cast<unsigned>(postHr));
            P0_LOG(L"[p0] mod -> JS reply: %08X",
                   static_cast<unsigned>(postHr));
        } else if (wcsncmp(text, kP1Tag, 5) == 0) {
            try {
                std::wstring message(text);
                P1HandleMessage(sender, message);
            } catch (...) {
                P0_LOG(L"[p1] exception while handling a page message");
            }
        } else {
            static std::atomic<bool> unknownPrefixLogged{false};
            if (!unknownPrefixLogged.exchange(true, std::memory_order_relaxed)) {
                P0_LOG(L"[p1] message with an unknown prefix ignored: %s",
                       P0Trunc(text));
            }
        }

        CoTaskMemFree(text);
    } catch (...) {
        P0_LOG(L"[p0] exception in message handler");
    }

    return S_OK;
}

static HRESULT STDMETHODCALLTYPE P0ScriptHandlerInvoke(
    P0ScriptHandler* self,
    HRESULT hr,
    LPCWSTR text) {
    try {
        const wchar_t* label = self && self->label ? self->label : L"?";
        HRESULT immediateHr = self ? self->immediateHr : E_FAIL;
        P0_LOG(L"[p0] script '%s' completed: hr=%08X result=%s", label,
               static_cast<unsigned>(hr), P0Trunc(text));
        if (wcscmp(label, L"AddScript") == 0) {
            P0_LOG(L"AddScript hr=0x%08X id=%s",
                   static_cast<unsigned>(g_addScriptHr.load()),
                   P0Trunc(text));

            // AddScriptToExecuteOnDocumentCreated finishes asynchronously. By
            // the time this fires, wry has usually started the first real
            // navigation, so injecting here has a much better chance of hitting
            // the app document than the controller-path fallback that ran while
            // it was still about:blank. Done at most once.
            if (!g_postAddScriptInjectionDone.exchange(
                    true, std::memory_order_acq_rel)) {
                void* webView = P0AcquireWebView();
                if (webView) {
                    P0ComRef webViewRef;
                    webViewRef.object = webView;
                    P0_LOG(L"[p0] AddScript completed late; injecting into the "
                           L"current document");
                    P0ExecuteScript(webView, L"ExecuteScript-afterAddScript",
                                    L"afteraddscript");
                } else {
                    P0_LOG(L"ExecuteScript afterAddScript skipped: no webview");
                    P0_LOG(L"[p0] AddScript completed but no webview is stored; "
                           L"relying on NavigationCompleted");
                }
            }
        } else if (wcscmp(label, L"ExecuteScript-fallback") == 0) {
            P0_LOG(L"ExecuteScript fallback hr=0x%08X result=%s",
                   static_cast<unsigned>(immediateHr), P0Trunc(text));
        } else if (wcscmp(label, L"ExecuteScript-afterAddScript") == 0) {
            P0_LOG(L"ExecuteScript afterAddScript hr=0x%08X result=%s",
                   static_cast<unsigned>(immediateHr), P0Trunc(text));
        } else if (wcscmp(label, L"ExecuteScript-navcompleted") == 0) {
            P0_LOG(L"ExecuteScript navcompleted hr=0x%08X result=%s",
                   static_cast<unsigned>(immediateHr), P0Trunc(text));
        }
    } catch (...) {
    }
    return S_OK;
}

// NavigationStarting records the URI for the matching NavigationCompleted log.
// Fail-soft: a missing args/slot is logged and S_OK is still returned.
static HRESULT STDMETHODCALLTYPE P0NavigationStartingInvoke(
    P0NavigationStartingHandler* self,
    void* sender,
    void* args) {
    (void)self;
    (void)sender;

    try {
        if (!args) {
            P0_LOG(L"navstarting uri=(unavailable) get_Uri=0x80004003");
            P0_LOG(L"[p0] NavigationStarting: no event args");
            return S_OK;
        }

        void* getUriFn = nullptr;
        if (!P0GetValidatedSlot(args, kNavigationStartingArgsSlotGetUri,
                                &getUriFn)) {
            P0_LOG(L"navstarting uri=(unavailable) get_Uri=0x80004005");
            P0_LOG(L"[p0] NavigationStarting: get_Uri slot invalid");
            return S_OK;
        }

        LPWSTR rawUri = nullptr;
        HRESULT getHr = reinterpret_cast<FnGetString>(getUriFn)(args, &rawUri);
        std::wstring uri;
        if (SUCCEEDED(getHr) && rawUri) {
            try {
                uri.assign(rawUri);
            } catch (...) {
            }
        }
        if (rawUri) {
            CoTaskMemFree(rawUri);
        }

        if (FAILED(getHr)) {
            P0_LOG(L"navstarting uri=(unavailable) get_Uri=0x%08X",
                   static_cast<unsigned>(getHr));
            P0_LOG(L"[p0] NavigationStarting: get_Uri -> %08X",
                   static_cast<unsigned>(getHr));
            return S_OK;
        }

        P0SetLastNavigationUri(uri);
        P0_LOG(L"navstarting uri=%s get_Uri=0x%08X", P0Trunc(uri.c_str()),
               static_cast<unsigned>(getHr));
        P0_LOG(L"[p0] NavigationStarting: uri=%s get_Uri=0x%08X",
               P0Trunc(uri.c_str()), static_cast<unsigned>(getHr));
    } catch (...) {
        P0_LOG(L"[p0] exception in NavigationStarting handler");
    }

    return S_OK;
}

// NavigationCompleted logs IsSuccess/WebErrorStatus/NavigationId and injects the
// P0 script into the document that now exists: the fix for the first real
// document missing AddScriptToExecuteOnDocumentCreated.
static HRESULT STDMETHODCALLTYPE P0NavigationCompletedInvoke(
    P0NavigationCompletedHandler* self,
    void* sender,
    void* args) {
    (void)self;

    try {
        BOOL isSuccess = FALSE;
        int webErrorStatus = -1;
        UINT64 navigationId = 0;
        HRESULT successHr = E_POINTER;
        HRESULT errorStatusHr = E_POINTER;
        HRESULT navigationIdHr = E_POINTER;

        if (!args) {
            P0_LOG(L"navcompleted event args missing; IsSuccess unknown");
            P0_LOG(L"[p0] NavigationCompleted: no event args");
        } else {
            void* fn = nullptr;
            if (P0GetValidatedSlot(
                    args, kNavigationCompletedArgsSlotGetIsSuccess, &fn)) {
                successHr = reinterpret_cast<FnGetBool>(fn)(args, &isSuccess);
            } else {
                P0_LOG(L"[p0] NavigationCompleted: get_IsSuccess slot invalid");
            }

            fn = nullptr;
            if (P0GetValidatedSlot(
                    args, kNavigationCompletedArgsSlotGetWebErrorStatus, &fn)) {
                errorStatusHr = reinterpret_cast<FnGetInt32>(fn)(
                    args, &webErrorStatus);
            } else {
                P0_LOG(
                    L"[p0] NavigationCompleted: get_WebErrorStatus slot invalid");
            }

            fn = nullptr;
            if (P0GetValidatedSlot(
                    args, kNavigationCompletedArgsSlotGetNavigationId, &fn)) {
                navigationIdHr =
                    reinterpret_cast<FnGetUInt64>(fn)(args, &navigationId);
            }

            if (FAILED(successHr)) {
                P0_LOG(L"[p0] NavigationCompleted: get_IsSuccess -> %08X",
                       static_cast<unsigned>(successHr));
            }
            if (FAILED(errorStatusHr)) {
                P0_LOG(L"[p0] NavigationCompleted: get_WebErrorStatus -> %08X",
                       static_cast<unsigned>(errorStatusHr));
            }
            if (FAILED(navigationIdHr)) {
                P0_LOG(L"[p0] NavigationCompleted: get_NavigationId -> %08X",
                       static_cast<unsigned>(navigationIdHr));
            }
        }

        std::wstring uri = P0GetLastNavigationUri();
        P0_LOG(L"navcompleted uri=%s success=%d webErrorStatus=%d "
               L"navigationId=%llu get_IsSuccess=0x%08X",
               P0Trunc(uri.c_str()), isSuccess ? 1 : 0, webErrorStatus,
               static_cast<unsigned long long>(navigationId),
               static_cast<unsigned>(successHr));
        P0_LOG(L"[p0] NavigationCompleted: uri=%s success=%d webErrorStatus=%d "
               L"navigationId=%llu",
               P0Trunc(uri.c_str()), isSuccess ? 1 : 0, webErrorStatus,
               static_cast<unsigned long long>(navigationId));

        // sender is the ICoreWebView2 that raised the event; use it directly.
        // Only fall back to the stored webview (with its own reference) when it
        // is missing.
        void* target = sender;
        P0ComRef acquired;
        if (!target) {
            target = P0AcquireWebView();
            acquired.object = target;
        }
        if (!target) {
            P0_LOG(L"ExecuteScript navcompleted skipped: no webview");
            P0_LOG(L"[p0] NavigationCompleted: sender is null and no webview is "
                   L"stored");
            return S_OK;
        }

        P0_LOG(L"[p0] NavigationCompleted: late injection into the completed "
               L"document");
        P0ExecuteScript(target, L"ExecuteScript-navcompleted", L"navcompleted");
    } catch (...) {
        P0_LOG(L"[p0] exception in NavigationCompleted handler");
    }

    return S_OK;
}

// ---------------------------------------------------------------------------
// Environment method thunks
// ---------------------------------------------------------------------------

static HRESULT STDMETHODCALLTYPE P0EnvCreateControllerThunk(void* self,
                                                            HWND parent,
                                                            void* handler) {
    try {
        P0_LOG(L"[p0] env->CreateCoreWebView2Controller(parent=%p handler=%p)",
               reinterpret_cast<void*>(parent), handler);

        auto original = reinterpret_cast<FnEnvCreateController>(
            g_origEnvCreateController.load(std::memory_order_acquire));
        if (!original) {
            P0_LOG(L"[p0] original CreateCoreWebView2Controller missing");
            return E_FAIL;
        }

        if (!handler) {
            return original(self, parent, handler);
        }

        P0HandlerRef wrapped;
        wrapped.handler = P0CreateControllerHandler(handler);
        if (!wrapped.handler) {
            P0_LOG(L"[p0] out of memory for controller handler; passing through");
            return original(self, parent, handler);
        }

        HRESULT hr = original(self, parent, wrapped.handler);
        P0_LOG(L"[p0] CreateCoreWebView2Controller -> %08X",
               static_cast<unsigned>(hr));
        return hr;
    } catch (...) {
        P0_LOG(L"[p0] exception in CreateCoreWebView2Controller thunk");
        return E_FAIL;
    }
}

static HRESULT STDMETHODCALLTYPE P0EnvCreateControllerWithOptionsThunk(
    void* self,
    HWND parent,
    void* options,
    void* handler) {
    try {
        P0_LOG(L"[p0] env->CreateCoreWebView2ControllerWithOptions(parent=%p "
               L"options=%p handler=%p)",
               reinterpret_cast<void*>(parent), options, handler);

        auto original = reinterpret_cast<FnEnvCreateControllerWithOptions>(
            g_origEnvCreateControllerWithOptions.load(std::memory_order_acquire));
        if (!original) {
            P0_LOG(L"[p0] original CreateCoreWebView2ControllerWithOptions "
                   L"missing");
            return E_FAIL;
        }

        if (!handler) {
            return original(self, parent, options, handler);
        }

        P0HandlerRef wrapped;
        wrapped.handler = P0CreateControllerHandler(handler);
        if (!wrapped.handler) {
            P0_LOG(L"[p0] out of memory for controller handler; passing through");
            return original(self, parent, options, handler);
        }

        HRESULT hr = original(self, parent, options, wrapped.handler);
        P0_LOG(L"[p0] CreateCoreWebView2ControllerWithOptions -> %08X",
               static_cast<unsigned>(hr));
        return hr;
    } catch (...) {
        P0_LOG(L"[p0] exception in CreateCoreWebView2ControllerWithOptions "
               L"thunk");
        return E_FAIL;
    }
}

// ---------------------------------------------------------------------------
// GetProcAddress hook + environment creation shim
// ---------------------------------------------------------------------------

static FnGetProcAddress g_originalGetProcAddress = nullptr;
static std::atomic<FnCreateEnv> g_realCreateEnv{nullptr};
static std::atomic<bool> g_createExportLogged{false};
static std::atomic<bool> g_sharedExportLogged{false};

static HRESULT STDMETHODCALLTYPE P0CreateEnvShim(BOOL fromClientDll,
                                                 int runtimeType,
                                                 PCWSTR userDataFolder,
                                                 IUnknown* environmentOptions,
                                                 void* handler);

static FARPROC WINAPI P0GetProcAddressHook(HMODULE module, LPCSTR procName) {
    if (!g_originalGetProcAddress) {
        return nullptr;
    }

    __try {
        if (module && procName &&
            HIWORD(reinterpret_cast<ULONG_PTR>(procName))) {
            // Check the two export names before touching the module list:
            // GetModuleHandleW takes the loader lock, and this hook runs for
            // every GetProcAddress call in the process.
            bool isCreate =
                strcmp(procName,
                       "CreateWebViewEnvironmentWithOptionsInternal") == 0;
            bool isCreateShared =
                strcmp(procName,
                       "CreateSharedWebViewEnvironmentInternal") == 0;

            if ((isCreate || isCreateShared) &&
                module == P0GetEmbeddedBrowserModule()) {
                if (isCreate) {
                    // Resolve the real export once, through the unhooked
                    // trampoline. Returning the shim is cheap and does not
                    // recurse into this hook.
                    auto real = reinterpret_cast<FnCreateEnv>(
                        g_originalGetProcAddress(module, procName));
                    if (real) {
                        g_realCreateEnv.store(real, std::memory_order_release);
                        if (!g_createExportLogged.exchange(
                                true, std::memory_order_relaxed)) {
                            P0_LOG(L"GetProcAddress(EmbeddedBrowserWebView.dll, "
                                   L"CreateWebViewEnvironmentWithOptionsInternal) "
                                   L"-> shim original=%p",
                                   reinterpret_cast<void*>(real));
                        }
                        return reinterpret_cast<FARPROC>(&P0CreateEnvShim);
                    }
                    if (!g_createExportLogged.exchange(
                            true, std::memory_order_relaxed)) {
                        P0_LOG(L"GetProcAddress(EmbeddedBrowserWebView.dll, "
                               L"CreateWebViewEnvironmentWithOptionsInternal) "
                               L"-> unresolved");
                    }
                } else {
                    // This export's exact signature could not be verified
                    // locally. It is not used by wry's normal environment path,
                    // so pass it through untouched instead of risking a
                    // mismatched call. Logged once for diagnostics.
                    FARPROC original =
                        g_originalGetProcAddress(module, procName);
                    if (!g_sharedExportLogged.exchange(
                            true, std::memory_order_relaxed)) {
                        P0_LOG(L"[p0] CreateSharedWebViewEnvironmentInternal "
                               L"requested; passing through unmodified");
                        P0_LOG(L"GetProcAddress(EmbeddedBrowserWebView.dll, "
                               L"CreateSharedWebViewEnvironmentInternal) -> "
                               L"passthrough original=%p",
                               reinterpret_cast<void*>(original));
                    }
                }
            }
        }
    } __except (EXCEPTION_EXECUTE_HANDLER) {
    }

    return g_originalGetProcAddress(module, procName);
}

static HRESULT STDMETHODCALLTYPE P0CreateEnvShim(
    BOOL fromClientDll,
    int runtimeType,
    PCWSTR userDataFolder,
    IUnknown* environmentOptions,
    void* handler) {
    try {
        P0_LOG(L"CreateEnvShim: fromClientDll=%d runtimeType=%d "
               L"userDataFolder=%s",
               static_cast<int>(fromClientDll), runtimeType,
               P0Trunc(userDataFolder));
        P0_LOG(L"[p0] CreateWebViewEnvironmentWithOptionsInternal: "
               L"fromClientDll=%d runtimeType=%d userDataFolder=%s handler=%p",
               static_cast<int>(fromClientDll), runtimeType,
               P0Trunc(userDataFolder), handler);

        FnCreateEnv real = g_realCreateEnv.load(std::memory_order_acquire);
        if (!real) {
            P0_LOG(L"[p0] real CreateWebViewEnvironmentWithOptionsInternal "
                   L"not resolved");
            return E_FAIL;
        }

        if (!handler) {
            HRESULT passthroughHr = real(fromClientDll, runtimeType,
                                         userDataFolder, environmentOptions,
                                         handler);
            P0_LOG(L"original createEnv returned hr=0x%08X",
                   static_cast<unsigned>(passthroughHr));
            return passthroughHr;
        }

        P0HandlerRef wrapped;
        wrapped.handler = P0CreateEnvHandler(handler);
        if (!wrapped.handler) {
            P0_LOG(L"[p0] out of memory for environment handler; passing through");
            return real(fromClientDll, runtimeType, userDataFolder,
                        environmentOptions, handler);
        }

        HRESULT hr = real(fromClientDll, runtimeType, userDataFolder,
                          environmentOptions, wrapped.handler);
        P0_LOG(L"original createEnv returned hr=0x%08X",
               static_cast<unsigned>(hr));
        P0_LOG(L"[p0] environment creation call -> %08X",
               static_cast<unsigned>(hr));
        return hr;
    } catch (...) {
        P0_LOG(L"[p0] exception in environment creation shim");
        return E_FAIL;
    }
}

// ---------------------------------------------------------------------------
// Heartbeat
//
// One line every 30 s proves the DLL is loaded and its threads run, and reports
// the windhawk-ui.exe base and whether the WebView2 runtime DLL is loaded yet:
// that separates "mod not loaded" from "loaded, hook never hit". P1 already logs
// every request and page error, so this is only a liveness marker and must not
// flood p0.log.
// ---------------------------------------------------------------------------

static HANDLE g_heartbeatStop = nullptr;
static HANDLE g_heartbeatThread = nullptr;

static DWORD WINAPI P0HeartbeatThreadProc(void*) {
    for (;;) {
        DWORD wait = WaitForSingleObject(g_heartbeatStop, 30000);
        if (wait != WAIT_TIMEOUT) {
            break;
        }

        HMODULE uiModule = GetModuleHandleW(nullptr);
        HMODULE embeddedBrowser =
            GetModuleHandleW(L"EmbeddedBrowserWebView.dll");
        P0WriteFileLog(L"heartbeat pid=%lu uiBase=%p EmbeddedBrowserWebView=%s "
                       L"base=%p",
                       static_cast<unsigned long>(GetCurrentProcessId()),
                       static_cast<void*>(uiModule),
                       embeddedBrowser ? L"loaded" : L"not loaded",
                       static_cast<void*>(embeddedBrowser));
    }
    return 0;
}

static bool P0StartHeartbeat() {
    g_heartbeatStop = CreateEventW(nullptr, TRUE, FALSE, nullptr);
    if (!g_heartbeatStop) {
        DWORD error = GetLastError();
        P0_LOG(L"heartbeat: CreateEventW failed (%lu)", error);
        return false;
    }

    g_heartbeatThread =
        CreateThread(nullptr, 0, &P0HeartbeatThreadProc, nullptr, 0, nullptr);
    if (!g_heartbeatThread) {
        DWORD error = GetLastError();
        P0_LOG(L"heartbeat: CreateThread failed (%lu)", error);
        CloseHandle(g_heartbeatStop);
        g_heartbeatStop = nullptr;
        return false;
    }

    P0_LOG(L"heartbeat started (every 30 s)");
    return true;
}

static void P0StopHeartbeat() {
    if (g_heartbeatStop) {
        SetEvent(g_heartbeatStop);
    }

    if (g_heartbeatThread) {
        DWORD wait = WaitForSingleObject(g_heartbeatThread, 3000);
        P0_LOG(L"cleanup: heartbeat stop wait=%lu hr=0x%08X", wait,
               wait == WAIT_OBJECT_0
                   ? 0u
                   : static_cast<unsigned>(HRESULT_FROM_WIN32(ERROR_TIMEOUT)));
        CloseHandle(g_heartbeatThread);
        g_heartbeatThread = nullptr;
    }

    if (g_heartbeatStop) {
        CloseHandle(g_heartbeatStop);
        g_heartbeatStop = nullptr;
    }
}

// ---------------------------------------------------------------------------
// Mod entry points
// ---------------------------------------------------------------------------

BOOL Wh_ModInit() {
    P0LogInit();

    wchar_t exePath[MAX_PATH]{};
    GetModuleFileNameW(nullptr, exePath, ARRAYSIZE(exePath));

    wchar_t disableValue[8]{};
    DWORD disableLength =
        GetEnvironmentVariableW(L"WH_TRANSLATOR_DISABLE", disableValue,
                                ARRAYSIZE(disableValue));
    bool disabled = disableLength > 0 && wcscmp(disableValue, L"1") == 0;

    P0_LOG(L"log file: %s", g_p0LogPathDisplay);
    P0_LOG(L"mod init: pid=%lu exe=%s kill-switch=%s",
           static_cast<unsigned long>(GetCurrentProcessId()), P0Trunc(exePath),
           disabled ? L"on (WH_TRANSLATOR_DISABLE=1)" : L"off");
    P0_LOG(L"[p0] Wh_ModInit (P0 injection proof + P1 bridge)");

    if (disabled) {
        P0_LOG(L"[p0] WH_TRANSLATOR_DISABLE=1; not hooking anything");
        P0_LOG(L"WH_TRANSLATOR_DISABLE=1: no hook installed, no heartbeat");
        return TRUE;
    }

    // Read the settings once at init: this also resolves the API key source so
    // the log shows whether a credential was found. The key itself is never
    // logged.
    try {
        P1SettingsSnapshot snapshot = P1ReadSettings();
        P1KeyInfo key = P1GetKeyInfo();
        P0_LOG(L"[p1] settings: targetLang=%s provider=%s keySource=%s "
               L"timeoutMs=%d concurrency=%d batchSize=%d batchChars=%d "
               L"clearCache=%d",
               snapshot.targetLang.c_str(), snapshot.provider.c_str(),
               key.source.c_str(), snapshot.timeoutMs, snapshot.concurrency,
               snapshot.batchSize, snapshot.batchChars,
               snapshot.clearCacheRequested ? 1 : 0);
        P0_LOG(L"[p1] llm base host=%s keyBytes=%llu",
               key.host.empty() ? L"(none)" : key.host.c_str(),
               static_cast<unsigned long long>(key.key.size()));
    } catch (...) {
        P0_LOG(L"[p1] exception while reading settings at init");
    }

    HMODULE kernel32 = GetModuleHandleW(L"kernel32.dll");
    if (!kernel32) {
        P0_LOG(L"[p0] kernel32.dll not found; aborting");
        return FALSE;
    }

    FARPROC getProcAddress = GetProcAddress(kernel32, "GetProcAddress");
    if (!getProcAddress) {
        P0_LOG(L"[p0] GetProcAddress not found; aborting");
        return FALSE;
    }

    if (!Wh_SetFunctionHook(reinterpret_cast<void*>(getProcAddress),
                            reinterpret_cast<void*>(&P0GetProcAddressHook),
                            reinterpret_cast<void**>(
                                &g_originalGetProcAddress))) {
        P0_LOG(L"[p0] failed to hook GetProcAddress; aborting");
        return FALSE;
    }

    P0_LOG(L"hook GetProcAddress installed");
    P0_LOG(L"[p0] GetProcAddress hooked; waiting for WebView2 environment "
           L"creation");

    if (!P0StartHeartbeat()) {
        P0_LOG(L"heartbeat not running");
    }
    return TRUE;
}

void Wh_ModSettingsChanged() {
    try {
        P0_LOG(L"[p1] mod settings changed");
        // Settings are read fresh for every push and request; the generation
        // only invalidates the cached credential lookup.
        g_p1SettingsGeneration.fetch_add(1, std::memory_order_acq_rel);
        P1ClearKeyCache();
        P1RequestSettingsPush();
    } catch (...) {
        P0_LOG(L"[p1] exception in Wh_ModSettingsChanged");
    }
}

void Wh_ModBeforeUninit() {
    P0_LOG(L"mod before uninit");
    P0_LOG(L"[p0] Wh_ModBeforeUninit");

    try {
        // Order matters: stop our own threads first, then drop the UI
        // dispatcher, then stop callbacks into this DLL, then restore the
        // environment vtable so the app cannot jump into unloaded code later.
        P0StopHeartbeat();
        P1StopHttpWorkers();
        P1DestroyDispatchWindow();
        P1ClearKeyCache();
        P0CleanupWebView();
        P0RestoreEnvironment();
    } catch (...) {
        P0_LOG(L"[p0] exception during cleanup");
    }

    P0_LOG(L"[p0] cleanup done");
}
