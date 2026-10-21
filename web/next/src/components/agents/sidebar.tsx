"use client"

import type { Agent } from "@packages/schema/agent"
import type { Session } from "@packages/schema/session"
import {
  RiArchiveFill,
  RiArrowLeftSFill,
  RiArrowRightSFill,
  RiCheckDoubleFill,
  RiDeleteBinFill,
  RiDownload2Fill,
  RiGitBranchFill,
  RiLinksFill,
  RiMailUnreadFill,
  RiMoreFill,
  RiPencilFill,
  RiPushpinFill,
  type RemixiconComponentType,
} from "@remixicon/react"
import { cn } from "cn"
import { atom, useAtom } from "jotai"

import {
  effortIcons,
  providerIcon,
  type SessionTask,
  statusIcons,
  taskIcons,
} from "@/components/agents/icons"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// One session and the agent it runs; the sidebar groups rows by the agent's role, in the order given
export type SessionRow = { agent: Agent; session: Session }

// A subagent's row with the sessions started under it, however deep
type NestedRow = SessionRow & { subagents?: SessionRow[] }

export type ThreadStatus = Extract<
  Session["status"],
  "completed" | "idle" | "running" | "stuck" | "waiting"
>

// A thread: what the human asked as its title, the agent holding it, and how many of its updates the human has not read
export type ThreadRow = {
  agent: Agent
  id: string
  status: ThreadStatus
  title: string
  unread?: number
}

const THREADS_PER_PAGE = 5

// A row's control shows on hover, on keyboard focus, and always on a phone, and the effort icon or unread count it covers hides by the same rules
const controlShown =
  "peer-data-active/menu-button:text-sidebar-accent-foreground md:opacity-0 md:group-hover/menu-item:opacity-100 md:group-has-[:focus-visible]/menu-item:opacity-100"
const coveredHidden =
  "max-md:invisible md:group-hover/menu-item:invisible md:group-has-[:focus-visible]/menu-item:invisible"

// The toggle also shows while its row is open, and a thread's menu while it is open
const toggleShown = cn(controlShown, "group-data-[open]:opacity-100")
const effortHidden = cn(coveredHidden, "group-data-[open]:invisible")
const menuShown = cn(controlShown, "aria-expanded:opacity-100")
const unreadHidden = cn(coveredHidden, "group-has-aria-expanded/menu-item:invisible")

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
  status,
  task,
}: {
  className?: string
  status: Session["status"]
  task?: SessionTask
}) {
  const shown = status === "running" ? task : undefined
  return (
    <IconWithTooltip
      className={className}
      icon={shown ? taskIcons[shown] : statusIcons[status]}
      iconClassName={!shown && status === "running" ? "motion-safe:animate-spin" : undefined}
      label={shown ?? status}
    />
  )
}

const sessionStatus = ({ session }: SessionRow) => ({
  status: session.status,
  task: session.metadata?.task,
})

// A closed row shows the first of its subagents that is running, and its own status once open.
function Status({ row }: { row: NestedRow }) {
  const running = row.subagents?.find((subagent) => subagent.session.status === "running")
  if (!running) return <StatusIcon {...sessionStatus(row)} />
  return (
    <>
      <StatusIcon {...sessionStatus(running)} className="group-data-[open]:hidden" />
      <StatusIcon {...sessionStatus(row)} className="hidden group-data-[open]:inline" />
    </>
  )
}

// A session's title after its issue's key and its pull request's number, as many as it has, e.g. ZS-12#45 Add tools
export function sessionTitle({ metadata }: Session) {
  const issue = metadata?.issue?.key ?? ""
  const pr = metadata?.pr ? `#${metadata.pr.number}` : ""
  return [`${issue}${pr}`, metadata?.title].filter(Boolean).join(" ") || undefined
}

