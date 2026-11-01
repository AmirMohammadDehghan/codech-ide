# Development roadmap

Phases describe deliverable gates, not time estimates.

## 0.1 — Foundation (this repository)

- Central workbench and consistent Codech identity.
- Two agent connection paths and prepared API tools.
- Bounded context, Markdown vault, local source/note graphs.
- Git worktrees, native diffs and digest-bound review approval.
- Optional Graphiti MCP fact-search adapter.
- Tests, compatibility matrix and pinned Code-OSS source preparation.

## 0.2 — Reliable daily workflow

- Durable task/session event log with restart recovery and cancellable pending requests.
- Project creation wizard with trusted templates and environment detection.
- Worktree lifecycle, dirty-state handling, locks, snapshots and cleanup.
- Proper ignore rules, incremental file/symbol index, token accounting and context cache.
- File watchers, bounded conversation retention, hunk-level review and persistent review records.
- Native stage/commit/sync/conflict workflow and user-requested GitHub PR creation.
- Evaluate prepared tools against real Django/React tasks with Terra and Sol.

## 0.3 — Knowledge and compatibility

- Full Markdown preview/editing, frontmatter, backlinks, embeds and vault selection.
- Reviewed Graphiti ingestion, citations, temporal expiry and provider-aware cost controls.
- Plugin process boundary, versioned Obsidian API subset and published plugin compatibility tests.
- Native skill/MCP/tool manager with per-capability permissions and crash isolation.
- JetBrains keymap import, Django run/debug/test profiles and database workflow.

## 0.4 — Independent desktop alpha

- Rebaseable Code-OSS integration with native views and default layouts.
- Open VSX conformance, extension regression suite and accessibility/RTL review.
- Automated Windows/macOS/Linux builds, reproducibility, installers and updates.

## Daily-driver gate

Do not label the product stable until it survives restart/crash, wrong-worktree, stale-review, invalid credential, provider timeout, cancellation, merge-conflict, malicious-note, symlink-escape and extension-crash scenarios. Publish task-success and total-cost measurements rather than unverified token-saving claims.
