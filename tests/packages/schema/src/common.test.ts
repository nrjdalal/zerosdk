import { describe, expect, test } from "bun:test"

import { Id } from "../../../../packages/schema/src/common"

describe("Id", () => {
  test("takes 8 letters or digits and nothing else", () => {
    expect(Id.safeParse("aB3dE9fG").success).toBe(true)
    for (const id of ["aB3dE9f", "aB3dE9fGh", "aB3-E9fG", "aB3_E9fG"])
      expect(Id.safeParse(id).success).toBe(false)
  })
})
