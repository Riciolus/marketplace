import z from "zod";

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["user", "admin"]).default("user"),
  created_at: z.string().datetime(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