// On hover, a title follows its agent's name, or its description when it has none, and a bare name shows only when the row cuts it short.
function Title({ agent, title }: { agent: Agent; title?: string }) {
  const name = agent.metadata?.name || agent.description
  return (
    <Tooltip
      onOpenChange={(open, details) => {
        const trigger = details.trigger
        if (open && !title && trigger && trigger.scrollWidth <= trigger.clientWidth)
          details.cancel()
      }}
    >
      <TooltipTrigger render={<span className="truncate" />}>{title ?? name}</TooltipTrigger>
      <TooltipContent>
        {/* One span, as the tooltip spaces its children apart */}
        <span>
          {name}
          {title && `: ${title}`}
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

// A subagent's own row is titled by its session; a main agent's, an orchestrator's and a nested row show the agent's name.
function Row({ row, titled }: { row: NestedRow; titled?: boolean }) {
  return (
    <>
      <Status row={row} />
      <Title agent={row.agent} title={titled ? sessionTitle(row.session) : undefined} />
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

function AgentsMenu({
  defaultSelected,
  rows,
  titled,
}: {
  defaultSelected?: string
  rows: NestedRow[]
  titled?: boolean
}) {
  const { selectable, selected } = useSelection(defaultSelected)

  return (
    <SidebarMenu className="space-y-0.5">
      {rows.map((row) =>
        row.subagents ? (
          <Collapsible key={row.session.id} className="group" render={<SidebarMenuItem />}>
            {/* A closed row stands in for its selected subagent, as the arrow never changes the selection */}
            <SidebarMenuButton
              {...selectable(row.session.id)}
              className={cn(
                "group-has-data-[sidebar=menu-action]/menu-item:pr-2 data-active:font-normal",
                row.subagents.some((subagent) => subagent.session.id === selected) &&
                  "group-data-[closed]:bg-sidebar-accent group-data-[closed]:text-sidebar-accent-foreground",
              )}
            >
              <Row row={row} titled={titled} />
            </SidebarMenuButton>
            <CollapsibleTrigger
              render={<SidebarMenuAction className={cn("right-1.5", toggleShown)} />}
            >
              <RiArrowRightSFill className="transition-transform duration-200 group-data-[open]:rotate-90" />
              <span className="sr-only">Toggle</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="mr-0 gap-y-0.5 pr-0 pb-0 pl-2">
                {row.subagents.map((subagent) => (
                  <SidebarMenuSubItem key={subagent.session.id}>
                    <SidebarMenuSubButton
                      {...selectable(subagent.session.id)}
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
          <SidebarMenuItem key={row.session.id}>
            <SidebarMenuButton {...selectable(row.session.id)} className="data-active:font-normal">
              <Row row={row} titled={titled} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ),
      )}
    </SidebarMenu>
  )
}

function count(rows: NestedRow[]): number {
  return rows.reduce((total, row) => total + 1 + (row.subagents?.length ?? 0), 0)
}

const ofRole = (rows: SessionRow[], role: Agent["role"]) =>
  rows.filter((row) => row.agent.role === role)

// Each subagent session under the topmost subagent session above it on its parentId chain, so a subagent's own subagents nest however deep they were started
export function nest(rows: SessionRow[]): NestedRow[] {
  const byId = new Map(rows.map((row) => [row.session.id, row]))
  const top = (row: SessionRow): SessionRow => {
    const parent = row.session.parentId && byId.get(row.session.parentId)
    return parent ? top(parent) : row
  }
  const nested = new Map<SessionRow, SessionRow[]>()
  for (const row of rows) {
    const root = top(row)
    if (root !== row) nested.set(root, [...(nested.get(root) ?? []), row])
  }
  return rows
    .filter((row) => top(row) === row)
    .map((row) => ({ ...row, subagents: nested.get(row) }))
}

// The actions on one thread, in its unread count's place, composed as shadcn's sidebar-07 nav-projects
function ThreadMenu({ row }: { row: ThreadRow }) {
  const { isMobile } = useSidebar()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<SidebarMenuAction className={cn("right-1.5 aria-expanded:bg-muted", menuShown)} />}
      >
        <RiMoreFill />
        <span className="sr-only">More</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-fit"
        side={isMobile ? "bottom" : "right"}
        align={isMobile ? "end" : "start"}
      >
        {row.unread ? (
          <DropdownMenuItem>
            <RiCheckDoubleFill />
            <span>Mark as read</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem>
            <RiMailUnreadFill />
            <span>Mark as unread</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem>
          <RiPencilFill />
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <RiPushpinFill />
          <span>Pin</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <RiGitBranchFill />
          <span>Fork</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <RiDownload2Fill />
          <span>Export transcript</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <RiLinksFill />
          <span>Share link</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <RiArchiveFill />
          <span>Archive</span>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          <RiDeleteBinFill />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
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
              <RiArrowLeftSFill />
            </Button>
            {page + 1}/{pages}
            <Button
              aria-label="Next threads"
              disabled={page === pages - 1}
              onClick={() => setPage(page + 1)}
              size="icon-xs"
              variant="ghost"
            >
              <RiArrowRightSFill />
            </Button>
          </span>
        )}
      </SidebarGroupLabel>
      {/* Five rows tall while it pages, so a short last page moves neither the pager nor the groups below */}
      <SidebarMenu className={cn("space-y-0.5", pages > 1 && "min-h-42")}>
        {rows.slice(page * THREADS_PER_PAGE, (page + 1) * THREADS_PER_PAGE).map((row) => (
          <SidebarMenuItem key={row.id}>
            <SidebarMenuButton {...selectable(row.id)} className="data-active:font-normal">
              <StatusIcon status={row.status} />
              <Title agent={row.agent} title={row.title} />
            </SidebarMenuButton>
            {row.unread ? (
              <SidebarMenuBadge className={cn("right-1.5", unreadHidden)}>
                {row.unread}
              </SidebarMenuBadge>
            ) : null}
            <ThreadMenu row={row} />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AgentsHeader({ rows }: { rows: SessionRow[] }) {
  const mainAgents = ofRole(rows, "main")
  return <AgentsMenu defaultSelected={mainAgents[0]?.session.id} rows={mainAgents} />
}

export function AgentsNav({ rows, threads }: { rows: SessionRow[]; threads: ThreadRow[] }) {
  const orchestrators = ofRole(rows, "orchestrator")
  const subagents = nest(ofRole(rows, "subagent"))
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
        <AgentsMenu rows={subagents} titled />
      </SidebarGroup>
    </>
  )
}
