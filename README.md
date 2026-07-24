# Tricky Solver Academy

> Master Mathematics. Excel in Business Studies.

An online learning and assessment platform for Kenyan secondary school students, covering CBC Senior School and KCSE — starting with Mathematics and Business Studies.

This is **the complete build, Phase 1 through Phase 6**: authentication, the full database schema, a working landing page, the question bank, a complete timed exam-taking engine, full payments (M-Pesa/Stripe/PayPal), the admin dashboard, teacher file uploads, PDF certificates, a student forum, direct messaging, a blog/CMS, a referral program, PWA offline support, full CI/CD, live classes (Zoom/YouTube), a study planner with SMS reminders, a platform-wide leaderboard, newsletter signup, and staging + production deploy environments. See `ROADMAP.md` for the full build history.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Zustand, KaTeX
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT access tokens + rotating refresh tokens (httpOnly cookies), Google OAuth-ready, TOTP 2FA
- **Payments:** M-Pesa Daraja STK Push, Stripe Checkout, PayPal Orders v2
- **File storage:** Cloudinary (revision papers, marking schemes, certificates)
- **PDF generation:** PDFKit (certificates)
- **PWA:** installable, offline app-shell caching via a hand-rolled service worker (no third-party PWA framework)
- **SMS:** Africa's Talking (study plan reminders, payment confirmations)
- **Background jobs:** in-process cron (node-cron) for scheduled reminders
- **CI/CD:** GitHub Actions (lint, typecheck, test against a real Postgres service container, build, Docker image verification) + a staging/production deploy workflow using GitHub Environments (Vercel + Render/Railway)
- **Docs:** Swagger / OpenAPI at `/api/docs`

## Project Structure

```
tricky-solver-academy/
├── apps/
│   ├── api/                 # Express + TypeScript backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── config/      # env validation, prisma client, logger, swagger
│   │   │   ├── controllers/ # HTTP handlers
│   │   │   ├── middleware/  # auth, validation, rate limiting, error handling
│   │   │   ├── routes/      # route definitions + OpenAPI docs
│   │   │   ├── services/    # business logic
│   │   │   ├── utils/       # jwt, password hashing, validators, AppError
│   │   │   ├── app.ts       # Express app assembly
│   │   │   └── server.ts    # entrypoint
│   │   ├── tests/           # vitest + supertest integration tests
│   │   └── Dockerfile
│   └── web/                  # Next.js frontend
│       ├── src/
│       │   ├── app/          # App Router pages
│       │   ├── components/   # ui/, layout/, landing/, auth/
│       │   ├── hooks/        # useAuthStore (zustand), useRequireAuth
│       │   ├── lib/          # api client, validators, utils
│       │   └── types/
│       └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start (Docker — recommended)

```bash
# 1. Copy env templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 2. Generate real JWT secrets and paste into apps/api/.env
openssl rand -base64 48   # JWT_ACCESS_SECRET
openssl rand -base64 48   # JWT_REFRESH_SECRET

# 3. Start everything
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:4000
- API docs (Swagger): http://localhost:4000/api/docs
- Postgres: localhost:5432 (user: `tsa_user`, password: `tsa_password`, db: `tricky_solver_academy`)

The API container automatically generates the Prisma client, creates the initial migration against your local Postgres, and seeds the database with demo accounts on first boot:

| Role    | Email                             | Password        |
|---------|------------------------------------|------------------|
| Admin   | admin@trickysolver.academy         | Admin@12345      |
| Teacher | teacher@trickysolver.academy       | Teacher@12345    |
| Student | student@trickysolver.academy       | Student@12345    |

## Database Migrations

This repo does not ship with pre-generated migration files under `prisma/migrations/` — generating them requires a one-time connection to a real Postgres instance, which isn't available in every environment this project might be assembled in.

**First-time setup (do this once, before your first production deploy):**

```bash
cd apps/api
# Point DATABASE_URL at a real (can be local/Docker) Postgres instance first
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "Add initial database migration"
```

