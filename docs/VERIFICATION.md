# Verification record — 2026-11-01

## Passed locally for 0.2

- Normal dependency installation, package-lock generation, strict npm run typecheck, npm test and standard vsce packaging.
- **17 automated tests** covering workspace containment, credential exclusion, Windows junctions, notes, graphs, worktrees, exact-content review and staged-file preservation; API tool proposals, bounded output, usage guard/accounting; context deltas, edit/deletion detection, scope invalidation and bounded history replay; Graphiti MCP scoping; Codex JSON-RPC.
- **Standalone native Extension Host:** Codech IDE, VS Code API 1.143.1, first-party workbench loaded as a built-in from the packaged app, central chat and native commands, Graphite/Paper theme switching. Invalid activity-bar identifiers discovered in the smoke log were corrected and retested.
- **Real third-party extension install:** dracula-theme.theme-dracula 2.25.1 installed from Open VSX through Codech's own CLI into an isolated extension directory and detected by the standalone host.
- **Bundled Codex 0.166.0:** executable version, real initialize/initialized handshake and nine model catalog entries, using a separate temporary home. No model inference, account login or API billing.
- **UI checks:** central chat, notes, review interaction, code and knowledge graph, Persian input, 780px viewport; no browser errors. Graphite, Paper and Forest theme colors were verified. Screenshots use synthetic fixture data. The real native app was also visually inspected.
- **Context benchmark:** 102 synthetic files; 6,944 characters for cold context, 85 for unchanged follow-up, 1,778 after one instruction file changed. This measures attached text, not billed tokens or quality.
- **Windows installer:** Inno Setup 7.1.1 compilation, successful silent per-user installation, separate Codech.exe in the standard Programs directory, Start menu/uninstall registration. Installer is unsigned.

## Limits of verification

No paid API turn or ChatGPT entitlement/inference was exercised. Real Luna/Terra task-success, latency and dollar-cost comparisons remain unmeasured. API usage guards are post-response soft guards, not hard billing caps.

The optional Graphiti service was not installed; its adapter has mocked transport tests. Obsidian plugin execution and PyCharm parity are not implemented. Only Windows x64 was packaged. We did not compile the Code-OSS engine from source, sign binaries, test automatic updating or claim bit-for-bit installer reproducibility.

GitHub CI is configured for Windows and Linux; local results alone do not establish remote CI status. The desktop workflow is manual and is not claimed to have run remotely.
