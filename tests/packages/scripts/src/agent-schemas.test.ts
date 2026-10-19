import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  cells,
  checkLink,
  type DocsSource,
  fromDocs,
  generate,
  jsdoc,
  type NpmSource,
  parseDocsTable,
  render,
  type Source,
  typeDeclaration,
} from "../../../../packages/scripts/src/agent-schemas"
import { capture } from "../../../../packages/scripts/src/capture"

// The pure parsing and rendering, then the network flow against a local server standing in for the docs sites and the npm registry: the docs path alone, and the whole generator from package install to the written file, so neither needs the network.

const CLAUDE_MD = `# Subagents

<a id="supported-frontmatter-fields"></a>

## Frontmatter reference

| Field | Required | Description |
| :- | :- | :- |
| \`name\` | Yes | Unique identifier, see [hooks](/docs/en/hooks#start) |
| \`tools\` | No | [Tools](#available-tools) as \`Read \\| Grep\` |
| \`description\` | Yes | When to delegate |

## Next section
`

const CODEX_MD = `## Custom agents

### Custom agent file schema

| Field                    | Type   | Required | Purpose                       |
| ------------------------ | ------ | :------: | ----------------------------- |
| \`name\`                   | string |   Yes    | Agent name.                   |
| \`developer_instructions\` | string |   Yes    | Core instructions.            |
`

const CLAUDE_URL = "https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields"

// Two packages the emulated registry serves: a config type that references a type the block will not declare, and a class with a definition surface to pick out of its API.
const PACKAGES = {
  "zerosdk-fixture-class": {
    "index.d.ts": `/** A Durable Object agent. */
export declare class Agent<State = unknown> {
  /** Options shared by every instance. */
  static options: { hibernate: boolean }
  /** The state a new instance starts with. */
  initialState: State
  /** Where telemetry goes. */
  observability?: { emit(event: string): void }
  /** A handle the framework provides. */
  readonly scheduler: { cancel(id: string): void }
  private secret
  protected _internal: number
  /** Called when the agent starts. */
  onStart(): void | Promise<void>
  /** Sends a message; part of the API, not a hook. */
  send(message: string): void
}
`,
    version: "0.1.0",
  },
  "zerosdk-fixture-config": {
    "index.d.ts": `/** The model a turn runs on. */
export interface LanguageModel {
  id: string
}
/** How an agent is configured. */
export interface AgentConfig {
  /** What the agent does. */
  description?: string
  /** The model to call. */
  model: LanguageModel
  /** What the agent is called. */
  name: string
}
`,
    version: "1.2.3",
  },
}

const tarballs = new Map<string, { bytes: ArrayBuffer; integrity: string; shasum: string }>()
const work = mkdtempSync(join(tmpdir(), "agent-schemas-"))

const server = Bun.serve({
  fetch(request): Response {
    const { pathname } = new URL(request.url)
    const page = (id: string) => new Response(`<h2 id="${id}">Section</h2>`)
    if (pathname === "/sub-agents.md") return new Response(CLAUDE_MD)
    if (pathname === "/sub-agents") return page("supported-frontmatter-fields")
    if (pathname === "/anchored" || pathname === "/config") return page("options")
    if (pathname === "/class") return page("agent-class")
    if (pathname === "/github") return new Response('<h2 id="user-content-options">Options</h2>')
    if (pathname === "/plain") return new Response("<p>no anchors</p>")
    if (pathname === "/zerosdk-fixture-docs/latest") return Response.json({ version: "9.9.9" })
    const [, name, rest] = pathname.match(/^\/([^/]+)(\/.*)?$/) ?? []
    const pkg = PACKAGES[name as keyof typeof PACKAGES]
    const tarball = tarballs.get(name)
    if (pkg && tarball && rest === "/latest") return Response.json({ name, version: pkg.version })
    if (pkg && tarball && rest?.endsWith(".tgz")) return new Response(tarball.bytes)
    if (pkg && tarball && !rest) {
      const dist = {
        integrity: tarball.integrity,
        shasum: tarball.shasum,
        tarball: `${origin}/${name}/-/${name}-${pkg.version}.tgz`,
      }
      return Response.json({
        "dist-tags": { latest: pkg.version },
        name,
        versions: { [pkg.version]: { dist, name, types: "index.d.ts", version: pkg.version } },
      })
    }
    return new Response("not found", { status: 404 })
  },
  port: 0,
})
const origin = `http://localhost:${server.port}`

