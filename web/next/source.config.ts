import { join } from "node:path"

import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins"
import { pageSchema } from "fumadocs-core/source/schema"
import { defineConfig, defineDocs } from "fumadocs-mdx/config"
import { transformerTwoslash } from "fumadocs-twoslash"
import { createFileSystemTypesCache } from "fumadocs-twoslash/cache-fs"
import { z } from "zod"

import { normalizeBlogTimestamp } from "@/lib/blog-policy"

// docs.config.ts owns these fields; the generator syncs them into each MDX, so the schema must accept them (label defaults to title).
const docsSchema = pageSchema.extend({
  slug: z.string().optional(),
  label: z.string().optional(),
})

const blogTimestampSchema = z
  .union([z.iso.date(), z.iso.datetime({ offset: true }), z.date()])
  .transform((value, ctx) => {
    const timestamp = normalizeBlogTimestamp(value)
    if (timestamp) return timestamp
    ctx.addIssue({
      code: "custom",
      message: "Expected YYYY-MM-DD or ISO datetime with timezone",
    })
    return z.NEVER
  })

// Blog posts own their own metadata in frontmatter; `publishedAt` drives publishing/order, and `draft` hides a post regardless of timestamps.
const blogSchema = pageSchema.extend({
  createdAt: blogTimestampSchema,
  updatedAt: blogTimestampSchema.optional(),
  publishedAt: blogTimestampSchema.optional(),
  draft: z.boolean().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// A page's markdown copy renders its components, so one with a markdown form (asMarkdown) shows that instead of its JSX: https://fumadocs.dev/docs/headless/mdx/remark-llms#output
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: docsSchema,
    postprocess: {
      includeProcessedMarkdown: { output: "function" },
    },
  },
})

export const blog = defineDocs({
  dir: "content/blog",
  docs: {
    schema: blogSchema,
    postprocess: {
      includeProcessedMarkdown: { output: "function" },
    },
  },
})

// Private documentation for the /console admin area. Kept in a separate collection so it is never mixed into the public docs source, and is excluded from public search, sitemap, and llms.txt by construction.
export const consoleDocs = defineDocs({
  dir: "content/console/docs",
  docs: {
    schema: docsSchema,
    postprocess: {
      includeProcessedMarkdown: { output: "function" },
    },
  },
})

type HastNode = {
  children?: HastNode[]
  data?: { meta?: string }
  tagName?: string
  type: string
  value?: string
}

// fumadocs' include keeps a file's final newline in its block (only the markdown copy drops it) and rehypeCode strips just the one hast appends, so every block drops one more; an included block keeps its include's position, so it cannot be told from a fence here, and a fence loses only a trailing blank line, which no doc has.
function rehypeTrimFinalNewline() {
  const visit = (node: HastNode) => {
    const last = node.tagName === "code" ? node.children?.at(-1) : undefined
    if (last?.type === "text" && last.value) last.value = last.value.replace(/\n$/, "")
    node.children?.forEach(visit)
  }
  return visit
}

// A twoslash block shows its doc comments on hover, needs its leading imports only to type-check, and an oxfmt-ignore only keeps a long line whole in the source, so all three are cut from the code with Twoslash's notation (https://twoslash.netlify.app/refs/notations#cutting-code), before rehypeCode where fumadocs-twoslash reads it and after the page's markdown copy is taken, which keeps them.
function rehypeTwoslashCuts() {
  const visit = (node: HastNode) => {
    if (node.tagName === "code" && node.data?.meta?.includes("twoslash"))
      for (const child of node.children ?? [])
        if (child.type === "text" && child.value)
          child.value = child.value
            .replace(/^(?:import\b[^"']*["'][^"'\n]*["'][^\n]*\n+)+/, "$&// ---cut---\n")
            .replace(
              /^([ \t]*)(\/\*\*[\s\S]*?\*\/|\/\/ oxfmt-ignore)[ \t]*\n/gm,
              "$1// ---cut-start---\n$1$2\n$1// ---cut-end---\n",
            )
    node.children?.forEach(visit)
  }
  return visit
}

// Twoslash adds type and doc popups on hover to code blocks marked `twoslash`: https://fumadocs.dev/docs/markdown/twoslash
export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      // Shiki cannot lazy-load languages inside Twoslash popups, so they are loaded up front.
      langs: ["js", "jsx", "ts", "tsx"],
      themes: {
        dark: "github-dark",
        light: "github-light",
      },
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        // The hovers are kept in git, since a build under Bun cannot run TypeScript 7's sync API (oven-sh/bun#39747) and reads them from here instead.
        transformerTwoslash({
          // An included schema file imports its siblings through @/, which resolves to packages/schema/src in a block.
          twoslashOptions: {
            compilerOptions: {
              paths: { "@/*": [join(process.cwd(), "../../packages/schema/src/*")] },
            },
          },
          typesCache: createFileSystemTypesCache({ dir: "twoslash-cache" }),
        }),
      ],
    },
    rehypePlugins: (plugins) => [rehypeTrimFinalNewline, rehypeTwoslashCuts, ...plugins],
  },
})
