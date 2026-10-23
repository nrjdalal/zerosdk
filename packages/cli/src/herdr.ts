import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"

import { which } from "@/which"

export const HERDR_VERSION = "0.9.5"

const HERDR_RELEASE_URL = `https://github.com/herdrdev/herdr/releases/download/v${HERDR_VERSION}`

export type HerdrAsset = { name: string; sha256: string }

// Keyed by Node's `${process.platform}-${process.arch}`; each hash is GitHub's digest of that release asset. herdr's Windows build is a zip, which ZeroSDK does not install yet.
export const HERDR_ASSETS: Record<string, HerdrAsset> = {
  "darwin-arm64": {
    name: "herdr-macos-aarch64",
    sha256: "fb77c2232a05a8035421382c894392f4174e4e38a18e48af3dd0290157c3a7e2",
  },
  "darwin-x64": {
    name: "herdr-macos-x86_64",
    sha256: "5fb0a908ec7f6745e3e245738b06bfad56c46391c391ab3c0955fbead01f1369",
  },
  "linux-arm64": {
    name: "herdr-linux-aarch64",
    sha256: "17d7536f2da50859523680ef279dffcac8e4a235f4e46fe8da6c2ec44141897c",
  },
  "linux-x64": {
    name: "herdr-linux-x86_64",
    sha256: "14d9e8bc8b4a9e0118d77c32266f76d461f09b40342eb23752960bd89f59929d",
  },
}

export const herdrAsset = (
  platform: string = process.platform,
  arch: string = process.arch,
): HerdrAsset | undefined => HERDR_ASSETS[`${platform}-${arch}`]

const OS_NAMES: Partial<Record<string, string>> = {
  darwin: "macOS",
  linux: "Linux",
  win32: "Windows",
}

export const unsupportedPlatform = (
  platform: string = process.platform,
  arch: string = process.arch,
) =>
  `ZeroSDK does not install herdr on ${OS_NAMES[platform] ?? platform} ${arch} yet, only on macOS and Linux, arm64 and x64`

// ZeroSDK's own copy, always run by this full path and never put on PATH.
export const herdrPath = (home = homedir()) => join(home, ".zerosdk", "bin", "herdr")

const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex")

export const isPinnedHerdr = (path: string, asset: HerdrAsset) =>
  existsSync(path) && sha256(readFileSync(path)) === asset.sha256

export const herdrVersion = (path: string) =>
  execFileSync(path, ["--version"], { encoding: "utf8" }).trim()

export const installHerdr = async ({
  asset,
  path,
  releaseUrl = HERDR_RELEASE_URL,
}: {
  asset: HerdrAsset
  path: string
  releaseUrl?: string
}) => {
  const source = `${releaseUrl}/${asset.name}`
  const response = await fetch(source).catch((error: Error) => {
    throw new Error(
      `Could not download ${source}: ${(error.cause as Error)?.message ?? error.message}`,
    )
  })
  if (!response.ok)
    throw new Error(`Could not download ${source}: ${response.status} ${response.statusText}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  const actual = sha256(bytes)
  if (actual !== asset.sha256) {
    throw new Error(
      `${asset.name} does not match its pinned SHA-256, so nothing was installed (expected ${asset.sha256}, got ${actual})`,
    )
  }
  mkdirSync(dirname(path), { recursive: true })
  const temp = `${path}.${process.pid}.tmp`
  try {
    writeFileSync(temp, bytes, { mode: 0o755 })
    renameSync(temp, path)
  } finally {
    rmSync(temp, { force: true })
  }
}

// Every other herdr the shell would find on PATH, which ZeroSDK reports but never runs.
export const otherHerdrs = (ours: string, searchPath: string) =>
  which("herdr", searchPath).filter((candidate) => candidate !== ours)
