import pkg from "../package.json" with { type: "json" }

// The package runner (npx, bunx and the like) that invoked this CLI, derived from npm_config_user_agent (which npx/pnpm/yarn/bun all set). "unknown" when it is unset or unrecognized, e.g. a direct node run or a global install.
export type PackageRunner = "bunx" | "npx" | "pnpm dlx" | "yarn dlx" | "unknown"

export const detectPackageRunner = (
  ua = process.env.npm_config_user_agent || "",
): PackageRunner => {
  if (ua.startsWith("bun/")) return "bunx"
  if (ua.startsWith("npm/")) return "npx"
  if (ua.startsWith("pnpm/")) return "pnpm dlx"
  if (ua.startsWith("yarn/")) return "yarn dlx"
  return "unknown"
}

// The command that installs this version globally, through the package manager behind the human's runner; Yarn 2 and later have no global installs, so yarn falls back to npm.
export const globalInstall = (runner: PackageRunner) => {
  const spec = `${pkg.name}@${pkg.version}`
  if (runner === "bunx") return ["bun", "add", "--global", spec]
  if (runner === "pnpm dlx") return ["pnpm", "add", "--global", spec]
  return ["npm", "install", "--global", spec]
}

// The package through the human's runner, npx when none is known.
export const packageCommand = (runner: PackageRunner) =>
  `${runner === "unknown" ? "npx" : runner} ${pkg.name}`
