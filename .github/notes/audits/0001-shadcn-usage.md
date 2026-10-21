# shadcn usage audit, 2026-10-20

This audit checks each shadcn component the web app uses against shadcn's primary demo, its documented variants and sizes, and the nesting in its named examples and blocks. It covered three scopes:

- the sidebar family, collapsible, dropdown menu, tooltip, sheet, separator, kbd, command and popover;
- button, input, field, select, checkbox, dialog, alert dialog, tabs, badge and avatar;
- toast, empty, spinner, table, item and the data table family.

All of `components/ui` matches the base-nova registry. The exceptions are the CLI's Remix icon resolution and the patches in `.github/scripts/shadcn-customize.ts`: `SidebarTrigger` children, Button render wiring, the Checkbox indeterminate glyph and Spinner typing. So the findings are about usage, not the primitives.

Below are the deviations with no recorded reason, and those whose recorded reason does not hold. Paths start at `web/next/src/`. "Low" marks a low-priority finding. The kept deviations, with their reasons, are in `.agents/skills/design/shadcn.md`. Delete this file once every finding is fixed, or kept and recorded there.

## Findings

### Across components

- **Line icons across the app.** Our rule is the `*Fill` twin of every icon (see the top of `shadcn.md`). `rg -n -o "Ri[A-Za-z0-9]+Line\b" web/next/src --glob '!**/components/ui/**'` finds 78 matches, imports and uses, of 29 icons in 15 files. That count leaves out `components/agents/sidebar.tsx`, which is all Fill already. Every one has a Fill twin in `@remixicon/react` 4.9.0, so none needs a substitute:
  - `app/(console)/console/(access)/allowlist/components/data-columns.tsx`: `RiMoreLine`
  - `app/(console)/console/(access)/users/components/data-columns.tsx`: `RiMoreLine`
  - `app/(console)/console/activity/components/data-columns.tsx`: `RiMoreLine`
  - `app/(console)/console/waitlist/components/data-columns.tsx`: `RiMoreLine`
  - `components/common/devtools.tsx`: `RiCodeLine`
  - `components/common/mode-toggle.tsx`: `RiMoonLine`, `RiSunLine`
  - `components/common/navbar.tsx`: `RiArrowRightUpLine`, `RiMenuLine`
  - `components/common/route-error.tsx`: `RiRefreshLine`
  - `components/console/sidebar.tsx`: `RiBookLine`, `RiDashboardLine`, `RiGroupLine`, `RiHistoryLine`, `RiMailLine`, `RiShieldKeyholeLine`
  - `components/dashboard/sidebar.tsx`: `RiAddLine`, `RiBookLine`, `RiBuildingLine`
  - `components/data-table.tsx`: `RiAddCircleLine`, `RiArrowDownLine`, `RiArrowUpLine`, `RiCheckLine`, `RiCloseLine`, `RiEqualizerLine`, `RiExpandUpDownLine`
  - `components/docs/copy-as-markdown.tsx`: `RiCheckLine`, `RiFileCopyLine`
  - `components/docs/sidebar.tsx`: `RiArrowRightSLine`, `RiSearchLine`
  - `components/shell/sidebar-dropdown-menu.tsx`: `RiExpandUpDownLine`
  - `components/shell/sidebar-user-menu.tsx`: `RiArrowRightSLine`, `RiDashboardLine`, `RiHome4Line`, `RiLogoutBoxLine`, `RiMessage2Line`, `RiTerminalBoxLine`

  No icon outside `components/ui` is a Fill-less editor icon such as `RiLink`. **Fix:** switch each one to its `*Fill` twin. Some twins change shape, not only weight: `RiArrowRightSFill` and `RiExpandUpDownFill` are solid triangles where the Line icons are chevrons, while `RiCheckFill` draws the same path as `RiCheckLine`. Check each swap in the browser.

  Generated components hard-code 91 matches of 16 Line icons in 23 files under `components/ui/`. Each has a Fill twin. Change them through `.github/scripts/shadcn-customize.ts`, never by hand, as the sync re-scaffolds `ui/`:
  - `accordion.tsx`: `RiArrowDownSLine`, `RiArrowUpSLine`
  - `breadcrumb.tsx`: `RiArrowRightSLine`, `RiMoreLine`
  - `calendar.tsx`: `RiArrowDownSLine`, `RiArrowLeftSLine`, `RiArrowRightSLine`
  - `carousel.tsx`: `RiArrowLeftSLine`, `RiArrowRightSLine`
  - `checkbox.tsx`: `RiCheckLine`, `RiSubtractLine`
  - `combobox.tsx`: `RiArrowDownSLine`, `RiCheckLine`, `RiCloseLine`
  - `command.tsx`: `RiCheckLine`, `RiSearchLine`
  - `context-menu.tsx`: `RiArrowRightSLine`, `RiCheckLine`
  - `dialog.tsx`: `RiCloseLine`
  - `dropdown-menu.tsx`: `RiArrowRightSLine`, `RiCheckLine`
  - `input-otp.tsx`: `RiSubtractLine`
  - `menubar.tsx`: `RiCheckLine`
  - `message-scroller.tsx`: `RiArrowDownLine`
  - `native-select.tsx`: `RiArrowDownSLine`
  - `navigation-menu.tsx`: `RiArrowDownSLine`
  - `pagination.tsx`: `RiArrowLeftSLine`, `RiArrowRightSLine`, `RiMoreLine`
  - `questionnaire.tsx`: `RiCheckLine`
  - `select.tsx`: `RiArrowDownSLine`, `RiArrowUpSLine`, `RiCheckLine`
  - `sheet.tsx`: `RiCloseLine`
  - `sidebar.tsx`: `RiSideBarLine`
  - `spinner.tsx`: `RiLoaderLine`
  - `toast.tsx`: `RiCheckboxCircleLine`, `RiCloseCircleLine`, `RiCloseLine`, `RiErrorWarningLine`, `RiInformationLine`, `RiLoaderLine`
  - `trace.tsx`: `RiArrowRightSLine`

  **Fix:** add a Line-to-Fill rewrite of `ui/` to `shadcn-customize.ts`. The script itself names Line icons: `patchCheckbox()` injects `RiCheckLine` and `RiSubtractLine`, and `patchSidebar()` finds `RiSideBarLine` by name. Move those to the Fill names in the same change. The design skill's Loading rule names `RiLoaderLine` too.

