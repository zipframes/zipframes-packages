import { GenericContainer, Wait } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";

export type S3Handle = {
  readonly container: StartedTestContainer;
  readonly endpoint: string;
  readonly accessKey: string;
  readonly secretKey: string;
  readonly region: string;
  readonly stop: () => Promise<void>;
};

const ACCESS_KEY = "zipframes";
const SECRET_KEY = "zipframes-secret";
const REGION = "us-east-1";

/**
 * Starts a MinIO container with an S3-compatible API. SeaweedFS is what the
 * Compose stack uses in the app repo; MinIO is enough for integration tests.
 */
export const startS3 = async (): Promise<S3Handle> => {
  const container = await new GenericContainer("minio/minio:RELEASE.2024-12-18T13-15-44Z")
    .withEnvironment({
      MINIO_ROOT_USER: ACCESS_KEY,
      MINIO_ROOT_PASSWORD: SECRET_KEY,
    })
    .withCommand(["server", "/data"])
    .withExposedPorts(9000)
    .withWaitStrategy(Wait.forListeningPorts())
    .start();

  const endpoint = `http://${container.getHost()}:${String(container.getMappedPort(9000))}`;

  return {
    container,
    endpoint,
    accessKey: ACCESS_KEY,
    secretKey: SECRET_KEY,
    region: REGION,
    stop: async () => {
      await container.stop();
    },
  };
};
