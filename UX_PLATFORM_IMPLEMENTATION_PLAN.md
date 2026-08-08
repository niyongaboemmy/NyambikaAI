# NyambikaAI — Platform-Wide UX Implementation Plan

Companion to [`UX_AUDIT_PLATFORM.md`](./UX_AUDIT_PLATFORM.md). Ordered by impact-to-effort ratio and grouped so each phase ships as one coherent, testable PR. Nothing here requires a new dependency or architectural change — every item is a scoped edit to existing files, or (for `public-tryon`) a scoped split of one existing file into several.

---

## Phase 0 — Decisions needed before starting (quick confirmation, not a sprint)

1. **Login-modal redirect-on-close behavior** (§5 P0): confirm the intended behavior. *Recommendation: closing the modal should never navigate anywhere — it should just close. If a protected route genuinely requires auth, guard it at the route/page level (redirect on entry, not on incidental-modal-dismiss) instead of doing it reactively from the modal's close handler.*
2. **Global background color** (§7 P1): confirm swapping `--background` from `#FFFFFF` to something in the `--muted` (`#F5F5F5`) neighborhood is acceptable app-wide (affects every page, light theme only). *Recommendation: yes — it's a one-line token change using a value already defined and already used elsewhere, low risk.*
3. **`public-tryon` scope**: confirm whether to (a) do a full component split + redesign in one pass, or (b) do a lighter "trim colors/motion/sizing in place" pass first and split into components later. *Recommendation: (b) first — get the visual fix shipped fast, split into components as a separate, lower-urgency refactor PR since it's purely internal structure with no user-visible effect on its own.*
4. **Help Center depth**: confirm whether expanding it to a real FAQ hub is in scope for this round, or a later content-writing pass. *Recommendation: treat as a separate content task — flag it, don't block the design/UX phases on writing new FAQ copy.*
5. **Human-readable `/sitemap` page**: confirm this is wanted as new scope (it doesn't exist today) vs. dropped from this round. *Recommendation: low priority — ship after the P0/P1 items.*

---

## Phase 1 — Auth flow fixes (P0, correctness + trust, no visual redesign needed)

| Task | File(s) | Change |
|---|---|---|
| Stop forced navigation on modal dismiss | `LoginModal.tsx:24-63` | Remove the `router.push("/")` side effect from `onOpenChange`. Closing the modal should be a pure no-op. If specific pages truly require an authenticated session, add a page-level guard instead. |
| Fix invisible register field errors | `register/page.tsx` (FormInput calls ~697-866) | Pass `error={errors.name}`, `error={errors.email}`, `error={errors.phone}`, `error={errors.password}`, `error={errors.confirmPassword}` to each corresponding `FormInput` — the prop and its rendering already exist in `form-input.tsx:44-46`, it's just never wired. |
| De-duplicate error messaging | `AuthContext.tsx` (login ~240-246, requestPasswordReset ~312-327) | Pick one channel per error — either the inline banner or the toast, not both, for the same failure. |
| Unify reset-password visual language | `reset-password/page.tsx` | Rebuild on the same gold-glass `Card` pattern used by `LoginForm`/`PasswordRecoveryForm` instead of the flat neutral/no-gold treatment, so the flow doesn't visually "change products" mid-task. |
| Match password rules between signup and reset | `reset-password/page.tsx` (~38-39) | Apply the same 8-char + complexity rule and live requirement checklist used at registration, instead of a bare 6-char check. |
| Add show/hide toggle to reset fields | `reset-password/page.tsx` (~79-100) | Match the `Eye`/`EyeOff` toggle already present in `LoginForm`/register. |
| Fix OAuth token parsing inconsistency | `auth/oauth-complete/page.tsx` | Make the inline pre-hydration script and the `useEffect` read the token from the same location (confirm with backend which one — query string or hash — is actually sent, then delete the other code path). |
| Fix mislabeled/silent OAuth failure | `auth/oauth-complete/page.tsx` (~19-24) | Correct the copy (it currently says "Redirecting to login..." but redirects home) and route the failure through `LoginPromptContext`'s `show(message)` so the user actually sees why it failed, instead of landing on `/` silently. |
| Consolidate OAuth callback implementations | `auth/oauth-complete/page.tsx` vs `auth/receive-token/route.ts` | Confirm with backend which route is actually used in production; delete the other, or if both are needed, restyle `receive-token` to match the app's gold-glass system instead of its current navy/blue raw-HTML design. |

**Test:** manually walk all 4 flows (login, register with intentionally-invalid fields, password reset request+confirm, OAuth) in a browser; confirm no forced navigation on modal close, confirm register shows red borders/messages on bad input, confirm reset-password looks like the rest of the app.

## Phase 2 — Navbar active state + global background (P0/P1, small, high-visibility)

| Task | File(s) | Change |
|---|---|---|
| Add active-route highlighting | `RoleBasedNavigation.tsx` (desktop links ~280-296, dropdown items ~315-325, mobile items ~574-594) | Use `usePathname()` (already imported) to compare each link's `href` against the current path and apply the same `selected ? activeClasses : ""` pattern already used for the language switcher (~390-394) — e.g. `bg-gold-50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-300` plus perhaps a small underline/dot indicator. |
| Fix page/navbar contrast | `globals.css` (`--background` at line 9) | Change light-theme `--background` from `#FFFFFF` toward the already-defined `--muted` tone (`#F5F5F5`) or a close neighbor, so the `bg-white/80` glass navbar reads as a distinct floating panel again. Verify `--card` (also `#FFFFFF`, line 11) still reads correctly against the new body tone — cards should stay whiter than the body to keep their own separation. |

**Test:** click through every nav item and confirm the current page is visually indicated; screenshot the homepage/light-theme nav before/after to confirm the panel now has visible contrast against the body.

## Phase 3 — Heavy hero pattern (P1)

| Task | File(s) | Change |
|---|---|---|
| Simplify store page hero | `store/[id]/page.tsx` (~713-730, skeleton ~495) | Reduce to one background layer (e.g. `bg-gold-600` alone, or a subtler `bg-gradient-to-b from-gold-500 to-gold-700`) and drop to at most one animated element (or none). Remove the stacked `bg-black/20` + `bg-gray-500/30` pulsing overlays and the 3 floating orbs, or keep a single low-opacity orb for texture. |
| Apply the same simplification | `public-tryon/page.tsx` (~505-521, folds into Phase 4 hero work below) | Same treatment — one background layer, minimal/no competing overlays. |

**Test:** visually compare before/after on a store with no logo and a store with a logo; confirm the hero reads as calm brand backdrop rather than a competing focal point.

## Phase 4 — `public-tryon` page rebuild (P0, the largest single item)

Do this as its own PR given the size. Two-step approach per Phase 0 decision:

**Step A — in-place trim (ship first, fast):**
- Cut hero headline from `text-5xl…text-8xl` to `text-3xl…text-5xl`; subtitle from `text-xl…text-3xl` to `text-base…text-lg`.
- Remove the 5 decorative "cute tryon" shapes (~L568-636) and the SVG dot pattern; keep at most 1-2 subtle animations in the hero (e.g. one soft orb), remove the rest.
- Delete the dead commented-out product-header block (~L822-896) and its wrapper.
- Standardize on one neutral scale (`slate-*` or `gray-*`, not both) for all card/panel backgrounds.
- Reserve gold strictly for primary actions/active states; convert decorative gold badges/dots elsewhere to the neutral scale.
- Normalize button padding to the app's standard sm/md/lg sizes instead of the ~4 ad hoc paddings currently in use.
- Reduce the loading state from 6 concurrent animations to 1 (a single spinner is sufficient).
- Remove unused state (`newSessionAlert`, `mousePosition` if confirmed dead) — verify via search before deleting.

**Step B — component split (separate PR, structural only, no visual change):**
- Extract `<TryOnHero>`, `<TryOnFilters>`, `<TryOnGallery>`, `<SessionDetailModal>`, `<CommentsModal>`, `<ShareModal>`.
- Extract a `useTryOnSessions` hook for the data-fetching/mutation state (sessions, pagination, like/save/bookmark handlers).
- No behavior change — this is purely to make the file safe to iterate on going forward.

**Test:** Step A — visual before/after screenshots (light + dark + mobile), confirm no console errors, confirm all existing interactions (like, save, share, comments, load more) still work. Step B — confirm identical rendered output/behavior after the split (this is a refactor, not a redesign).

## Phase 5 — Color & button consistency pass (P1, mechanical, safe to parallelize)

This is the largest-count item but lowest-risk-per-change — mostly find/replace against a page's own repeated patterns. Recommend tackling the worst-offender pages one at a time rather than a single sitewide sweep, to keep each PR reviewable:

| Order | Page(s) | Primary changes |
|---|---|---|
| 1 | `try-on/page.tsx` | Replace the off-brand `#3B82F6/#8B5CF6/#EC4899` SVG gradient (~425-436) with gold-scale stops. |
| 2 | `store/[id]/page.tsx` | Replace hand-copied gold hex in the react-select theme (~371-406) with references to the actual `gold-*` Tailwind classes / CSS vars. |
| 3 | `admin-users/page.tsx` | Replace `sky-*` status badges (~444,733,864) with the existing `.info-badge` utility or a shared `Badge` component; begin migrating the 341 `gray-*` instances to semantic tokens. |
| 4 | `profile.tsx`, `product/[id].tsx` | Migrate `gray-*` → semantic tokens; unify button radius to `rounded-full` (or a single deliberate alternative) across all CTAs on each page; fix the amber/teal decorative colors (~704-707, 986) to use `--warning`/`--success` or drop them. |
| 5 | Remaining worst-offenders (`outfit-room`, `orders/[id]`, `agent/producers-management`, `producer/[producerId]/orders`, `UserWallet.tsx`, `register`) | Same `gray-*` → token migration, page by page. |
| 6 | Homepage hero CTA | Confirm current radius post-recent-rebuild; align to `rounded-full` (the Button primitive default) if it still overrides to `rounded-2xl`. |
| 7 | Sitewide | Standardize all primary-button radius overrides (`rounded-lg`/`xl`/`2xl`/responsive) to the Button primitive's default unless a specific page has a deliberate, documented reason not to. |

**Test:** typecheck after each page; visual screenshot diff per page (light+dark) to confirm no regressions; spot-check that semantic tokens render correctly in both themes (this is the whole point of using them).

## Phase 6 — Typography scale (P2)

| Task | File(s) | Change |
|---|---|---|
| Define one heading scale | wherever heading styles are centralized, or as a documented convention | Fix exactly 3 heading tiers: e.g. h1 = `text-3xl md:text-4xl font-bold text-foreground`, h2 = `text-xl md:text-2xl font-semibold text-foreground`, h3 = `text-lg font-semibold text-foreground`. Apply consistently; stop inventing new sizes per page. |
| Fix missing dark-mode heading colors | `try-on-history/page.tsx:196`, `producer/orders/page.tsx:103` | Add `dark:text-white` (or migrate to `text-foreground`, preferred) so headings aren't low-contrast in dark theme. |
| Fix the stray neutral scale | `reset-password/page.tsx:134` | Replace `neutral-900` with `text-foreground` (ties into Phase 1's reset-password rebuild — do together). |
| Use Fraunces meaningfully or drop it | Homepage hero, marketing/legal page titles | Apply `font-serif` to a small, deliberate set of brand moments (H1 on marketing-flavored pages) — or remove the font import if it's decided not to use it, to trim the font payload. |

## Phase 7 — Footer trim (P2)

| Task | File(s) | Change |
|---|---|---|
| Remove/shrink the AI CTA banner | `Footer.tsx:54-97` | Cut entirely, or reduce to a single inline line + button (no full padded card) — it duplicates CTAs already present in the hero/nav. |
| Remove duplicate WhatsApp CTA | `Footer.tsx:135-234` | Keep the WhatsApp icon in the social row (`Footer.tsx:48`) only; drop the separate WhatsApp button in the contact column. |
| Tighten spacing | `Footer.tsx:99` | Reduce `py-12 md:py-14` to something like `py-8 md:py-10` once the CTA banner is gone. |

**Test:** visual before/after; confirm footer height drops noticeably; confirm no broken links after trimming.

## Phase 8 — Utility pages & new content (P2/P3, mixed design + content work)

| Task | File(s) | Change |
|---|---|---|
| Fix Terms i18n | `terms/TermsClient.tsx:30-88` | Move hardcoded English strings into `LanguageContext.tsx` `t()` keys, matching every sibling legal page. |
| Expand Help Center | `help/HelpClient.tsx` | Add an accordion/expand-collapse pattern, group FAQs into categories (Orders, Payments, Returns, Account), and expand beyond the current 3 questions — this is primarily a content-writing task, schedule separately from the visual work above. |
| Build a human-readable sitemap page (if confirmed in scope) | new `src/app/site-map/page.tsx` (or similar) | Simple grouped-links page mirroring the nav's site structure; on-brand card/list styling consistent with the other utility pages. |
| Soften About's "illustrative" stats disclaimer | `AboutClient.tsx:69-76` | Either replace with real numbers once available, or reframe the copy so it doesn't read as fabricated (e.g. "Growing fast" qualitative framing instead of specific disclaimed numbers). |

## Phase 9 — Small polish items (P3)

| Task | File(s) | Change |
|---|---|---|
| Replace native confirm dialog | `orders/page.tsx:192` | Swap `window.confirm()` for a custom on-brand confirm dialog (the app already has `Card`/`Dialog` primitives to build this from). |
| Unify status-pill styling | Producer dashboard and any other page with ad hoc status-color functions | Extract/reuse one shared status-pill/`Badge` component (wallet already has a working pattern) instead of per-page conditional class functions. |
| Roll out skeleton loaders | `producer/dashboard/page.tsx` and other spinner-only pages | Reuse the `OrdersSkeleton` pattern as a template for a shared skeleton approach. |

---

## Suggested sequencing

1. **Phase 0** (decisions) → **Phase 1 + Phase 2** ship together first: highest severity (trust-breaking auth redirect, invisible form errors) plus the two highest-visibility, lowest-risk fixes (nav active state, background contrast). One PR, fast to review.
2. **Phase 3 + Phase 4 Step A** next — the two heavy-hero pages and the public-tryon trim are the most visually significant "make it feel professional" changes the user asked for directly.
3. **Phase 5** (color/button consistency) is the largest-volume work — split across several PRs, one worst-offender page at a time, safely parallelizable since pages are independent.
4. **Phase 6, 7** are small and can ride along with Phase 5's PRs or ship independently.
5. **Phase 4 Step B** (component split) and **Phase 8/9** are lower urgency — schedule after the visible-impact phases land.

No phase requires a new dependency or architecture change. Every item is a scoped edit to an existing file, or (public-tryon only) a scoped split of one file into several with no behavior change.
