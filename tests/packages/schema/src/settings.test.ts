import { describe, expect, test } from "bun:test"

import { Settings } from "../../../../packages/schema/src/settings"

const defaults = {
  bridge: "herdr",
  harness: "claude-code",
  notifications: true,
  permissionFlipper: "ask",
  theme: "system",
} satisfies Settings

describe("Settings", () => {
  test("fills in each default when nothing is saved, and leaves the rest out", () => {
    expect(Settings.parse({})).toEqual(defaults)
  })

  test("keeps every choice that is saved", () => {
    const saved = {
      ...defaults,
      effort: "high",
      model: "anthropic/claude-opus-5-5",
      notifications: false,
      permissionFlipper: "allow-all",
      theme: "dark",
    } satisfies Settings
    expect(Settings.parse(saved)).toEqual(saved)
  })

  test("lists each choice's values, the scales in their order", () => {
    expect(Settings.shape.bridge.unwrap().options).toEqual(["herdr"])
    expect(Settings.shape.effort.unwrap().options).toEqual([
      "low",
      "medium",
      "high",
      "xhigh",
      "max",
    ])
    expect(Settings.shape.harness.unwrap().options).toEqual(["claude-code"])
    expect(Settings.shape.permissionFlipper.unwrap().options).toEqual(["ask", "rules", "allow-all"])
    expect(Settings.shape.theme.unwrap().options).toEqual(["dark", "light", "system"])
  })

  test("takes only the values each choice lists", () => {
    for (const change of [
      { bridge: "cmux" },
      { effort: "extreme" },
      { harness: "codex" },
      { model: 5 },
      { notifications: "on" },
      { permissionFlipper: "permissive" },
      { theme: "auto" },
    ])
      expect(Settings.safeParse(change).success).toBe(false)
  })
})
