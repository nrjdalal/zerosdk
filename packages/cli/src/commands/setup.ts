import { logStep, logSuccess, logWarn, orange, outro, tilde, withSpinner } from "@/commands/_prompt"
import {
  HERDR_VERSION,
  type HerdrAsset,
  herdrAsset,
  herdrPath,
  herdrVersion,
  installHerdr,
  isPinnedHerdr,
  unsupportedPlatform,
} from "@/herdr"
import { detectPackageRunner, globalInstall, type PackageRunner } from "@/package-runner"
import {
  installedZerosdk,
  installError,
  installZerosdk,
  isCurrentZerosdk,
  setupCommand,
} from "@/zerosdk"

import pkg from "../../package.json" with { type: "json" }

// What a bare `zerosdk` runs: installs the `zerosdk` command itself when a package runner started it, then ZeroSDK's own herdr, each unless already in place; a failed install of zerosdk is reported and the setup carries on.
export const setup = async ({
  asset = herdrAsset(),
  path = herdrPath(),
  releaseUrl,
  runner = detectPackageRunner(),
}: { asset?: HerdrAsset; path?: string; releaseUrl?: string; runner?: PackageRunner } = {}) => {
  if (!asset) throw new Error(unsupportedPlatform())
  let changed = false
  let failed = false
  const searchPath = process.env.PATH ?? ""
  const installed = installedZerosdk(searchPath)
  let seen = installed
  if (installed?.version === pkg.version) {
    logStep(`zerosdk ${pkg.version} is already installed at ${tilde(installed.path)}`)
  } else if (runner !== "unknown") {
    const command = globalInstall(runner)
    try {
      await withSpinner(
        `Installing zerosdk ${pkg.version} (${command.join(" ")})`,
        `Installed zerosdk ${pkg.version} with ${command[0]}`,
        () => installZerosdk(command),
      )
      seen = installedZerosdk(searchPath)
      if (seen && isCurrentZerosdk(seen, runner)) {
        logSuccess(`From now on, just run zerosdk (${tilde(seen.path)})`)
      } else if (seen) {
        logWarn(
          `zerosdk ${seen.version} at ${tilde(seen.path)} runs before the one just installed`,
          [`Remove it, or put ${command[0]}'s global bin folder before it on PATH`],
        )
      } else {
        logWarn(`The shell does not find zerosdk ${pkg.version} on PATH yet`, [
          `Add ${command[0]}'s global bin folder to PATH, then run ${orange("zerosdk")}`,
        ])
      }
      changed = true
    } catch (error) {
      logWarn(`Could not install zerosdk ${pkg.version}: ${installError(error)}`, [
        `To try again, run ${orange(command.join(" "))}`,
      ])
      failed = true
      process.exitCode = 1
    }
  }
  if (isPinnedHerdr(path, asset)) {
    logStep(`herdr ${HERDR_VERSION} is already installed at ${tilde(path)}`)
  } else {
    await withSpinner(
      `Downloading herdr ${HERDR_VERSION} (${asset.name})`,
      `Downloaded herdr ${HERDR_VERSION} and matched its pinned SHA-256`,
      () => installHerdr({ asset, path, releaseUrl }),
    )
    logSuccess(`Installed ${herdrVersion(path)} at ${tilde(path)}`)
    changed = true
  }
  if (failed) outro("1 step failed")
  else if (changed)
    outro(`Check it any time with ${orange(`${setupCommand(seen, runner)} doctor`)}`)
  else outro("Nothing to do")
}
