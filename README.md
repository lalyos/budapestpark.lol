# BP Park Events (Cloudflare Workers + D1)

A minimal one-page event listing app inspired by the Budapest Park look.

## Stack
- **TypeScript**
- **Hono** (framework that runs cleanly on Cloudflare Workers)
- **Cloudflare Workers**
- **Cloudflare D1**

## Features
- One-page HTML/CSS/JS UI (served from Worker)
- `GET /events` public API
- Admin-only editing on the same endpoint:
  - `POST /events` add event
  - `DELETE /events?id=<id>` delete event
- Admin auth is environment-driven (no password in source code)

## Local run
1. Install deps:
   ```bash
   npm install
   ```
2. Create D1 DB (once):
   ```bash
   wrangler d1 create bp_park_db
   ```
   Copy the returned `database_id` into `wrangler.toml`.
3. Configure admin credentials:
   - Local dev: create `.dev.vars`
     ```env
     ADMIN_USER=admin
     ADMIN_PASS=your-strong-password
     ```
   - Remote secret:
     ```bash
     wrangler secret put ADMIN_PASS
     ```
4. Apply migration locally:
   ```bash
   npm run db:migrate
   ```
5. Start dev server:
   ```bash
   npm run dev
   ```

## Deploy to Cloudflare
1. Apply migration to remote DB:
   ```bash
   npm run db:migrate:remote
   ```
2. Deploy Worker:
   ```bash
   npm run deploy
   ```

## Notes
- The UI stays minimal but visually similar (dark + neon accents).
- Admin mode in browser stores a Basic token in `localStorage` for convenience.
