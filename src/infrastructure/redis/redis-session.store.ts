import type { Redis } from "ioredis";

export interface SessionStore {
  save(
    userId: string,
    sessionId: string,
    tokenHash: string,
    ttlSeconds: number
  ): Promise<void>;

  get(userId: string, sessionId: string): Promise<string | null>;

  delete(userId: string, sessionId: string): Promise<void>;

  exist(userId: string, sessionId: string): Promise<number>;
}

export class RedisSessionStore implements SessionStore {
  constructor(private redis: Redis) {}

  private key(userId: string, sessionId: string) {
    return `rt:${userId}:${sessionId}`;
  }

  async exist(userId: string, sessionId: string) {
    return await this.redis.exists(this.key(userId, sessionId));
  }

  async save(
    userId: string,
    sessionId: string,
    tokenHash: string,
    ttlSeconds: number
  ): Promise<void> {
    await this.redis.set(this.key(userId, sessionId), tokenHash, "EX", ttlSeconds);
  }

  async get(userId: string, sessionId: string) {
    return await this.redis.get(this.key(userId, sessionId));
  }

  async delete(userId: string, sessionId: string) {
    await this.redis.del(this.key(userId, sessionId));
  }
}
