import type { EventEnvelope } from "@zipframes/schemas/shared";

import type { PublishOptions, Publisher } from "../types.js";

/**
 * Minimal publish port. A broker adapter, such as one connected to RabbitMQ,
 * satisfies this shape.
 */
export type PublishPort = {
  readonly publish: (envelope: EventEnvelope<unknown>, options: PublishOptions) => Promise<void>;
};

export const createPublisher = (broker: PublishPort): Publisher => ({
  publish: (envelope, options) => broker.publish(envelope, options),
});
