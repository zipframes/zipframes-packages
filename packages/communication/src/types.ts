import type { EventEnvelope } from "@zipframes/schemas/shared";

export type MessageHeaders = Readonly<Record<string, string | undefined>>;

/** Wire message: schemas envelope plus optional transport headers. */
export type BrokerMessage<TPayload = unknown> = {
  readonly envelope: EventEnvelope<TPayload>;
  readonly headers: MessageHeaders;
  readonly routingKey: string;
};

export type PublishOptions = {
  readonly exchange: string;
  readonly routingKey: string;
  readonly headers?: MessageHeaders;
  /** Wait for broker confirm. Defaults to true. */
  readonly confirm?: boolean;
};

export type Publisher = {
  readonly publish: <TPayload>(
    envelope: EventEnvelope<TPayload>,
    options: PublishOptions,
  ) => Promise<void>;
};

export type ConsumeContext = {
  readonly attempt: number;
  readonly redelivered: boolean;
  readonly ack: () => Promise<void>;
  readonly retry: () => Promise<void>;
  readonly deadLetter: () => Promise<void>;
};

export type ConsumeHandler = (message: BrokerMessage, context: ConsumeContext) => Promise<void>;

export type Consumer = {
  readonly start: () => Promise<void>;
  readonly stop: () => Promise<void>;
};
