import { describe, expect, test } from "bun:test"
import { join } from "node:path"

import { Agent } from "../../../../../../packages/schema/dist/agent.mjs"
import * as logos from "../../../../../../web/next/src/components/common/provider-logos"

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

  test("draws every provider's logo A to Z, with the component named after it", () => {
    const rows = tables.Provider ?? []
    const providers = rows.map(([provider]) => provider)
    expect(providers).toEqual([...providers].sort())
    expect(rows.map(([, , component]) => component?.replaceAll("`", "")).sort()).toEqual(
      Object.keys(logos).sort(),
    )
    for (const [provider, , component] of rows)
      expect(component?.replaceAll("`", "").toLowerCase()).toBe(provider?.replaceAll(/[-.]/g, ""))
  })

  test("names the component each icon draws, always a Fill variant outside the provider logos", () => {
    for (const [section, rows] of Object.entries(tables))
      for (const [, icon, component] of rows) {
        const name = component?.replaceAll("`", "")
        expect(icon?.match(/^<(\w+)[\s/]/)?.[1]).toBe(name)
        if (section !== "Provider") expect(name).toEndWith("Fill")
      }
  })
})
