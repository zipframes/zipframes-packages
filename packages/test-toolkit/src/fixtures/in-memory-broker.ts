import type { EventEnvelope } from "@zipframes/schemas/shared";
import type {
  BrokerMessage,
  MessageHeaders,
  PublishOptions,
  Topology,
} from "@zipframes/communication";

export type InMemoryBroker = {
  readonly published: BrokerMessage[];
  readonly queues: Map<string, BrokerMessage[]>;
  readonly assertTopology: (topology: Topology) => Promise<void>;
  readonly publish: (envelope: EventEnvelope<unknown>, options: PublishOptions) => Promise<void>;
  readonly enqueue: (queue: string, message: BrokerMessage) => void;
  readonly dequeue: (queue: string) => BrokerMessage | undefined;
};

/**
 * In-process broker for unit tests. Services wire the same Publisher/Consumer
 * APIs they will use with RabbitMQ.
 */
export const createInMemoryBroker = (): InMemoryBroker => {
  const published: BrokerMessage[] = [];
  const queues = new Map<string, BrokerMessage[]>();
  const bindings: { queue: string; exchange: string; routingKey: string }[] = [];

  const matches = (pattern: string, routingKey: string): boolean => {
    if (pattern === "#") {
      return true;
    }
    const patternParts = pattern.split(".");
    const keyParts = routingKey.split(".");
    if (patternParts.length !== keyParts.length) {
      return pattern.includes("#");
    }
    return patternParts.every((part, index) => part === "*" || part === keyParts[index]);
  };

  return {
    published,
    queues,
    assertTopology: async (topology) => {
      for (const queue of topology.queues) {
        if (!queues.has(queue.name)) {
          queues.set(queue.name, []);
        }
      }
      bindings.length = 0;
      bindings.push(...topology.bindings);
    },
    publish: async (envelope, options) => {
      const headers: MessageHeaders = options.headers ?? {};
      const message: BrokerMessage = {
        envelope,
        headers,
        routingKey: options.routingKey,
      };
      published.push(message);

      for (const binding of bindings) {
        if (
          binding.exchange === options.exchange &&
          matches(binding.routingKey, options.routingKey)
        ) {
          const queue = queues.get(binding.queue) ?? [];
          queue.push(message);
          queues.set(binding.queue, queue);
        }
      }
    },
    enqueue: (queue, message) => {
      const current = queues.get(queue) ?? [];
      current.push(message);
      queues.set(queue, current);
    },
    dequeue: (queue) => {
      const current = queues.get(queue);
      return current?.shift();
    },
  };
};
