#!/usr/bin/env bash
# Wolfsgate — CachyOS / Steam package for The Witcher 3: Wild Hunt — Remastered.
# Installs Proton Wineland 11.0-20260930, which hides Wine from witcher3.exe
# and carries the vkd3d-proton fixes ray tracing and path tracing need.
# The game executable is not modified. Fully removable.
#
# Community Proton build: https://github.com/nanomatters/proton-cachyos/releases/tag/wineland-11.0-20260930
# Why the options are missing: the remaster calls wine_get_version and then
# skips Streamline (DLSS) and zeroes ray tracing. This is not a DRM crack.
set -euo pipefail

GPU="__DEFAULT_GPU__"
MACHINE="__DEFAULT_MACHINE__"
CPU="__DEFAULT_CPU__"
STEAM_KIND="__DEFAULT_STEAM__"
YES=0
DRY=0
PIN=__DEFAULT_PIN__
ACTION="install"

TAG="wineland-11.0-20260930"
APPID="292030"

usage() {
  cat <<'EOF'
Wolfsgate — unlock DLSS, ray tracing, and path tracing in The Witcher 3 Remastered.

Usage:
  bash wolfsgate-cachyos.sh --yes
  bash wolfsgate-cachyos.sh --dry-run
  bash wolfsgate-cachyos.sh --remove
  bash wolfsgate-cachyos.sh --pin-only

Options:
  --gpu nvidia|amd|intel     What to print for Steam launch options
  --machine desktop|hybrid   Hybrid hides the integrated GPU from the game
  --cpu v3|baseline          v3 is the CachyOS default (AVX2). baseline if the CPU lacks it
  --steam native|flatpak     Which Steam client receives the Proton build
  --yes                      Do not ask before downloading
  --dry-run                  Print the plan only
  --pin                      Select this Proton for app 292030 (Steam must be quit)
  --no-pin                   Do not edit Steam's config
  --pin-only                 Only select an already installed Wolfsgate Proton
  --remove                   Delete Proton builds this script installed
  -h, --help                 This help

The download is about 360 MB and needs about 2 GB free. Quit Steam completely
(including the tray icon) before --pin, and restart Steam afterwards.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --gpu) GPU="${2:-}"; shift 2 ;;
    --machine) MACHINE="${2:-}"; shift 2 ;;
    --cpu) CPU="${2:-}"; shift 2 ;;
    --steam) STEAM_KIND="${2:-}"; shift 2 ;;
    --yes|-y) YES=1; shift ;;
    --dry-run) DRY=1; shift ;;
    --pin) PIN=1; shift ;;
    --no-pin) PIN=0; shift ;;
    --pin-only) ACTION="pin"; shift ;;
    --remove) ACTION="remove"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

case "$GPU" in
  nvidia|amd|intel) ;;
  *) echo "GPU must be nvidia, amd, or intel." >&2; exit 2 ;;
esac
case "$MACHINE" in
  desktop|hybrid) ;;
  *) echo "Machine must be desktop or hybrid." >&2; exit 2 ;;
esac
case "$CPU" in
  v3|baseline) ;;
  *) echo "CPU must be v3 or baseline." >&2; exit 2 ;;
esac
case "$STEAM_KIND" in
  native|flatpak) ;;
  *) echo "Steam must be native or flatpak." >&2; exit 2 ;;
esac

say() { printf '== %s\n' "$*"; }
warn() { printf '!! %s\n' "$*" >&2; }

confirm() {
  local prompt="$1"
  if [[ "$YES" -eq 1 || "$DRY" -eq 1 ]]; then
    return 0
  fi
  if [[ ! -t 0 ]]; then
    warn "No terminal to confirm. Re-run with --yes."
    exit 1
  fi
  local ans
  read -r -p "$prompt [y/N] " ans
  [[ "$ans" == "y" || "$ans" == "Y" ]]
}

