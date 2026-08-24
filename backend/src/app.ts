import cors from "cors";
import express from "express";

import { FRONTEND_ORIGINS } from "./config";
import errorHandler from "./middleware/errorHandler";
import log from "./middleware/logger";
import accountCreationRequestsRouter from "./routes/accountCreationRequests";
import organizationsRouter from "./routes/organizations";
import tagsRouter from "./routes/tags";
import usersRouter from "./routes/users";
import whoamiRouter from "./routes/whoami";

const app = express();
const allowedOrigins = new Set(FRONTEND_ORIGINS);

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://localhost:3001");
  allowedOrigins.add("http://localhost:3002");
  allowedOrigins.add("http://localhost:3003");
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser clients (curl, server-to-server) may omit Origin.
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      // Reject without throwing so the response can still include CORS headers
      // where appropriate, and we don't turn this into an opaque 500.
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Raised from the 100kb default to accommodate base64-encoded profile pictures.
app.use(express.json({ limit: "8mb" }));

app.use(log);

app.get("/", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.use("/api/whoami", whoamiRouter);
app.use("/api/account-creation-requests", accountCreationRequestsRouter);
app.use("/api/users", usersRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/tags", tagsRouter);

app.use(errorHandler);

export default app;
