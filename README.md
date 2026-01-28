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
6. **Start backend:** `cd backend && npm run start`  
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
   Scroll to **“Connection string”** / **“Connection info”**:
   - **URI** (or **Transaction** pooler, port `6543`): use as `DATABASE_URL`.  
     Format: `postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - **Direct connection** (port `5432`): use as `DIRECT_URL`.  
     Format: `postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres`  
   Replace `[YOUR-PASSWORD]` with the database password you set when creating the project. If you don’t have it, reset it under **Database → Database password**.

5. **Optional: use “Connection string” tabs**  
   Supabase often shows **URI**, **JDBC**, etc. Use the **URI** that matches:
   - Pooler (e.g. port **6543**) → `DATABASE_URL`
   - Direct (port **5432**) → `DIRECT_URL`

6. **Add to `backend/.env`**  
   Copy `.env.backend.example` to `.env` (or `.env.backend` then copy to `.env`). Set:

   ```
   APP_PORT=3000
   FRONTEND_ORIGIN=http://localhost:3000
   DATABASE_URL=<pooler-URI-from-step-4>
   DIRECT_URL=<direct-URI-from-step-4>
   ```

   Never commit `.env` or `.env.backend`; they are gitignored.

7. **Verify**  
   Run `cd backend && npx prisma migrate dev` (and optionally `npx prisma studio`) to confirm Prisma can connect using `DIRECT_URL`.
