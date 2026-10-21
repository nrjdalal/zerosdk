import { dirname, join, resolve } from "node:path"

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

// Reads how each TypeScript source defines an agent and a session, from its npm types, the schema its repository generates, or, where it exports none, its docs table, and writes each comparison into its docs page; run with `bun run agent:schemas`, which installs each package at its latest into .generated/agent-schemas/.

const ROOT = resolve(import.meta.dir, "../../..")

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
  // Set for a type read from somewhere other than the package, which then only dates it.
  title?: string
  type: string
}
export type DocsSource = Pick<Source, "description" | "name" | "product" | "url"> & {
  markdown: string
  pkg: string
  // The slug of the heading the table sits under in the markdown, where the markdown drops the anchor the page's url uses.
  section?: string
}
// A type the source publishes only as a file in its repository, read at the tag of the package's latest release, {version} in tag standing for it, together with the files it imports.
export type GitSource = Pick<Source, "product" | "url"> & {
  path: string
  pkg: string
  repo: string
  tag: string
  type: string
}
export type SchemaSources = { docs: DocsSource[]; git: GitSource[]; npm: NpmSource[]; out: string }
type Block = { source: Source; stubs: string }
// The compiler process and the directory the npm sources are installed into.
type Compiler = { api: API; cache: string }

