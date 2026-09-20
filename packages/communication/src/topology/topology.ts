export type ExchangeType = "topic" | "direct" | "fanout" | "headers";

export type ExchangeDefinition = {
  readonly name: string;
  readonly type: ExchangeType;
  readonly durable?: boolean;
};

export type QueueDefinition = {
  readonly name: string;
  readonly durable?: boolean;
  readonly deadLetterExchange?: string;
  readonly deadLetterRoutingKey?: string;
};

export type BindingDefinition = {
  readonly queue: string;
  readonly exchange: string;
  readonly routingKey: string;
};

export type Topology = {
  readonly exchanges: readonly ExchangeDefinition[];
  readonly queues: readonly QueueDefinition[];
  readonly bindings: readonly BindingDefinition[];
};

/**
 * Default ZipFrames topology: one topic exchange for integration events,
 * plus per-consumer queues and a shared DLQ.
 */
export const createDefaultTopology = (options: {
  readonly consumerQueues: readonly {
    readonly name: string;
    readonly routingKeys: readonly string[];
  }[];
  readonly deadLetterExchange?: string;
  readonly deadLetterQueue?: string;
}): Topology => {
  const dlx = options.deadLetterExchange ?? "zipframes.events.dlx";
  const dlq = options.deadLetterQueue ?? "zipframes.events.dlq";

  const exchanges: ExchangeDefinition[] = [
    { name: "zipframes.events", type: "topic", durable: true },
    { name: dlx, type: "topic", durable: true },
  ];

  const queues: QueueDefinition[] = [
    { name: dlq, durable: true },
    ...options.consumerQueues.map((queue) => ({
      name: queue.name,
      durable: true,
      deadLetterExchange: dlx,
      deadLetterRoutingKey: queue.name,
    })),
  ];

  const bindings: BindingDefinition[] = [
    { queue: dlq, exchange: dlx, routingKey: "#" },
    ...options.consumerQueues.flatMap((queue) =>
      queue.routingKeys.map((routingKey) => ({
        queue: queue.name,
        exchange: "zipframes.events",
        routingKey,
      })),
    ),
  ];

  return { exchanges, queues, bindings };
};
