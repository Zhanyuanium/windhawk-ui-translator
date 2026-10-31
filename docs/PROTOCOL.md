# Mod ↔ page protocol (v2)

Transport: WebView2 web messages. JavaScript posts **strings** with
`window.chrome.webview.postMessage(...)`; the mod reads them with
`TryGetWebMessageAsString` and answers with `PostWebMessageAsString`. No JSON is
parsed on the C++ side; every message is a single string whose fields are
separated by `U+001F` (unit separator, `\x1f`). The **last field may contain
`\x1f`** (HTTP bodies, settings JSON, translations), so parsers must split with a
field limit, never greedily.

First field is always the protocol tag `whtr1`, second the message kind.

## Page → mod

### `http` — perform one HTTP request

```
whtr1 \x1f http \x1f <requestId> \x1f <method> \x1f <url> \x1f <body>
```

* `requestId`: positive integer, unique per page instance; the reply echoes it.
* `method`: `GET` or `POST`.
* `url`: absolute `https://` URL. The scheme must be `https`; userinfo and
  fragments are rejected. The mod accepts **only** the two endpoints the engine
  uses and rejects everything else with `status = 0`, `error = 87`:
  * `https://edge.microsoft.com/translate/translatetext?…` — host compared
    case-insensitively, no explicit port, path exactly followed by `?`
  * `<llmBaseUrl>/chat/completions` — the full URL, compared exactly after
    trimming trailing slashes (scheme and host case-insensitive)
* `body`: UTF-8, ≤ 1 MiB, empty for `GET`.
* Redirects are never followed: a 3xx response is reported as an error.

The page sends **no headers**. The mod sets `Content-Type: application/json` and,
for the LLM host only, `Authorization` from Windows Credential Manager.

### `settings?` — ask for the current settings

```
whtr1 \x1f settings?
```

### `cache-get` — look up one cached translation

```
whtr1 \x1f cache-get \x1f <requestId> \x1f <key>
```

`requestId` is a per-page counter; the reply echoes it, so a late answer to an
older request can never resolve a newer lookup for the same key. `key` is the
engine's cache key (no separators).

### `cache-put` — store one translation

```
whtr1 \x1f cache-put \x1f <key> \x1f <text>
```

No reply. The mod owns the store: an in-memory map persisted under
`Wh_GetModStoragePath()`, honouring the cache lifetime setting and a size cap.
The mod accepts a put for any non-empty key and value; it is a guard against
empty writes, not a security boundary.

### `log` — write one line to Windhawk's mod log

```
whtr1 \x1f log \x1f <text>          (text ≤ 500 chars, no reply)
```

## Mod → page

### `http` reply

```
whtr1 \x1f http \x1f <requestId> \x1f <status> \x1f <error> \x1f <body>
```

* `status`: HTTP status code, or `0` when the request never completed.
* `error`: `0` on success, otherwise a Win32/WinHTTP error code in decimal.
* `body`: response body as UTF-8 text (empty on error). Truncated at 1 MiB.

### `cache-hit` / `cache-miss`

```
whtr1 \x1f cache-hit  \x1f <requestId> \x1f <key> \x1f <text>
whtr1 \x1f cache-miss \x1f <requestId> \x1f <key>
```

A reply whose `requestId` the page no longer waits for is ignored.

### `settings` — pushed at page start and on every settings change

```
whtr1 \x1f settings \x1f <json>
```

Keys: `targetLang`, `provider`, `llmBaseUrl`, `llmModel`, `llmKeySource`,
`glossary`, `scopeReadme`, `scopeSettings`, `scopeChangelog`, `scopeModName`,
`scopeModSummary`, `hoverDelayMs`, `shortcutToggle`, `gestureToggle`,
`batchSize`, `batchChars`, `batchIntervalMs`, `concurrency`, `timeoutMs`,
`cacheEnabled`, `cacheTtlDays`, `clearCache`.

The API key is never part of this payload.

### `teardown` — the mod is being unloaded

```
whtr1 \x1f teardown
```

Sent once, on the UI thread, before the mod removes its handlers. The page must
call its disable path (restore every original text, disconnect its observers,
stop timers) and must not reply: nothing of the mod may be called afterwards.

## Rules

* Unknown kinds, malformed messages and oversized payloads are logged once and
  never throw across the COM boundary.
* Every reply is sent on the WebView2 UI thread.
* `settings?` may be repeated at any time; replies are idempotent.
* One page instance may have several requests in flight; `requestId` correlates.
* After `teardown` the page sends nothing more to the mod.
