"use client"

import type { Agent } from "@packages/schema/agent"
import { RiArrowRightSLine } from "@remixicon/react"
import { cn } from "cn"
import { atom, useAtom } from "jotai"

import {
  type AgentState,
  type AgentTask,
  effortIcons,
  providerIcon,
  stateIcons,
  taskIcons,
} from "@/components/agents/icons"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// A main agent or an orchestrator: a fixed name, nothing nested
export type AgentRow = { agent: Agent; state: AgentState }

// A subagent: a title of its own, its task, and the subagents it runs
export type SubagentRow = AgentRow & { subagents?: SubagentRow[]; task?: AgentTask; title?: string }

// The toggle shows on hover, on keyboard focus, while open, and always on a phone, and the effort icon gives it its place
const toggleShown =
  "peer-data-active/menu-button:text-sidebar-accent-foreground group-data-[open]:opacity-100 md:opacity-0 md:group-hover/menu-item:opacity-100 md:group-has-[:focus-visible]/menu-item:opacity-100"
const effortHidden =
  "group-data-[open]:invisible max-md:invisible md:group-hover/menu-item:invisible md:group-has-[:focus-visible]/menu-item:invisible"

function StatusIcon({ className, row }: { className?: string; row: SubagentRow }) {
  const task = row.state === "running" ? row.task : undefined
  const Icon = task ? taskIcons[task] : stateIcons[row.state]
  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn("shrink-0", className)} />}>
        <Icon
          className={task || row.state !== "running" ? "size-4" : "size-4 motion-safe:animate-spin"}
        />
      </TooltipTrigger>
      <TooltipContent>{task ?? row.state}</TooltipContent>
    </Tooltip>
  )
}

// A collapsed row shows the first of its subagents that is running, and its own status once open.
function Status({ row }: { row: SubagentRow }) {
  const running = row.subagents?.find((subagent) => subagent.state === "running")
  if (!running) return <StatusIcon row={row} />
  return (
    <>
      <StatusIcon row={running} className="group-data-[open]:hidden" />
      <StatusIcon row={row} className="hidden group-data-[open]:inline" />
    </>
  )
}

// On hover, a title follows the agent's name, and a bare name shows only when the row cuts it short.
function Title({ row }: { row: SubagentRow }) {
  return (
    <Tooltip
      onOpenChange={(open, details) => {
        const trigger = details.trigger
        if (open && !row.title && trigger && trigger.scrollWidth <= trigger.clientWidth)
          details.cancel()
      }}
    >
      <TooltipTrigger render={<span className="truncate" />}>
        {row.title ?? row.agent.name}
      </TooltipTrigger>
      <TooltipContent>
        {/* One span, as the tooltip spaces its children apart */}
        <span>
          {row.agent.name}
          {row.title && `: ${row.title}`}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

function ProviderIcon({ agent }: { agent: Agent }) {
  const Logo = agent.model && providerIcon(agent.model)
  if (!Logo) return <span className="ml-auto" />
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="ml-auto shrink-0" />}>
        <Logo className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{agent.model}</TooltipContent>
    </Tooltip>
  )
}

function EffortIcon({ agent, className }: { agent: Agent; className?: string }) {
  if (!agent.effort) return null
  const Effort = effortIcons[agent.effort]
  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn("shrink-0", className)} />}>
        <Effort className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{agent.effort}</TooltipContent>
    </Tooltip>
  )
}

function Row({ row }: { row: SubagentRow }) {
  return (
    <>
      <Status row={row} />
      <Title row={row} />
      <ProviderIcon agent={row.agent} />
      <EffortIcon agent={row.agent} className={row.subagents && effortHidden} />
    </>
  )
}

// The selected agent's id, null until one is picked, which leaves the first main agent selected.
const selectedAgentAtom = atom<string | null>(null)

function AgentsMenu({ fallback, rows }: { fallback?: string; rows: SubagentRow[] }) {
  const [agent, setAgent] = useAtom(selectedAgentAtom)
  const selected = agent ?? fallback

  return (
    <SidebarMenu className="space-y-0.5">
      {rows.map((row) =>
        row.subagents ? (
          <Collapsible key={row.agent.id} className="group" render={<SidebarMenuItem />}>
            {/* A closed row stands in for its selected subagent, as the arrow never changes the selection */}
            <SidebarMenuButton
              isActive={selected === row.agent.id}
              onClick={() => setAgent(row.agent.id)}
              className={cn(
                "group-has-data-[sidebar=menu-action]/menu-item:pr-2 data-active:font-normal",
                row.subagents.some((subagent) => subagent.agent.id === selected) &&
                  "group-data-[closed]:bg-sidebar-accent group-data-[closed]:text-sidebar-accent-foreground",
              )}
            >
              <Row row={row} />
            </SidebarMenuButton>
            <CollapsibleTrigger
              render={<SidebarMenuAction className={cn("right-1.5", toggleShown)} />}
            >
              <RiArrowRightSLine className="transition-transform duration-200 group-data-[open]:rotate-90" />
              <span className="sr-only">Toggle</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="mr-0 gap-y-0.5 pr-0 pb-0 pl-2">
                {row.subagents.map((subagent) => (
                  <SidebarMenuSubItem key={subagent.agent.id}>
                    <SidebarMenuSubButton
                      render={<button type="button" className="w-full" />}
                      isActive={selected === subagent.agent.id}
                      onClick={() => setAgent(subagent.agent.id)}
                    >
                      <Row row={subagent} />
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <SidebarMenuItem key={row.agent.id}>
            <SidebarMenuButton
              isActive={selected === row.agent.id}
              onClick={() => setAgent(row.agent.id)}
              className="data-active:font-normal"
            >
              <Row row={row} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ),
      )}
    </SidebarMenu>
  )
}

function count(rows: SubagentRow[]): number {
  return rows.reduce((total, row) => total + 1 + count(row.subagents ?? []), 0)
}

export function AgentsHeader({ mains }: { mains: AgentRow[] }) {
  return <AgentsMenu fallback={mains[0]?.agent.id} rows={mains} />
}

export function AgentsNav({
  orchestrators,
  subagents,
}: {
  orchestrators: AgentRow[]
  subagents: SubagentRow[]
}) {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="pl-2.5">
          Orchestrators
          <span className="ml-auto">{count(orchestrators)}</span>
        </SidebarGroupLabel>
        <AgentsMenu rows={orchestrators} />
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel className="pl-2.5">
          Subagents
          <span className="ml-auto">{count(subagents)}</span>
        </SidebarGroupLabel>
        <AgentsMenu rows={subagents} />
      </SidebarGroup>
    </>
  )
}
