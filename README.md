<p align="center"><img src="apps/workbench/media/logo.svg" width="76" alt="Codech IDE"></p>
<h1 align="center">Codech IDE</h1>
<p align="center">Code. Conversations. Knowledge. One workbench.</p>

**0.2 alpha — independent Windows x64 desktop · MIT**

Codech brings central agent conversations, native editors, local Markdown knowledge, code graphs and human review into one development environment. The standalone app packages the official VSCodium Code-OSS runtime with Codech branding, its built-in workbench and Codex CLI. It does not require another VS Code installation.

[Download Windows installer](https://github.com/AmirMohammadDehghan/codech-ide/releases/tag/v0.2.0) · [راهنمای فارسی](docs/FA.md) · [Build instructions](docs/DESKTOP.md)

![Codech workbench preview](docs/images/workbench.png)

## Install

Run **CodechIDE-Setup-0.2.0-x64.exe**. Installation is per-user, with a Start menu entry and an uninstaller. Settings and extensions are separate from VS Code. The current installer is unsigned.

Open a project folder, then use the central conversation. Install compatible extensions from **Open VSX** or **Install from VSIX**. Use **Theme** or **Ctrl+K Ctrl+T** to select **Graphite**, **Paper**, **Forest**, or an extension theme. Chat and knowledge follow the native theme. The Extensions page links to IntelliJ/PyCharm keymap search.

Codex is bundled and starts on demand. Use **Sign in with ChatGPT**, or choose the API provider and set an OpenAI API key in SecretStorage. Available models and usage limits depend on the account. Git and language toolchains such as Python/Node remain separate prerequisites.

## What works

- Central chat, native source/diff editors beside it, activity-bar entries and saved conversations.
- Codex App Server streaming, model catalog, official ChatGPT sign-in flow, approvals, continuation and interruption; isolated Codech auth/config home.
- Responses API with prepared file, line-range, search, Git, local graph, check and edit-proposal tools; review before applying API edits.
- Local Markdown knowledge, wikilinks and linked-note graph; bounded JS/TS/Python import graph.
- Git worktrees, status, native diffs, approvals bound to exact contents, reviewed commits preserving unrelated staged files.
- Optional project-scoped Graphiti MCP fact search.
- Native extension installation, VSIX support and theme integration. Dracula from Open VSX was installed and detected in the standalone host.

## Efficiency

Project context defaults to 12,000 characters. Continuing conversations receive changed excerpts instead of duplicate copies; snapshots reset for changed scope, failures and periodically. Local graphs require no inference. Codex and Graphiti are not started on launch.

API defaults: six responses per turn, 3,000 maximum output tokens per response, bounded tool outputs and a **soft** 16,000-token usage guard. Every four completed API turns, the response chain renews with the original request, up to four recent excerpts and fresh project context; intervening history is omitted. Adjust this tradeoff in **Agent budgets & settings**.

The deterministic [context benchmark](docs/context-benchmark.json) reduced newly attached context from **6,944 to 85 characters** on an unchanged follow-up. This is **not a billed-token, cost or model-quality benchmark**. Previous Responses history still counts as input even with previous_response_id. [Official OpenAI documentation](https://developers.openai.com/api/docs/guides/migrate-to-responses)

## Current boundaries

| Area | State |
|---|---|
| Standalone desktop | Windows x64 installer and uninstaller; unsigned; manual updates |
| VS Code extensions | Real Code-OSS host, Open VSX and compatible VSIX; no universal compatibility promise |
| Obsidian plugins | Manifest inspection only; execution is **not implemented** |
| Obsidian features | Markdown, wikilinks and graph; no full Canvas, Bases or Live Preview parity |
| PyCharm Professional | Native editor/debug/task facilities and keymap search; full parity is **not implemented** |
| Graphiti | Optional MCP adapter; service setup and ingestion remain separate |
| Harness | Bounded tools, context deltas and checkpoints; real Luna/Terra quality/cost evaluation remains |
| GitHub workflow | Local review and Git; integrated PR conversations and sync UI remain |

The packaged engine is an official verified VSCodium binary, not a new Code-OSS source compilation. Exact artifacts and hashes are pinned in desktop/runtime.lock.json. Upstream licenses and provenance are included. No credentials are copied from another app.

## Develop

Requires Node 22+ and Git.

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
npm run package
npm run preview
```

The preview at http://127.0.0.1:4173 uses explicitly labelled fixture data. `npm run dev` uses an existing editor in an isolated test profile. For an independent app, use [the Windows build recipe](docs/DESKTOP.md).

[Architecture](docs/ARCHITECTURE.md) · [Compatibility](docs/COMPATIBILITY.md) · [Graphiti](docs/GRAPHITI.md) · [Roadmap](docs/ROADMAP.md) · [Verification](docs/VERIFICATION.md) · [Sources](docs/SOURCES.md)

Codech code is MIT licensed. VSCodium, Code-OSS, Codex and extensions retain their respective licenses. Codech is independent of Microsoft, OpenAI, Obsidian and JetBrains.