### Alert dialog

- **`components/common/confirm-dialog.tsx:46-50`, `preventDefault` in `AlertDialogAction`'s `onClick` (reason does not hold, low).** The comment says the dialog would close on click. In base-nova, `AlertDialogAction` is a plain `Button`, not a `Close`, so it never closes the dialog; only `AlertDialogCancel` does. The comment is a Radix carry-over. **Fix:** drop the `preventDefault` and the comment, or keep it as a guard and say so.

### Avatar

- **`app/waitlist/page.tsx:43, 46, 49`, `Avatar className="size-7"`.** `size-7` is no documented size (`sm` is `size-6`, the default `size-8`). **Fix toward shadcn:** `size="sm"` or the default, and resize the `h-7` slot at `:39` to match.
- **`app/waitlist/page.tsx:44, 47, 50`, `AvatarFallback className="bg-chart-N text-xs text-white"`.** `text-xs` is automatic at `size="sm"`. `text-white` is a raw palette color, against the design skill's "Semantic tokens only". The `bg-chart-*` tint is a documented custom color, as in `badge-colors`. **Fix:** drop `text-xs` with the `size="sm"` move. For `text-white`, use a foreground token, or keep it and record the decorative avatars as an exception in the design skill.
- **`components/shell/sidebar-user-menu.tsx:44-46`, `Avatar className="size-8 rounded-md after:hidden"`, with `rounded-md` on the image and fallback.** `size-8` is the default. The square avatar recreates the old new-york `nav-user`; base `sidebar-07` `nav-user` uses a bare round `Avatar`. **Fix:** drop `size-8`. Then go bare as shadcn does, or keep the square to match the OrgSwitcher's tile and record that in the design skill.

### Badge

- **`components/shell/sidebar-shell.tsx:48`, `Badge variant="secondary" className="text-xs"` (low).** The base `badgeVariants` is already `text-xs`. **Fix toward shadcn:** drop the class.

