# UI Full-Rewrite Plan — Visory editorial aesthetic

**Target codebase:** `9-box` ("Visory Performance") — Next.js 16 (App Router), React 19, Tailwind v4, NextAuth, Prisma.
**Design source:** `design_handoff_visory_staff_home` (`styles.css` + spec). Treat it as a **visual system**, not a screen set.
**Base branch:** `claude/hopeful-brahmagupta-rznpmw` (already merged into the working branch `claude/wonderful-ride-6hoi4i`).

---

## 1. Interpretation / scope

The handoff is from a *different* Visory product (a staff-home / onboarding portal). Its README is explicit:
"recreate this look in the target codebase's existing environment … restyle *that* primitive … apply it over your
existing components and layout." So this is a **re-skin of the existing 9-box performance app**, not an import of the
onboarding screens. We keep every current route, data flow, and server action; we replace the **design system and the
shell**, then restyle each screen.

**In scope:** design tokens, fonts, the app shell (nav → light sidebar rail + top bar), all 5 UI primitives, a set of
new primitives the system needs (eyebrow, chip, avatar, progress, toggle, drawer, data-row/table), and every page under
`(app)` and `(auth)`.
**Out of scope (unless requested):** dark "Pulse" theme, density switcher, confetti, new features/routes, data-model
changes. Build the system so dark/density can be added later by swapping a root class.

---

## 2. Gap analysis (current → target)

| Aspect | Current | Target (handoff) |
|---|---|---|
| Accent | pink `#df0074` | magenta `#E5066E` (+ `-2 #BD0058`, tint `-3 #FFE5F0`) |
| Dark/brand | navy `#00314f` (saturated blue) | slate navy `#2D3340` (cool, desaturated) |
| Text | navy on `#fafafa` | slate ramp `--ink #1F2733 / -2 / -3 / -4`, never pure black |
| Surfaces | white / light-grey | `--canvas #F0F2F6`, `--paper #fff`, `--paper-2 #F7F8FB`, lines `--line/-2` |
| Display font | Philosopher 700 | **Instrument Serif 400** (with one *italic* word per headline) |
| Body font | Lato | **Geist** (400/500/600) |
| Numbers | Lato | **Geist Mono**, `tabular-nums` |
| Shell | dark top navbar, `max-w-7xl` centered | **light cool-grey sidebar rail** (`#ECEEF3`) + top bar (breadcrumb, ⌘K search, bell/help) |
| Shadows | `shadow-sm` everywhere | borders over shadows; `--shadow-lg` only on drawers/modals |
| Eyebrows | none | uppercase 10px kicker above most headings |
| Detail panels | full pages / inline | **right-slide drawers** |

---

## 3. Approach — foundation first, then screens

Re-theme the token layer and primitives **once**, so most screens inherit ~70% of the new look automatically; then do
per-screen passes for layout/eyebrows/serif/drawers. Each phase is independently shippable and reviewable.

### Phase 0 — Foundation: tokens + fonts (½ day)
- Rewrite `src/app/globals.css`:
  - Replace the `:root` block with the full **light token set** (`--ink*`, `--canvas/paper/paper-2`, `--line/-2`,
    `--navy*`, `--magenta*`, categorical `--cobalt/plum/teal/amber/success`), plus `--radius-*`, `--shadow-*`.
  - Scope tokens under a `.theme-ledger` class on `<html>`/`<body>` so a `.theme-pulse` dark block can be added later.
  - Map them into Tailwind v4 `@theme inline` (`--color-ink`, `--color-magenta`, `--color-paper`, …) so utilities like
    `text-ink`, `bg-paper`, `border-line` exist. Keep old `--visory-*` names as aliases for one transition pass, then remove.
  - Add base body rules: 14px, `letter-spacing:-0.005em`, `font-feature-settings:"ss01","cv11"`; restyle the `.prose`
    and `.tiptap` blocks to the new tokens.
- `src/app/layout.tsx`: swap the Google Fonts link to **Instrument Serif (400 + italic), Geist (400/500/600),
  Geist Mono (400/500)**; prefer `next/font` for no-FOUT. Set `--font-display/-body/-mono`. Add `theme-ledger` to `<html>`.
- Add a tiny `Eyebrow` + serif-`PageTitle` helper and an `<em>`-accent convention for headlines.

### Phase 1 — Primitives (1 day)
Restyle in place (same import paths, so no churn across pages):
- **Button** — pill, `8×14`, 13px/500, `1px --line-2`, `--paper`/`--ink`; variants `primary`(`--navy`),
  `magenta`(key CTA), `ghost`; `active:translateY(1px)`; 12–14px leading icon, `gap:7px`. Map current
  `primary→magenta` or `navy` per CTA importance; `danger→magenta` (no separate red).
- **Card** — `--paper`, `1px --line`, 14px radius, 20px pad, no shadow by default; add `CardHead` (eyebrow + serif
  title + sub + top-right action link) and a `hover-lift` variant (`translateY(-2px)`, border→`--line-2`).
