# The Daily Canvas

A full-stack blog and lightweight CMS built with Next.js App Router, React
Server Components, and Drizzle on Postgres. Ships with an admin dashboard,
role + permission-based access control, comment threads with voting, a
moderation queue, newsletter signup, a contact form, and first-class SEO
(sitemap, RSS, JSON-LD, IndexNow).

> The canonical engineering rules for this repo live in
> [`.cursor/rules/server-actions-first.mdc`](./.cursor/rules/server-actions-first.mdc).
> Read that before adding mutations or caching.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling / UI:** Tailwind CSS 4, shadcn/ui, Radix primitives, framer-motion
- **Editor:** MDX Editor + `react-markdown` (GFM + `rehype-raw`)
- **Auth:** NextAuth v5 (Auth.js) with Drizzle adapter — Google OAuth +
  environment-gated credentials provider for dev/admin
- **Database:** Neon Postgres via `@neondatabase/serverless` + Drizzle ORM
- **File storage:** Vercel Blob (`@vercel/blob`)
- **Validation:** Zod v4
- **Caching:** `unstable_cache` with tag-based invalidation (`blogs`,
  `comments`, `stats`, `users`, `pages`, ...)

## Features

- Public blog: article pages, archive, topic filters, related posts,
  upvote/downvote, threaded comments with vote-based ordering.
- Moderation: per-article and per-comment reports, auto-hide at a threshold,
  admin moderation queue, soft-delete + "hidden" flags that preserve thread
  shape.
- Admin CMS: draft autosave, SEO metadata, cover image upload with
  optimization, CMS pages (Privacy / Terms / FAQ / Changelog), newsletter
  subscribers, contact form inbox.
- Users: role (`USER` / `ADMIN`) + granular `permissions` JSON (see below),
  disable accounts, username lock-after-first-set, admin-only notifications on
  signup / subscribe / contact / moderation events.
- SEO: dynamic sitemap, RSS (`/feed.xml`), JSON-LD helpers, IndexNow ping on
  publish/update/delete.

## Authorization model

Two layers work together:

1. **Role** (`users.role`, `"USER" | "ADMIN"`). `ADMIN` bypasses all permission
   checks.
2. **Permissions** (`users.permissions`, JSON). Granular flags typed once in
   [`src/lib/constants.ts`](./src/lib/constants.ts) as `UserPermissions`:
   `canSeeStats`, `canManageBlogs`, `canManageComments`, `canManagePages`,
   `canManageUsers`.

Always go through the helpers in [`src/lib/permissions.ts`](./src/lib/permissions.ts):

```ts
import { checkPermission, ensurePermission, PERMISSIONS } from "@/lib/permissions";

// In a page (Server Component):
const { session, authorized } = await checkPermission(PERMISSIONS.MANAGE_BLOGS);
if (!authorized) return <AccessDenied requiredPermission="canManageBlogs" />;

// Or to redirect unauthenticated/unauthorized to "/":
await ensurePermission(PERMISSIONS.MANAGE_USERS);
```

Ownership checks (e.g. "is this my blog?") live inside each server action.

## Getting started

### 1. Prerequisites

- Node.js 20+
- A Postgres database (Neon recommended)
- A Vercel Blob read/write token (for image upload)
- Optional: Google OAuth credentials

### 2. Install

```bash
npm install
```

### 3. Configure env

Copy `.env.example` → `.env` and fill in:

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."                       # openssl rand -base64 32
NEXTAUTH_SECRET="$AUTH_SECRET"          # keep in sync

AUTH_GOOGLE_ID="..."                    # optional
AUTH_GOOGLE_SECRET="..."                # optional

# Env-based credentials sign-in (dev + bootstrap the first admin)
DEV_ADMIN_EMAIL="admin@example.com"
DEV_ADMIN_PASSWORD="..."

