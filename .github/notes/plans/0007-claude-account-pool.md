# Spread sessions across a pool of Claude accounts

- Status: planned
- Links: [ADR 0012](../../docs/adr/0012-each-claude-account-signs-in-its-own-config-directory.md) · [ADR 0010](../../docs/adr/0010-a-session-keeps-what-most-sources-keep.md) · [ADR 0011](../../docs/adr/0011-a-session-s-messages-are-stored-whole-and-threads-group-them.md) · [the Session schema plan](0003-session-schema.md) · [the harness and bridge plan](0004-harness-bridge.md) · [the local data plan](0005-local-data.md)

The human may have several Claude accounts, say five. ZeroSDK, which is free and runs on the human's own machine, puts them in one shared pool and spreads its sessions across them by how much of each account's usage is left, so no account runs out while another sits idle.

## Decided

1. **A shared pool** (2026-10-23): any session can run on any account; accounts are not tied to agents.
2. **One Claude config directory per account** (2026-10-23), as ADR 0012 sets out: the harness passes `CLAUDE_CONFIG_DIR` for the chosen account, Claude Code keeps the login, and the database keeps no token.
3. **Usage readings from two places** (2026-10-23): a running session reports its account's 5-hour and weekly usage through the status line plan 0004 gives every session (`rate_limits.five_hour` and `rate_limits.seven_day`, each a used percentage and a reset time; plan 0003, decision 4), and an account with no fresh reading is read from Anthropic's `/api/oauth/usage` endpoint with its login. Claude Code sends `rate_limits` only on Pro and Max plans and only after a session's first response, so a Team or Enterprise account is always read from the endpoint. The endpoint is not in Claude Code's documentation, and reading a login for it is the risk ADR 0012 records.
4. **Picking** (2026-10-23): a new session goes to the account with the lowest 5-hour usage, then the lowest weekly usage, then in turn. An account at either limit is skipped until that window resets.
5. **Freshness** (2026-10-23): every 30 minutes in the background, for the app's settings, and again before a pick, an account whose last reading is over 5 minutes old is read from the endpoint.
6. **A session that hits its account's limit carries on elsewhere** (2026-10-23): its transcript is written into the directory of the account the pick rule chooses, from its stored messages (ADR 0011), and resumed there with `claude --resume`, keeping its context. This is proven against Claude Code before anything relies on it.
7. **Adding accounts** (2026-10-23): the setup step (plan 0004, decision 5) signs in the first account and offers "Add another account"; the running app's settings list the pool, add and remove accounts, and show each one's usage.

## Open

- **Where the directories live:** suggested `~/.zerosdk/accounts/<id>`, outside any repository.
- **How the app names an account:** suggested the email `claude auth status` reports for its directory.
- **Expiring logins:** a login expires, and Claude Code warns three days ahead at startup (`Your login expires in 3 days · run /login to renew`); whether and how the app asks the human to renew one is not decided.

## Left

- **An `Account` schema and table**, one record per account, beside `Agent` and `Session`; its fields are shown to the human before any migration.
- **The account each session runs under**, recorded on the session, since a session resumes only from its account's directory (a field for the Session shape of ADR 0010).
- **When a session still pauses:** plan 0003's decision 2 pauses a session on a rate limit, and the glossary's Paused says the same; with a pool, that happens only when every account is at a limit, and whose reset time `resetsAt` then holds is to be settled.
- **The usage endpoint, proven first:** its response shape, captured as test fixtures; what it returns for Team and Enterprise plans; whether an idle account's login needs refreshing before the call; and whether macOS asks the human before ZeroSDK reads Claude Code's Keychain entry.
- **Per-account trust and MCP servers:** each directory holds its own `.claude.json`, so plan 0004's decision 9, marking the repository trusted once, is done once per account, and the MCP servers a session needs reach it through `--settings` or each directory; the one-time `bypassPermissions` warning is accepted ahead the same way, with `skipDangerousModePermissionPrompt` in each directory's `settings.json`, since Claude reads it only from user, local or managed settings, never from a repository's `.claude/settings.json` ([ADR 0015](../../docs/adr/0015-agents-start-with-permissions-bypassed-and-the-flipper-comes-later.md)).
- **Peer messages across accounts:** whether Claude Code's cross-session messaging (plan 0004, decision 3) reaches a session started under another account's directory.
- **The resume across accounts** of decision 6, proven first.
- **The setup step's sign-ins and the settings view.**
