import { describe, expect, test } from "bun:test"

import { Message } from "../../../../packages/schema/src/message"

const minimal = {
  content: { message: { content: "Fix login", role: "user" }, type: "user" },
  id: "01a15e51-fa00-7000-8000-000000000001",
  sessionId: "01a15e51-f987-775c-99f8-c0c2cdcddaaf",
  sessionSeq: 41,
  type: "user",
}

// Each parsed message is read as unknown: tsrs cannot instantiate the type Zod infers for z.json() (TS5115, "appear infinitely circular").
describe("Message", () => {
  test("parses the required fields alone, and every optional one beside them", () => {
    expect<unknown>(Message.parse(minimal)).toEqual(minimal)
    const full = {
      ...minimal,
      subpath: "subagents/agent-7c",
      threadId: "01a15e51-fa00-7000-8000-0000000000a1",
      threadSeq: 0,
    }
    expect<unknown>(Message.parse(full)).toEqual(full)
  })

  test("fails without any one of its required fields", () => {
    for (const key of Object.keys(minimal)) {
      const { [key as keyof typeof minimal]: _, ...rest } = minimal
      expect(Message.safeParse(rest).success).toBe(false)
    }
  })

  test("keeps a harness line as it was written, whatever its shape", () => {
    const line = { parentUuid: null, toolUseResult: { stdout: "ok" }, type: "pr-link", uuid: "a1" }
    const message = { ...minimal, content: line, type: "pr-link" }
    expect<unknown>(Message.parse(message)).toEqual(message)
  })

  test("takes ids that are UUIDs version 7 and no other id", () => {
    for (const key of ["id", "sessionId", "threadId"])
      for (const id of [crypto.randomUUID(), "aB3dE9fG"])
        expect(Message.safeParse({ ...minimal, [key]: id }).success).toBe(false)
  })

  test("orders messages by whole positions only", () => {
    for (const change of [{ sessionSeq: 1.5 }, { threadSeq: 0.5 }])
      expect(Message.safeParse({ ...minimal, ...change }).success).toBe(false)
  })
})
