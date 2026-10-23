import { describe, expect, test } from "bun:test"

import { Settings } from "../../../../packages/schema/src/settings"

const defaults = {
  bridge: "herdr",
  harness: "claude-code",
  notifications: true,
  permissionMode: "bypassPermissions",
  theme: "system",
} satisfies Settings

describe("Settings", () => {
  test("fills in each default when nothing is saved", () => {
    expect(Settings.parse({})).toEqual(defaults)
  })

  test("keeps every choice that is saved", () => {
    const saved = {
      ...defaults,
      notifications: false,
      permissionMode: "default",
      theme: "dark",
    } satisfies Settings
    expect(Settings.parse(saved)).toEqual(saved)
  })

  test("lists each choice's values", () => {
    expect(Settings.shape.bridge.unwrap().options).toEqual(["herdr"])
    expect(Settings.shape.harness.unwrap().options).toEqual(["claude-code"])
    expect(Settings.shape.permissionMode.unwrap().options).toEqual([
      "acceptEdits",
      "auto",
      "bypassPermissions",
      "default",
      "dontAsk",
      "plan",
    ])
    expect(Settings.shape.theme.unwrap().options).toEqual(["dark", "light", "system"])
  })

  test("takes only the values each choice lists", () => {
    for (const change of [
      { bridge: "cmux" },
      { harness: "codex" },
      { notifications: "on" },
      { permissionMode: "allow-all" },
      { theme: "auto" },
    ])
      expect(Settings.safeParse(change).success).toBe(false)
  })
})
