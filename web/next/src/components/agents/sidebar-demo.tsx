import type { Agent } from "@packages/schema/agent"
import type { Session } from "@packages/schema/session"

import {
  AgentsHeader,
  AgentsNav,
  type SessionRow,
  type ThreadRow,
} from "@/components/agents/sidebar"
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar"

const agent = (
  id: string,
  name: string,
  role: Agent["role"],
  model: Agent["model"],
  effort: Agent["effort"],
): Agent => ({ description: `${name} agent`, effort, id, metadata: { name }, model, role })

const agentZero = agent(
  "01a15d1f-2a28-7709-ab2d-b667e682dce6",
  "AgentZero",
  "main",
  "anthropic/claude-opus-5-5",
  "high",
)
const agentOne = agent(
  "01a15d1f-2a2b-72d9-979f-034d4f840245",
  "AgentOne",
  "main",
  "zai/glm-5",
  "medium",
)
const engineering = agent(
  "01a15d1f-2a2d-73cd-a39e-411bc732fb3f",
  "Engineering",
  "orchestrator",
  "anthropic/claude-opus-5-5",
  "high",
)
const research = agent(
  "01a15d1f-2a2f-7396-b56f-a0d97d1017a7",
  "Research",
  "orchestrator",
  "anthropic/claude-sonnet-5-5",
  "medium",
)
const builder = agent(
  "01a15d1f-2a31-70d8-9729-4deffa74724d",
  "Builder",
  "subagent",
  "anthropic/claude-sonnet-5-5",
  "high",
)
const reviewer = agent(
  "01a15d1f-2a36-70db-abd7-fbef67f2d42c",
  "Reviewer",
  "subagent",
  "anthropic/claude-opus-5-5",
  "xhigh",
)
const tester = agent(
  "01a15d1f-2a38-7503-b5df-ac1aa377b75a",
  "Tester",
  "subagent",
  "zai/glm-5",
  "medium",
)

const row = (
  id: string,
  runs: Agent,
  status: Session["status"],
  more?: Partial<Session>,
): SessionRow => ({
  agent: runs,
  session: {
    agentId: runs.id,
    cwd: "/home/dev/zerosdk",
    id,
    status,
    updatedAt: 1792573920000,
    ...more,
  },
})

const issue = (key: string) => ({ key, url: `https://tracker.example.com/${key}` })
const pr = (number: number) => ({
  number,
  url: `https://github.com/nrjdalal/zerosdk/pull/${number}`,
})

// Each session and the agent it runs; a subagent's session nests under the topmost subagent session above it on its parentId chain
const rows: SessionRow[] = [
  row("01a15e51-f919-74d6-b2d8-f9dfbfbd1ce9", agentZero, "running"),
  row("01a15e51-f930-762b-8cfb-0bc612079392", agentOne, "idle"),
  row("01a15e51-f945-7589-829f-79f0d0ecc4a2", engineering, "running"),
  row("01a15e51-f95b-77a4-a86f-1896dbb5acf8", research, "idle"),
  row("01a15e51-f971-7053-a736-1af3665fde44", builder, "running", {
    metadata: { issue: issue("ZS-16"), pr: pr(48), task: "build", title: "Agent page" },
  }),
  row("01a15e51-f987-775c-99f8-c0c2cdcddaaf", builder, "waiting", {
    metadata: { issue: issue("ZS-12"), pr: pr(45), task: "build", title: "Add tools" },
  }),
  row("01a15e51-f99d-72b5-b994-823e1a4385f2", reviewer, "running", {
    metadata: { task: "review" },
    parentId: "01a15e51-f987-775c-99f8-c0c2cdcddaaf",
  }),
  row("01a15e51-f9b0-75d5-9ad6-99eb1416a2e4", tester, "idle", {
    metadata: { task: "test" },
    parentId: "01a15e51-f987-775c-99f8-c0c2cdcddaaf",
  }),
  row("01a15e51-f9c5-7799-9bb2-b4a5ab827f2d", builder, "completed", {
    metadata: { issue: issue("ZS-15"), task: "build", title: "Fix login" },
  }),
]

const thread = (
  id: string,
  title: string,
  status: ThreadRow["status"],
  unread?: number,
  holder = agentZero,
): ThreadRow => ({ agent: holder, id, status, title, unread })

// Most recently updated first, five to a page
const threads: ThreadRow[] = [
  thread("tA1bC2dE", "Rewrite the pricing page copy", "waiting", 2),
  thread("tF3gH4iJ", "Fix the preview deploys", "stuck", 1),
  thread("tK5lM6nO", "Add tools to the agents", "running", 3),
  thread("tP7qR8sT", "Rename the CLI flags", "waiting", 1, agentOne),
  thread("tU9vW1xY", "Fix login", "completed"),
  thread("tZ2aB3cD", "Draft the launch post", "idle"),
  thread("tE4fG5hI", "Pick a pricing model", "completed"),
  thread("tJ6kL7mN", "Write the README", "completed"),
  thread("tO8pQ9rS", "Plan the docs site", "idle"),
  thread("tT1uV2wX", "Add dark mode", "completed"),
  thread("tY3zA4bC", "Add effort icons", "completed"),
  thread("tD5eF6gH", "Copy the provider logos from models.dev", "completed"),
  thread("tI7jK8lM", "Name the human's conversations", "completed"),
  thread("tN9oP1qR", "Link the socials from the navbar", "completed"),
  thread("tS2tU3vW", "Release v0.0.8", "completed"),
  thread("tX4yZ5aB", "Audit the dependencies", "idle"),
  thread("tC6dE7fG", "Set up CI", "completed"),
  thread("tH8iJ9kL", "Check the Twoslash cache in CI", "completed"),
  thread("tM1nO2pQ", "Give the agent its fields", "completed"),
  thread("tR3sT4uV", "Move the agent schema to its package", "completed"),
  thread("tW5xY6zA", "Set up the repo", "completed"),
  thread("tB7cD8eF", "Name the project", "completed"),
]

export function AgentsSidebarDemo() {
  return (
    <SidebarProvider className="min-h-0 w-fit overflow-hidden rounded-xl border">
      <Sidebar collapsible="none">
        <SidebarHeader>
          <AgentsHeader rows={rows} />
        </SidebarHeader>
        <SidebarContent>
          <AgentsNav rows={rows} threads={threads} />
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
