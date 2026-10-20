import type { Agent } from "@packages/schema/agent"
import type { User } from "better-auth/types"

import {
  type AgentRow,
  AgentsHeader,
  AgentsNav,
  type SubagentRow,
} from "@/components/agents/sidebar"
import { SidebarUserMenu } from "@/components/shell/sidebar-user-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarProvider,
} from "@/components/ui/sidebar"

const agent = (
  id: string,
  name: string,
  role: Agent["role"],
  model: Agent["model"],
  effort: Agent["effort"],
): Agent => ({ effort, id, model, name, role })

const mains: AgentRow[] = [
  {
    agent: agent("aB3dE9fG", "AgentZero", "main", "anthropic/claude-opus-5-5", "high"),
    state: "running",
  },
  { agent: agent("hJ2kL4mN", "AgentOne", "main", "zai/glm-5", "medium"), state: "idle" },
]

const orchestrators: AgentRow[] = [
  {
    agent: agent("pQ5rS7tU", "Engineering", "orchestrator", "anthropic/claude-opus-5-5", "high"),
    state: "running",
  },
  {
    agent: agent("vW8xY1zA", "Research", "orchestrator", "anthropic/claude-sonnet-5-5", "medium"),
    state: "idle",
  },
]

const subagents: SubagentRow[] = [
  {
    agent: agent("uV5wX6yZ", "Builder", "subagent", "anthropic/claude-sonnet-5-5", "high"),
    state: "running",
    task: "build",
    title: "ZS-16#48 Common page",
  },
  {
    agent: agent("cD4eF6gH", "Builder", "subagent", "anthropic/claude-sonnet-5-5", "high"),
    state: "waiting",
    subagents: [
      {
        agent: agent("iJ7kL9mN", "Reviewer", "subagent", "anthropic/claude-opus-5-5", "xhigh"),
        state: "running",
        task: "review",
      },
      {
        agent: agent("oP2qR3sT", "Tester", "subagent", "zai/glm-5", "medium"),
        state: "idle",
        task: "test",
      },
    ],
    task: "build",
    title: "ZS-12#45 Add tools",
  },
  {
    agent: agent("aC8eG1iK", "Builder", "subagent", "anthropic/claude-sonnet-5-5", "high"),
    state: "completed",
    task: "build",
    title: "ZS-15 Fix login",
  },
]

const user: User = {
  createdAt: new Date(0),
  email: "agent@local.host",
  emailVerified: true,
  id: "local-agent",
  name: "LocalAgent",
  updatedAt: new Date(0),
}

export function AgentsSidebarDemo() {
  return (
    <SidebarProvider className="min-h-0 w-fit overflow-hidden rounded-xl border">
      <Sidebar collapsible="none">
        <SidebarHeader>
          <AgentsHeader mains={mains} />
        </SidebarHeader>
        <SidebarContent>
          <AgentsNav orchestrators={orchestrators} subagents={subagents} />
        </SidebarContent>
        {/* The demo's user menu only shows, since its Log out would sign the reader out */}
        <SidebarFooter className="border-t" inert>
          <SidebarMenu>
            <SidebarUserMenu user={user} />
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}
