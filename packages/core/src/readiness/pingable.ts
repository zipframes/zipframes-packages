/**
 * Something that can answer "are you reachable?" for readiness probes.
 *
 * Keep this separate from business gateways (ISP): use cases never need `ping`.
 */
export interface Pingable {
  readonly ping: () => Promise<void>;
}
