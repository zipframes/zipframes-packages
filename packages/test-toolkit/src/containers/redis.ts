import { RedisContainer } from "@testcontainers/redis";
import type { StartedRedisContainer } from "@testcontainers/redis";

export type RedisHandle = {
  readonly container: StartedRedisContainer;
  readonly url: string;
  readonly stop: () => Promise<void>;
};

export const startRedis = async (): Promise<RedisHandle> => {
  const container = await new RedisContainer("redis:7-alpine").start();
  return {
    container,
    url: container.getConnectionUrl(),
    stop: async () => {
      await container.stop();
    },
  };
};
