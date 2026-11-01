# Workspace features in 0.3

The bottom Ask Codech panel remains available when switching native editor tabs. History is separate. Ctrl+Alt+Space focuses input; Ctrl+Alt+B opens a URL or web search; Ctrl+Alt+I enables the element picker; Ctrl+Alt+V toggles offline Persian dictation.

## Editor context

Clicking or selecting in code, a note or a diff establishes the target. The composer displays file, line, symbol, dirty state and diff side. Details previews the snapshot. Turning Context off excludes the target from the next message. Source text is quoted data, never authority. The snapshot uses unsaved text; language-service symbols are preferred, with a labeled Python/Markdown fallback. Large sections and selections are excerpted within the context budget.

## Browser and inspector

The standalone Code-OSS browser supplies real Chromium tabs, authentication storage, DevTools, history and responsive emulation. Codech's URL/search action supports DuckDuckGo, Google and Bing. Search needs an internet connection; this is not a separately crawled search index.

Inspect highlights the hovered element. Clicking captures HTML, selected computed styles, bounds and a CSS selector; Escape cancels. Details shows the payload. Scroll arrows move the page, Reveal centers the selected element, and Source searches local project files for matching selectors/text. Exact source navigation is available through a development attribute such as `data-codech-source="src/component.tsx:24"`. Heuristic matches are labeled; compiled sites cannot universally recover source code. Cross-origin frames and shadow-root source mapping are not supported. Browser data only reaches the AI when a message is sent with Context enabled. No passwords or cookies are read by the inspector.

The bundled distribution enables the upstream experimental `browser` extension API for Codech. The feature is verified against the pinned runtime. Other VS Code distributions can lack this API; the ordinary browser-open command is a fallback, not equivalent inspector support.

## Sources, skills and graph

Add up to 16 reference/vault folders through the native picker. Approved roots live in local workspace state, not repository-controlled settings. Browse them through Tools; the agent reads them without permission to write there. Codex reads the source map; the API provider gets a prepared read_reference tool.

A local index covers supported text files, imports, document links and symbol names, with a 5,000-path limit per source and 400 KB per-file limit. Git ignore rules are respected in repositories; plain non-Git vaults use built-in exclusions. Credentials, binaries and escaping symlinks are excluded. Index entries are reused by modification time/size; scans refresh on saves and after a short cache window. Only relevant neighborhoods enter prompts. It is not a complete semantic call graph or Graphiti ingestion.

Import skill folders containing SKILL.md, add HTTP MCP endpoints, or edit the isolated Codex config for stdio servers. Refresh skills/tools reloads the runtime. Native extensions install through Open VSX/VSIX. Obsidian plugin execution remains unavailable.

## Offline Persian voice and Codechi

The first microphone action downloads pinned-by-SHA256 Whisper.cpp b5454 CPU binaries and the multilingual small-q5_1 model (~199 MB total). Subsequent transcription uses local CPU only, four threads by default. Recording starts only on the microphone action, stops on the next click or after 120 seconds, and temporary WAV/transcript files are deleted afterwards. The model process exits after each transcription. Silence is rejected before inference. Recognition errors remain possible: transcripts stay editable in the draft and are never automatically sent.

The Windows recorder uses the default microphone and 16 kHz mono PCM. No microphone or real Persian-speaker quality test was performed during development; local model loading/inference, recorder compilation and silence rejection were checked separately.

Codechi is a small original SVG companion with idle, working, listening and greeting states. It follows the editor theme, respects reduced motion and can be disabled. It does not run a separate AI process.

## Protocol repair

Codex 0.166.0 expects approvalPolicy `untrusted`, not the internal Rust-style `unlessTrusted`. Thread-level SandboxMode is `workspace-write`; turn-level SandboxPolicy.type is `workspaceWrite`. Shared request builders and regression tests cover this distinction. If an earlier failed turn left an unpersisted thread ID, Codech starts a fresh runtime thread with bounded recent history and fresh context.
