// import { closePool, query } from "../infrastructure/database/pool.js";

import { PoolExecutor } from "../infrastructure/database/executor.js";
import { pool } from "../infrastructure/database/pool.js";
import { withTransaction } from "../infrastructure/database/transaction.js";

const executor = new PoolExecutor();

async function main() {
  try {
    const result = await executor.query("SELECT 1", [], "health.check");
    console.log("Connection work: ", result.rows);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await pool.end();
  }
}

async function transaction() {
  await withTransaction(async (tx) => {
    const result = await tx.query("SELECT 1", [], "tx.test");
    console.log(result.rows);
  });
}

main();

transaction();