need() {
  local c
  for c in "$@"; do
    command -v "$c" >/dev/null 2>&1 || { warn "Missing command: $c"; exit 1; }
  done
}

launch_line() {
  local line=""
  case "$GPU" in
    nvidia) line="PROTON_ENABLE_NVAPI=1" ;;
    amd|intel) line="PROTON_DISABLE_NVAPI=1" ;;
  esac
  if [[ "$MACHINE" == "hybrid" && "$GPU" == "nvidia" ]]; then
    line="$line VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json __NV_PRIME_RENDER_OFFLOAD=1 __VK_LAYER_NV_optimus=NVIDIA_only"
  elif [[ "$MACHINE" == "hybrid" && "$GPU" == "amd" ]]; then
    line="$line VK_DRIVER_FILES=/usr/share/vulkan/icd.d/radeon_icd.json VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/radeon_icd.json"
  elif [[ "$MACHINE" == "hybrid" && "$GPU" == "intel" ]]; then
    line="$line VK_DRIVER_FILES=/usr/share/vulkan/icd.d/intel_icd.json"
  fi
  printf '%s %%command%%\n' "$line"
}

record_file() {
  printf '%s\n' "$HOME/.config/wolfsgate/installs.tsv"
}

record_add() {
  local dest="$1" key="$2" file
  file="$(record_file)"
  mkdir -p "$(dirname "$file")"
  [[ -f "$file" ]] || : >"$file"
  local tmp
  tmp="$(mktemp)"
  awk -F '\t' -v d="$dest" '$1 != d { print }' "$file" >"$tmp"
  printf '%s\t%s\n' "$dest" "$key" >>"$tmp"
  mv "$tmp" "$file"
}

record_rows() {
  local file
  file="$(record_file)"
  [[ -f "$file" ]] || return 0
  awk -F '\t' 'NF >= 2 { print }' "$file"
}

resolve_clients() {
  local -a candidates=()
  if [[ "$STEAM_KIND" == "native" ]]; then
    candidates+=("$HOME/.local/share/Steam" "$HOME/.steam/root" "$HOME/.steam/steam")
  else
    candidates+=(
      "$HOME/.var/app/com.valvesoftware.Steam/.local/share/Steam"
      "$HOME/.var/app/com.valvesoftware.Steam/data/Steam"
    )
  fi
  declare -A seen=()
  CLIENTS=()
  local c real
  for c in "${candidates[@]}"; do
    [[ -d "$c" ]] || continue
    real="$(realpath -m "$c")"
    [[ -n "${seen[$real]:-}" ]] && continue
    if [[ -d "$real/steamapps" || -d "$real/config" || -d "$real/ubuntu12_32" || -f "$real/steam.sh" ]]; then
      seen[$real]=1
      CLIENTS+=("$real")
    fi
  done
}

pick_client() {
  resolve_clients
  if [[ "${#CLIENTS[@]}" -eq 0 ]]; then
    if [[ "$STEAM_KIND" == "flatpak" ]]; then
      warn "Flatpak Steam was not found under ~/.var/app/com.valvesoftware.Steam."
      warn "Install com.valvesoftware.Steam and start it once, or switch Wolfsgate to native Steam."
    else
      warn "Native Steam was not found under ~/.local/share/Steam."
      warn "Install the steam package, start it once, or switch Wolfsgate to Flatpak."
    fi
    exit 1
  fi
  CLIENT="${CLIENTS[0]}"
}

steam_running() {
  pgrep -x steam >/dev/null 2>&1 && return 0
  pgrep -f 'com\.valvesoftware\.Steam' >/dev/null 2>&1 && return 0
  return 1
}

tool_key_from() {
  local vdf="$1"
  python3 - "$vdf" <<'PY'
import re, sys
text = open(sys.argv[1], errors="replace").read()
m = re.search(r'"compat_tools"\s*\{\s*"([^"]+)"', text)
if not m:
    sys.exit("compatibilitytool.vdf has no compat_tools entry")
key = m.group(1)
if not re.fullmatch(r"[A-Za-z0-9._+-]+", key):
    sys.exit("refusing unexpected Proton tool id: " + key)
print(key)
PY
}

