import { describe, expect, test } from "bun:test"
import { join } from "node:path"

import * as logos from "../../../../../../web/next/src/components/common/provider-logos"

// react is a dependency of web/next, not of the root, so it resolves from there
const web = join(import.meta.dir, "../../../../../../web/next")
const { createElement } = await import(Bun.resolveSync("react", web))
const { renderToStaticMarkup } = await import(Bun.resolveSync("react-dom/server", web))

describe("provider logos", () => {
  test("draws each logo in the text color, at a Remix icon's size", () => {
    for (const Logo of Object.values(logos)) {
      const svg: string = renderToStaticMarkup(createElement(Logo))
      expect(svg).toMatch(
        /^<svg [^>]*viewBox="[\d. ]+" width="24" height="24" color="currentColor" fill="currentColor"/,
      )
      expect(svg).toContain("<path ")
      expect(svg).not.toMatch(/(fill|stroke)="(?!currentColor"|none")/)
    }
  })

  test("takes a Remix icon's color and size, and the props an svg takes", () => {
    const svg: string = renderToStaticMarkup(
      createElement(logos.Zai, { className: "size-4", color: "red", size: 16 }),
    )
    expect(svg).toContain('width="16" height="16" color="red" fill="red"')
    expect(svg).toContain('class="size-4"')
  })
})
