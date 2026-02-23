import "dotenv/config";
import { z } from "zod";

/**
 * Environment schema definition
 * All required variables must be declared here.
 * If one is missing or invalid → app crashes at startup.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  DB_SLOW_QUERY_THRESHOLD: z.coerce.number().int().positive(),

  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
});

/**
 * Parse & validate
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.format());
  process.exit(1);
}

/**
 * Export validated & typed config
 */
export const env = Object.freeze(parsed.data);
