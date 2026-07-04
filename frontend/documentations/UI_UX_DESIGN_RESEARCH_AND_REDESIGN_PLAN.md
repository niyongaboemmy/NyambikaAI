# Nyambika Frontend — UI/UX Design Research & Redesign Plan

**Date:** 2026-07-03
**Scope:** `frontend/` (Next.js App Router, Tailwind CSS, shadcn/ui-based component set)
**Prepared for:** Nyambika — AI-powered fashion / virtual try-on marketplace (Rwanda-focused, multi-role: customer, producer/seller, agent, admin)

---

## 1. Executive Summary

Nyambika's frontend is functionally rich (virtual try-on, multi-role dashboards, wallet, subscriptions, PWA) but its **visual language reads as a generic "AI SaaS dashboard,"** not a clothing retail brand. The current palette is an electric-indigo/cyan tech theme (`--electric-blue: hsl(235 100% 65%)`, `--ai-blue`, `--ai-cyan`, heavy glassmorphism), reinforced even at the metadata level (page title "Nyambika - AI-Powered Fashion Platform," indigo theme-color meta tags, near-black-indigo PWA manifest background). Typography is a single grotesque sans (Inter) with no editorial hierarchy, and several homepage sections lean on emoji, animated gradients (`animate-bounce`, `animate-ping`, `animate-pulse`), and cyan→red→blue banner gradients that feel closer to a gaming/promo app than a fashion boutique. There is also a **tooling inconsistency**: `components.json` (shadcn) declares `@/components/ui`, but the actual primitives live in `src/components/custom-ui` (papered over by custom `tsconfig.json` aliases), and there is no mobile bottom-navigation component — product grids are also hand-rolled per page (e.g. `HomeProducts.tsx`, 881 lines) instead of consistently reusing the shared `ProductCard.tsx` that already exists.

This document (1) audits the current state, (2) distills UI/UX principles and inspiration for fashion e-commerce in 2026, (3) proposes a concrete design system (color, type, components) built around the requested **black / white / gold** palette, and (4) lays out a phased implementation plan that avoids a risky big-bang rewrite.

---

## 2. Current State Audit

