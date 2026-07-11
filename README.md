# cat-care

Mobile-only PWA frontend for tracking a cat's bowel movements and weight. Backend lives in
the separate `parker-api` repo.

Spec source of truth: GitHub issue #1 (wayfinder map) and its child tickets — see
`docs/agents/init-frontend.md` before touching anything here.

## Scripts

```bash
npm install
npm run dev          # start Vite dev server
npm run build         # typecheck (tsc -b) + production build
npm run lint           # eslint
npm run api:codegen   # regenerate src/api/generated* from the live backend OpenAPI spec
```

`npm run api:codegen` requires the `parker-api` backend running locally and reachable at
`http://localhost:3001` (override via `VITE_API_BASE_URL`, see `.env.example`).

## API client codegen — why generated output is committed

`orval.config.ts` points at the backend's live `/openapi.json` and generates two things:
TanStack Query hooks (`src/api/generated/`, `client: 'react-query'`) and Zod schemas
(`src/api/generated-zod/`, `client: 'zod'`) that React Hook Form consumes directly, per
issue #2's decision to not hand-maintain a second validation schema.

This output is **committed**, not gitignored-and-regenerated-in-CI: the production build
runs on Vercel, which has no route to a developer's `localhost:3001`. Codegen can only
happen locally against a running backend, so the generated files have to already be in
the tree for `vite build` to succeed anywhere else. Re-run `npm run api:codegen` and
commit the diff whenever the backend's API surface changes — `docs/agents/init-frontend.md`
notes the backend has drifted mid-flight before, so treat the live spec as the source of
truth over any cached assumption.

## Layout

- `src/stores/authStore.ts` — Zustand `useAuthStore`. `accessToken` is memory-only,
  `refreshToken` persists to localStorage and is treated as never-expiring. Refresh is
  passive (401-triggered), never on a timer.
- `src/api/mutator.ts` — axios instance + orval's `client: 'react-query'` mutator. Attaches
  the bearer token, and on a 401 does exactly one refresh-and-retry.
- `src/routes/router.tsx` — route table. Convention: any screen with an input field is a
  standalone route; a pure yes/no confirmation is `<ConfirmDialog>`
  (`src/components/ConfirmDialog.tsx`), never a route.
- `src/components/layout/AppLayout.tsx` — hamburger-menu shell (no bottom tab bar);
  `CatSwitcher.tsx` is a stub dropdown, not yet wired to real cat data.
- `src/components/EmptyState.tsx`, `src/components/RetryState/{RetryButton,RetryListItem}.tsx`
  — shared empty/error-state primitives per issue #11. Both retry variants render red;
  they're distinguished by their text content, not color.

## What's NOT built yet

Phase 0 (this scaffold) intentionally has no real feature pages — home, bowel records,
weight records, and cat management land in separate tickets/agents (#6–#9), see
`docs/agents/init-frontend.md` for the split.
