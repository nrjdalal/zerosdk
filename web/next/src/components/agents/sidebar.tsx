"use client"

import type { Agent } from "@packages/schema/agent"
import { RiArrowLeftSLine, RiArrowRightSLine, type RemixiconComponentType } from "@remixicon/react"
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
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
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

export type ThreadState = Extract<
  AgentState,
  "completed" | "idle" | "running" | "stuck" | "waiting"
>

// A thread: what the human asked as its title, the agent holding it, and how many of its updates the human has not read
export type ThreadRow = {
  agent: Agent
  id: string
  state: ThreadState
  title: string
  unread?: number
}

const THREADS_PER_PAGE = 5

// The toggle shows on hover, on keyboard focus, while open, and always on a phone, and the effort icon gives it its place
const toggleShown =
  "peer-data-active/menu-button:text-sidebar-accent-foreground group-data-[open]:opacity-100 md:opacity-0 md:group-hover/menu-item:opacity-100 md:group-has-[:focus-visible]/menu-item:opacity-100"
const effortHidden =
  "group-data-[open]:invisible max-md:invisible md:group-hover/menu-item:invisible md:group-has-[:focus-visible]/menu-item:invisible"

// A group's count is as wide as the effort icons below and centered on them
const countCell = "ml-auto flex w-4 justify-center"

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
function Title({ row }: { row: Pick<SubagentRow, "agent" | "title"> }) {
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

// The id of the row picked last, an agent's or a thread's, null until a row is picked
const pickedRowIdAtom = atom<string | null>(null)

// The Threads group's page, counted from 0
const threadsPageAtom = atom(0)

// One selection across the sidebar: the row picked last, or the default until one is
function useSelection(defaultSelected?: string) {
  const [picked, setPicked] = useAtom(pickedRowIdAtom)
  const selected = picked ?? defaultSelected
  const selectable = (id: string) => ({ isActive: selected === id, onClick: () => setPicked(id) })
  return { selectable, selected }
}

function AgentsMenu({ defaultSelected, rows }: { defaultSelected?: string; rows: SubagentRow[] }) {
  const { selectable, selected } = useSelection(defaultSelected)

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

function Threads({ rows }: { rows: ThreadRow[] }) {
  const [page, setPage] = useAtom(threadsPageAtom)
  const { selectable } = useSelection()
  const pages = Math.ceil(rows.length / THREADS_PER_PAGE)

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="pl-2.5">
        Threads
        {pages > 1 && (
          // Pulled right so the next arrow centers on the effort icons' center, as the counts below do
          <span className="-mr-1 ml-auto flex items-center gap-1 tabular-nums">
            <Button
              aria-label="Previous threads"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              size="icon-xs"
              variant="ghost"
            >
              <RiArrowLeftSLine />
            </Button>
            {page + 1}/{pages}
            <Button
              aria-label="Next threads"
              disabled={page === pages - 1}
              onClick={() => setPage(page + 1)}
              size="icon-xs"
              variant="ghost"
            >
              <RiArrowRightSLine />
            </Button>
          </span>
        )}
      </SidebarGroupLabel>
      {/* Five rows tall while it pages, so a short last page moves neither the pager nor the groups below */}
      <SidebarMenu className={cn("space-y-0.5", pages > 1 && "min-h-42")}>
        {rows.slice(page * THREADS_PER_PAGE, (page + 1) * THREADS_PER_PAGE).map((row) => (
          <SidebarMenuItem key={row.id}>
            {/* Room for the badge, as the menu button keeps it only for an action */}
            <SidebarMenuButton
              {...selectable(row.id)}
              className="group-has-data-[sidebar=menu-badge]/menu-item:pr-8 data-active:font-normal"
            >
              <StatusIcon row={row} />
              <Title row={row} />
            </SidebarMenuButton>
            {row.unread ? (
              <SidebarMenuBadge className="right-1.5">{row.unread}</SidebarMenuBadge>
            ) : null}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AgentsHeader({ mainAgents }: { mainAgents: AgentRow[] }) {
  return <AgentsMenu defaultSelected={mainAgents[0]?.agent.id} rows={mainAgents} />
}

export function AgentsNav({
  orchestrators,
  subagents,
  threads,
}: {
  orchestrators: AgentRow[]
  subagents: SubagentRow[]
  threads: ThreadRow[]
}) {
  return (
    <>
      {threads.length > 0 && <Threads rows={threads} />}
      <SidebarGroup>
        <SidebarGroupLabel className="pl-2.5">
          Orchestrators
          <span className={countCell}>{count(orchestrators)}</span>
        </SidebarGroupLabel>
        <AgentsMenu rows={orchestrators} />
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel className="pl-2.5">
          Subagents
          <span className={countCell}>{count(subagents)}</span>
        </SidebarGroupLabel>
        <AgentsMenu rows={subagents} />
      </SidebarGroup>
    </>
  )
}
