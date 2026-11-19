@AGENTS.md

Read [README.md](README.md) for how the site works, then follow
[docs/DEV_RULES.md](docs/DEV_RULES.md), [docs/UI_RULES.md](docs/UI_RULES.md) and
[docs/COMMITS.md](docs/COMMITS.md).

- Package manager is bun (`~/.bun/bin/bun`). Pin exact versions.
- `cacheComponents` is off on purpose: every page reads the session cookie.
- Every server action calls `requireEditor()` first. Never trust the browser.
- Never send `passwordHash` or a signed photo link for an album the viewer
  isn't allowed into.
