import type { PoolExecutor } from "../../infrastructure/database/executor.js";

export class ProductRepository {
  constructor(private executor: PoolExecutor) {}
}