### Button

- **`components/common/route-not-found.tsx:36`, `Button render={<Link />}`.** Base UI's Button sets `role="button"`, so the link announces as a button. shadcn's docs forbid this and use `buttonVariants` on the link. **Fix toward shadcn:** `<Link className={buttonVariants({ variant: "outline" })}>`.
- **`components/common/navbar.tsx:95-100, 239-246`, `Button role="link"` rendering `<Link>` and `<a>`.** Nothing records why it patches the role instead of following shadcn's "As Link" rule. **Fix toward shadcn:** `buttonVariants({ variant, size, className })` on the `Link` or `a`, with no `role`. Reword the design skill's Cursor bullet from "a Button rendered as `<Link>` or `<a>`" to "a link styled with `buttonVariants`".
- **`components/common/mode-toggle.tsx:28-31`, `size="sm" className="size-8 [&_svg]:size-4!"`.** That is exactly `size="icon"`. **Fix toward shadcn:** `size="icon"`, no class.
- **`components/docs/copy-as-markdown.tsx:51-55, 59`, `size="icon-sm" className="ml-1 size-8"`, with `size-4` on its icons.** It overrides `icon-sm`'s `size-7` back to `size-8` but keeps the smaller radius, and `size-4` is the default svg size. **Fix toward shadcn:** `size="icon" className="ml-1"`, and drop the icon classes.
- **No `data-icon` on an icon or spinner beside text.** At `components/common/route-error.tsx:36`, `components/data-table.tsx:765, 795, 842`, `components/common/access.tsx:148, 190, 215`, `components/dashboard/sidebar.tsx:219` and `components/common/navbar.tsx:248`. shadcn's Button, Badge and Spinner docs ask for it, and the Button's tighter padding keys off it. **Fix toward shadcn:** add `data-icon="inline-start"` (`"inline-end"` for Reset at `data-table.tsx:765`), and add a line to the design skill's Icons rule.
- **`components/common/access.tsx:190, 215`, provider icons at `size-5`.** The design skill says `size-4` inside buttons, and the icon swaps with a `size-4` Spinner, so the content jumps 4px. **Fix:** drop the class.
- **`components/common/access.tsx:141-146` and `components/dashboard/sidebar.tsx:213-216`, a `variant="secondary" className="w-full"` submit.** login-05 and shadcn's form demos submit with the default variant. **Fix toward shadcn:** the default variant, placed as the Field and Dialog findings below say.
- **`components/common/access.tsx:142`, `form="email"` on a button inside `<form id="email">` (low).** shadcn uses `form=` only for a button outside its form. **Fix:** drop it.
- **`app/waitlist/page.tsx:159-166`, the hero button at `size="lg" className="h-12 w-full px-6 text-base sm:w-auto"`, and its Input at `:146` (low).** No shadcn size reaches `h-12`. A marketing hero is a fair exception, like the design skill's `Eyebrow` pill. **Keep, and justify:** record it in the design skill's Components section.

### Collapsible

- **`components/docs/sidebar.tsx:131-133`, both `open`/`onOpenChange` and `defaultOpen={active}`.** Base UI ignores `defaultOpen` when `open` is set. **Fix toward shadcn:** drop `defaultOpen`, or go uncontrolled per the design skill's State rule, which then has to replace the `useEffect` at `:122-124` that opens it on navigation.
- **`components/agents/sidebar.tsx:218` and `components/docs/sidebar.tsx:134`, an unnamed `group` (reason does not cover nesting, low).** The design skill's State rule explains `group-data-[open]:`. But a group variant matches any ancestor, so a nested `NavTreeGroup` would rotate a closed inner chevron under an open outer group. The docs nav is flat today, so the bug is latent. **Fix toward shadcn:** scope the chevron to its trigger, as `collapsible-file-tree` and `collapsible-basic` do.

### Data table

