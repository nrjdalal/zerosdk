# Threads in the agents sidebar

- Status: planned
- Links: PR #20 (Thread, Turn and Session in the glossary, [ADR 0004](../../docs/adr/0004-threads-not-sessions.md)) · PR #18 (the agents sidebar)

The agents sidebar on `/docs/ui/sidebar` lists the human's [threads](../../docs/GLOSSARY.md#threads), so the human can pick a thread up again and see which ones have news. "News" is a working name until open question 3 settles it.

## What exists

- `web/next/src/components/agents/sidebar.tsx`: `AgentsHeader` lists the main agents where the docs sidebar keeps search, and `AgentsNav` lists the Orchestrators and Subagents groups, each label ending with a count. One row is selected at a time: `AgentsMenu` keeps the picked id in `pickedAgentIdAtom` (jotai) through its local `selectable` function, and the first main agent is selected until another row is picked.
- `web/next/src/components/agents/icons.ts`: `stateIcons`, the State section of `/docs/ui/icons` (cancelled, completed, failed, idle, paused, pending, running, stuck, waiting).
- `web/next/content/docs/ui/sidebar.mdx`: the live demo in `DocsPreview`, fed by the fake rows in `agents/sidebar-demo.tsx`, then the Sections and Row tables and the Hover and Selection sections.

## Shape

A Threads group joins the nav. Its rows reuse the agent row's parts where they fit: the state icon on the left, the title, and the news at the right, where an agent row shows its provider and effort.

```
+----------------------------------+
| (o) AgentZero          [A]  |||  |  header: main agents
|  z  AgentOne           [Z]  ||   |
+----------------------------------+
| Threads                       3  |
|  T  Pricing page copy         2  |  waiting on the human, 2 new
| (o) Add tools                    |  a turn is running
|  F  Fix login                    |  completed
| Orchestrators                 2  |
| Subagents                     5  |
+----------------------------------+
| LocalAgent                       |  footer: user menu
+----------------------------------+
(o) running   T waiting   F completed   z idle
```

## Steps

1. Add a thread row type to `agents/sidebar.tsx`, beside `AgentRow` and `SubagentRow`: an id, a title, a state, and the news under the name question 3 gives it. It stays a UI type, the way the agent rows' `state` does, and holds no turns.
2. Render the Threads group in `AgentsNav`, its label ending with its count like the other groups, with the same `SidebarMenu` composition and 2px row gap (the `design` skill's sidebar rules).
3. Wire selection as question 6 decides. If threads share the agents' selection, render thread rows through `AgentsMenu` or lift `selectable` out of it, and rename `pickedAgentIdAtom`, whose name and comment then no longer fit.
4. Add fake threads to `agents/sidebar-demo.tsx`, one per state the group shows.
5. Update `/docs/ui/sidebar`: a Threads row in Sections, the thread row's parts in Row, its tooltips in Hover, and its place in Selection. A new icon for news, if one is needed, goes on `/docs/ui/icons` first, as a Remix Fill icon.
6. Extend `tests/web/next/src/components/agents/sidebar.test.ts` for the group, its count and its selection.
7. Review the `design` skill's Sidebars bullet and the `codebase-map` row for the agents sidebar, and update them for any convention, file or export the change adds.
8. Verify `/docs/ui/sidebar` in a real browser, in light and dark and at phone width, with before and after screenshots.

## Open questions

To ask the user one at a time before the build starts. Each has a recommendation.

1. **Where the group sits.** Above Orchestrators, below Subagents, or in place of both while AgentZero is picked. Recommended: above Orchestrators, as threads are what the human comes back for.
2. **Which states a thread shows.** A subset of `stateIcons`, such as running while a turn is worked on, waiting while AgentZero needs the human, stuck, idle and completed. Recommended: reuse the existing icons and add none.
3. **What news is, how it shows, and when it clears.** A count at the right in the shadcn `SidebarMenuBadge`, a dot, or a bold title, cleared when the human opens the thread. Recommended: the badge, as the documented shadcn part and the same place the group counts sit, cleared on open and held in a jotai atom in the demo. Its name goes through the `domain-modeling` skill first, since the glossary has no term for it yet.
4. **What the title's tooltip says.** Recommended: the agent holding the thread, as a subagent row names the agent running it, such as AgentOne: Fix login while a fallback agent stands in.
5. **The order of the rows.** Recommended: most recently updated first. Pinning, which Codex offers, waits for a later change.
6. **What picking a thread selects, and which row is selected first.** One selection across the whole sidebar, or a thread picked beside the agent that holds it; and AgentZero first, as now, or the latest thread. Recommended: one selection across the sidebar, with AgentZero first until a pane exists to show a thread.
7. **A `Thread` schema.** Recommended: none in this change. A schema in `packages/schema` is costly to reverse and needs the nine sources' consensus, so it belongs with the runtime work that gives threads real data.

## Out of scope

The pane that opens a thread, real data, a `Thread` schema, and archiving, forking or pinning threads.
