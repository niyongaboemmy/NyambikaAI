# NyambikaAI — Platform-Wide UX Audit

**Scope:** Full frontend (`frontend/src`) — design system, navigation, authentication, footer, public try-on gallery, store/hero patterns, and the utility/legal page set.
**Date:** 2026-08-08
**Method:** Full reads of design-system source (`tailwind.config.ts`, `globals.css`, `button.tsx`), the live navigation/footer/auth components, `public-tryon/page.tsx` in full, `store/[id]/page.tsx`, and all 8 utility pages, cross-referenced with grep counts across 206 `.tsx` files for color/radius/typography patterns.

---

## 0. Cross-cutting root cause

Every section below traces back to the same thing: **a well-designed semantic token system exists (`bg-card`, `text-foreground`, `border-border`, `bg-primary`, the `gold` scale, `rounded-full` as the button default) but adoption is partial.** Newer/simpler surfaces (Footer, cart, not-found) use it; older or heavily-iterated surfaces (admin-users, profile, try-on, store/[id], public-tryon, dashboards) largely don't. This one root cause explains the color inconsistency, the button-radius drift, and much of the typography drift documented below — fixing the token-adoption gap is higher leverage than any single visual tweak.

---

## 1. Feature modernity & interactivity

Spot-checked cart, checkout, wallet transactions, orders, and the producer dashboard.

| Page | Loading state | Empty state | Dated patterns |
|---|---|---|---|
| Cart | Decorative blobs only, no data-loading indicator | Good — icon + heading + gold CTA | None found |
| Checkout | `Loader2` spinner, disabled+spinning submit | — | None found (601 lines — largest page, worth a deeper pass later) |
| Wallet transactions | Spinner | Good — icon + message, rounded hover cards (no bare table) | None found |
| Orders | **Best pattern**: dedicated `OrdersSkeleton` component | Good | **`window.confirm()`** for cancel action (`orders/page.tsx:192`) — a native browser dialog breaking an otherwise polished, gold-accented UI |
| Producer dashboard | Plain spinner, no skeleton | Good, contextual per filter | Status badges via inline conditional classes instead of a shared `Badge`/status-pill component (wallet already has one) |

**Findings:**
- Orders has the most modern loading pattern (skeleton) in the app; Producer dashboard and others still use a bare spinner — an easy, low-risk consistency win to roll the skeleton pattern outward.
- `window.confirm()` in Orders is the one clearly dated, off-brand interaction pattern found in this pass.
- Status-pill styling is duplicated ad hoc per page instead of reusing one shared component.

## 2. Color usage & consistency

**Design system baseline:** semantic tokens (`bg-card`, `text-foreground`, `bg-primary`, `border-border`, `text-muted-foreground`) plus a dedicated `gold` 50–950 scale, all defined in `tailwind.config.ts`/`globals.css`. Legacy tokens (`--electric-blue`, `--coral`, `--ai-blue`) still exist as CSS vars, a sign the old-palette migration was never fully finished.

**Sitewide grep totals:**

| Pattern | Count |
|---|---|
| `gray-*` utility classes (instead of semantic tokens) | **3,942** |
| `red-*` utility classes (instead of `--destructive`) | 389 |
| Off-brand hues (purple/indigo/pink/orange/amber/cyan/teal/violet/rose/sky/emerald/yellow) | 61 |
| Raw hex literals in JSX/style | 121, across 14 files |

**Worst-offender pages** (by `gray-*` count): `admin-users` (341), `profile` (169), `try-on` (167), `store/[id]` (150), `product/[id]` (129), `outfit-room` (121), `orders/[id]` (119), `agent/producers-management` (108), `producer/[producerId]/orders` (103), `UserWallet.tsx` (91), `register` (90).

**Sharpest individual violations:**
- `try-on/page.tsx:425-436` — an SVG gradient hardcodes `#3B82F6 → #8B5CF6 → #EC4899` (stock Tailwind blue/violet/pink) directly on the AI try-on page — completely outside the gold/ink brand palette, reads like leftover branding from a different product.
- `store/[id]/page.tsx:371-406` — a react-select theme hand-copies gold-scale hex values as raw literals (with comments manually noting which gold step each one matches), so any future token change won't propagate here.
- `admin-users/page.tsx:444,733,864` — a `sky-*` status badge sits alongside an already-defined `.info-badge` utility (blue) in `globals.css:269-271`, meaning there are now three different "info" hues in circulation.
- `producer-subscription/page.tsx:520-524`, `product/[id]/page.tsx:704-707,986` — decorative amber/teal used with no semantic mapping (not `--warning`, not `--success`).