display_name_from() {
  local vdf="$1"
  python3 - "$vdf" <<'PY'
import re, sys
text = open(sys.argv[1], errors="replace").read()
m = re.search(r'"display_name"\s+"([^"]*)"', text)
print(m.group(1) if m else "")
PY
}

inspect_game() {
  python3 - "$CLIENT" "$APPID" <<'PY'
import hashlib, os, re, sys
client, appid = sys.argv[1], sys.argv[2]
known = {
    "c272b2c2e61f84c758e28fab69ab2915944dd1e539dbb435fae9fc67494c7e25": "5.0.0.1041720 (Remastered, Steam 25575366)",
    "9406eccc12b68e08920931442ef6a57340e910d3e01f2082e88232487433fe51": "5.0.0.1044392 (5.00c hotfix, Steam 25646871)",
}
vdfs = [
    os.path.join(client, "steamapps", "libraryfolders.vdf"),
    os.path.join(client, "config", "libraryfolders.vdf"),
]
cands = [os.path.join(client, "steamapps", "common", "The Witcher 3", "bin", "x64_dx12", "witcher3.exe")]
for vdf in vdfs:
    if not os.path.isfile(vdf):
        continue
    text = open(vdf, errors="replace").read()
    parts = re.split(r'"path"\s+"([^"]+)"', text)
    for i in range(1, len(parts), 2):
        lib, body = parts[i], parts[i + 1] if i + 1 < len(parts) else ""
        exe = os.path.join(lib, "steamapps", "common", "The Witcher 3", "bin", "x64_dx12", "witcher3.exe")
        if appid in body:
            cands.insert(0, exe)
        else:
            cands.append(exe)
seen = set()
for exe in cands:
    if exe in seen:
        continue
    seen.add(exe)
    if os.path.isfile(exe):
        digest = hashlib.sha256(open(exe, "rb").read()).hexdigest()
        label = known.get(digest, "not a pinned build")
        print(exe)
        print(digest)
        print(label)
        sys.exit(0)
sys.exit(0)
PY
}

pin_tool() {
  local key="$1"
  local cfg="$CLIENT/config/config.vdf"
  if [[ ! -f "$cfg" ]]; then
    warn "No $cfg yet. Start Steam once, quit it, then re-run with --pin-only."
    return 1
  fi
  if steam_running; then
    warn "Steam is running. Quit it fully (tray icon too), then re-run:"
    warn "  bash wolfsgate-cachyos.sh --pin-only"
    return 1
  fi
  if [[ "$DRY" -eq 1 ]]; then
    say "Would select Proton '$key' for app $APPID in $cfg"
    return 0
  fi
  python3 - "$cfg" "$key" "$APPID" <<'PY'
import re, shutil, sys
path, tool, appid = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(path, encoding="utf-8", errors="replace").read()
if '"CompatToolMapping"' not in text:
    sys.exit("config.vdf has no CompatToolMapping; pick the Proton inside Steam instead")
backup = path + ".wolfsgate.bak"
shutil.copy2(path, backup)
pat = re.compile(r'("' + re.escape(appid) + r'"\s*\{\s*"name"\s*)"[^"]*"')
if pat.search(text):
    text = pat.sub(lambda m: m.group(1) + '"' + tool + '"', text, count=1)
else:
    insert = (
        '\n\t\t"' + appid + '"\n\t\t{\n\t\t\t"name"\t\t"' + tool + '"'
        '\n\t\t\t"config"\t\t""\n\t\t\t"priority"\t\t"250"\n\t\t}'
    )
    text2, n = re.subn(r'("CompatToolMapping"\s*\{)', lambda m: m.group(1) + insert, text, count=1)
    if n != 1:
        sys.exit("could not insert CompatToolMapping; pick the Proton inside Steam")
    text = text2
open(path, "w", encoding="utf-8").write(text)
print(backup)
PY
  say "Selected the Proton for The Witcher 3. Backup: ${cfg}.wolfsgate.bak"
}

