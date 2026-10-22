import { describe, expect, test } from "bun:test"

import { Thread } from "../../../../packages/schema/src/thread"

const minimal = {
  id: "01a15e51-fa00-7000-8000-0000000000a1",
  title: "Fix login",
} satisfies Thread

describe("Thread", () => {
  test("parses the required fields alone, and every optional one beside them", () => {
    expect(Thread.parse(minimal)).toEqual(minimal)
    const full = {
      ...minimal,
      archivedAt: 1792577520000,
      lastReadAt: 1792573920000,
      pinnedAt: 1792570320000,
    } satisfies Thread
    expect(Thread.parse(full)).toEqual(full)
  })

  test("fails without any one of its required fields", () => {
    for (const key of Object.keys(minimal)) {
      const { [key as keyof typeof minimal]: _, ...rest } = minimal
      expect(Thread.safeParse(rest).success).toBe(false)
    }
  })

  test("takes an id that is a UUID version 7 and no other id", () => {
    for (const id of [crypto.randomUUID(), "aB3dE9fG"])
      expect(Thread.safeParse({ ...minimal, id }).success).toBe(false)
  })

  test("keeps its times in whole milliseconds", () => {
    for (const key of ["archivedAt", "lastReadAt", "pinnedAt"])
      for (const time of ["2026-10-22", 1792573920000.5])
        expect(Thread.safeParse({ ...minimal, [key]: time }).success).toBe(false)
  })
})