- **Row-action triggers at `size="icon-sm"` (low).** At `app/(console)/console/(access)/allowlist/components/data-columns.tsx:96`, `app/(console)/console/(access)/users/components/data-columns.tsx:136`, `app/(console)/console/waitlist/components/data-columns.tsx:73` and `app/(console)/console/activity/components/data-columns.tsx:91`. shadcn disagrees with itself: the base demo uses `icon-xs`, `table-actions` uses `size-8`, and the guide `h-8 w-8 p-0`. **Keep, and justify:** it is a documented size; record the choice in the design skill's Data tables section.
- **A destructive row action shares a group with the copy actions, with no separator.** At `app/(console)/console/(access)/allowlist/components/data-columns.tsx:106-108`, `app/(console)/console/waitlist/components/data-columns.tsx:83-85` and `app/(console)/console/(access)/users/components/data-columns.tsx:155-160`. `table-actions`, `dropdown-menu-destructive` and the base demo put it after a `DropdownMenuSeparator`. **Fix toward shadcn:** close the first group after the copy items, add the separator, and put Remove, Ban or Unban in a second group.
- **`components/data-table.tsx:587-596`, an inline error row once rows exist (low).** The guide has no counterpart, and no comment covers this markup. An `Empty` would be wrong there, as the table is not empty. **Keep, and justify:** add a one-line comment.

### Dialog

- **`components/common/access.tsx:93`, `DialogContent className="max-w-md"` (reason does not hold).** The design skill's Dialogs rule says the auth dialog uses `max-w-md`. But `cn` merges it into `sm:max-w-sm ... max-w-md`: at `sm` and up the dialog stays `max-w-sm`, and below `sm` it loses the `max-w-[calc(100%-2rem)]` gutter and runs edge to edge. **Fix toward shadcn:** `sm:max-w-md`, as in `dialog-close-button`, and update the Dialogs rule to match.
- **`components/common/access.tsx:93`, `initialFocus={false}`.** In no shadcn example, with no comment. It stops focus moving into the modal. **Fix toward shadcn:** remove it, or comment it if it keeps a phone's keyboard down.
- **`components/common/access.tsx:94-96, 105`, an `sr-only` `DialogHeader` (its title `text-center`) beside a visible `<h1>`.** That is a hidden title, a dead class and a second `<h1>`, against the design skill's "Exactly one `<h1>` per page". The `<h1>` comes from login-05, which is a page. **Fix toward shadcn:** make the visible heading the `DialogTitle` inside `DialogHeader`, and drop the hidden header and the `<h1>`.
- **`components/dashboard/sidebar.tsx:181-222`, the create-org dialog.** The form is `space-y-4`, against the design skill's Forms rule ("no second `space-y-*`"). It has no `DialogFooter` and no Cancel, an unused `id="create-org"`, and a full-width secondary submit. **Fix toward shadcn:** copy the allowlist's `AddRuleDialog`: `DialogContent render={<form />}`, `DialogHeader`, `FieldGroup`, then `DialogFooter` with an outline `DialogClose` and `<Button type="submit">`.

### Dropdown menu

- **`components/shell/sidebar-dropdown-menu.tsx:68-76`, `ml-3`, `mt-1` or `mb-1` on top of `sideOffset={4}`, and `w-(--anchor-width)`.** shadcn sets the gap with `sideOffset` alone, and `w-(--anchor-width)` is already base-nova's default. **Fix toward shadcn:** fold the margins into `sideOffset` (for example `sideOffset={isMobile ? 8 : 16}`) and drop the width.
- **`components/shell/sidebar-user-menu.tsx:58, 64`, a trailing `ml-auto` chevron inside items (low).** shadcn puts a trailing hint in `DropdownMenuShortcut`, and a trailing icon appears only as a check. **Fix:** drop it, or keep it and record it as the "navigates away" affordance.

### Empty

- **`components/data-table.tsx:576-580` and `components/blog/post-list.tsx:12-16`, an `EmptyTitle` with no `EmptyDescription` (low).** Every shadcn example pairs the two. **Fix toward shadcn:** add a one-line description, such as "No rows match the search or filters."
- **`components/blog/post-list.tsx:12`, `Empty className="not-prose"` (low).** No comment. The list renders inside MDX prose, which would restyle the primitive. **Keep, and justify:** add a one-line comment.

### Field

