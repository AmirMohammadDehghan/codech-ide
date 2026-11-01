# Verification record — 2026-11-01

## Passed locally for 0.3

- Strict TypeScript and 22 automated tests, including Python/Markdown target selection, bounded target JSON, code/vault graph updates, Git-ignore handling, silent-audio rejection and Codex wire enum regressions.
- Real standalone Extension Host: unsaved file selection and symbol, context retained when focusing the composer, modified diff target, real browser navigation, DOM element capture with computed style, scrolling/reveal and theme switching.
- Real Codex 0.166.0 generated schema and request envelopes: thread/start accepted, thread/resume reached runtime lookup (an empty thread has no rollout), turn/start envelope accepted in an isolated logged-out profile. No paid model task was evaluated.
- Native Codech panel visually inspected; no microphone recording was started.
- Whisper.cpp CPU runtime/model verified by SHA-256 and successfully loaded with Persian language configuration. Silence produced hallucinated text in a raw engine check, so a tested audio-energy gate was added before production inference. Recorder C# compiled successfully. Real microphone capture and Persian-speaker accuracy remain unverified.

## Previous 0.2 validation

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

GitHub CI passed on Windows and Linux after a test comparison was corrected to canonicalize Windows worktree paths. Run: https://github.com/AmirMohammadDehghan/codech-ide/actions/runs/41305575512 . The desktop workflow remains manual and is not claimed to have run remotely.

0.3 composer/inspector browser tests additionally checked Persian draft and caret preservation during context updates, a 540px panel without horizontal overflow, voice text appended without automatic send, and removal of secret attributes/script text from selected-element context. Screenshots are labeled fixtures.

A real bundled Codex app-server also completed a full streamed turn against a local deterministic Responses fixture, then resumed the persisted thread successfully. This verifies transport and turn lifecycle without invoking an external model. Reproduce after building with `node scripts/test-codex-runtime.cjs [path-to-codex]`. It does not establish ChatGPT account entitlement or model quality.
