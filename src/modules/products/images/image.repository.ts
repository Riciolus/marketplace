import type { PoolExecutor } from "../../../infrastructure/database/executor.js";

export class ImageRepository {
  constructor(private executor: PoolExecutor) {}
}
