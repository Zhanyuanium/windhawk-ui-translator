# Windhawk 界面翻译

> **状态：可用原型。** 模组详情页、设置面板与模组列表中的翻译已经可用，尚未发布。

一个 Windhawk 模组，就地翻译 Windhawk 里的**模组内容**：模组说明与 README、设置项名称与说明、模组名称与一句话简介，以及更新日志。

Windhawk 2.0 自身的界面已经本地化，但模组作者写的内容只有很窄的本地化通道（`@name:zh-CN`、`$description:zh-CN`、`$options:zh-CN`），README 和更新日志完全没有。本模组补上这一块，针对的是 Tauri 版 Windhawk 2.0 界面（`windhawk-ui.exe` + WebView2）—— 现有社区工具都只能改 Windhawk 1.x（VSCodium 版）在磁盘上的 webview 文件。

## 翻译范围

每个范围在模组设置里都有独立开关，默认全部开启：

| 设置项 | 范围 |
| --- | --- |
| `scopeReadme` | 详情页中的模组 README/说明 |
| `scopeSettings` | 设置项名称、说明、选项文字与嵌套列表项 |
| `scopeModName` | 磁贴视图、列表视图与详情页标题中的模组名称 |
| `scopeModSummary` | 磁贴视图、列表视图与详情页标题中的一句话简介 |
| `scopeChangelog` | 详情页中的更新日志 |

代码块、编辑器、搜索框、URL、标识符、版本号，以及已经是目标语言的文本都不会被处理。

## 工作原理

模组注入 `windhawk-ui.exe`，钩住静态链接 loader 解析 WebView2 内部入口时用的 `GetProcAddress`，包裹环境与控制器的完成回调，最终用 `AddScriptToExecuteOnDocumentCreated` 在应用自身脚本之前装入翻译引擎。请求通过 WebView2 的 web message 通道转交给 C++ 侧，因此所有网络访问都在 C++ 里完成 —— 页面 CSP 禁止跨域 `fetch`，API key 也不下发给页面。

技术事实、架构与分阶段计划见 [docs/PLAN.md](docs/PLAN.md)。

## 行为

* 译文就地替换原文。没有显示模式开关：页面始终显示译文，原文只隔着一次悬停或点按。
* 桌面端：指针在已翻译的文本块上停留 `hoverDelayMs` 后显示原文，移开即恢复译文。
* 触屏：点一下切换该文本块的原文；双指连点两次则像快捷键一样整体开、关翻译，`gestureToggle` 可关闭该手势。
* `Alt+Q` 开、关翻译；快捷键可配置，留空表示不启用。
* 默认目标语言跟随 Windhawk 界面语言，其次跟随 Windows 显示语言。
* 翻译后端：微软免费的 Edge 接口（无需密钥）、兼容 OpenAI 的大模型接口（需要密钥，见下文），以及 Google（尚未实现）。`auto` 只有在配置了密钥时才优先用大模型，否则仍走 Edge。
* 翻译结果缓存在 `localStorage`，有效期 `cacheTtlDays`；`clearCache` 会在下次启动时清空一次。

## 使用大模型

除了免费的 Edge 接口，本模组也可以走任意兼容 OpenAI 的 chat completions 接口。相关设置项：

| 设置项 | 含义 |
| --- | --- |
| `provider` | `auto`、`edge`、`google` 或 `llm`。`auto` 只在配置了密钥时才用大模型，否则仍走 Edge。 |
| `llmBaseUrl` | 接口根地址，例如 `https://api.openai.com/v1`；请求时会追加 `/chat/completions`。 |
| `llmModel` | 模型名称，例如 `gpt-4o-mini`。 |
| `credentialTarget` | 保存密钥的 Windows 凭据管理器名称（默认 `windhawk-ui-translator`）。 |
| `llmKeySource` | `credential`（默认）、`setting` 或 `none`。 |
| `llmApiKey` | 明文备用密钥；`llmKeySource` 为 `setting` 时使用，凭据缺失时也会作为备用。 |
| `glossary` | 随每个大模型请求发送的术语表，每行一条 `原文=译文`。 |

把密钥存成普通凭据（在普通终端里执行）：

```powershell
cmdkey /generic:windhawk-ui-translator /user:translator /pass:<你的 API 密钥>
```

模组在启动时和每次设置变更后读取凭据。密钥不会下发给页面，也不会写进日志。凭据不存在时，模组会记一行日志（含凭据名称与 Win32 错误码），然后使用填好的 `llmApiKey`；只有真正读到了密钥，`llmKeySource` 才会报告 `credential`，因此没有可用密钥时 `auto` 会一直留在 Edge。密钥只会附加到主机名与 `llmBaseUrl` 一致的请求上，免费接口永远不带密钥。

## 隐私

译文文本会发送给你配置的翻译服务。没有遥测、没有统计，除配置的服务外不访问网络。LLM 密钥从 Windows 凭据管理器读取（也可以改用明文设置项），不会写日志，也不会下发给页面。

## 开发

`scripts/dev.ps1` 是唯一的脚本，所有路径（Windhawk 安装位置、模组源文件、模组 id、日志目录）都集中在这里。

| 命令 | 作用 | 权限 |
| --- | --- | --- |
| `pwsh -NoProfile -File scripts/dev.ps1 install [-Disabled]` | 用 `windhawk-cli mod install --file` 编译并安装 `mods\windhawk-ui-translator.wh.cpp`，不重启界面 | 管理员（使用 `-AppRoot` 时无需） |
| `pwsh -NoProfile -File scripts/dev.ps1 restart` | 重启 `windhawk-ui.exe`，让新装的模组生效 | 无 |
| `pwsh -NoProfile -File scripts/dev.ps1 log -Tail 40 [-Follow]` | 打印（或持续跟踪）模组自己写的 `p0.log` | 无 |
| `pwsh -NoProfile -File scripts/dev.ps1 debug on\|off` | 设置 `debug` 开关，模组会把它推送给运行中的页面 | 管理员 |
| `pwsh -NoProfile -File scripts/dev.ps1 trace [-Mod <id>]` | 打开调试日志、重启、打开该模组页面并输出日志 | 管理员 |

`restart -Cdp` 会额外打开 WebView2 的 DevTools 端口（9222），便于检查 DOM。

想在不影响真实 Windhawk 安装的情况下编译，可以安装到独立的便携版应用根目录 —— 一个包含 `windhawk.ini` 的目录：

```powershell
pwsh -NoProfile -File scripts/dev.ps1 install -AppRoot "$env:TEMP\wh-portable" -Disabled
```

模组只会在新启动的界面进程中生效，因为运行中的进程里 WebView2 环境已经创建过了。

界面起不来时的恢复办法：`windhawk.exe -safe-mode`，或
`windhawk-cli.exe mod disable windhawk-ui-translator`。设置环境变量
`WH_TRANSLATOR_DISABLE=1` 也能在不改配置的情况下停用本模组。

## 许可证

GPL-3.0。页内引擎部分派生自 [kiss-translator](https://github.com/fishjar/kiss-translator)（GPL-3.0），见 [NOTICE](NOTICE)。