- **`components/common/access.tsx:110, 141`, the form adds `flex flex-col gap-4` and the submit sits outside `FieldGroup`.** The design skill's Forms rule lets `FieldGroup` own the rhythm, and login-05 nests the submit in a `Field` inside it. **Fix toward shadcn:** move `<Field><Button type="submit" /></Field>` into the `FieldGroup` and drop the form's flex and gap.
- **`components/common/access.tsx:153-159`, a hand-rolled "OR" divider.** login-05 uses `<FieldSeparator>Or</FieldSeparator>`. **Fix toward shadcn.**
- **`components/common/access.tsx:161`, the social buttons in a `div` grid (low).** login-05 uses `<Field className="grid gap-4 sm:grid-cols-2">`. **Fix toward shadcn:** a `Field`; one column is fine.
- **`components/common/access.tsx:219-221`, a hand-rolled terms note.** login-05 uses `<FieldDescription className="px-6 text-center">`. **Fix toward shadcn.**

### Input

- **`components/common/access.tsx:127` and `components/dashboard/sidebar.tsx:199`, `focus:placeholder:opacity-0`.** In no shadcn example, with no comment. **Fix toward shadcn:** drop it. If it is wanted app-wide, it belongs in `shadcn-customize.ts`.
- **A disabled Input in a `Field` without `data-disabled` (low).** At `components/common/access.tsx:133`, `components/dashboard/sidebar.tsx:205`, `app/(console)/console/(access)/allowlist/components/data-table.tsx:282` and `app/waitlist/page.tsx:147`. The label dims only through `data-disabled`, so it stays at full strength. **Fix toward shadcn:** `<Field data-invalid={isInvalid} data-disabled={pending}>`.

### Item

- **`components/shell/sidebar-dropdown-menu.tsx:79`, `Item size="xs" className="gap-2 px-1 py-1.5"`.** `gap-2` repeats the `xs` gap. `px-1 py-1.5` never apply: the `xs` variant's `in-data-[slot=dropdown-menu-content]:p-0` has the same specificity and comes later, so the header renders with no inset. **Fix toward shadcn:** a bare `<Item size="xs">`. If `nav-user`'s inset is wanted, move `px-1 py-1.5` onto the `DropdownMenuLabel` in place of `p-0`, and check it in the browser.
- **`components/shell/sidebar-dropdown-menu.tsx:82-83`, `truncate` on `ItemTitle` and `ItemDescription` (low).** shadcn's `item-dropdown` adds none. It mirrors `nav-user` and stops a long email wrapping to two lines. **Keep, and justify:** add a comment.
- **`components/dashboard/sidebar.tsx:139-143`, the org header's hand-rolled tile in a default `ItemMedia` (low).** base-nova's `icon` variant sizes the svg but draws no tile, and the tile matches `team-switcher`'s logo tile. **Keep, and justify:** record it.
- **`components/dashboard/sidebar.tsx:146`, `secondaryClassName: "text-muted-foreground"` on the header (low).** `ItemDescription` is already muted. **Fix:** drop it from `header`; the trigger still needs it.

### Kbd

- **`components/docs/sidebar.tsx:262`, a `div` with `flex items-center gap-1` around the keys.** That is `KbdGroup` written by hand. **Fix toward shadcn:** `<KbdGroup className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">`.

### Select

- **`app/(console)/console/(access)/users/components/role-select.tsx:78, 91, 98`, no `items` on `Select`, with `capitalize` on the trigger and items.** Every base example passes `items`, so `SelectValue` renders the label. **Fix toward shadcn:** pass `items` with labels and drop both `capitalize` classes.
- **`app/(console)/console/(access)/users/components/role-select.tsx:96-101`, items not in a `SelectGroup`.** In base-nova the `p-1` lives on `SelectGroup`, so the items sit flush against the popup. **Fix toward shadcn:** wrap them in `SelectGroup`.
- **`app/(console)/console/(access)/users/components/role-select.tsx:92`, `disabled` on `SelectTrigger` (low).** `select-disabled` puts it on the root. **Fix toward shadcn:** `<Select disabled={mutation.isPending}>`.

### Sheet

