/* eslint-disable ts/consistent-type-definitions */
import type { AuthenticatedUser } from "../middleware/requireAuth";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export {};
