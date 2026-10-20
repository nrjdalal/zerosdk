import { join } from "node:path"

import { CACHE, type Manifest } from "@/sources"

// Counts, from the cached docs, how many sources use each term and how often, so a name is chosen by consensus without reading the web; each term is a regular expression matched as a whole word, ignoring case. Run with `bun run terms orchestrator coordinator "manager agents?"` after `bun run sources`.

const STALE_DAYS = 7

export type Count = { hits: number[]; sources: number; term: string }

export async function countTerms(terms: string[], cache: string) {
  const file = Bun.file(join(cache, "manifest.json"))
  if (!(await file.exists())) throw new Error(`No cache in ${cache}: run bun run sources`)
  const manifest: Manifest = await file.json()
  const slugs = Object.keys(manifest)
  const texts = await Promise.all(
    slugs.map(async (slug) =>
      (
        await Promise.all(
          Object.keys(manifest[slug].pages).map((page) => Bun.file(join(cache, slug, page)).text()),
        )
      ).join("\n"),
    ),
  )
  const counts: Count[] = terms.map((term) => {
    const pattern = new RegExp(`\\b(?:${term})\\b`, "gi")
    const hits = texts.map((text) => text.match(pattern)?.length ?? 0)
    return { hits, sources: hits.filter(Boolean).length, term }
  })
  return { counts, manifest }
}

export const table = (counts: Count[], products: string[]) => {
  const row = (cells: (number | string)[]) => `| ${cells.join(" | ")} |`
  return [
    row(["Term", "Sources", ...products]),
    row(Array.from({ length: products.length + 2 }, () => "---")),
    ...counts.map((count) =>
      row([
        count.term.replaceAll("|", "\\|"),
        `${count.sources}/${products.length}`,
        ...count.hits,
      ]),
    ),
  ].join("\n")
}

if (import.meta.main) {
  const terms = Bun.argv.slice(2)
  if (terms.length === 0)
    throw new Error('Usage: bun run terms <term> [term...], e.g. "sub-?agents?"')
  const { counts, manifest } = await countTerms(terms, CACHE)
  const entries = Object.values(manifest)
  const stale = entries.filter(
    (entry) => Date.now() - Date.parse(entry.fetchedAt) > STALE_DAYS * 86_400_000,
  )
  if (stale.length) console.error(`Cached over ${STALE_DAYS} days ago: run bun run sources\n`)
  console.log(
    table(
      counts,
      entries.map((entry) => entry.product),
    ),
  )
}
