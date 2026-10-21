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
      memory: "project",
      metadata: { color: "purple", name: "builder", team: "platform" },
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
    expect(Agent.safeParse({ ...minimal, effort: "minimal" }).success).toBe(false)
  })

  test("takes memory as one of Claude's three scopes", () => {
    expect(Agent.safeParse({ ...minimal, memory: "global" }).success).toBe(false)
  })

  test("makes an agent with no role a subagent, and takes only the three roles", () => {
    expect(Agent.parse(minimal).role).toBe("subagent")
    expect(Agent.safeParse({ ...minimal, role: "worker" }).success).toBe(false)
  })

  test("holds each string to its length", () => {
    for (const [key, max] of [
      ["description", 1024],
      ["model", 256],
    ] as const) {
      expect(Agent.safeParse({ ...minimal, [key]: "x".repeat(max) }).success).toBe(true)
      for (const value of ["", "x".repeat(max + 1)])
        expect(Agent.safeParse({ ...minimal, [key]: value }).success).toBe(false)
    }
  })

  test("holds each list to its count and each entry to its length", () => {
    for (const [key, count, length] of [
      ["mcpServers", 64, 64],
      ["skills", 64, 64],
      ["tools", 256, 256],
    ] as const) {
      const fits = { ...minimal, [key]: Array(count).fill("x".repeat(length)) }
      expect(Agent.safeParse(fits).success).toBe(true)
      for (const list of [[], Array(count + 1).fill("x"), [""], ["x".repeat(length + 1)]])
        expect(Agent.safeParse({ ...minimal, [key]: list }).success).toBe(false)
    }
  })

  test("takes one of Claude's eight colors, a name of 1 to 256 characters, and any other label as a string", () => {
    expect(Agent.shape.metadata.unwrap().shape.color.unwrap().options).toHaveLength(8)
    for (const metadata of [
      { color: "magenta" },
      { name: "" },
      { name: "x".repeat(257) },
      { team: 1 },
    ])
      expect(Agent.safeParse({ ...minimal, metadata }).success).toBe(false)
  })
})
