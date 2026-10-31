# Release checklist

## Before every release

1. `bun tools/build.ts` — regenerate the engine block inside the mod source.
2. `bun tools/test.mjs` — all 340 jsdom checks green.
3. `scripts\dev.ps1 install`, then `scripts\dev.ps1 restart`, and check on a
   real Windhawk: details page, settings page in **both** densities, installed
   list, explore tiles, changelog.
4. Bump `@version` in the mod metadata and any version mentioned in the docs.
5. Commit with a Conventional message; commits are signed (1Password).

## Metadata

| Field | Value |
| --- | --- |
| `@id` | `windhawk-ui-translator` (checked against `ramensoftware/windhawk-mods`) |
| `@name` | Windhawk UI Translator, plus `@name:zh-CN` |
| `@description` | one sentence, plus `@description:zh-CN` |
| `@include` | `windhawk-ui.exe` (flagged by the validator as a tool-mod host — see below) |
| `@architecture` | `x86-64` |
| `@license` | GPL-3.0 |
| `@compilerOptions` | `-lole32 -luuid -ladvapi32 -lshell32 -lwinhttp -fms-extensions` |

## Publishing to the Windhawk mod collection

A pull request to `ramensoftware/windhawk-mods` must contain **exactly one
file**, `mods/windhawk-ui-translator.wh.cpp`, built from this repository's
`mods/windhawk-ui-translator.wh.cpp` — the engine is inlined, so the single
file is self-contained.

**Known validator conflict.** `.github/pr_validation.py` treats any bare
`windhawk-*.exe` include as a request for a tool-mod host, so `@include
windhawk-ui.exe` raises "must be one of the host combinations" and "no
`@architecture`", and the `Test changed files` check fails. The UI process is
not a host: it owns the WebView2 the mod hooks, while a host
(`windhawk-mod.exe`) has no WebView2. The include therefore stays as it is and
the PR asks for a manual review of that one check. Writing the include as a path
(`?:\Program Files\Windhawk\windhawk-ui.exe`) does pass, because the wiki says a
host request must name the executable outright, but that hides the disagreement
instead of settling it — use it only if the maintainers prefer it.


* The in-mod readme (`// ==WindhawkModReadme==`) may only reference images at
  `https://i.imgur.com/...` or `https://raw.githubusercontent.com/...`. The
  screenshot lives under `docs/images/` and is referenced through its raw
  GitHub URL, so it must be pushed before the PR is opened.
* Test the compiled single file on a machine where the repository is absent
  (`windhawk-cli mod install --file`), to prove it has no local includes.
* This mod injects into Windhawk itself and sends page text to a third-party
  endpoint — privacy-sensitive on both counts. The readme states what leaves
  the machine, and the mod works without a key (Edge endpoint). Expect the
  maintainers to ask about it.

## Local-only installs

`windhawk-cli mod install --file` installs as `local@windhawk-ui-translator`,
a different mod id from the published one. Remove the local copy before
installing the repository version, otherwise both run.

## Privacy check

* No key in any file, log line, or trace. `git grep -I "sk-"` must stay empty.
* `debug` logging writes request/response bodies to `p0.log`; it is off by
  default and rate limited to 40 lines per minute.
* The page never receives the key: the mod injects `Authorization` only for
  the `llmBaseUrl` host, only over HTTPS, never for the free endpoints.
