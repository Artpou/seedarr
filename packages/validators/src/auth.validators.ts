import { Type } from "@sinclair/typebox";

export const signInSchema = Type.Object({
  username: Type.String({
    minLength: 3,
    maxLength: 20,
    pattern: "^[a-zA-Z0-9_]+$",
    description: "Username can only contain letters, numbers, and underscores.",
  }),
  password: Type.String({
    minLength: 1,
    description: "Password is required.",
  }),
});

export const signUpSchema = Type.Object({
  username: Type.String({
    minLength: 3,
    maxLength: 20,
    pattern: "^[a-zA-Z0-9_]+$",
    description: "Username can only contain letters, numbers, and underscores.",
  }),
  password: Type.String({
    minLength: 8,
    description: "Password must be at least 8 characters.",
  }),
  confirmPassword: Type.String({
    minLength: 8,
    description: "Password confirmation must be at least 8 characters.",
  }),
});
