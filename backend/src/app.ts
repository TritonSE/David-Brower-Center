import cors from "cors";
import express from "express";
import createError from "http-errors";

import apiRouter from "./api/whoami";
import { FRONTEND_ORIGIN, PORT } from "./config";
import { prisma } from "./lib/prisma";
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
  }),
);

app.use(express.json());

app.use(log);

app.get("/", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Mount API routes
app.use("/api", apiRouter);
app.get("/organizations", async (req, res, next) => {
  try {
    const organizations = await prisma.organization.findMany();
    res.status(200).json({ organizations });
  } catch {
    next(createError(500, "Failed to fetch organizations"));
  }
});

app.get("/organizations/:id", async (req, res, next) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!organization) {
      next(createError(404, `Organization ${req.params.id} not found`));
      return;
    }

    res.status(200).json({ organization });
  } catch {
    next(createError(500, `Failed to fetch organization ${req.params.id}`));
  }
});

app.use(errorHandler);
app.listen(PORT, () => {
  console.info(`> Listening on port ${PORT}`);
});
// mongoose
//   .connect(MONGO_URI)
//   .then(() => {
//     console.info("Mongoose connected!");
//     app.listen(PORT, () => {
//       console.info(`> Listening on port ${PORT}`);
//     });
//   })
//   .catch(console.error);
