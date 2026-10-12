import { Redis } from "ioredis";
import type { Cache } from "./types.js";

export class NoopCache implements Cache {
  async get() {
    return null;
  }
  async set() {}
}

// Cache failures must never break a tool call: log to stderr and fall through.
export class RedisCache implements Cache {
  private readonly redis: Redis;

  constructor(url: string) {
    this.redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: false });
    this.redis.on("error", (err: Error) => console.error("[redis]", err.message));
  }

  async get(key: string) {
    try {
      return await this.redis.get(key);
    } catch (err) {
      console.error("[redis] get failed:", (err as Error).message);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number) {
    try {
      await this.redis.set(key, value, "EX", ttlSeconds);
    } catch (err) {
      console.error("[redis] set failed:", (err as Error).message);
    }
  }
}
