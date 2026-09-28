export { createDefaultTopology } from "./topology.js";
export type {
  BindingDefinition,
  ExchangeDefinition,
  ExchangeType,
  QueueDefinition,
  Topology,
} from "./topology.js";
export {
  createNotificationConsumerTopology,
  DEFAULT_EXCHANGE,
  DLQ_QUEUE,
  DLX_EXCHANGE,
  NOTIFICATION_QUEUE,
  NOTIFICATION_RETRY_QUEUE,
  NOTIFICATION_ROUTING_KEYS,
} from "./notification.js";
