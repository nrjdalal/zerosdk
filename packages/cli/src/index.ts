#!/usr/bin/env node
import { hyperlink, intro, link, printError, red } from "@/commands/_prompt"
import { doctor } from "@/commands/doctor"
import { setup } from "@/commands/setup"
import { detectPackageRunner, type PackageRunner, packageCommand } from "@/package-runner"

import pkg from "../package.json" with { type: "json" }

const { author, description, homepage, name, version } = pkg

// Usage names the command as the human runs it now: the installed `zerosdk`, or the package through their package runner.
const helpMessage = (runner: PackageRunner) => {
  const run = runner === "unknown" ? "zerosdk" : packageCommand(runner)
  const rows = [
    [`$ ${run}`, "Set up zerosdk itself, then what ZeroSDK runs on"],
    [`$ ${run} doctor`, "Check what ZeroSDK runs on, without changing anything"],
  ]
  const options = [
    ["-v, --version", "Display version"],
    ["-h, --help", "Display help"],
  ]
  const width = Math.max(...[...rows, ...options].map(([left]) => left.length)) + 4
  const lines = (list: string[][]) =>
    list.map(([left, right]) => `  ${left.padEnd(width)}${right}`).join("\n")
  return `Version:
  ${name}@${version}

${description}

Usage:
${lines(rows)}

Options:
${lines(options)}

Author:
  ${author.name} <${author.email}> (${hyperlink(author.url)})`
}

const main = async () => {
  try {
    const [cmd] = process.argv.slice(2)
    switch (cmd) {
      case undefined:
        intro(link(homepage))
        return await setup()
      case "doctor":
        intro(link(homepage))
        return doctor()
      case "-h":
      case "--help":
        console.log(helpMessage(detectPackageRunner()))
        return
      case "-v":
      case "--version":
        console.log(`${name}@${version}`)
        return
      default:
        console.error(red(`Unknown command: ${cmd}\n`))
        console.log(helpMessage(detectPackageRunner()))
        process.exit(1)
    }
  } catch (err) {
    printError(err)
    process.exit(1)
  }
}

main()
