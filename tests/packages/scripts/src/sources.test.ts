import { afterAll, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { SCHEMAS } from "../../../../packages/scripts/src/schema-sources"
import {
  fetchSources,
  fileOf,
  pagesOf,
  SOURCES,
  type Source,
} from "../../../../packages/scripts/src/sources"

// The index parsing, then the whole fetch against a local server standing in for the docs sites, so neither needs the network.

const work = mkdtempSync(join(tmpdir(), "sources-"))
const cache = join(work, "cache")

const server = Bun.serve({
  fetch(request): Response {
    const { pathname } = new URL(request.url)
    if (pathname === "/llms.txt")
      return new Response(
        `# Docs\n- [Agents](${origin}/docs/agents.md)\n- [Html](/docs/html/)\n- [Gone](/docs/gone.md)\n- [Blog](/blog/post.md)\n- [Full](/llms-full.txt)`,
      )
    if (pathname === "/docs/agents.md") return new Response("# Agents\nA subagent takes one task.")
    if (pathname === "/docs/html/")
      return new Response("<html><style>p{}</style><body><p>An orchestrator</p></body></html>", {
        headers: { "content-type": "text/html; charset=utf-8" },
      })
    if (pathname === "/export.txt") return new Response("One file for the whole site.")
    return new Response("not found", { status: 404 })
  },
  port: 0,
})
const origin = `http://localhost:${server.port}`

afterAll(() => {
  server.stop(true)
  rmSync(work, { force: true, recursive: true })
})

describe("SOURCES", () => {
  test("lists the same products as the Agent schema, which reads one type from each", () => {
    const products = (list: { product: string }[]) => list.map((s) => s.product).sort()
    const { docs, git, npm } = SCHEMAS.agent
    expect(products(SOURCES)).toEqual(products([...npm, ...docs, ...git]))
  })

  test("names every Session source among them, since not every product keeps a run", () => {
    const { docs, git, npm } = SCHEMAS.session
    const known = new Set(SOURCES.map((s) => s.product))
    for (const s of [...npm, ...docs, ...git]) expect(known.has(s.product)).toBe(true)
  })
})

describe("pagesOf", () => {
  test("keeps each same-site link whose path matches include, once, and drops llms files", () => {
    const index =
      "[a](/docs/a.md) [a again](https://example.com/docs/a.md) [b](https://example.com/docs/b/) [other](https://elsewhere.com/docs/c.md) [blog](/blog/d.md) [llms](/docs/llms-full.txt)"
    expect(pagesOf(index, "https://example.com/llms.txt", /\/docs\//)).toEqual([
      "https://example.com/docs/a.md",
      "https://example.com/docs/b/",
    ])
  })
})

describe("fileOf", () => {
  test("names a page by its url path with one .md extension", () => {
    expect(fileOf("https://example.com/docs/agents.md")).toBe("docs/agents.md")
    expect(fileOf("https://example.com/docs/agents/")).toBe("docs/agents.md")
    expect(fileOf("https://example.com/llms-full.txt")).toBe("llms-full.md")
    expect(fileOf("https://example.com/")).toBe("index.md")
  })
})

describe("fetchSources", () => {
  test("caches each page as text, reports a page that fails, and writes the manifest", async () => {
    const sources: Source[] = [
      {
        docs: { include: /\/docs\//, index: `${origin}/llms.txt` },
        product: "Indexed",
        slug: "indexed",
      },
      { docs: { file: `${origin}/export.txt` }, product: "Single", slug: "single" },
    ]
    const manifest = await fetchSources(sources, cache)

    expect(Object.keys(manifest)).toEqual(["indexed", "single"])
    expect(manifest.indexed.pages).toEqual({
      "docs/agents.md": `${origin}/docs/agents.md`,
      "docs/html.md": `${origin}/docs/html/`,
    })
    expect(manifest.single.pages).toEqual({ "export.md": `${origin}/export.txt` })
    expect(await Bun.file(join(cache, "indexed/docs/agents.md")).text()).toContain("subagent")
    const html = await Bun.file(join(cache, "indexed/docs/html.md")).text()
    expect(html).toContain("An orchestrator")
    expect(html).not.toContain("<p>")
    expect(html).not.toContain("p{}")
    expect(await Bun.file(join(cache, "manifest.json")).json()).toEqual(manifest)
  })

  test("fails a source that caches no pages, and leaves the last cache whole", async () => {
    const before = await Bun.file(join(cache, "manifest.json")).text()
    const sources: Source[] = [
      { docs: { file: `${origin}/export.txt` }, product: "Single", slug: "single" },
      { docs: { file: `${origin}/missing.txt` }, product: "Broken", slug: "broken" },
    ]
    await expect(fetchSources(sources, cache)).rejects.toThrow("No pages cached for Broken")
    expect(await Bun.file(join(cache, "manifest.json")).text()).toBe(before)
    expect(await Bun.file(join(cache, "indexed/docs/agents.md")).exists()).toBe(true)
    expect(await Bun.file(`${cache}.fetching/manifest.json`).exists()).toBe(false)
  })
})
