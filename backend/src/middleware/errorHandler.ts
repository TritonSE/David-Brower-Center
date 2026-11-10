import { isHttpError } from "http-errors";

import { Prisma } from "../generated/prisma/client";

import type { NextFunction, Request, Response } from "express";

// Known Prisma error codes that indicate a client problem rather than a server fault.
const PRISMA_ERROR_RESPONSES: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: "A record with that value already exists." },
  P2003: { status: 400, message: "A referenced record does not exist." },
  P2023: { status: 400, message: "Invalid identifier." },
  P2025: { status: 404, message: "Record not found." },
};

const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
  // 500 is the "internal server error" error code, this will be our fallback
  let statusCode = 500;
  let errorMessage = "An unexpected error occurred.";
  const origin = req.headers.origin ? req.headers.origin : "Unknown Origin";
  const prismaResponse =
    error instanceof Prisma.PrismaClientKnownRequestError
      ? PRISMA_ERROR_RESPONSES[error.code]
      : undefined;

  // check is necessary because anything can be thrown, type is not guaranteed
  if (isHttpError(error)) {
    // error.status is unique to the http error class, it allows us to pass status codes with errors
    statusCode = error.status;
    errorMessage = error.message;
    console.error(`${error.name}: ${error.message}\t${req.method}\t${req.url}\t${origin}`);
  } else if (error instanceof Prisma.PrismaClientKnownRequestError && prismaResponse) {
    ({ status: statusCode, message: errorMessage } = prismaResponse);
    console.error(`Prisma ${error.code}: ${error.message}\t${req.method}\t${req.url}\t${origin}`);
  }
  // Unexpected errors: log the details but never leak internal messages to the client.
  else if (error instanceof Error) {
    console.error(`${error.name}: ${error.message}\t${req.method}\t${req.url}\t${origin}`);
  } else {
    console.error("Unknown error thrown", error, `\t${req.method}\t${req.url}\t${origin}`);
  }

  res.status(statusCode).json({ error: errorMessage });
};

export default errorHandler;
