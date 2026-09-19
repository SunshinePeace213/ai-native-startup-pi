// Two decisions, both pure.
//
// Server side — which session a page event reaches: the artifact's owner
// when it is connected, otherwise nobody; the event stays pending and every
// connected session is told a reply is held. No session is ever woken by a
// page it did not publish.
//
// Session side — what a delivered event becomes in this session: the answer
// to a blocked `ask`, a wake, a queued notice, or a held event when the
// artifact is unwatched or the hourly cap is reached.

import type { Config, PageEvent } from "../domain/types";

export type Route = { kind: "deliver"; session: string } | { kind: "hold" };

export function routeEvent(owner: string, connected: readonly string[]): Route {
  return connected.includes(owner) ? { kind: "deliver", session: owner } : { kind: "hold" };
}

export type DeliveryDecision =
  | { kind: "answer" }
  | { kind: "wake" }
  | { kind: "notify" }
  | { kind: "silent"; reason: "unwatched" }
  | { kind: "capped"; cap: number };

export interface DeliveryInput {
  event: PageEvent;
  config: Pick<Config, "delivery" | "wakesPerHour">;
  /** A blocked `ask` is waiting on this slug. */
  waiting: boolean;
  wakesThisHour: number;
}

export function decideDelivery(input: DeliveryInput): DeliveryDecision {
  const { event, config } = input;
  if (input.waiting && event.kind === "response") return { kind: "answer" };
  if (!event.watched) return { kind: "silent", reason: "unwatched" };
  if (input.wakesThisHour >= config.wakesPerHour)
    return { kind: "capped", cap: config.wakesPerHour };
  return config.delivery === "wake" ? { kind: "wake" } : { kind: "notify" };
}
