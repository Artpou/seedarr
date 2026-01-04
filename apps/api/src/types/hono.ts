import type { User } from "@/db/schema";

// Define Hono context variables
export type HonoVariables = {
  user: User;
};
