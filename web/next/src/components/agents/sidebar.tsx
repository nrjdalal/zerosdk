"use client"

import type { Agent } from "@packages/schema/agent"
import { RiArrowRightSLine } from "@remixicon/react"
import { atom, useAtom } from "jotai"

import {
  type AgentState,
  type AgentTask,
  effortIcons,
  providerIcons,
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

export type AgentRun = {
  agent: Agent
  runs?: AgentRun[]
  state: AgentState
  task?: AgentTask
  title?: string
}

// A running run shows its task, any other its state.
function StatusIcon({ className, run }: { className?: string; run: AgentRun }) {
  const label = run.state === "running" && run.task ? run.task : run.state
  const Icon = run.state === "running" && run.task ? taskIcons[run.task] : stateIcons[run.state]
  return (
    <Tooltip>
      <TooltipTrigger render={<span className={className} />}>
        <Icon className={label === "running" ? "size-4 motion-safe:animate-spin" : "size-4"} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

// A collapsed run shows the first of its runs that is running, and its own status once open.
function Status({ run }: { run: AgentRun }) {
  const worker = run.runs?.find((child) => child.state === "running")
  if (!worker) return <StatusIcon run={run} />
  return (
    <>
      <StatusIcon run={worker} className="group-data-[open]:hidden" />
      <StatusIcon run={run} className="hidden group-data-[open]:inline" />
    </>
  )
}

function Provider({ agent }: { agent: Agent }) {
  const Logo = agent.model && providerIcons[agent.model.split("/")[0]]
  if (!Logo) return <span className="ml-auto" />
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="ml-auto" />}>
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
      <TooltipTrigger render={<span className={className} />}>
        <Effort className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{agent.effort}</TooltipContent>
    </Tooltip>
  )
}

// On hover, a run's title follows the name of the agent running it; a bare name shows only when the row cuts it short.
function Title({ run }: { run: AgentRun }) {
  return (
    <Tooltip
      onOpenChange={(open, details) => {
        const title = details.trigger
        if (open && !run.title && title && title.scrollWidth <= title.clientWidth) details.cancel()
      }}
    >
      <TooltipTrigger render={<span className="truncate" />}>
        {run.title ?? run.agent.name}
      </TooltipTrigger>
      <TooltipContent>
        <span>
          {run.agent.name}
          {run.title && `: ${run.title}`}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

function Row({ run }: { run: AgentRun }) {
  return (
    <>
      <Status run={run} />
      <Title run={run} />
      <Provider agent={run.agent} />
      {/* A row with runs gives its effort's place to the toggle whenever the toggle shows */}
      <EffortIcon
        agent={run.agent}
        className={
          run.runs &&
          "group-data-[open]:invisible max-md:invisible md:group-focus-within/menu-item:invisible md:group-hover/menu-item:invisible"
        }
      />
    </>
  )
}

// The selected agent's id, null until one is picked, which leaves the first main agent selected.
const selectedAgentAtom = atom<string | null>(null)

function AgentsMenu({ fallback, runs }: { fallback?: string; runs: AgentRun[] }) {
  const [agent, setAgent] = useAtom(selectedAgentAtom)
  const selected = agent ?? fallback

  return (
    <SidebarMenu className="space-y-0.5">
      {runs.map((run) =>
        run.runs ? (
          <Collapsible key={run.agent.id} className="group" render={<SidebarMenuItem />}>
            <SidebarMenuButton
              isActive={selected === run.agent.id}
              onClick={() => setAgent(run.agent.id)}
              className="group-has-data-[sidebar=menu-action]/menu-item:pr-2 data-active:font-normal"
            >
              <Row run={run} />
            </SidebarMenuButton>
            <CollapsibleTrigger render={<SidebarMenuAction showOnHover className="right-1.5" />}>
              <RiArrowRightSLine className="transition-transform duration-200 group-data-[open]:rotate-90" />
              <span className="sr-only">Toggle</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="mr-0 gap-y-0.5 pr-0 pb-0 pl-2">
                {run.runs.map((child) => (
                  <SidebarMenuSubItem key={child.agent.id}>
                    <SidebarMenuSubButton
                      render={<button type="button" className="w-full" />}
                      isActive={selected === child.agent.id}
                      onClick={() => setAgent(child.agent.id)}
                    >
                      <Row run={child} />
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <SidebarMenuItem key={run.agent.id}>
            <SidebarMenuButton
              isActive={selected === run.agent.id}
              onClick={() => setAgent(run.agent.id)}
              className="data-active:font-normal"
            >
              <Row run={run} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ),
      )}
    </SidebarMenu>
  )
}

// Every agent in the runs, nested ones included.
function count(runs: AgentRun[]): number {
  return runs.reduce((total, run) => total + 1 + count(run.runs ?? []), 0)
}

export function AgentsHeader({ mains }: { mains: AgentRun[] }) {
  return <AgentsMenu fallback={mains[0]?.agent.id} runs={mains} />
}

export function AgentsNav({
  orchestrators,
  subagents,
}: {
  orchestrators: AgentRun[]
  subagents: AgentRun[]
}) {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="pl-2.5">
          Orchestrators
          <span className="ml-auto">{count(orchestrators)}</span>
        </SidebarGroupLabel>
        <AgentsMenu runs={orchestrators} />
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel className="pl-2.5">
          Subagents
          <span className="ml-auto">{count(subagents)}</span>
        </SidebarGroupLabel>
        <AgentsMenu runs={subagents} />
      </SidebarGroup>
    </>
  )
}
