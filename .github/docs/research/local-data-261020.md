# Where ZeroSDK's local, dynamic data can live: stores, sync and throwaway databases (2026)

Research date: 2026-10-20. Gathered by three research subagents from each project's docs, source code at a named commit, license files and npm metadata. Nothing was run, so speed figures are the projects' own claims. It serves ZeroSDK's data layer: a factory that runs on the user's machine, where agents write constantly (dynamic skills, memory, permission decisions, sessions, settings, statuses) and the UI reads fast and live. The user set two constraints: **free** (open source, self-hostable, no paid cloud needed) and **local first** (works fully offline on one machine), with a sync layer to Postgres and throwaway databases on demand.

Labels: [Docs] official documentation · [Source] source code or license file at the commit named · [npm] package metadata on 2026-10-20 · [Unconfirmed] not settled by a primary source · [Example] built from documented fields, not a captured output.

| Project          | Read from                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ElectricSQL      | github.com/electric-sql/electric at `3f9809f`                                                                                                      |
| InstantDB        | github.com/instantdb/instant at `b97a116`                                                                                                          |
| Jazz             | github.com/garden-co/jazz at `ededd88`                                                                                                             |
| LiveStore        | github.com/livestorejs/livestore at `aafda20` and livestore-contrib at `a5543eb`                                                                   |
| PGlite           | github.com/electric-sql/pglite at `5573bb0`                                                                                                        |
| PowerSync        | github.com/powersync-ja: powersync-docs at `cbd070f`, powersync-js at `7d5255f`, powersync-service at `51a1a89`                                    |
| RxDB             | github.com/pubkey/rxdb at `345a475`                                                                                                                |
| TanStack DB      | github.com/TanStack/db at `31dad2d`                                                                                                                |
| TinyBase         | github.com/tinyplex/tinybase at `3938658`                                                                                                          |
| Triplit          | github.com/aspen-cloud/triplit at `d3029ee`                                                                                                        |
| Zero             | github.com/rocicorp: mono at `80f6a7a`, zero-docs at `618142c`                                                                                     |
| The nine sources | the npm packages of [the session research](agent-session-261020.md), OpenCode at tag `v2.0.32`, Codex at `e1b9c94`, and their docs cached that day |
| Docs only        | libSQL, PostgreSQL (postgresql.org), Replicache, SQLite                                                                                            |

## Contents

