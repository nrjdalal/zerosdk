import { chmodSync } from "node:fs"
import { join } from "node:path"

const cli = join(import.meta.dir, "../../../packages/cli/dist/index.mjs")
const node = Bun.which("node")

// Runs the built CLI under Node, as npx does, with only the environment a test gives it.
export const runCli = (args: string[], env: { HOME: string } & Record<string, string>) => {
  if (!node) throw new Error("These tests run the CLI under Node, and no node is on PATH")
  const { exitCode, stderr, stdout } = Bun.spawnSync([node, cli, ...args], {
    env: { PATH: "", ...env },
  })
  return { status: exitCode, stderr: stderr.toString(), stdout: stdout.toString() }
}

// Collects what `fn` writes to stdout, without its colors, for the commands a test imports.
export const captureStdout = async (fn: () => unknown) => {
  const chunks: string[] = []
  const write = process.stdout.write
  process.stdout.write = ((chunk: string | Uint8Array) => {
    chunks.push(String(chunk))
    return true
  }) as typeof process.stdout.write
  try {
    await fn()
  } finally {
    process.stdout.write = write
  }
  return Bun.stripANSI(chunks.join(""))
}

// Runs `fn` with PATH set to `dirs` and the system folders a stand-in script needs, then puts PATH back.
export const withPath = async <T>(dirs: string[], fn: () => T | Promise<T>) => {
  const original = process.env.PATH
  process.env.PATH = [...dirs, "/usr/bin", "/bin"].join(":")
  try {
    return await fn()
  } finally {
    process.env.PATH = original
  }
}

// Writes an executable stand-in script at `path`.
export const writeScript = async (path: string, body: string) => {
  await Bun.write(path, `#!/bin/sh\n${body}\n`)
  chmodSync(path, 0o755)
}
