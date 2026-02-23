import type { QueryResult } from "pg";
import { pool } from "./pool.js";
import { env } from "../../config/env.js";

export interface QueryResultRow {
  [column: string]: any;
}

export interface QueryExecutor {
  query<T extends QueryResultRow = any>(
    text: string,
    params?: unknown[],
    queryName?: string
  ): Promise<QueryResult<T>>;
}

export class PoolExecutor implements QueryExecutor {
  async query<T extends QueryResultRow>(
    text: string,
    params?: unknown[],
    queryName?: string
  ): Promise<QueryResult<T>> {
    const start = Date.now();

    try {
      const result = await pool.query<T>(text, params);
      const duration = Date.now() - start;

      if (duration > env.DB_SLOW_QUERY_THRESHOLD) {
        console.warn({
          type: "slow_query",
          queryName,
          duration,
        });
      }

      return result;
    } catch (error) {
      console.error({
        type: "query_error",
        queryName,
        error,
      });
      throw error;
    }
  }
}
