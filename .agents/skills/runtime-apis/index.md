# Node API index

Per-file inventory of every Node built-in used in the repo, for the [`runtime-apis`](SKILL.md) skill.
Snapshot: 2026-09-06. Regenerate with the `rg "node:..."` command in `SKILL.md`.

The `Runtime` column drives the rule: **Node**, **Both** and **Build** files stay on `node:` (no `Bun.*`);
**Bun** files may move a call to a `Bun.*` equivalent where one exists. `web/next` is **Both**: `next dev`
runs under the system Node while Docker and Vercel serve it under Bun.

| File | Runtime | `node:` modules (APIs used) |
| --- | --- | --- |
| `.github/scripts/compress-images.ts` | Bun | `node:path` (path) |
| `.github/scripts/docs.ts` | Bun | `node:path` (path) |
| `.github/scripts/skills-manager.ts` | Bun | `node:crypto` (createHash); `node:path` (path) |
| `.github/workflows/auto-labeler.yml` | Node | `node:child_process`, `node:fs`, `node:path` (via `require`, `actions/github-script`) |
| `packages/auth/tsdown.config.ts` | Build | `node:fs` (existsSync, readFileSync); `node:path` (resolve) |
| `packages/cli/src/commands/_prompt.ts` | Node | `node:os` (homedir) |
| `packages/cli/src/commands/doctor.ts` | Node | `node:fs` (existsSync) |
| `packages/cli/src/herdr.ts` | Node | `node:child_process` (execFileSync); `node:crypto` (createHash); `node:fs` (existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync); `node:os` (homedir); `node:path` (dirname, join) |
| `packages/cli/src/which.ts` | Node | `node:fs` (accessSync, constants); `node:path` (delimiter, join) |
| `packages/cli/src/zerosdk.ts` | Node | `node:child_process` (execFile, execFileSync); `node:path` (basename, dirname); `node:util` (promisify) |
| `packages/env/src/load-dotenv.ts` | Both | `node:path` (path) |
| `packages/env/tsdown.config.ts` | Build | `node:child_process` (execSync) |
| `packages/scripts/src/auth-schema.ts` | Bun | `node:path` (join, resolve) |
| `packages/scripts/src/data-table-metrics.ts` | Bun | `node:path` (join, resolve) |
| `packages/scripts/src/generate-env.ts` | Bun | `node:path` (resolve) |
| `packages/scripts/src/provider-logos.ts` | Bun | `node:path` (resolve) |
| `packages/scripts/src/release-version.ts` | Bun | `node:path` (join) |
| `packages/scripts/src/schema-sources.ts` | Bun | `node:path` (dirname, join, resolve) |
| `packages/scripts/src/schema-types.ts` | Bun | `node:path` (resolve) |
| `packages/scripts/src/sources.ts` | Bun | `node:fs` (renameSync, rmSync); `node:path` (join, resolve) |
| `packages/scripts/src/terms.ts` | Bun | `node:path` (join) |
| `tests/github/scripts/ensure-remote-branches.test.ts` | Bun | `node:fs` (mkdtempSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/github/workflows/auto-labeler.test.ts` | Bun | `node:module` (createRequire); `node:path` (join) |
| `tests/packages/cli/run.ts` | Bun | `node:fs` (chmodSync); `node:path` (join) |
| `tests/packages/cli/src/commands/doctor.test.ts` | Bun | `node:fs` (chmodSync, mkdtempSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/packages/cli/src/commands/setup.test.ts` | Bun | `node:fs` (mkdtempSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/packages/cli/src/herdr.test.ts` | Bun | `node:fs` (chmodSync, existsSync, mkdtempSync, readdirSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/packages/cli/src/index.test.ts` | Bun | `node:fs` (mkdtempSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/packages/cli/src/which.test.ts` | Bun | `node:fs` (chmodSync, mkdtempSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/packages/cli/src/zerosdk.test.ts` | Bun | `node:fs` (mkdtempSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/packages/db/src/schema/auth.test.ts` | Bun | `node:path` (join) |
| `tests/packages/scripts/src/provider-logos.test.ts` | Bun | `node:fs` (mkdtempSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/packages/scripts/src/release-version.test.ts` | Bun | `node:fs` (mkdtempSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/packages/scripts/src/schema-sources.test.ts` | Bun | `node:fs` (mkdtempSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/packages/scripts/src/schema-types.test.ts` | Bun | `node:fs` (mkdtempSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/packages/scripts/src/sources.test.ts` | Bun | `node:fs` (mkdtempSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/packages/scripts/src/terms.test.ts` | Bun | `node:fs` (mkdtempSync, rmSync); `node:os` (tmpdir); `node:path` (join) |
| `tests/web/next/content/docs/ui/icons-page.ts` | Bun | `node:path` (join) |
| `tests/web/next/source.config.test.ts` | Bun | `node:path` (join) |
| `tests/web/next/src/components/agents/icons.test.ts` | Bun | `node:path` (join) |
| `tests/web/next/src/components/agents/sidebar.test.ts` | Bun | `node:path` (join) |
| `tests/web/next/src/components/common/provider-logos.test.ts` | Bun | `node:path` (join) |
| `web/next/next.config.ts` | Both | `node:fs` (readFileSync); `node:path` (resolve) |
| `web/next/src/app/layout.tsx` | Both | `node:fs` (existsSync); `node:path` (join) |

## Convertible to `Bun.*` (Bun-only files)

Nothing remains. The last two (`execFileSync` in `ensure-remote-branches.ts`; `execFileSync`, `readFileSync`,
`writeFileSync` in `shadcn-customize.ts`) moved to `Bun.spawnSync`, `Bun.file` and `Bun.write` in 2026-08.
What is left on a Bun-only file is `node:path`, `node:os`, or the directory half of `node:fs`, which Bun's
own docs route to `node:` ("for operations they don't cover, such as `mkdir` or `readdir`, use `node:fs`"),
plus two deliberate keeps: `skills-manager.ts`'s `createHash` mirrors zerostarter's CLI (Node) ledger digest line
for line, and the CLI tests' `chmodSync` makes a stand-in script executable, since `Bun.write`'s `mode` option leaves
the file at 644.
