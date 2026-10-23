import { afterEach, beforeEach, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import pkg from "../../../../packages/cli/package.json" with { type: "json" }
import {
  installedZerosdk,
  installError,
  installZerosdk,
  isCurrentZerosdk,
  setupCommand,
} from "../../../../packages/cli/src/zerosdk"
import { withPath, writeScript } from "../run"

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "zerosdk-self-"))
})
afterEach(() => {
  rmSync(dir, { force: true, recursive: true })
})

test("installedZerosdk skips the copies in a node_modules/.bin, where npx and bunx put theirs", async () => {
  const npx = join(dir, "_npx", "1a2b", "node_modules", ".bin")
  await writeScript(join(npx, "zerosdk"), `echo ${pkg.name}@0.0.0`)
  await writeScript(join(dir, "global", "zerosdk"), `echo ${pkg.name}@1.2.3`)
  expect(installedZerosdk([npx, join(dir, "global")].join(":"))).toEqual({
    path: join(dir, "global", "zerosdk"),
    version: "1.2.3",
  })
  expect(installedZerosdk(npx)).toBeUndefined()
})

test("installedZerosdk skips the xfs- folder yarn dlx puts its copy in", async () => {
  const yarn = join(dir, "xfs-7c1e")
  await writeScript(join(yarn, "zerosdk"), `echo ${pkg.name}@0.0.0`)
  await writeScript(join(dir, "global", "zerosdk"), `echo ${pkg.name}@1.2.3`)
  expect(installedZerosdk([yarn, join(dir, "global")].join(":"))?.version).toBe("1.2.3")
  expect(installedZerosdk(yarn)).toBeUndefined()
})

test("installedZerosdk asks only the zerosdk the shell runs, and is not fooled by another tool", async () => {
  const ran = join(dir, "second-ran")
  await writeScript(join(dir, "other", "zerosdk"), "echo something-else@9.9.9")
  await writeScript(join(dir, "global", "zerosdk"), `touch ${ran}\necho ${pkg.name}@1.2.3`)
  expect(installedZerosdk([join(dir, "other"), join(dir, "global")].join(":"))).toBeUndefined()
  expect(await Bun.file(ran).exists()).toBe(false)
})

test("installZerosdk runs the install command it is given", async () => {
  const log = join(dir, "log")
  await writeScript(join(dir, "tools", "npm"), `echo "$@" > ${log}`)
  await withPath([join(dir, "tools")], () => installZerosdk(["npm", "install", "--global", "x@1"]))
  expect(await Bun.file(log).text()).toBe("install --global x@1\n")
})

test("installError finds what went wrong where each package manager writes it", () => {
  const failed = (stderr: string, stdout = "") => ({
    message: "Command failed: x\n",
    stderr,
    stdout,
  })
  expect(installError(failed("npm error code EACCES\nnpm error A complete log of this run"))).toBe(
    "npm error code EACCES",
  )
  expect(
    installError(failed("bun add v1.4.3\nResolving dependencies\nerror: GET https://x - 404")),
  ).toBe("error: GET https://x - 404")
  expect(
    installError(
      failed("", " ERR_PNPM_NO_GLOBAL_BIN_DIR  Unable to find the global bin directory"),
    ),
  ).toBe("ERR_PNPM_NO_GLOBAL_BIN_DIR  Unable to find the global bin directory")
  expect(installError(failed(""))).toBe("Command failed: x")
})

test("setupCommand names zerosdk when it is current, else this version or the package through the runner", () => {
  const current = { path: "/g/zerosdk", version: pkg.version }
  const other = { path: "/g/zerosdk", version: "1.2.3" }
  expect(isCurrentZerosdk(current, "npx")).toBe(true)
  expect(isCurrentZerosdk(other, "npx")).toBe(false)
  expect(isCurrentZerosdk(other, "unknown")).toBe(true)
  expect(isCurrentZerosdk(undefined, "unknown")).toBe(false)
  expect(setupCommand(current, "npx")).toBe("zerosdk")
  expect(setupCommand(other, "unknown")).toBe("zerosdk")
  expect(setupCommand(other, "bunx")).toBe(`bunx ${pkg.name}@${pkg.version}`)
  expect(setupCommand(undefined, "npx")).toBe(`npx ${pkg.name}`)
  expect(setupCommand(undefined, "unknown")).toBe(`npx ${pkg.name}`)
})