print_after() {
  local key="$1"
  local shown="$2"
  cat <<EOF

Next:
  1. Quit Steam completely, including the tray icon, then open it again.
  2. The Witcher 3 → Properties → Compatibility.
  3. Enable "Force the use of a specific Steam Play compatibility tool".
  4. Choose: ${shown}
     (internal id ${key})
  5. Launch options, only if you need them:
     $(launch_line)
  6. In game: Options → Graphics. Pick DLSS on NVIDIA, or FSR on AMD.
     Turn on ray tracing or path tracing after the game lists them.
     Presets turn HairWorks back off — set that after the preset.
     Path-traced hair stays unavailable under Proton.

Desktop NVIDIA usually needs no launch options with this Proton.
A laptop with an iGPU should paste the launch options above, or the
remaster can lock itself to the low preset and hide ray tracing again.

This did not change witcher3.exe. A later game update will not undo it.
Remove with: bash wolfsgate-cachyos.sh --remove
EOF
}

archive_for_cpu() {
  if [[ "$CPU" == "v3" ]]; then
    ARCHIVE="proton-wineland-11.0-20260930-x86_64_v3.tar.xz"
    SHA="85cb18030a352fdd36f6d85c6f425a48c87620cddb14946ba1da04ff92de4aa69dadf29c43631d586563f13832c48334fe8f9ecac69bf77f815f346615847d3e"
  else
    ARCHIVE="proton-wineland-11.0-20260930-x86_64.tar.xz"
    SHA="e54a4c5dd2485e285eda91fc07eea6358ced549c38b08d60df994752bbd0940314a99b1dab28d1a71bd1fb8b7a23653d8d8873720b6a653de2a820772b347655"
  fi
  URL="https://github.com/nanomatters/proton-cachyos/releases/download/${TAG}/${ARCHIVE}"
}

