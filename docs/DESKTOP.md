# Independent Windows desktop

Codech IDE 0.2 packages official VSCodium 1.143.17232 (VS Code API 1.143.1), the Codech workbench and the official Codex CLI 0.166.0 bundle. No installed Microsoft VS Code, Node or Codex is required to launch the app. Git and language-specific toolchains remain separate prerequisites.

This is a verified upstream binary distribution with Codech changes, **not a claim that the Code-OSS engine was compiled from source**. Exact URLs and SHA-256 hashes are in `desktop/runtime.lock.json`; the app includes `CODECH-PROVENANCE.json`. Upstream licenses and third-party notices are preserved.

## Installation

Run `CodechIDE-Setup-0.2.0-x64.exe`. The installer places Codech in `%LOCALAPPDATA%\Programs\Codech IDE`, adds a Start menu entry and an uninstaller, and offers a desktop shortcut. It needs no administrator privileges. Current Codech binaries and installer are unsigned.

User data: `%APPDATA%\Codech IDE`. Extensions: `%USERPROFILE%\.codech-ide\extensions`. Uninstall preserves those user directories. The generated `release/Codech IDE` directory also runs directly. An empty `data` directory beside Codech.exe enables upstream portable mode; the builder refuses to overwrite portable user data.

**Theme** or **Ctrl+K Ctrl+T** selects Graphite, Paper, Forest or third-party themes. Use the native extension manager for Open VSX or VSIX. The CLI is `bin/codech.cmd`; no global PATH change is required.

Bundled Codex starts on demand. There is no automatic graph database, embedding pipeline or background inference. Authentication has a separate Codech home. API credentials use SecretStorage.

Upstream automatic updates are disabled in product metadata to prevent VSCodium from overwriting Codech. Updates use future Codech installers. macOS/Linux installers are not included.

## Rebuild on Windows x64

Node 22+, npm and a network connection are required. The binary packaging route needs no C++ toolchain.

```powershell
npm ci --ignore-scripts
npm run typecheck
npm test
npm run desktop:build
node scripts/setup-inno.mjs
npm run desktop:installer
```

Downloads are SHA-256 checked. setup-inno installs the pinned compiler for the current user into .cache/inno; alternatively set ISCC_PATH to an existing compiler. Observe Inno Setup's own commercial-use licensing terms. Caches and release artifacts are excluded from Git.

The builder starts with the official runtime, changes product identity and application icon/version resources, uses a distinct app-data location and AppUserModelID, adds the built-in extension and themes, preserves the full Codex dependency layout and writes provenance. Runtime API version is preserved for extension compatibility. The installer includes uninstall registration and shortcuts.

The experimental `desktop:prepare` command is a separate Microsoft Code-OSS source-development route pinned in desktop/upstream.json. It is **not** the recipe used for the packaged VSCodium runtime. Corresponding distribution source is linked in the runtime lock. Microsoft's proprietary VS Code product is not redistributed.
