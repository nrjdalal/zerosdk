import { renameSync, rmSync } from "node:fs"
import { join, resolve } from "node:path"

import { fetchOk } from "@/fetch-ok"

// The 9 TypeScript sources ZeroSDK takes its names and terms from, and their docs cached as one markdown file per page so research reads them locally instead of from the web; run with `bun run sources`, then count terms with `bun run terms`. agent-schemas.ts keeps its own lists, of the type each product defines an agent and keeps a session in; a test keeps the agent list to the same products and the session list within them.

const ROOT = resolve(import.meta.dir, "../../..")
export const CACHE = resolve(ROOT, ".generated/sources")

// docs is a source's llms.txt index, whose linked pages on its own site with a path matching include are its docs, or its single-file export where the index lists no pages.
export type Source = {
  docs: { include: RegExp; index: string } | { file: string }
  product: string
  slug: string
}
export type Manifest = Record<
  string,
  { fetchedAt: string; pages: Record<string, string>; product: string }
>

export const SOURCES: Source[] = [
  {
    docs: { include: /\/v2\/docs\//, index: "https://opencode.ai/v2/llms.txt" },
    product: "Anomaly OpenCode",
    slug: "anomaly-opencode",
  },
  {
    docs: { include: /\/docs\/en\/agent-sdk\//, index: "https://code.claude.com/docs/llms.txt" },
    product: "Claude Agent SDK",
    slug: "claude-agent-sdk",
  },
  {
    docs: {
      include: /\/docs\/en\/(?!agent-sdk\/)/,
      index: "https://code.claude.com/docs/llms.txt",
    },
    product: "Claude Code",
    slug: "claude-code",
  },
  {
    docs: {
      include: /\/agents\//,
      index: "https://developers.cloudflare.com/agents/llms.txt",
    },
    product: "Cloudflare Agents",
    slug: "cloudflare-agents",
  },
  {
    docs: { include: /^\//, index: "https://mastra.ai/llms.txt" },
    product: "Mastra",
    slug: "mastra",
  },
  {
    docs: { file: "https://openai.github.io/openai-agents-js/llms-full.txt" },
    product: "OpenAI Agents SDK",
    slug: "openai-agents-sdk",
  },
  {
    docs: { include: /\/docs\//, index: "https://learn.chatgpt.com/docs/llms.txt" },
    product: "OpenAI Codex",
    slug: "openai-codex",
  },
  {
    docs: { file: "https://ai-sdk.dev/llms.txt" },
    product: "Vercel AI SDK",
    slug: "vercel-ai-sdk",
  },
  {
    docs: { include: /\/docs\//, index: "https://eve.dev/llms.txt" },
    product: "Vercel eve",
    slug: "vercel-eve",
  },
]

const fetchText = async (url: string) => {
  const response = await fetchOk(url)
  const text = await response.text()
  // A page published only as HTML is kept as its text.
  return response.headers.get("content-type")?.includes("text/html")
    ? text
        .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/[ \t]+/g, " ")
    : text
}

// The pages an index links to on its own site with a path matching include, each once; the index's own llms files are left out.
export const pagesOf = (index: string, base: string, include: RegExp) => [
  ...new Set(
    [...index.matchAll(/\]\(([^)\s]+)\)/g)]
      .map(([, href]) => new URL(href, base))
      .filter(
        (url) =>
          url.origin === new URL(base).origin &&
          include.test(url.pathname) &&
          !/\/llms[^/]*\.txt$/.test(url.pathname),
      )
      .map((url) => `${url.origin}${url.pathname}`),
  ),
]

// A page's cache path: its url path with one .md extension, so a hit names the page it came from.
export const fileOf = (url: string) =>
  `${new URL(url).pathname.replace(/^\/|\/$/g, "").replace(/\.(md|txt)$/, "") || "index"}.md`

const pool = async <T>(items: T[], limit: number, task: (item: T) => Promise<void>) => {
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await task(items[next++])
    }),
  )
}

// Fetches each source's docs into cache/<slug>/ and writes cache/manifest.json; a page that fails to load is reported, not cached. The run fills a sibling directory and swaps it in only when every source loads, so a failed run leaves the last cache whole.
export async function fetchSources(sources: Source[], cache: string): Promise<Manifest> {
  const next = `${cache}.fetching`
  rmSync(next, { force: true, recursive: true })
  try {
    const manifest = await fetchInto(sources, next)
    rmSync(cache, { force: true, recursive: true })
    renameSync(next, cache)
    return manifest
  } catch (error) {
    rmSync(next, { force: true, recursive: true })
    throw error
  }
}

async function fetchInto(sources: Source[], cache: string): Promise<Manifest> {
  const manifest: Manifest = {}
  for (const source of sources) {
    const dir = join(cache, source.slug)
    const urls =
      "file" in source.docs
        ? [source.docs.file]
        : pagesOf(await fetchText(source.docs.index), source.docs.index, source.docs.include)
    const pages: Record<string, string> = {}
    const failed: string[] = []
    await pool(urls, 8, async (url) => {
      try {
        const file = fileOf(url)
        await Bun.write(join(dir, file), await fetchText(url))
        pages[file] = url
      } catch (error) {
        failed.push(`${url}: ${(error as Error).message}`)
      }
    })
    const count = Object.keys(pages).length
    if (count === 0) throw new Error(`No pages cached for ${source.product}`)
    manifest[source.slug] = {
      fetchedAt: new Date().toISOString(),
      pages: Object.fromEntries(Object.entries(pages).sort(([a], [b]) => a.localeCompare(b))),
      product: source.product,
    }
    console.log(
      `${source.product} · ${count} page${count === 1 ? "" : "s"}${failed.length ? `, ${failed.length} failed:\n  ${failed.join("\n  ")}` : ""}`,
    )
  }
  await Bun.write(join(cache, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
  return manifest
}

if (import.meta.main) {
  await fetchSources(SOURCES, CACHE)
  console.log(`\nCached in ${CACHE}`)
}
