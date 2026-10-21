import { describe, expect, test } from "bun:test"

import { Session } from "../../../../packages/schema/src/session"

const minimal = {
  agentId: "01a15d1f-2a28-7709-ab2d-b667e682dce6",
  cwd: "/home/dev/zerosdk/.claude/worktrees/add-tools",
  id: "01a15d1f-2a34-7641-aa32-003fe284870e",
  status: "running",
  updatedAt: 1792573920000,
} satisfies Session

describe("Session", () => {
  test("parses the required fields alone, and every optional one beside them", () => {
    expect(Session.parse(minimal)).toEqual(minimal)
    const full = {
      ...minimal,
      metadata: {
        branch: "feat/add-tools",
        issue: { key: "ZS-12", url: "https://tracker.example.com/ZS-12" },
        pr: { number: 45, url: "https://github.com/nrjdalal/zerosdk/pull/45" },
        reason: "usage limit",
        task: "build",
        title: "Add tools",
      },
      parentId: "01a15d1f-2a2d-73cd-a39e-411bc732fb3f",
      prompt: "Add the tools an agent can use",
      resetsAt: 1792577520000,
      status: "paused",
    } satisfies Session
    expect(Session.parse(full)).toEqual(full)
  })

  test("fails without any one of its required fields", () => {
    for (const key of Object.keys(minimal)) {
      const { [key as keyof typeof minimal]: _, ...rest } = minimal
      expect(Session.safeParse(rest).success).toBe(false)
    }
  })

  test("takes ids that are UUIDs version 7 and no other id", () => {
    for (const key of ["agentId", "id", "parentId"])
      for (const id of [crypto.randomUUID(), "aB3dE9fG"])
        expect(Session.safeParse({ ...minimal, [key]: id }).success).toBe(false)
  })

  test("lists the statuses A to Z", () => {
    expect(Session.shape.status.options).toEqual(Session.shape.status.options.toSorted())
  })

  test("takes as a task only one of the thirteen kinds", () => {
    expect(Session.shape.metadata.unwrap().shape.task.unwrap().options).toHaveLength(13)
    expect(Session.safeParse({ ...minimal, metadata: { task: "triage" } }).success).toBe(false)
  })

  test("needs an issue's key and link, and a pull request's number and link, together", () => {
    for (const metadata of [
      { issue: { key: "ZS-12" } },
      { issue: { url: "https://tracker.example.com/ZS-12" } },
      { pr: { number: 45 } },
      { pr: { number: 45, url: "not a link" } },
    ])
      expect(Session.safeParse({ ...minimal, metadata }).success).toBe(false)
  })
})
