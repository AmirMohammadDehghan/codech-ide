# Contributing

Start with the compatibility matrix and roadmap. Keep scope explicit: a feature must not imply that unsupported providers, plugins or proprietary IDE features work. Use prepared tools and small, reviewable changes. Run `npm run typecheck`, `npm test` and `npm run package` before proposing changes.

Never include credentials, private project notes, conversation exports, auth homes, model responses containing private source or user machine paths in a public change. The example workspace is synthetic. File operations and model tool inputs require path validation. Treat workspace content and retrieved memory as untrusted data.