**Verdict:** Not "wrong colors so much as too many colors doing the same job." Consolidating onto semantic tokens (which already exist) would resolve the vast majority of this without inventing anything new.

## 3. Button consistency

`Button` primitive (`custom-ui/button.tsx:8`) hardcodes `rounded-full` as the base for every variant; `sm`/`lg` sizes swap to `rounded-md`. **No variant ever produces `rounded-xl`/`rounded-2xl`/plain `rounded-lg`** — every instance of those on a button is an ad hoc override.

Sitewide radius usage on buttons: `rounded-full` (correct default, hundreds of uses) vs. at least **14+ confirmed CTA overrides** to `rounded-lg`, `rounded-xl`, or `rounded-2xl`:
- `profile/page.tsx` — 6 primary/secondary CTAs on one page, all `rounded-lg`, none pill-shaped.
- `HeroSection.tsx:40,49` — **the homepage's own primary CTA** is `rounded-2xl`, contradicting the Button primitive's pill default on the very first thing a visitor clicks. *(Note: as of the homepage work already completed this session, `HeroSection.tsx` has been rebuilt — verify its current CTA radius as part of Phase 1 below, since this specific file was already touched.)*
- `orders/page.tsx:338`, `PaymentDialog.tsx:1001,1053,1063` — `rounded-xl`.
- `ProductShowcase.tsx:87` — `rounded-2xl`.
- `product/[id]/page.tsx:939,970` — a *third* pattern, responsive radius: `rounded-md sm:rounded-lg`.

51 files also use raw `<button>` elements instead of the `Button` component, each free to invent its own radius/padding/focus treatment and missing the primitive's built-in `focus-visible` ring.

**Verdict:** at least 4 distinct radius idioms in active use for what should be one consistent primary-button shape.

## 4. Typography consistency

`font-serif` (Fraunces) is loaded specifically as a display/editorial face but used in only **3 of 206 files** — including *not* on the homepage hero headline, where a fashion-marketplace brand serif would have the most impact. Effectively dead weight in the font payload.

H1 sizing spans **five tiers** with no consistent rule: `text-xl` (reset-password) → `text-2xl` (admin-users, agent-dashboard) → `text-3xl` (try-on-history, store, producer orders) → `text-4xl` (producer/agent dashboards) → `text-5xl` (subscription page). Several omit dark-mode color handling entirely (`try-on-history/page.tsx:196`, `producer/orders/page.tsx:103`), risking low-contrast/invisible text in dark theme. `reset-password/page.tsx:134` even uses a third neutral scale (`neutral-900`) that appears nowhere else in the app.

H2 splits similarly: legal pages consistently use `font-semibold`, dashboards consistently use `font-bold` — same heading level, two different weights depending on which part of the app you're in.

**Verdict:** headings need one small, enforced type scale (e.g., h1/h2/h3 = 3 fixed size+weight+color combinations), and Fraunces should either be applied meaningfully (hero/marketing moments) or dropped from the font payload entirely.

## 5. Authentication flow

Reviewed Login (modal), Register (2-step wizard), Password Reset (2-step), and OAuth (2 separate callback implementations).

**Highest-severity finding — disruptive modal-close redirect:** `LoginModal.tsx:24-63` forcibly navigates to `/` when the modal is dismissed while the user is on a hardcoded list of "protected" routes (`/checkout`, `/cart`, `/profile`, `/orders`, dashboards, etc.), unless under `/product/`. Combined with `LoginPromptContext.tsx:123-172`'s global `fetch` interceptor — which opens this same modal automatically on **any** 401 from **any** background request app-wide — a user can be silently redirected away from an in-progress page (e.g., mid-checkout) they never chose to leave, triggered by an unrelated stale-token request, just because they dismissed a modal they didn't open on purpose. No warning, no confirmation, no toast explaining why. This is a trust and data-loss risk (no autosave on checkout).

**Register — inline errors are computed but never shown:** the component tracks a full `errors` object, shows a toast saying "fields are highlighted," and scrolls/focuses the first invalid field (`register/page.tsx:99-141`) — but the `error` prop is never actually passed to any `FormInput` (name/email/phone/password/confirmPassword; verified against `form-input.tsx:44-46` which does support it). Users are told to look at a field that displays no visible problem. Password-mismatch is the sole error that's actually visible live (hardcoded JSX, not the errors system).

**Design-system fragmentation across the reset/OAuth touchpoints — three unrelated visual languages for the same logical moment ("you're being signed in"):**
1. Gold-glass, animated (Login, Register, `PasswordRecoveryForm`)
2. Flat neutral, no motion, no gold at all (`reset-password/page.tsx`)
3. Navy/blue raw server-rendered HTML (`auth/receive-token/route.ts`)

