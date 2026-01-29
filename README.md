# David-Brower-Center

Database for nonprofit organizations to visualize relationships between NPOs

## Setup

Before starting development, make sure you have these tools installed:

- [Node.js](https://nodejs.org/en) **20.19+, 22.12+, or 24.0+** (required by Prisma 7.x; avoid Node 23)
- [Npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) - this is our package manager
- [Postman](https://www.postman.com/downloads/) - helpful for testing API routes
- [Supabase CLI](https://supabase.com/docs/guides/cli) - database (postgres)

## Environment

Add the `.env.frontend` and `.env.backend` from the project Google Drive to their respective directories (`frontend/` and `backend/`). Copy to `.env` in each directory when running the app, or rename. Use `backend/.env.backend.example` and `frontend/.env.frontend.example` as templates.

## First-time setup

1. **Use Node 20.19+, 22.12+, or 24.0+** (e.g. `nvm use` in project root — there’s an `.nvmrc`).
2. **Install dependencies:**  
   `cd backend && npm install` then `cd ../frontend && npm install`.
3. **Add `.env`** in `backend/` and `frontend/` from Google Drive (see [Environment](#environment)).
4. **Generate Prisma client:**  
   `cd backend && npx prisma generate`
5. **Sync database (optional):**  
   `cd backend && npx prisma migrate dev` (requires `DIRECT_URL` in `.env`).
6. **Seed dummy organizations (optional):**  
   `cd backend && npx prisma db seed` — populates the `organizations` table with dummy data for testing (e.g. GET `/organizations`). Safe to run multiple times; skips if data already exists.
7. **Start backend:** `cd backend && npm run start`  
   **Start frontend:** `cd frontend && npm run dev`

## Backend

1. `cd backend`
2. Run `npm install` to install all dependencies
3. `npm run start` to start the backend

## Frontend

1. `cd frontend`
2. Run `npm install` to install all dependencies
3. `npm run dev` to start development server

## Database

We're using Postgres (through supabase) for our project instead of MongoDB

### Syncing local environment with current database

1. Pull latest code with `git pull`
2. Sync your database with `npx prisma migrate dev`
3. Update your client with `npx prisma generate`

### Making database changes

1. To update the database schema, modify `prisma/schema.prisma`
2. Run a migration in development: `npx prisma migrate dev --name <describe_your_change>`
3. Commit the generated SQL migration file to Git

Note when running `npx prisma migrate`: If you get a message saying that the database needs to be reset and that your changes will be lost, it usually means you made some changes but your local database is out of sync. The safest option is usually to say yes so that you're in sync with everyone, unless the changes you made were important. Ideally this should not happen.

### Seeding dummy data

To populate the `organizations` table with dummy data for local testing (e.g. GET `/organizations`), run `npx prisma db seed` from the `backend/` directory. The seed is configured in `prisma.config.ts` and is idempotent (skips if data already exists).

### Viewing data

Run `npx prisma studio` for a GUI to view the database

## Getting Supabase keys (for `backend/.env` / `.env.backend`)

You need `DATABASE_URL` and `DIRECT_URL` in your backend env. Follow these steps:

1. **Sign in to Supabase**  
   Go to [supabase.com](https://supabase.com) and sign in. Use the project’s Supabase account (or create a project if you’re setting up a new one).

2. **Open your project**  
   Select the project for this app (or create one).

3. **Go to Project Settings → Database**  
   In the left sidebar: **Project Settings** (gear) → **Database**.

4. **Find the connection strings**  
   In the Dashboard, go to **Connect** → **Connection string** (or **Project Settings → Database**). You’ll see:
   - **Transaction** (port **6543**), host `aws-0-[region].pooler.supabase.com` → use as `DATABASE_URL`.  
     Add `?pgbouncer=true` if you use it for the app (serverless).  
   - **Session** (port **5432**), host `aws-0-[region].pooler.supabase.com` → use as `DIRECT_URL` for Prisma migrations.  
   - **Direct** (port **5432**), host `db.[project-ref].supabase.co` → also 5432, but **IPv6-only**; many networks can’t reach it.

   Use the **Session** pooler string (pooler host + 5432) for `DIRECT_URL`, not the Direct string, unless you know your network has IPv6. Replace `[YOUR-PASSWORD]` with your database password (reset under **Database → Database password** if needed).

5. **Ports vs hosts**  
   - **6543** = Transaction pooler → `DATABASE_URL`  
   - **5432** = use **Session pooler** (`...pooler.supabase.com:5432`) for `DIRECT_URL` to avoid “Can’t reach” (IPv6) issues.  
   Direct `db....supabase.co:5432` is correct in theory but often unreachable from Mac/home networks.

6. **Add to `backend/.env`**  
   Copy `.env.backend.example` to `.env` (or `.env.backend` then copy to `.env`). Set:

   ```
   APP_PORT=3000
   FRONTEND_ORIGIN=http://localhost:3000
   DATABASE_URL=<transaction-pooler-6543>
   DIRECT_URL=<session-pooler-5432>
   ```

   Never commit `.env` or `.env.backend`; they are gitignored.

7. **Verify**  
   Run `cd backend && npx prisma migrate dev` (and optionally `npx prisma studio`) to confirm Prisma can connect using `DIRECT_URL`.

### "Can't reach database server" (P1001) with `DIRECT_URL`

Prisma uses `DIRECT_URL` for migrations. The **Direct** connection (`db.[project-ref].supabase.co:5432`) is **IPv6-only**; many networks (including typical Mac/home) can’t reach it, so you get P1001 even with the right port.

**Fix:** Use the **Session** pooler for `DIRECT_URL` instead of Direct:

- Host: `aws-0-[region].pooler.supabase.com` (same as Transaction, different port)
- Port: **5432**
- Example: `postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres`

Keep **Transaction** (port **6543**, same pooler host) for `DATABASE_URL`. Ports 5432 vs 6543 are correct; the important change is using the **pooler** host for `DIRECT_URL`, not `db....supabase.co`. Optionally add `?connect_timeout=30` to the URL if you hit timeouts.
