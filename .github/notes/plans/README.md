# Plans

The curated backlog of everything not yet done: in-progress work, planned features, ideas, and known cleanups. One file per item in this folder, each carrying a status and a link to its history (closed issue, branch, or PR). GitHub issues are the inbox for new bugs and requests; fold each in here and close it once captured, so this stays the single backlog rather than a parallel one.

Distinct from the audit reports, which `AGENTS.md` puts in `../audits/` and which are deleted once addressed. An item gets a full spec once it moves to `planned`.

## In progress

- [0001 Threads in the agents sidebar](0001-threads-agents-sidebar.md) - the mockup lists the human's threads above the orchestrators, five to a page with unread counts and a menu on each row; real data and the thread view are next (PR #25).
- [0003 A Session schema for the agents sidebar](0003-session-schema.md) - the `Session` schema and its page are built ([ADR 0010](../../docs/adr/0010-a-session-keeps-what-most-sources-keep.md)); keying the icons by it and building the sidebar's rows from it are next.

## Planned

- [0004 Run agents through a harness and a bridge](0004-harness-bridge.md) - the server drives each agent as a Claude Code CLI in a herdr pane behind two contracts, with the SDK as a later route; nine decisions made, none left open.
- [0005 Keep the factory's dynamic data local](0005-local-data.md) - one local Postgres with TanStack DB in the UI and server push, no sync engine yet; four decisions made, none left open.

## Backlog / ideas

Nothing yet.

## Icebox

Raised but undecided: real concerns with no agreed next action and no confident verdict. They sit here rather than in the backlog (which implies a plan) or closed (which loses the context), and leave only by being decided. Mirrored as checkboxes on the standing Icebox issue (#22).

- [0002 The sign-in session table and the glossary's Session](0002-auth-session-name.md) - the database's `session` table holds a sign-in while the glossary's Session is an agent's working context; it matters once agent sessions get a table of their own (PR #20 review).
