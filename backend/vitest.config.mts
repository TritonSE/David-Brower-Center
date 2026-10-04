import { defineConfig } from "vitest/config";

// Tests run against a disposable local Postgres (see README "Running backend tests").
// Explicit env here wins over backend/.env because dotenv never overrides existing vars,
// so tests can never reach the hosted Supabase database or storage.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres@localhost:54329/dbc_test";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    fileParallelism: false,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      DIRECT_URL: TEST_DATABASE_URL,
      APP_PORT: "0",
      FRONTEND_ORIGIN: "http://localhost:3000",
      SUPABASE_URL: "https://test-project.supabase.co",
      SUPABASE_ANON_KEY: "test-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    },
  },
});
