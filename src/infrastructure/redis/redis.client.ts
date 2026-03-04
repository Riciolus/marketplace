// infrastructure/redis/redis.client.ts

import { Redis } from "ioredis";
import { logger } from "../../shared/logger/logger.js";
import { env } from "../../config/env.js";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on("error", (err) => {
  logger.error({ err }, "Redis error");
});