beforeAll(async () => {
  for (const [name, pkg] of Object.entries(PACKAGES)) {
    const dir = join(work, "packages", name)
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({ name, types: "index.d.ts", version: pkg.version }),
    )
    await Bun.write(join(dir, "index.d.ts"), pkg["index.d.ts"])
    await capture(["bun", "pm", "pack", "--destination", work, "--quiet"], dir)
    const bytes = await Bun.file(join(work, `${name}-${pkg.version}.tgz`)).arrayBuffer()
    tarballs.set(name, {
      bytes,
      integrity: `sha512-${new Bun.CryptoHasher("sha512").update(bytes).digest("base64")}`,
      shasum: new Bun.CryptoHasher("sha1").update(bytes).digest("hex"),
    })
  }
})

afterAll(() => {
  server.stop(true)
  rmSync(work, { force: true, recursive: true })
})

describe("cells", () => {
  test("splits on unescaped pipes and keeps escaped ones as text", () => {
    expect(cells("| `tools` | No | `Read \\| Grep` |")).toEqual(["`tools`", "No", "`Read | Grep`"])
  })
})

describe("parseDocsTable", () => {
  test("finds the table by an id attribute, sorts A-Z, and reads Required as optional", () => {
    const fields = parseDocsTable(CLAUDE_MD, CLAUDE_URL)
    expect(fields.map((f) => [f.name, f.optional])).toEqual([
      ["description", false],
      ["name", false],
      ["tools", true],
    ])
    expect(fields.every((f) => f.type === undefined)).toBe(true)
  })

  test("makes relative links absolute against the page", () => {
    const fields = parseDocsTable(CLAUDE_MD, CLAUDE_URL)
    expect(fields.find((f) => f.name === "name")?.description).toBe(
      "Unique identifier, see [hooks](https://code.claude.com/docs/en/hooks#start)",
    )
    expect(fields.find((f) => f.name === "tools")?.description).toBe(
      "[Tools](https://code.claude.com/docs/en/sub-agents#available-tools) as `Read | Grep`",
    )
  })

  test("finds the table by a heading slug and reads a Type and Purpose column", () => {
    const fields = parseDocsTable(
      CODEX_MD,
      "https://learn.chatgpt.com/docs/agent-configuration/subagents#custom-agent-file-schema",
    )
    expect(fields).toEqual([
      {
        description: "Core instructions.",
        name: "developer_instructions",
        optional: false,
        type: "string",
      },
      { description: "Agent name.", name: "name", optional: false, type: "string" },
    ])
  })

  test("fails loudly when the anchor or its table is gone", () => {
    expect(() => parseDocsTable(CLAUDE_MD, "https://example.com/page#missing")).toThrow(
      "#missing is gone",
    )
    expect(() =>
      parseDocsTable("## Options\n\nNo table.", "https://example.com/page#options"),
    ).toThrow("No table after #options")
  })
})

describe("jsdoc", () => {
  test("writes nothing for no description", () => {
    expect(jsdoc("")).toBe("")
  })

  test("keeps one line on one line and indents a multi-line one", () => {
    expect(jsdoc("One line.", "  ")).toBe("  /** One line. */\n")
    expect(jsdoc("First.\n\nThird.", "  ")).toBe("  /**\n   * First.\n   *\n   * Third.\n   */\n")
  })

  test("escapes a closing comment and turns em-dashes into hyphens", () => {
    expect(jsdoc("Ends */ early")).toBe("/** Ends *\\/ early */\n")
    expect(jsdoc("deprecated \u2014 use skills")).toBe("/** deprecated - use skills */\n")
  })
})

const source = (fields: Source["fields"], kind: Source["kind"] = "type"): Source => ({
  description: "An agent.",
  fields,
  kind,
  name: "AgentConfig",
  product: "Product",
  title: "pkg@1.0.0",
  url: "https://example.com/docs#agent",
})

describe("typeDeclaration", () => {
  test("marks optional fields, quotes names that are not identifiers, and leaves an untyped field bare", () => {
    expect(
      typeDeclaration(
        source([
          { description: "", name: "kebab-name", optional: true, type: "string" },
          { description: "The model.", name: "model", optional: false, type: "LanguageModel" },
          { description: "", name: "untyped", optional: true },
        ]),
      ),
    ).toBe(
      '/** An agent. */\ntype AgentConfig = {\n  "kebab-name"?: string\n  /** The model. */\n  model: LanguageModel\n  untyped?\n}\n',
    )
  })

  test("declares a class, with its static members marked", () => {
    expect(
      typeDeclaration(
        source(
          [
            { description: "", name: "initialState", optional: false, type: "unknown" },
            { description: "", name: "options", optional: false, static: true, type: "object" },
          ],
          "class",
        ),
      ),
    ).toBe(
      "/** An agent. */\ndeclare class AgentConfig {\n  initialState: unknown\n  static options: object\n}\n",
    )
  })
})