This generates the SQL migration files and commits them to the repo. From then on:
- **Local development** (`docker compose up`) keeps using `prisma migrate dev`, which applies any new migrations and can generate new ones as the schema evolves.
- **CI** (`.github/workflows/ci.yml`) currently uses `prisma migrate dev` against its ephemeral test database for the same reason — once you've committed real migrations, switch that step to `npx prisma migrate deploy` to match production exactly and catch schema-drift issues in CI.
- **Production deploys** (`.github/workflows/deploy.yml`) already use `prisma migrate deploy`, which applies committed migrations without ever generating new ones or prompting — the correct, non-interactive command for a production database.

## Manual Setup (without Docker)

### Backend

```bash
cd apps/api
npm install
cp .env.example .env   # then fill in DATABASE_URL and JWT secrets
npx prisma migrate dev --name init
npx prisma db seed
npm run dev             # http://localhost:4000
```

### Frontend

```bash
cd apps/web
npm install
cp .env.example .env
npm run dev              # http://localhost:3000
```

## Payments Setup

All three providers are optional in development — payment initiation returns a clear "not configured" error if credentials are missing, rather than crashing.

**M-Pesa (Daraja API, sandbox)**
1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke) and create a sandbox app.
2. Fill in `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE` (use the sandbox test shortcode `174379`), `MPESA_PASSKEY` (from the sandbox docs).
3. `MPESA_CALLBACK_URL` must be a **publicly reachable HTTPS URL** — Safaricom cannot call `localhost`. Use `ngrok http 4000` (or similar) during local development and set it to `https://<your-ngrok-id>.ngrok.io/api/v1/payments/mpesa/callback`.
4. Test phone number for STK push in sandbox: `254708374149`.

