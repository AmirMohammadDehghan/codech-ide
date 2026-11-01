# Independent desktop distribution

The current VSIX runs inside an existing VS Code or Code-OSS host. The target product is an independently branded Code-OSS desktop application. No independent installer has been built or signed in 0.1.

```sh
npm install
npm run build
npm run desktop:prepare
```

Preparation clones the pinned upstream source under `.upstream/vscode`, validates the exact commit, merges Codech product metadata and Open VSX configuration, and copies the built workbench into the built-in extensions directory. The script refuses a different upstream revision. It does not install operating-system dependencies, compile Code-OSS, install or sign an executable, or configure an update service.

Follow the pinned upstream [contributor build instructions](https://github.com/microsoft/vscode/wiki/How-to-Contribute) for platform toolchains and the upstream `.nvmrc`. On Windows, that includes the required native compiler toolchain; the top-level Node 22 requirement applies to the workbench, not necessarily the pinned Code-OSS source build. Run upstream `npm ci`, development/watch and platform packaging commands only after those prerequisites are ready.

Before a public desktop release:

- Implement native chat/knowledge editor contributions and default layout restoration.
- Audit product services, built-in extension licenses, marketplace endpoints and update metadata.
- Replace every application/platform icon and installer identity, preserving required notices.
- Validate Windows/macOS/Linux builds, extension host compatibility, debugging and accessibility.
- Test workspace trust and Codex sandbox behavior on every supported OS.
- Add signed installers, crash reporting policy, reproducible build evidence and signed updates.

The in-repository vector mark and forest theme are first-party assets. Current product overrides are a source preparation baseline, not proof that all upstream branding and platform resources have been replaced.
