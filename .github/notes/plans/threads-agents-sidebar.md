# Threads in the agents sidebar

- Status: in progress (the mockup is built; real data is next)
- Links: PR #20 (Thread, Turn and Session in the glossary, [ADR 0004](../../docs/adr/0004-threads-not-sessions.md)) · PR #18 (the agents sidebar) · PR #25 (the mockup) · branch `feat/thread-menu` (the row menu)

The agents sidebar on `/docs/ui/sidebar` lists the human's [threads](../../docs/GLOSSARY.md#threads), so the human can pick a thread up again and see which ones have unread updates. The human only talks to AgentZero, the work behind a thread spreads across orchestrators and subagents, and what the human asked is what gets buried when they come back later; the sidebar and the thread view below keep it in sight.

## Decided

1. **Where the group sits:** above Orchestrators.
2. **Which statuses a thread shows:** running, waiting, stuck, idle and completed, from `stateIcons`, with no new icon.
3. **Unread:** a count in the shadcn `SidebarMenuBadge`, nothing once all are read. Named `unread` after the sources: Codex shows "an unread indicator" and offers "Mark all as read", and Claude Code's sessions list marks a session unread; a general UI word, so no glossary entry.
4. **The title's tooltip:** the agent holding the thread, such as AgentOne: Rename the CLI flags while it stands in. The title is what the human asked and no update changes it.
5. **Order and paging:** most recently updated first, five to a page, with an arrow on each side of the page number in the group label and no pager at five or fewer. The list keeps five rows' height while it pages.
6. **Selection:** one across the sidebar, threads included; AgentZero first until a pane exists to show a thread.
7. **No `Thread` schema** in the mockup: `ThreadRow` is a UI type, as the agent rows' `state` is.
8. **The row menu:** a ⋯ in the unread count's place on hover, composed as shadcn sidebar-07's `nav-projects`. It holds Mark as read or unread, Rename, Pin and Fork; Export transcript and Share link; Archive and Delete. Picked from the nine sources: Rename 6/9, Delete 6/9, Fork 6/9, Pin 3/9, Mark as read or unread 3/9, Export 3/9, Archive 2/9 and Share 2/9. Recap (3/9) is left out, as the thread view opens on what the human asked and what they have not read. Run controls (Stop 9/9, Compact 7/9, Rewind 5/9, Set model 5/9) belong to the thread view, not the row. Transcript, like unread, is a general UI word, so no glossary entry. Open for the human: on a phone the menu always shows, so the count does not; showing both side by side is the alternative.

## Built (the mockup)

- `web/next/src/components/agents/sidebar.tsx`: `ThreadRow` and `ThreadState`, the Threads group in `AgentsNav`, and `useSelection` over `pickedRowIdAtom` (renamed from `pickedAgentIdAtom`), shared by agents and threads.
- `web/next/src/components/agents/sidebar-demo.tsx`: 22 fake threads, five pages, one held by AgentOne.
- `/docs/ui/sidebar`: the Threads row in Sections, a Threads section, and the thread rules in Hover and Selection.
- `ThreadMenu` in `sidebar.tsx`: the row menu, its items inert until real data.
- `tests/web/next/src/components/agents/sidebar.test.ts`: the group's place, its paging, its unread badges, its absence with no threads, and each row's menu.

## Left for real data

- **Order while paging:** threads update live, so a thread on page 2 can jump to page 1 under the human. Keep the order of the moment the human leaves the first page until they return to it, and bring the page back within range when the list shrinks below it; the mockup's data is static, so it pages the order it is given.
- **Unread** is per human and per thread: it needs a read marker stored with the human, cleared on opening the thread, and live updates to raise the count.
- **The menu's actions**, each wired to the thread once it has a store: Rename and Delete edit it, Pin and Archive move it out of the paged order, and Fork starts a new thread from it.
- **A `Thread` schema** in `packages/schema`, chosen by the nine sources' consensus with the runtime work that gives threads real data; `ThreadRow` then maps from it.
- **The thread view**, which opens on what the human asked, then what they have not read, then a reply to AgentZero, with the full history collapsed:

```
┌ Pricing page copy ──────────────────────────────── ◷ waiting on you ┐
│ YOU ASKED · 2h ago                                                   │
│ "Rewrite the pricing page copy for the three tiers, keep it short"  │
├──────────────────────────────────────────────────────────────────────┤
│ UNREAD  (2)                                                          │
│ ⚑ Research: competitor scan done, 5 pages compared        40m ago   │
│ ◷ AgentZero: tone A (playful) or B (plain)?               10m ago   │
├──────────────────────────────────────────────────────────────────────┤
│ ▸ Full history · 6 turns                                             │
├──────────────────────────────────────────────────────────────────────┤
│ Reply to AgentZero in this thread…                              ⏎   │
└──────────────────────────────────────────────────────────────────────┘
```