- **`components/common/navbar.tsx:182-187`, the trigger is `size="sm"` with `size-8 [&_svg]:size-4!`.** That is exactly `size="icon"`, and the `!` fights the `sm` svg rule. **Fix toward shadcn:** `size="icon" className="-mr-2.5 lg:hidden"`.
- **`components/common/navbar.tsx:192`, `SheetContent side="right"` (low).** It restates the default. **Fix:** drop it (design skill, Defaults first).
- **`components/common/navbar.tsx:194-202`, `SheetTitle render={<Link ... />}`.** The title's heading becomes a restyled link, so the sheet loses its heading label. **Fix toward shadcn:** nest the link, `<SheetTitle><Link ... /></SheetTitle>`.
- **`components/common/navbar.tsx:206, 254`, a body of `ml-4` (low).** shadcn's body is `px-4`, matching `SheetHeader`'s `p-4`. **Fix toward shadcn:** `px-4`.

### Sidebar

- **`data-active:font-normal` on `SidebarMenuButton`, pasted at six call sites.** At `components/agents/sidebar.tsx:223, 253, 367`, `components/docs/sidebar.tsx:99` and `components/console/sidebar.tsx:118, 174`. It overrides shadcn's `data-active:font-medium` with no recorded reason, and the copies break the design skill's "One source per concern". **Fix:** drop it and take shadcn's default, or move it into `patchSidebar()` and record the convention.
- **`SidebarGroupLabel className="pl-2.5"`.** At `components/agents/sidebar.tsx:336, 401, 408`, `components/docs/sidebar.tsx:47` and `components/console/sidebar.tsx:164`. shadcn's `px-2` lines the label up with the rows; `pl-2.5` moves it 2px right. It came from the scaffold with no reason. **Fix toward shadcn:** drop it, or record why the label sits 2px in.
- **`SidebarMenuSub className="mr-0 gap-y-0.5 pr-0 pb-0 pl-2"` (low).** At `components/agents/sidebar.tsx:237`, and `components/docs/sidebar.tsx:142` without `pb-0`. The design skill's Spacing rule explains `pb-0` and the gap, not `mr-0 pr-0 pl-2`. **Keep, and justify:** add the reason (sub rows run to the right edge so their icons line up with the parent's) to the Spacing rule, or drop to shadcn's `mx-3.5 px-2.5`.
- **`components/agents/sidebar.tsx:242`, `SidebarMenuSubButton render={<button type="button" className="w-full" />}` (low).** shadcn's sub button is an `<a>`. Rows select rather than navigate, so a button is right. **Keep, and justify:** add a one-line comment.
- **`components/agents/sidebar.tsx:233`, the toggle rotates its icon.** The svg carries `transition-transform duration-200 group-data-[open]:rotate-90`. `sidebar-08` rotates the action (`aria-expanded:rotate-90`), and `SidebarMenuAction` already has `transition-transform`. **Fix toward shadcn:** put `aria-expanded:rotate-90` on the action and drop the svg classes.
- **`components/docs/sidebar.tsx:99`, `border` on the setup item.** `SidebarMenuButton` has `variant="outline"`, and `/docs/getting-started/setup` is gone from `content/docs/meta.json`, so this is dead scaffold code. **Fix:** remove it.
- **`components/dashboard/sidebar.tsx:125-165`, the OrgSwitcher's `SidebarMenuButton` outside `SidebarMenu > SidebarMenuItem`.** `app/(protected)/layout.tsx:43` places it in `SidebarHeader`. shadcn's header docs and `team-switcher` always wrap it; our user menu does. **Fix toward shadcn.**
- **`components/shell/sidebar-dropdown-menu.tsx:54-57`, the trigger's `border` and `data-[popup-open]:` classes.** `border` stands in for `variant="outline"`. `data-[popup-open]:` is right, as Base UI's trigger sets that attribute where shadcn writes `data-open:`, but no comment says so. **Fix toward shadcn:** `variant="outline"`, or record the bordered identity button in the design skill; and add a comment on `data-[popup-open]:`.
- **`components/shell/sidebar-dropdown-menu.tsx:25-32`, the hand-rolled trigger identity (reason does not hold).** The design skill's Badges and pills rule keeps it hand-rolled because "the chevron is a sibling there". Registry `sidebar-example` nests the chevron in `ItemActions` inside an `Item` within the same `SidebarMenuButton`. **Fix toward shadcn:** `Item size="xs" > ItemContent + ItemActions` in the trigger, or give a reason that holds.
- **`components/shell/sidebar-shell.tsx:53` and `components/shell/sidebar-floating-trigger.tsx:14-18`, `SidebarTrigger variant="secondary"` with `bg-sidebar border`.** `--sidebar` is `--background`, so this is Button's `outline` variant. The floating trigger's layout classes are explained by its comment; the variant swap is not. **Fix toward shadcn:** `variant="outline"`, unless its dark `bg-input/30` is unwanted, in which case say so in the design skill.
- **`components/docs/sidebar.tsx:253-269`, `DocsSearch` has no label (accessibility).** shadcn's `search-form` has an `sr-only` `Label`; ours has only a placeholder. **Fix toward shadcn:** an `sr-only` label or an `aria-label`.

