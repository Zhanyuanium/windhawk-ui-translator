# Windhawk 界面翻译

> **状态：pre-alpha。** 目前只有注入验证（P0），还没有任何翻译功能，也不适合普通用户安装。

一个 Windhawk 模组，就地翻译 Windhawk 里的**模组内容**：模组说明与 README、设置项名称与说明、列表摘要、更新日志。

Windhawk 2.0 自身的界面已经本地化，但模组作者写的内容只有很窄的本地化通道（`@name:zh-CN`、`$description:zh-CN`、`$options:zh-CN`），README 和更新日志完全没有。本模组补上这一块，针对的是 Tauri 版 Windhawk 2.0 界面（`windhawk-ui.exe` + WebView2）—— 现有社区工具都只能改 Windhawk 1.x（VSCodium 版）在磁盘上的 webview 文件。

## 工作原理

模组注入 `windhawk-ui.exe`，钩住静态链接 loader 解析 WebView2 内部入口时用的 `GetProcAddress`，包裹环境与控制器的完成回调，最终用 `AddScriptToExecuteOnDocumentCreated` 在应用自身脚本之前装入翻译引擎。请求通过 WebView2 的 web message 通道转交给 C++ 侧，因此所有网络访问都在 C++ 里完成 —— 页面 CSP 禁止跨域 `fetch`，API key 也不下发给页面。

技术事实、架构与分阶段计划见 [docs/PLAN.md](docs/PLAN.md)。

## 行为

* 译文就地替换原文。
* 鼠标移入显示原文，移出恢复译文。
* 触屏点一下显示原文，再点恢复译文。
* 默认目标语言跟随 Windhawk 界面语言，其次跟随 Windows 显示语言。
* 翻译服务：任意 OpenAI 兼容接口，失败时回落到 Microsoft Edge、Google 的免费端点。

## 隐私

译文文本会发送给你配置的翻译服务。没有遥测、没有统计，除配置的服务外不访问网络。LLM key 优先从 Windows 凭据管理器读取，不写日志。

## 构建

```powershell
# 本地编译并安装（以禁用状态安装）
& "C:\Program Files\Windhawk\windhawk-cli.exe" mod install --file "mods\windhawk-ui-translator.wh.cpp" --disabled
```

启用模组时 Windhawk 界面不能正在运行，或者启用后重启界面 —— 运行中的界面进程里 WebView2 环境已经创建过了。

界面起不来时的恢复办法：`windhawk.exe -safe-mode`，或
`windhawk-cli.exe mod disable windhawk-ui-translator`。设置环境变量
`WH_TRANSLATOR_DISABLE=1` 也能在不改配置的情况下停用本模组。

## 许可证

GPL-3.0。页内引擎部分派生自 [kiss-translator](https://github.com/fishjar/kiss-translator)（GPL-3.0），见 [NOTICE](NOTICE)。
