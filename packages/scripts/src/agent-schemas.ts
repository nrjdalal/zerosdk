import { resolve } from "node:path"

import {
  type Node,
  type SourceFile,
  SyntaxKind,
  type TypeReferenceNode,
} from "typescript/unstable/ast"
import { isTypeReferenceNode } from "typescript/unstable/ast/is"
import {
  API,
  type Checker,
  NodeBuilderFlags,
  type Project,
  type Symbol,
  SymbolFlags,
} from "typescript/unstable/async"

import { capture } from "@/capture"
import { fetchOk } from "@/fetch-ok"

// Reads how each TypeScript source defines an agent, from its npm types or, where it exports none, its docs table, and writes the comparison into the Agent docs page; run with `bun run agent:schemas`, which installs each package at its latest into .generated/agent-schemas/.

const ROOT = resolve(import.meta.dir, "../../..")
const OUT = resolve(ROOT, "web/next/src/schemas/agent.sources.mdx")

// static marks a class's static member; type is left out where the source documents none.
type Field = {
  description: string
  name: string
  optional: boolean
  static?: boolean
  type?: string
}
export type Source = {
  description: string
  fields: Field[]
  kind: "class" | "type"
  name: string
  product: string
  title: string
  url: string
}
export type NpmSource = Pick<Source, "product" | "url"> & {
  module: string
  pkg: string
  // The shape to read when it is not the exported type itself, such as the encoded side of an Effect schema class; it reads as a type, never a class.
  target?: string
  type: string
}
export type DocsSource = Pick<Source, "description" | "name" | "product" | "url"> & {
  markdown: string
  pkg: string
}
type Block = { source: Source; stubs: string }
// The compiler session and the directory the npm sources are installed into.
type Session = { api: API; cache: string }

// npm sources: the type each package exports for what an agent is defined with.
export const NPM: NpmSource[] = [
  {
    module: "@opencode/schema/config/agent",
    pkg: "@opencode/schema",
    product: "Anomaly OpenCode",
    target: '(typeof ConfigAgent.Info)["Encoded"]',
    type: "ConfigAgent",
    url: "https://opencode.ai/v2/docs/agents/#options",
  },
  {
    module: "@anthropic-ai/claude-agent-sdk",
    pkg: "@anthropic-ai/claude-agent-sdk",
    product: "Claude Agent SDK",
    type: "AgentDefinition",
    url: "https://code.claude.com/docs/en/agent-sdk/typescript#agentdefinition",
  },
  {
    module: "agents",
    pkg: "agents",
    product: "Cloudflare Agents",
    type: "Agent",
    url: "https://developers.cloudflare.com/agents/runtime/agents-api/#agent-class",
  },
  {
    module: "@mastra/core/agent",
    pkg: "@mastra/core",
    product: "Mastra",
    type: "AgentConfig",
    url: "https://mastra.ai/reference/agents/agent#constructor-parameters",
  },
  {
    module: "@openai/agents-core",
    pkg: "@openai/agents-core",
    product: "OpenAI Agents SDK",
    type: "AgentOptions",
    url: "https://openai.github.io/openai-agents-js/guides/agents/#basic-configuration",
  },
  {
    module: "ai",
    pkg: "ai",
    product: "Vercel AI SDK",
    type: "ToolLoopAgentSettings",
    url: "https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent#parameters",
  },
  {
    module: "eve",
    pkg: "eve",
    product: "Vercel eve",
    type: "AgentDefinition",
    url: "https://eve.dev/docs/agent-config",
  },
]

// Docs sources: products whose agent file has no exported type, read from the table in their docs.
export const DOCS: DocsSource[] = [
  {
    description: "A subagent file in .claude/agents/, configured by its YAML frontmatter.",
    markdown: "https://code.claude.com/docs/en/sub-agents.md",
    name: "subagent",
    pkg: "@anthropic-ai/claude-code",
    product: "Claude Code",
    url: "https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields",
  },
  {
    description:
      "A custom agent file in .codex/agents/, written in TOML. Its schema table lists the required keys; model and feature config keys may also be set, see the docs.",
    markdown: "https://learn.chatgpt.com/docs/agent-configuration/subagents.md",
    name: "agent",
    pkg: "@openai/codex",
    product: "OpenAI Codex",
    url: "https://learn.chatgpt.com/docs/agent-configuration/subagents#custom-agent-file-schema",
  },
]

const sortByName = <T extends { name: string }>(items: T[]) =>
  items.sort((a, b) => a.name.localeCompare(b.name))