### Spinner

- **`app/waitlist/page.tsx:165`, the spinner replaces the label.** The `sm:w-auto` button collapses, and its name becomes "Loading". `spinner-button` keeps the label. **Fix toward shadcn:** `<Spinner data-icon="inline-start" />` before the label.
- **`components/common/navbar.tsx:103`, the spinner replaces the label (low).** The button is a fixed `w-24` slot, too narrow for both, and swapping avoids navbar shift. **Keep, and justify:** add a comment.
- **`components/common/access.tsx:227`, `Spinner className="size-5"`.** shadcn allows `size-*`, but the design skill (Principles, and Components: Loading) forbids it, using this exact line as its example. **Fix:** `<Spinner />`.

### Toast

- **Error toasts omit `priority: "high"`, which shadcn's error example sets.** Twelve calls: `lib/clipboard.ts:9`, `lib/api/bulk.ts:77`, `app/waitlist/page.tsx:78`, `components/docs/copy-as-markdown.tsx:39`, `components/common/access.tsx:78, 181, 206`, `components/dashboard/sidebar.tsx:84, 114`, `app/(console)/console/(access)/allowlist/components/data-table.tsx:218`, `components/shell/sidebar-user-menu.tsx:92` and `app/(console)/console/(access)/users/components/role-select.tsx:52`. Without it, a screen reader announces a failure politely, not urgently. **Fix toward shadcn:** add `priority: "high"` to every `type: "error"` call, and to the design skill's toast recipe.

### Tooltip

- **No `TooltipProvider` anywhere.** Only `ui/tooltip.tsx` defines it, and shadcn's install step puts it at the root. Without it, neighbouring tooltips do not open instantly in turn, which matters in the agents sidebar, where every icon has one. **Fix toward shadcn:** wrap the app in `<TooltipProvider>` in `InnerProvider` (`app/providers.tsx`). If instant tooltips are too noisy, pass a `delay` and record why.
- **`components/agents/sidebar.tsx:113`, `span` triggers on the status, provider and effort icons (accessibility).** They are not focusable and have no name, so their meaning is mouse-only. shadcn uses a `span` only to wrap a disabled button. **Fix:** give the trigger an accessible name, such as `aria-label={label}`.

## Related design-skill drift

These are not shadcn deviations, but the design skill and the code disagree.

- **Relative time.** `app/(console)/console/(access)/allowlist/components/data-columns.tsx:83` ("Added") and `app/(console)/console/(access)/users/components/data-columns.tsx:104` ("Joined") render `toLocaleDateString(...)`. The design skill's Data tables section says a time column renders `relativeTime`, as the waitlist's "Joined" does (`app/(console)/console/waitlist/components/data-columns.tsx:60`). **Fix:** use `relativeTime`.
- **Row spacing.** `components/dashboard/sidebar.tsx:241`, `DashboardFooter`'s `SidebarMenu className="space-y-1.5"`. The design skill's Spacing rule says rows sit 2px apart (`space-y-0.5`). **Fix:** `space-y-0.5`, or state the footer exception in the rule.
