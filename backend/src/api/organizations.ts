import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/requireAuth";

const router = Router();

type OrganizationBody = {
  name?: unknown;
  mission?: unknown;
  city?: unknown;
  state?: unknown;
  country?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  min_budget?: unknown;
  max_budget?: unknown;
  tags?: unknown;
};

router.get("/organizations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizations = await prisma.organization.findMany();
    res.status(200).json({ organizations });
  } catch {
    next(createError(500, "Failed to fetch organizations"));
  }
});

router.post(
  "/organizations",
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as OrganizationBody;

      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        throw createError(400, "name is required");
      }

      const organizationData = {
        name: body.name.trim(),
        mission: typeof body.mission === "string" ? body.mission : null,
        city: typeof body.city === "string" ? body.city : null,
        state: typeof body.state === "string" ? body.state : null,
        latitude: typeof body.latitude === "number" ? body.latitude : null,
        longitude: typeof body.longitude === "number" ? body.longitude : null,
        min_budget: typeof body.min_budget === "number" ? Math.trunc(body.min_budget) : null,
        max_budget: typeof body.max_budget === "number" ? Math.trunc(body.max_budget) : null,
        ...(typeof body.country === "string" ? { country: body.country } : {}),
      };

      const organization = await prisma.organization.create({
        data: organizationData,
      });

      res.status(201).json({ organization });
    } catch (err: unknown) {
      next(err);
    }
  },
);

export default router;
