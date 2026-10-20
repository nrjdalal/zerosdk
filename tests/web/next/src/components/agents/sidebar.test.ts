import { describe, expect, test } from "bun:test"
import { join } from "node:path"

import { stateIcons, taskIcons } from "../../../../../../web/next/src/components/agents/icons"
import {
  type AgentRow,
  AgentsHeader,
  AgentsNav,
  type SubagentRow,
  type ThreadRow,
} from "../../../../../../web/next/src/components/agents/sidebar"
import { SidebarProvider } from "../../../../../../web/next/src/components/ui/sidebar"

// react is a dependency of web/next, not of the root, so it resolves from there
const web = join(import.meta.dir, "../../../../../../web/next")
const { createElement } = await import(Bun.resolveSync("react", web))
const { renderToStaticMarkup } = await import(Bun.resolveSync("react-dom/server", web))

type Agent = AgentRow["agent"]

const agent = (id: string, name: string, role: Agent["role"]): Agent => ({ id, name, role })

const mainAgents: AgentRow[] = [
  { agent: agent("aB3dE9fG", "AgentZero", "main"), state: "running" },
  { agent: agent("hJ2kL4mN", "AgentOne", "main"), state: "idle" },
]
const orchestrators: AgentRow[] = [
  { agent: agent("pQ5rS7tU", "Engineering", "orchestrator"), state: "idle" },
]
const subagents: SubagentRow[] = [
  {
    agent: agent("cD4eF6gH", "Builder", "subagent"),
    state: "waiting",
    subagents: [
      { agent: agent("iJ7kL9mN", "Reviewer", "subagent"), state: "running", task: "review" },
      { agent: agent("oP2qR3sT", "Tester", "subagent"), state: "idle", task: "test" },
    ],
    task: "build",
    title: "ZS-12#45 Add tools",
  },
  { agent: agent("uV5wX6yZ", "Builder", "subagent"), state: "completed", title: "ZS-15 Fix login" },
]
const threads: ThreadRow[] = Array.from({ length: 7 }, (_, i) => ({
  agent: mainAgents[0]!.agent,
  id: `thread-${i + 1}`,
  state: i === 0 ? "waiting" : "completed",
  title: `Ask ${i + 1}`,
  unread: i === 0 ? 2 : undefined,
}))

const render = (nav: { threads: ThreadRow[] }) =>
  renderToStaticMarkup(
    createElement(
      SidebarProvider,
      null,
      createElement(AgentsHeader, { mainAgents }),
      createElement(AgentsNav, { orchestrators, subagents, ...nav }),
    ),
  ) as string

const html = render({ threads })

describe("agents sidebar", () => {
  test("selects the first main agent by default", () => {
    expect(html).toMatch(/data-active[^>]*>(?:(?!<\/button>).)*AgentZero/)
    expect(html.match(/data-active(?:="true"|="")/g)).toHaveLength(1)
  })

  test("counts each section's agents, nested ones included", () => {
    expect(html).toMatch(/Orchestrators<span class="ml-auto flex w-4 justify-center">1<\/span>/)
    expect(html).toMatch(/Subagents<span class="ml-auto flex w-4 justify-center">4<\/span>/)
  })

  test("shows a closed row's running subagent, and its own status once open", () => {
    const icon = (Icon: unknown) =>
      renderToStaticMarkup(createElement(Icon, { className: "size-4" }))
    expect(html).toMatch(
      new RegExp(
        `<span class="[^"]*group-data-\\[open\\]:hidden[^"]*"[^>]*>${RegExp.escape(icon(taskIcons.review))}`,
      ),
    )
    expect(html).toMatch(
      new RegExp(
        `<span class="[^"]*group-data-\\[open\\]:inline[^"]*"[^>]*>${RegExp.escape(icon(stateIcons.waiting))}`,
      ),
    )
  })

  test("gives a row with subagents a toggle apart from the row", () => {
    expect(html).toContain('data-sidebar="menu-action"')
    expect(html).toContain('<span class="sr-only">Toggle</span>')
  })

  test("lists the threads above the orchestrators", () => {
    expect(html.indexOf(">Threads<")).toBeGreaterThan(-1)
    expect(html.indexOf(">Threads<")).toBeLessThan(html.indexOf(">Orchestrators<"))
  })

  test("shows five threads to a page, starting on the first", () => {
    expect(html).toContain("Ask 5")
    expect(html).not.toContain("Ask 6")
    const disabled = (label: string) =>
      new RegExp(`<button(?=[^>]*aria-label="${label}")(?=[^>]*\\sdisabled="")`)
    expect(html).toMatch(disabled("Previous threads"))
    expect(html).not.toMatch(disabled("Next threads"))
    expect(html).toMatch(/<\/button>1\/2<button/)
    expect(html).toContain("min-h-42")
  })

  test("pages only past five threads", () => {
    const five = render({ threads: threads.slice(0, 5) })
    expect(five).toContain("Ask 5")
    expect(five).not.toContain("Next threads")
    expect(five).not.toContain("min-h-42")
  })

  test("shows a thread's unread count, and nothing for a thread with none", () => {
    expect(html.match(/data-sidebar="menu-badge"[^>]*>(\d+)</g)).toEqual([
      expect.stringMatching(/>2<$/),
    ])
  })

  test("drops the group when there are no threads", () => {
    expect(render({ threads: [] })).not.toContain(">Threads<")
  })

  test("gives each thread on the page a menu in its unread count's place", () => {
    expect(html.match(/<span class="sr-only">More<\/span>/g)).toHaveLength(5)
    expect(html).toMatch(
      /data-sidebar="menu-action"[^>]*class="(?=[^"]*aria-expanded:bg-muted)(?=[^"]*aria-expanded:opacity-100)/,
    )
    expect(html).toMatch(
      /data-sidebar="menu-badge"[^>]*class="(?=[^"]*max-md:invisible)(?=[^"]*group-has-aria-expanded\/menu-item:invisible)/,
    )
  })

  test("draws every icon in its Fill variant", async () => {
    const source = await Bun.file(join(web, "src/components/agents/sidebar.tsx")).text()
    expect(source.match(/\bRi\w+Line\b/g) ?? []).toEqual([])
  })
})
