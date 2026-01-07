# David-Brower-Center
Database for nonprofit organizations to visualize relationships between NPOs

## Setup
Before starting development, make sure you have these tools installed:
- [Node.js](https://nodejs.org/en) - this is our JS runtime
- [Npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) - this is our package manager
- [Postman](https://www.postman.com/downloads/) - helpful for testing API routes
- [Supabase CLI](https://supabase.com/docs/guides/cli) - database (postgres)

## Environment
Add the `.env.frontend` and `.end.backend` from the project google drive to their respective directories in your local branch

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