// Agent: the type each package exports for what an agent is defined with.
const AGENT_NPM: NpmSource[] = [
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

// Agent: products whose agent file has no exported type, read from the table in their docs.
const AGENT_DOCS: DocsSource[] = [
  {
    description: "A subagent file in .claude/agents/, configured by its YAML frontmatter.",
    markdown: "https://code.claude.com/docs/en/sub-agents.md",
    name: "subagent",
    pkg: "@anthropic-ai/claude-code",
    product: "Claude Code",
    section: "frontmatter-reference",
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

// Session: the type each source keeps one agent's run in.
const SESSION_NPM: NpmSource[] = [
  {
    module: "@opencode/schema/session",
    pkg: "@opencode/schema",
    product: "Anomaly OpenCode",
    target: '(typeof Session.Info)["Encoded"]',
    type: "Session",
    url: "https://opencode.ai/v2/docs/api#session.get",
  },
  {
    module: "@anthropic-ai/claude-agent-sdk",
    pkg: "@anthropic-ai/claude-agent-sdk",
    product: "Claude Agent SDK",
    type: "SDKSessionInfo",
    url: "https://code.claude.com/docs/en/agent-sdk/typescript#return-type-sdksessioninfo",
  },
  {
    module: "@anthropic-ai/claude-agent-sdk",
    pkg: "@anthropic-ai/claude-agent-sdk",
    product: "Claude Agent SDK",
    type: "SDKTaskStartedMessage",
    url: "https://code.claude.com/docs/en/agent-sdk/typescript#sdktaskstartedmessage",
  },
  {
    module: "agents",
    pkg: "agents",
    product: "Cloudflare Agents",
    type: "AgentToolRunState",
    url: "https://developers.cloudflare.com/agents/runtime/execution/agent-tools/#render-child-timelines-in-react",
  },
  {
    module: "@mastra/core/agent-controller",
    pkg: "@mastra/core",
    product: "Mastra",
    type: "ActiveSubagentState",
    url: "https://mastra.ai/reference/agent-controller/session#display-state",
  },
  {
    module: "eve/context",
    pkg: "eve",
    product: "Vercel eve",
    target: 'Pick<SessionContext, "session">',
    type: "SessionContext",
    url: "https://eve.dev/docs/reference/typescript-api#runtime-context-ctx",
  },
  {
    module: "eve/context",
    pkg: "eve",
    product: "Vercel eve",
    type: "SessionParent",
    url: "https://eve.dev/docs/reference/typescript-api#runtime-context-ctx",
  },
]

// Session: Codex publishes its thread only in the app-server schema its repository generates.
const SESSION_GIT: GitSource[] = [
  {
    path: "codex-rs/app-server-protocol/schema/typescript/v2/Thread.ts",
    pkg: "@openai/codex-sdk",
    product: "OpenAI Codex",
    repo: "openai/codex",
    tag: "rust-v{version}",
    type: "Thread",
    url: "https://learn.chatgpt.com/docs/app-server#threads",
  },
]

// Session: Claude Code lists its sessions as JSON, described by a table in its docs.
const SESSION_DOCS: DocsSource[] = [
  {
    description: "One entry of `claude agents --json`, which lists the sessions agent view shows.",
    markdown: "https://code.claude.com/docs/en/agent-view.md",
    name: "session",
    pkg: "@anthropic-ai/claude-code",
    product: "Claude Code",
    url: "https://code.claude.com/docs/en/agent-view#list-sessions-as-json",
  },
]

// Each schema's sources and the page section they are written to.
export const SCHEMAS = {
  agent: {
    docs: AGENT_DOCS,
    git: [],
    npm: AGENT_NPM,
    out: resolve(ROOT, "web/next/src/schemas/agent.sources.mdx"),
  },
  session: {
    docs: SESSION_DOCS,
    git: SESSION_GIT,
    npm: SESSION_NPM,
    out: resolve(ROOT, "web/next/src/schemas/session.sources.mdx"),
  },
} satisfies Record<string, SchemaSources>

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

// The fields in the first table after the section url's anchor names, or section where the markdown drops that anchor: found by an id attribute or a heading whose slug is the anchor, since links rely on the anchor while heading text changes.
export function parseDocsTable(markdown: string, url: string, section?: string): Field[] {
  const anchor = section ?? new URL(url).hash.slice(1)
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
  const [field, present, required, type, description] = [
    column("field"),
    column("present"),
    column("required"),
    column("type"),
    column("description", "purpose"),
  ]
  return sortByName(
    table.slice(2).flatMap((row) => {
      const values = cells(row)
      // Relative links are made absolute, so they still work from our page.
      const text = values[description].replace(
        /\]\(((?:\/|#)[^)]*)\)/g,
        (_, href: string) => `](${new URL(href, url).href})`,
      )
      // A Present column says when a field appears rather than whether it must: Always is required, and any other condition joins the description.
      const when = present === -1 ? "" : values[present]
      // A row may name several fields that share one description, as `cwd`, `kind`, `startedAt`, so each says which row it shares.
      const names = values[field].split(/,\s*/)
      const notes = [
        names.length > 1 && `one row for ${names.join(", ")}`,
        when && when !== "Always" && when,
      ].filter(Boolean)
      return names.map((name) => ({
        description: notes.length ? `${text} (${notes.join("; ")})` : text,
        name: name.replaceAll("`", ""),
        optional: present === -1 ? values[required] !== "Yes" : when !== "Always",
        ...(type !== -1 && { type: values[type].replaceAll("`", "") }),
      }))
    }),
  )
}

export async function fromDocs(source: DocsSource, registry: string): Promise<Source> {
  const { markdown, pkg, section, ...rest } = source
  return {
    ...rest,
    fields: parseDocsTable(await (await fetchOk(markdown)).text(), source.url, section),
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

// The Sources section: per product a heading, then per source its docs link (on its own line, since headings are anchors already) and its twoslash block.
export const render = (blocks: Block[]) =>
  `{/* Generated by \`bun run agent:schemas\`; edit packages/scripts/src/agent-schemas.ts, not this file. */}\n\n${blocks
    .map(
      ({ source: s, stubs }, i) =>
        `${s.product === blocks[i - 1]?.source.product ? "" : `### ${s.product}\n\n`}[${s.url}](${s.url})\n\n\`\`\`ts twoslash title="${s.title}"\n// @noErrors\n${stubs ? `${stubs}\n// ---cut---\n` : ""}${typeDeclaration(s)}\`\`\``,
    )
    .join("\n\n")}\n`

// Writes each content to its own file in the cache, so sources that export the same name never meet, and opens them as one project through TypeScript's compiler API.
export async function compile({ api, cache }: Compiler, prefix: string, contents: string[]) {
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

// A symbol's type as the compiler prints it, untruncated; `?` already says an optional one may be left out, so its undefined is dropped.
export const printType = async (checker: Checker, symbol: Symbol) => {
  const optional = has(symbol, SymbolFlags.Optional)
  const printed = await checker.typeToString(
    (await checker.getTypeOfSymbol(symbol))!,
    undefined,
    NodeBuilderFlags.NoTruncation,
  )
  return { optional, type: optional ? printed.replace(/ \| undefined$/, "") : printed }
}

const isPublic = (symbol: Symbol, written: Set<SyntaxKind>) =>
  !/^[_#]/.test(symbol.name) &&
  !written.has(SyntaxKind.PrivateKeyword) &&
  !written.has(SyntaxKind.ProtectedKeyword)

async function fromNpm(compiler: Compiler, npm: NpmSource[]): Promise<Source[]> {
  const { project, sourceFiles } = await compile(
    compiler,
    "target",
    npm.map(
      (s) =>
        `import type { ${s.type} } from "${s.module}"\nexport type Target = ${s.target ?? s.type}\nexport type { ${s.type} }\n`,
    ),
  )
  const checker: Checker = project.checker
  const field = async (symbol: Symbol, isStatic = false): Promise<Field> => ({
    description: await symbol.getDocumentationComment(checker),
    name: symbol.name,
    ...(isStatic && { static: true }),
    ...(await printType(checker, symbol)),
  })
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
      const title =
        s.title ??
        `${s.pkg}@${(await Bun.file(resolve(compiler.cache, "node_modules", s.pkg, "package.json")).json()).version}`
      return {
        description: await declared.getDocumentationComment(checker),
        fields: sortByName(fields),
        kind: isClass ? ("class" as const) : ("type" as const),
        name: s.type,
        product: s.product,
        title,
        url: s.url,
      }
    }),
  )
}

// Downloads each git source's file and every file it imports, relative path by relative path, into the cache, and returns it as an npm source whose module is that local file.
export async function downloadGit(
  git: GitSource[],
  options: { cache: string; rawBase: string; registry: string },
): Promise<NpmSource[]> {
  return Promise.all(
    git.map(async (s) => {
      const tag = s.tag.replace("{version}", await npmLatest(s.pkg, options.registry))
      const root = `git/${s.repo}/${tag}`
      const seen = new Set<string>()
      const fetchFile = async (path: string): Promise<void> => {
        if (seen.has(path)) return
        // An import that climbs above the repository's root would write outside the cache.
        if (path.startsWith("..")) throw new Error(`${path} leaves ${s.repo}`)
        seen.add(path)
        // A generated file may write a doc comment on the previous member's line, where TypeScript reads it as trailing; on a line of its own it documents the member after it.
        const text = (
          await (await fetchOk(`${options.rawBase}/${s.repo}/${tag}/${path}`)).text()
        ).replace(/([{,])[ \t]*\/\*\*/g, "$1\n/**")
        await Bun.write(resolve(options.cache, root, path), text)
        const imports = [...text.matchAll(/from "(\.{1,2}\/[^"]+)"/g)].map(
          ([, specifier]) =>
            `${join(dirname(path), specifier.replace(/\.js$/, ""))}${specifier.endsWith(".ts") ? "" : ".ts"}`,
        )
        await Promise.all(imports.map(fetchFile))
      }
      await fetchFile(s.path)
      return {
        module: `./${root}/${s.path.replace(/\.ts$/, "")}`,
        pkg: s.pkg,
        product: s.product,
        title: `${s.repo}@${tag} · schema`,
        type: s.type,
        url: s.url,
      }
    }),
  )
}

// Each source with its stubs: the names its block references but nothing declares, as empty interfaces (in a namespace for a dotted name), each taking as many type arguments as its widest use passes.
async function blocksOf(compiler: Compiler, sources: Source[]): Promise<Block[]> {
  const { project, sourceFiles } = await compile(
    compiler,
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

// The whole run for one schema: install its npm sources from the registry into cache, download its git sources, read them and its docs sources, check every link, and write the formatted Sources section to out.
export async function generate(
  schema: SchemaSources,
  options: { cache: string; rawBase: string; registry: string },
): Promise<Source[]> {
  const { docs, out } = schema
  const { cache, registry } = options
  const npm = [...schema.npm, ...(await downloadGit(schema.git, options))]
  await Bun.write(resolve(cache, "package.json"), JSON.stringify({ private: true, type: "module" }))
  await capture(
    ["bun", "add", "--registry", registry, ...new Set(schema.npm.map((s) => `${s.pkg}@latest`))],
    cache,
  )

  // One compiler process reads the packages and checks the blocks; closing it ends the TypeScript process it runs.
  const compiler: Compiler = { api: new API({ cwd: cache }), cache }
  try {
    const sources = (
      await Promise.all([fromNpm(compiler, npm), ...docs.map((s) => fromDocs(s, registry))])
    )
      .flat()
      .sort((a, b) => a.product.localeCompare(b.product))
    // A source that changed shape reads as no fields; fail rather than write a silent gap.
    const empty = sources.filter((s) => s.fields.length === 0).map((s) => s.product)
    if (empty.length) throw new Error(`No fields read for: ${empty.join(", ")}`)
    await Promise.all(sources.map((s) => checkLink(s.url)))

    // Formatted as the repo formats the committed file, so a run with no upstream change leaves no diff.
    const formatted = await capture(
      ["bunx", "oxfmt", "--stdin-filepath", out],
      ROOT,
      render(await blocksOf(compiler, sources)),
    )
    await Bun.write(out, formatted)
    return sources
  } finally {
    await compiler.api.close()
  }
}

if (import.meta.main) {
  for (const schema of Object.values(SCHEMAS)) {
    const sources = await generate(schema, {
      cache: resolve(ROOT, ".generated/agent-schemas"),
      rawBase: "https://raw.githubusercontent.com",
      registry: "https://registry.npmjs.org",
    })
    for (const s of sources) {
      const described = s.fields.filter((f) => f.description).length
      console.log(`${s.product} · ${s.title} · ${s.fields.length} fields, ${described} described`)
    }
    console.log(`Wrote ${schema.out}\n`)
  }
  console.log(
    "Restart bun run dev if it is running: its first render of a regenerated page this large can stall.",
  )
}
