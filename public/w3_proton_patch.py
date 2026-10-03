#!/usr/bin/env python3
"""Re-enable DLSS / DLSS-G (and optionally ray tracing) in The Witcher 3 5.0 under Proton/Wine.

The Witcher 3 5.0 ("Remastered", DX12) detects Wine through GetProcAddress(ntdll, "wine_get_version") and then
deliberately skips NVIDIA Streamline (so DLSS SR/RR, DLSS Frame Generation and Reflex are unavailable) and forces
ray tracing / path tracing off. This script flips those checks in bin/x64_dx12/witcher3.exe. It only accepts the
exact builds listed in BUILDS below (5.0.0.1041720 and the 5.00c hotfix 5.0.0.1044392), checked by sha256.

  python3 w3_proton_patch.py [path/to/witcher3.exe]          DLSS SR/RR, Reflex and DLSS-G
  python3 w3_proton_patch.py --rt [path/to/witcher3.exe]     also RT and path tracing (read the README first:
                                                             needs a vkd3d-proton with #3332, or the GPU hangs
                                                             within a minute on NVIDIA 590+)
  python3 w3_proton_patch.py --rt-only [path/to/witcher3.exe] AMD / Intel: RT, path tracing and FSR frame generation,
                                                             without the NVIDIA-only DLSS patches (RADV also needs
                                                             dxil-spirv PR #311 in vkd3d-proton; see the README)
  python3 w3_proton_patch.py --restore [path/to/witcher3.exe] undo every patch (Steam "Verify integrity" also does)
  add --dry-run to only report the current state.

The DLSS patches are NVIDIA only. Unofficial; use at your own risk. Close the game before running it.
"""
import argparse
import hashlib
import os
import shutil
import sys

DEFAULT_PATH = os.path.expanduser(
    "~/.local/share/Steam/steamapps/common/The Witcher 3/bin/x64_dx12/witcher3.exe")

# (file offset, original bytes, patched bytes, description). Per build: the same four checks, found in 1044392 by
# matching the code around each 1041720 site with RIP-relative displacements wildcarded (each matches exactly once,
# and the instructions around it are unchanged).
SL = "create the Streamline manager (slInit) under Wine: DLSS SR/RR, Reflex"
DG = "do not force DLSS-G 'unsupported' on the Wine flag"
WF = "clear the cached Wine flag: RT, path tracing, FSR FG"
AL = "keep buffer alignment as under Wine (only needed on vkd3d-proton older than #3308)"
BUILDS = {
    90832336: {
        "version": "5.0.0.1041720", "steam_build": "25575366",
        "sha256": "c272b2c2e61f84c758e28fab69ab2915944dd1e539dbb435fae9fc67494c7e25",
        "base": [(0x1B709CB, b"\x75\x42", b"\x90\x90", SL), (0x1B759A0, b"\x74", b"\xEB", DG)],
        "rt": [(0x1EE2A53, b"\x75\x0B", b"\x90\x90", WF), (0x1EE09F7, b"\x75", b"\xEB", AL)],
        # Applied by earlier versions of --rt. Not needed with vkd3d-proton #3332 and no longer applied, but still
        # recognised so that --restore undoes it.
        "legacy": [(0x106E0D, b"\x20\x00\x00\x00", b"\x00\x01\x00\x00",
                    "(old --rt, no longer applied) RT BLAS scratch 32 -> 256 MiB")],
    },
    90674640: {
        "version": "5.0.0.1044392", "steam_build": "25646871",
        "sha256": "9406eccc12b68e08920931442ef6a57340e910d3e01f2082e88232487433fe51",
        "base": [(0x1B7169B, b"\x75\x42", b"\x90\x90", SL), (0x1B76620, b"\x74", b"\xEB", DG)],
        "rt": [(0x1EDE8F3, b"\x75\x0B", b"\x90\x90", WF), (0x1EDC897, b"\x75", b"\xEB", AL)],
        "legacy": [],
    },
}


def has_nvidia_gpu():
    try:
        return any(open(os.path.join("/sys/class/drm", d, "device/vendor")).read().strip() == "0x10de"
                   for d in os.listdir("/sys/class/drm") if d.startswith("card") and "-" not in d)
    except OSError:
        return True  # cannot tell; do not warn


