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

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
});

/**
 * Parse & validate
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    { type: "env_validation_error", issues: parsed.error.format() },
    "Invalid environment variables"
  );
  process.exit(1);
}

/**
 * Export validated & typed config
 */
export const env = Object.freeze(parsed.data);
