import cors from "cors";
import express from "express";
import createError from "http-errors";

import { FRONTEND_ORIGIN, PORT } from "./config";
import { prisma } from "./lib/prisma";
import errorHandler from "./middleware/errorHandler";
import log from "./middleware/logger";

const app = express();

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  }),
);

app.use(express.json());

app.use(log);

app.get("/", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.get("/organizations", async (req, res, next) => {
  try {
    const organizations = await prisma.organization.findMany();
    res.status(200).json({ organizations });
  } catch {
    next(createError(500, "Failed to fetch organizations"));
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
