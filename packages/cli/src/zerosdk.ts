import { execFile, execFileSync } from "node:child_process"
import { basename, dirname } from "node:path"
import { promisify } from "node:util"

import { type PackageRunner, packageCommand } from "@/package-runner"
import { which } from "@/which"

import pkg from "../package.json" with { type: "json" }

export type InstalledZerosdk = { path: string; version: string }

// A package runner's temporary copy, or a project's own: npx, bunx and pnpm dlx put theirs in a `node_modules/.bin`, and yarn dlx in an `xfs-` temp folder.
const isRunnerCopy = (candidate: string) => {
  const folder = dirname(candidate)
  if (basename(folder) === ".bin" && basename(dirname(folder)) === "node_modules") return true
  return basename(folder).startsWith("xfs-")
}

// The zerosdk the shell runs, if a global install put it there: runner copies are skipped, and only that first one is asked for its version.
export const installedZerosdk = (searchPath: string): InstalledZerosdk | undefined => {
  const path = which("zerosdk", searchPath).find((candidate) => !isRunnerCopy(candidate))
  if (!path) return undefined
  try {
    const printed = execFileSync(path, ["--version"], { encoding: "utf8" }).trim()
    if (printed.startsWith(`${pkg.name}@`))
      return { path, version: printed.slice(pkg.name.length + 1) }
  } catch {
    return undefined
  }
}

// Whether the installed zerosdk is the one to run from here: under a package runner it must be the version running, which the setup would otherwise replace.
export const isCurrentZerosdk = (installed: InstalledZerosdk | undefined, runner: PackageRunner) =>
  Boolean(installed) && (runner === "unknown" || installed?.version === pkg.version)

// What the human runs to set up from here: the installed zerosdk when it is current; this version through their runner when another one is installed, since a bare package name runs the installed copy; else the package.
export const setupCommand = (installed: InstalledZerosdk | undefined, runner: PackageRunner) => {
  if (isCurrentZerosdk(installed, runner)) return "zerosdk"
  return installed ? `${packageCommand(runner)}@${pkg.version}` : packageCommand(runner)
}

export const installZerosdk = async ([command, ...args]: string[]) => {
  await promisify(execFile)(command, args)
}

// The line of a failed install that says what went wrong: npm and bun write it to stderr, after progress lines in bun's case, and pnpm to stdout.
export const installError = (error: unknown) => {
  const {
    message,
    stderr = "",
    stdout = "",
  } = error as { message: string; stderr?: string; stdout?: string }
  const lines = `${stderr}\n${stdout}`.split("\n").map((line) => line.trim())
  return lines.find((line) => /\b(error|err_|err!)/i.test(line)) ?? message.trim().split("\n")[0]
}
