// Server-sent events, two audiences: browser tabs watching one artifact
// (reload on a new version, refresh on a comment) and sessions watching the
// project (one PageEvent per message). A page event goes to its artifact's
// owner when that session is connected, else to the longest-connected
// session; it stays pending in the store until a session acknowledges it.

import type { Manifest, PageEvent } from "../shared/types";

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

  /** A tab's stream for one artifact. */
  pageStream(slug: string): Response {
    return this.sse(
      (controller) => {
        const set = this.pageClients.get(slug) ?? new Set();
        set.add(controller);
        this.pageClients.set(slug, set);
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

  broadcastPage(slug: string, payload: Record<string, unknown>): void {
    const set = this.pageClients.get(slug);
    if (!set) return;
    for (const controller of set) if (!this.push(controller, payload)) set.delete(controller);
  }

  routeToSession(event: PageEvent, manifest: Manifest): void {
    const live = this.sessionStreams.filter((s) => {
      try {
        return s.controller.desiredSize !== null;
      } catch {
        return false;
      }
    });
    const target = live.find((s) => s.session === manifest.owner) ?? live[0];
    if (target && !this.push(target.controller, event)) {
      const k = this.sessionStreams.indexOf(target);
      if (k >= 0) this.sessionStreams.splice(k, 1);
    }
  }

  /** Connected session ids, longest-connected first. */
  sessions(): string[] {
    return this.sessionStreams
      .slice()
      .sort((a, b) => a.since - b.since)
      .map((s) => s.session);
  }

  subscriberCount(): number {
    return this.sessionStreams.length;
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
