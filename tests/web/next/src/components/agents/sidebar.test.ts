import { describe, expect, test } from "bun:test"
import { join } from "node:path"

import { stateIcons, taskIcons } from "../../../../../../web/next/src/components/agents/icons"
import {
  type AgentRow,
  AgentsHeader,
  AgentsNav,
  type SubagentRow,
} from "../../../../../../web/next/src/components/agents/sidebar"
import { SidebarProvider } from "../../../../../../web/next/src/components/ui/sidebar"

// react is a dependency of web/next, not of the root, so it resolves from there
const web = join(import.meta.dir, "../../../../../../web/next")
const { createElement } = await import(Bun.resolveSync("react", web))
const { renderToStaticMarkup } = await import(Bun.resolveSync("react-dom/server", web))

type Agent = AgentRow["agent"]

const agent = (id: string, name: string, role: Agent["role"]): Agent => ({ id, name, role })

const mains: AgentRow[] = [
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

const html: string = renderToStaticMarkup(
  createElement(
    SidebarProvider,
    null,
    createElement(AgentsHeader, { mains }),
    createElement(AgentsNav, { orchestrators, subagents }),
  ),
)

describe("agents sidebar", () => {
  test("selects the first main agent by default", () => {
    expect(html).toMatch(/data-active[^>]*>(?:(?!<\/button>).)*AgentZero/)
    expect(html.match(/data-active(?:="true"|="")/g)).toHaveLength(1)
  })

  test("counts each section's agents, nested ones included", () => {
    expect(html).toMatch(/Orchestrators<span class="ml-auto">1<\/span>/)
    expect(html).toMatch(/Subagents<span class="ml-auto">4<\/span>/)
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
})
