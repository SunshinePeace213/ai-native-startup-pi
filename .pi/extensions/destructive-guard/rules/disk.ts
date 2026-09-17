// Disk, partition, volume, and mount destruction — every rule here is a deny:
// none of it is recoverable, all of it reaches past the workspace, and a human
// who really means it can type it in their own terminal.

import type { Rule } from "../types";
import { BLOCKDEV, needsVerb, OB, re, RUN_IT_YOURSELF, SEG, SEGG, verb } from "./_shared";

export const DISK_RULES: Rule[] = [
  {
    id: "dd-to-block-device",
    family: "disk",
    tier: "deny",
    pattern: re(`${verb("dd")}${SEG}${OB}of=${BLOCKDEV}`),
    title: "dd writing to a raw block device",
    why: "dd onto a disk overwrites partitions and filesystems in place, whatever count= says.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^dd$/),
  },
  {
    id: "mkfs",
    family: "disk",
    tier: "deny",
    pattern: re(`${verb("(?:mkfs(?:\\.[\\w-]+)?|mke2fs|mkswap|newfs(?:_\\w+)?)")}`),
    title: "filesystem creation (mkfs, mke2fs, mkswap, newfs)",
    why: "a fresh filesystem erases every file on its target.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^(?:mkfs(?:\.[\w-]+)?|mke2fs|mkswap|newfs(?:_\w+)?)$/),
  },
  {
    id: "wipe-partition",
    family: "disk",
    tier: "deny",
    pattern: re(
      `(?:${verb("(?:wipefs|blkdiscard)")}` +
        `|${verb("sgdisk")}${SEG}(?:${OB}-[Zzog]\\b|--zap-all|--clear|--delete)` +
        `|${verb("(?:fdisk|sfdisk|cfdisk)")}(?!${SEGG}${OB}-l\\b)(?!${SEGG}--list)` +
        `|${verb("parted")}${SEG}(?:mklabel|mkpart|rm\\b|resizepart)` +
        `|${verb("mdadm")}${SEG}(?:--zero-superblock|--stop|--remove|--fail)` +
        `|${verb("cryptsetup")}${SEG}(?:luksFormat|erase|luksErase|luksRemoveKey|luksKillSlot|reencrypt)` +
        `|${verb("(?:lvremove|vgremove|pvremove|lvreduce|vgreduce)")}` +
        `|${verb("(?:zfs|zpool)")}${SEG}\\bdestroy\\b` +
        `|${verb("btrfs")}${SEG}\\bsubvolume\\s+delete\\b` +
        `|${verb("hdparm")}${SEG}--security-erase)`,
    ),
    title: "partition, volume, or signature wipe",
    why: "these erase partition tables, LVM/ZFS/btrfs volumes, LUKS headers, or discard every block on a device.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(
      /^(?:wipefs|blkdiscard|sgdisk|fdisk|sfdisk|cfdisk|parted|mdadm|cryptsetup|lvremove|vgremove|pvremove|lvreduce|vgreduce|zfs|zpool|btrfs|hdparm)$/,
    ),
  },
  {
    id: "mount-disrupt",
    family: "disk",
    tier: "deny",
    pattern: re(
      `(?:${verb("umount")}${SEG}${OB}-[a-zA-Z]*a` +
        `|${verb("mount")}${SEG}remount\\s*,?\\s*ro${SEG}\\s/(?![\\w.-])` +
        `|${verb("swapoff")}${SEG}${OB}-[a-zA-Z]*a)`,
    ),
    title: "unmount everything, remount / read-only, or disable all swap",
    why: "these pull the filesystem or memory out from under every running process, including this session.",
    fix: RUN_IT_YOURSELF,
    refine: needsVerb(/^(?:umount|mount|swapoff)$/),
  },
];
