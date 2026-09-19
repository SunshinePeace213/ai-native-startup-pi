// What every action receives: the parameters, the host, the config, Pi's
// context, and the two lookups actions keep needing.

import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

import type { Config } from "../../domain/types";
import type { ArtifactRead } from "../../infra/client/client";
import type { Host } from "../host";
import type { Action, ArtifactParams } from "./schema";

export interface ActionContext {
  action: Action;
  params: ArtifactParams;
  host: Host;
  config: Config;
  ctx: ExtensionContext;
  signal: AbortSignal | undefined;
  /** The slug `url` names, after the server confirms it exists; throws otherwise. */
  need(): Promise<string>;
  /** The artifact behind a slug; throws when it is gone. */
  read(slug: string): Promise<ArtifactRead>;
}

export function createContext(
  base: Pick<ActionContext, "action" | "params" | "host" | "config" | "ctx" | "signal">,
): ActionContext {
  const { action, params, host } = base;
  return {
    ...base,
    async need() {
      await host.start();
      const slug = await host.resolveSlug(params.url);
      if (!slug) {
        throw new Error(
          params.url
            ? `no artifact matches "${params.url}"; action "list" shows them`
            : `action "${action}" needs url`,
        );
      }
      return slug;
    },
    async read(slug) {
      const found = await host.client.get(slug);
      if (!found) throw new Error(`no artifact "${slug}"`);
      return found;
    },
  };
}
