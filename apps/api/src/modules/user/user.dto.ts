import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { user, userRoleEnum } from "@/db/schema";

// Database schemas
export const userSelectSchema = createSelectSchema(user);
export const userInsertSchema = createInsertSchema(user);

// Exported types (omit password from User)
export type User = Omit<typeof userSelectSchema._output, "password">;
export type NewUser = typeof userInsertSchema._input;

// Request schemas
export const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(userRoleEnum),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(userRoleEnum).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
