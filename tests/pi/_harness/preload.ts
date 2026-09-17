// Loaded before every bun test (bunfig.toml). The suite must never reach the
// developer's own Herdr: the theme sync resolves Herdr's config through
// HERDR_CONFIG_PATH, so it is pointed at a path whose directory does not
// exist — the sync then sees "no Herdr" — and the in-pane markers are
// cleared. A test that wants a Herdr injects its own env with a scratch dir.

import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.HERDR_CONFIG_PATH = join(tmpdir(), "pi-tests-have-no-herdr", "config.toml");
delete process.env.HERDR_BIN_PATH;
delete process.env.HERDR_ENV;
delete process.env.HERDR_SOCKET_PATH;
