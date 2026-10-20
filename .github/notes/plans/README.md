# Plans

The curated backlog of everything not yet done: in-progress work, planned features, ideas, and known cleanups. One file per item in this folder, each carrying a status and a link to its history (closed issue, branch, or PR). GitHub issues are the inbox for new bugs and requests; fold each in here and close it once captured, so this stays the single backlog rather than a parallel one.

Distinct from the dated audit reports, which `AGENTS.md` puts in `../audits/` and which are deleted once addressed. An item gets a full spec once it moves to `planned`.

## In progress

- [Threads in the agents sidebar](threads-agents-sidebar.md) - the mockup lists the human's threads above the orchestrators, five to a page with unread counts and a menu on each row; real data and the thread view are next (PR #25).

## Planned

- [Run agents through a harness and a bridge](harness-bridge.md) - the server drives each agent as a Claude Code CLI in a herdr pane behind two contracts, with the SDK as a later route; seven decisions made and two open questions left.
- [A Session schema for the agents sidebar](session-schema.md) - the sidebar's state, task kind, title and nesting move from the web app into a `Session` schema beside `Agent`, researched across the nine sources; two decisions made and six open questions left.

## Backlog / ideas

Nothing yet.

## Icebox

Raised but undecided: real concerns with no agreed next action and no confident verdict. They sit here rather than in the backlog (which implies a plan) or closed (which loses the context), and leave only by being decided. Mirrored as checkboxes on the standing Icebox issue (#22).

- [The sign-in session table and the glossary's Session](auth-session-name.md) - the database's `session` table holds a sign-in while the glossary's Session is an agent's working context; it matters once agent sessions get a table of their own (PR #20 review).
