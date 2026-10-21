---
name: codebase-map
description: "Orient in this repo: which file to edit for a change, how a change ripples across the stack, and how to search the code. Use at the start of a task in an unfamiliar area, or before a cross-cutting change."
source: https://github.com/nrjdalal/zerostarter
---

> [!CAUTION]
> Synced from https://github.com/nrjdalal/zerostarter. Customize this skill or remove this note to stop syncing.

# Codebase Map

One Bun + Turborepo monorepo: two deployable apps over shared packages. Imports use `@api/hono`, `@packages/*`, and the `@/` alias, never deep relative paths.

```
.generated/       # repo-root home for build-time generated assets (gitignored), the sources' docs cache among them
.github/docs/     # GLOSSARY.md, adr/ and research/: the factory's language, its decisions and the evidence (domain-modeling skill)
api/hono/         # backend (Hono): routers, middlewares, the AppType export
web/next/         # frontend (Next.js App Router): app/, components/, lib/, content/
packages/auth/    # Better Auth instance
packages/db/      # Drizzle schema + client
packages/env/     # type-safe env, one validated entry per consumer
packages/config/  # TS base, tsdown factory, and site.ts (brand identity)
packages/schema/  # Zod schemas the factory shares, one file per entity (agent.ts), fields grouped under `// required`, `// optional` and `// metadata`, A to Z within each; its `/docs/reference` page shows each as the type it is written as, which `bun run agent:type` prints; a long enum stays on one line under `// oxfmt-ignore`
packages/scripts/ # build-only bun tooling (agent-schemas, agent-type, auth-schema, data-table-metrics, generate-env, provider-logos, release-version, sources, terms); every new script lands here, never bundled
packages/cli/     # the zerostarter scaffolding CLI (canonical repo only; init strips it)
tests/            # the whole suite, mirroring each subject's path; *.e2e.test.ts drive a running stack (init strips the canonical suite; this repo keeps its own)
```

Read `AGENTS.md` first for the rules; `curl "$(bunx portless get zerosdk)/llms-full.txt"` dumps the whole codebase as one context file.

## Where to edit for X

| Goal | Edit here | Then |
| --- | --- | --- |
| Add/change an API route | `api/hono/src/routers/<name>.ts` → export from `routers/index.ts` → mount in `src/index.ts` `.route()` chain | `api-endpoint` skill |
| Change the database schema | `packages/db/src/schema/<name>.ts` → export from `schema/index.ts`; `auth.ts` is generated, see the row below | `db-migration` skill |
| Add/change a page | `web/next/src/app/`, route groups: `(marketing)` public, `(protected)` dashboard, `(console)` member and above, `(content)` docs+blog, `(llms.txt)` the plain-text mirrors | - |
| Add/customize a UI component | `web/next/src/components/`: `ui/` is generated shadcn, don't hand-edit | `design`, `shadcn-sync` skills |
| Add or change the agents sidebar | `web/next/src/components/agents/sidebar.tsx` (`AgentsHeader`, and `AgentsNav` with the Threads group above the agents), each value's icon in `agents/icons.ts`, and the demo `agents/sidebar-demo.tsx` that `/docs/ui/sidebar` shows | `design` skill |
| Document a UI component | `web/next/content/docs/ui/<name>.mdx`, the live demo and its `<include>`d source inside `DocsPreview`, registered in `web/next/docs.config.ts` | `design`, `doc-sync` skills |
| Call the API from the web app | `web/next/src/lib/api/client.ts` (`apiClient`, `unwrap`) | - |
| Rebrand (name, description, socials) | `packages/config/src/site.ts`, one file | - |
| Add or read an env var | `packages/env/src/{api-hono,auth,db,web-next}.ts`; read via `@packages/env/*`, never `process.env`. The root `.env` is loaded by `src/load-dotenv.ts`, which the server targets import and neither `web-next` nor the package index does; a new server target imports `@/load-dotenv` first. The exception is a variable the hosting platform injects rather than you configuring (`PORT`, `VERCEL`, `VERCEL_ENV`, `VERCEL_GIT_COMMIT_*`): those are read from `process.env` at the point of use and belong in neither the schema nor `.env.example` | - |
| Configure auth (providers, cookies, hooks) | `packages/auth/src/index.ts` | - |
| Add or change an auth plugin, or a column on `user`/`session` | `packages/auth/src/schema.ts` (`additionalFields` for a column) → `bun run auth:schema` regenerates `packages/db/src/schema/auth.ts` | `db-migration` skill |
| Add a data table | colocate `data-columns.tsx` + `data-table.tsx` in the page's `components/` folder, composing `web/next/src/components/data-table.tsx` (reference: `(console)/console/(access)/users/`) | `design` skill |
| Add a test | `tests/<path of the file under test>.test.ts`; run the suite with `bun run test`. An end-to-end test is `tests/<path of the router or page it drives>.e2e.test.ts` on the `tests/stack.ts` helper, run against a stack with `bun run test:e2e` | `docker-test` skill |
| Add a build or tooling script | `packages/scripts/src/<name>.ts`, with its deps on that package | - |
| Name a concept, a field or a docs page | `.github/docs/GLOSSARY.md`; a new term is picked by the nine sources' consensus | `domain-modeling` skill |
| Change the Agent schema (`/docs/reference/agent`) | `packages/schema/src/agent.ts` → `bun run agent:type` rewrites `web/next/src/schemas/agent.type.mdx`, the type the page shows, and refreshes its Twoslash hovers (`twoslash:cache`); commit both, since a test fails while the two differ | `dev` skill (restart after) |
| Refresh the Agent schema sources (`/docs/reference/agent`) | `packages/scripts/src/agent-schemas.ts` lists the sources → `bun run agent:schemas` rewrites `web/next/src/schemas/agent.sources.mdx` and refreshes its Twoslash hovers (`twoslash:cache`); commit both | `dev` skill (restart after) |
| Add or refresh a provider's logo (`/docs/ui/icons`) | `packages/scripts/src/provider-logos.ts` lists the providers by their models.dev ID → `bun run provider:logos` rewrites `web/next/src/components/common/provider-logos.tsx`, one component per provider named after it; commit it, and give the provider a row on `web/next/content/docs/ui/icons.mdx` | - |
| Add or change a `twoslash` code block in the docs, a generated file one includes (`web/next/src/schemas/`), a rehype step in `web/next/source.config.ts` that rewrites a block's code, or a package its hovers come from (`typescript`, `fumadocs-twoslash`) | then refresh the hovers with `bun run twoslash:cache` and commit `web/next/twoslash-cache` as a fresh run leaves it, since an entry is keyed by its block's code alone and a running dev server writes an entry for every edit it compiles; a build under Bun (Vercel, Docker) reads hovers only from it and fails on a block it lacks, and CI rebuilds it and fails when it differs | - |
| Gate by role | the ladder and every access decision live in `packages/auth/src/access.ts` (pure, unit-tested, imported as `@packages/auth/access`); `web/next/src/lib/auth/console.ts` gates the pages at member, `api/hono/src/middlewares/console.ts` requires admin for the whole console router via `requireConsoleRole` | - |
| Change the error/response shape | `api/hono/src/lib/error.ts` (the `{ error: { code, message } }` handler) | - |
| Change docs structure/sidebar | `web/next/docs.config.ts`, single source; `meta.json` is generated | - |

## Trace a feature across the stack

Types flow downhill, so a change ripples predictably:

```
packages/db/src/schema  →  api/hono/src/routers  →  api/hono/src/index.ts (AppType)  →  web/next/src/lib/api/client.ts  →  app / components
```

To add a field end to end: edit and migrate the schema, then select and return it in the router. Every `apiClient` call site is retyped automatically, and the compiler becomes your worklist of what still must change.

## Entry points (read these first)

- `api/hono/src/index.ts`, the `.route()` chain and `export type AppType`, the whole API shape in one file.
- `web/next/src/app/layout.tsx`, the web root.
- `packages/config/src/site.ts`, brand identity and injectable content.

## Fast find

```bash
rg -n "\.route\(" api/hono/src/index.ts               # every mounted router
rg -n "export const \w+Router" api/hono/src/routers   # every router definition
ls packages/db/src/schema                             # every schema file (tables)
rg -n "apiClient\." web/next/src                      # every API call site
rg -n "SOME_ENV_VAR" packages/env                     # where an env var is declared
ls .agents/skills                                     # every task skill available
```

## Then

Load the task skill (the table's right column); `dev` runs and restarts the stack, and concept docs live under `/docs`.
