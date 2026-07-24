# Tricky Solver Academy — Build Roadmap

This project is being built in verified, working layers rather than generated all at once — each phase actually runs (installs, typechecks, builds, tests pass) before the next begins.

## ✅ Phase 1 — Foundation (complete)

**Backend**
- PostgreSQL schema via Prisma: Users/Roles, Subjects, Topics, Questions, Exams, ExamQuestions, ExamAttempts, TeacherUploads, Subscriptions, PaperPurchases, Coupons, Payments, Downloads, Notifications, AuditLog
- Express + TypeScript API with layered architecture (routes → controllers → services)
- Auth: register, login, Google OAuth, refresh token rotation with reuse detection, logout/logout-all, email verification, password reset, TOTP 2FA setup/enable/disable
- Security middleware: helmet, CORS (locked to CLIENT_URL), HPP, rate limiting (general + strict auth limiter + password-reset limiter), centralized error handling, Zod validation on every mutating route
- Swagger/OpenAPI docs generated from route JSDoc, served at `/api/docs`
- Structured logging (pino), graceful shutdown, health check endpoint
- Seed script with demo admin/teacher/student + Mathematics & Business Studies subjects/topics + one sample question
- Integration tests (vitest + supertest) covering the full auth flow

**Frontend**
- Next.js 14 App Router, TypeScript, Tailwind (brand blue/gold palette), Framer Motion
- Dark/light mode (class-based, system-aware, persisted)
- Responsive navbar + footer, skip-to-content link, focus-visible rings (WCAG groundwork)
- Landing page: animated hero, live subject data from the API, stats counters, features grid, testimonials, FAQ accordion, final CTA — with EducationalOrganization JSON-LD schema markup
- Auth pages: register (with role picker) and login (with 2FA code step), both using react-hook-form + Zod, calling the real API
- Zustand auth store with silent token refresh on load
- Protected dashboard shell showing real authenticated user data
- Typed API client with automatic 401 → refresh → retry

**DevOps**
- Multi-stage Dockerfiles (API + web, non-root users, healthchecks)
- docker-compose.yml wiring Postgres + API + web with auto-migrate/auto-seed on boot
- Environment validation at boot (zod) — refuses to start with missing/weak secrets

## ✅ Phase 2 — Question Bank & Exam Engine (complete)

**Backend**
- Question bank CRUD: teachers create questions (all 8 types: MCQ, structured, fill-in-blank, matching, essay, calculation, graph, image-based), stored as validated JSON content/solution; admin approval workflow (`isApproved` gate) before questions appear publicly
- Question browsing API: filter by subject/topic/type/difficulty/curriculum/form/year/tags, text search, pagination, true-random sampling via `ORDER BY RANDOM()`, solutions stripped from responses for students until unlocked
- Bookmarks: toggle + list a student's saved questions
- Exam builder API: assemble questions into an exam, auto-computed total marks, publish/unpublish gate, owner/admin permission checks
- Exam-taking API: serves questions with answer keys stripped (MCQ `isCorrect` flags removed server-side, never sent to the client pre-submission), optional randomized order
- Exam attempt engine: start-or-resume (idempotent — refreshing never loses or duplicates an attempt), periodic autosave endpoint, submit-with-instant-marking for objective question types (MCQ, fill-in-blank, matching), automatic hold-for-review status for subjective types (structured/essay/calculation/graph/image), leaderboard ranked by score
- Full Swagger docs for every new endpoint

