# shadcn usage

For each shadcn component the app uses: how shadcn uses it, where we use it, and every deliberate deviation with its reason. It serves the design skill's "shadcn's own usage first" principle ([`SKILL.md`](SKILL.md)): build from shadcn's usage with the defaults first, and record a change here when a real need makes one.

To refresh an entry, read shadcn's own source rather than memory:

- The docs page is `https://ui.shadcn.com/docs/components/base/<name>`. Its source, `apps/v4/content/docs/components/base/<name>.mdx`, keeps the code that a fetch of the page truncates.
- Demos and examples are at `apps/v4/examples/base/` and `apps/v4/registry/bases/base/examples/` in `shadcn-ui/ui`.
- Blocks are at `apps/v4/registry/bases/base/blocks/`.
- Read any of them with `gh api repos/shadcn-ui/ui/contents/<path> --jq .content | base64 -d`.
- This app's style is `base-nova` (`web/next/components.json`), so read the Base UI flavour, not Radix.

The skeletons below keep only nesting and key props. Paths under "Our usage" start at `web/next/src/`.

## Across every component

- **Fill icons everywhere.** shadcn's registry names each icon through `IconPlaceholder`, and the CLI resolves its `remixicon` name, which is always a `*Line` icon (`RiMoreLine` in `nav-projects`). We use the `*Fill` twin of every icon (design skill, Icons). So far only the agents sidebar does: `components/ui/*` and the files the shadcn audit lists still draw Line icons until its Line-to-Fill item ships, which the bullets below mark as the audit's switch. A Remix editor icon with no Fill variant, such as `RiLink`, gives way to a Fill icon with the same meaning (`RiLinksFill`). An icon hard-coded inside `components/ui/*` changes through `.github/scripts/shadcn-customize.ts`, never by hand.
- **Primitive patches.** `components/ui/*` is the base-nova registry source. Only `.github/scripts/shadcn-customize.ts` changes it (design skill, Components): Button render wiring, the Checkbox indeterminate glyph, Spinner typing and `SidebarTrigger` children.

## Index

