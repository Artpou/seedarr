import { z } from "zod";

// Registration schema
export const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
