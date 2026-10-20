# Keep the factory's dynamic data local

- Status: planned
- Links: [ADR 0007](../../docs/adr/0007-one-local-postgres-and-no-sync-engine-yet.md) · [ADR 0008](../../docs/adr/0008-memory-and-skills-live-in-the-database-behind-a-cli.md) · [research](../../docs/research/local-data-261020.md) · [the harness and bridge plan](harness-bridge.md) · branch `docs/session-schema-plan`

The factory is mostly dynamic: agents add and change sessions, settings such as the chosen bridge, memory, skills and permission decisions all the time, and the UI reads them fast and live. The data stays on the user's machine, free and local first, with throwaway databases on demand and room for a remote Postgres later.

## Decided

1. **No sync engine for now** (2026-10-20), as ADR 0007 sets out: one local Postgres, TanStack DB in the UI fed by the server, which pushes each change; ElectricSQL once a second database exists.
2. **Postgres runs in Docker** (2026-10-20), as `pglaunch` runs it today: open to the server, hooks and tools at once, with `LISTEN/NOTIFY` for change events and template databases for throwaways.
3. **TanStack DB is the UI store** (2026-10-20), through its Query collection on the TanStack Query 5 the app already uses, despite `@tanstack/db` being pre-1.0.
4. **Memory and skills live in the database behind the `zerosdk` CLI** (2026-10-20), as ADR 0008 sets out, with Claude Code's own memory off and each agent's own skills written out one way.

## Steps

1. Point the app at a local Postgres in Docker, and keep one migrated, seeded template database to copy for each throwaway.
2. Add `@tanstack/react-db` with its Query collection, and feed the sidebar's collections from the server's API.
3. Push each change from the server to the UI over SSE or a WebSocket, from the server's own writes or from Postgres `LISTEN/NOTIFY`.
4. Store memory and skills in tables behind the `memory` and `skills` routes the harness and bridge plan lays out, and write each agent's skills out when its session starts.
5. Show the user every new table before any migration, as `AGENTS.md` requires.
