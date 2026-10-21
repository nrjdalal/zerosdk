import type { Agent } from "@packages/schema/agent"

import {
  type AgentRow,
  AgentsHeader,
  AgentsNav,
  type SubagentRow,
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

const mainAgents: AgentRow[] = [
  {
    agent: agent(
      "01a15d1f-2a28-7709-ab2d-b667e682dce6",
      "AgentZero",
      "main",
      "anthropic/claude-opus-5-5",
      "high",
    ),
    state: "running",
  },
  {
    agent: agent("01a15d1f-2a2b-72d9-979f-034d4f840245", "AgentOne", "main", "zai/glm-5", "medium"),
    state: "idle",
  },
]

const orchestrators: AgentRow[] = [
  {
    agent: agent(
      "01a15d1f-2a2d-73cd-a39e-411bc732fb3f",
      "Engineering",
      "orchestrator",
      "anthropic/claude-opus-5-5",
      "high",
    ),
    state: "running",
  },
  {
    agent: agent(
      "01a15d1f-2a2f-7396-b56f-a0d97d1017a7",
      "Research",
      "orchestrator",
      "anthropic/claude-sonnet-5-5",
      "medium",
    ),
    state: "idle",
  },
]

const subagents: SubagentRow[] = [
  {
    agent: agent(
      "01a15d1f-2a31-70d8-9729-4deffa74724d",
      "Builder",
      "subagent",
      "anthropic/claude-sonnet-5-5",
      "high",
    ),
    state: "running",
    task: "build",
    title: "ZS-16#48 Common page",
  },
  {
    agent: agent(
      "01a15d1f-2a34-7641-aa32-003fe284870e",
      "Builder",
      "subagent",
      "anthropic/claude-sonnet-5-5",
      "high",
    ),
    state: "waiting",
    subagents: [
      {
        agent: agent(
          "01a15d1f-2a36-70db-abd7-fbef67f2d42c",
          "Reviewer",
          "subagent",
          "anthropic/claude-opus-5-5",
          "xhigh",
        ),
        state: "running",
        task: "review",
      },
      {
        agent: agent(
          "01a15d1f-2a38-7503-b5df-ac1aa377b75a",
          "Tester",
          "subagent",
          "zai/glm-5",
          "medium",
        ),
        state: "idle",
        task: "test",
      },
    ],
    task: "build",
    title: "ZS-12#45 Add tools",
  },
  {
    agent: agent(
      "01a15d1f-2a3a-7292-ab64-ea9bd95c5162",
      "Builder",
      "subagent",
      "anthropic/claude-sonnet-5-5",
      "high",
    ),
    state: "completed",
    task: "build",
    title: "ZS-15 Fix login",
  },
]

const [agentZero, agentOne] = mainAgents.map((row) => row.agent) as [Agent, Agent]

const thread = (
  id: string,
  title: string,
  state: ThreadRow["state"],
  unread?: number,
  holder = agentZero,
): ThreadRow => ({ agent: holder, id, state, title, unread })

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
          <AgentsHeader mainAgents={mainAgents} />
        </SidebarHeader>
        <SidebarContent>
          <AgentsNav orchestrators={orchestrators} subagents={subagents} threads={threads} />
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