1. [The three layers](#1-the-three-layers)
2. [The local store](#2-the-local-store)
3. [Sync to Postgres](#3-sync-to-postgres)
4. [The UI store: TanStack DB](#4-the-ui-store-tanstack-db)
5. [How the nine sources store dynamic data](#5-how-the-nine-sources-store-dynamic-data)
6. [Throwaway databases](#6-throwaway-databases)
7. [Demos](#7-demos)
   - [A template copy per test](#a-template-copy-per-test-postgres) · [A collection fed by the server](#a-collection-fed-by-the-server-tanstack-db) · [A write that waits for sync](#a-write-that-waits-for-sync-tanstack-db-with-electric)
8. [What it means for ZeroSDK](#8-what-it-means-for-zerosdk)

---

## 1. The three layers

```
UI (browser)    a fast reactive store       TanStack DB, or none
                      ▲  │
                 sync │  │ writes
                      │  ▼
server (Bun)    the local store             Postgres, PGlite or SQLite
                      │
                 sync │ (only once a second database exists)
                      ▼
remote          Postgres                    later, optional
```

Two facts frame every verdict below. Writes start on the server, where the agents run, not in the browser, so engines built for browser writes solve the wrong problem. And on one machine "offline" means the internet is down, while UI, server and database all still reach each other over localhost.

## 2. The local store

| Candidate                                        | License (OSI unless noted)                                      | Processes that can use it                                                                                                                                                 | Drizzle                                              | Live changes                                                              | Throwaway cost                                                                          | Maturity                                                        |
| ------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **PGlite** (Postgres in WASM, in-process)        | Apache-2.0 or PostgreSQL License                                | one process, one connection; a second process on the same folder corrupts it, with no lock to stop it ([pglite#1106](https://github.com/electric-sql/pglite/issues/1106)) | yes, `drizzle-orm/pglite`, the same `pg-core` schema | built in, in that process only                                            | 0.26 s from a prepared folder, 0.9 s from scratch, 128 MiB each (M1, project benchmark) | 0.5.10, labelled alpha                                          |
| **SQLite** (`bun:sqlite`, WAL)                   | public domain, MIT                                              | many processes on one file, one writer at a time                                                                                                                          | yes, but a second, `sqlite-core` schema              | same-connection hooks; other processes need `PRAGMA data_version` polling | `:memory:`, near-instant [Unconfirmed number]                                           | decades                                                         |
| **libSQL** (embedded replicas)                   | MIT                                                             | one writer                                                                                                                                                                | yes                                                  | none built in                                                             | `file::memory:`                                                                         | client 0.18.0                                                   |
| **Local Postgres** (Docker, `embedded-postgres`) | PostgreSQL License; Docker Desktop is paid for larger companies | many processes and connections                                                                                                                                            | yes, unchanged                                       | `LISTEN/NOTIFY` across processes; `Bun.SQL` has `sql.listen()`            | `CREATE DATABASE ... TEMPLATE` on a running server                                      | Postgres mature; `embedded-postgres` every release beta, 148 MB |
| **DuckDB**                                       | MIT                                                             | one writer process                                                                                                                                                        | none                                                 | none                                                                      | `:memory:`                                                                              | built for analytics, not this                                   |

- **PGlite's costs** [Docs, Source]: it runs with fsync off by default, has no autovacuum or automatic checkpoints, has an open hang under heavy delete-and-upsert churn ([pglite#1068](https://github.com/electric-sql/pglite/issues/1068)), and its `pglite-socket` server, the only way in for other processes, has an open bug that mixes queries between clients ([pglite#1046](https://github.com/electric-sql/pglite/issues/1046)). Its strength is the dialect: production Postgres, so one schema and one set of migrations.
- **libSQL syncs only with libSQL** (Turso Cloud or a self-hosted `sqld`), never with Postgres, and offline writes work only against Turso Cloud [Docs].
- **`pglaunch`**, which the repo already uses, runs `docker run postgres:alpine` [Source].
- **One owner process.** Every embedded option is single-writer, so the cleanest shape is the Bun server owning the store and hooks, agents and the UI going through its API. That turns "can several processes reach it" from an engine property into an API one, and lets live updates fan out from one place.

## 3. Sync to Postgres

| Engine                           | License                                                                                | Self-hosted, free                             | Local store                   | Write path                                                                | Offline writes                       | Bun server as a client         | Drizzle                                      | Needs from Postgres                                                     | Maturity                      |
| -------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------- | ------------------------------------ | ------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------- |
| **ElectricSQL**                  | Apache-2.0                                                                             | yes, an Elixir Docker service; cloud optional | none of its own: the client's | your own API; it returns the Postgres transaction id the client waits for | app patterns or TanStack DB's outbox | yes (documented)               | any existing table                           | 14+, `wal_level=logical`, a `REPLICATION` role, `REPLICA IDENTITY FULL` | 1.0 March 2025, service 1.8.2 |
| **Zero** (Rocicorp)              | Apache-2.0 (its server tests left the public repo on 2026-09-30)                       | yes, Docker or `zero-cache-dev`               | IndexedDB, SQLite, memory     | mutators run on the client, then on your push endpoint                    | no                                   | the cache needs Node 22+       | the best (`drizzle-zero`)                    | 15+, logical replication                                                | GA March 2026                 |
| **PowerSync**                    | service **FSL-1.1-ALv2** (source-available; Apache-2.0 after 2 years); SDKs Apache-2.0 | yes for internal use, no dashboard            | SQLite                        | local SQLite first, then a FIFO upload queue to your API                  | yes                                  | Node SDK GA; Bun [Unconfirmed] | a second, `sqlite-core` schema (beta driver) | 11+, logical replication                                                | Postgres GA, service 1.27.0   |
| **LiveStore**                    | Apache-2.0                                                                             | yes                                           | SQLite plus an event log      | events pushed and pulled, with rebase                                     | yes                                  | yes                            | none (events)                                | only as its own event-log tables                                        | beta                          |
| **Postgres logical replication** | PostgreSQL License                                                                     | built in                                      | local Postgres                | normal SQL                                                                | the local side is always writable    | n/a                            | migrations run on both sides                 | `wal_level=logical`; the subscriber must reach the publisher            | core Postgres                 |

- **Zero calls itself "not local-first"** and "doesn't support offline writes" [Docs]. **ElectricSQL "does not do write-path sync"**: writes go through your own API [Docs]. Only PowerSync writes to a local store first and drains a queue later.
- **Weak fits** [Docs, Source, npm]: InstantDB (stores everything as triples in its own Postgres), Jazz (2.0 alpha, no Postgres), Replicache ("now in maintenance mode"), RxDB (no native Postgres plugin; its production SQLite storage is paid), TinyBase (persists whole stores rather than syncing a schema), Triplit (AGPL, no Postgres store, dormant since mid-2025).
- **Logical replication copies no schema changes and no sequences, and stops on a constraint conflict** [Docs]. Because the subscriber connects to the publisher, pushing from a laptop to a remote server needs that server to reach the laptop.
- **The honest baseline: no sync engine.** With one writer (the local server), a UI on localhost and no second database, a sync engine solves nothing yet. ElectricSQL's own guide: "Not every app needs local, offline writes" [Docs]. Sync becomes necessary when a second replica appears: a remote Postgres, a second device, collaborators.

## 4. The UI store: TanStack DB

"TanStack DB is the reactive client store for your API" [Docs]. `@tanstack/db` 0.15.1, MIT, pre-1.0. Data sits in collections, queried with live queries that update incrementally ("usually sub-millisecond"), and writes apply at once as optimistic mutations, rolled back if the backend rejects them [Docs].

| Collection                         | Package and version                                              | Fed by                                 |
| ---------------------------------- | ---------------------------------------------------------------- | -------------------------------------- |
| QueryCollection                    | `@tanstack/query-db-collection` 1.4.7                            | your own API, through TanStack Query 5 |
| ElectricCollection                 | `@tanstack/electric-db-collection` 0.6.2                         | ElectricSQL                            |
| PowerSyncCollection                | `@tanstack/powersync-db-collection` 0.2.12 (alpha per PowerSync) | PowerSync                              |
| RxDB, TrailBase                    | 0.1.110, 0.1.122                                                 | RxDB; TrailBase (a SQLite backend)     |
| IndexedDB, LocalOnly, LocalStorage | built in                                                         | the browser                            |

There is no official collection for InstantDB, Jazz, LiveStore, Replicache, TinyBase, Triplit or Zero [npm]. Its SQLite persistence guide keeps rows and sync offsets across restarts, and its offline transactions package keeps a durable outbox of pending writes; both apply to the Query and Electric collections and are redundant for PowerSync, which persists and queues already [Docs]. The app already depends on `@tanstack/react-query` 5, which the QueryCollection builds on.

## 5. How the nine sources store dynamic data

| Data                     | SQLite                                | Postgres                 | Files                                                            | In memory                     | Other                                 |
| ------------------------ | ------------------------------------- | ------------------------ | ---------------------------------------------------------------- | ----------------------------- | ------------------------------------- |
| Sessions                 | 3 (OpenCode, Cloudflare, Codex index) | 0 by default; 4 offer it | 4 (Claude Agent SDK, Claude Code, Codex, eve)                    | 2 (Mastra, OpenAI Agents SDK) | AI SDK keeps none                     |
| Memory                   | 2                                     | 0 by default; 2 offer it | 5 (Claude Agent SDK, Claude Code, OpenAI Agents SDK, Codex, eve) | 1                             | 2 app-defined                         |
| Skills                   | 1                                     | 0                        | 8 read `SKILL.md` folders                                        | 1 registry                    | Cloudflare and Mastra also in a store |
| Settings                 | 1                                     | 0                        | 4 layered (user, project, managed)                               | 0                             | 5 in code                             |
| Saved permission choices | 1 (OpenCode)                          | 0                        | 3 (Claude Agent SDK, Claude Code, Codex)                         | 3 session-only                | 2                                     |

- **Structured state goes in SQLite, human-editable artifacts stay files.** OpenCode keeps sessions and saved approvals in `opencode.db` (SQLite, through a Drizzle fork); Cloudflare gives each agent a SQLite database; Codex indexes its JSONL in SQLite. Postgres appears only as an opt-in adapter (a Claude Agent SDK example, Cloudflare, Mastra and eve) [Docs, Source].
- **Claude Code has no database.** Transcripts, memory and skills are all files under `~/.claude` [Docs].
- **Change while running is normal.** Agents write memory while they run in 8 of 9; skills change fully while running in 7 of 9, and OpenCode, Claude Code and Codex reload them from a file watcher [Docs, Source].
- **Sync is rare.** 2 of 9 sync a local store with a remote database, both one way or libSQL-only; none syncs SQLite with Postgres both ways [Docs].

## 6. Throwaway databases

The nine sources test with the same engine in memory or in a temporary home folder, never a mock: in-memory SQLite (`:memory:`) in OpenCode and Mastra; in-memory store classes in five; a temporary `CLAUDE_CONFIG_DIR` or `CODEX_HOME` per test [Source]. For Postgres, a template database gives isolated copies on a running server: "CREATE DATABASE actually works by copying an existing database", with the limit that "no other sessions can be connected to the source database while it is being copied" [Docs]. Cheapest first: SQLite `:memory:`, a PGlite `clone()` (anecdotal 30 ms), PGlite from a prepared folder, then PGlite from scratch (both timed in section 2), a Postgres template copy [Unconfirmed], a new container [Unconfirmed, seconds].

## 7. Demos

### A template copy per test (Postgres)

[Example] built from https://www.postgresql.org/docs/current/manage-ag-templatedbs.html: migrate and seed one template once, then copy it per test or experiment.

```sql
-- once: migrate and seed zerosdk_template, then leave it unconnected
CREATE DATABASE t_ab3de9fg TEMPLATE zerosdk_template;
-- ... the test or experiment runs against t_ab3de9fg ...
DROP DATABASE t_ab3de9fg;
```

### A collection fed by the server (TanStack DB)

[Example] built from the QueryCollection docs: the UI's sessions, fetched from the server and refreshed when the server pushes a change.

```ts
import { queryCollectionOptions } from "@tanstack/query-db-collection"
import { createCollection } from "@tanstack/react-db"

export const sessions = createCollection(
  queryCollectionOptions({
    queryKey: ["sessions"],
    queryFn: () => fetch("/api/v1/sessions").then((response) => response.json()),
    getKey: (session) => session.id,
    queryClient,
  }),
)
```

### A write that waits for sync (TanStack DB with Electric)

[Example] built from https://tanstack.com/db/latest/docs/collections/electric-collection ("Each handler should call `await collection.utils.awaitTxId(txid)` to wait for synchronization"): the server returns the transaction id of its write, and the client holds its optimistic state until Electric delivers that transaction.

```ts
onUpdate: async ({ transaction }) => {
  const { txid } = await api.sessions.update(transaction.mutations[0].changes)
  await sessions.utils.awaitTxId(txid)
}
```

The server reads that id inside the same transaction: `SELECT pg_current_xact_id()::xid::text as txid`.

## 8. What it means for ZeroSDK

Three shapes, by how much sync they add:

```
A) no sync engine     UI: TanStack DB QueryCollection  ◄─ server push (SSE / WebSocket)
                      server: one local Postgres, Drizzle and Better Auth unchanged
                      later: pg_dump or one-way replication to a remote Postgres

B) ElectricSQL        UI: TanStack DB ElectricCollection  ◄─ Electric (Elixir, Docker) ◄─ Postgres
                      server: writes through its API as today, returning a transaction id
                      later: point Electric at a remote Postgres

C) PowerSync          server: local SQLite first, an upload queue to Postgres
                      a second (sqlite-core) schema; the service is source-available
```

- **A fits today**: one machine, one writer, nothing to converge. TanStack DB in the UI is the fast layer, and the server pushes changes after each write or relays Postgres `LISTEN/NOTIFY`. It keeps throwaway databases free of replication slots and publications.
- **B is the sync engine that fits this stack best** when a second database arrives: Apache-2.0, any existing table, the write path stays the server's API, and the UI code changes from a Query to an Electric collection. Its costs are an Elixir service with its own disk, logical replication, and a mandatory auth proxy, since Electric "exposes public access to the contents of your database" by default [Docs].
- **C is for writing offline to a local store while a remote Postgres is the source of truth**, which a one-machine factory does not need yet, and its service is not OSI open source.
- **Skills and memory.** Since Claude Code keeps them as files (section 5), a database can be their source of truth only if the server writes them out to a folder each session loads skills from, where Claude Code's file watcher picks up changes.
- **Throwaways**: a template database per test or experiment on the local Postgres, or PGlite in memory where a test wants no server at all.

Questions this leaves for the user:

1. **Which Postgres runs locally**: Docker as today (`pglaunch`), `embedded-postgres` without Docker (beta), or PGlite inside the server (alpha, one connection).
2. **Sync now or later**: shape A now with B as the upgrade, or B from the start.
3. **TanStack DB as the UI store**, given it is pre-1.0.
4. **Skills and memory**: the database as their source of truth written out to files, or files as the source of truth that the database indexes.
