# Compatibility matrix

## Code-OSS

The standalone Windows package uses verified VSCodium 1.143.17232, exposing VS Code API 1.143.1. Exact release assets and hashes are pinned in desktop/runtime.lock.json. The separate source-preparation path is not the shipped runtime recipe. Product metadata points at Open VSX; actual Dracula installation was tested. This does not grant access to Microsoft's Marketplace or redistribution rights to proprietary extensions. Each VSIX's license, platform binaries, activation APIs and host requirements must be tested separately. Preserve upstream MIT notices and third-party notices when building the distribution.

## Obsidian

Obsidian API type definitions are not the Obsidian runtime. A community plugin may depend on `Plugin`, `App`, `Vault`, `Workspace`, `MetadataCache`, CodeMirror, Electron, internal DOM classes and undocumented app behavior. A directory containing `manifest.json`, `main.js` and styles is not sufficient to run it in Code-OSS.

0.2 reads local Markdown notes in `.codech/knowledge`, extracts `[[wikilinks]]`, draws linked-note graphs and inspects local plugin manifests. It **does not execute Obsidian plugins**, sync with Obsidian's cloud, implement Bases/Canvas or provide full Markdown Live Preview.

The planned compatibility host should execute reviewed plugin code in a dedicated process, expose a versioned API shim and measure compatibility against explicitly selected, appropriately licensed plugins. `Plugin`, command registration, settings persistence, vault CRUD/events and metadata cache are first targets. Editor/DOM-heavy plugins follow only after the corresponding APIs exist. Run the actual plugin test suite and publish known working versions. Never claim universal compatibility from matching the type definitions.

## PyCharm Professional workflow

| Workflow | Codech foundation | Gap to test/implement |
|---|---|---|
| Python/Django completion | Host language extensions / language servers | Select permitted extensions and measure refactoring quality |
| Run/debug configurations | Host launch configurations and tasks | Import PyCharm configuration semantics; Django templates and test runners |
| Databases and SQL | Compatible host extensions | Unified DB view, query console, credentials and dialect validation |
| Navigation/refactoring | Native editor and language servers | Parity on rename/move/safe-delete/find-usages and Django-aware behavior |
| Remote/devcontainers/SSH | Depends on allowed host extensions | Validate licensing and functionality in the independent build |
| Keymaps | Native keybindings, Codech shortcuts and IntelliJ/PyCharm keymap search | Import/export selected JetBrains shortcuts without global replacement |
| Git desktop flow | Git, native diff and Codech worktrees | Stage/commit/sync/PR UX and conflict assistance |

A familiar keymap and theme are achievable. Complete PyCharm Professional parity is a substantial engineering and validation effort. No JetBrains proprietary implementation is included.
