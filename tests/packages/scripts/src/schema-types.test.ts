import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { SchemaName } from "../../../../packages/scripts/src/schema-sources"
import {
  generate,
  inSourceOrder,
  locate,
  NAMES,
} from "../../../../packages/scripts/src/schema-types"

// The generator against the real schemas: each docs page's block has to be what it prints now, so a schema change that skips `bun run schema:types` fails here rather than leaving its page behind.

const cache = mkdtempSync(join(tmpdir(), "schema-types-"))
const generated = {} as Record<SchemaName, string>

beforeAll(async () => {
  for (const name of NAMES) generated[name] = await generate({ cache, name })
})

afterAll(() => rmSync(cache, { force: true, recursive: true }))

describe("schema types", () => {
  test("is the block each schema's page shows", async () => {
    for (const name of NAMES) expect(generated[name]).toBe(await Bun.file(locate(name).out).text())
  })

  test("groups the fields under the schema's comments, in its order", () => {
    for (const name of NAMES)
      expect(generated[name].match(/^ *\/\/ .+$/gm)).toEqual([
        "  // required",
        "  // optional",
        "  // metadata",
      ])
    expect(generated.agent).toMatch(
      /\/\/ required\n.*\n {2}description: string\n.*\n {2}id: string\n/,
    )
    expect(generated.agent).toMatch(
      / {2}metadata\?: \{\n.*\n {4}color\?: .+\n.*\n {4}name\?: string\n {2}\}\n/,
    )
  })

  test("prints an object inside metadata as a block of its own fields", () => {
    expect(generated.session).toMatch(
      / {4}pr\?: \{\n.*\n {6}number: number\n.*\n {6}url: string\n {4}\}\n/,
    )
  })

  test("shows a field with a default as one an agent may leave out", () => {
    expect(generated.agent).toContain('  role?: "main" | "orchestrator" | "subagent"\n')
  })

  test("keeps an enum's members in the order the schema lists them", () => {
    expect(generated.agent).toContain('  effort?: "low" | "medium" | "high" | "xhigh" | "max"\n')
    expect(generated.session.match(/^ {4}\| "(\w+)"$/gm)?.slice(0, 3)).toEqual([
      '    | "pending"',
      '    | "running"',
      '    | "waiting"',
    ])
    expect(inSourceOrder('"high" | "low"', 'z.enum(["low", "high"])')).toBe('"low" | "high"')
    expect(inSourceOrder("string[]", "z.array(z.string())")).toBe("string[]")
  })
})