[Alert dialog](#alert-dialog) · [Avatar](#avatar) · [Badge](#badge) · [Button](#button) · [Checkbox](#checkbox) · [Collapsible](#collapsible) · [Command](#command) · [Data table](#data-table) · [Dialog](#dialog) · [Dropdown menu](#dropdown-menu) · [Empty](#empty) · [Field](#field) · [Input](#input) · [Item](#item) · [Kbd](#kbd) · [Popover](#popover) · [Select](#select) · [Separator](#separator) · [Sheet](#sheet) · [Sidebar](#sidebar) · [Spinner](#spinner) · [Table](#table) · [Tabs](#tabs) · [Toast](#toast) · [Tooltip](#tooltip)

## Alert dialog

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/alert-dialog, primary demo (`alert-dialog-demo`):
  ```tsx
  <AlertDialog>
    <AlertDialogTrigger render={<Button variant="outline" />}>Show Dialog</AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle /><AlertDialogDescription /></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel /><AlertDialogAction /></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  ```
  - Variants and sizes: `AlertDialogContent size` is `default` or `sm`. `AlertDialogAction` and `AlertDialogCancel` take Button's `variant` and `size`.
  - `alert-dialog-destructive`: `AlertDialogContent size="sm"`, a tinted `AlertDialogMedia` first in the header, then `AlertDialogCancel variant="outline"` and `AlertDialogAction variant="destructive"`.
- **Our usage:** `components/common/confirm-dialog.tsx`, opened by the allowlist, users and waitlist tables.
- **Deliberate deviations:**
  - No `AlertDialogTrigger`, and `open` is controlled: the pending state opens it (code comment in `confirm-dialog.tsx`).

## Avatar

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/avatar, primary demo (`avatar-demo`):
  ```tsx
  <Avatar><AvatarImage src="..." alt="@shadcn" /><AvatarFallback>CN</AvatarFallback><AvatarBadge /></Avatar>
  <AvatarGroup><Avatar>...</Avatar><AvatarGroupCount>+3</AvatarGroupCount></AvatarGroup>
  ```
  - Variants and sizes: `Avatar size` is `default` (`size-8`), `sm` (`size-6`) or `lg` (`size-10`). No variant.
  - `avatar-dropdown`: `DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}` around an `Avatar`. Block `sidebar-07` `nav-user`: a bare `Avatar > AvatarImage + AvatarFallback` in the identity row.
- **Our usage:** `app/waitlist/page.tsx`, `components/shell/sidebar-user-menu.tsx`.
- **Deliberate deviations:** none.

## Badge

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/badge, primary demo (`badge-demo`):
  ```tsx
  <Badge>Badge</Badge>
  <Badge variant="secondary">Secondary</Badge>
  ```
  - Variants and sizes: `variant` is `default`, `secondary`, `destructive`, `outline`, `ghost` or `link`. No size. An icon or spinner child takes `data-icon="inline-start"` or `"inline-end"`.
  - `badge-link`: `Badge render={<a href="#" />}`. `badge-colors`: a custom color through `className`. The Tasks faceted filter: `Badge variant="secondary" className="rounded-sm px-1 font-normal"` inside the Popover trigger.
- **Our usage:** `components/data-table.tsx`, `components/shell/sidebar-shell.tsx`.
- **Deliberate deviations:**
  - The faceted filter's badges drop `rounded-sm px-1 font-normal` (design skill, Principles: Defaults first).

## Button

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/button, primary demo (`button-demo`):
  ```tsx
  <Button variant="outline">Button</Button>
  <Button variant="outline" size="icon" aria-label="Submit"><ArrowUpIcon /></Button>
  ```
  - Variants: `default`, `outline`, `ghost`, `destructive`, `secondary`, `link`. Sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.
  - An icon beside text takes `data-icon="inline-start"` or `"inline-end"` (`button-with-icon`). `button-spinner` keeps the label: `<Button disabled><Spinner data-icon="inline-start" />Generating</Button>`.
  - `button-rounded`: `className="rounded-full"`, the only documented class tweak. `button-render` ("As Link"): `<a className={buttonVariants({ variant: "secondary", size: "sm" })}>`. The docs say never `<Button render={<a />} />` for a link, as Base UI's Button sets `role="button"`.
  - `button-group-demo`: `ButtonGroup > ButtonGroup > Button`, and `DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="More Options" />}`.
- **Our usage:** `components/agents/sidebar.tsx`, `components/common/access.tsx`, `components/common/mode-toggle.tsx`, `components/common/navbar.tsx`, `components/common/route-error.tsx`, `components/common/route-not-found.tsx`, `components/dashboard/sidebar.tsx`, `components/data-table.tsx`, `components/docs/copy-as-markdown.tsx`, `app/waitlist/page.tsx`, and the console tables' `data-table.tsx` and `data-columns.tsx`.
- **Deliberate deviations:**
  - Fill icons inside buttons (see the top; Line outside the agents sidebar until the audit's switch).
  - `render` with `nativeButton={!render}` in `ui/button.tsx`: `patchButton()` in `shadcn-customize.ts`, so `XTrigger render={<Button />}` works. It is no licence for a Button rendered as a link.
  - The navbar's `w-24` session slot and its empty placeholder: code comment in `navbar.tsx` (the shell paints at once, so the box never pops).
  - The Threads pager's ghost `icon-xs` Buttons: design skill, Sidebars.
  - The data table's View and filter triggers drop the Tasks example's `size="sm" className="h-8"`, as base-nova's default is already `h-8` (design skill, Principles: Defaults first).

## Checkbox

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/checkbox, primary demo (`checkbox-demo`):
  ```tsx
  <FieldGroup>
    <Field orientation="horizontal"><Checkbox id="terms" /><Label htmlFor="terms">Accept terms</Label></Field>
    <Field orientation="horizontal">
      <Checkbox id="terms-2" defaultChecked />
      <FieldContent><FieldLabel htmlFor="terms-2" /><FieldDescription /></FieldContent>
    </Field>
  </FieldGroup>
  ```
  - Variants and sizes: none. `defaultChecked`, or `checked` with `onCheckedChange`, plus `indeterminate`. Invalid is `aria-invalid` on the checkbox and `data-invalid` on its `Field`.
  - `checkbox-table`: `TableHead > Checkbox` and `TableCell > Checkbox`. The base `data-table-demo` select column: `checked`, `indeterminate`, `onCheckedChange` and `aria-label="Select all"` (`"Select row"` per row).
- **Our usage:** `components/data-table.tsx` (`selectColumn`).
- **Deliberate deviations:**
  - The row's `aria-label` names the row: code comment on `selectColumn`.
  - The indeterminate fill and minus glyph in `ui/checkbox.tsx`: `patchCheckbox()` in `shadcn-customize.ts`, as upstream still renders only a check. Its glyphs are to take Fill icons through the same script (still Line until the audit's switch).

## Collapsible

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/collapsible, primary demo (`collapsible-demo`):
  ```tsx
  <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-4 px-4">
      <h4>Order #4189</h4>
      <CollapsibleTrigger render={<Button variant="ghost" size="icon" />}><ChevronsUpDown /></CollapsibleTrigger>
    </div>
    <CollapsibleContent className="flex flex-col gap-2">...</CollapsibleContent>
  </Collapsible>
  ```
  - Variants and sizes: none. `open`, `onOpenChange` and `defaultOpen`.
  - `collapsible-basic`: `Card > CardContent > Collapsible > CollapsibleTrigger render={<Button variant="ghost" />}`, its chevron `group-data-panel-open/button:rotate-180`. `collapsible-file-tree`: nested Collapsibles, with `group` on each trigger Button, not on the root. Sidebar blocks: `Collapsible render={<SidebarMenuItem />}` (see Sidebar).
- **Our usage:** `components/agents/sidebar.tsx`, `components/docs/sidebar.tsx`.
- **Deliberate deviations:**
  - Fill chevrons (see the top; Line outside the agents sidebar until the audit's switch).
  - An unnamed `group` with `group-data-[open]:`, where shadcn writes `group/collapsible` and `group-data-open/collapsible:` (design skill, State: style from the data attributes the primitive sets).

## Command

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/command, primary demo (`command-demo`):
  ```tsx
  <Command className="max-w-sm rounded-lg border">
    <CommandInput placeholder="Type a command or search..." />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Suggestions"><CommandItem>...</CommandItem></CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Settings"><CommandItem>...<CommandShortcut>⌘P</CommandShortcut></CommandItem></CommandGroup>
    </CommandList>
  </Command>
  ```
  - Variants and sizes: none. `CommandDialog` takes `title`, `description` and `showCloseButton` (default `false`).
  - `command-dialog`: `CommandDialog > Command > CommandInput + CommandList`.
  - The Tasks faceted filter: `PopoverContent className="w-[200px] p-0" align="start" > Command > CommandInput + CommandList > CommandEmpty + CommandGroup`, then `CommandSeparator + CommandGroup` holding "Clear filters".
- **Our usage:** `components/data-table.tsx` (`DataTableFacetedFilter`).
- **Deliberate deviations:**
  - Fill icons, including the check and search glyphs in `ui/command.tsx` through `shadcn-customize.ts` (see the top; still Line until the audit's switch).
  - `w-48` for `w-[200px]`, and the count box's classes dropped (design skill, Spacing: snap to the scale; Principles: Defaults first).
  - The hand-rolled checkbox span: copied from shadcn's Tasks example, which hand-rolls the same box.
  - `onSelect` reads the live filter value: code comment in `data-table.tsx`.

## Data table

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/data-table, a guide on TanStack Table v9, not a component. Primary demo (`data-table-demo`), the body and the row actions:
  ```tsx
  <div className="overflow-hidden rounded-md border">
    <Table><TableHeader>...</TableHeader><TableBody>...</TableBody></Table>
  </div>
  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}><span className="sr-only">Open menu</span></DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-44">
    <DropdownMenuGroup><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem /></DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>...</DropdownMenuGroup>
  </DropdownMenuContent>
  ```
  - Variants and sizes: none. With no rows, `<TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>`. `flexRender(...)` is a documented alternative to `<table.FlexRender>`.
  - The Tasks example's pieces: `DataTableColumnHeader` (a ghost `sm` trigger over Asc, Desc and Hide), `DataTableViewOptions` (an outline "View" trigger, a "Toggle columns" label, a `DropdownMenuCheckboxItem` per column), `DataTableToolbar`, `DataTableFacetedFilter` (Popover over Command) and `DataTablePagination`.
  - `table-actions` sets the destructive item after a `DropdownMenuSeparator`.
- **Our usage:** `components/data-table.tsx`, `lib/data-table-features.ts`, `lib/data-table-layout.ts`, and the console tables under `app/(console)/console/` (`(access)/allowlist`, `(access)/users`, `activity`, `waitlist`).
- **Deliberate deviations:**
  - Fill icons on the row trigger, the sort arrows and the filter trigger (see the top; still Line until the audit's switch).
  - Infinite scroll with virtualized rows, so no pagination (design skill, Data tables; code comment on `DataTable`).
  - A focusable, named scroll region replaces `overflow-hidden rounded-md border` (design skill, Layout and landmarks: a scrollable region).
  - `Empty` outside the `<Table>` replaces the `colSpan` "No results." cell, as flex rows cannot honour `colSpan` (design skill, Components: Empty states).
  - `DataTableColumnHeader` is a label plus a bare sort button, with no menu and no `title` prop, and `DataTableViewOptions` lists `meta.label`, not `column.id` with `capitalize` (design skill, Data tables).
  - The toolbar searches the global filter, with `Input className="w-40 lg:w-64"` (design skill, Spacing; code comments in `data-table.tsx`).
  - The faceted filter returns `null` without its column: code comment in `data-table.tsx`.
  - Selection actions float in a bar (design skill, Data tables).

## Dialog

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/dialog, primary demo (`dialog-demo`):
  ```tsx
  <Dialog>
    <form>
      <DialogTrigger render={<Button variant="outline" />}>Open Dialog</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle /><DialogDescription /></DialogHeader>
        <FieldGroup><Field>...</Field></FieldGroup>
        <DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button type="submit" /></DialogFooter>
      </DialogContent>
    </form>
  </Dialog>
  ```
  - Variants and sizes: `showCloseButton` on `DialogContent` (default `true`) and on `DialogFooter`. Width is an `sm:max-w-*` class.
  - `dialog-close-button`: `sm:max-w-md`, and `DialogFooter className="sm:justify-start" > DialogClose render={<Button />}`. `dialog-sticky-footer`: a body of `-mx-4 max-h-[50vh] overflow-y-auto px-4`, then `DialogFooter`.
- **Our usage:** `components/common/access.tsx`, `components/dashboard/sidebar.tsx`, `app/(console)/console/(access)/allowlist/components/data-table.tsx`.
- **Deliberate deviations:**
  - The close glyph in `ui/dialog.tsx` is to take a Fill icon through `shadcn-customize.ts` (see the top; still Line until the audit's switch).
  - `DialogContent render={<form />}` in the allowlist's `AddRuleDialog`: code comment there (an outer `<form>` cannot hold the portaled popup).

## Dropdown menu

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/dropdown-menu, primary demo (`dropdown-menu-demo`):
  ```tsx
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="outline" />}>Open</DropdownMenuTrigger>
    <DropdownMenuContent className="w-40" align="start">
      <DropdownMenuGroup><DropdownMenuLabel>My Account</DropdownMenuLabel><DropdownMenuItem /></DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup><DropdownMenuSub>...</DropdownMenuSub></DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
  ```
  - Variants and sizes: `DropdownMenuItem variant` is `default` or `destructive` ("for irreversible actions"), plus `inset`. `DropdownMenuLabel` and `DropdownMenuSubTrigger` take `inset`. `DropdownMenuContent` takes `side`, `align`, `sideOffset` and `alignOffset`; base-nova defaults to `side="bottom" align="start" sideOffset={4}` and `w-(--anchor-width) min-w-32`.
  - `dropdown-menu-icons`: loose icon-and-text items, the destructive one last after a separator. `dropdown-menu-destructive`: a group, a separator, then a group with the destructive item.
  - `item-dropdown`: `DropdownMenuItem > Item size="xs"`. The sidebar row menu is under Sidebar, the row actions under Data table.
- **Our usage:** `components/agents/sidebar.tsx`, `components/dashboard/sidebar.tsx`, `components/data-table.tsx`, `components/shell/sidebar-dropdown-menu.tsx`, `components/shell/sidebar-user-menu.tsx`, and the console tables' `data-columns.tsx` and users `data-table.tsx`.
- **Deliberate deviations:**
  - Fill icons on items and triggers, and in `ui/dropdown-menu.tsx` through `shadcn-customize.ts` (see the top; Line outside the agents sidebar until the audit's switch).
  - The data table's view options are `align="end"` with no width class (design skill, Principles: Defaults first; Spacing).
  - `cursor-pointer` on the user menu's link items (design skill, Cursor: the `DropdownMenuItem` exception).

## Empty

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/empty, primary demo (`empty-demo`):
  ```tsx
  <Empty>
    <EmptyHeader><EmptyMedia variant="icon"><IconFolderCode /></EmptyMedia><EmptyTitle /><EmptyDescription /></EmptyHeader>
    <EmptyContent><Button>Create Project</Button><Button variant="outline">Import Project</Button></EmptyContent>
  </Empty>
  ```
  - Variants and sizes: `EmptyMedia variant` is `default` or `icon`. A surface comes from utilities (`border border-dashed`, `bg-muted/30`).
  - `empty-background`: `EmptyContent > Button variant="outline"` with `<RefreshCcwIcon data-icon="inline-start" />Refresh`.
  - `empty-input-group`: no `EmptyMedia`, and `EmptyContent > InputGroup`. `spinner-empty`: `EmptyMedia variant="icon" > Spinner`. Every example pairs `EmptyTitle` with `EmptyDescription`.
- **Our usage:** `components/blog/post-list.tsx`, `components/common/route-error.tsx`, `components/common/route-not-found.tsx`, `components/data-table.tsx`, and the console tables' `data-table.tsx`.
- **Deliberate deviations:**
  - No `EmptyMedia`, as `empty-input-group` documents.
  - `EmptyTitle role="heading" aria-level={1}` in `route-not-found.tsx`: code comment there (`EmptyTitle` is a div, and `ui/*` is regenerated).
  - The route surfaces pass `flex-1` or `min-h-svh` (design skill, Layout and landmarks).

## Field

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/field, with the form guide at https://ui.shadcn.com/docs/forms/tanstack-form. Primary demo (`field-demo`):
  ```tsx
  <form>
    <FieldGroup>
      <FieldSet><FieldLegend>Payment Method</FieldLegend><FieldGroup><Field><FieldLabel /><Input /></Field></FieldGroup></FieldSet>
      <FieldSeparator />
      <Field orientation="horizontal"><Button type="submit">Submit</Button><Button variant="outline">Cancel</Button></Field>
    </FieldGroup>
  </form>
  ```
  - Variants and sizes: `Field orientation` is `vertical` (default), `horizontal` or `responsive`. `FieldLegend variant` is `legend` or `label`. `Field` takes `data-invalid` and `data-disabled`.
  - The TanStack guide: `form.Field` renders `Field data-invalid > FieldLabel + Input aria-invalid + FieldDescription`, then `FieldError` when invalid. `form-tanstack-demo`: `Card > CardContent > form > FieldGroup`, with the buttons in `CardFooter > Field orientation="horizontal"`.
  - Block `login-05`: `form > FieldGroup >` the header, an email `Field`, `Field > Button type="submit"`, `FieldSeparator` ("Or"), and `Field className="grid gap-4 sm:grid-cols-2"` for the social buttons, then a `FieldDescription` note.
- **Our usage:** `components/common/access.tsx`, `components/dashboard/sidebar.tsx`, `app/waitlist/page.tsx`, `app/(console)/console/(access)/allowlist/components/data-table.tsx`.
- **Deliberate deviations:**
  - The waitlist's one-row hero form has no `FieldGroup`, an `sr-only` `FieldLabel` and an absolutely placed `FieldError`: code comments in `app/waitlist/page.tsx` (it stacks on a phone, and an error must not shift the layout).
  - The waitlist's raw honeypot `<input>`: code comments there.

## Input

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/input, primary demo (`input-demo`):
  ```tsx
  <Field>
    <FieldLabel htmlFor="api-key">API Key</FieldLabel>
    <Input id="api-key" type="password" placeholder="sk-..." />
    <FieldDescription>Your API key is encrypted and stored securely.</FieldDescription>
  </Field>
  ```
  - Variants and sizes: none, only native input props. Disabled is `<Field data-disabled>` around `<Input disabled />`; invalid is `<Field data-invalid>` around `<Input aria-invalid />`.
  - `input-inline`: `Field orientation="horizontal" > Input type="search" + Button`. `input-button-group`: `Field > FieldLabel + ButtonGroup > Input + Button`. The Tasks toolbar: `Input className="h-8 w-[150px] lg:w-[250px]"` with no `Field`.
- **Our usage:** `components/common/access.tsx`, `components/dashboard/sidebar.tsx`, `components/data-table.tsx`, `app/waitlist/page.tsx`, `app/(console)/console/(access)/allowlist/components/data-table.tsx`.
- **Deliberate deviations:**
  - The data table's search is `w-40 lg:w-64` with an `aria-label` and no `Field`, as the Tasks toolbar has none (design skill, Spacing; code comment in `data-table.tsx`).

## Item

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/item, primary demo (`item-demo`):
  ```tsx
  <Item variant="outline">
    <ItemContent><ItemTitle>Basic Item</ItemTitle><ItemDescription /></ItemContent>
    <ItemActions><Button variant="outline" size="sm">Action</Button></ItemActions>
  </Item>
  ```
  - Variants and sizes: `Item variant` is `default`, `outline` or `muted`. `Item size` is `default`, `sm` or `xs`. `ItemMedia variant` is `default`, `icon` or `image`. In base-nova an `xs` Item sheds its padding inside a dropdown (`in-data-[slot=dropdown-menu-content]:p-0`).
  - `item-dropdown`: `DropdownMenuItem > Item size="xs" > ItemMedia (Avatar) + ItemContent className="gap-0"`.
  - Registry `sidebar-icon-example`: `DropdownMenuLabel > Item size="xs" > ItemMedia (Avatar) + ItemContent (ItemTitle, ItemDescription)`. Block `nav-user` hosts its header in `DropdownMenuGroup > DropdownMenuLabel className="p-0 font-normal"`.
- **Our usage:** `components/shell/sidebar-dropdown-menu.tsx`, rendered by `components/shell/sidebar-user-menu.tsx` and `components/dashboard/sidebar.tsx`.
- **Deliberate deviations:**
  - Fill media icons (see the top; still Line until the audit's switch).
  - The menu's identity header is an `Item` inside a `DropdownMenuLabel`, as in `sidebar-icon-example` (design skill, Components: identity rows use `Item`).

## Kbd

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/kbd, primary demo (`kbd-demo`):
  ```tsx
  <KbdGroup><Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>⌥</Kbd><Kbd>⌃</Kbd></KbdGroup>
  <KbdGroup><Kbd>Ctrl</Kbd><span>+</span><Kbd>B</Kbd></KbdGroup>
  ```
  - Variants and sizes: none.
  - `kbd-input-group`: `InputGroup > InputGroupInput + InputGroupAddon (icon) + InputGroupAddon align="inline-end" > Kbd + Kbd`. `kbd-tooltip`: a `KbdGroup` inside `TooltipContent`.
- **Our usage:** `components/docs/sidebar.tsx` (`DocsSearch`).
- **Deliberate deviations:**
  - The keys overlay `SidebarInput` absolutely rather than sitting in an `InputGroup`. This follows shadcn's own `sidebar-01` `search-form`, which keeps the `SidebarInput` styling.

## Popover

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/popover, primary demo (`popover-demo`):
  ```tsx
  <Popover>
    <PopoverTrigger render={<Button variant="outline" />}>Open popover</PopoverTrigger>
    <PopoverContent className="w-80"><div className="grid gap-4">...</div></PopoverContent>
  </Popover>
  ```
  - The docs' Usage nests `PopoverContent > PopoverHeader > PopoverTitle + PopoverDescription`. Variants and sizes: `PopoverContent` takes `align` (`start`, `center`, `end`), `side`, `sideOffset` and `alignOffset`, defaulting to `side="bottom" align="center" sideOffset={4}`.
  - `popover-form`: `PopoverContent className="w-64" align="start" > PopoverHeader + FieldGroup`.
  - The Tasks faceted filter: `PopoverTrigger render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}`, then `PopoverContent className="w-[200px] p-0" align="start" > Command`.
- **Our usage:** `components/data-table.tsx` (`DataTableFacetedFilter`).
- **Deliberate deviations:**
  - The trigger drops `size="sm" className="h-8"`, as base-nova's default is already `h-8` (design skill, Principles: Defaults first).

## Select

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/select, primary demo (`select-demo`):
  ```tsx
  <Select items={items}>
    <SelectTrigger className="w-full max-w-48"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectGroup><SelectLabel>Fruits</SelectLabel><SelectItem value="apple">Apple</SelectItem></SelectGroup>
    </SelectContent>
  </Select>
  ```
  - Variants and sizes: `SelectTrigger size` is `default` or `sm`. `SelectContent alignItemWithTrigger` defaults to `true`. Disabled goes on the root, `<Select disabled>`.
  - Every base example passes `items` and wraps its items in `SelectGroup`. `field-select`: `Field > FieldLabel + Select`.
- **Our usage:** `app/(console)/console/(access)/users/components/role-select.tsx`.
- **Deliberate deviations:**
  - The chevrons and check in `ui/select.tsx` are to take Fill icons through `shadcn-customize.ts` (see the top; still Line until the audit's switch).
  - `size="sm"` with an `aria-label` and no `Field`, as a table cell has no visible label (design skill, Data tables: the role cell is a `Select`).

## Separator

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/separator, primary demo (`separator-demo`):
  ```tsx
  <div className="flex max-w-sm flex-col gap-4 text-sm"><div>...</div><Separator /><div>...</div></div>
  ```
  - Variants and sizes: `orientation` is `horizontal` (default) or `vertical`.
  - `separator-vertical`: `<Separator orientation="vertical" />` in a `flex h-5 items-center` row. The Tasks faceted filter: `<Separator orientation="vertical" className="mx-2 h-4" />` inside the Popover trigger.
- **Our usage:** `components/data-table.tsx`.
- **Deliberate deviations:**
  - It drops `mx-2`, as the Button's gap spaces it (design skill, Principles: Defaults first).

## Sheet

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/sheet, primary demo (`sheet-demo`):
  ```tsx
  <Sheet>
    <SheetTrigger render={<Button variant="outline" />}>Open</SheetTrigger>
    <SheetContent>
      <SheetHeader><SheetTitle>Edit profile</SheetTitle><SheetDescription /></SheetHeader>
      <div className="grid flex-1 auto-rows-min gap-6 px-4">...</div>
      <SheetFooter><Button type="submit" /><SheetClose render={<Button variant="outline" />} /></SheetFooter>
    </SheetContent>
  </Sheet>
  ```
  - Variants and sizes: `SheetContent side` is `top`, `right` (default), `bottom` or `left`. `showCloseButton` defaults to `true`.
  - `sheet-side`: a body of `px-4`. `Sidebar` itself renders a `Sheet` on a phone.
- **Our usage:** `components/common/navbar.tsx`.
- **Deliberate deviations:**
  - Fill icons on the trigger, and in `ui/sheet.tsx` through `shadcn-customize.ts` (see the top; still Line until the audit's switch).

## Sidebar

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/sidebar, primary demo (`sidebar-demo`, a block preview):
  ```tsx
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <SidebarHeader /><SidebarContent><SidebarGroup>...</SidebarGroup></SidebarContent><SidebarFooter /><SidebarRail />
    </Sidebar>
    <SidebarInset />
  </SidebarProvider>
  ```
  - Variants and sizes: `Sidebar` takes `side` (`left`, `right`), `variant` (`sidebar`, `floating`, `inset`) and `collapsible` (`offcanvas`, `icon`, `none`).
  - `SidebarMenuButton`: `variant` (`default`, `outline`), `size` (`default`, `sm`, `lg`), `isActive`, `tooltip`. `SidebarMenuSubButton`: `size` (`sm`, `md`), `isActive`. `SidebarMenuAction`: `showOnHover`. It and `SidebarMenuBadge` sit at `right-1`, and the button reserves `pr-8` for an action.
  - Composition: `SidebarGroup > SidebarGroupLabel + SidebarGroupAction + SidebarGroupContent + SidebarMenu > SidebarMenuItem > SidebarMenuButton + SidebarMenuAction + SidebarMenuBadge`. `SidebarGroupAction` is the only documented label control.
  - Block `sidebar-07` `nav-projects`, the row menu, also in `sidebar-08`, `sidebar-16` and `dashboard-01`'s `nav-documents`. The docs' `sidebar-demo` writes `w-48 rounded-lg` here; the base-nova block wins for our style:
    ```tsx
    <SidebarMenuItem>
      <SidebarMenuButton render={<a href={item.url} />}>...</SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger render={<SidebarMenuAction showOnHover className="aria-expanded:bg-muted" />}>
          <RiMoreLine /><span className="sr-only">More</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-fit" side={isMobile ? "bottom" : "right"} align={isMobile ? "end" : "start"} />
      </DropdownMenu>
    </SidebarMenuItem>
    ```
  - Block `sidebar-08` `nav-main`: `Collapsible render={<SidebarMenuItem />} > SidebarMenuButton + CollapsibleTrigger render={<SidebarMenuAction className="aria-expanded:rotate-90" />} + CollapsibleContent > SidebarMenuSub`.
  - Block `sidebar-07` `team-switcher`, and the docs' `sidebar-header` and `sidebar-footer`: `SidebarMenu > SidebarMenuItem > DropdownMenu > DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}`.
  - `sidebar-group-action`: `SidebarGroupLabel + SidebarGroupAction`. `sidebar-menu-badge`: `SidebarMenuButton + SidebarMenuBadge`. Block `sidebar-01` `search-form`: an `sr-only` `Label`, `SidebarInput className="pl-8"` and an absolute `size-4` icon.
- **Our usage:** `components/agents/sidebar.tsx`, `components/agents/sidebar-demo.tsx`, `components/console/sidebar.tsx`, `app/(console)/console/layout.tsx`, `components/dashboard/sidebar.tsx`, `components/docs/sidebar.tsx`, `app/(content)/docs/layout.tsx`, `components/shell/sidebar-adaptive.tsx`, `components/shell/sidebar-dropdown-menu.tsx`, `components/shell/sidebar-floating-trigger.tsx`, `components/shell/sidebar-shell.tsx`, `components/shell/sidebar-user-menu.tsx`.
- **Deliberate deviations:**
  - Fill icons where the blocks use `*Line`, such as the agents sidebar's `RiMoreFill` and `RiArrowRightSFill` (see the top; Line outside the agents sidebar until the audit's switch).
  - The thread ⋯ menu (`ThreadMenu` in the agents sidebar) is composed as `nav-projects`: `DropdownMenuTrigger render={<SidebarMenuAction className={cn("right-1.5 aria-expanded:bg-muted", menuShown)} />}`, `RiMoreFill`, `DropdownMenuContent className="w-fit" side={isMobile ? "bottom" : "right"} align={isMobile ? "end" : "start"}`, and an icon and a `<span>` label in each item. Its one kept deviation is the visibility classes (`menuShown`) in place of `showOnHover`, which shows the action on `group-focus-within` and so leaves it showing after a mouse click; tailwind-merge cannot strip that from a `cn` override. The menu takes the row toggle's `focus-visible` rules, plus `showOnHover`'s own `aria-expanded:opacity-100` while open (design skill, Sidebars).
  - The menu sits in the unread count's place, and the badge hides while the menu shows (`unreadHidden`), so on a phone, where the menu always shows, the count does not. No shadcn example pairs an action with a badge, and both sit at `right-1` (design skill, Sidebars).
  - The row toggle's classes: `toggleShown` and `effortHidden` (design skill, Sidebars), and `pr-2` on the button, which cancels shadcn's `pr-8` because the toggle covers the effort icon instead of taking space.
  - `right-1.5` on `SidebarMenuAction` and `SidebarMenuBadge`, where shadcn has `right-1`, so the right column centers on the effort icons' center (design skill, Sidebars).
  - `countCell`, a group label's count in an icon-wide centered box (design skill, Sidebars).
  - The Threads pager: two ghost `icon-xs` Buttons in `SidebarGroupLabel`, pulled right with `-mr-1` (design skill, Sidebars).
  - `min-h-42` on the paged `SidebarMenu`, five rows' height, which assumes `size="default"` rows (design skill, Sidebars).
  - `threadsPageAtom`, a jotai atom for the Threads page (design skill, State).
  - `space-y-0.5` on `SidebarMenu`, where shadcn has `gap-0`, and `pb-0` on `SidebarMenuSub` (design skill, Spacing).
  - `SidebarTrigger` takes children: `patchSidebar()` in `shadcn-customize.ts`.
  - `cursor-default` on the read-only `DocsSearch` input (design skill, Cursor).

## Spinner

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/spinner, primary demo (`spinner-demo`):
  ```tsx
  <Item variant="muted">
    <ItemMedia><Spinner /></ItemMedia>
    <ItemContent><ItemTitle className="line-clamp-1">Processing payment...</ItemTitle></ItemContent>
  </Item>
  ```
  - Variants and sizes: none. A `size-*` class resizes it from its default `size-4`. It renders `role="status" aria-label="Loading"`.
  - `spinner-button`: `<Button disabled size="sm"><Spinner data-icon="inline-start" />Loading...</Button>`, so the label stays. `spinner-badge` follows the same `data-icon` rule. `spinner-input-group`: `InputGroupAddon align="inline-end" > Spinner`. `spinner-empty`: `EmptyMedia variant="icon" > Spinner`.
- **Our usage:** `components/common/access.tsx`, `components/common/navbar.tsx`, `components/dashboard/sidebar.tsx`, `components/data-table.tsx`, `app/waitlist/page.tsx`.
- **Deliberate deviations:**
  - Its loader in `ui/spinner.tsx` is to take a Fill icon through `shadcn-customize.ts` (see the top; still Line until the audit's switch).
  - Always bare at `size-4`, stricter than shadcn's `size-*` (design skill, Components: Loading).
  - The data table's spinners sit in a plain centered div, not `spinner-empty` (design skill, Components: Loading, where the wait is; code comment on `DataTable`).
  - Its props are typed off `RemixiconComponentType`: `patchSpinner()` in `shadcn-customize.ts`.

## Table

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/table, primary demo (`table-demo`):
  ```tsx
  <Table>
    <TableCaption>A list of your recent invoices.</TableCaption>
    <TableHeader><TableRow><TableHead className="w-[100px]">Invoice</TableHead></TableRow></TableHeader>
    <TableBody><TableRow><TableCell className="font-medium">INV001</TableCell></TableRow></TableBody>
    <TableFooter><TableRow><TableCell colSpan={3}>Total</TableCell></TableRow></TableFooter>
  </Table>
  ```
  - Variants and sizes: none. Width and alignment come from cell utilities.
  - `table-actions`: `TableCell className="text-right" > DropdownMenu`, the destructive item after a separator.
- **Our usage:** `components/data-table.tsx`, the only importer.
- **Deliberate deviations:**
  - Grid and flex display, explicit ARIA roles, virtualized rows and a sticky header: code comment on `DataTable` (TanStack's virtualized infinite-scroll example).
  - The shadcn `table-container` is flattened through its `data-slot`: the same comment.
  - No `TableCaption`; the scroll region's `aria-label` names the table (design skill, Layout and landmarks).
  - Centered columns drop their padding, and widths are spacing units (design skill, Data tables; code comments in `data-table.tsx`).

## Tabs

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/tabs, primary demo (`tabs-demo`):
  ```tsx
  <Tabs defaultValue="overview">
    <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="analytics">Analytics</TabsTrigger></TabsList>
    <TabsContent value="overview"><Card>...</Card></TabsContent>
  </Tabs>
  ```
  - Variants and sizes: `TabsList variant` is `default` or `line`. `Tabs orientation` is `horizontal` or `vertical`. `TabsTrigger` takes `disabled`.
  - `tabs-icons`: a Preview and Code pair, `<TabsTrigger value="preview"><AppWindowIcon />Preview</TabsTrigger>`.
- **Our usage:** `components/docs/preview.tsx`.
- **Deliberate deviations:**
  - `gap-4` on `Tabs`, a taller list and `h-8` triggers: code comment in `preview.tsx` (as tall as a sidebar row, with the panel 16px below).
  - The preview panel's `h-160` and centering: code comment there, and design skill, Component docs.
  - `[&_figure]:my-0` on the code panel cancels the docs prose margins.

## Toast

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/toast, which is Base UI's Toast, not Sonner. Primary demo (`toast-demo`): `<Toaster />` mounts once, after `<main>` in the root layout, and a toast is raised imperatively:
  ```tsx
  const id = toast.add({
    title: "Event created",
    description: "Sunday, December 3 at 9:00 AM",
    actionProps: { children: "Undo", onClick() { toast.close(id) } },
  })
  ```
  - Variants and sizes: none. `type` is `success`, `info`, `warning`, `error` or `loading`. `priority` is `low` (the default, announced politely) or `high` (announced urgently).
  - `toast-types`: `toast.add({ type: "success", description })`; the error call adds `priority: "high"`. `toast-promise`: `toast.promise(promise, { loading, success, error })`.
- **Our usage:** mounted in `app/providers.tsx`. Raised from `lib/api/bulk.ts`, `lib/clipboard.ts`, `app/waitlist/page.tsx`, `components/common/access.tsx`, `components/dashboard/sidebar.tsx`, `components/docs/copy-as-markdown.tsx`, `components/shell/sidebar-user-menu.tsx`, and the console's allowlist `data-table.tsx` and users `role-select.tsx`.
- **Deliberate deviations:**
  - Its status icons in `ui/toast.tsx` are to take Fill icons through `shadcn-customize.ts` (see the top; still Line until the audit's switch).
  - The `Toaster` is mounted in `providers.tsx`, not `layout.tsx`: design skill, the toast rule under Data tables; `shadcn-customize.ts` also resets `app/layout.tsx` after every sync.
  - A one-line message goes in `title`, not `description` (design skill, the toast rule: `toast.add({ title, type })`, neutral surface).

## Tooltip

- **shadcn's usage:** https://ui.shadcn.com/docs/components/base/tooltip. Installation puts `<TooltipProvider>` around the app at its root. Primary demo (`tooltip-demo`):
  ```tsx
  <Tooltip>
    <TooltipTrigger render={<Button variant="outline" />}>Hover</TooltipTrigger>
    <TooltipContent><p>Add to library</p></TooltipContent>
  </Tooltip>
  ```
  - Variants and sizes: `TooltipContent` takes `side` (`top` by default, `right`, `bottom`, `left`), `align`, `sideOffset` and `alignOffset`. `TooltipProvider` takes `delay` (ours defaults to 0).
  - `tooltip-keyboard`: `TooltipTrigger render={<Button variant="outline" size="icon-sm" />}`, with a `Kbd` in the content. `tooltip-disabled`: `TooltipTrigger render={<span className="inline-block w-fit" />}` around a disabled Button. Registry `tooltip-example`: "On Link" (`render={<a href="#" />}`) and "With Icon" (`render={<Button variant="ghost" size="icon" />}` with an `sr-only` label).
- **Our usage:** `components/agents/sidebar.tsx`, `components/common/navbar.tsx`, `components/data-table.tsx`, `components/docs/copy-as-markdown.tsx`, and through `SidebarMenuButton tooltip` in `components/console/sidebar.tsx` and `components/docs/sidebar.tsx`.
- **Deliberate deviations:**
  - Fill icons on its triggers (see the top; Line outside the agents sidebar until the audit's switch).
  - A title's tooltip cancels its own opening when the text fits, through `onOpenChange` and `details.cancel()` (design skill, State).
  - `DataTableCellText` measures overflow with `useState`, legacy code the design skill (State) names and says not to copy.

Open items, the deviations with no recorded reason, are in `.github/notes/audits/2026-10-20-shadcn-usage.md`.