const npmLatest = async (name: string, registry: string) =>
  ((await (await fetchOk(`${registry}/${name}/latest`)).json()) as { version: string }).version

// Splits a markdown table row on its unescaped pipes.
export const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replaceAll("\\|", "|"))

const slug = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

// The fields in the first table after the section url's anchor names: found by an id attribute or a heading whose slug is the anchor, since links rely on the anchor while heading text changes.
export function parseDocsTable(markdown: string, url: string): Field[] {
  const anchor = new URL(url).hash.slice(1)
  const lines = markdown.split("\n")
  const start = lines.findIndex(
    (line) =>
      line.includes(`id="${anchor}"`) ||
      (/^#+ /.test(line) && slug(line.replace(/^#+ /, "")) === anchor),
  )
  if (start === -1) throw new Error(`#${anchor} is gone from ${url}`)
  const first = lines.findIndex((line, i) => i > start && line.startsWith("|"))
  if (first === -1) throw new Error(`No table after #${anchor} in ${url}`)
  const end = lines.findIndex((line, i) => i > first && !line.startsWith("|"))
  const table = lines.slice(first, end === -1 ? undefined : end)
  const header = cells(table[0]).map((cell) => cell.toLowerCase())
  const column = (...names: string[]) => header.findIndex((cell) => names.includes(cell))
  const [field, required, type, description] = [
    column("field"),
    column("required"),
    column("type"),
    column("description", "purpose"),
  ]
  return sortByName(
    table.slice(2).map((row) => {
      const values = cells(row)
      return {
        // Relative links are made absolute, so they still work from our page.
        description: values[description].replace(
          /\]\(((?:\/|#)[^)]*)\)/g,
          (_, href: string) => `](${new URL(href, url).href})`,
        ),
        name: values[field].replaceAll("`", ""),
        optional: values[required] !== "Yes",
        ...(type !== -1 && { type: values[type].replaceAll("`", "") }),
      }
    }),
  )
}

export async function fromDocs(source: DocsSource, registry: string): Promise<Source> {
  const { markdown, pkg, ...rest } = source
  return {
    ...rest,
    fields: parseDocsTable(await (await fetchOk(markdown)).text(), source.url),
    kind: "type",
    // The fields come from the docs page, not the package, which only dates them.
    title: `${pkg}@${await npmLatest(pkg, registry)} · docs`,
  }
}

// A broken link reads as a working one on the page, so each must load and still carry the anchor it points at.
export async function checkLink(url: string) {
  const html = await (await fetchOk(url)).text()
  const anchor = new URL(url).hash.slice(1)
  if (anchor && !new RegExp(`id="?(user-content-)?${anchor}[" >]`).test(html))
    throw new Error(`#${anchor} is gone from ${url}`)
}

// A doc comment; the docs site cuts it from twoslash blocks and shows it on hover, and the repo bans em-dashes, so a source's own ones become hyphens.
export function jsdoc(text: string, indent = "") {
  if (!text) return ""
  const lines = text
    .replaceAll("*/", "*\\/")
    .replace(/\s*\u2014\s*/g, " - ")
    .split("\n")
  if (lines.length === 1) return `${indent}/** ${lines[0]} */\n`
  return `${indent}/**\n${lines.map((line) => `${indent} *${line && ` ${line}`}`).join("\n")}\n${indent} */\n`
}

export const typeDeclaration = (source: Source) => {
  const members = source.fields
    .map((f) => {
      const name = /^[A-Za-z_$][\w$]*$/.test(f.name) ? f.name : JSON.stringify(f.name)
      return `${jsdoc(f.description, "  ")}  ${f.static ? "static " : ""}${name}${f.optional ? "?" : ""}${f.type ? `: ${f.type}` : ""}\n`
    })
    .join("")
  const head = source.kind === "class" ? `declare class ${source.name}` : `type ${source.name} =`
  return `${jsdoc(source.description)}${head} {\n${members}}\n`
}

// The Sources section: per source a heading, its docs link (on its own line, since headings are anchors already), and its twoslash block.
export const render = (blocks: Block[]) =>
  `{/* Generated by \`bun run agent:schemas\`; edit packages/scripts/src/agent-schemas.ts, not this file. */}\n\n${blocks
    .map(
      ({ source: s, stubs }) =>
        `### ${s.product}\n\n[${s.url}](${s.url})\n\n\`\`\`ts twoslash title="${s.title}"\n// @noErrors\n${stubs ? `${stubs}\n// ---cut---\n` : ""}${typeDeclaration(s)}\`\`\``,
    )
    .join("\n\n")}\n`

// Writes each content to its own file in the cache, so sources that export the same name never meet, and opens them as one project through TypeScript's compiler API.
async function compile({ api, cache }: Session, prefix: string, contents: string[]) {
  const files = contents.map((_, i) => resolve(cache, `${prefix}-${i}.ts`))
  const config = resolve(cache, `${prefix}.tsconfig.json`)
  await Promise.all(contents.map((content, i) => Bun.write(files[i], content)))
  await Bun.write(
    config,
    JSON.stringify({
      compilerOptions: {
        module: "esnext",
        moduleResolution: "bundler",
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: "es2022",
      },
      files,
    }),
  )
  const project = (await api.updateSnapshot({ openProjects: [config] })).getProject(config)
  if (!project) throw new Error(`Could not open ${config}`)
  const sourceFiles = await Promise.all(files.map((f) => project.program.getSourceFile(f)))
  return { project, sourceFiles: sourceFiles.map((f) => f!) }
}

// The modifier keywords written on a symbol's declarations (private, protected, readonly and the rest), read from the tokens since the API's nodes do not carry the computed flags.
const modifiers = async (symbol: Symbol, project: Project) => {
  const nodes = await Promise.all((symbol.declarations ?? []).map((d) => d.resolve(project)))
  return new Set(
    nodes.flatMap((node) =>
      [...((node as { modifiers?: Iterable<Node> } | undefined)?.modifiers ?? [])].map(
        (m) => m.kind,
      ),
    ),
  )
}

const has = (symbol: Symbol, flag: SymbolFlags) => (symbol.flags & flag) !== 0

const isPublic = (symbol: Symbol, written: Set<SyntaxKind>) =>
  !/^[_#]/.test(symbol.name) &&
  !written.has(SyntaxKind.PrivateKeyword) &&
  !written.has(SyntaxKind.ProtectedKeyword)

async function fromNpm(session: Session, npm: NpmSource[]): Promise<Source[]> {
  const { project, sourceFiles } = await compile(
    session,
    "target",
    npm.map(
      (s) =>
        `import type { ${s.type} } from "${s.module}"\nexport type Target = ${s.target ?? s.type}\nexport type { ${s.type} }\n`,
    ),
  )
  const checker: Checker = project.checker
  const field = async (symbol: Symbol, isStatic = false): Promise<Field> => {
    const optional = has(symbol, SymbolFlags.Optional)
    const printed = await checker.typeToString(
      (await checker.getTypeOfSymbol(symbol))!,
      undefined,
      NodeBuilderFlags.NoTruncation,
    )
    return {
      description: await symbol.getDocumentationComment(checker),
      name: symbol.name,
      optional,
      ...(isStatic && { static: true }),
      // `?` already says the field may be left out.
      type: optional ? printed.replace(/ \| undefined$/, "") : printed,
    }
  }
  // The public symbols that pass test, which also sees the modifier keywords written on each, as fields.
  const fieldsOf = async (
    symbols: readonly Symbol[],
    test: (symbol: Symbol, written: Set<SyntaxKind>) => boolean,
    isStatic = false,
  ) => {
    const written = await Promise.all(symbols.map((m) => modifiers(m, project)))
    return Promise.all(
      symbols
        .filter((m, i) => isPublic(m, written[i]) && test(m, written[i]))
        .map((m) => field(m, isStatic)),
    )
  }

  return Promise.all(
    npm.map(async (s, i) => {
      const exported = await checker.getExportsOfModule(
        (await checker.getSymbolAtLocation(sourceFiles[i]))!,
      )
      const target = exported.find((e) => e.name === "Target")!
      const declared = await checker.getAliasedSymbol(exported.find((e) => e.name === s.type)!)
      const type = (await checker.getNonNullableType(
        await checker.getDeclaredTypeOfSymbol(target),
      ))!
      const isClass = !s.target && has(declared, SymbolFlags.Class)
      const instance = await checker.getPropertiesOfType(type)
      // A class is defined by what a subclass provides: the properties it may set (writable, or optional), the on* hooks it overrides, and its static options; the readonly handles the framework provides and the rest of its API are left out.
      const fields = isClass
        ? [
            ...(await fieldsOf(instance, (symbol, written) =>
              has(symbol, SymbolFlags.Property)
                ? !written.has(SyntaxKind.ReadonlyKeyword) || has(symbol, SymbolFlags.Optional)
                : has(symbol, SymbolFlags.Method) && /^on[A-Z]/.test(symbol.name),
            )),
            ...(await fieldsOf(
              await checker.getPropertiesOfType((await checker.getTypeOfSymbol(declared))!),
              (symbol) => has(symbol, SymbolFlags.Property) && symbol.name !== "prototype",
              true,
            )),
          ]
        : await fieldsOf(instance, (symbol) => has(symbol, SymbolFlags.Property))
      const { version } = await Bun.file(
        resolve(session.cache, "node_modules", s.pkg, "package.json"),
      ).json()
      return {
        description: await declared.getDocumentationComment(checker),
        fields: sortByName(fields),
        kind: isClass ? ("class" as const) : ("type" as const),
        name: s.type,
        product: s.product,
        title: `${s.pkg}@${version}`,
        url: s.url,
      }
    }),
  )
}

// Each source with its stubs: the names its block references but nothing declares, as empty interfaces (in a namespace for a dotted name), each taking as many type arguments as its widest use passes.
async function blocksOf(session: Session, sources: Source[]): Promise<Block[]> {
  const { project, sourceFiles } = await compile(
    session,
    "block",
    sources.map((s) => `export {}\n${typeDeclaration(s)}`),
  )
  return Promise.all(
    sourceFiles.map(async (file: SourceFile, index) => {
      const references: TypeReferenceNode[] = []
      const visit = (node: Node): undefined => {
        if (isTypeReferenceNode(node)) references.push(node)
        node.forEachChild(visit)
      }
      visit(file)
      // An unresolved name still gets a symbol, a transient one with no declarations.
      const symbols = await Promise.all(
        references.map((r) => project.checker.getSymbolAtLocation(r.typeName)),
      )
      const missing = new Map<string, Map<string, number>>()
      references.forEach((reference, i) => {
        if (symbols[i]?.declarations?.length) return
        const path = reference.typeName.getText(file).split(".")
        const name = path.pop()!
        const names = missing.get(path.join(".")) ?? new Map<string, number>()
        names.set(name, Math.max(names.get(name) ?? 0, reference.typeArguments?.length ?? 0))
        missing.set(path.join("."), names)
      })
      const stubs = [...missing]
        .map(([namespace, names]) => {
          const interfaces = [...names]
            .map(([name, arity]) => {
              const params = Array.from({ length: arity }, (_, i) => `T${i} = any`).join(", ")
              return `interface ${name}${params && `<${params}>`} {}`
            })
            .join("\n")
          return namespace ? `declare namespace ${namespace} { ${interfaces} }` : interfaces
        })
        .join("\n")
      return { source: sources[index], stubs }
    }),
  )
}

// The whole run: install the npm sources from the registry into cache, read them and the docs sources, check every link, and write the formatted Sources section to out.
export async function generate(options: {
  cache: string
  docs: DocsSource[]
  npm: NpmSource[]
  out: string
  registry: string
}): Promise<Source[]> {
  const { cache, docs, npm, out, registry } = options
  await Bun.write(resolve(cache, "package.json"), JSON.stringify({ private: true, type: "module" }))
  await capture(["bun", "add", "--registry", registry, ...npm.map((s) => `${s.pkg}@latest`)], cache)

  // One compiler session reads the packages and checks the blocks; closing it ends the TypeScript process it runs.
  const session: Session = { api: new API({ cwd: cache }), cache }
  try {
    const sources = (
      await Promise.all([fromNpm(session, npm), ...docs.map((s) => fromDocs(s, registry))])
    )
      .flat()
      .sort((a, b) => a.product.localeCompare(b.product))
    // A source that changed shape reads as no fields; fail rather than write a silent gap.
    const empty = sources.filter((s) => s.fields.length === 0).map((s) => s.product)
    if (empty.length) throw new Error(`No fields read for: ${empty.join(", ")}`)
    await Promise.all(sources.map((s) => checkLink(s.url)))

    // Formatted as the repo formats the committed file, so a run with no upstream change leaves no diff.
    const formatted = await capture(
      ["bunx", "oxfmt", "--stdin-filepath", OUT],
      ROOT,
      render(await blocksOf(session, sources)),
    )
    await Bun.write(out, formatted)
    return sources
  } finally {
    await session.api.close()
  }
}

if (import.meta.main) {
  const sources = await generate({
    cache: resolve(ROOT, ".generated/agent-schemas"),
    docs: DOCS,
    npm: NPM,
    out: OUT,
    registry: "https://registry.npmjs.org",
  })
  for (const s of sources) {
    const described = s.fields.filter((f) => f.description).length
    console.log(`${s.product} · ${s.title} · ${s.fields.length} fields, ${described} described`)
  }
  console.log(`\nWrote ${OUT}`)
  console.log(
    "Restart bun run dev if it is running: its first render of a regenerated page this large can stall.",
  )
}
