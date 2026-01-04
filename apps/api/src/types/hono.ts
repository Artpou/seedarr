import type { User } from "@/modules/user/user.dto";

// Define Hono context variables
export type HonoVariables = {
  user: User;
};