def state_of(data, patch):
    off, orig, new, _ = patch
    cur = data[off:off + len(orig)]
    return "original" if cur == orig else "patched" if cur == new else "unknown"


def main():
    ap = argparse.ArgumentParser(
        description="Re-enable DLSS / DLSS-G (and optionally RT) in The Witcher 3 5.0 under Proton/Wine.")
    ap.add_argument("exe", nargs="?", default=DEFAULT_PATH)
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--rt", action="store_true", help="also enable ray tracing and path tracing")
    mode.add_argument("--rt-only", action="store_true",
                      help="AMD / Intel: RT, path tracing and FSR frame generation without the DLSS patches")
    mode.add_argument("--restore", action="store_true", help="revert every patch")
    ap.add_argument("--dry-run", action="store_true", help="report only, change nothing")
    args = ap.parse_args()

    path = args.exe
    if not os.path.isfile(path):
        sys.exit(f"not found: {path}")
    data = bytearray(open(path, "rb").read())
    build = BUILDS.get(len(data))
    if build is None:
        sys.exit(f"unexpected size {len(data)}: this script supports witcher3.exe (DX12) "
                 + ", ".join(b["version"] for b in BUILDS.values()) + "; a newer game update needs a script update")
    BASE, RT, LEGACY = build["base"], build["rt"], build["legacy"]
    ALL = BASE + RT + LEGACY
    version = build["version"]

    states = [state_of(data, p) for p in ALL]
    if "unknown" in states:
        sys.exit("unexpected bytes at a patch site: different build or modified exe; nothing changed")

    # Rebuild the original image in memory and check it is exactly the supported build.
    orig = bytearray(data)
    for off, o, _, _ in ALL:
        orig[off:off + len(o)] = o
    if hashlib.sha256(orig).hexdigest() != build["sha256"]:
        sys.exit(f"sha256 mismatch: not witcher3.exe {version} (DX12); nothing changed")
    print(f"witcher3.exe {version} (Steam build {build['steam_build']})")

    print("current state:")
    for p, s in zip(ALL, states):
        print(f"  0x{p[0]:07X}  {s:8}  {p[3]}")

    if not args.restore and not args.rt_only and not has_nvidia_gpu():
        print("WARNING: no NVIDIA GPU found. The DLSS patches are for NVIDIA; on AMD or Intel use --rt-only "
              "(RT and FSR frame generation). See README.")

    if args.restore:
        target = bytes(orig)
    elif args.rt or args.rt_only:
        # Exactly the chosen set, from the original: --rt-only takes out DLSS patches from an earlier run, and both
        # take out the old scratch patch an earlier --rt applied.
        target = bytearray(orig)
        for off, _, new, _ in (RT if args.rt_only else BASE + RT):
            target[off:off + len(new)] = new
        target = bytes(target)
    else:
        target = bytearray(data)
        for off, _, new, _ in BASE:
            target[off:off + len(new)] = new
        target = bytes(target)

    if target == bytes(data):
        print("nothing to do")
        return
    if args.dry_run:
        print("dry run: would write changes")
        return

    backup = path + ".orig-" + version
    if not os.path.exists(backup):
        with open(backup, "wb") as f:
            f.write(bytes(orig))
        print(f"backup of the original: {backup}")
    tmp = path + ".tmp-patch"
    with open(tmp, "wb") as f:
        f.write(target)
    shutil.copymode(path, tmp)
    os.replace(tmp, path)
    if args.restore:
        print("restored the original")
    elif args.rt_only:
        print("patched: RT/path tracing and FSR frame generation only (no DLSS patches)")
    else:
        print("patched: DLSS/DLSS-G" + (" + RT/path tracing" if args.rt else ""))
    if args.rt or args.rt_only:
        print("WARNING: RT under Proton needs a recent vkd3d-proton: with #3332 on NVIDIA 590+ (or the GPU hangs), "
              "and on AMD (RADV) also with dxil-spirv PR #311 (or the game crashes while loading). See README.")


if __name__ == "__main__":
    main()
