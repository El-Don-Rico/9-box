# Visory restyle brief (for screen agents)

You are restyling an existing Next.js 16 / React 19 / Tailwind v4 app ("Visory
Performance", a 9-box performance tool) to the Visory editorial aesthetic. The
**design-system foundation already exists** — your job is ONLY to restyle the
markup of the files assigned to you to use it.

## Absolute rules
- **Do NOT change behavior, data fetching, props, state logic, server calls, or
  routing.** Presentation only: classes, element structure, copy of labels/headings.
- **Do NOT edit** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/theme/*`,
  `src/components/layout/*`, or `src/components/ui/*` (the primitives). Only consume them.
- Only edit the files explicitly assigned to you. Touch nothing else.
- Keep `npx tsc --noEmit` passing for your files (no new type errors).
- Remove now-dead imports you replace (e.g. old `CardHeader` if unused).

## Available primitives (import and use these)
- `@/components/ui/button` → `<Button variant="primary|secondary|magenta|ghost" size="sm|md|lg">`.
  `primary` = navy slate. `magenta` = the scarce key CTA. `secondary` = bordered paper. No red.
- `@/components/ui/card` → `<Card hover navy>`, `<CardHeader>` (=.card-head row), `<CardTitle>`, `<CardContent>`.
- `@/components/ui/badge` → `<Badge variant="default|magenta|navy|success|slate|warning" dot>`.
- `@/components/ui/avatar` → `<Avatar name="Jane Doe" size="sm|md|lg|xl" />` (deterministic color).
- `@/components/ui/progress` → `<Progress value={0..100} ink? />`, `<DotRow total done />`.
- `@/components/ui/toggle` → `<Checkbox checked onChange />`, `<Toggle checked onChange />`.
- `@/components/ui/drawer` → `<Drawer open onClose title meta footer width="default|wide|xwide">`.
- `@/components/ui/page-header` → `<PageHeader eyebrow title sub actions />`, `<Eyebrow>`.
- `@/components/ui/confetti` → `<Confetti trigger={n} />` (optional milestone celebration).
- Icons: `lucide-react` (line icons, size 14–20, strokeWidth 1.6).

## CSS utility classes available (from globals.css)
`.eyebrow` `.page-title` (use `<em>` for the italic accent word) `.page-sub`
`.serif` `.mono` `.tnum` `.lead` `.small` `.tiny` `.muted` `.muted-2`
`.card` `.card-hover` `.card-navy` `.card-head` `.card-title` `.card-action`
`.btn .btn-primary .btn-magenta .btn-ghost .btn-sm`
`.chip .chip-magenta .chip-navy .chip-success .chip-slate .chip-warning .chip-dot`
`.progress` `.dotrow` `.check` `.toggle` `.avatar .sm/.md/.lg/.xl .tint-1..8`
`.grid-12 .col-4 .col-5 .col-6 .col-7 .col-8 .col-12`
`.dt-head .dt-row` `.drawer*` `.divider-v` `hr.rule` `.fade-up`

## Tailwind color tokens available
`ink ink-2 ink-3 ink-4`, `canvas paper paper-2 line line-2`,
`navy navy-2 navy-3`, `magenta magenta-2 magenta-3`,
`cobalt plum teal amber rose success`. Use as `text-*`, `bg-*`, `border-*`.
Fonts: `font-heading` (serif display), `font-body`, `font-mono`.

## The look (hard rules — what makes it "Visory")
1. **One accent: magenta, scarce** (~2–4 magenta elements per screen). No second
   loud color; magenta also carries "critical"/danger (no separate red).
2. **Serif (`.serif` / page-title / card-title) for anything large, with one word
   in `<em>` italic.** Sans (body) never gets large.
3. **Slate-not-black** text (`text-ink`), warm/cool off-white surfaces
   (`bg-paper` / `bg-paper-2` / page is `bg-canvas`), cool-grey lines
   (`border-line`). Never pure black/white text-on-bg, never `text-gray-*`,
   `bg-white`, `bg-gray-*`, `text-red-*`, etc. — replace ALL of those.
4. **Borders over shadows.** Cards rest on `border-line`, no shadow (drawers/modals
   may use shadow). Drop `shadow-sm`/`shadow`.
5. **Mono + tabular numbers** (`.mono .tnum`) for dates, counts, scores, "3 / 8", IDs.
6. **Eyebrow kickers** (`.eyebrow`, 10px uppercase) above section/page headings.
7. No gradient backgrounds, glassmorphism, emoji, or drop-shadowed colored icon tiles.
8. Dark `--navy` surfaces reserved for ~one feature card per screen (`<Card navy>`).

## Page structure pattern
Each page should open with a `<PageHeader eyebrow="…" title={<>Word <em>accent.</em></>}
sub="…" actions={…} />` then content in cards/`.grid-12`. Replace old color
utilities everywhere. Old tokens to replace if present: `text-visory*`,
`bg-visory*`, `text-visory-navy`, `border-visory-border`, `text-gray-600`,
`bg-gray-50`, `text-red-*`, `rounded-lg shadow-sm`, `font-bold` on big headings
(use serif weight 400 instead).

## Replacing rating/status color helpers
`getRatingColor()` in `@/lib/utils` returns old `bg-red/amber/green` classes. If
you render rating chips, prefer `<Badge variant="success|warning|magenta">` by
rating (3→success, 2→warning, 1→magenta) instead of the helper string.

Keep changes faithful to the existing information architecture — same sections,
same data, just reskinned.
