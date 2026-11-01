# Verification record — 2026-11-01

## Passed locally

- **12 automated tests:** file traversal/credential/binary restrictions; Windows directory-junction escape prevention; safe note creation; wikilinks; bounded context; source imports; stale review rejection; worktree isolation; committing reviewed contents without including unrelated staged credential paths; nested workspace review paths; Responses tool-loop proposals; Graphiti MCP group scoping and endpoint validation; JSON-RPC errors and approvals.
- **Strict TypeScript check:** TypeScript 5.9.3, the installed VS Code 1.143.1 public API definition and the bundled Node type definitions. This was run with explicit offline type roots because npm network access was unavailable. A full dependency installation and the ordinary `npm run typecheck` path were not completed in that network state.
- **Real native Extension Host:** VS Code 1.143.1 loaded and activated `codech.codech-workbench`. All six primary commands were registered; the conversation, knowledge, review and graph editors opened successfully. Isolated test profile; normal editor preferences were not modified.
- **Real Codex transport:** Codex CLI 0.165.0-alpha.1.2 completed the initialize/initialized handshake and returned nine model-catalog entries from `model/list`. An isolated temporary Codech home was used. **No inference request, ChatGPT login or API billing occurred in this test.**
- **Interactive UI checks:** conversations, knowledge cards, digest approval interaction, code graph, note graph, Persian input and compact viewport. No browser JavaScript errors. Screenshot data is a clearly labelled synthetic fixture, not a live project or completed agent run.
- **VSIX installation:** the offline-packaged `codech-workbench-0.1.0.vsix` installed successfully in a separate profile of VS Code 1.143.1. It contains the same TypeScript sources transpiled offline, the renderer, styles, native extension code, theme, icons and MIT license. It is unsigned.

## Not verified end to end

- Paid API inference, full API cancellation across network failures, and model task quality/cost benchmarks.
- ChatGPT authentication and a complete inference turn under the user's entitlement.
- A running Graphiti database/extraction/embedding service. Its MCP transport contract was tested with a fixture; service integration needs the optional local service.
- Independent Code-OSS source compilation, platform installers, signing, updates, cross-platform runtime behavior and extension compatibility suites.
- Real Obsidian plugin execution (not implemented), PyCharm parity or a GitHub PR review workflow (not implemented).
- The standard dependency-install/package path. Dependency downloads were blocked by DNS/connectivity failures; no package lock was fabricated. CI uses the pinned direct development dependencies and generates its normal dependency resolution online.

The default repository CI is configured for Windows and Linux. A configured workflow is not a claim that remote CI has run or passed. Local test results do not imply production readiness.
