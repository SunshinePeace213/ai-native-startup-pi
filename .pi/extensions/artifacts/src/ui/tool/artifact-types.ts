// Artifact types, as a project keeps them: a folder .pi/artifact-types/<name>/
// holding `type.json` ({title, description}), the type's page `index.html`, and
// whatever files that page loads. An artifact made from a type gets all of it
// as its first version and keeps it read-only; what the agent adds later are
// the artifact's own files. Claude Code's types are pages hosted on claude.ai;
// these are the project's own, and none ships with the extension. Read on the
// pi side, like everything else the model names inside the project.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { type FileChange, isRefusal, planFiles, RESERVED_PATHS } from "../../domain/files";
import type { FileUpload } from "../../domain/types";
import { insideProject } from "./files";

export const TYPES_DIR = ".pi/artifact-types";
const DESCRIPTOR = "type.json";
const PAGE = RESERVED_PATHS[0] as string;
/** A type's name is its folder's: lowercase letters, digits and hyphens. */
const NAME_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

export interface ArtifactType {
  name: string;
  title: string;
  description: string;
}

/** A type as a publish needs it: its page, and its files encoded for the wire. */
export interface LoadedType {
  type: ArtifactType;
  source: string;
  files: Record<string, FileUpload>;
}

function describe(cwd: string, name: string): ArtifactType {
  const folder = join(TYPES_DIR, name);
  if (!NAME_RE.test(name) || !existsSync(join(cwd, folder, DESCRIPTOR))) {
    throw new Error(
      `no artifact type "${name}" in ${TYPES_DIR}; action "list" with scope "types" shows the ones this project has`,
    );
  }
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(insideProject(cwd, join(folder, DESCRIPTOR)).real, "utf8"));
  } catch (e) {
    if (e instanceof SyntaxError) throw new Error(`${folder}/${DESCRIPTOR} is not JSON`);
    throw e;
  }
  const told = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  if (typeof told.title !== "string" || !told.title.trim())
    throw new Error(`${folder}/${DESCRIPTOR} needs a title`);
  if (!existsSync(join(cwd, folder, PAGE)))
    throw new Error(`${folder} has no ${PAGE}: a type is its page`);
  return {
    name,
    title: told.title.trim(),
    description: typeof told.description === "string" ? told.description.trim() : "",
  };
}

/** The types this project has, by name; a folder that is not a whole type is not one. */
export function listTypes(cwd: string): ArtifactType[] {
  const dir = join(cwd, TYPES_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .flatMap((name) => {
      try {
        return [describe(cwd, name)];
      } catch {
        return [];
      }
    });
}

/** Every file under a type's folder but its descriptor, its page and dotfiles, by its path inside the folder. */
function filesUnder(folder: string, prefix = ""): string[] {
  return readdirSync(folder, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .flatMap((entry) => {
      const path = `${prefix}${entry.name}`;
      if (statSync(join(folder, entry.name)).isDirectory())
        return filesUnder(join(folder, entry.name), `${path}/`);
      return path === DESCRIPTOR || path === PAGE ? [] : [path];
    });
}

/** Reads a type whole. Its files meet the rules every published file meets, and none may lead out of the project. */
export function loadType(cwd: string, name: string): LoadedType {
  const type = describe(cwd, name);
  const folder = join(TYPES_DIR, name);
  const sources = new Map<string, string>();
  const changes: Record<string, FileChange> = {};
  for (const path of filesUnder(join(cwd, folder))) {
    const { real } = insideProject(cwd, join(folder, path));
    sources.set(path, real);
    changes[path] = { bytes: statSync(real).size };
  }
  const plan = planFiles({}, changes);
  if (isRefusal(plan)) throw new Error(`the type "${name}" cannot be published: ${plan.message}`);
  return {
    type,
    source: readFileSync(insideProject(cwd, join(folder, PAGE)).real, "utf8"),
    files: Object.fromEntries(
      [...sources].map(([path, real]) => [path, { base64: readFileSync(real).toString("base64") }]),
    ),
  };
}
