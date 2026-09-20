import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export type PostgresHandle = {
  readonly container: StartedPostgreSqlContainer;
  readonly connectionUri: string;
  readonly stop: () => Promise<void>;
};

export const startPostgres = async (): Promise<PostgresHandle> => {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  return {
    container,
    connectionUri: container.getConnectionUri(),
    stop: async () => {
      await container.stop();
    },
  };
};