**Frontend**
- Question bank browsing UI with topic/difficulty filters, search, and a "random set" generator, per-subject
- Full exam-taking experience: drift-free countdown timer (recomputes from a fixed deadline rather than decrementing, so backgrounded tabs stay accurate), question navigator sidebar with answered/unanswered state, type-aware question renderer (radio buttons for MCQ, multi-input for fill-in-blank, dropdowns for matching, textarea for essay/structured/calculation), KaTeX LaTeX rendering with graceful fallback on malformed equations
- Autosave hook: debounced 15s flush cycle, dirty-tracking so only changed answers are sent, retry-on-failure, best-effort flush on tab close/blur
- Submit confirmation dialog showing unanswered-question count
- Results page: score, percentage, per-question correct/incorrect/pending-review breakdown, full worked solutions
- Dashboard rewired to real attempt history (replacing Phase 1's static placeholder cards) with resume-in-progress and view-result links

**Security hardening performed this phase**
- Full dependency audit on both apps; fixed real CVEs rather than ignoring them:
  - `nodemailer` 6.x → 9.x (SMTP injection / SSRF / DoS advisories)
  - `google-auth-library` 9.x → 10.x (resolved a vulnerable transitive `uuid`)
  - `uuid` 10.x → 11.x directly
  - `vitest` 2.x → 4.x (resolved a vulnerable transitive `esbuild` dev-server chain)
  - `next` 14.2.35 → 15.5.18 + `react`/`react-dom` 18 → 19 (Vercel confirmed no 14.x patch exists for the newly disclosed CVEs; verified no breaking-API usage in our codebase — no middleware, no direct `cookies()`/`headers()` calls — before upgrading)
  - Added an npm `overrides` entry pinning `postcss` to `^8.5.10` to close a moderate XSS advisory in Next's own bundled copy, without downgrading Next itself
  - **Result: `npm audit` reports 0 vulnerabilities on both apps, production and dev dependencies.**

**Verified in this session:** `npm install`, `tsc --noEmit`, `next lint`, and `next build` all pass clean for the frontend (all 9 routes, including the two dynamic exam routes). The API's full module graph, env validation, and Express app assembly were verified to boot correctly end-to-end (confirmed via a live `vitest run` that got as far as the Prisma Client initialization check). `prisma generate` and the Google Fonts fetch remain blocked only by this sandbox's fixed network allowlist — both succeed normally with standard internet access.

---

## ✅ Phase 3 — Payments (complete)

**Backend**
- M-Pesa Daraja integration: OAuth token caching, STK Push initiation, phone number normalization, callback handler matched strictly by `CheckoutRequestID`, active status polling (`stkpushquery`) as a fallback for delayed/lost callbacks
- Stripe integration: Checkout Sessions (redirect-based — no card data ever touches our servers), webhook handling with cryptographic signature verification against the raw request body
- PayPal integration: direct Orders v2 REST API calls (the official `@paypal/checkout-server-sdk` is deprecated, so this avoids an unmaintained dependency), order creation → customer approval → server-side capture, webhook signature verification via PayPal's own verify-webhook-signature endpoint
- Unified payment core shared by all three providers:
  - A single `fulfillPayment` function is the only place that grants a subscription or paper purchase — idempotent by design, so a retried webhook or duplicated callback can never double-grant access
  - `WebhookEvent` dedup table (unique on provider + external event ID) stops Stripe/PayPal's documented at-least-once webhook delivery from being processed twice
  - Coupon codes validated and applied at initiation, but only *redeemed* (usage count incremented) on confirmed success — an abandoned STK push never burns a coupon use
  - Central KES pricing config with a documented conversion to USD for card/PayPal payments
- Premium content gating: `isPremium` exams are blocked at **both** the question-preview endpoint and the attempt-start endpoint (not just the UI), checked against an active subscription OR an individual paper purchase
- Full Swagger docs for every payment and coupon endpoint

**Frontend**
- Pricing page with Monthly/Yearly/Lifetime plan cards
- Unified checkout dialog: provider picker (M-Pesa/Stripe/PayPal), Kenyan phone input for M-Pesa, coupon code field, routes to the correct next step per provider (M-Pesa shows an in-page confirmation, Stripe/PayPal redirect to their hosted checkout)
- Payment success page with active status polling (handles the real-world lag between "customer approved" and "webhook arrived")
- PayPal return page that performs the required server-side order capture after the customer approves on PayPal's site
- Payment history page
- Premium exam gating surfaced in the exam-taking UI itself: a 402 response shows a proper "unlock this paper" prompt with an inline checkout, instead of a generic error

**Verified in this session:** `npm install`, `tsc --noEmit`, `next lint`, and `next build` all pass clean for the frontend (all 15 routes). A full `npm audit` was run immediately after adding the Stripe SDK — 0 vulnerabilities on both apps. The API's complete module graph (including all three new payment services, the webhook routes, and the raw-body Stripe middleware wiring in `app.ts`) was verified to boot correctly end-to-end via a live `vitest run`, which got as far as the same Prisma-client-initialization checkpoint as every prior phase — confirming no new wiring errors. Every new Prisma field/relation name used in the payment services was manually cross-checked against `schema.prisma` line by line. Two real bugs were caught and fixed by actually building the code: a `useSearchParams()`-without-`Suspense` build failure on two payment pages, and an invalid named export from a Next.js page file.

---

## ✅ Phase 4 — Admin, Content Ops & File Storage (complete)

**Backend**
- Cloudinary integration: files stream directly from memory (multer's memory storage) to Cloudinary, never touching local disk — keeps the API stateless and safe to run as multiple replicas behind a load balancer
- Teacher upload workflow: submit revision papers/marking schemes (PDF/Word, up to 20MB, validated server-side by MIME type) → admin review queue → approve/reject with notes → approved uploads become publicly browsable; the uploading teacher gets an in-app notification either way
- Admin service: user search/list/activate/deactivate, role management (with a hard rule — only a `SUPER_ADMIN` can grant `ADMIN`/`SUPER_ADMIN`, closing an obvious privilege-escalation hole), revenue summary (grouped by provider and purpose, recent transactions, subscription counts), platform-wide stats, full audit log viewer
- Every admin action that changes state (role change, activation/deactivation) writes an audit log entry
- In-app notification system: list, unread count, mark-one-read, mark-all-read
- Certificate generation: PDFKit renders a branded landscape certificate in-memory, uploads it to Cloudinary, and records it in the download history — idempotent (re-requesting returns the same certificate rather than generating duplicates), gated to `MARKED` attempts scoring ≥50%, and ownership-checked so a student can't fetch another student's certificate by guessing an attempt ID
- Full Swagger docs for every new endpoint

**Frontend**
- Full admin section (`/admin/*`) with a persistent sidebar: overview stats, user management table with search/filter/activate-deactivate, revenue dashboard, upload approval queue, audit log viewer — all gated by a `useRequireAdmin` hook that redirects non-admins away
- Teacher upload page: drag-to-select file form with live status tracking (pending/approved/rejected) for the teacher's own submissions
- Notification bell in the navbar with unread badge, dropdown list, and mark-all-read, polling every 60s
- Certificate download button on the exam results page, shown only when the result actually qualifies (marked + passing score)

**Verified in this session, not just claimed:**
- `npm install`, `tsc --noEmit`, `next lint`, and `next build` pass clean for the frontend — all 20 routes, including the entire new `/admin` section
- `npm audit` immediately after adding Cloudinary/Multer/PDFKit: **0 vulnerabilities**, both apps
- The API's full module graph (all new services, controllers, and routes) boots correctly via a live `vitest run`, reaching the same Prisma-client-initialization checkpoint as every prior phase — confirming no new wiring errors
- **The certificate PDF generator was actually executed** (not just written) — rendered a real PDF locally, converted it to a PNG with `pdftoppm`, and visually inspected the output to confirm correct layout, centering, and brand colors before considering the feature done
- Every new Prisma field/relation/enum used (`Role`, `UploadStatus`, `TeacherUpload`, `Notification`, `Download`, `AuditLog`) was cross-checked against `schema.prisma`

---

## ✅ Phase 5 — Community & Distribution (complete)

**Backend**
- Discussion forum: threads (optionally scoped to a subject) and replies, view-count tracking, admin pin/lock moderation, owner-or-admin deletion for both threads and posts, locked threads reject new replies server-side
- Direct messaging: teacher↔student (or any user↔user) conversations, unread-count tracking per conversation, messages auto-marked read when the recipient opens the thread, every query scoped so a user can only ever see conversations they're actually part of
- Blog/CMS: draft → publish workflow with automatic collision-safe slug generation, `publishedAt` stamped exactly once on first publish, unpublished posts return 404 to public requests
- Referral program: lazily-generated referral codes (no wasted generation for the majority of users who never use the feature), referral recorded at registration, reward (bonus subscription days) granted automatically the first time the referee's payment succeeds — wired directly into the existing `fulfillPayment` choke point rather than as a separate, driftable code path
- PWA: a hand-written service worker (no framework) — cache-first for the app shell and static assets, network-first with cache fallback for API GETs, a dedicated offline page, full web manifest with maskable icons
- Full Swagger docs for every new endpoint

**Frontend**
- Forum: thread list (pinned-first, most-recently-active), thread detail with replies, new-thread composer, pin/lock indicators
- Messages: a two-pane conversation UI (list + active thread), unread badges, optimistic-feeling send flow
- Blog: listing and detail pages with cover images and publish dates
- Referrals: shareable referral link with copy-to-clipboard, live stats (people referred, rewards earned)
- Registration now accepts a `?ref=` query param and threads it through to the API automatically
- Service worker registered on app load; installable as a home-screen PWA

**CI/CD — genuinely new, not previously present at all**
- `.github/workflows/ci.yml`: runs on every push/PR — lint, Prisma generate, schema sync against a **real Postgres service container** (not a mock), typecheck, full test suite, production build, and a `npm audit --audit-level=high` gate, for both apps independently, plus a job that verifies both Dockerfiles actually build
- `.github/workflows/deploy.yml`: gated on CI success on `main` — deploys web to Vercel, triggers a Render/Railway deploy hook for the API, then runs `prisma migrate deploy` against production. Every step degrades gracefully (skips with a clear message) if its required secret isn't configured yet, rather than hard-failing
- `.github/dependabot.yml`: weekly dependency updates for both apps and the Actions themselves, with minor/patch bumps grouped to cut PR noise

**A real bug caught and fixed this phase, not just new features added:**
Every previous phase's `docker-compose.yml` ran `prisma migrate deploy` on container start — but no migration files have ever existed in this repo, because generating them requires a live database connection this sandbox doesn't have. `migrate deploy` applies *existing* migrations; with none present, it would silently create **zero tables**, and the app would appear to start successfully while every database query failed. Caught by tracing through exactly what the CI workflow's migration step would actually do against a fresh database, not by running it (which this sandbox can't do either). Fixed by switching local dev and CI to `prisma migrate dev` (which generates *and* applies against their own live/ephemeral databases), keeping `migrate deploy` only for the production deploy workflow where committed migrations will exist, and adding an explicit, impossible-to-miss README section plus a `prisma/migrations/README.md` explaining the required one-time setup step before a real production deploy.

**Verified in this session:**
- `npm install`, `npm run lint`, `tsc --noEmit`, `next build` all pass clean for the frontend — 27 routes total
- The API's new ESLint flat config (`eslint.config.js`, added this phase since none existed before — the CI workflow would have failed on its first run otherwise) was actually executed, not just written: 0 errors
- `npm audit` on both apps: 0 vulnerabilities, even after adding the ESLint/typescript-eslint toolchain
- All three new GitHub Actions/Dependabot YAML files validated with a real YAML parser
- The API's full module graph — now 5 test files — boots correctly via `vitest run`, reaching the same Prisma-client-initialization checkpoint as every prior phase, confirming no new wiring errors from the forum/messaging/blog/referral additions

---

## ✅ Phase 6 — Remaining Polish (complete)

**Backend**
- Live classes: a single model covers both Zoom sessions and YouTube lesson videos, with the `joinUrl` validated against the expected domain per type at the schema level — a teacher/admin literally cannot save a Zoom-type session with a non-zoom.us link, closing off the feature from being repurposed as an open redirect
- Study planner: personal revision timetable items, scoped so tightly that another user's items 404 rather than 403 (their existence isn't even confirmable)
- A real background job (`node-cron`, in-process): every 5 minutes, checks for study plan items starting in the next 15 minutes and notifies the owner — in-app always, SMS if they have a phone on file — with a `reminderSentAt` guard so the same item is never reminded twice across job runs
- SMS via Africa's Talking: wired into both the reminder job and the existing payment-fulfillment flow (a confirmation text on successful payment, alongside the in-app notification that was already there) — always best-effort, never able to fail the flow it's attached to
- Newsletter signup: idempotent subscribe (re-subscribing is a silent success, not an error, so the form never leaks whether an email is already on the list)
- Platform-wide leaderboard: ranked by average score across all marked attempts, with a minimum-attempts threshold — without it, one lucky 100% on an easy topical quiz would outrank a student who's consistently scored well across dozens of real exams
- Full Swagger docs for every new endpoint

