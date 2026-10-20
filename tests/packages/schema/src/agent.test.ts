import { describe, expect, test } from "bun:test"

import { Agent } from "../../../../packages/schema/src/agent"

const minimal = {
  id: "aB3dE9",
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
      fallbacks: ["gH7kL2"],
      instructions: "Build the requested change, run the tests and open a pull request",
      mcpServers: ["github"],
      memory: "project",
      metadata: { team: "platform" },
      model: "anthropic/claude-opus-5-5",
      role: "orchestrator",
      skills: ["api-conventions"],
    } satisfies Agent
    expect(Agent.parse(full)).toEqual(full)
  })

  test("rejects an id that is not 6 letters or digits, in id and in fallbacks", () => {
    for (const id of ["aB3dE", "aB3dE9x", "aB3-E9"]) {
      expect(Agent.safeParse({ ...minimal, id }).success).toBe(false)
      expect(Agent.safeParse({ ...minimal, fallbacks: [id] }).success).toBe(false)
    }
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
