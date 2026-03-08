import type { PoolExecutor } from "../../../infrastructure/database/executor.js";

export class VariantRepository {
  constructor(private executor: PoolExecutor) {}
}