BLOB_READ_WRITE_TOKEN="..."             # Vercel Blob
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Credentials sign-in is auto-enabled whenever both `DEV_ADMIN_EMAIL` and
`DEV_ADMIN_PASSWORD` are set; signing in with those values promotes the user
to `ADMIN` with all permissions.

### 4. Create schema

```bash
npm run db:push              # dev: push schema without migrations
# or
npm run db:migrate           # prod: apply committed migrations
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000 and sign in at `/signin`. The admin UI lives at
`/admin`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:push` | Push schema (dev shortcut) |
| `npm run db:blog-views` | Backfill `blog.viewCount` column |
| `npm run db:newsletter` | Ensure newsletter table |
| `npm run db:contact` | Ensure contact-submission table |
| `npm run db:sync-changelog` | Sync `/changelog` page content |
| `npm run db:seed-blogs` | Seed example blog posts |
| `npm run db:seed-blogs:update` | Reseed / update example posts |
| `npm run db:backfill-blog-tags` | Backfill `blog.tags` |
| `npm run db:migrate-blog-tags` | Migrate tags into the shared catalog |

The `ensure-*` scripts are **idempotent**; re-running them is safe. New schema
changes that need a runtime fix should follow the same pattern
(`CREATE TABLE IF NOT EXISTS ...`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`).

## Project structure

```
src/
├─ actions/        Server actions (mutations). "use server" at the top.
├─ app/            App Router routes, including /admin and /api.
├─ components/
│  ├─ admin/       Admin UI (list shells, filters, modals, sidebar).
│  ├─ blog/        Public blog primitives (cards, grids, hero).
│  ├─ client/      Client-only interactive components.
│  ├─ seo/         JSON-LD, meta helpers.
│  └─ ui/          shadcn/ui + Radix wrappers.
├─ db/             Drizzle schema, selectors, and client.
├─ hooks/          React hooks.
├─ lib/            Domain helpers (auth, caching tags, SEO, uploads, ...).
├─ queries/        Read-only DB queries (used by actions and server pages).
├─ types/          Ambient types (incl. next-auth module augmentation).
└─ auth.ts         NextAuth configuration.

drizzle/           SQL migrations (committed output of drizzle-kit).
scripts/           Idempotent ensure-*, seed-*, backfill-* scripts.
```

## Engineering conventions

These are enforced-by-convention (see `.cursor/rules/server-actions-first.mdc`):

- **Mutations go in `src/actions/*.ts`.** They return
  `{ success: boolean; error?: string; data?: ... }`. Client code must check
  `success`.
- **Authz goes through `checkPermission(PERMISSIONS.*)`.** Ownership checks
  stay inline in the action.
- **Cached public reads must revalidate on write.** Mutations call
  `revalidateTag("blogs", "max")` / `revalidateTag("comments", "max")` /
  `revalidatePath(...)` for every affected surface. The second argument
  (`"max"`) is the Next.js 16 stale-while-revalidate profile.
- **Moderation vs. deletion.**
  - `isHidden` hides content from public queries, preserving it for admins.
  - `isDeleted` is a soft delete.
  - `isApproved` is a publishing / approval gate.
- **Admin list pages** use `AdminListPageShell` + `AdminFilters` +
  `AdminPagination` (+ `AdminSearch` where relevant). Sidebar entries in
  `src/components/admin/AdminSidebar.tsx` are permission-gated.
- **DB changes** ship with an idempotent `scripts/ensure-*.ts` alongside the
  Drizzle migration so existing environments can be fixed in place.

## Deployment

Tested on Vercel. Any Next.js 16-compatible host works as long as:

- `DATABASE_URL` points at a Postgres instance (Neon's HTTP driver is the
  default).
- `BLOB_READ_WRITE_TOKEN` is set if you use cover-image upload.
- `AUTH_SECRET` / `NEXTAUTH_SECRET` are set to the same value.

## License

Private project; all rights reserved unless stated otherwise.
