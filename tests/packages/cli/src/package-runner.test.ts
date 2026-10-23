import { expect, test } from "bun:test"

import pkg from "../../../../packages/cli/package.json" with { type: "json" }
import {
  detectPackageRunner,
  globalInstall,
  packageCommand,
} from "../../../../packages/cli/src/package-runner"

test("detectPackageRunner reads the runner from npm_config_user_agent", () => {
  expect(detectPackageRunner("npm/11.6.2 node/v24.14.1 darwin arm64")).toBe("npx")
  expect(detectPackageRunner("bun/1.4.3 npm/? node/v24.3.0 darwin arm64")).toBe("bunx")
  expect(detectPackageRunner("pnpm/10.18.0 npm/? node/v24.14.1")).toBe("pnpm dlx")
  expect(detectPackageRunner("yarn/4.10.3 npm/? node/v24.14.1")).toBe("yarn dlx")
  expect(detectPackageRunner("")).toBe("unknown")
})

test("globalInstall names this version, through the runner's package manager or npm", () => {
  const spec = `${pkg.name}@${pkg.version}`
  expect(globalInstall("bunx")).toEqual(["bun", "add", "--global", spec])
  expect(globalInstall("npx")).toEqual(["npm", "install", "--global", spec])
  expect(globalInstall("pnpm dlx")).toEqual(["pnpm", "add", "--global", spec])
  expect(globalInstall("yarn dlx")).toEqual(["npm", "install", "--global", spec])
})

test("packageCommand names the package through the runner, npx when none is known", () => {
  expect(packageCommand("npx")).toBe("npx zerosdk-dev")
  expect(packageCommand("bunx")).toBe("bunx zerosdk-dev")
  expect(packageCommand("unknown")).toBe("npx zerosdk-dev")
})
