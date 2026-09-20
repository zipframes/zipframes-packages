import { RabbitMQContainer } from "@testcontainers/rabbitmq";
import type { StartedRabbitMQContainer } from "@testcontainers/rabbitmq";

export type RabbitMqHandle = {
  readonly container: StartedRabbitMQContainer;
  readonly amqpUri: string;
  readonly stop: () => Promise<void>;
};

export const startRabbitMq = async (): Promise<RabbitMqHandle> => {
  const container = await new RabbitMQContainer("rabbitmq:3.13-management-alpine").start();
  return {
    container,
    amqpUri: container.getAmqpUrl(),
    stop: async () => {
      await container.stop();
    },
  };
};