- **Badge/Chip** — pill `3×9`, 11px/500, `--paper-2`/`--line`; variants `magenta/success/slate/navy`; optional 5px dot.
- **Input/Select/Textarea** — `--paper-2` fill, `--line-2` border, magenta focus ring; labels become eyebrows.
- **New primitives** (`src/components/ui/`): `Avatar` (deterministic categorical color from name, sizes 26/36/52/92),
  `Progress` (6px bar + dot-row), `Checkbox` (24px, success-fill), `Toggle` (38×22), `Drawer`
  (right slide, `.28s cubic-bezier(.2,.7,.2,1)`, backdrop blur, sticky header), `DataTable`/`Row` (grid columns,
  `--paper-2` header, row-hover), `Icon` (adopt **lucide-react** — matches the 1.6-stroke line set; add dep).

### Phase 2 — App shell (1 day)
- Replace `Navbar` (dark top bar) with a **light sidebar rail** component: `#ECEEF3`, slate text, brand = magenta
  rounded square with italic-serif "v", eyebrow section labels, active item = `rgba(229,6,110,.10)` bg + 3px magenta
  left bar, footer avatar + name/role. Drive items from the existing `getNavLinks(role)` (keep RBAC logic).
- Add a **TopBar**: breadcrumb (mono, `--ink-3`), 280px pill search with `⌘K`, bell (magenta dot when unread) + help.
  (Search/bell can be visual-first, wired to existing data incrementally.)
- Rework `src/app/(app)/layout.tsx` to a `sidebar + (topbar + main)` grid on `--canvas`; page padding 28–32px, add the
  `fadeUp` mount animation (respect `prefers-reduced-motion`).
- `(auth)/layout.tsx` + login/register/join/invite/forgot/reset: restyle to the splash aesthetic (navy left panel with
  giant italic-serif mark + the white form panel).

### Phase 3 — Screen-by-screen restyle (3–5 days)
For each route: page header (eyebrow + serif title w/ italic word + lead + right-aligned buttons) → 12-col grid
(7/5, 4/4/4) → cards/tables/chips from the new primitives → move heavy detail views into drawers → mono+tabular for
all numbers/dates. Suggested order (highest visibility first):

1. **`/dashboard`** (447 lines, Kanban) — anchor screen; sets the pattern. Restyle member cards, Kanban columns, stat cards.
2. **`/my-reviews`** + **`/self-assessment`** + **`/assess/*`** — assessment flows; serif section heads, step-form, sliders for axis-style inputs.
3. **`/team`** + **`/team/[employeeId]`** (600 lines) — directory → person **drawer** (avatar, chips, email/book-time, standing meetings, skills).
4. **`/calibration`** (599 lines, 9-box grid/analysis) — charts use the categorical accents only; tabular numbers.
5. **`/tasks`** (359) + **`/summary/[employeeId]`** (446) — tables/rows + drawers.
6. **`/resources/*`** — doc-card grid + reader; reuse the restyled `.prose`/TipTap.
7. **`/admin/*`** (`users` 587, `cycles` 331, `page`) — data tables, toggles, forms.
8. **`/meeting/[assessmentId]`**, kanban-board, meeting-editor, panels (goals/review-notes/tasks/performance-plan).

### Phase 4 — Polish & verify (1 day)
- Accent audit (≤2–4 magenta elements/screen), serif-only-when-big, eyebrows present, borders-over-shadows.
- Motion pass (entrances, hover-lift, drawer easing) + `prefers-reduced-motion`.
- Responsive (sidebar collapses to the existing mobile menu pattern).
- `npm run lint` + `npm run build`; manual walkthrough of each route logged in (verify skill).
- Optional follow-ups: dark "Pulse" theme, density switcher, confetti on milestone, ⌘K command palette.

---

## 4. Sequencing, risk, verification

- **Order matters:** Phase 0→1→2 are prerequisites; Phase 3 screens are parallelizable once primitives land.
- **Low-risk by design:** restyling primitives in place means most pages shift look without edits; logic untouched.
- **Watch-outs:** Tailwind v4 `@theme` token wiring; `next/font` + variable fonts; drawer focus-trap/a11y; keeping
  `getNavLinks` RBAC intact; charts in `/calibration` must use categorical accents, not magenta.
- **Per-phase gate:** lint + build green, visual diff of 1–2 representative screens before moving on.
- **Estimate:** ~7–10 working days for one engineer; Phase 3 compresses with parallel work.

---

## 5. Open decisions (confirm before Phase 0)

1. **Adopt handoff tokens exactly** (magenta `#E5066E`, slate navy `#2D3340`, Instrument Serif/Geist), replacing the
   current pink/navy + Philosopher/Lato? (Assumed **yes**.)
2. **Dark theme + density switcher** — build the hooks now but defer the actual variants? (Assumed **yes, defer**.)
3. **Icon library** — adopt `lucide-react`? (Assumed **yes**.)
4. **Single big PR vs. phased PRs** — recommend phased (foundation PR, then screens) for reviewability.
