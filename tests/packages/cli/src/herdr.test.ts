import { afterAll, afterEach, beforeEach, describe, expect, test } from "bun:test"
import { chmodSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  HERDR_ASSETS,
  herdrAsset,
  herdrPath,
  herdrVersion,
  installHerdr,
  isPinnedHerdr,
  otherHerdrs,
  unsupportedPlatform,
} from "../../../../packages/cli/src/herdr"
import { asset, release, releaseVersion, serveRelease } from "../release"

const { server, url: releaseUrl } = serveRelease()
afterAll(() => server.stop(true))

let dir: string
let path: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "zerosdk-herdr-"))
  path = join(dir, "bin", "herdr")
})
afterEach(() => {
  rmSync(dir, { force: true, recursive: true })
})

describe("installHerdr", () => {
  test("installs the release as an executable when its SHA-256 matches", async () => {
    await installHerdr({ asset, path, releaseUrl })
    expect(await Bun.file(path).text()).toBe(release)
    expect((await Bun.file(path).stat()).mode & 0o111).not.toBe(0)
    expect(isPinnedHerdr(path, asset)).toBe(true)
    expect(herdrVersion(path)).toBe(releaseVersion)
    expect(readdirSync(join(dir, "bin"))).toEqual(["herdr"])
  })

  test("replaces a herdr that is not the pinned build", async () => {
    await Bun.write(path, "an older herdr")
    expect(isPinnedHerdr(path, asset)).toBe(false)
    await installHerdr({ asset, path, releaseUrl })
    expect(isPinnedHerdr(path, asset)).toBe(true)
  })

  test("refuses a download whose SHA-256 differs and leaves the old copy alone", async () => {
    await Bun.write(path, "an older herdr")
    const tampered = { ...asset, name: "herdr-tampered" }
    await expect(installHerdr({ asset: tampered, path, releaseUrl })).rejects.toThrow(
      "herdr-tampered does not match its pinned SHA-256, so nothing was installed",
    )
    expect(await Bun.file(path).text()).toBe("an older herdr")
    expect(readdirSync(join(dir, "bin"))).toEqual(["herdr"])
  })

  test("reports a failed download and writes nothing", async () => {
    const missing = { ...asset, name: "herdr-missing" }
    await expect(installHerdr({ asset: missing, path, releaseUrl })).rejects.toThrow(
      `Could not download ${releaseUrl}/herdr-missing: 404`,
    )
    expect(existsSync(join(dir, "bin"))).toBe(false)
  })

  test("reports a download that cannot connect", async () => {
    await expect(installHerdr({ asset, path, releaseUrl: "http://127.0.0.1:1" })).rejects.toThrow(
      "Could not download http://127.0.0.1:1/herdr-test",
    )
    expect(existsSync(join(dir, "bin"))).toBe(false)
  })
})

describe("herdrAsset", () => {
  test("pins a build for macOS and Linux on arm64 and x64, each by a SHA-256", () => {
    expect(Object.keys(HERDR_ASSETS)).toEqual([
      "darwin-arm64",
      "darwin-x64",
      "linux-arm64",
      "linux-x64",
    ])
    for (const { sha256 } of Object.values(HERDR_ASSETS)) expect(sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(herdrAsset("darwin", "arm64")?.name).toBe("herdr-macos-aarch64")
    expect(herdrAsset("linux", "x64")?.name).toBe("herdr-linux-x86_64")
  })

  test("has no build for Windows, and says so", () => {
    expect(herdrAsset("win32", "x64")).toBeUndefined()
    expect(unsupportedPlatform("win32", "x64")).toBe(
      "ZeroSDK does not install herdr on Windows x64 yet, only on macOS and Linux, arm64 and x64",
    )
    expect(unsupportedPlatform("freebsd", "x64")).toStartWith(
      "ZeroSDK does not install herdr on freebsd x64 yet",
    )
  })
})

test("herdrPath keeps ZeroSDK's copy under ~/.zerosdk/bin", () => {
  expect(herdrPath("/home/me")).toBe("/home/me/.zerosdk/bin/herdr")
})

test("otherHerdrs lists every herdr on PATH but ZeroSDK's own", async () => {
  for (const name of ["ours", "brew"]) {
    await Bun.write(join(dir, name, "herdr"), "")
    chmodSync(join(dir, name, "herdr"), 0o755)
  }
  const searchPath = [join(dir, "ours"), join(dir, "brew")].join(":")
  expect(otherHerdrs(join(dir, "ours", "herdr"), searchPath)).toEqual([join(dir, "brew", "herdr")])
})
