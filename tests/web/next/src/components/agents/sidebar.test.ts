import { describe, expect, test } from "bun:test"
import { join } from "node:path"

import { statusIcons, taskIcons } from "../../../../../../web/next/src/components/agents/icons"
import {
  AgentsHeader,
  AgentsNav,
  nest,
  sessionTitle,
  type SessionRow,
  type ThreadRow,
} from "../../../../../../web/next/src/components/agents/sidebar"
import { SidebarProvider } from "../../../../../../web/next/src/components/ui/sidebar"

// react is a dependency of web/next, not of the root, so it resolves from there
const web = join(import.meta.dir, "../../../../../../web/next")
const { createElement } = await import(Bun.resolveSync("react", web))
const { renderToStaticMarkup } = await import(Bun.resolveSync("react-dom/server", web))

type Agent = SessionRow["agent"]
type Session = SessionRow["session"]

const agent = (id: string, name: string, role: Agent["role"]): Agent => ({
  description: `${name} agent`,
  id,
  metadata: { name },
  role,
})

const row = (
  id: string,
  runs: Agent,
  status: Session["status"],
  more?: Partial<Session>,
): SessionRow => ({
  agent: runs,
  session: { agentId: runs.id, cwd: "/home/dev/zerosdk", id, status, updatedAt: 0, ...more },
})

const builder = agent("01a15d1f-2a31-70d8-9729-4deffa74724d", "Builder", "subagent")
const parent = "01a15e51-f987-775c-99f8-c0c2cdcddaaf"

const rows: SessionRow[] = [
  row(
    "01a15e51-f919-74d6-b2d8-f9dfbfbd1ce9",
    agent("01a15d1f-2a28-7709-ab2d-b667e682dce6", "AgentZero", "main"),
    "running",
  ),
  row(
    "01a15e51-f930-762b-8cfb-0bc612079392",
    agent("01a15d1f-2a2b-72d9-979f-034d4f840245", "AgentOne", "main"),
    "idle",
  ),
  row(
    "01a15e51-f945-7589-829f-79f0d0ecc4a2",
    agent("01a15d1f-2a2d-73cd-a39e-411bc732fb3f", "Engineering", "orchestrator"),
    "idle",
  ),
  row(parent, builder, "waiting", {
    metadata: {
      issue: { key: "ZS-12", url: "https://tracker.example.com/ZS-12" },
      pr: { number: 45, url: "https://github.com/nrjdalal/zerosdk/pull/45" },
      task: "build",
      title: "Add tools",
    },
  }),
  row(
    "01a15e51-f99d-72b5-b994-823e1a4385f2",
    agent("01a15d1f-2a36-70db-abd7-fbef67f2d42c", "Reviewer", "subagent"),
    "running",
    { metadata: { task: "review" }, parentId: parent },
  ),
  row(
    "01a15e51-f9b0-75d5-9ad6-99eb1416a2e4",
    agent("01a15d1f-2a38-7503-b5df-ac1aa377b75a", "Tester", "subagent"),
    "idle",
    { metadata: { task: "test" }, parentId: parent },
  ),
  row("01a15e51-f9c5-7799-9bb2-b4a5ab827f2d", builder, "completed", {
    metadata: {
      issue: { key: "ZS-15", url: "https://tracker.example.com/ZS-15" },
      title: "Fix login",
    },
  }),
]
const threads: ThreadRow[] = Array.from({ length: 7 }, (_, i) => ({
  agent: rows[0]!.agent,
  id: `thread-${i + 1}`,
  status: i === 0 ? "waiting" : "completed",
  title: `Ask ${i + 1}`,
  unread: i === 0 ? 2 : undefined,
}))

const render = (nav: { threads: ThreadRow[] }) =>
  renderToStaticMarkup(
    createElement(
      SidebarProvider,
      null,
      createElement(AgentsHeader, { rows }),
      createElement(AgentsNav, { rows, ...nav }),
    ),
  ) as string

const html = render({ threads })

describe("agents sidebar", () => {
  test("selects the first main agent by default", () => {
    expect(html).toMatch(/data-active[^>]*>(?:(?!<\/button>).)*AgentZero/)
    expect(html.match(/data-active(?:="true"|="")/g)).toHaveLength(1)
  })

  test("shows an agent's description when it has no name", () => {
    for (const metadata of [undefined, { name: "" }]) {
      const main = {
        ...rows[0]!,
        agent: { ...rows[0]!.agent, description: "Talks with the human", metadata },
      }
      expect(
        renderToStaticMarkup(
          createElement(SidebarProvider, null, createElement(AgentsHeader, { rows: [main] })),
        ),
      ).toContain("Talks with the human")
    }
  })

  test("titles a subagent's row by its session after its issue's key and pull request's number, and names any other row", () => {
    expect(html).toContain("ZS-12#45 Add tools")
    expect(html).toContain("ZS-15 Fix login")
    expect(sessionTitle(rows[0]!.session)).toBeUndefined()
    expect(html).toMatch(/>Engineering</)
  })

  test("nests each subagent session under the topmost one above it, however deep, and keeps one whose parent is gone at the top", () => {
    const grandchild = row("01a15e51-fa00-7000-8000-000000000001", builder, "idle", {
      parentId: "01a15e51-f99d-72b5-b994-823e1a4385f2",
    })
    const orphan = row("01a15e51-fa00-7000-8000-000000000002", builder, "idle", {
      parentId: "01a15e51-fa00-7000-8000-00000000dead",
    })
    const subagents = rows.filter((r) => r.agent.role === "subagent")
    const tops = nest([...subagents, grandchild, orphan])
    expect(tops.map((r) => r.session.id)).toEqual([
      parent,
      "01a15e51-f9c5-7799-9bb2-b4a5ab827f2d",
      orphan.session.id,
    ])
    expect(tops[0]!.subagents?.map((r) => r.session.id)).toEqual([
      "01a15e51-f99d-72b5-b994-823e1a4385f2",
      "01a15e51-f9b0-75d5-9ad6-99eb1416a2e4",
      grandchild.session.id,
    ])
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
        `<span class="[^"]*group-data-\\[open\\]:inline[^"]*"[^>]*>${RegExp.escape(icon(statusIcons.waiting))}`,
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
