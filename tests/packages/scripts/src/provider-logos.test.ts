import { afterAll, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  componentName,
  generate,
  PROVIDERS,
  render,
  toLogo,
} from "../../../../packages/scripts/src/provider-logos"

// The logo parsing and rendering, then the whole run against a local server standing in for models.dev, so neither needs the network.

const svg = (attributes: string, inner: string) =>
  `<svg width="24" height="24" ${attributes} xmlns="http://www.w3.org/2000/svg">\n${inner}\n</svg>\n`

const LOGOS: Record<string, string> = {
  anthropic: svg('viewBox="0 0 40 40"', '<path d="M1 1H2Z" fill="currentColor"/>'),
  zai: svg('viewBox="0 0 40 40"', '<path d="M3 3H4Z" fill="currentColor"/>'),
}

const work = mkdtempSync(join(tmpdir(), "provider-logos-"))

const server = Bun.serve({
  fetch(request): Response {
    const [, provider, file] = new URL(request.url).pathname.split("/")
    const logo = provider && LOGOS[provider]
    if (logo && file === "logo.svg") return new Response(logo)
    return new Response("not found", { status: 404 })
  },
  port: 0,
})
const base = `http://localhost:${server.port}`

afterAll(() => {
  server.stop(true)
  rmSync(work, { force: true, recursive: true })
})

describe("toLogo", () => {
  test("reads the viewBox and the shapes, with attributes as JSX names", () => {
    const logo = toLogo(
      svg(
        'viewBox="0 0 24 24"',
        '<!-- mark --><title>Mark</title><path fill-rule="evenodd" clip-rule="evenodd" d="M0 0Z" fill="currentColor"/>',
      ),
      "mark",
    )
    expect(logo).toEqual({
      body: '<path fillRule="evenodd" clipRule="evenodd" d="M0 0Z" fill="currentColor"/>',
      viewBox: "0 0 24 24",
    })
  })

  test("carries the root's paint on a group, so a stroked logo stays stroked", () => {
    const logo = toLogo(
      svg(
        'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"',
        '<path d="M1 1"/>',
      ),
      "outline",
    )
    expect(logo.body).toBe(
      '<g fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1"/></g>',
    )
  })

  test("fails on a logo painted in a color, which would not follow the theme", () => {
    expect(() =>
      toLogo(svg('viewBox="0 0 24 24"', '<path d="M0 0Z" fill="#D97757"/>'), "orange"),
    ).toThrow("orange: painted in #D97757, not currentColor")
    expect(() =>
      toLogo(svg('viewBox="0 0 24 24" stroke="black"', '<path d="M0 0Z"/>'), "black"),
    ).toThrow("painted in black")
  })

  test("fails on markup other than shapes", () => {
    for (const inner of [
      "<script>alert(1)</script>",
      '<path d="M0 0Z" onload="alert(1)"/>',
      '<path d="M0 0Z" style="fill:red"/>',
      '<use href="#a"/>',
      '<image href="https://example.com/a.png"/>',
    ])
      expect(() => toLogo(svg('viewBox="0 0 24 24"', inner), "unsafe")).toThrow(
        "markup other than shapes",
      )
  })

  test("fails without a viewBox or an svg root", () => {
    expect(() => toLogo(svg("", '<path d="M0 0Z"/>'), "flat")).toThrow("flat: no viewBox")
    expect(() => toLogo("<html></html>", "page")).toThrow("page: no <svg> root")
  })
})

describe("componentName", () => {
  test("names a provider's component after its ID, in PascalCase", () => {
    expect(componentName("anthropic")).toBe("Anthropic")
    expect(componentName("zai")).toBe("Zai")
    expect(componentName("zhipuai-coding-plan")).toBe("ZhipuaiCodingPlan")
    expect(componentName("wafer.ai")).toBe("WaferAi")
  })
})

describe("render", () => {
  test("writes one Remix-typed component per provider, A to Z", () => {
    const module = render({
      zai: { body: "<path/>", viewBox: "0 0 40 40" },
      anthropic: { body: "<path/>", viewBox: "0 0 40 40" },
    })
    expect(module).toContain('import type { RemixiconComponentType } from "@remixicon/react"')
    expect(module.indexOf("export const Anthropic: RemixiconComponentType")).toBeLessThan(
      module.indexOf("export const Zai: RemixiconComponentType"),
    )
  })
})

describe("generate", () => {
  test("writes the formatted module from every provider's logo", async () => {
    const out = join(work, "provider-logos.tsx")
    expect(await generate({ base, out, providers: ["zai", "anthropic"] })).toEqual([
      "anthropic",
      "zai",
    ])
    const module = await Bun.file(out).text()
    expect(module).toContain("export const Anthropic: RemixiconComponentType = ({")
    expect(module).toContain('d="M1 1H2Z"')
    expect(module).toContain('d="M3 3H4Z"')
    expect(module).toContain('viewBox="0 0 40 40"')
  })

  test("fails on a provider models.dev does not have, and writes nothing", async () => {
    const out = join(work, "missing.tsx")
    await expect(generate({ base, out, providers: ["anthropic", "nope"] })).rejects.toThrow(
      `404 ${base}/nope/logo.svg`,
    )
    expect(await Bun.file(out).exists()).toBe(false)
  })

  test("copies the providers A to Z", () => {
    expect(PROVIDERS).toEqual([...PROVIDERS].sort())
  })
})
