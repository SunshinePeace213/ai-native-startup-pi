// macOS and WSL / Windows-from-WSL. The macOS roots (/Users, /System, /Library,
// /Volumes, /private, /opt/homebrew) and the /mnt/<drive> mounts live in
// paths.ts; this file holds the platform tools that reach past what a path
// rule can see.

import type { Rule } from "../types";
import { needsVerb, OB, re, RUN_IT_YOURSELF, SEG, verb } from "./_shared";

export const MACOS_RULES: Rule[] = [
  {
    id: "diskutil-erase",
    family: "macos",
    tier: "deny",
    pattern: re(
      `${verb("diskutil")}${SEG}\\b(?:eraseDisk|eraseVolume|reformat|zeroDisk|randomDisk|secureErase|partitionDisk|resizeVolume` +
        "|apfs\\s+(?:deleteContainer|deleteVolume|eraseVolume)|coreStorage\\s+delete|unmountDisk\\s+force|repairDisk)\\b",
    ),
    title: "diskutil erase / partition / delete volume",
    why: "these erase or repartition a disk or APFS container in place.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^diskutil$/),
  },
  {
    id: "macos-security-off",
    family: "macos",
    tier: "deny",
    pattern: re(
      `(?:${verb("csrutil")}${SEG}\\bdisable\\b|${verb("spctl")}${SEG}--(?:master|global)-disable` +
        `|${verb("nvram")}${SEG}(?:${OB}-c\\b|boot-args)|${verb("bputil")}|${verb("fdesetup")}${SEG}\\bdisable\\b` +
        `|${verb("(?:socketfilterfw|/usr/libexec/ApplicationFirewall/socketfilterfw)")}${SEG}--setglobalstate\\s+off)`,
    ),
    title: "disabling SIP, Gatekeeper, FileVault, or the firewall; clearing NVRAM",
    why: "these strip the OS's own integrity, signing, and encryption protections, or make the Mac unbootable.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^(?:csrutil|spctl|nvram|bputil|fdesetup|socketfilterfw)$/),
  },
  {
    id: "macos-accounts",
    family: "macos",
    tier: "deny",
    pattern: re(
      `(?:${verb("dscl")}${SEG}\\s-(?:delete|passwd)\\b|${verb("sysadminctl")}${SEG}-deleteUser\\b)`,
    ),
    title: "dscl -delete / sysadminctl -deleteUser",
    why: "deleting a macOS account removes its home and its keychain.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^(?:dscl|sysadminctl)$/),
  },
  {
    id: "tmutil-destroy",
    family: "macos",
    tier: "deny",
    pattern: re(
      `${verb("tmutil")}${SEG}\\b(?:delete|deletelocalsnapshots|disable|removedestination|thinlocalsnapshots)\\b`,
    ),
    title: "tmutil delete / disable",
    why: "Time Machine snapshots are the last recovery layer for everything else on this list.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^tmutil$/),
  },
  {
    id: "launchctl-system",
    family: "macos",
    tier: "ask",
    pattern: re(`${verb("launchctl")}${SEG}\\b(?:bootout|unload|remove|disable)\\b`),
    title: "launchctl bootout / unload / remove",
    why: "unloading a daemon or agent stops a service for the whole login session or the system.",
    fix: "Prefer kickstart -k to restart; approve only if the service should stop.",
    refine: needsVerb(/^launchctl$/),
  },
  {
    id: "macos-defaults-delete",
    family: "macos",
    tier: "ask",
    pattern: re(`${verb("defaults")}${SEG}\\bdelete\\b`),
    title: "defaults delete (drop an app's preferences)",
    why: "the preference domain is removed outright; there is no undo.",
    fix: "Export first (defaults export <domain> file.plist), or delete the single key.",
    refine: needsVerb(/^defaults$/),
  },
];

