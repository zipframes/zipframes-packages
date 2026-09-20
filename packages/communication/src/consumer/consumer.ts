import { decideRetry } from "../retry/index.js";
import type { RetryOptions } from "../retry/index.js";
import type { InMemoryBroker } from "../publisher/index.js";
import type { BrokerMessage, ConsumeHandler, Consumer } from "../types.js";

export type ConsumerOptions = {
  readonly queue: string;
  readonly retry: RetryOptions;
  readonly deadLetterQueue: string;
  /** Header that carries the delivery attempt count. Defaults to `x-attempt`. */
  readonly attemptHeader?: string;
};

const readAttempt = (message: BrokerMessage, header: string): number => {
  const raw = message.headers[header];
  const parsed = raw === undefined ? Number.NaN : Number(raw);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
};

/**
 * Pull-based consumer over the in-memory broker. Production adapters will
 * wrap amqplib with the same handler contract (ack / retry / deadLetter).
 */
export const createConsumer = (
  broker: InMemoryBroker,
  handler: ConsumeHandler,
  options: ConsumerOptions,
): Consumer => {
  let running = false;
  const attemptHeader = options.attemptHeader ?? "x-attempt";

  const processOne = async (message: BrokerMessage): Promise<void> => {
    const attempt = readAttempt(message, attemptHeader);
    let settled = false;

    const settle = async (action: "ack" | "retry" | "dlq"): Promise<void> => {
      if (settled) {
        return;
      }
      settled = true;
      if (action === "ack") {
        return;
      }
      if (action === "retry") {
        const nextAttempt = attempt + 1;
        if (decideRetry(attempt, options.retry) === "dlq") {
          broker.enqueue(options.deadLetterQueue, message);
          return;
        }
        broker.enqueue(options.queue, {
          ...message,
          headers: { ...message.headers, [attemptHeader]: String(nextAttempt) },
        });
        return;
      }
      broker.enqueue(options.deadLetterQueue, message);
    };

    try {
      await handler(message, {
        attempt,
        redelivered: attempt > 1,
        ack: () => settle("ack"),
        retry: () => settle("retry"),
        deadLetter: () => settle("dlq"),
      });
      if (!settled) {
        await settle("ack");
      }
    } catch {
      await settle("retry");
    }
  };

  return {
    start: async () => {
      running = true;
      while (running) {
        const message = broker.dequeue(options.queue);
        if (message === undefined) {
          break;
        }
        await processOne(message);
      }
    },
    stop: async () => {
      running = false;
    },
  };
};
