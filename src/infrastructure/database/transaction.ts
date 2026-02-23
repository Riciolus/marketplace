import type { PoolClient, QueryResult } from "pg";
import type { QueryExecutor, QueryResultRow } from "./executor.js";
import { pool } from "./pool.js";

class TransactionExecutor implements QueryExecutor {
  constructor(private client: PoolClient) {}

  async query<T extends QueryResultRow>(
    text: string,
    params?: unknown[],
    queryName?: string
  ): Promise<QueryResult<T>> {
    return this.client.query<T>(text, params);
  }
}

export async function withTransaction<T>(
  fn: (executor: QueryExecutor) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const executor = new TransactionExecutor(client);

    const result = await fn(executor);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
