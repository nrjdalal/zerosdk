import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { Manifest } from "../../../../packages/scripts/src/sources"
import { countTerms, table } from "../../../../packages/scripts/src/terms"

// Counting over a cache written here, shaped as `bun run sources` writes it.

const work = mkdtempSync(join(tmpdir(), "terms-"))

const manifest: Manifest = {
  alpha: {
    fetchedAt: "2026-10-20T00:00:00.000Z",
    pages: { "a.md": "https://alpha.dev/a", "b.md": "https://alpha.dev/b" },
    product: "Alpha",
  },
  beta: {
    fetchedAt: "2026-10-20T00:00:00.000Z",
    pages: { "c.md": "https://beta.dev/c" },
    product: "Beta",
  },
}

beforeAll(async () => {
  await Bun.write(join(work, "manifest.json"), JSON.stringify(manifest))
  await Bun.write(join(work, "alpha/a.md"), "The Orchestrator hands work to a subagent.")
  await Bun.write(join(work, "alpha/b.md"), "Two sub-agents and one orchestrators-only note.")
  await Bun.write(join(work, "beta/c.md"), "A main agent with subagents, not a submarine agent.")
})

afterAll(() => rmSync(work, { force: true, recursive: true }))

describe("countTerms", () => {
  test("counts whole words, ignoring case, per source and across every page of each", async () => {
    const { counts } = await countTerms(["orchestrators?", "sub-?agents?", "main agents?"], work)
    expect(counts).toEqual([
      { hits: [2, 0], sources: 1, term: "orchestrators?" },
      { hits: [2, 1], sources: 2, term: "sub-?agents?" },
      { hits: [0, 1], sources: 1, term: "main agents?" },
    ])
  })

  test("fails with what to run when there is no cache", async () => {
    await expect(countTerms(["agent"], join(work, "none"))).rejects.toThrow("run bun run sources")
  })
})

describe("table", () => {
  test("writes a markdown row per term, with a pipe in a term escaped", () => {
    expect(table([{ hits: [3, 0], sources: 1, term: "lead|leads" }], ["Alpha", "Beta"])).toBe(
      "| Term | Sources | Alpha | Beta |\n| --- | --- | --- | --- |\n| lead\\|leads | 1/2 | 3 | 0 |",
    )
  })
})
