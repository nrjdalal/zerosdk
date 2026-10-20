import { afterEach, describe, expect, spyOn, test } from "bun:test"
import { join } from "node:path"

import config from "../../../web/next/source.config"

const { createHighlighter } = await import(
  Bun.resolveSync("shiki", join(import.meta.dir, "../../../web/next"))
)
const { mdxOptions } = config
const options =
  mdxOptions && "rehypeCodeOptions" in mdxOptions ? mdxOptions.rehypeCodeOptions : undefined
const themes = { dark: "github-dark", light: "github-light" }
const highlighter = await createHighlighter({ langs: ["ts"], themes: Object.values(themes) })
const code = "export const Agent = z.object({ name: z.string() })"
const tokens = (tokenizeTimeLimit?: number) =>
  highlighter.codeToTokensWithThemes(code, { lang: "ts", themes, tokenizeTimeLimit })[0].length

afterEach(() => {
  spyOn(Date, "now").mockRestore()
})

describe("rehypeCodeOptions", () => {
  test("tokenizes a line in full however slow the build is", () => {
    const full = tokens(0)
    let clock = 0
    spyOn(Date, "now").mockImplementation(() => (clock += 1000))
    expect(tokens(options ? options.tokenizeTimeLimit : undefined)).toBe(full)
    expect(tokens()).toBeLessThan(full)
  })
})
