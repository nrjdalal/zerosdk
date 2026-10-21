import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { generate, inSourceOrder, OUT } from "../../../../packages/scripts/src/agent-type"

// The generator against the real schema: the Agent page's block has to be what it prints now, so a schema change that skips `bun run agent:type` fails here rather than leaving the page behind.

const cache = mkdtempSync(join(tmpdir(), "agent-type-"))
let generated = ""

beforeAll(async () => {
  generated = await generate({ cache })
})

afterAll(() => rmSync(cache, { force: true, recursive: true }))

describe("agent type", () => {
  test("is the block the Agent page shows", async () => {
    expect(generated).toBe(await Bun.file(OUT).text())
  })

  test("groups the fields under the schema's comments, in its order", () => {
    expect(generated.match(/^ *\/\/ .+$/gm)).toEqual([
      "  // required",
      "  // optional",
      "  // metadata",
    ])
    expect(generated).toMatch(/\/\/ required\n.*\n {2}description: string\n.*\n {2}id: string\n/)
    expect(generated).toMatch(
      / {2}metadata\?: \{\n.*\n {4}color\?: .+\n.*\n {4}name\?: string\n {2}\}\n/,
    )
  })

  test("shows a field with a default as one an agent may leave out", () => {
    expect(generated).toContain('  role?: "main" | "orchestrator" | "subagent"\n')
  })

  test("keeps an enum's members in the order the schema lists them", () => {
    expect(generated).toContain('  effort?: "low" | "medium" | "high" | "xhigh" | "max"\n')
    expect(inSourceOrder('"high" | "low"', 'z.enum(["low", "high"])')).toBe('"low" | "high"')
    expect(inSourceOrder("string[]", "z.array(z.string())")).toBe("string[]")
  })
})
