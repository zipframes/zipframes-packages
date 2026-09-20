import { z } from "zod";

export const registerRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerResponseSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int().positive(),
});

export const jwksResponseSchema = z.object({
  keys: z.array(z.record(z.string(), z.unknown())),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type JwksResponse = z.infer<typeof jwksResponseSchema>;
