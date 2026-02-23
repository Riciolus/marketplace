import { Pool, type PoolConfig } from "pg";
import { env } from "../../config/env.js";

const config: PoolConfig = {
  connectionString: env.DATABASE_URL,
  application_name: "marketplace-api",
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  options: "-c statement_timeout=5000",
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
};

export const pool = new Pool(config);

pool.on("error", (err) => {
  console.error("Unexpected idle client error", err);
});
