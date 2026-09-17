// The shapes the two catalogs share. Catalogs are plain data; the matchers under
// ../match compile them. Nothing here touches the filesystem.

/** One family of secret-bearing files. Any tool access to a match is denied. */
export interface SensitiveCategory {
  id: string;
  /** Human label named in the denial, e.g. "SSH & auth keys". */
  label: string;
  /**
   * The redirect line of the denial: what to do instead. Empty for the `env`
   * category, whose line is computed from the template that exists on disk.
   */
  guidance: string;
  /**
   * fnmatch-style patterns (`*`, `?`) matched case-insensitively against a
   * path's basename: `.env`, `*.pem`, `id_rsa*`.
   */
  basenames: readonly string[];
  /**
   * Slash-bounded fragments of the normalized absolute path, so `/.aws/` never
   * matches `/.awsome/`. A trailing `/` marks a directory: the directory itself
   * and everything below it match. Without one the fragment names a file:
   * `/etc/shadow` matches that file, never `/etc/shadowy`.
   */
  fragments: readonly string[];
}

/** One compiled sensitive rule: the pattern plus the category it came from. */
export interface SensitiveRule {
  category: SensitiveCategory;
  kind: "basename" | "fragment";
  pattern: string;
}

/** One family of vendored or generated paths. Content mutation of a match is denied. */
export interface VendoredEntry {
  id: string;
  /** Completes "… is inside <segment>, <label>". */
  label: string;
  /** The redirect line of the denial. */
  guidance: string;
  /**
   * Directory names, matched exactly (or by `*`/`?` glob) against every path
   * segment. A match on the last segment counts unless that path exists and is
   * a regular file, so a script named `build` beside a `build/` output dir is
   * still editable.
   */
  dirs: readonly string[];
  /** File basenames, matched exactly against the last segment. */
  files: readonly string[];
  /**
   * Whether removing or moving the protected node as a whole is a regeneration
   * step (`rm -rf dist`, `mv node_modules ~/.Trash/x`) rather than tampering.
   * Content mutation and anything inside the node stay denied either way.
   */
  removable: boolean;
}

/** Where a matched vendored path sits relative to the protected node. */
export interface VendoredMatch {
  entry: VendoredEntry;
  /** The segment or basename that matched, for the denial text. */
  segment: string;
  /** True when the path is the protected node itself, not something inside it. */
  atRoot: boolean;
}
