// Server-sent events, two audiences: browser tabs watching one artifact
// (reload on a new version or reply, refresh on a comment) and sessions
// watching the project (one PageEvent or HeldNotice per message). A page
// event goes to its artifact's owner when that session is connected;
// otherwise it stays pending and every connected session hears that a reply
// is held. Nothing is ever delivered to a session that did not publish.

import { routeEvent } from "../../app/routing";
import type { HeldNotice, Manifest, PageEvent } from "../../domain/types";

type Controller = ReadableStreamDefaultController<Uint8Array>;

interface SessionStream {
  session: string;
  controller: Controller;
  since: number;
}

const HEARTBEAT_MS = 25_000;

export class EventHub {
  private readonly pageClients = new Map<string, Set<Controller>>();
  private readonly sessionStreams: SessionStream[] = [];
  private readonly encoder = new TextEncoder();

  /**
   * A tab's stream for one artifact. The first message names the current
   * version, so a tab that reconnects after a server restart (and missed the
   * broadcast in between) catches up by itself.
   */
  pageStream(slug: string, version: number): Response {
    return this.sse(
      (controller) => {
        const set = this.pageClients.get(slug) ?? new Set();
        set.add(controller);
        this.pageClients.set(slug, set);
        this.push(controller, { type: "hello", version });
      },
      (controller) => this.pageClients.get(slug)?.delete(controller),
    );
  }

  /** A session's stream for the whole project. */
  sessionStream(session: string): Response {
    return this.sse(
      (controller) => this.sessionStreams.push({ session, controller, since: Date.now() }),
      (controller) => {
        const k = this.sessionStreams.findIndex((s) => s.controller === controller);
        if (k >= 0) this.sessionStreams.splice(k, 1);
      },
    );
  }

  /** A session leaving on purpose: its streams are dropped now, not when the socket is noticed dead. */
  detach(session: string): number {
    const mine = this.sessionStreams.filter((s) => s.session === session);
    for (const s of mine) {
      this.close(s.controller);
      const k = this.sessionStreams.indexOf(s);
      if (k >= 0) this.sessionStreams.splice(k, 1);
    }
    return mine.length;
  }

  broadcastPage(slug: string, payload: Record<string, unknown>): void {
    const set = this.pageClients.get(slug);
    if (!set) return;
    for (const controller of set) if (!this.push(controller, payload)) set.delete(controller);
  }

  /** Delivers to the owner, or tells everyone connected that the event is held. */
  routeToSession(event: PageEvent, manifest: Manifest): "delivered" | "held" {
    const live = this.live();
    const route = routeEvent(
      manifest.owner,
      live.map((s) => s.session),
    );
    if (route.kind === "deliver") {
      const target = live.find((s) => s.session === route.session);
      if (target && this.push(target.controller, event)) return "delivered";
    }
    const notice: HeldNotice = {
      kind: "held",
      slug: manifest.slug,
      title: manifest.title,
      owner: manifest.owner,
      pending: manifest.pending.length,
    };
    for (const s of live) this.push(s.controller, notice);
    return "held";
  }

  /** Connected session ids, longest-connected first. */
  sessions(): string[] {
    return this.live()
      .sort((a, b) => a.since - b.since)
      .map((s) => s.session);
  }

  subscriberCount(): number {
    return this.live().length;
  }

  closePage(slug: string): void {
    for (const controller of this.pageClients.get(slug) ?? []) this.close(controller);
    this.pageClients.delete(slug);
  }

  closeAll(): void {
    for (const s of this.sessionStreams) this.close(s.controller);
    for (const set of this.pageClients.values()) for (const c of set) this.close(c);
    this.sessionStreams.length = 0;
    this.pageClients.clear();
  }

  private live(): SessionStream[] {
    return this.sessionStreams.filter((s) => {
      try {
        return s.controller.desiredSize !== null;
      } catch {
        return false;
      }
    });
  }

  private push(controller: Controller, payload: unknown): boolean {
    try {
      controller.enqueue(this.encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      return true;
    } catch {
      return false;
    }
  }

  private close(controller: Controller): void {
    try {
      controller.close();
    } catch {
      // already gone
    }
  }

  private sse(
    start: (controller: Controller) => void,
    cancel: (controller: Controller) => void,
  ): Response {
    const encoder = this.encoder;
    let ref: Controller | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        ref = controller;
        controller.enqueue(encoder.encode(`: connected\n\n`));
        start(controller);
        heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            if (heartbeat) clearInterval(heartbeat);
            cancel(controller);
          }
        }, HEARTBEAT_MS);
      },
      cancel() {
        if (heartbeat) clearInterval(heartbeat);
        if (ref) cancel(ref);
      },
    });
    return new Response(stream, {
      status: 200,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
        connection: "keep-alive",
      },
    });
  }
}
