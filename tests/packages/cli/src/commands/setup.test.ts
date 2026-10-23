import { afterAll, afterEach, beforeEach, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import pkg from "../../../../../packages/cli/package.json" with { type: "json" }
import { setup } from "../../../../../packages/cli/src/commands/setup"
import { HERDR_VERSION } from "../../../../../packages/cli/src/herdr"
import { asset, releaseVersion, serveRelease } from "../../release"
import { captureStdout, withPath, writeScript } from "../../run"

const { requests, server, url: releaseUrl } = serveRelease()
afterAll(() => server.stop(true))

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "zerosdk-setup-"))
  requests.length = 0
})
afterEach(() => {
  rmSync(dir, { force: true, recursive: true })
})

test("installs herdr, then skips it once the pinned build is in place", async () => {
  const path = join(dir, "bin", "herdr")
  const run = () =>
    withPath([], () => captureStdout(() => setup({ asset, path, releaseUrl, runner: "unknown" })))
  const first = await run()
  expect(first).toContain(`◆  Downloaded herdr ${HERDR_VERSION} and matched its pinned SHA-256\n`)
  expect(first).toContain(`◆  Installed ${releaseVersion} at ${path}\n`)
  expect(first).toEndWith("└  Check it any time with npx zerosdk-dev doctor\n")
  expect(await run()).toBe(
    `  ◆  herdr ${HERDR_VERSION} is already installed at ${path}\n  │\n  └  Nothing to do\n`,
  )
  expect(requests).toEqual(["/herdr-test"])
})

test("under npx, installs zerosdk globally with npm first, then skips it once it is on PATH", async () => {
  const path = join(dir, "herdr", "herdr")
  const global = join(dir, "global")
  const npmLog = join(dir, "npm.log")
  await writeScript(
    join(dir, "tools", "npm"),
    `echo "$@" >> ${npmLog}\nmkdir -p ${global}\nprintf '#!/bin/sh\\necho ${pkg.name}@${pkg.version}\\n' > ${global}/zerosdk\nchmod +x ${global}/zerosdk`,
  )
  const run = () =>
    withPath([join(dir, "tools"), global], () =>
      captureStdout(() => setup({ asset, path, releaseUrl, runner: "npx" })),
    )
  const first = await run()
  expect(await Bun.file(npmLog).text()).toBe(`install --global ${pkg.name}@${pkg.version}\n`)
  expect(first).toContain(`◆  Installed zerosdk ${pkg.version} with npm\n`)
  expect(first).toContain(`◆  From now on, just run zerosdk (${join(global, "zerosdk")})\n`)
  expect(first).toContain(`◆  Installed ${releaseVersion} at ${path}\n`)
  const second = await run()
  expect(second).toBe(
    [
      `  ◆  zerosdk ${pkg.version} is already installed at ${join(global, "zerosdk")}`,
      `  ◆  herdr ${HERDR_VERSION} is already installed at ${path}`,
      "  │",
      "  └  Nothing to do",
      "",
    ].join("\n"),
  )
  expect(await Bun.file(npmLog).text()).toBe(`install --global ${pkg.name}@${pkg.version}\n`)
})

test("run as the installed zerosdk, says it is in place and installs nothing", async () => {
  const global = join(dir, "global")
  await writeScript(join(global, "zerosdk"), `echo ${pkg.name}@${pkg.version}`)
  await writeScript(join(dir, "tools", "npm"), `touch ${join(dir, "npm-ran")}`)
  const out = await withPath([join(dir, "tools"), global], () =>
    captureStdout(() =>
      setup({ asset, path: join(dir, "herdr", "herdr"), releaseUrl, runner: "unknown" }),
    ),
  )
  expect(out).toStartWith(
    `  ◆  zerosdk ${pkg.version} is already installed at ${join(global, "zerosdk")}\n`,
  )
  expect(out).toEndWith("└  Check it any time with zerosdk doctor\n")
  expect(await Bun.file(join(dir, "npm-ran")).exists()).toBe(false)
})

