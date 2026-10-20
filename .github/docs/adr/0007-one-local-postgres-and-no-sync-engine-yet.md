# One local Postgres, and no sync engine yet

The factory's data lives in one Postgres running in Docker on the user's machine, with Drizzle and Better Auth as before. The UI holds what it shows in TanStack DB collections fed by the server's API, and the server pushes each change, so the sidebar updates live without a second database. With one machine and one writer there is nothing for a sync engine to converge: "Not every app needs local, offline writes" ([ElectricSQL](https://electric.ax/docs/guides/writes)). Once a second database exists, ElectricSQL with TanStack DB's Electric collection is the upgrade, since it syncs existing tables and leaves writes to the server's API ([research](../research/local-data-261020.md)).

## Considered Options

- **ElectricSQL from the start**: an Elixir service with its own disk, logical replication and an auth proxy, for nothing to sync yet.
- **Zero**: "not local-first" and "doesn't support offline writes", by its own docs.
- **PowerSync**: its service is source-available (FSL), and its local store is SQLite, which needs a second schema.
- **PGlite as the store**: alpha, one connection, and a second process opening its folder corrupts it.
- **SQLite or libSQL**: a second dialect beside Postgres, and libSQL syncs only with libSQL.
