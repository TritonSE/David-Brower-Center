import cors from "cors";
import express from "express";

import organizationsRouter from "./api/organizations";
import apiRouter from "./api/whoami";
import { FRONTEND_ORIGIN, PORT } from "./config";
import errorHandler from "./middleware/errorHandler";
import log from "./middleware/logger";

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

// Mount API routes
app.use("/api", apiRouter);
app.use(organizationsRouter);

app.get("/tags", async (req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: {
        name: "asc",
      },
    });
    res.status(200).json({ tags });
  } catch {
    next(createError(500, "Failed to fetch tags"));
  }
});

app.use(errorHandler);
app.listen(PORT, () => {
  console.info(`> Listening on port ${PORT}`);
});
