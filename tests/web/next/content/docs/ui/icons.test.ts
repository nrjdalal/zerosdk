import { describe, expect, test } from "bun:test"
import { join } from "node:path"

import { Agent } from "../../../../../../packages/schema/dist/agent.mjs"

const page = await Bun.file(
  join(import.meta.dir, "../../../../../../web/next/content/docs/ui/icons.mdx"),
).text()

// Each section's table rows, past the header and divider, as trimmed cells, keyed by the section's heading.
const tables = Object.fromEntries(
  page
    .split(/^## /m)
    .slice(1)
    .map((section) => [
      section.slice(0, section.indexOf("\n")),
      section
        .split("\n")
        .filter((line) => line.startsWith("|"))
        .slice(2)
        .map((line) =>
          line
            .split("|")
            .slice(1, -1)
            .map((cell) => cell.trim()),
        ),
    ]),
)

describe("Icons", () => {
  test("draws every effort level, in the schema's order", () => {
    expect(tables.Effort?.map(([level]) => level)).toEqual(Agent.shape.effort.unwrap().options)
  })

  test("orders its sections A to Z", () => {
    const sections = Object.keys(tables)
    expect(sections).toEqual([...sections].sort())
  })

  test("lists the states and the tasks A to Z", () => {
    for (const section of ["State", "Task"]) {
      const values = tables[section]?.map(([value]) => value) ?? []
      expect(values.length).toBeGreaterThan(0)
      expect(values).toEqual([...values].sort())
    }
  })

  test("names the component each icon draws, always a Fill variant", () => {
    for (const [, icon, component] of Object.values(tables).flat()) {
      const name = component?.replaceAll("`", "")
      expect(icon?.match(/^<(\w+)[\s/]/)?.[1]).toBe(name)
      expect(name).toEndWith("Fill")
    }
  })
})
