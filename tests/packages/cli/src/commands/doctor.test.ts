import { afterEach, beforeEach, expect, test } from "bun:test"
import { chmodSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import pkg from "../../../../../packages/cli/package.json" with { type: "json" }
import { doctor } from "../../../../../packages/cli/src/commands/doctor"
import { HERDR_VERSION } from "../../../../../packages/cli/src/herdr"
import { asset, release, releaseVersion } from "../../release"
import { captureStdout, runCli, withPath, writeScript } from "../../run"

let HOME: string

// The flow as it prints off a TTY: no colors, the gutter between the intro and the outro.
const flow = (...lines: string[]) =>
  ["", "  ┌  https://zerosdk.dev", "  │", ...lines.slice(0, -1), "  │", lines.at(-1), ""].join("\n")

beforeEach(() => {
  HOME = mkdtempSync(join(tmpdir(), "zerosdk-doctor-"))
})
afterEach(() => {
  rmSync(HOME, { force: true, recursive: true })
})

test("reports zerosdk and herdr missing and exits 1", () => {
  const { status, stdout } = runCli(["doctor"], { HOME })
  expect(status).toBe(1)
  expect(stdout).toBe(
    flow(
      "  ▲  The shell does not find zerosdk",
      "  │  Add your package manager's global bin folder to PATH, or run npx zerosdk-dev",
      `  ▲  herdr ${HERDR_VERSION} is not installed at ~/.zerosdk/bin/herdr`,
      "  │  To install it, run npx zerosdk-dev",
      "  └  2 checks failed",
    ),
  )
})

test("names the fix through the package runner the human used", () => {
  const { stdout } = runCli(["doctor"], { HOME, npm_config_user_agent: "bun/1.4.3 npm/?" })
  expect(stdout).toContain("  │  To install it, run bunx zerosdk-dev\n")
  expect(stdout).toContain(
    "  │  Add your package manager's global bin folder to PATH, or run bunx zerosdk-dev\n",
  )
})

test("finds the installed zerosdk on PATH, and names it as the fix from then on", async () => {
  await writeScript(join(HOME, "global", "zerosdk"), `echo ${pkg.name}@1.2.3`)
  const { status, stdout } = runCli(["doctor"], { HOME, PATH: join(HOME, "global") })
  expect(status).toBe(1)
  expect(stdout).toBe(
    flow(
      "  ◆  zerosdk 1.2.3 at ~/global/zerosdk",
      `  ▲  herdr ${HERDR_VERSION} is not installed at ~/.zerosdk/bin/herdr`,
      "  │  To install it, run zerosdk",
      "  └  1 check failed",
    ),
  )
})

test("counts the global zerosdk as installed when npx runs it, after npx's own copy on PATH", async () => {
  await writeScript(join(HOME, "npx", "node_modules", ".bin", "zerosdk"), `echo ${pkg.name}@0.0.0`)
  await writeScript(join(HOME, "global", "zerosdk"), `echo ${pkg.name}@${pkg.version}`)
  const { stdout } = runCli(["doctor"], {
    HOME,
    npm_config_user_agent: "npm/11.11.0 node/v24.14.1",
    PATH: [join(HOME, "npx", "node_modules", ".bin"), join(HOME, "global")].join(":"),
  })
  expect(stdout).toContain(`  ◆  zerosdk ${pkg.version} at ~/global/zerosdk\n`)
  expect(stdout).toContain("  │  To install it, run zerosdk\n")
})

test("under a package runner, fails an installed zerosdk at another version, as the setup would replace it", async () => {
  await writeScript(join(HOME, "global", "zerosdk"), `echo ${pkg.name}@1.2.3`)
  const { stdout } = runCli(["doctor"], {
    HOME,
    npm_config_user_agent: "npm/11.11.0 node/v24.14.1",
    PATH: join(HOME, "global"),
  })
  expect(stdout).toContain(`  ▲  zerosdk 1.2.3 is installed, not ${pkg.version}\n`)
  expect(stdout).toContain(`  │  To install ${pkg.version}, run npx ${pkg.name}@${pkg.version}\n`)
  expect(stdout).toContain(`  │  To install it, run npx ${pkg.name}@${pkg.version}\n`)
})

test("reports a herdr in ZeroSDK's folder that is not the pinned build", async () => {
  await Bun.write(join(HOME, ".zerosdk", "bin", "herdr"), "#!/bin/sh\necho herdr 0.9.4\n")
  const { stdout } = runCli(["doctor"], { HOME })
  expect(stdout).toContain(`  ▲  ~/.zerosdk/bin/herdr is not the pinned herdr ${HERDR_VERSION}\n`)
  expect(stdout).toContain("  │  To replace it, run npx zerosdk-dev\n")
})

test("names the user's own herdr on PATH but never runs it", async () => {
  const ran = join(HOME, "ran")
  await writeScript(join(HOME, "bin", "herdr"), `touch ${ran}`)
  const { stdout } = runCli(["doctor"], { HOME, PATH: join(HOME, "bin") })
  expect(stdout).toContain(
    "  │  Your own herdr at ~/bin/herdr is left alone: ZeroSDK runs only its own copy\n",
  )
  expect(await Bun.file(ran).exists()).toBe(false)
})

test("passes once zerosdk is installed and the pinned herdr is in place", async () => {
  const path = join(HOME, "bin", "herdr")
  await Bun.write(path, release)
  chmodSync(path, 0o755)
  await writeScript(join(HOME, "global", "zerosdk"), `echo ${pkg.name}@1.2.3`)
  const out = await withPath([join(HOME, "global")], () =>
    captureStdout(() => doctor({ asset, path, runner: "unknown" })),
  )
  expect(out).toContain(`◆  zerosdk 1.2.3 at ${join(HOME, "global", "zerosdk")}\n`)
  expect(out).toContain(`◆  ${releaseVersion} at ${path}\n`)
  expect(out).toContain("└  Every check passed\n")
})
