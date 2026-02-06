import { CustomError } from "./errors";
const NO_APP_PORT_MESSAGE = "Could not find app port env variable";
// const NO_MONGO_URI_MESSAGE = "Could not find Mongo URI env variable";
const NO_FRONTEND_ORIGIN_MESSAGE = "Could not find frontend origin env variable";
const NO_SUPABASE_URL_MESSAGE = "Could not find Supabase URL env variable";
const NO_SUPABASE_ANON_KEY_MESSAGE = "Could not find Supabase anon key env variable";
const NO_SUPABASE_SERVICE_ROLE_KEY_MESSAGE =
  "Could not find Supabase service role key env variable";

export class InternalError extends CustomError {
  constructor(code: number, message: string) {
    super(code, 500, message);
  }
  static NO_APP_PORT = new InternalError(1, NO_APP_PORT_MESSAGE);
  // static NO_MONGO_URI = new InternalError(2, NO_MONGO_URI_MESSAGE);
  static NO_FRONTEND_ORIGIN = new InternalError(3, NO_FRONTEND_ORIGIN_MESSAGE);
  static NO_SUPABASE_URL = new InternalError(4, NO_SUPABASE_URL_MESSAGE);
  static NO_SUPABASE_ANON_KEY = new InternalError(5, NO_SUPABASE_ANON_KEY_MESSAGE);
  static NO_SUPABASE_SERVICE_ROLE_KEY = new InternalError(6, NO_SUPABASE_SERVICE_ROLE_KEY_MESSAGE);
}