test("says so when the global install leaves zerosdk off PATH", async () => {
  await writeScript(join(dir, "tools", "npm"), "exit 0")
  const out = await withPath([join(dir, "tools")], () =>
    captureStdout(() =>
      setup({ asset, path: join(dir, "herdr", "herdr"), releaseUrl, runner: "npx" }),
    ),
  )
  expect(out).toContain(`▲  The shell does not find zerosdk ${pkg.version} on PATH yet\n`)
  expect(out).toContain("│  Add npm's global bin folder to PATH, then run zerosdk\n")
  expect(out).toEndWith("└  Check it any time with npx zerosdk-dev doctor\n")
})

test("says which zerosdk runs first when an older one from another manager shadows the new one", async () => {
  const old = join(dir, "old")
  await writeScript(join(old, "zerosdk"), `echo ${pkg.name}@1.2.3`)
  await writeScript(join(dir, "tools", "bun"), "exit 0")
  const out = await withPath([old, join(dir, "tools")], () =>
    captureStdout(() =>
      setup({ asset, path: join(dir, "herdr", "herdr"), releaseUrl, runner: "bunx" }),
    ),
  )
  expect(out).toContain(
    `▲  zerosdk 1.2.3 at ${join(old, "zerosdk")} runs before the one just installed\n`,
  )
  expect(out).toContain("│  Remove it, or put bun's global bin folder before it on PATH\n")
  expect(out).toEndWith(`└  Check it any time with bunx ${pkg.name}@${pkg.version} doctor\n`)
})

test("reports a failed install of zerosdk and still sets up herdr", async () => {
  const path = join(dir, "herdr", "herdr")
  await writeScript(join(dir, "tools", "npm"), "echo 'npm error code EACCES' >&2\nexit 243")
  try {
    const out = await withPath([join(dir, "tools")], () =>
      captureStdout(() => setup({ asset, path, releaseUrl, runner: "npx" })),
    )
    expect(out).toContain(`▲  Could not install zerosdk ${pkg.version}: npm error code EACCES\n`)
    expect(out).toContain(`│  To try again, run npm install --global ${pkg.name}@${pkg.version}\n`)
    expect(out).toContain(`◆  Installed ${releaseVersion} at ${path}\n`)
    expect(out).toEndWith("└  1 step failed\n")
    expect(process.exitCode).toBe(1)
  } finally {
    process.exitCode = 0
  }
})

test("reports bun's and pnpm's install errors, which they write after progress or to stdout", async () => {
  await writeScript(
    join(dir, "tools", "bun"),
    "echo 'bun add v1.4.3' >&2\necho 'Resolving dependencies' >&2\necho 'error: GET https://x - 404' >&2\nexit 1",
  )
  await writeScript(
    join(dir, "tools", "pnpm"),
    "echo ' ERR_PNPM_NO_GLOBAL_BIN_DIR  Unable to find the global bin directory'\nexit 1",
  )
  try {
    for (const [runner, error] of [
      ["bunx", "error: GET https://x - 404"],
      ["pnpm dlx", "ERR_PNPM_NO_GLOBAL_BIN_DIR  Unable to find the global bin directory"],
    ] as const) {
      const out = await withPath([join(dir, "tools")], () =>
        captureStdout(() =>
          setup({ asset, path: join(dir, "herdr", "herdr"), releaseUrl, runner }),
        ),
      )
      expect(out).toContain(`▲  Could not install zerosdk ${pkg.version}: ${error}\n`)
    }
  } finally {
    process.exitCode = 0
  }
})

test("stops at a download that does not match, before writing anything", async () => {
  const path = join(dir, "bin", "herdr")
  await expect(
    withPath([], () =>
      captureStdout(() =>
        setup({ asset: { ...asset, name: "herdr-tampered" }, path, releaseUrl, runner: "unknown" }),
      ),
    ),
  ).rejects.toThrow("does not match its pinned SHA-256")
  expect(await Bun.file(path).exists()).toBe(false)
})