do_remove() {
  local row dest
  local any=0
  while IFS=$'\t' read -r dest _; do
    [[ -n "${dest:-}" ]] || continue
    case "$dest" in
      */compatibilitytools.d/*) ;;
      *) warn "Refusing to delete unexpected path: $dest"; continue ;;
    esac
    any=1
    if [[ -d "$dest" && -f "$dest/compatibilitytool.vdf" ]]; then
      say "Removing $dest"
      if [[ "$DRY" -eq 0 ]]; then
        rm -rf "$dest"
      fi
    else
      warn "Already gone: $dest"
    fi
  done < <(record_rows || true)
  if [[ "$any" -eq 0 ]]; then
    warn "Wolfsgate has no recorded Proton install to remove."
    exit 1
  fi
  if [[ "$DRY" -eq 0 ]]; then
    rm -f "$(record_file)"
  fi
  say "Removed. In Steam, set The Witcher 3 back to Proton Experimental or proton-cachyos."
}

do_pin_only() {
  pick_client
  local row dest key
  row="$(record_rows | tail -n 1 || true)"
  if [[ -z "$row" ]]; then
    warn "Nothing installed yet. Run bash wolfsgate-cachyos.sh --yes first."
    exit 1
  fi
  dest="${row%%$'\t'*}"
  key="${row#*$'\t'}"
  if [[ ! -f "$dest/compatibilitytool.vdf" ]]; then
    warn "Recorded Proton is missing: $dest"
    exit 1
  fi
  key="$(tool_key_from "$dest/compatibilitytool.vdf")"
  pin_tool "$key"
}

do_install() {
  need curl tar sha512sum python3 realpath awk
  pick_client
  archive_for_cpu
  local compat="$CLIENT/compatibilitytools.d"
  say "Steam client: $CLIENT"
  say "Proton: $ARCHIVE"
  say "Installs to: $compat"

  local game_info exe digest label
  game_info="$(inspect_game || true)"
  if [[ -n "$game_info" ]]; then
    exe="$(printf '%s\n' "$game_info" | sed -n '1p')"
    digest="$(printf '%s\n' "$game_info" | sed -n '2p')"
    label="$(printf '%s\n' "$game_info" | sed -n '3p')"
    say "Game: $exe"
    say "Build: $label"
    if [[ "$label" == "not a pinned build" ]]; then
      warn "This exe hash is not 5.0.0.1041720 or 5.00c ($digest)."
      warn "Wineland can still hide Wine. Do not byte-patch an unknown build."
    fi
  else
    warn "The Witcher 3 is not installed in this Steam yet. The Proton build will still be installed."
  fi

  if ! confirm "Download Proton Wineland (~360 MB) and install it for Steam?"; then
    say "Cancelled."
    exit 0
  fi

  if [[ "$DRY" -eq 1 ]]; then
    say "Dry run: would verify SHA512 and extract into $compat"
    say "Tool id is inside the archive and is printed on a real run."
    if [[ "$PIN" -eq 1 ]]; then
      say "Would also try to select it for app $APPID."
    fi
    print_after "proton-wineland" "Proton Wineland"
    return 0
  fi

  local parent avail
  mkdir -p "$compat"
  parent="$(dirname "$compat")"
  avail="$(df -Pk "$parent" | awk 'NR==2 { print $4 }')"
  if [[ "${avail:-0}" -lt 2000000 ]]; then
    warn "Need about 2 GB free on $parent (have ${avail:-0} KB)."
    exit 1
  fi

  WORKDIR="$(mktemp -d)"
  trap 'rm -rf "${WORKDIR:-}"' EXIT
  say "Downloading…"
  curl -fL --retry 3 --retry-delay 2 -o "$WORKDIR/$ARCHIVE" "$URL"
  printf '%s  %s\n' "$SHA" "$ARCHIVE" >"$WORKDIR/check.sha512"
  (
    cd "$WORKDIR"
    sha512sum -c check.sha512
  )
  mkdir -p "$WORKDIR/extract"
  tar -xJf "$WORKDIR/$ARCHIVE" -C "$WORKDIR/extract"

  local vdf="" f
  while IFS= read -r -d '' f; do
    if [[ -n "$vdf" ]]; then
      warn "Archive contains more than one compatibilitytool.vdf."
      exit 1
    fi
    vdf="$f"
  done < <(find "$WORKDIR/extract" -name compatibilitytool.vdf -print0)
  if [[ -z "$vdf" ]]; then
    warn "Archive has no compatibilitytool.vdf."
    exit 1
  fi

  local src_dir base dest key shown
  src_dir="$(dirname "$vdf")"
  base="$(basename "$src_dir")"
  if [[ "$base" == "extract" ]]; then
    base="proton-wineland-${TAG}-${CPU}"
    dest="$compat/$base"
    rm -rf "$dest"
    mkdir -p "$dest"
    cp -a "$src_dir"/. "$dest"/
  else
    dest="$compat/$base"
    rm -rf "$dest"
    cp -a "$src_dir" "$dest"
  fi
  key="$(tool_key_from "$dest/compatibilitytool.vdf")"
  shown="$(display_name_from "$dest/compatibilitytool.vdf")"
  [[ -n "$shown" ]] || shown="$key"
  record_add "$dest" "$key"
  say "Installed: $dest"
  say "Steam will list it as: $shown"

  if [[ "$PIN" -eq 1 ]]; then
    pin_tool "$key" || true
  else
    say "Steam's compatibility tool was left as you set it. Pick this Proton in Properties."
  fi
  print_after "$key" "$shown"
}

case "$ACTION" in
  install) do_install ;;
  remove) do_remove ;;
  pin) do_pin_only ;;
esac