Password rules also diverge: registration enforces 8-char + upper/lower/digit/special with a live checklist; reset only checks a 6-char minimum with zero visible requirements, and the reset password fields have no show/hide toggle (Login/Register both do).

**OAuth callback quirks:** `oauth-complete/page.tsx`'s inline pre-hydration script reads the token from the URL **hash**, while its own `useEffect` reads from the **query string** — two different parsing paths for the same value, suggesting genuine uncertainty about what the backend actually sends. On failure it displays "Redirecting to login..." but actually silently redirects to `/` with no error persisted and no login prompt — a silent-failure dead end.

**Also noted:** duplicate error messaging (the same failure shows as both an inline banner and a toast) on Login and Password Reset request steps.

## 6. Navigation bar

`RoleBasedNavigation.tsx` has substantial hover/transition polish (consistent `hover:bg-gray-50 dark:hover:bg-gold-900/20`, `hover:scale-105`, animated logo) — it is not static. But **no nav item ever indicates the current page.** `usePathname()` is called once in the whole 783-line file, purely to prevent a redundant `router.push` on an already-active link — it never drives any className. Home, Try-On, Public Try-On, Companies, and the producer "Browse" dropdown all render identically regardless of route. The file already contains the exact pattern needed elsewhere (the language-switcher and store category filters both do `selected === x ? activeClasses : ""`) — it's simply never applied to the primary nav.

## 7. Global background vs. navbar (the "looks like navbar" complaint)

- `--background` (page body): `#FFFFFF` (`globals.css:9`)
- `--card`: also `#FFFFFF` (`globals.css:11`) — identical to the page background
- Navbar: `bg-white/80` (`RoleBasedNavigation.tsx:183`) — 80%-opacity white glass, bordered by `border-white/20` (also translucent white)

A translucent white panel over a solid white page has almost nothing to contrast against — this is exactly why the nav and the page "blend." `--muted` is already defined at `#F5F5F5` (`globals.css:21`, ~96% lightness) but is never wired to the page body — it's used only for scattered `bg-muted` component instances. This is a ready-made, already-tested fix: point `--background` at (or near) `--muted`'s tone instead of pure white, and the glass nav will read as a genuinely floating panel again.

## 8. Heavy hero/banner pattern (store page, and beyond)

The store page has no real "cover image" concept — only a small circular `logoUrl`. The "too heavy" hero is not actually an image-missing fallback; it's the page's **fixed, always-on** background: `bg-gold-600 dark:bg-gold-950` (`store/[id]/page.tsx:713`) layered with a `bg-black/20` scrim, a second pulsing `bg-gray-500/30` scrim, and three animated blurred orbs — 4+ translucent layers compositing regardless of whether the company has any branding assets.

**The identical recipe is repeated verbatim** in `public-tryon/page.tsx:505` (`bg-gold-600 dark:bg-gold-950` + floating orbs). Not found in `product/[id]`, `product-registration`, `producer/[producerId]/orders`, or `companies` (which uses a much lighter `bg-slate-50` wrapper) — so this is a two-page pattern, not sitewide, but both instances are high-traffic pages (every store visit, every try-on gallery visit).

## 9. `public-tryon/page.tsx` — dedicated deep review

1,948 lines, 9 major visual blocks (hero, dead/commented product header, sticky filter bar, loading state, masonry gallery, empty state, load-more, 3 full-screen modals), 26 `useState` hooks (several apparently unused — `newSessionAlert`, `mousePosition`), 132 `framer-motion` component usages, 4 `useEffect`s, no sub-components extracted.

**Color:** gold appears in 31 places across gray, slate, red, white/black-overlay, and raw-SVG-fill palettes simultaneously — two different neutral scales (`gray-*` and `slate-*`) used interchangeably for what should be one "neutral card" role.

**Motion:** ~16 concurrent infinite animations in the hero section alone (orbs, 5 decorative "cute tryon" shapes, rotating icon, pulsing stat numbers, scroll indicator, CTA micro-animations) before any user interaction; the loading state runs 6 more independently. This is landing-page-level motion density on what is functionally a gallery/utility page.

**Sizing:** headline at `text-5xl → text-8xl` (up to 128px) and subtitle at `text-xl → text-3xl` — marketing-hero-scale type on a tool page. Padding jumps non-linearly (`p-2` → `p-10` across breakpoints on the same card). Button padding has at least 4 different scales with no sm/md/lg tiers.

**Structure:** dead code — an entire product-header block (`L822-896`) is commented out but still renders its (empty) wrapper.

