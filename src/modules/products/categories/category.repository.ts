import type { PoolExecutor } from "../../../infrastructure/database/executor.js";

export class CategoryRepository {
  constructor(private executor: PoolExecutor) {}
}
