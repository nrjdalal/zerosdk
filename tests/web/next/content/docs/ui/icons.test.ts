import { describe, expect, test } from "bun:test"
import { join } from "node:path"

import { Agent } from "../../../../../../packages/schema/dist/agent.mjs"

const page = await Bun.file(
  join(import.meta.dir, "../../../../../../web/next/content/docs/ui/icons.mdx"),
).text()

// The Effort section's table rows, past the header and divider, as trimmed cells.
const rows = (page.split(/^## /m).find((section) => section.startsWith("Effort\n")) ?? "")
  .split("\n")
  .filter((line) => line.startsWith("|"))
  .slice(2)
  .map((line) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim()),
  )

describe("Icons", () => {
  test("draws every effort level, in the schema's order", () => {
    expect(rows.map(([level]) => level)).toEqual(Agent.shape.effort.unwrap().options)
  })

  test("names the component each effort level draws", () => {
    for (const [, icon, component] of rows)
      expect(icon).toBe(`<${component?.replaceAll("`", "")} />`)
  })
})
