# Keep the factory's dynamic data local

- Status: planned
- Links: [research](../../docs/research/local-data-261020.md) · [the harness and bridge plan](harness-bridge.md)

The factory is mostly dynamic: agents add and change sessions, settings such as the chosen bridge, memory, skills and permission decisions all the time, and the UI reads them fast and live. The data stays on the user's machine, free and local first, with throwaway databases on demand and room for a remote Postgres later.

## Decided

1. **No sync engine for now** (2026-10-20). One local Postgres, with Drizzle and Better Auth as today; the UI holds its data in TanStack DB collections fed by the server's API, and the server pushes each change. ElectricSQL with TanStack DB's Electric collection is the upgrade once a second database exists.
2. **Postgres runs in Docker** (2026-10-20), as `pglaunch` runs it today: mature, open to the server, hooks and tools at once, with `LISTEN/NOTIFY` for change events and template databases for throwaways. PGlite stays an option for small throwaway test databases.
3. **TanStack DB is the UI store** (2026-10-20), through its Query collection on the TanStack Query 5 the app already uses, despite `@tanstack/db` being pre-1.0: its live queries and instant, rolled-back-on-refusal writes fit a sidebar that changes all the time, and it is the path to ElectricSQL later.
4. **Memory and skills live in the database, reached through a `zerosdk` CLI** (2026-10-20). Agents run `zerosdk memory search`, `zerosdk memory save`, `zerosdk skill get` and `zerosdk skill save` through Bash, against the local server, rather than through an MCP server: Claude Code's own cost guide says CLIs "are still more context-efficient than MCP servers because they don't add any per-tool listing". One `zerosdk` skill teaches the commands, so only its description sits in context until it is used. Claude Code's own memory is off (`autoMemoryEnabled: false` in the launch settings), so the database is the one copy and the UI can show every memory and skill. Claude Code loads native skills only from files, so the server writes each agent's own skills (its `skills` list) into the session's `.claude/skills/` at launch, one way only, and a permission rule blocks direct writes there.
