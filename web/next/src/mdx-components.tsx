import * as Twoslash from "fumadocs-twoslash/ui"
import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"

import { BlogPostList } from "@/components/blog/post-list"
import { DocsCategory } from "@/components/docs/category"

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...Twoslash,
    BlogPostList,
    DocsCategory,
    ...components,
  }
}
