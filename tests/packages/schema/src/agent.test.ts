import { describe, expect, test } from "bun:test"

import { Agent } from "../../../../packages/schema/src/agent"

const minimal = {
  description: "Builds and merges changes",
  id: "01a15d1f-2a28-7709-ab2d-b667e682dce6",
} satisfies Omit<Agent, "role">

describe("Agent", () => {
  test("parses the required fields alone, and every optional one beside them", () => {
    expect(Agent.parse(minimal)).toEqual({ ...minimal, role: "subagent" })
    const full = {
      ...minimal,
      effort: "high",
      mcpServers: ["github"],
      metadata: { color: "purple", name: "builder" },
      model: "anthropic/claude-opus-5-5",
      role: "orchestrator",
      skills: ["api-conventions"],
      tools: ["Read", "Agent(worker, researcher)"],
    } satisfies Agent
    expect(Agent.parse(full)).toEqual(full)
  })

  test("fails without any one of its required fields", () => {
    for (const key of Object.keys(minimal)) {
      const { [key as keyof typeof minimal]: _, ...rest } = minimal
      expect(Agent.safeParse(rest).success).toBe(false)
    }
  })

  test("takes an id that is a UUID version 7 and no other id", () => {
    expect(Agent.safeParse({ ...minimal, id: Bun.randomUUIDv7() }).success).toBe(true)
    for (const id of [crypto.randomUUID(), "aB3dE9fG"])
      expect(Agent.safeParse({ ...minimal, id }).success).toBe(false)
  })

  test("orders effort as a scale from low to max", () => {
    expect(Agent.shape.effort.unwrap().options).toEqual(["low", "medium", "high", "xhigh", "max"])
  })

  test("makes an agent with no role a subagent", () => {
    expect(Agent.parse(minimal).role).toBe("subagent")
  })

  test("takes one of Claude's eight colors as a label", () => {
    expect(Agent.shape.metadata.unwrap().shape.color.unwrap().options).toHaveLength(8)
    expect(Agent.safeParse({ ...minimal, metadata: { color: "magenta" } }).success).toBe(false)
  })

  test("rejects a value outside each field's set", () => {
    for (const change of [{ effort: "minimal" }, { role: "worker" }])
      expect(Agent.safeParse({ ...minimal, ...change }).success).toBe(false)
  })
})
