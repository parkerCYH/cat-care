# Init: cat-care Frontend

How an agent should orient itself before writing any cat-care frontend code, and how to split the work across multiple sub-agents.

## Where the spec lives

All frontend architecture/UX decisions live on the **wayfinder map**: [cat-care 前台實作規格地圖 (#1)](https://github.com/parkerCYH/cat-care/issues/1), label `wayfinder:map`. Its 10 child tickets (#2–#11) are **all closed** — the map has reached its destination, there is nothing left to decide before implementation starts.

`docs/frontend-plan.md` and `docs/ui/*.md` **no longer exist**. They were deleted once the map was created so the tracker is the single source of truth — do not go looking for them, and do not recreate them.

**The decision is in the resolution comment, not the ticket body.** Each ticket's body holds the original pre-decision reference material (marked "尚未定案" / "參考輸入") plus the `## Question`. The actual answer was posted as a comment right before the ticket was closed. Always read the comment:

```
gh issue view <n> --repo parkerCYH/cat-care --comments
```

To re-check the whole map at a glance (Destination, Notes, and a one-line gist of every decision):

```
gh issue view 1 --repo parkerCYH/cat-care --comments
```

If a decision references a live backend fact (an enum, an endpoint shape, a 403/409 behavior), the map's **Notes** section is the canonical record of what the API looked like when the decision was made — but the backend has changed mid-flight before (twice in one day, during charting). If something looks off against the live `openapi.json`, re-check before assuming the map is still accurate; flag any drift rather than silently building against stale assumptions.

## Quick index (as of 2026-07-11 — verify via `gh` above before relying on this for anything load-bearing)

| Ticket | Decision gist |
|---|---|
| [#2 前台技術棧與工具鏈](https://github.com/parkerCYH/cat-care/issues/2) | React + Vite, PWA, Tailwind, React Hook Form + Zod (orval-generated schema), Recharts, Vercel, orval `client: 'react-query'` → TanStack Query as the data layer |
| [#3 登入與驗證整合方式](https://github.com/parkerCYH/cat-care/issues/3) | Zustand `useAuthStore` (refreshToken in localStorage, accessToken in memory); passive 401-triggered refresh; refreshToken treated as never-expiring; `/auth/callback` branches on an `error` query param |
| [#4 導覽與資訊架構模式](https://github.com/parkerCYH/cat-care/issues/4) | Hamburger menu (no bottom tab bar); general rule — any input field → standalone route, pure yes/no confirm → dialog; multi-cat switcher is a dropdown |
| [#5 PWA 與離線策略](https://github.com/parkerCYH/cat-care/issues/5) | manifest now; service worker via `vite-plugin-pwa`, app-shell caching only — no offline write queue; failed mutations retried manually via TanStack Query, no auto-retry |
| [#11 錯誤重試與空狀態視覺語言](https://github.com/parkerCYH/cat-care/issues/11) | Shared `<EmptyState icon text ctaLabel ctaHref />`; "異常" and "待重試" both red, distinguished by text not color; "待重試" has a button variant (transient) and a list-item variant (persistent) |
| [#6 首頁/快速記錄規格](https://github.com/parkerCYH/cat-care/issues/6) | Summary shows only the latest record per type; `stoolType` uses the backend enum with a Chinese label map; `/bowel/new` and `/weight/new` confirm on back-navigation |
| [#7 排便歷史規格](https://github.com/parkerCYH/cat-care/issues/7) | Calendar tooltip doesn't need per-row abnormal highlighting (dot color is enough); edit/delete buttons fully hidden for non-owner records; delete is a dialog |
| [#8 體重歷史規格](https://github.com/parkerCYH/cat-care/issues/8) | Displays kg (converted from stored grams); `method` uses the backend enum; chart's range toggle stays client-side (no refetch); no bowel-abnormal overlay this round; edit/delete rules mirror #7 |
| [#9 貓咪管理規格](https://github.com/parkerCYH/cat-care/issues/9) | Archive is labeled "刪除" in the UI, dialog-confirmed, hidden everywhere after; invite waits for the API response (no optimistic pending state); "leave" button only shows on the caller's own row; chip-registration custodian gets a small badge, transfer is a standalone route, and a blocked 409 leave shows its error inline in the confirm dialog |
| [#10 路由總表與邊界情況](https://github.com/parkerCYH/cat-care/issues/10) | Final route table (includes `/auth/callback`, `/bowel/:id/edit`, `/weight/:id/edit`, `/cats/:id/transfer-chip`); delete/leave are always dialogs, never routes; a missing or archived cat at `/cats/:id` redirects to `/cats` |

## Workflow: splitting the build across sub-agents

Implementation has a hard dependency shape: one foundational phase, then independent feature work, then one integration pass. Don't parallelize across that shape — the phase-1 agents would be building on a floor that doesn't exist yet.

**Phase 0 — foundation (one agent, do this first, nothing else can start before it lands):**
Scaffold from tickets #2, #3, #4, #5, #11 — Vite + React + TypeScript project, Tailwind, orval pipeline wired to the live OpenAPI spec with the react-query client, the `useAuthStore` Zustand store and `/auth/callback` handling, the router shell with the hamburger-menu layout and the dialog-vs-route convention, `vite-plugin-pwa`, and the shared `<EmptyState>` / retry-state components. Everything in phase 1 imports from this.

**Phase 1 — page features (parallel sub-agents, one per ticket, only after phase 0 is merged):**
- Sub-agent A — ticket #6: home page, `/bowel/new`, `/weight/new`
- Sub-agent B — ticket #7: `/bowel/calendar`, `/bowel/table`, `/bowel/:id`, `/bowel/:id/edit`
- Sub-agent C — ticket #8: `/weight/chart`, `/weight/table`, `/weight/:id`, `/weight/:id/edit`
- Sub-agent D — ticket #9: `/cats`, `/cats/:id`, `/cats/new`, `/cats/:id/edit`, `/cats/:id/invite`, `/cats/:id/transfer-chip`

Run each on an isolated branch or worktree — they touch disjoint route trees and shouldn't conflict, but isolation makes that a guarantee instead of a hope. None of them should edit the phase-0 foundation (auth store, api client, layout shell, shared components); if a phase-1 agent finds it actually needs to change something there, that's a signal to stop and surface it rather than editing shared ground four times over.

**Phase 2 — integration (one agent, after all of phase 1 lands):**
Wire the final route table and redirect rules from ticket #10, and verify the four phase-1 outputs actually slot into the router and hamburger menu correctly end to end.

Each sub-agent's brief should point at its own ticket number and tell it to read the **resolution comment** (not just the body) as its spec — don't paraphrase the decision into the prompt from memory, link it and let the agent pull the current text.
