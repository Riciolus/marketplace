import { Pool, type PoolClient, type PoolConfig } from "pg";
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

const pool = new Pool(config);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (duration > 200) {
      console.warn("Slow Query", { text, duration });
    }

    return result;
  } catch (err) {
    console.error("Query Error", { text, err });
    throw err;
  }
}

export async function closePool() {
  await pool.end();
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