### 2.1 Design tokens (`src/app/globals.css`, `tailwind.config.ts`)
- Single font: `Inter` loaded via `@import url(fonts.googleapis.com...)` in CSS (not `next/font`, so no self-hosting/optimization, no font-display strategy beyond the Google `&display=swap` param, and it's render-blocking on a cold cache).
- Primary color: `hsl(235 100% 65%)` — a saturated indigo/electric blue, plus `--electric-blue`, `--ai-blue`, `--ai-cyan`, `--coral` — all tech/SaaS coded colors, not fashion-retail coded. Cold near-white background (`hsl(0 0% 98%)`) rather than a warm ivory more typical of apparel sites.
- Heavy glassmorphism system (`--glass-bg`, `--glass-border`, `--glass-backdrop: blur(16px)`), animated "aurora" skeletons, and gradient scrollbars — all reinforce the "AI product" feel over "clothing store" feel.
- Border radius default `1.5rem` (very rounded) applied globally — soft/app-like, not the crisp-edged, editorial feel typical of fashion retail (Zara, SSENSE, Net-a-Porter all use tight or zero radii on product imagery and CTAs).
- shadcn `components.json` uses `style: "new-york"`, `baseColor: "neutral"`, alias `ui → @/components/ui` — but no `src/components/ui` folder exists; primitives (button, card, dialog, etc.) live in `src/components/custom-ui` instead, a drift from the shadcn convention that will confuse future `shadcn add` runs.

### 2.2 Component inventory
- `src/components/custom-ui/` holds ~52 shadcn-style primitives (button, card, dialog, sheet, tabs, form-*, skeleton, sidebar…) — good coverage, but the shadcn config is actually **stale**: `components.json` declares `"ui": "@/components/ui"`, but no `src/components/ui` directory exists — `tsconfig.json` papers over this with custom `@ui/*`/`@custom-ui/*` aliases both pointing at `custom-ui`. Running the shadcn CLI (`npx shadcn add ...`) today would create files in the wrong place.
- A shared `src/components/ProductCard.tsx` **does exist** (uses `next/image` with proper `alt` text — good baseline practice), alongside page-specific one-offs (`HeroSection.tsx`, `HomeProducts.tsx`, `CategoryCards.tsx`) and cross-cutting guards (`ProtectedRoute.tsx`, `RouteProtection.tsx`, `SubscriptionGuard.tsx`/`ProducerSubscriptionGuard.tsx` — a duplicated guard pattern worth consolidating separately from this visual redesign).
- Naming convention is inconsistent — PascalCase files (`ProductCard.tsx`) sit alongside kebab-case (`empty-state.tsx`, `theme-toggle.tsx`, `stat-card.tsx`) with no documented rule.
- No dedicated mobile bottom-navigation/tab-bar component was found (`grep` for `BottomNav`/`MobileNav` returned nothing); `Header.tsx` instead toggles `hidden md:flex` / `md:hidden` for a hamburger-style mobile menu — worth replacing with a persistent bottom tab bar (Home/Search/Try-On/Cart/Profile), now near-universal on shopping apps.
- `AnimatedAIBackground.tsx` in `src/components/layout` reinforces the "AI product" over "boutique" visual identity; it's referenced alongside AI-gradient/glassmorphism classes in at least 29 files across the app (`Header.tsx`, `PaymentMethods.tsx`, `CategoryCards.tsx`, `checkout/page.tsx`, `admin-dashboard/page.tsx`), so the tech-SaaS aesthetic is pervasive, not isolated to one hero banner.

### 2.3 Page / route structure
Route inventory (`src/app/*`, ~55 segments) shows four personas already modeled: **customer** (`/`, `/product/[id]`, `/cart`, `/checkout`, `/try-on`, `/try-on-widget/[productId]`, `/try-on-history`, `/outfit-room`, `/orders`, `/wallet`), **producer/seller** (`/producer/dashboard`, `/producer/orders`, `/product-registration`, `/product-edit/[id]`), **agent** (`/agent/dashboard`, `/agent/producers-management`, `/agent/referrals`, `/agent/subscription`), and **admin** (`/admin`, `/admin-users`, `/admin/agent`). This is a solid IA foundation — the redesign should focus on the visual/interaction layer, not restructuring routes. One piece of route debt worth a separate cleanup ticket (not part of this visual redesign): duplicate/overlapping segments like `admin` vs `admin-dashboard` and `agent` vs `agent-dashboard` suggest leftover routes from a prior refactor.

### 2.4 Typography in practice
Font loading itself has a known constraint: `layout.tsx` carries a comment "Removed next/font/google to prevent network fetch during build in restricted environments," meaning Inter is currently loaded via a runtime CSS `@import` rather than self-hosted via `next/font` — any redesign should re-attempt `next/font` in an environment where the Google Fonts fetch succeeds at build time, falling back to the CSS import only if it doesn't.
Sampling `HeroSection.tsx` and `HomeProducts.tsx` shows type usage is mostly ad hoc Tailwind utility stacking (`text-5xl md:text-7xl font-bold`, `text-lg sm:text-xl md:text-2xl font-bold`) repeated per-section rather than semantic heading components styled once. No serif or display face is used anywhere — every heading, price, and body string is the same grotesque sans at different sizes (often wrapped in a blue `.gradient-text` clip), which flattens hierarchy and reads as "app UI" rather than "fashion editorial."

### 2.5 Responsiveness
Tailwind responsive prefixes (`sm: md: lg: xl:`) are used densely on most pages (product detail page alone has 74 `sm:` hits; homepage grids scale `grid-cols-2` → `sm:3` → `md:4` → `lg:4/5` → `xl:5`), and the project ships a full PWA (manifest, icons, service worker, install prompt, `display: "standalone"`) — mobile-first intent is clearly present at the layout level. Two concrete gaps: (1) no bottom tab bar component — mobile nav is a hamburger toggle inside `Header.tsx`; (2) `layout.tsx`'s viewport config sets `userScalable: false`, which disables pinch-zoom and is a real WCAG 1.4.4 accessibility violation, not just a stylistic nit — this should be removed regardless of the rest of the redesign.

### 2.6 Visual/UX red flags
- Emoji used as first-class UI elements (💖, spinner/sparkle emoji) in production JSX rather than icon components — inconsistent rendering across OS/browsers and unprofessional for a retail brand.
- Gradient banner: `bg-gradient-to-r from-cyan-400 via-red-500 to-blue-500` — cyan→red→blue on one badge is the exact "casino menu" combination flagged by luxury-branding research as something to avoid (see §3).
- `animate-bounce`, `animate-ping`, `animate-pulse` stacked on multiple elements simultaneously on the homepage risks motion fatigue for users sensitive to motion.
- Global `1.5rem` border-radius plus glass blur everywhere reduces the perceived value/premium-ness that black/white/gold and sharper edges typically convey for apparel.
- The tech framing goes beyond CSS: `layout.tsx`'s page title is literally "Nyambika - AI-Powered Fashion Platform," theme-color meta tags are indigo (`#6366f1`/`#3730a3`), and `manifest.json`'s `background_color` is `#0f0f23` (near-black indigo) — the brand identity is encoded as "AI product" at the metadata level, not just in component styling, so the palette swap in §4.1 needs to touch metadata/manifest too, not only `globals.css`.
- A real (not just aesthetic) bug: status badge utilities in `globals.css` (`.success-badge`, `.warning-badge`, `.info-badge`) all resolve to the same `bg-blue-100 text-blue-800` styling, so success and warning states are currently visually indistinguishable — fix this alongside the color-token work in Phase 0.

### 2.7 Loading/empty/error states
`Skeleton`, `OrdersSkeleton`, `OrderDetailsSkeleton`, `AppLoader`, and `GlobalAuthLoader` all exist and are used broadly (80 files reference `Skeleton`), including a custom `.ai-skeleton` shimmer effect in `globals.css` that already respects `prefers-reduced-motion` — loading-state coverage is genuinely mature. `src/components/empty-state.tsx` also exists and is used (e.g. `producer-orders/page.tsx`). The real gap is **error boundaries**: there is no route-level `error.tsx` anywhere under `src/app/` (only a root `not-found.tsx`/`loading.tsx`), so a runtime failure on, say, the checkout or producer dashboard page currently falls through to Next's generic default error UI rather than a branded one — worth a small fix independent of the visual redesign.

---

## 3. UI/UX Principles for a Fashion Retail Platform (2026 research)

**Minimalism is now strategic, not decorative.** 2026 e-commerce trends favor clean layouts, generous white space, and bold editorial typography over "decor for its own sake" — the opposite of the current glass/gradient/emoji treatment. ([Wix — Web Design Trends](https://www.wix.com/blog/web-design-trends), [Muzli — Ecommerce UI/UX Inspiration](https://muz.li/inspiration/ecommerce-website/))

**Checkout should feel invisible.** One-click payments, saved cards/mobile money, and minimal form friction are now baseline expectations; this maps well onto Nyambika's existing wallet feature. ([Enerpize — Future of eCommerce UX/UI](https://www.enerpize.com/hub/future-of-ecommerce))

**Typography carries brand personality.** The 2026 pattern is a **serif or display headline paired with a humanist sans-serif body** — serif for authority/editorial feel, sans for legibility — rather than one grotesque font at every size. ([Lummi — Popular Font Pairs 2026](https://www.lummi.ai/blog/popular-font-pairs-2026), [WildHive — Font Pairings for High-End eCommerce](https://www.wildhivestudio.com/blog/best-font-pairings-for-high-end-ecommerce-brands))

**Luxury color discipline: fewer colors, more restraint.** High-end fashion sites consistently use 2–4 colors max: an anchor neutral (onyx black or ivory), one accent (often a muted gold), and nothing else fighting for attention. Web-safe "gold" (`#FFD700`) reads cheap; real luxury gold sits between `#C69B3C`–`#D4AF37`. Never pair two saturated colors at equal visual weight. ([Zoviz — Luxury Color Palette Guide](https://zoviz.com/blog/luxury-brand-colors-meanings), [Fancy Girl Design Studio](https://www.fancygirldesignstudio.com/beyond-black-white-crafting-distinctive-luxury-brand-color-palettes/), [A Wiser Website](https://www.awiserwebsite.com/resources/which-colors-to-choose-to-showcase-luxury-branding))

**AR/virtual try-on is becoming table stakes, not a novelty.** ASOS shipped a hybrid virtual try-on (with AIUTA) in Feb 2026; Zara and others ship "try before you buy" AR. This validates Nyambika's core try-on feature — the opportunity is to make the *surrounding UI* (product photography grid, fit/size guidance, avatar diversity) feel as premium as the AI feature itself, rather than the AI chrome overshadowing the clothes. ([Crescendo — Best AI Tools for Fashion 2026](https://www.crescendo.ai/blog/best-ai-tools-for-fashion-and-clothing-industries), [Claid.ai — Virtual Try-On Tools 2026](https://claid.ai/blog/article/virtual-try-on-tools))

**Micro-interactions should be premium, not playful.** Subtle add-to-cart confirmations, smooth hover states, restrained motion — not bouncing emoji or multi-color pulsing badges. ([Onething Design — E-Commerce UX Trends 2026](https://www.onething.design/post/top-ecommerce-ux-design-trends))

**Regional context matters.** African fashion marketplaces that succeed (Afrikrea, Ananse Africa) lean on minimalist, story-forward, mobile-first design and design *for* infrastructure constraints (data-light images, resilient checkout, mobile money) rather than importing Western high-bandwidth interaction patterns wholesale. ([TechCabal — West African e-commerce](https://techcabal.com/2021/12/27/e-commerce-platforms-globalise-african-fashion/), [Ananse Africa](https://ananse.com/))

**Inspiration benchmarks:** SSENSE (editorial storytelling + bold whitespace), Zara (fast, clean grid, mobile-first, AR try-on), Net-a-Porter (curated luxury + editorial "Porter" content layer) — all three converge on *restraint*: one accent color, strong photography, and typography doing the "premium" work instead of visual effects. ([Samayweb — Best Fashion Websites 2025](https://samayweb.com/best-fashion-websites/))

---

## 4. Recommended Design System

### 4.1 Color palette — Black / White / Gold

Replace the AI-SaaS indigo/cyan system with a warm, restrained luxury-retail palette. Keep the existing CSS-variable architecture (`--background`, `--primary`, etc.) so the swap is a token-level change, not a component rewrite.

| Token | Light mode | Dark mode | Usage |
|---|---|---|---|
| `--background` | `#FAF7F1` (warm ivory) | `#0B0B0C` (onyx) | Page background |
| `--foreground` | `#141414` | `#F5F1E8` | Body text |
| `--card` | `#FFFFFF` | `#17171A` | Cards, product tiles |
| `--primary` (Gold – deep) | `#B58E41` | `#D4AF37` | Primary CTA, active nav, prices on hover |
| `--primary-foreground` | `#0B0B0C` | `#0B0B0C` | Text on gold |
| `--accent` (Gold – champagne) | `#E8C05C` | `#E8C05C` | Badges, highlights, subtle accents only |
| `--secondary` | `#F1EDE3` | `#1E1E22` | Secondary surfaces, filter chips |
| `--muted-foreground` | `#6B6558` | `#A39C8C` | Captions, meta text |
| `--border` | `#E7E1D3` | `#2A2A2E` | Hairlines |
| `--destructive` | `#B3261E` | `#E4685D` | Errors, out-of-stock |
| `--success` | `#3A6B4C` (muted sage, not neon green) | `#5FA37C` | Order confirmed, in-stock |

Rules of use (from luxury research, §3):
1. Gold is an **accent**, never a background fill — use it for CTAs, active states, dividers, price emphasis, and the try-on "AI" badge only.
2. Never combine gold with more than one other saturated color in the same view (drop the cyan/red/blue gradient banners entirely).
3. Replace the global glassmorphism system with flat cards + a single soft shadow (`0 1px 2px rgba(0,0,0,0.06)`), reserving blur/glass for one deliberate surface (e.g. the sticky mobile filter bar) rather than site-wide.
4. Reduce global border-radius default from `1.5rem` to a smaller, tiered scale (`--radius: 0.5rem` default; `0.25rem` for buttons/inputs; product image containers can stay rectangular/`0` radius to read as "photography," not "app tile").

### 4.2 Typography

Keep **Inter** for body copy (already integrated, good legibility, no migration risk) and add one **display serif** for headlines, section titles, and prices on PDP — this single change does most of the work of feeling "fashion" instead of "SaaS."

- Headline / display: **Fraunces** or **Playfair Display** (both free on Google Fonts, both read as editorial/fashion rather than corporate).
- Body / UI: **Inter** (existing) — but migrate loading from a render-blocking `@import` in CSS to `next/font/google` for self-hosted, non-blocking delivery with proper `font-display: swap` and no external request at runtime.
- Type scale (Tailwind): establish semantic heading components (`<Display>`, `<H1>`–`<H3>`, `<Body>`, `<Caption>`) once in `custom-ui`, instead of re-stacking `text-lg sm:text-xl md:text-2xl font-bold` ad hoc per section.

### 4.3 Component structure

- Reconcile the `components.json`/`tsconfig.json` alias mismatch: either move `custom-ui` → `ui` to match shadcn convention, or update `components.json`'s `ui` alias (and drop the redundant `@ui`/`@custom-ui` tsconfig paths) to point at `@/components/custom-ui`. Pick one; do it once, project-wide, so the shadcn CLI works again.
- Extend the existing `ProductCard.tsx` into the single source of truth for product tiles (it already does `next/image` + `alt` correctly) and replace the duplicated inline grid markup in `HomeProducts.tsx` and other listing pages with it.
- Add a persistent mobile bottom tab bar (`Home / Search / Try-On / Cart / Profile`) to replace the current hamburger-only mobile nav in `Header.tsx` — standard on fashion apps and currently absent.
- Reuse the existing `empty-state.tsx` consistently across cart/wishlist/search-results instead of only `producer-orders`.
- Add route-level `error.tsx` boundaries to at least checkout, cart, product detail, and the producer/agent/admin dashboards, styled with the new brand system instead of falling through to Next's default error UI.
- Fix the `.success-badge`/`.warning-badge`/`.info-badge` color bug in `globals.css` (currently all identical blue) as part of the token migration.
- Replace emoji-as-UI with a proper icon set (`lucide-react`, already implied by the shadcn setup) for badges like "AI Try-On," "New," "Sale."

### 4.4 Motion

Keep motion but make it purposeful: fade/slide-in on scroll for product grids, a single subtle scale on hover for cards, a checkmark micro-animation on add-to-cart. Remove simultaneous `animate-bounce` + `animate-ping` + `animate-pulse` stacking, and respect `prefers-reduced-motion`.

---

## 5. Responsiveness Strategy

The existing mobile-first Tailwind breakpoint usage and PWA setup are a good foundation — no structural rework needed. Priorities for this redesign:
1. Introduce the mobile bottom nav (§4.3) as the primary mobile navigation pattern, freeing the header for branding/search only.
2. Audit touch targets and line-length once the new type scale lands (serif display sizes especially need testing on small viewports).
3. Verify `prefers-reduced-motion` is respected given the current density of simultaneous animations.
4. Given regional bandwidth constraints (see §3, African marketplace research), audit image delivery (`next/image` usage, responsive `sizes`, compression) so the new photography-forward direction doesn't regress data usage for users on constrained connections.

---

## 6. Implementation Phases

**Phase 0 — Design tokens foundation (1–2 days)**
- Swap CSS variables in `globals.css` (light + dark) to the black/white/gold palette in §4.1; fix the `.success-badge`/`.warning-badge`/`.info-badge` identical-blue bug in the same pass.
- Reduce global `--radius` scale; remove/scope down glassmorphism variables to a single named utility class instead of global defaults.
- Add `Fraunces`/`Playfair Display` via `next/font/google`; retry `Inter` via `next/font/google` too (the current CSS `@import` was a workaround for a build-environment fetch restriction — confirm it resolves in the target build environment before switching, otherwise keep the CSS import as fallback).
- Update theme-color meta tags (`layout.tsx`) and `manifest.json`'s `background_color`/`theme_color` from indigo to the new palette, and remove `userScalable: false` from the viewport config (accessibility fix, unrelated to color but cheap to bundle here).
- No component logic changes otherwise — this phase is purely tokens/metadata, so risk is low and visually the whole app shifts immediately.

**Phase 1 — Core shared components (3–5 days)**
- Reconcile `components.json`/`tsconfig.json` `custom-ui` alias mismatch.
- Build semantic typography components (`Display`, `H1`–`H3`, `Body`, `Caption`) and roll out across at least the homepage and PDP.
- Extend the existing `ProductCard`/`empty-state` components for reuse across all listing/cart/wishlist surfaces; swap emoji badges for icon components.
- Remove the cyan/red/blue gradient banner and any multi-color gradients; replace with gold-on-neutral treatments.
- Add route-level `error.tsx` boundaries for checkout, cart, product detail, and dashboard routes.

**Phase 2 — Primary shopping flows (1 week)**
- Apply the new system to Home, Product Listing/Search, Product Detail, Cart, Checkout.
- Add the mobile bottom tab bar.
- Restrain/replace simultaneous animation stacking with `prefers-reduced-motion`-aware, single-purpose micro-interactions (add-to-cart confirmation, card hover).

**Phase 3 — Try-On experience polish (3–5 days)**
- Re-skin the try-on/outfit-room UI to match the new premium system while keeping the AI feature itself front and center (per §3, the AI shouldn't visually compete with the clothes).
- Ensure try-on badges/CTAs use the gold accent consistently as the "AI" signal color.

**Phase 4 — Producer / Agent / Admin dashboards (1 week)**
- Apply the same tokens to dashboard surfaces, but allow slightly higher information density (tables, charts) since these are operational, not editorial, screens — charts can keep functional colors (`--chart-1..5`) distinct from the storefront gold accent to avoid diluting gold's meaning.

**Phase 5 — QA, accessibility, performance pass (3–5 days)**
- Contrast-check all new color pairs (WCAG AA) in both light and dark mode, particularly gold-on-white and gold-on-black combinations, which are prone to low-contrast failures.
- Verify PWA install prompts, icons, and manifest theme-color reflect the new palette.
- Cross-browser/emoji-removal QA pass; Lighthouse pass for font-loading and image performance regressions.

Each phase ships independently and is revertible via the CSS-variable layer, keeping the rollout low-risk relative to a full rewrite.

---

## Sources

- [Muzli — Ecommerce UI/UX Inspiration 2026](https://muz.li/inspiration/ecommerce-website/)
- [Wix — Web Design Trends 2026](https://www.wix.com/blog/web-design-trends)
- [Enerpize — Future of eCommerce UX/UI 2026](https://www.enerpize.com/hub/future-of-ecommerce)
- [Onething Design — Top 10 E-Commerce UX Trends 2026](https://www.onething.design/post/top-ecommerce-ux-design-trends)
- [Zoviz — Luxury Color Palette Guide 2026](https://zoviz.com/blog/luxury-brand-colors-meanings)
- [Fancy Girl Design Studio — Luxury Palettes Beyond Black & White](https://www.fancygirldesignstudio.com/beyond-black-white-crafting-distinctive-luxury-brand-color-palettes/)
- [A Wiser Website — Colors for Luxury Branding](https://www.awiserwebsite.com/resources/which-colors-to-choose-to-showcase-luxury-branding)
- [Lummi — Popular Font Pairs 2026](https://www.lummi.ai/blog/popular-font-pairs-2026)
- [WildHive Studio — Font Pairings for High-End eCommerce](https://www.wildhivestudio.com/blog/best-font-pairings-for-high-end-ecommerce-brands)
- [Samayweb — Best Fashion Websites 2025](https://samayweb.com/best-fashion-websites/)
- [Crescendo — Best AI Tools for Fashion & Clothing 2026](https://www.crescendo.ai/blog/best-ai-tools-for-fashion-and-clothing-industries)
- [Claid.ai — Best Virtual Try-On Tools 2026](https://claid.ai/blog/article/virtual-try-on-tools)
- [TechCabal — West African e-commerce platforms take local fashion global](https://techcabal.com/2021/12/27/e-commerce-platforms-globalise-african-fashion/)
- [Ananse Africa](https://ananse.com/)
