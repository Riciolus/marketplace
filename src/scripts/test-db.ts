import { closePool, query } from "../infrastructure/database/pool.js";

async function main() {
  try {
    const result = await query("SELECT 1");
    console.log("Connection work: ", result.rows);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await closePool();
  }
}

main();
