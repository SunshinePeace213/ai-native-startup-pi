// The machine itself: resource exhaustion, process termination, power and
// kernel state, services, packages, scheduled tasks, accounts, network, shell
// environment, history and logs.

import type { Rule } from "../types";
import { HOME, needsVerb, OB, re, RUN_IT_YOURSELF, SEG, SEGG, verb } from "./_shared";

const FORK_A = ":\\(\\)\\s*\\{\\s*:\\s*\\|\\s*:\\s*&\\s*\\}\\s*;\\s*:";
const FORK_B = "\\b(\\w+)\\s*\\(\\s*\\)\\s*\\{[^}]*\\b\\1\\b\\s*\\|\\s*\\b\\1\\b[^}]*&[^}]*\\}";
const ESSENTIAL_SERVICE =
  "(?:ssh|sshd|openssh-server|systemd-[\\w-]+|dbus|NetworkManager|networking|network|wpa_supplicant|" +
  "systemd-resolved|resolvconf|cron|crond|docker|containerd|udev|getty@\\w+|display-manager|gdm|lightdm|sddm)";

export const SYSTEM_RULES: Rule[] = [
  // --- Resource exhaustion ---
  {
    id: "fork-bomb",
    family: "process",
    tier: "deny",
    pattern: re(`(?:${FORK_A}|${FORK_B})`),
    title: "fork bomb",
    why: "a self-replicating function spawns processes until the machine runs out of PIDs and memory and must be power-cycled.",
    fix: RUN_IT_YOURSELF,
  },
  {
    id: "unbounded-fill",
    family: "process",
    tier: "deny",
    pattern: re(
      `(?:${verb("cat")}${SEG}${OB}/dev/(?:zero|urandom|random)\\b${SEG}>{1,2}(?!\\s*/dev/null\\b)(?!\\s*/dev/stdout\\b)\\s*` +
        `|${verb("yes")}${SEG}>{1,2}(?!\\s*/dev/null\\b)(?!\\s*/dev/stdout\\b)\\s*` +
        `|${verb("dd")}(?!${SEGG}\\bcount=)(?!${SEGG}\\bof=/dev/null\\b)${SEG}\\bif=/dev/(?:zero|urandom|random)\\b)`,
    ),
    title: "unbounded write from an infinite source",
    why: "streaming /dev/zero or yes into a file fills the filesystem until the machine is unusable.",
    fix: "Bound the write (count= on dd, head -c on a pipe) or send it to /dev/null.",
    refine: needsVerb(/^(?:cat|yes|dd)$/),
  },
  {
    id: "memory-exhaust",
    family: "process",
    tier: "deny",
    pattern: re(
      `(?:${verb("tail")}${SEG}${OB}/dev/zero\\b|\\$\\(\\s*cat\\b[^)]*?/dev/(?:zero|urandom|random)\\b|\\$\\(\\s*yes\\s*\\)` +
        "|`\\s*cat\\b[^`]*?/dev/(?:zero|urandom|random)\\b|`\\s*yes\\s*`)",
    ),
    title: "unbounded read into memory",
    why: "capturing an endless stream grows memory without limit until the process or the box is OOM-killed.",
    fix: "Bound the read (head -c N) instead of capturing an endless stream.",
  },
  // --- Process termination ---
  {
    id: "kill-all",
    family: "process",
    tier: "deny",
    pattern: re(
      // kill with -1 as the TARGET (every process): after `--`, after a signal, or after -s SIG
      `(?:${verb("kill")}${SEG}(?:${OB}--\\s+-1|${OB}-(?:\\d+|[A-Z]+)\\s+-1|${OB}-s\\s+\\w+\\s+-1)(?!\\S)` +
        // SIGKILL aimed at PID 1
        `|${verb("kill")}(?=${SEG}(?:${OB}-9\\b|${OB}-(?:KILL|SIGKILL)\\b|${OB}-s\\s+(?:KILL|SIGKILL|9)\\b))(?=${SEG}(?<![\\w./-])1(?!\\S))` +
        // killall / pkill by user (the whole session) or at the init system
        `|${verb("(?:killall|pkill)")}${SEG}(?:${OB}-u\\s+\\S+|\\b(?:init|systemd|launchd|WindowServer|loginwindow|sshd)\\b))`,
    ),
    title: "kill every process, PID 1, init/launchd, or a user's whole session",
    why: "kill -9 -1, killing PID 1, or killing WindowServer/loginwindow takes down the session or the machine.",
    fix: "Target the specific PID you mean, and prefer the default signal over -9.",
    refine: needsVerb(/^(?:kill|killall|pkill)$/),
  },
  {
    id: "kill-session-host",
    family: "process",
    tier: "ask",
    pattern: re(
      `(?:${verb("(?:killall|pkill)")}${SEG}(?:${OB}-f\\s+)?\\b(?:node|bun|pi|tmux|zellij|screen|code|cursor)\\b` +
        `|${verb("tmux")}${SEG}\\bkill-server\\b)`,
    ),
    title: "killing the process family this session runs in",
    why: "node/bun/pi/tmux are what the agent itself is running under; killing them by name ends this session and every other one.",
    fix: "Find the specific PID (pgrep -af <name>) and kill only that one.",
    refine: needsVerb(/^(?:killall|pkill|tmux)$/),
  },
  // --- Power, kernel, services ---
  {
    id: "power-state",
    family: "system",
    tier: "deny",
    pattern: re(
      `(?:${verb("(?:shutdown|reboot|poweroff|halt)")}|${verb("(?:init|telinit)")}\\s+[06]\\b` +
        `|${verb("systemctl")}${SEG}\\b(?:poweroff|reboot|halt|suspend|hibernate|kexec|emergency|rescue)\\b)`,
    ),
    title: "power-state change",
    why: "stopping or restarting the machine kills this session and every running job.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^(?:shutdown|reboot|poweroff|halt|init|telinit|systemctl)$/),
  },
  {
    id: "kernel-modules",
    family: "system",
    tier: "deny",
    pattern: re(
      `(?:${verb("(?:insmod|rmmod|kextload|kextunload)")}|${verb("modprobe")}${SEG}(?:${OB}-r\\b|--remove\\b))`,
    ),
    title: "loading or unloading a kernel module",
    why: "changing kernel modules alters the running kernel and can crash or compromise the system.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^(?:insmod|rmmod|kextload|kextunload|modprobe)$/),
  },
  {
    id: "kernel-mem",
    family: "system",
    tier: "deny",
    pattern: re(
      `(?:>{1,2}\\s*/dev/k?mem\\b|\\bof=/dev/k?mem\\b|${verb("sysctl")}${SEG}${OB}-w\\b|>{1,2}\\s*/proc/sys(?:rq-trigger|/[^\\s;&|]+))`,
    ),
    title: "writing kernel memory or live tunables",
    why: "raw kernel memory, sysctl -w, and /proc/sys writes corrupt kernel state or trigger sysrq actions.",
    fix: RUN_IT_YOURSELF,
  },
  {
    id: "service-essential",
    family: "system",
    tier: "deny",
    pattern: re(
      `(?:${verb("systemctl")}${SEG}\\b(?:stop|disable|mask|kill)\\b${SEG}\\b${ESSENTIAL_SERVICE}(?:\\.service|\\.socket)?\\b` +
        `|${verb("service")}${SEG}\\b${ESSENTIAL_SERVICE}\\b${SEG}\\bstop\\b)`,
    ),
    title: "stopping, disabling, or masking an essential service",
    why: "ssh, networking, systemd units, dbus, docker, cron: stopping them cuts the box off or breaks the session.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^(?:systemctl|service)$/),
  },
  {
    id: "service-stop",
    family: "system",
    tier: "ask",
    pattern: re(
      `(?:${verb("systemctl")}${SEG}\\b(?:stop|disable|mask|kill)\\b|${verb("service")}${SEG}\\bstop\\b)`,
    ),
    title: "stopping or disabling a service",
    why: "a stopped service affects everything on the machine that depends on it, beyond this workspace.",
    fix: "Prefer restart; approve only if stopping it is the intent.",
    refine: needsVerb(/^(?:systemctl|service)$/),
  },
  {
    id: "package-remove",
    family: "system",
    tier: "ask",
    pattern: re(
      `(?:${verb("(?:apt|apt-get|aptitude)")}${SEG}\\b(?:purge|remove|autoremove|autopurge)\\b` +
        `|${verb("dpkg")}${SEG}${OB}(?:-r|-P|--remove|--purge|--force-\\w+)\\b` +
        `|${verb("(?:dnf|yum|zypper)")}${SEG}\\b(?:remove|erase|autoremove)\\b` +
        `|${verb("pacman")}${SEG}${OB}-R` +
        `|${verb("apk")}${SEG}\\bdel\\b` +
        `|${verb("snap")}${SEG}\\bremove\\b)`,
    ),
    title: "removing a system package",
    why: "package removal is machine-wide and autoremove can pull dependencies other software still needs.",
    fix: "Approve only if the package and everything it drags with it are meant to go.",
    refine: needsVerb(/^(?:apt|apt-get|aptitude|dpkg|dnf|yum|zypper|pacman|apk|snap)$/),
  },
  // --- Cron ---
  {
    id: "crontab-wipe",
    family: "system",
    tier: "deny",
    pattern: re(`${verb("crontab")}${SEG}${OB}-[A-Za-z]*r`),
    title: "crontab -r",
    why: "crontab -r deletes the entire crontab with no confirmation and no undo.",
    fix: "Back up with `crontab -l` first, or edit with `crontab -e`.",
    refine: needsVerb(/^crontab$/),
  },
  // --- Accounts ---
  {
    id: "account-destroy",
    family: "system",
    tier: "deny",
    pattern: re(
      `(?:${verb("(?:userdel|groupdel|deluser|delgroup)")}` +
        `|${verb("passwd")}${SEG}(?:\\broot\\b|${OB}-d\\b|${OB}--delete\\b|${OB}-l\\b)` +
        `|${verb("usermod")}(?=${SEG}(?:${OB}-L\\b|--lock\\b|${OB}-s\\s+/(?:bin|sbin|usr/sbin)/(?:nologin|false)))` +
        `|${verb("chsh")}${SEG}\\s/(?:bin|sbin|usr/sbin)/(?:nologin|false))`,
    ),
    title: "deleting an account, or locking / changing the root or login shell",
    why: "these can lock everyone out of the machine.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^(?:userdel|groupdel|deluser|delgroup|passwd|usermod|chsh)$/),
  },
  {
    id: "privilege-grant",
    family: "system",
    tier: "ask",
    pattern: re(
      `(?:${verb("usermod")}${SEG}${OB}-[a-zA-Z]*G\\b${SEG}\\b(?:sudo|wheel|admin|root|docker)\\b|${verb("visudo")}|${verb("gpasswd")}${SEG}${OB}-a\\b)`,
    ),
    title: "granting a user sudo/admin/docker group membership",
    why: "group membership is a persistent privilege escalation for that account.",
    fix: "Approve only if a permanent privilege change is intended.",
    refine: needsVerb(/^(?:usermod|visudo|gpasswd)$/),
  },
  // --- Network ---
  {
    id: "firewall-flush",
    family: "network",
    tier: "deny",
    pattern: re(
      `(?:${verb("(?:iptables|ip6tables)")}${SEG}(?:${OB}-F\\b|--flush\\b|${OB}-X\\b|${OB}-P\\s+INPUT\\s+DROP\\b)` +
        `|${verb("nft")}${SEG}\\bflush\\s+ruleset\\b|${verb("ufw")}${SEG}\\b(?:disable|reset)\\b` +
        `|${verb("(?:firewall-cmd)")}${SEG}--panic-on|${verb("pfctl")}${SEG}${OB}-[a-zA-Z]*[dF])`,
    ),
    title: "flushing, disabling, or locking down the firewall",
    why: "dropping every rule exposes each listening service at once; a default DROP on INPUT locks you out.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^(?:iptables|ip6tables|nft|ufw|firewall-cmd|pfctl)$/),
  },
  {
    id: "iface-down",
    family: "network",
    tier: "deny",
    pattern: re(
      `(?:${verb("ip")}${SEG}\\blink\\b${SEG}\\bset\\b${SEG}\\bdown\\b|${verb("ifconfig")}${SEG}\\bdown\\b` +
        `|${verb("nmcli")}${SEG}\\b(?:networking|radio)\\s+(?:off|wifi\\s+off)\\b|${verb("networksetup")}${SEG}-setnetworkserviceenabled${SEG}\\boff\\b)`,
    ),
    title: "bringing a network interface down",
    why: "taking an interface down can cut the box off the network — including the connection this session runs over.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^(?:ip|ifconfig|nmcli|networksetup)$/),
  },
  // --- Shell environment ---
  {
    id: "profile-write",
    family: "system",
    tier: "ask",
    pattern: re(
      `(?:>{1,2}\\s*|${OB}tee\\b${SEG}\\s|${verb("sed")}${SEG}${OB}-[a-zA-Z]*i[a-zA-Z]*\\b${SEG}\\s)` +
        `(?:${HOME}/\\.(?:bashrc|bash_profile|bash_login|profile|zshrc|zprofile|zshenv|zlogin|config/fish/config\\.fish)` +
        "|/etc/(?:profile|environment|bash\\.bashrc|zshrc|zprofile))(?![\\w.-])",
    ),
    title: "writing a shell profile or environment file",
    why: "profile writes persist into every future shell, so a bad line sabotages or hijacks later sessions.",
    fix: "Set what you need inline for this call; approve only if a persistent change is intended.",
  },
  {
    id: "ld-preload",
    family: "system",
    tier: "ask",
    pattern: re("\\b(?:LD_PRELOAD|DYLD_INSERT_LIBRARIES)\\s*=\\s*\\S*\\.(?:so|dylib)\\b"),
    title: "LD_PRELOAD / DYLD_INSERT_LIBRARIES injection",
    why: "a preloaded library overrides libc functions in the process — the classic code-injection vector.",
    fix: "Run without the preload; approve only if it is deliberate.",
  },
  // --- History & logs ---
  {
    id: "history-wipe",
    family: "system",
    tier: "ask",
    pattern: re(
      `(?:${verb("history")}${SEG}${OB}-c\\b|${verb("(?:rm|truncate)")}${SEG}${HOME}/\\.(?:bash_history|zsh_history|python_history)(?![\\w.-])` +
        `|>{1,2}\\s*${HOME}/\\.(?:bash_history|zsh_history)(?![\\w.-]))`,
    ),
    title: "wiping shell history",
    why: "clearing history erases the record of what was run — rarely a legitimate build step.",
    fix: "Leave history alone; approve only if the user asked for it.",
  },
  {
    id: "log-wipe",
    family: "system",
    tier: "deny",
    pattern: re(
      `(?:${verb("(?:rm|truncate|shred)")}${SEG}${OB}/(?:var/log|private/var/log)(?:/[^\\s;&|]*)?\\b` +
        `|>{1,2}\\s*/(?:var/log|private/var/log)/[^\\s;&|]+|${verb("journalctl")}${SEG}--(?:vacuum-\\w+|rotate)|${verb("log")}\\s+erase\\b)`,
    ),
    title: "deleting or truncating system logs",
    why: "wiping logs destroys diagnostic and audit records and can hide other damage.",
    fix: RUN_IT_YOURSELF,
  },
];
