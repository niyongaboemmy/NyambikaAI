# NyambikaAI — Homepage / Customer Storefront UX Audit

**Scope:** `frontend/src/app/page.tsx` and everything it renders: `HomeProducts.tsx`, the globally-mounted shell (`RoleBasedNavigation.tsx`, `Footer.tsx`, `MobileBottomNav.tsx`, `AnimatedAIBackground`), plus `layout.tsx`, `loading.tsx`, `not-found.tsx`, `error.tsx`.
**Date:** 2026-08-08
**Method:** Full read of all homepage-path source files, cross-referenced against `tailwind.config.ts` / `globals.css` design tokens and route-mount points (`providers.tsx`).

---

## 0. Headline finding: half the "homepage" components are dead code

Before any principle-by-principle analysis, the most consequential discovery: **`page.tsx` renders only `<HomeProducts />`.** Four components that look like they belong to the homepage — `HeroSection.tsx`, `CategoryCards.tsx`, `Header.tsx` (exports `HeaderOld`), `ProducerEncouragementBanner.tsx` — are **not imported anywhere** in the app. The real, live shell is `RoleBasedNavigation.tsx` + `Footer.tsx` + `MobileBottomNav.tsx`, mounted globally in `providers.tsx`.

This matters for a UX audit because:
- The dead files still carry the **pre-redesign visual language** (`glassmorphism`, `gradient-bg`, `--electric-blue-rgb`) that code comments in `globals.css` say was retired in favor of the current gold/paper system. They read as "the old design" if anyone stumbles on them.
- **The live homepage has no hero or value-proposition section at all.** A first-time visitor lands directly on a product grid with zero explanation of what Nyambika is or what "AI try-on" means — even though a well-built `HeroSection.tsx` already exists in the repo, unused.
- Any redesign work must first confirm with the team which of these are "build me back in" vs. "delete" — otherwise effort gets spent on components nobody will ever see.

This is flagged as **Finding #1** below and shapes the whole plan: the fastest, highest-leverage UX win available is deciding what to do with code that's already written.

---

## 1. Information Architecture & Visual Hierarchy

**What's there today**, top to bottom on `/`:
1. Global nav (`RoleBasedNavigation`) — logo, browse dropdown, subscription badge, wallet, cart, avatar menu, language switcher
2. `HomeProducts`: horizontally-scrolling "Brands" story strip → "Shop by Category" grid → "Trending" product grid
3. Global footer + mobile bottom nav (5 icons)

**Findings:**

| # | Finding | Evidence |
|---|---|---|
| 1 | No hero / value-prop section — grid-first landing with no framing of the AI try-on value proposition | `page.tsx:5-11`; unused `HeroSection.tsx` |
| 2 | Search is wired but invisible — `searchQuery`, `debouncedSearch`, `searchExpanded` state exists and actively filters the product list, but **no search input is rendered anywhere** in `HomeProducts.tsx` | `HomeProducts.tsx:316-335, 432-468` |
| 3 | Silent, inconsistent content filtering — trending grid only shows products from *verified* producers, capped at 30 unique producers; above that cap the filter silently turns itself off and shows everything. No UI copy ever tells the user this filtering exists | `HomeProducts.tsx:398-481` |
| 4 | Two grids on the same page use different responsive breakpoint logic (category grid: 2→3→4→5 cols; product grid: 2→3→5→6 cols, jumping straight from 3 to 5 at `md`) — inconsistent density rhythm | `HomeProducts.tsx:737, 797` |
| 5 | Empty/animated decorative `<span>` elements with animation classes but no content (likely stripped emoji) — dead visual code | `HomeProducts.tsx:730, 733, 780, 830, 837` |

## 2. Feedback & System Status (Nielsen heuristic #1)

- **No distinct error state.** If the categories or products query fails (`isError`), the code path is identical to "no results match your filter" — user sees a generic empty state with a "Clear Filters" button that cannot fix a server/network error. `HomeProducts.tsx:620-623, 866-887`.
- Loading is otherwise handled well: a full, well-matched skeleton (`HomeProductsSkeleton`, lines 198-308) covers cold load; subsequent loads show a scoped pulsing-grid skeleton for the trending section only.
- Footer newsletter form is the best-behaved async flow in scope: loading state disables the button and swaps its label, and failures route through a shared `handleApiError` → toast (`Footer.tsx:141-205`).
- Global `error.tsx` logs to `console.error` only — no telemetry/Sentry hook visible, so production errors are effectively unobservable once a user closes the tab.

## 3. Consistency & Design System Adherence

The app has a real, documented design system (`tailwind.config.ts`, `globals.css`): semantic tokens (`background`, `foreground`, `card`, `primary`, `muted-foreground`) plus a dedicated `gold` 50–950 scale with WCAG-AA contrast notes in comments. `Footer.tsx` is the best example of following it — every color is a semantic token, dark mode "just works" with zero explicit `dark:` classes needed.