export const WSL_RULES: Rule[] = [
  {
    id: "wsl-unregister",
    family: "wsl",
    tier: "deny",
    pattern: re(
      `(?:${verb("wsl(?:\\.exe)?")}${SEG}(?:--unregister|--shutdown|--uninstall)\\b|${verb("wslconfig(?:\\.exe)?")}${SEG}/u\\b)`,
    ),
    title: "wsl --unregister / --shutdown",
    why: "--unregister deletes the whole distro and every file in it; --shutdown kills every WSL session including this one.",
    fix: "Export first (wsl --export <distro> file.tar); run it from a Windows terminal yourself.",
    refine: needsVerb(/^(?:wsl|wsl\.exe|wslconfig|wslconfig\.exe)$/),
  },
  {
    id: "wsl-terminate",
    family: "wsl",
    tier: "ask",
    pattern: re(`${verb("wsl(?:\\.exe)?")}${SEG}(?:--terminate|${OB}-t)\\b`),
    title: "wsl --terminate <distro>",
    why: "terminating a distro kills every process in it; if it is this one, the session ends here.",
    fix: "Approve only for another distro.",
    refine: needsVerb(/^(?:wsl|wsl\.exe)$/),
  },
  {
    id: "windows-disk",
    family: "wsl",
    tier: "deny",
    pattern: re(
      `(?:${verb("(?:format|format\\.com)")}\\s+[A-Za-z]:|${verb("diskpart(?:\\.exe)?")}` +
        `|\\b(?:Format-Volume|Clear-Disk|Initialize-Disk|Remove-Partition|Reset-PhysicalDisk)\\b` +
        `|${verb("bcdedit(?:\\.exe)?")}|${verb("reg(?:\\.exe)?")}${SEG}\\bdelete\\b${SEG}\\bHK(?:LM|EY_LOCAL_MACHINE)\\b` +
        // a Windows root as the target: C: · C:\ · C:\Windows · C:\Users · /mnt/c · /mnt/c/Windows
        `|${verb("(?:cmd|cmd\\.exe|powershell|powershell\\.exe|pwsh|pwsh\\.exe)")}${SEG}\\b(?:rd|rmdir|del|Remove-Item|rm)\\b${SEG}\\s` +
        "(?:[A-Za-z]:(?:\\\\(?:Windows|Users|Program Files(?: \\(x86\\))?|ProgramData))?\\\\?|/mnt/[A-Za-z](?:/(?:Windows|Users))?/?)(?=\\s|$|[;&|]))",
    ),
    title: "Windows disk format, diskpart, bcdedit, HKLM delete, or a Windows root delete",
    why: "from WSL these reach the Windows side directly: formatting a drive, rewriting boot config, or deleting C:\\ and its roots.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(
      /^(?:format|format\.com|diskpart|diskpart\.exe|bcdedit|bcdedit\.exe|reg|reg\.exe|cmd|cmd\.exe|powershell|powershell\.exe|pwsh|pwsh\.exe)$/,
    ),
  },
  {
    id: "windows-recursive-delete",
    family: "wsl",
    tier: "ask",
    pattern: re(
      `${verb("(?:cmd|cmd\\.exe|powershell|powershell\\.exe|pwsh|pwsh\\.exe)")}${SEG}` +
        "(?:\\b(?:rd|rmdir)\\b[^;&|\\n]*?/[sS]\\b|\\bdel\\b[^;&|\\n]*?/[sS]\\b|\\bRemove-Item\\b[^;&|\\n]*?-(?:Recurse|r)\\b|\\brm\\b[^;&|\\n]*?-r)",
    ),
    title: "Windows-side recursive delete (rd /s, del /s, Remove-Item -Recurse)",
    why: "the guard cannot classify a Windows path the way it classifies a Linux one; the delete is as final as rm -rf.",
    fix: "Delete through the /mnt/<drive> path with rm so the target is classified, or approve if it is meant.",
    refine: needsVerb(/^(?:cmd|cmd\.exe|powershell|powershell\.exe|pwsh|pwsh\.exe)$/),
  },
];
