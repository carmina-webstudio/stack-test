@AGENTS.md

# Working on this site (instructions for Claude Code)

## Who you're working with
Carmina runs a small website business for local service companies (Bothell, WA). She is technical but new to GitHub and web development. Explain results in plain language, give click-by-click steps whenever she has to do something on GitHub, Netlify or Lovable, and keep reports short. Act as a senior front-end engineer and UX designer: apply best practices without being asked, and flag anything you'd do better.

Token use: one session per task. Once the PR for this task is merged, say the session is done and that a new task should start in a new session. If the conversation gets long (many back-and-forth rounds, large files or logs read in), tell Carmina before continuing, say roughly why, and suggest a new session with a short summary she can paste in to pick up.

## How changes flow
- Lovable builds and edits this site and syncs with the `main` branch. Never commit directly to `main`, never force-push, never rewrite history.
- Carmina decides what to change. You make the change on a branch, open the PR, and check the Netlify deploy preview (the link is in the Netlify bot's comment on the PR). If you can't open the preview, say so.
- Send her the preview link once the GitHub Actions run ("Site tests") is green. Merge only after she writes "approve".
- PRs into `main`: use **Squash and merge**, then delete the branch.
- One pull request per task. Keep changes focused; don't reformat or touch unrelated files.
- In the PR description, list what changed and why in plain language, and what she should check.

## Publishing
- Never push or commit to `production`.
- Before the publish PR, run the site-tester agent in full on `main`. Any FAIL: fix it on `main` first through a normal PR.
- When Carmina says "publish": open a PR from `main` into `production`, paste the site-tester report into it, wait for a green GitHub Actions run, and send her the Netlify preview link. After she writes "approve", merge it with a **merge commit** (never squash). Each publish costs 15 Netlify credits.

## Going live
- In `src/lib/business.ts` set `siteStatus: "live"` and `siteUrl` to the client's domain (canonical tags, Open Graph, schema, sitemap.xml and robots.txt follow).
- The site-tester must show zero FAIL and zero placeholders. In live mode the check fails on any `[PLACEHOLDER: ...]`, test data (555-01xx numbers, @example.com, "Test Landscaping"), a *.netlify.app address, the placeholder favicon and a missing share image.

## Stack facts (don't break these)
- TanStack Start (React) + Tailwind v4, created by Lovable. `@lovable.dev/vite-tanstack-config` sets up the build; don't add the plugins it already includes.
- Hosting is **Netlify**, not Lovable or Cloudflare. `netlify.toml` publishes the pre-rendered static pages from `.output/public`. Every page must be listed in `tanstackStart.pages` in `vite.config.ts` so it's pre-rendered.
- `netlify.toml` must keep `NITRO_PRESET = "cloudflare-module"`. Without it, the build fails on Netlify.
- No Lovable backend features (Lovable Cloud, Lovable Emails, databases, auth).
- Forms use **Netlify Forms**: `data-netlify="true"`, hidden `form-name` input, honeypot `bot-field`, and a matching static copy in `public/__forms.html`. Keep the two in sync whenever form fields change.
- Forms submit with fetch and then route to the site's own thank-you page; don't rely on Netlify's action-page lookup. Validate every field inline.
- The owner email subject is set from the form values through a hidden 'subject' input (also in public/__forms.html).
- No confirmation email to the customer and no email service (Resend, SMTP, Netlify functions). The thank-you page is the customer's confirmation; the owner gets Netlify's built-in form notification. Don't add one unless these rules change.
- `buttonVariants()` runs through `cn()`, so a passed className overrides the variant's defaults. Use the `accent` variant for the main call-to-action.
- Business facts live in `src/lib/business.ts`; page text, schema, head tags (title, description, canonical, Open Graph), sitemap.xml and the robots.txt Sitemap line all read from it. The phone number is `business.phone` (`href`, `display`). Page head tags come from `pageHead()` in `src/lib/seo.ts`; don't hand-write them per page.
- Every page has a title and description; public pages have a canonical tag and Open Graph tags; sitemap.xml lists public pages only (`PUBLIC_PAGES` in `src/lib/business.ts`).
- `business.ts` stays plain data with no imports (the site check loads it with Node's type stripping). `siteStatus` ("spec" or "live") drives the robots tag. A missing fact reads `[PLACEHOLDER: what's needed]`; that's the only placeholder marker.
- Spec sites stay private via Netlify Private + noindex; never block crawlers in robots.txt.
- Don't use Lovable's 'Try to fix all' in the SEO review (costs credits); fixes go through Claude Code.
- `routeTree.gen.ts` is generated by the build; commit the regenerated file when routes change.

## Content rules
- Use only content Carmina provides. Never invent reviews, testimonials, prices, licenses, certifications, years in business or other claims. If something is missing, leave a clearly marked placeholder and say so.
- Every page keeps `<meta name="robots" content="noindex, nofollow">` until Carmina says the site is going live (it follows `siteStatus` in `business.ts`; see "Going live").
- The favicon must be the client's logo or initials. Never ship Lovable's default favicon.

## UX rules (local service websites)
- First screen: who, what, where, and how to contact, readable in 5 seconds. Phone number visible as text. Main button uses the accent color and stands out.
- Hero height follows its content (never full-screen); the next section must be visible below it.
- Navigation on every page, mobile menu with a close (X) icon, footer links, 404 page, sticky Call Now / Get a Quote bar on phones.
- Tap targets at least 44px. Form fields share one style; right input types and autocomplete; dropdowns start on a placeholder.
- FAQ uses native `<details>`/`<summary>` so answers stay in the HTML and several can be open.
- Contrast meets WCAG AA; focus outlines only for keyboard users; respect reduced motion.

## Before opening a PR, always
1. Run the site-tester agent (`.claude/agents/site-tester.md`): build, `npm run check`, `npm run test:e2e`, visual review of every screenshot. Also `npx tsc --noEmit -p .` and ESLint/Prettier on the files you changed.
2. Fix every FAIL. Never weaken or delete a test to make it pass; if a fix is too big for the task, mark the test `test.fixme` with the reason and list it in the PR.
3. Paste the site-tester's summary line and FAIL table into the PR.
4. Wait for the GitHub Actions run ("Site tests") to be green before sending Carmina the preview link.
5. Screenshots go in the PR description, never in a commit — not even temporarily. A file added and then deleted still stays in git history forever, and cleaning it out would mean rewriting `main`, which breaks Lovable's sync. Also send the screenshots in your chat reply. If you can't attach images to the PR without committing them, describe what each one shows in the PR and ask Carmina to drag them into the description (or a comment) on GitHub.

## Testing
- **Layer 1, static check** (`npm run check`, `scripts/site-check.ts`): seconds, no browser. Reads `business.ts`, `tests/site.config.ts`, the source and the built pages in `.output/public`; prints a PASS / FAIL / WARN table with a fix hint per row and the placeholders still to fill. Runs on every Netlify deploy (`npm run build && npm run check`): a FAIL stops the deploy and the site keeps its last good version.
- **Layer 2, browser tests** (`npm run test:e2e`, Playwright in `tests/`): every page and element at phone 375, tablet 768, laptop 1280x560, desktop 1440 and wide 2880, in Chromium and WebKit (iPhone Safari). Full-page screenshots go to `test-results/screens/` (gitignored). Runs in GitHub Actions on every PR into `main` or `production` and every push to `main`; the report and screenshots are a downloadable artifact for 7 days.
- **Layer 3, site-tester agent** (`.claude/agents/site-tester.md`): runs layers 1 and 2, reviews every screenshot against a visual rubric, flags unsupported claims, checks the deploy preview form and the process rules, and writes the report. Read-only.
- **Layer 4, gates**: Netlify runs the static check on every deploy; GitHub Actions runs everything.
- Adding a page: add the route, add it to `tanstackStart.pages` in `vite.config.ts` and to `pages` in `tests/site.config.ts` (the check fails until all three match). Adding a homepage section: add it to `homeSections` (label the `<section>` with `aria-labelledby` on its heading). Changing nav or form fields: update `nav` / `quoteForm` in `tests/site.config.ts`. For a new client, change data in `business.ts` and `tests/site.config.ts`, not the tests.
- Never weaken or delete a test to make it pass. Fix the site, or mark the test `test.fixme("reason")` and tell Carmina.
- `npx tsc --noEmit -p tests` typechecks the tests, the check script and playwright.config.ts.
- Tests find elements the way a visitor or screen reader does (role, label, accessible name), not by CSS classes.

## Lessons learned
Every new lesson adds a line here AND a check or test in the same PR.
- PR #1: screenshots were committed to git → never commit images; screenshots go in the PR description. Check L11.
- PR #4: Netlify build failed without the preset → `NITRO_PRESET = "cloudflare-module"` stays in netlify.toml. Check L1.
- PR #5: publish PRs (main → production) use a merge commit, never squash. site-tester process step.
- PR #7, #8: Lovable's default favicon shipped → favicon must be the client's logo or initials. Check L9 (and L13 for the placeholder "T").
- PR #8: full-screen hero hid the rest of the page → hero height follows content; at 1440x900 it ends by 75% of the screen, at 1280x560 the next section shows. Test "hero height follows its content".
- PR #8 (hero Call Now blended into the background) → Call Now must meet 4.5:1 text contrast and stand out 3:1 from the hero. Test "Call Now stands out".
- PR #11: forms → submit with fetch to our own `/thank-you` page; page form and `public/__forms.html` field names match (form-name, bot-field, subject). Check L8; tests "valid submit sends everything Netlify needs".
- PR #12: heading sizes out of balance on tablet and desktop → site-tester visual rubric "Text".
- Lovable's accordion dropped FAQ answers from the HTML → native `<details>`, answers in the HTML and in FAQPage schema. Check L6; tests "FAQ" and "JavaScript off".
- Lovable SEO review 2026-10-01: 404 had no description, no page had og:image or og:url → Check L3.
- PR #14: short pages (quote, thank-you, 404) left an empty band under the footer on tall screens → page wrapper is a flex column with a growing `<main>`. Test "footer sits at the bottom of the screen".
- PR #14: the thank-you page promised "no obligation", which the client never gave → only promises listed in `business.claims` may appear on a page. Check L15.
- Lovable can commit straight to `main` without a PR (its framework update on 2026-10-01 changed TanStack versions and `__root.tsx`) → GitHub Actions also runs on every push to `main`.
- Test form submissions use only @example.com addresses or Carmina's own inbox (a real submit emails the owner). Tests intercept every POST; the site-tester submits once on the deploy preview only.
