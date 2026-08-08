# NyambikaAI Homepage — UX Enhancement Implementation Plan

Companion to [`UX_AUDIT_HOMEPAGE.md`](./UX_AUDIT_HOMEPAGE.md). Ordered by impact-to-effort ratio. Each item lists concrete files and the specific change — no new abstractions beyond what's needed.

---

## Phase 0 — Decisions needed before any code (1 conversation, not a sprint)

These block Phase 1 and shouldn't be guessed at:

1. **Hero section**: reintroduce `HeroSection.tsx` (rebuilt against current tokens) on `page.tsx`, or is the grid-first homepage intentional? *Recommendation: reintroduce a trimmed version — first-time-visitor context is a real gap.*
2. **Dead components** (`Header.tsx`/`HeaderOld`, `CategoryCards.tsx`, `ProducerEncouragementBanner.tsx`): delete, or revive? *Recommendation: delete `Header.tsx` and `CategoryCards.tsx` outright — `RoleBasedNavigation` and `HomeProducts`' own category grid already fully replace them. Decide `ProducerEncouragementBanner.tsx` based on whether there's a page it's meant for (e.g. a "become a seller" landing page) — if so, wire it there instead of leaving it orphaned.*
3. **Producer subscription price**: confirm the real number (15,000 or 50,000 RWF/month) with whoever owns pricing before touching either file.

---

## Phase 1 — Fix user-facing correctness bugs (P0/P1, low effort, no design work needed)

| Task | File(s) | Change |
|---|---|---|
| Distinguish error from empty state | `HomeProducts.tsx` (~338-364, 866-887) | Surface `isError`/`error` from the `useQuery`/`useInfiniteProducts` calls; render a distinct "Something went wrong, retry" state with a retry button (`refetch()`) instead of falling through to the empty-results copy |
| Remove or wire up search | `HomeProducts.tsx` (316-335, 432-468) | Either render the search input the state already supports, or delete `searchQuery`/`debouncedSearch`/`searchExpanded` and the filtering that depends on it if search isn't planned for this release |
| Explain verified-producer filtering | `HomeProducts.tsx` (398-481) | Add a small "Showing verified sellers" label when the filter is active; make the >30-producer fallback behavior consistent (either always filter, with pagination-aware verification lookups, or drop the cap-based silent bypass) |
| Fix bottom-nav icon collision | `MobileBottomNav.tsx` (10, 12) | Swap the "Cart" entry's icon from `ShoppingBag` to `ShoppingCart` (already available via `lucide-react`) |
| Reconcile subscription pricing | `ProducerEncouragementBanner.tsx:183`, `SocialMediaBanner.tsx:143` | Single source of truth for the number (ideally a shared constant/config, not two hardcoded literals) |
| Fix manifest cache-busting | `layout.tsx` (62, 119) | Replace `Date.now()` with a build-time version (e.g. `process.env.NEXT_PUBLIC_BUILD_ID` or a static version string) so the manifest is cacheable again |

## Phase 2 — Homepage structure (P0, the highest-leverage design work)

| Task | File(s) | Change |
|---|---|---|
| Add a hero/value-prop section | `page.tsx`, `HeroSection.tsx` (rebuild) | Rebuild against current gold/paper tokens (drop `gradient-bg`/`glassmorphism`/`electric-blue` classes), fix the missing `relative` wrapper on the `next/image fill` category-thumbnail bug (currently line 124), route copy through `useLanguage()`/`t()`, and reduce to one clear primary CTA ("Try It On") with browsing as secondary rather than two equal-weight buttons |
| Delete confirmed-dead components | `Header.tsx`, `CategoryCards.tsx` (pending Phase 0 decision) | Remove files and any leftover imports/exports; keeps future audits and contributors from tripping over stale-token code |
| Unify grid breakpoints | `HomeProducts.tsx` (737, 797) | Pick one column-progression rhythm (e.g. `2 → 3 → 4 → 6`) and apply it to both the category grid and product grid so density feels intentional, not arbitrary |
| Clean up empty animated spans | `HomeProducts.tsx` (730, 733, 780, 830, 837) | Either restore intended emoji/icon content or delete the empty animated elements |

## Phase 3 — Consistency pass (P1/P2, mechanical, safe to parallelize across files)

| Task | File(s) | Change |
|---|---|---|
| Localize the bottom nav | `MobileBottomNav.tsx` (9-13) | Route labels through `t()`/`useLanguage()`, matching `Footer.tsx`'s pattern |
| Localize 404 / error pages | `not-found.tsx`, `error.tsx` | Same — bring these two recovery screens up to the same i18n bar as the rest of the storefront |
| Migrate hardcoded gray/dark pairs to semantic tokens | `not-found.tsx`, `error.tsx`, `HomeProducts.tsx` (`BRAND_GRADIENTS`, coral badge) | Replace `text-gray-900 dark:text-white` etc. with `text-foreground`/`bg-card`/`text-muted-foreground`; replace the `--coral-rgb` arbitrary value with a real Tailwind theme color if the coral accent is intentional, otherwise switch to an existing `gold`/`primary` token |
| Fix dynamic-class Tailwind anti-pattern | `ProducerEncouragementBanner.tsx:153` (if kept) | Replace `` `bg-${benefit.color}` `` with a lookup map of fully-written class strings so Tailwind's compiler can find them statically |
| Reconcile "brand gold" hex values | `layout.tsx:156` vs. `globals.css:17` | Point `NextTopLoader`'s color at the same `--primary` CSS variable instead of a second hardcoded hex |
| Add `aria-label` to `CategoryCard` | `HomeProducts.tsx` (93-194) | Match the `aria-pressed`/`title` pattern already used on the adjacent "Brands" story cards |

## Phase 4 — Performance & polish (P2/P3)

| Task | File(s) | Change |
|---|---|---|
| Memoize category product counts | `HomeProducts.tsx` (746-749) | Compute a `Map<categoryId, count>` once from the product list instead of filtering per category per render |
| Migrate fonts to `next/font` | `globals.css:1`, `layout.tsx:36` | Revisit the build-environment constraint noted in the code comment; if still blocking, at minimum add explicit `font-display: swap` to the `@import` to reduce FOIT |
| Add `prefers-reduced-motion` guard | `globals.css` (`.animate-float` and friends), `HomeProducts.tsx` category-card particles | Wrap decorative animations in a media query so motion-sensitive users get a static equivalent |
| Add error telemetry | `error.tsx` (16-18) | Wire the caught error into whatever monitoring is already used elsewhere in the stack (or note explicitly if none exists yet and flag as a separate infra task) |

---

## Suggested sequencing

1. **Phase 0** (decisions) → **Phase 1** (bug fixes) can ship together in one PR; low risk, high visible correctness improvement.
2. **Phase 2** (hero + dead-code removal) is the one phase that needs design sign-off on copy/visuals before implementation — treat as its own PR/review cycle.
3. **Phase 3** and **Phase 4** are mechanical and can be split across multiple small PRs, safely parallelized since most touch disjoint files.

No phase requires a new dependency, new abstraction layer, or architectural change — every item is a scoped edit to an existing file.
