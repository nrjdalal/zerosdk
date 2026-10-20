"use client"

import type { Agent } from "@packages/schema/agent"
import { RiArrowRightSLine, type RemixiconComponentType } from "@remixicon/react"
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

type RowBase = { agent: Agent; state: AgentState }

// A main agent or an orchestrator: a fixed name, no task, nothing nested
export type AgentRow = RowBase & { subagents?: never; task?: never; title?: never }

// A subagent run by another, shown by its agent's name, with nothing nested
export type NestedSubagentRow = RowBase & { subagents?: never; task?: AgentTask; title?: never }

// A subagent: a title of its own, its task, and the subagents it runs
export type SubagentRow = RowBase & {
  subagents?: NestedSubagentRow[]
  task?: AgentTask
  title?: string
}

// The toggle shows on hover, on keyboard focus, while open, and always on a phone, and the effort icon gives it its place
const toggleShown =
  "peer-data-active/menu-button:text-sidebar-accent-foreground group-data-[open]:opacity-100 md:opacity-0 md:group-hover/menu-item:opacity-100 md:group-has-[:focus-visible]/menu-item:opacity-100"
const effortHidden =
  "group-data-[open]:invisible max-md:invisible md:group-hover/menu-item:invisible md:group-has-[:focus-visible]/menu-item:invisible"

function IconWithTooltip({
  className,
  icon: Icon,
  iconClassName,
  label,
}: {
  className?: string
  icon: RemixiconComponentType
  iconClassName?: string
  label: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn("shrink-0", className)} />}>
        <Icon className={cn("size-4", iconClassName)} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function StatusIcon({
  className,
  row,
}: {
  className?: string
  row: Pick<SubagentRow, "state" | "task">
}) {
  const task = row.state === "running" ? row.task : undefined
  return (
    <IconWithTooltip
      className={className}
      icon={task ? taskIcons[task] : stateIcons[row.state]}
      iconClassName={!task && row.state === "running" ? "motion-safe:animate-spin" : undefined}
      label={task ?? row.state}
    />
  )
}

// A closed row shows the first of its subagents that is running, and its own status once open.
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

// On hover, a title follows its agent's name, and a bare name shows only when the row cuts it short.
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

function ProviderIcon({ model }: { model?: string }) {
  const Logo = model && providerIcon(model)
  if (!model || !Logo) return <span className="ml-auto" />
  return <IconWithTooltip className="ml-auto" icon={Logo} label={model} />
}

function EffortIcon({ className, effort }: { className?: string; effort?: Agent["effort"] }) {
  if (!effort) return null
  return <IconWithTooltip className={className} icon={effortIcons[effort]} label={effort} />
}

function Row({ row }: { row: SubagentRow }) {
  return (
    <>
      <Status row={row} />
      <Title row={row} />
      <ProviderIcon model={row.agent.model} />
      <EffortIcon className={row.subagents && effortHidden} effort={row.agent.effort} />
    </>
  )
}

// The id of the agent picked last, null until a row is picked
const pickedAgentIdAtom = atom<string | null>(null)

function AgentsMenu({ defaultSelected, rows }: { defaultSelected?: string; rows: SubagentRow[] }) {
  const [picked, setPicked] = useAtom(pickedAgentIdAtom)
  const selected = picked ?? defaultSelected
  const selectable = (id: string) => ({ isActive: selected === id, onClick: () => setPicked(id) })

  return (
    <SidebarMenu className="space-y-0.5">
      {rows.map((row) =>
        row.subagents ? (
          <Collapsible key={row.agent.id} className="group" render={<SidebarMenuItem />}>
            {/* A closed row stands in for its selected subagent, as the arrow never changes the selection */}
            <SidebarMenuButton
              {...selectable(row.agent.id)}
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
                      {...selectable(subagent.agent.id)}
                      render={<button type="button" className="w-full" />}
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
            <SidebarMenuButton {...selectable(row.agent.id)} className="data-active:font-normal">
              <Row row={row} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ),
      )}
    </SidebarMenu>
  )
}

function count(rows: SubagentRow[]): number {
  return rows.reduce((total, row) => total + 1 + (row.subagents?.length ?? 0), 0)
}

export function AgentsHeader({ mainAgents }: { mainAgents: AgentRow[] }) {
  return <AgentsMenu defaultSelected={mainAgents[0]?.agent.id} rows={mainAgents} />
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
