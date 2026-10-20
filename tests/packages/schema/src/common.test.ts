import { describe, expect, test } from "bun:test"

import { Color, Effort, Memory, Role } from "../../../../packages/schema/src/common"

describe("Color", () => {
  test("takes every Tailwind color and nothing else", () => {
    expect(Color.options).toHaveLength(26)
    expect(Color.safeParse("violet").success).toBe(true)
    expect(Color.safeParse("magenta").success).toBe(false)
  })
})

describe("Effort, Memory and Role", () => {
  test("hold their values, effort as a scale from low to max", () => {
    expect(Effort.options).toEqual(["low", "medium", "high", "xhigh", "max"])
    expect(Memory.options).toEqual(["local", "project", "user"])
    expect(Role.options).toEqual(["main", "orchestrator", "subagent"])
  })
})