Elsewhere, adherence is inconsistent:
- `HomeProducts.tsx` mixes semantic tokens with hardcoded hex in `BRAND_GRADIENTS` (`#8F6F30`, `#C9A227`, `#6B5423`, `#3D2F14`) and an arbitrary-value CSS var for a "Hot" badge (`bg-[rgb(var(--coral-rgb))]`) that has no corresponding Tailwind theme color.
- `not-found.tsx` and `error.tsx` use hardcoded `text-gray-900 dark:text-white` / `bg-white/90 dark:bg-gray-900/90` pairs instead of the `text-foreground` / `bg-card` tokens `Footer.tsx` uses for the same semantic purpose — doubles the maintenance surface if the palette ever changes.
- The "Back to Home" CTA is styled two different shades on two sibling pages: `bg-gold-500` (`not-found.tsx:114`) vs. `bg-gold-600` (`error.tsx:44`).
- `layout.tsx`'s `NextTopLoader` brand color (`#B58E41`) doesn't exactly match `globals.css`'s `--primary` (`#8F6F30`) — two "brand golds" in circulation.
- **Content drift, not just style drift:** the dead `ProducerEncouragementBanner.tsx` and the live `SocialMediaBanner.tsx` both quote a producer subscription price, and they disagree — 15,000 RWF vs. 50,000 RWF/month for what reads as the same plan. This is a factual bug hiding inside a styling duplication problem.
- `ProducerEncouragementBanner.tsx` constructs Tailwind classes dynamically (`` `bg-${benefit.color}` ``) — a known JIT-purge anti-pattern; these classes only survive because the literal strings happen to appear elsewhere in the codebase. Fragile by construction.

## 4. Accessibility

- Live nav and footer are in reasonable shape: footer social icons carry `aria-label`, external links use `target="_blank" rel="noreferrer noopener"` correctly, back-to-top button has an `aria-label` via `t()`.
- `CategoryCard` in `HomeProducts.tsx` is a `<button>` with no `aria-label`, inconsistent with the adjacent "Brands" story cards which do set `aria-pressed` + `title`. Same interaction pattern, different a11y treatment.
- Decorative floating-particle divs inside each category card (6–8 extra always-animating DOM nodes per card) are correctly non-semantic, but at 10–20 categories that's 100+ perpetually-animating nodes — an accessibility-adjacent performance/battery concern (motion-sensitive users also get no `prefers-reduced-motion` guard anywhere in scope).
- The "Clear Filters" button text in the empty state is hardcoded English while every sibling string on the same page runs through `t()` — a mid-component i18n gap.

## 5. Internationalization

The app clearly targets a Kinyarwanda/English/French audience (`LanguageContext`, `t()` used pervasively in `RoleBasedNavigation.tsx` and `Footer.tsx`). Coverage is uneven on pages a user hits constantly:
- `MobileBottomNav.tsx` — every label (Home, Shop, Try-On, Cart, Profile) is hardcoded English, and this nav is visible on **every mobile page view**.
- `not-found.tsx`, `error.tsx` — fully hardcoded English, including on what should be a graceful, on-brand recovery screen.
- Scattered strings inside `HomeProducts.tsx` (e.g., "Clear Filters").

## 6. Mobile & Interaction Details

- `MobileBottomNav.tsx` correctly handles the safe-area inset (`env(safe-area-inset-bottom)`) and wires a real cart count — good baseline engineering.
- **Icon collision:** "Shop" (`/products`) and "Cart" (`/cart`) both render the same `ShoppingBag` icon with different labels — on a 5-icon bottom nav this is exactly the ambiguity such navs exist to avoid. `lucide-react` already ships `ShoppingCart` as the obvious differentiator.
- `layout.tsx` applies a global `touch-action: pan-y` override to suppress pull-to-refresh. This is reasonable overall, but it constrains horizontal touch gestures app-wide — worth verifying against the horizontally-scrolling "Brands" story strip in `HomeProducts.tsx`, which depends on native horizontal swipe.
- Route-active matching in the bottom nav uses `pathname.startsWith(href)`, which is a prefix match, not a segment match — currently patched with manual `matchExtra` arrays per item rather than being structurally correct; will need continued manual upkeep as routes are added.

## 7. Performance

- Google Fonts (Inter, Fraunces/Playfair) are loaded via `@import` in `globals.css` rather than `next/font` — a deliberate tradeoff per an inline code comment ("prevent network fetch during build in restricted environments"), but it means font loading is a render-blocking runtime request with no `font-display` control, i.e. FOIT/FOUT risk on first paint.
- Category `productCount` is recomputed with an inline `.filter()` inside a `.map()` over categories — O(n·m) per render, not memoized. Fine at current catalog size, will degrade as it grows.
- Verified-producer filtering issues one API call per unique producer (up to 30) on every homepage load just to decide what to hide — a real network-cost-for-invisible-behavior tradeoff.
- `manifest.json?v=${Date.now()}` cache-busts the PWA manifest on literally every request/render, defeating any caching of that file — almost certainly unintentional.

---

## Prioritized Findings Summary

| Priority | Finding | Why it matters |
|---|---|---|
| P0 | No hero/value-prop section on homepage | First-time visitors get no explanation of the core AI try-on feature |
| P0 | Search state exists but no input is rendered | Dead logic driving live filtering the user can never trigger |
| P0 | Product-vs-error states are indistinguishable | Users can't tell "nothing matches" from "the API is down" |
| P0 | Silent verified-producer filtering, inconsistent above 30 producers | Trust/transparency issue + hidden inventory |
| P1 | Bottom-nav icon collision (Shop/Cart) | Everyday mobile navigation ambiguity |
| P1 | Producer subscription price disagrees across two components | Factual/content bug, not just style |
| P1 | i18n gaps in bottom nav, 404, error page | Localization inconsistency on high-traffic, every-page-view surfaces |
| P2 | Dead components carrying stale design tokens (Header/Hero/CategoryCards/ProducerBanner) | Codebase hygiene, confusion risk for contributors |
| P2 | Token inconsistency (hardcoded hex/gray vs. semantic tokens) across page.tsx-adjacent files | Maintenance cost, drift risk |
| P3 | Google Fonts via `@import`, manifest cache-busting, O(n·m) category count | Performance, low user-visible severity today |

---

*Companion document: [`UX_ENHANCEMENT_PLAN.md`](./UX_ENHANCEMENT_PLAN.md) — phased implementation plan for the items above.*