describe("render", () => {
  test("writes a heading, the docs link, and a twoslash block per source, with a cut only above stubs", () => {
    const a = { ...source([]), product: "Alpha" }
    const b = { ...source([]), product: "Beta" }
    const mdx = render([
      { source: a, stubs: "interface LanguageModel {}" },
      { source: b, stubs: "" },
    ])
    expect(mdx.match(/^### .+$/gm)).toEqual(["### Alpha", "### Beta"])
    expect(mdx).toContain("[https://example.com/docs#agent](https://example.com/docs#agent)")
    expect(mdx).toContain(
      '```ts twoslash title="pkg@1.0.0"\n// @noErrors\ninterface LanguageModel {}\n// ---cut---\n',
    )
    expect(mdx.match(/---cut---/g)).toHaveLength(1)
  })
})

describe("checkLink", () => {
  test("passes a page that carries its anchor, as a plain or a GitHub-prefixed id", async () => {
    await checkLink(`${origin}/anchored#options`)
    await checkLink(`${origin}/github#options`)
    await checkLink(`${origin}/plain`)
  })

  test("fails a page whose anchor is gone, and a page that does not load", async () => {
    await expect(checkLink(`${origin}/plain#options`)).rejects.toThrow("#options is gone")
    await expect(checkLink(`${origin}/missing`)).rejects.toThrow("404")
  })
})

const docsSource = {
  description: "A subagent file.",
  markdown: `${origin}/sub-agents.md`,
  name: "subagent",
  pkg: "zerosdk-fixture-docs",
  product: "Fixture Docs",
  url: `${origin}/sub-agents#supported-frontmatter-fields`,
} satisfies DocsSource

describe("fromDocs", () => {
  test("reads the fields from the docs and dates them by the package's latest version", async () => {
    const read = await fromDocs(docsSource, origin)
    expect(read.title).toBe("zerosdk-fixture-docs@9.9.9 · docs")
    expect(read.fields.map((f) => f.name)).toEqual(["description", "name", "tools"])
    expect(read).not.toHaveProperty("markdown")
  })
})

describe("generate", () => {
  test(
    "installs from the registry, reads types and docs, and writes the formatted section",
    async () => {
      const out = join(work, "agent.sources.mdx")
      const cacheDir = process.env.BUN_INSTALL_CACHE_DIR
      // A throwaway install cache, so a fixture never resolves from a stale tarball of the same version.
      process.env.BUN_INSTALL_CACHE_DIR = join(work, "bun-cache")
      try {
        await generate({
          cache: join(work, "cache"),
          docs: [docsSource],
          npm: [
            {
              module: "zerosdk-fixture-config",
              pkg: "zerosdk-fixture-config",
              product: "Fixture Config",
              type: "AgentConfig",
              url: `${origin}/config#options`,
            } satisfies NpmSource,
            {
              module: "zerosdk-fixture-class",
              pkg: "zerosdk-fixture-class",
              product: "Fixture Class",
              type: "Agent",
              url: `${origin}/class#agent-class`,
            } satisfies NpmSource,
          ],
          out,
          registry: origin,
        })
      } finally {
        if (cacheDir === undefined) delete process.env.BUN_INSTALL_CACHE_DIR
        else process.env.BUN_INSTALL_CACHE_DIR = cacheDir
      }
      const mdx = await Bun.file(out).text()

      expect(mdx.match(/^### .+$/gm)).toEqual([
        "### Fixture Class",
        "### Fixture Config",
        "### Fixture Docs",
      ])
      expect(mdx).toContain('title="zerosdk-fixture-config@1.2.3"')
      expect(mdx).toContain('title="zerosdk-fixture-docs@9.9.9 · docs"')
      expect(mdx).toContain(
        "interface LanguageModel {}\n// ---cut---\n/** How an agent is configured. */\ntype AgentConfig = {\n  /** What the agent does. */\n  description?: string\n  /** The model to call. */\n  model: LanguageModel\n  /** What the agent is called. */\n  name: string\n}",
      )
      expect(mdx).toContain(
        "/** A Durable Object agent. */\ndeclare class Agent {\n  /** The state a new instance starts with. */\n  initialState: unknown\n  /** Where telemetry goes. */\n  observability?: { emit(event: string): void }\n  /** Called when the agent starts. */\n  onStart: () => void | Promise<void>\n  /** Options shared by every instance. */\n  static options: { hibernate: boolean }\n}",
      )
      for (const left of ["scheduler", "secret", "_internal", "send"])
        expect(mdx).not.toContain(` ${left}`)
      // Already formatted, so the repo's formatter has nothing left to change.
      const check = Bun.spawnSync(["bunx", "oxfmt", "--check", out], {
        stderr: "pipe",
        stdout: "pipe",
      })
      expect(check.exitCode).toBe(0)
    },
    { timeout: 60_000 },
  )
})