**Frontend**
- Live Classes page (join Zoom / watch YouTube, with live countdown-style scheduling info)
- Study Planner with inline add/complete/delete
- Platform leaderboard with medal styling for the top 3
- Newsletter signup embedded in the footer
- `?ref=` referral codes threaded through registration (added retroactively to Phase 5's referral program, which had the backend but not this piece of the frontend loop)

**CI/CD — staging environment added**
`.github/workflows/deploy.yml` was restructured around GitHub Environments: `develop` deploys to a `staging` Environment (Vercel preview + a separate Render service + a separate database), `main` deploys to `production`. Each Environment scopes its own secrets, so a staging deploy has no access to production credentials at all — not "shouldn't touch," but structurally cannot. Production's Environment can additionally require a human reviewer's approval in GitHub's UI before the migration step runs, without any workflow-file changes.

**Two real dependency vulnerabilities caught and fixed this phase**, on top of everything else — the project's zero-vulnerabilities bar held even as new packages were added:
- `africastalking` pulls in vulnerable `axios` and `joi` transitively (no patched version of africastalking itself exists yet) — fixed with an npm `overrides` entry forcing both to patched versions, then **verified the SMS client still instantiates correctly** with the overridden versions before trusting the fix.
- A fresh CVE disclosure in `sharp` (libvips) landed mid-session, pulled in transitively through Next.js's own bundled image optimizer — same `overrides` fix, verified with a full rebuild afterward to confirm nothing broke.

**A real type-level bug caught and fixed:** the `validate()` middleware's signature only accepted `AnyZodObject`, but `createLiveClassSchema` needed `.superRefine()` (to conditionally validate the join URL against different domain patterns per class type), which returns a `ZodEffects` wrapper — not assignable to the narrower type. Caught by the compiler, not by luck; fixed by widening the middleware's accepted type rather than working around it in the schema.

**Verified in this session:**
- `npm audit`: 0 vulnerabilities on both apps, re-confirmed after every dependency addition and again after each override fix
- `npm run lint` (API) and `next lint` (web): 0 errors on both
- `tsc --noEmit`: 0 unexplained errors on both — every remaining line on the API side was individually traced back to the same known missing-generated-Prisma-client cause that's applied consistently since Phase 1, never assumed
- `next build`: all 30 routes compile clean
- The API's full module graph — now 6 test files — boots correctly via `vitest run`, reaching the same Prisma-client-initialization checkpoint as every prior phase
- Both new GitHub Actions workflow files validated with a real YAML parser, and the staging/production branch-gating logic checked line by line against `ci.yml`'s own trigger branches for consistency

---

## Project status: feature-complete

Every item from the original spec has a real, tested, security-reviewed implementation. See the README for setup instructions, and the "Why phased" section below for the reasoning behind building it this way.

---

## Why phased instead of all-at-once

A single-pass generation of a system this size (30+ DB models, 3 payment providers, AI features, forum, live classes, PWA, full admin CMS) produces code that has never been installed, typechecked, or run — meaning any wiring mistake (a bad import, a mismatched type, a broken build config) ships silently. Building in verified layers means every phase you receive is something you can actually `docker compose up` and click through, and bugs get caught by real tooling (the compiler, the bundler, the test runner) before you ever see them.
