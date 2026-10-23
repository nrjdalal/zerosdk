import { afterEach, beforeEach, expect, test } from "bun:test"
import { chmodSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { which } from "../../../../packages/cli/src/which"

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "zerosdk-which-"))
})
afterEach(() => {
  rmSync(dir, { force: true, recursive: true })
})

test("which lists each executable match on PATH once, in PATH order", async () => {
  for (const [name, mode] of [
    ["b", 0o755],
    ["a", 0o755],
    ["plain", 0o644],
  ] as const) {
    await Bun.write(join(dir, name, "tool"), "")
    chmodSync(join(dir, name, "tool"), mode)
  }
  const searchPath = ["b", "missing", "a", "plain", "b"].map((name) => join(dir, name)).join(":")
  expect(which("tool", searchPath)).toEqual([join(dir, "b", "tool"), join(dir, "a", "tool")])
  expect(which("absent", searchPath)).toEqual([])
})
