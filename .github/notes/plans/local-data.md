# Keep the factory's dynamic data local

- Status: planned
- Links: [research](../../docs/research/local-data-261020.md) · [the harness and bridge plan](harness-bridge.md)

The factory is mostly dynamic: agents add and change sessions, settings such as the chosen bridge, memory, skills and permission decisions all the time, and the UI reads them fast and live. The data stays on the user's machine, free and local first, with throwaway databases on demand and room for a remote Postgres later.

## Decided

1. **No sync engine for now** (2026-10-20). One local Postgres, with Drizzle and Better Auth as today; the UI holds its data in TanStack DB collections fed by the server's API, and the server pushes each change. ElectricSQL with TanStack DB's Electric collection is the upgrade once a second database exists.
2. **Postgres runs in Docker** (2026-10-20), as `pglaunch` runs it today: mature, open to the server, hooks and tools at once, with `LISTEN/NOTIFY` for change events and template databases for throwaways. PGlite stays an option for small throwaway test databases.
3. **TanStack DB is the UI store** (2026-10-20), through its Query collection on the TanStack Query 5 the app already uses, despite `@tanstack/db` being pre-1.0: its live queries and instant, rolled-back-on-refusal writes fit a sidebar that changes all the time, and it is the path to ElectricSQL later.

## Open questions

To ask the user one at a time, each with a recommendation:

1. **Skills and memory.** Recommended: the database as their source of truth, written out to each session's `.claude/` folder, since Claude Code reads them only as files.
