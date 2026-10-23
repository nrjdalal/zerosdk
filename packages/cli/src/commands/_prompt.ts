import { homedir } from "node:os"

import { cyan, dim, gray, green, PAD as P, pulseLabel, red, S, yellow } from "@/style"

export { orange, red } from "@/style"

// Render a clickable terminal hyperlink (OSC 8) when stdout is a TTY; falls back to the raw URL when piped.
export const hyperlink = (url: string, text = url): string =>
  process.stdout.isTTY ? `\x1b]8;;${url}\x07${text}\x1b]8;;\x07` : url

// A clickable, cyan URL: OSC 8 wraps the colored text (link outermost) and the URL is the visible text, so terminals that auto-detect bare URLs also linkify it.
export const link = (url: string): string => hyperlink(url, cyan(url))

// A path under the home directory as the human would type it.
export const tilde = (path: string, home = homedir()): string =>
  path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path

// clack support functions: an indented gutter (PAD) capped by ┌ / └. Steps stack tightly; only the intro and outro get a │ connector, so the first and last lines are spaced from the rest.
export const intro = (title: string): void => {
  process.stdout.write(`\n${P}${gray(S.barStart)}  ${title}\n${P}${gray(S.bar)}\n`)
}

export const outro = (message: string): void => {
  process.stdout.write(`${P}${gray(S.bar)}\n${P}${gray(S.barEnd)}  ${message}\n`)
}

// A completed step (cyan ◆); `detail` lines sit under it.
export const logStep = (message: string, detail: string[] = []): void => {
  process.stdout.write(`${P}${cyan(S.active)}  ${message}\n`)
  for (const line of detail) process.stdout.write(`${P}${gray(S.bar)}  ${line}\n`)
}

// A success line (green ◆ and green message) for a completed milestone.
export const logSuccess = (message: string): void => {
  process.stdout.write(`${P}${green(S.active)}  ${green(message)}\n`)
}

// Dimmed lines in the gutter, under the step before them.
export const logDetail = (lines: string[]): void => {
  for (const line of lines) process.stdout.write(`${P}${gray(S.bar)}  ${dim(line)}\n`)
}

// A warning (yellow ▲) with optional detail lines.
export const logWarn = (message: string, detail: string[] = []): void => {
  process.stdout.write(`${P}${yellow(S.warn)}  ${yellow(message)}\n`)
  for (const line of detail) process.stdout.write(`${P}${gray(S.bar)}  ${yellow(line)}\n`)
}

// The top-level error: the message in red on stderr, under the flow.
export const printError = (err: unknown): void => {
  process.stderr.write(`\n${P}${red(err instanceof Error ? err.message : String(err))}\n`)
}

// A spinner whose glyph blinks hollow ◇ → filled ◆ while `fn` runs, collapsing to a completed step (◆). Off a TTY it just prints the completed step.
export const withSpinner = async <T>(
  active: string,
  done: string,
  fn: () => T | Promise<T>,
): Promise<T> => {
  const out = process.stdout
  let timer: ReturnType<typeof setInterval> | null = null
  if (out.isTTY) {
    let i = 0
    out.write(`${P}${pulseLabel(0, active)}`)
    timer = setInterval(() => {
      i = i + 1
      out.write(`\r\x1b[K${P}${pulseLabel(i, active)}`)
    }, 400)
  }
  try {
    const result = await fn()
    if (timer) clearInterval(timer)
    out.write(
      out.isTTY ? `\r\x1b[K${P}${cyan(S.active)}  ${done}\n` : `${P}${cyan(S.active)}  ${done}\n`,
    )
    return result
  } catch (err) {
    if (timer) clearInterval(timer)
    if (out.isTTY) out.write(`\r\x1b[K`)
    throw err
  }
}
