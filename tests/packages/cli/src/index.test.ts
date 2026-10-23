import { afterEach, beforeEach, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import pkg from "../../../../packages/cli/package.json" with { type: "json" }
import { runCli } from "../run"

let HOME: string

beforeEach(() => {
  HOME = mkdtempSync(join(tmpdir(), "zerosdk-cli-"))
})
afterEach(() => {
  rmSync(HOME, { force: true, recursive: true })
})

test("--help lists the setup and doctor", () => {
  const { status, stdout } = runCli(["--help"], { HOME })
  expect(status).toBe(0)
  expect(stdout).toContain("$ zerosdk           Set up zerosdk itself, then what ZeroSDK runs on")
  expect(stdout).toContain(
    "$ zerosdk doctor    Check what ZeroSDK runs on, without changing anything",
  )
})

test("--help names the package through the package runner that launched it", () => {
  const { stdout } = runCli(["--help"], {
    HOME,
    npm_config_user_agent: "npm/11.11.0 node/v24.14.1",
  })
  expect(stdout).toContain("$ npx zerosdk-dev           Set up zerosdk itself")
  expect(stdout).toContain("$ npx zerosdk-dev doctor    Check what ZeroSDK runs on")
  const column = (text: string) =>
    stdout
      .split("\n")
      .find((line) => line.includes(text))
      ?.indexOf(text)
  expect(column("Display version")).toBe(column("Set up zerosdk itself"))
})

test("--version prints the package's name and version", () => {
  const { status, stdout } = runCli(["--version"], { HOME })
  expect(status).toBe(0)
  expect(stdout.trim()).toBe(`${pkg.name}@${pkg.version}`)
})

test("an unknown command fails with the help", () => {
  const { status, stderr, stdout } = runCli(["init"], { HOME })
  expect(status).toBe(1)
  expect(stderr).toContain("Unknown command: init")
  expect(stdout).toContain("$ zerosdk doctor")
})
