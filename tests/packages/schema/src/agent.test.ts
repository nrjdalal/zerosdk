import { describe, expect, test } from "bun:test"

import { Agent } from "../../../../packages/schema/src/agent"

const minimal = {
  id: "aB3dE9fG",
  name: "builder",
} satisfies Omit<Agent, "role">

describe("Agent", () => {
  test("parses the required fields alone, as a subagent", () => {
    expect(Agent.parse(minimal)).toEqual({ ...minimal, role: "subagent" })
  })

  test("parses every optional field", () => {
    const full = {
      ...minimal,
      color: "purple",
      description: "Builds and merges changes",
      effort: "xhigh",
      fallbacks: ["gH7kL2mN"],
      instructions: "Build the requested change, run the tests and open a pull request",
      mcpServers: ["github"],
      memory: "project",
      metadata: { team: "platform" },
      model: "anthropic/claude-opus-5-5",
      role: "orchestrator",
      skills: ["api-conventions"],
      tools: ["Read"],
    } satisfies Agent
    expect(Agent.parse(full)).toEqual(full)
  })

  test("checks id and fallbacks against the Id rule", () => {
    expect(Agent.safeParse({ ...minimal, id: "aB3-E9fG" }).success).toBe(false)
    expect(Agent.safeParse({ ...minimal, fallbacks: ["aB3-E9fG"] }).success).toBe(false)
  })

  test("holds every Tailwind color", () => {
    expect(Agent.shape.color.unwrap().options).toHaveLength(26)
  })

  test("orders effort as a scale from low to max", () => {
    expect(Agent.shape.effort.unwrap().options).toEqual(["low", "medium", "high", "xhigh", "max"])
  })

  test("rejects a model without both its provider and its model id", () => {
    for (const model of ["claude-opus-5-5", "/", "anthropic/", "/claude-opus-5-5"])
      expect(Agent.safeParse({ ...minimal, model }).success).toBe(false)
  })

  test("rejects a value outside each field's set", () => {
    for (const change of [
      { color: "magenta" },
      { effort: "minimal" },
      { memory: "global" },
      { metadata: { team: 1 } },
      { role: "worker" },
    ])
      expect(Agent.safeParse({ ...minimal, ...change }).success).toBe(false)
  })
})
