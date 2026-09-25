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
const S3_PORT = 8333;

/** Image that `docker pull` can fetch anonymously. Callers can override it. */
export const DEFAULT_S3_IMAGE = "chrislusf/seaweedfs:3.80";

const s3IdentityConfig = JSON.stringify({
  identities: [
    {
      name: "zipframes",
      credentials: [{ accessKey: ACCESS_KEY, secretKey: SECRET_KEY }],
      actions: ["Admin", "Read", "Write", "List", "Tagging"],
    },
  ],
});

/**
 * Starts SeaweedFS with its S3 gateway. Pass an image to override the default
 * tag when a caller needs a different build.
 */
export const startS3 = async (image: string = DEFAULT_S3_IMAGE): Promise<S3Handle> => {
  const container = await new GenericContainer(image)
    .withCopyContentToContainer([
      {
        content: s3IdentityConfig,
        target: "/etc/seaweedfs/s3.json",
      },
    ])
    .withCommand([
      "server",
      "-dir=/data",
      "-filer",
      "-s3",
      "-s3.config=/etc/seaweedfs/s3.json",
      `-s3.port=${String(S3_PORT)}`,
    ])
    .withExposedPorts(S3_PORT)
    .withWaitStrategy(Wait.forListeningPorts())
    .withStartupTimeout(90_000)
    .start();

  const endpoint = `http://${container.getHost()}:${String(container.getMappedPort(S3_PORT))}`;

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
