export type {
  BrokerMessage,
  ConsumeContext,
  ConsumeHandler,
  Consumer,
  MessageHeaders,
  PublishOptions,
  Publisher,
} from "./types.js";

export { computeBackoffMs, decideRetry } from "./retry/index.js";
export type { RetryDecision, RetryOptions } from "./retry/index.js";

export {
  createDefaultTopology,
  createNotificationConsumerTopology,
  DEFAULT_EXCHANGE,
  DLQ_QUEUE,
  DLX_EXCHANGE,
  NOTIFICATION_QUEUE,
  NOTIFICATION_RETRY_QUEUE,
  NOTIFICATION_ROUTING_KEYS,
} from "./topology/index.js";
export type {
  BindingDefinition,
  ExchangeDefinition,
  ExchangeType,
  QueueDefinition,
  Topology,
} from "./topology/index.js";

export { createNotifier } from "./notifier/index.js";
export type {
  Notifier,
  NotifierUserDeletedInput,
  NotifierUserRegisteredInput,
  NotifierUserUpdatedInput,
  NotifierVideoFailedInput,
  NotifierVideoProcessedInput,
} from "./notifier/index.js";

export { createPublisher } from "./publisher/index.js";
export type { PublishPort } from "./publisher/index.js";

export { createConsumer } from "./consumer/index.js";
export type { ConsumerOptions, MessageQueue } from "./consumer/index.js";

export { defineMessageHandler } from "./handler/index.js";
export type {
  MessageContext,
  MessageHandlerConfig,
  MessageHandlerOptions,
  MessageOutcome,
  MessageOutcomeContext,
} from "./handler/index.js";
