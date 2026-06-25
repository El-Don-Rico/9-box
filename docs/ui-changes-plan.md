# Plan — follow-up UI changes (round 2)

Branch: `claude/wonderful-ride-6hoi4i`. Each item below is presentation/behavior-scoped
and lands in the same PR style as before. **Two items are already partly/fully built** in
the rewrite — noted inline so we don't redo them.

---

## 1. Default density → Compact  *(small)*
- `src/app/layout.tsx`: `density-regular` → `density-compact` on `<html>`.
- `src/components/theme/theme-provider.tsx`: default density state + localStorage fallback
  `"regular"` → `"compact"`.
- No CSS work — `.density-compact` already exists. Users can still switch via the appearance menu.

## 2. Strip top-right nav: search, notifications, help  *(small)*
- `src/components/layout/topbar.tsx`: remove the `.search` input block, the bell `icon-btn`,
  and the help `icon-btn`; drop now-unused `Search`/`Bell`/`HelpCircle` imports.
- **Keep** the appearance (theme/density) menu — not in the removal list. Breadcrumb stays (see #3).

## 3. Clickable top breadcrumb  *(small — DECIDED: breadcrumb links only)*
- `src/components/layout/topbar.tsx`: make each breadcrumb segment a real `<Link>`. Compute the
  href as the cumulative path (`/admin`, `/admin/users`, …) so clicking **Admin** on
  `/admin/users` returns to `/admin`, etc. The leading "Visory" links to `/dashboard`.
- No admin tab bar (per your call). Keep it to navigable breadcrumbs.

## 4. User management under Admin  *(already exists — reachable via #3)*
- Lives at `/admin/users`, linked from `/admin` and the manager dashboard. With #3, the
  breadcrumb also walks you back into the Admin area. No new build unless you want added
  capabilities there.

## 5. Kanban: drag *In Assessment → Ready to Meet* with override warning  *(medium)*
Today `NOT_READY` ("In Assessment") is read-only: cards aren't draggable, the column isn't a
drop target, and the server **rejects** any move out of `NOT_READY`
(`api/meetings` PATCH, "Assessments must be submitted…"). The auto-advance lives in
`maybeMarkReadyToMeet` (both assessments submitted → `READY_TO_MEET`).

- **Frontend** (`kanban-board.tsx`):
  - Allow dragging `NOT_READY` cards; make `READY_TO_MEET` accept a drop from `NOT_READY`
    (only that target for an in-assessment card).
  - On drop: if **both** self + manager assessments are submitted → move normally (covers the
    "should've auto-moved but didn't" case). If **not** both submitted → open a warning modal:
    *"Self and/or manager assessment isn't complete. Move to Ready to Meet anyway?"* →
    Confirm sends the move with `override: true`.
  - Edge case: a report with **no manager assessment started** (`managerAssessmentId == null`)
    can't have a meeting status — the modal will say a manager assessment must be started first
    and block. (Assumption — flag if you'd rather auto-create a draft assessment.)
- **Backend** (`api/meetings` PATCH + `lib/meeting.ts`):
  - Accept `override?: boolean`. When current status is `NOT_READY`, allow the transition **only**
    to `READY_TO_MEET` **only** when `override` is true and the user is a manager of that report;
    otherwise keep the existing 400.

## 6. Team → "Assessment Cycles" (dashboard Kanban + cycle picker)  *(medium)*
- New nav item under the sidebar **Team** section (manager+ only, same gate as My Team/Analysis):
  `Assessment Cycles` → `/team/cycles`, icon `KanbanSquare`. Add `cycles → "Assessment Cycles"`
  to the breadcrumb label map.
- New page `src/app/(app)/team/cycles/page.tsx` (client): fetch `/api/cycles`, a **cycle
  `<select>`** in the page-header actions (defaults to the open/most-recent cycle), fetch
  `/api/team?cycleId=…`, render the **same** `<KanbanBoard members cycle />` used on the
  dashboard — identical design, filters, timeline, and (with #5) drag/override.
- Reuses the existing `KanbanBoard` component and `/api/team` (already accepts `cycleId`), so this
  is mostly a thin page + selector. Optionally factor the dashboard's board block into a shared
  wrapper to avoid drift.

## 7. Notes + Actions across meeting AND assessment/summary  *(medium — DECIDED: both screens)*
Goal: a consistent **Notes** + **Actions** structure everywhere, with Actions = linked tasks.

- **1:1 meeting** (`/meeting/[assessmentId]`, `meeting-editor.tsx`): already Notes + Actions.
  Polish — merge the "Actions from this meeting" + "Add actions" cards into one **Actions**
  section; make each existing action **click through to its task**.
- **Manager assessment** (`assess/[employeeId]`) and **Summary** (`summary/[employeeId]`):
  today these render separate `ReviewNotesPanel` + `GoalsPanel` (+ key-metrics). Introduce the
  same two-block **Notes** (the review/meeting notes) + **Actions** (tasks, reusing the
  meeting-editor action rows → `POST /api/tasks`) layout so the three screens read the same.
  - `ReviewNotesPanel` becomes the **Notes** block (keep its data; restyle/relabel).
  - A shared **Actions** block (extract the action-row UI from `meeting-editor.tsx` into
    `src/components/meetings/actions-editor.tsx`) is reused on all three screens.
  - **Assumption to confirm:** the existing **Goals** and **Key-Metrics** panels are *retained*
    (they're distinct from "actions"). If you want Goals folded into Actions or removed, say so —
    that's a bigger functional change I won't make unprompted.

---

## Sequencing  (all in the existing PR; `tsc` + `eslint` + `next build` green per group)
- **A** (quick): #1 density, #2 topbar strip, #3 breadcrumb links → one commit.
- **B**: #5 Kanban drag + override (frontend + `api/meetings`), then #6 Assessment Cycles page
  (reuses the board) → commit each.
- **C**: #7 extract shared Actions editor + Notes/Actions on meeting, assess, summary → commit.

