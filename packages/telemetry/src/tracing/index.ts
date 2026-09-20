export {
  initTracing,
  injectContext,
  extractContext,
  injectHttpContext,
  extractHttpContext,
  injectMessageContext,
  extractMessageContext,
  withSpan,
} from "./tracing.js";
export type { Carrier, TracingOptions, TracingHandle } from "./tracing.js";
