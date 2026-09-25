import { beforeEach, describe, expect, it, vi } from "vitest";

const stop = vi.fn(async () => undefined);
const s3Images: string[] = [];

vi.mock("@testcontainers/postgresql", () => ({
  PostgreSqlContainer: class {
    start = async () => ({
      getConnectionUri: () => "postgresql://postgres:postgres@127.0.0.1:5432/test",
      stop,
    });
  },
}));

vi.mock("@testcontainers/rabbitmq", () => ({
  RabbitMQContainer: class {
    start = async () => ({
      getAmqpUrl: () => "amqp://guest:guest@127.0.0.1:5672",
      stop,
    });
  },
}));

vi.mock("@testcontainers/redis", () => ({
  RedisContainer: class {
    start = async () => ({
      getConnectionUrl: () => "redis://127.0.0.1:6379",
      stop,
    });
  },
}));

vi.mock("testcontainers", () => ({
  Wait: { forListeningPorts: () => ({}) },
  GenericContainer: class {
    constructor(image: string) {
      s3Images.push(image);
    }
    withEnvironment() {
      return this;
    }
    withCommand() {
      return this;
    }
    withExposedPorts() {
      return this;
    }
    withWaitStrategy() {
      return this;
    }
    withCopyContentToContainer() {
      return this;
    }
    withStartupTimeout() {
      return this;
    }
    start = async () => ({
      getHost: () => "127.0.0.1",
      getMappedPort: (port: number) => port,
      stop,
    });
  },
}));

describe("containers", () => {
  beforeEach(() => {
    stop.mockClear();
    s3Images.length = 0;
  });

  it("starts PostgreSQL", async () => {
    const { startPostgres } = await import("../src/containers/postgres.js");
    const handle = await startPostgres();
    expect(handle.connectionUri).toMatch(/^postgres/);
    await handle.stop();
    expect(stop).toHaveBeenCalled();
  });

  it("starts RabbitMQ", async () => {
    const { startRabbitMq } = await import("../src/containers/rabbitmq.js");
    const handle = await startRabbitMq();
    expect(handle.amqpUri).toMatch(/^amqp:/);
    await handle.stop();
  });

  it("starts Redis", async () => {
    const { startRedis } = await import("../src/containers/redis.js");
    const handle = await startRedis();
    expect(handle.url).toMatch(/^redis:/);
    await handle.stop();
  });

  it("starts SeaweedFS S3", async () => {
    const { startS3 } = await import("../src/containers/s3.js");
    const handle = await startS3();
    expect(s3Images).toEqual(["chrislusf/seaweedfs:3.80"]);
    expect(handle.endpoint).toBe("http://127.0.0.1:8333");
    expect(handle.accessKey).toBe("zipframes");
    expect(handle.secretKey).toBe("zipframes-secret");
    expect(handle.region).toBe("us-east-1");
    await handle.stop();
    expect(stop).toHaveBeenCalled();
  });

  it("accepts an S3 image override", async () => {
    const { startS3 } = await import("../src/containers/s3.js");
    await startS3("example.invalid/seaweedfs:test");
    expect(s3Images).toEqual(["example.invalid/seaweedfs:test"]);
  });
});
