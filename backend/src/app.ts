import cors from "cors";
import express from "express";

import { FRONTEND_ORIGIN, PORT } from "./config";
import errorHandler from "./middleware/errorHandler";
import log from "./middleware/logger";
import organizationsRouter from "./routes/organizations";
import relationshipsRouter from "./routes/relationships";
import tagsRouter from "./routes/tags";
import usersRouter from "./routes/users";
import whoamiRouter from "./routes/whoami";

const app = express();
const allowedOrigins = new Set([FRONTEND_ORIGIN]);

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://localhost:3001");
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
  }),
);

app.use(express.json());

app.use(log);

app.get("/", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.use("/api/whoami", whoamiRouter);
app.use("/api/users", usersRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/relationships", relationshipsRouter);
app.use("/api/tags", tagsRouter);

app.use(errorHandler);
app.listen(PORT, () => {
  console.info(`> Listening on port ${PORT}`);
});