**Complexity:** clear candidate for splitting into `<TryOnHero>`, `<TryOnFilters>`, `<TryOnGallery>`, `<SessionDetailModal>`, `<CommentsModal>`, `<ShareModal>` + a `useTryOnSessions` hook — at this size and state-count it's genuinely hard to safely restyle in place.

## 10. Footer

272 lines, but structurally leaner than it feels: only 2 real content columns (Brand+social, Newsletter+contact) plus a promo CTA banner and a legal-link bottom bar — not a classic 5-column link-dump footer, so the raw link inventory (5 social icons, 5 legal links, 2 CTA buttons, 1 form) is already reasonable by e-commerce standards.

**What actually makes it feel long:** the AI CTA banner (`Footer.tsx:54-97`, ~44 lines, `p-8 md:p-10`) sitting on top of the real footer content, which almost certainly duplicates a CTA that already exists in the hero/nav. The newsletter+contact+WhatsApp column also does three jobs in one place, including a WhatsApp button that duplicates the WhatsApp icon already in the social row (`Footer.tsx:48`).

**Verdict:** the fix is subtraction, not redesign — drop or shrink the CTA banner, remove the duplicate WhatsApp button, tighten section padding.

## 11. Utility/legal pages

All 8 pages (about, contact, privacy, terms, cookies, returns, size-guide, help) are server-wrapper + `*Client.tsx` components pulling copy from a shared i18n dictionary (EN/RW/FR) — no lorem ipsum or TODOs found anywhere, and 7 of 8 have genuine, on-brand, substantial content (glass cards, gold accents, dark mode).

**Two real gaps:**
- **Help Center** (`help/HelpClient.tsx`) is thin relative to its purpose — only 3 static FAQ entries, no accordion/search/categories, no order-troubleshooting or account/security FAQs. Effectively a stub next to its own "frequently asked questions" framing.
- **Terms** (`terms/TermsClient.tsx:30-88`) is the one page with hardcoded English strings instead of `t()` keys — it won't translate to RW/FR like every sibling legal page does.

**No human-readable `/sitemap` page exists** — only the machine `sitemap.ts` XML generator. If a browsable site-map page is wanted (per the request), it needs to be built from scratch; it isn't a "make it modern" fix, it's new.

Minor: About's "Quick Stats" (`AboutClient.tsx:69-76`) uses illustrative placeholder numbers with a disclaimer — reads as fabricated even though it's disclosed. Size Guide has no men's/unisex chart and no visual measuring diagram.

---

## Prioritized Findings Summary

| Priority | Finding | Section |
|---|---|---|
| P0 | Login-modal dismiss forcibly redirects users off in-progress pages (checkout, cart, profile) with no warning | §5 |
| P0 | Register's inline field errors are computed but never rendered — users get a toast pointing at an unmarked field | §5 |
| P0 | `public-tryon` page: ~1,950 lines, 26 state vars, ~16 concurrent animations in the hero, 4+ neutral/accent palettes mixed | §9 |
| P0 | Navbar has zero active-route indication on any link | §6 |
| P1 | Page background (`#FFFFFF`) and navbar glass (`white/80`) have no contrast — nav visually disappears into the page | §7 |
| P1 | Store page (and public-tryon) hero is a heavy, always-on 4-layer gold/black/gray composite regardless of branding data | §8 |
| P1 | Sitewide color drift: `gray-*` used ~3,942 times instead of semantic tokens; off-brand hues (blue/violet/pink SVG gradient on try-on, amber/sky/teal scattered) | §2 |
| P1 | Button radius: at least 4 different idioms (`rounded-full`/`lg`/`xl`/`2xl`/responsive) on primary CTAs, including the homepage hero | §3 |
| P1 | Three unrelated visual languages across Login → Reset → OAuth-callback in one logical flow | §5 |
| P2 | H1 spans 5 size tiers with inconsistent dark-mode handling; Fraunces serif essentially unused despite being loaded | §4 |
| P2 | Footer padded/lengthened by a redundant CTA banner and duplicate WhatsApp CTA | §10 |
| P2 | Help Center is a 3-question stub; Terms page breaks the i18n pattern | §11 |
| P3 | `window.confirm()` in Orders cancel flow; status-pill styling duplicated per page instead of shared component | §1 |
| P3 | No human-readable `/sitemap` page exists (only XML) | §11 |

---

*Companion document: [`UX_PLATFORM_IMPLEMENTATION_PLAN.md`](./UX_PLATFORM_IMPLEMENTATION_PLAN.md) — phased implementation plan for the items above.*
