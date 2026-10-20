import { describe, expect, test } from "bun:test"
import { join } from "node:path"

import * as icons from "../../../../../../web/next/src/components/agents/icons"
import * as logos from "../../../../../../web/next/src/components/common/provider-logos"

// @remixicon/react is a dependency of web/next, not of the root, so it resolves from there
const web = join(import.meta.dir, "../../../../../../web/next")
const remix = await import(Bun.resolveSync("@remixicon/react", web))
const page = await Bun.file(join(web, "content/docs/ui/icons.mdx")).text()

// Each section's rows as [value, component], keyed by the section's heading.
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
        .map((line) => {
          const cells = line.split("|").map((cell) => cell.trim())
          return [cells[1], cells[3]?.replaceAll("`", "")]
        }),
    ]),
)

const maps: Record<string, Record<string, unknown>> = {
  Effort: icons.effortIcons,
  Provider: icons.providerIcons,
  State: icons.stateIcons,
  Task: icons.taskIcons,
}

describe("agents icons", () => {
  test("hold the Icons page's values, in its order", () => {
    for (const [section, map] of Object.entries(maps))
      expect(Object.keys(map)).toEqual(tables[section]?.map(([value]) => value) ?? [])
  })

  test("draw each value with the component the Icons page names", () => {
    for (const [section, map] of Object.entries(maps))
      for (const [value, component] of tables[section] ?? [])
        expect(map[value as string]).toBe(
          remix[component as string] ?? logos[component as keyof typeof logos],
        )
  })
})
