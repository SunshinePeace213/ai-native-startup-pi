// Opens a URL in the user's default browser through the platform's opener.
// Failures are reported, never thrown: a page that did not open still has a
// URL the result prints.

export type Exec = (
  command: string,
  args: string[],
  options?: { timeout?: number },
) => Promise<{ code: number; stderr: string }>;

export function makeOpener(exec: Exec, platform: NodeJS.Platform = process.platform) {
  return async (url: string): Promise<string | null> => {
    const [command, args] =
      platform === "darwin"
        ? ["open", [url]]
        : platform === "win32"
          ? ["cmd", ["/c", "start", "", url]]
          : ["xdg-open", [url]];
    try {
      const result = await exec(command, args, { timeout: 10_000 });
      return result.code === 0
        ? null
        : `${command} exited with ${result.code}${result.stderr ? `: ${result.stderr.trim()}` : ""}`;
    } catch (e) {
      return (e as Error).message;
    }
  };
}
