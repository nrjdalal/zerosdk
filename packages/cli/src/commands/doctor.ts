import { existsSync } from "node:fs"

import { logDetail, logSuccess, logWarn, orange, outro, tilde } from "@/commands/_prompt"
import {
  HERDR_VERSION,
  type HerdrAsset,
  herdrAsset,
  herdrPath,
  herdrVersion,
  isPinnedHerdr,
  otherHerdrs,
  unsupportedPlatform,
} from "@/herdr"
import { detectPackageRunner, type PackageRunner } from "@/package-runner"
import { type InstalledZerosdk, installedZerosdk, isCurrentZerosdk, setupCommand } from "@/zerosdk"

import pkg from "../../package.json" with { type: "json" }

type Check = { message: string; ok: true } | { fix?: string; message: string; ok: false }

const checkZerosdk = (
  installed: InstalledZerosdk | undefined,
  runner: PackageRunner,
  run: string,
): Check => {
  if (!installed) {
    return {
      fix: `Add your package manager's global bin folder to PATH, or run ${run}`,
      message: "The shell does not find zerosdk",
      ok: false,
    }
  }
  if (!isCurrentZerosdk(installed, runner)) {
    return {
      fix: `To install ${pkg.version}, run ${run}`,
      message: `zerosdk ${installed.version} is installed, not ${pkg.version}`,
      ok: false,
    }
  }
  return { message: `zerosdk ${installed.version} at ${tilde(installed.path)}`, ok: true }
}

const checkHerdr = (path: string, asset: HerdrAsset | undefined, run: string): Check => {
  if (!asset) return { message: unsupportedPlatform(), ok: false }
  if (!existsSync(path)) {
    return {
      fix: `To install it, run ${run}`,
      message: `herdr ${HERDR_VERSION} is not installed at ${tilde(path)}`,
      ok: false,
    }
  }
  if (!isPinnedHerdr(path, asset)) {
    return {
      fix: `To replace it, run ${run}`,
      message: `${tilde(path)} is not the pinned herdr ${HERDR_VERSION}`,
      ok: false,
    }
  }
  try {
    return { message: `${herdrVersion(path)} at ${tilde(path)}`, ok: true }
  } catch (error) {
    return { message: `${tilde(path)} does not run: ${(error as Error).message}`, ok: false }
  }
}

const report = (check: Check) => {
  if (check.ok) logSuccess(check.message)
  else logWarn(check.message, check.fix ? [check.fix] : [])
}

// Reads and reports only: it asks the zerosdk the shell runs and ZeroSDK's own herdr for their versions, and runs nothing else.
export const doctor = ({
  asset = herdrAsset(),
  path = herdrPath(),
  runner = detectPackageRunner(),
}: { asset?: HerdrAsset; path?: string; runner?: PackageRunner } = {}) => {
  const searchPath = process.env.PATH ?? ""
  const installed = installedZerosdk(searchPath)
  const run = orange(setupCommand(installed, runner))
  const zerosdk = checkZerosdk(installed, runner, run)
  report(zerosdk)
  const herdr = checkHerdr(path, asset, run)
  report(herdr)
  logDetail(
    otherHerdrs(path, searchPath).map(
      (other) => `Your own herdr at ${tilde(other)} is left alone: ZeroSDK runs only its own copy`,
    ),
  )
  const failed = [zerosdk, herdr].filter((check) => !check.ok).length
  if (failed === 0) {
    outro("Every check passed")
    return
  }
  outro(`${failed} ${failed === 1 ? "check" : "checks"} failed`)
  process.exitCode = 1
}
