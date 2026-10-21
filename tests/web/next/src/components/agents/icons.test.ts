import { describe, expect, test } from "bun:test"
import { join } from "node:path"

import { Session } from "../../../../../../packages/schema/src/session"
import * as icons from "../../../../../../web/next/src/components/agents/icons"
import * as logos from "../../../../../../web/next/src/components/common/provider-logos"
import { tables } from "../../../content/docs/ui/icons-page"

// @remixicon/react is a dependency of web/next, not of the root, so it resolves from there
const remix = await import(
  Bun.resolveSync("@remixicon/react", join(import.meta.dir, "../../../../../../web/next"))
)

const component = (name = "") =>
  remix[name.replaceAll("`", "")] ?? logos[name.replaceAll("`", "") as keyof typeof logos]

describe("agents icons", () => {
  test("give each effort, state and task the icon the Icons page gives it, in its order", () => {
    for (const [section, map] of [
      ["Effort", icons.effortIcons],
      ["State", icons.stateIcons],
      ["Task", icons.taskIcons],
    ] as const) {
      const rows = tables[section] ?? []
      expect(Object.keys(map)).toEqual(rows.map(([value]) => value))
      for (const [value, , name] of rows)
        expect(map[value as keyof typeof map]).toBe(component(name))
    }
  })

  test("find each provider's logo from a provider/model ID", () => {
    const rows = tables.Provider ?? []
    expect(rows.length).toBeGreaterThan(0)
    for (const [provider, , name] of rows)
      expect(icons.providerIcon(`${provider}/some-model`)).toBe(component(name))
    expect(icons.providerIcon("unknown/some-model")).toBeUndefined()
  })

  test("hold an icon for each status and task a session can have", () => {
    expect(Object.keys(icons.stateIcons)).toEqual(Session.shape.status.options.toSorted())
    expect(Object.keys(icons.taskIcons)).toEqual(
      Session.shape.metadata.unwrap().shape.task.unwrap().options,
    )
  })
})