**Stripe**
1. Get your test keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys).
2. Fill in `STRIPE_SECRET_KEY`.
3. For local webhook testing, run `stripe listen --forward-to localhost:4000/api/v1/payments/stripe/webhook` (via the [Stripe CLI](https://stripe.com/docs/stripe-cli)) and copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`.

**PayPal**
1. Create a sandbox app at [developer.paypal.com](https://developer.paypal.com/dashboard/applications/sandbox).
2. Fill in `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.
3. For webhook verification, create a webhook in the sandbox app pointing at `https://<your-public-url>/api/v1/payments/paypal/webhook` and copy the Webhook ID into `PAYPAL_WEBHOOK_ID`.

**Demo coupon:** the seed script creates `WELCOME20` (20% off), usable on both subscriptions and paper purchases.

## File Storage Setup (Cloudinary)

Teacher uploads and certificate PDFs are stored on Cloudinary rather than local disk, so the API stays stateless (safe to run multiple replicas).

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From the dashboard, copy your Cloud Name, API Key, and API Secret into `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. Without these set, upload and certificate endpoints return a clear "file storage is not configured" error rather than crashing.

## Testing

```bash
cd apps/api
npm test                 # requires DATABASE_URL pointing at a disposable test DB
```

## Security Notes

- Passwords hashed with **argon2id** (OWASP-recommended).
- Refresh tokens are opaque random strings stored server-side (not JWTs), stored in **httpOnly, sameSite=lax cookies**, and rotated on every use — reuse of a revoked token triggers automatic revocation of all sessions for that user.
- Access tokens are short-lived (15 min default) JWTs, sent as `Authorization: Bearer` headers.
- Rate limiting on all `/api` routes, with stricter limits on auth endpoints.
- `helmet`, `hpp`, CORS locked to `CLIENT_URL`, input validation via `zod` on every mutating endpoint.
- Environment variables are validated at boot — the server refuses to start with missing/weak secrets.
- **Payments:** Stripe webhooks are verified against the raw request body using `stripe.webhooks.constructEvent` (forged webhooks are rejected). PayPal webhooks are verified via PayPal's own signature-verification endpoint. M-Pesa callbacks are matched strictly against a `CheckoutRequestID` we generated ourselves. All three providers funnel through a single idempotent `fulfillPayment` function, and webhook events are deduplicated so retried webhooks can never double-grant access.
- **Admin:** granting `ADMIN` or `SUPER_ADMIN` role requires the acting user to already be a `SUPER_ADMIN` — a plain `ADMIN` cannot escalate their own or anyone else's privileges. Admins cannot deactivate their own account (prevents accidental self-lockout). Every role change and activation/deactivation is written to the audit log.
- **Uploads:** file type and size are validated server-side (not just via the `accept` attribute, which is trivially bypassed) — only PDF/Word documents up to 20MB are accepted for revision papers, only common image formats up to 5MB for images. Files are streamed directly to Cloudinary in memory, never written to local disk.
- **Certificates:** only issued for `MARKED` attempts scoring 50% or higher, and only to the student who owns the attempt — verified server-side, not just hidden in the UI.
- **Forum & messaging:** thread/post deletion is owner-or-admin only; locked threads reject new replies server-side (not just a disabled button); direct messages are only ever visible to their two participants (every query is scoped to `senderId`/`recipientId` matching the requester).
- **Live classes:** the `joinUrl` a teacher submits is validated against the expected domain for its type (`zoom.us` for Zoom, `youtube.com`/`youtu.be` for YouTube) — without this, "join URL" would be an arbitrary link an admin/teacher could paste that the frontend then renders as a one-click button, effectively a stored open-redirect.
- **Study plan:** every list/update/delete is scoped to the requesting user's own `userId` — another student's items return 404, not 403, so their existence isn't even confirmable.

## What's Next (see ROADMAP.md)

Everything from the original spec is now built. ROADMAP.md's "Why phased instead of all-at-once" section explains the delivery approach if you're curious how this was built across 6 phases without ever generating unverified code.

## CI/CD

Every push and pull request runs `.github/workflows/ci.yml`: lint → Prisma client generation → schema sync against a real ephemeral Postgres service container → typecheck → the full test suite → production build → `npm audit` (high-severity+ only) — for both apps independently, plus a job that verifies both Dockerfiles actually build. Nothing merges to `main` or `develop` without all of this passing.

`.github/workflows/deploy.yml` runs after CI succeeds, and deploys to one of two environments depending on which branch triggered it:

| Branch | Environment | Vercel deploy | Notes |
|--------|-------------|----------------|-------|
| `develop` | `staging` | Preview deployment | For testing changes before they reach production |
| `main` | `production` | `--prod` deployment | Can be configured with required reviewers in GitHub's Environment settings for an extra manual approval gate before the migration step runs |

Both environments deploy the frontend to Vercel, trigger a Render/Railway deploy hook for the API, then apply pending database migrations with `prisma migrate deploy`. Because `staging` and `production` are separate [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment), each has its own scoped secrets — a staging deploy can never accidentally touch the production database or Vercel project, since production's secrets simply aren't visible to the staging job. Configure these secrets on **each** environment separately before enabling it: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RENDER_DEPLOY_HOOK_URL`, `DATABASE_URL`. Any step whose secret isn't set yet skips itself with a clear message rather than failing the whole pipeline.

Dependabot (`.github/dependabot.yml`) checks weekly for dependency updates in both apps and the GitHub Actions themselves, grouping minor/patch bumps into one PR and giving majors their own PR for review — the same policy this project applied by hand every time a fresh CVE turned up in a transitive dependency during development (Next.js 15, the Stripe SDK, `postcss`, `axios`/`joi` via Africa's Talking, and `sharp` via Next's own image optimizer all needed exactly this kind of targeted bump or override at some point).

**Before your first real deploy:** generate and commit the initial database migration — see "Database Migrations" above. Without it, `prisma migrate deploy` in the deploy workflow has nothing to apply.

## Background Jobs

A study-plan reminder job runs in-process via `node-cron`, checking every 5 minutes for study sessions starting in the next 15 minutes and notifying their owner (in-app always, SMS if they have a phone on file). This runs automatically when the API boots; set `DISABLE_SCHEDULER=true` if you're running multiple API replicas and want to move this to a dedicated worker instead, to avoid every replica firing the same reminders independently.

## SMS Setup (Africa's Talking)

1. Create an account at [account.africastalking.com](https://account.africastalking.com) (a sandbox app is free and fully functional for testing).
2. Fill in `AFRICASTALKING_API_KEY` and `AFRICASTALKING_USERNAME` (use `sandbox` as the username for the sandbox environment).
3. Without these set, SMS sends are logged to the console instead of actually sent — the study planner, payment confirmations, and every other SMS-sending feature all degrade gracefully rather than erroring.
