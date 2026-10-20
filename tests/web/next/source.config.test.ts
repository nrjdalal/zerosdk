import { afterEach, describe, expect, mock, spyOn, test } from "bun:test"
import { join } from "node:path"

import config from "../../../web/next/source.config"

// fumadocs-core is a dependency of web/next, not of the root, so it resolves from there
const { rehypeCode } = await import(
  Bun.resolveSync(
    "fumadocs-core/mdx-plugins/rehype-code",
    join(import.meta.dir, "../../../web/next"),
  )
)
const { mdxOptions } = config
const options =
  mdxOptions && "rehypeCodeOptions" in mdxOptions ? mdxOptions.rehypeCodeOptions : undefined
if (!options) throw new Error("source.config.ts sets no rehypeCodeOptions")

type Node = {
  children?: Node[]
  properties?: { class?: string; className?: string[]; style?: string }
  tagName?: string
  type: string
  value?: string
}

const darkColorsOfFirstLine = async (rehypeCodeOptions: typeof options) => {
  const code: Node = {
    children: [{ type: "text", value: "export const Agent = z.object({ name: z.string() })" }],
    properties: { className: ["language-ts"] },
    tagName: "code",
    type: "element",
  }
  const tree: Node = {
    children: [{ children: [code], tagName: "pre", type: "element" }],
    type: "root",
  }
  await rehypeCode(rehypeCodeOptions)(tree)
  const lines: Node[] = []
  const visit = (node: Node) => {
    if (node.properties?.class === "line") lines.push(node)
    node.children?.forEach(visit)
  }
  visit(tree)
  return new Set(
    lines[0]?.children?.map((span) => span.properties?.style?.match(/--shiki-dark:([^;]+)/)?.[1]),
  )
}

afterEach(() => {
  mock.restore()
})

describe("rehypeCodeOptions", () => {
  test("colors a whole line however slow the build is", async () => {
    let clock = 0
    spyOn(Date, "now").mockImplementation(() => (clock += 1000))
    expect((await darkColorsOfFirstLine(options)).size).toBeGreaterThan(1)
    expect((await darkColorsOfFirstLine({ ...options, tokenizeTimeLimit: undefined })).size).toBe(1)
  })
})
