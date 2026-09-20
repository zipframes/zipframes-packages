import type { EventEnvelope } from "@zipframes/schemas/shared";

import type { PublishOptions, Publisher } from "../types.js";

/**
 * Minimal publish port. RabbitMQ adapters and the in-memory test broker both
 * satisfy this shape.
 */
export type PublishPort = {
  readonly publish: (envelope: EventEnvelope<unknown>, options: PublishOptions) => Promise<void>;
};

export const createPublisher = (broker: PublishPort): Publisher => ({
  publish: (envelope, options) => broker.publish(envelope, options),
});
