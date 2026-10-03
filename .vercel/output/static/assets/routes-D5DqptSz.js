import{i as e,n as t,r as n,t as r}from"./index-ByNcX2eI.js";var i=r(`check`,[[`path`,{d:`M20 6 9 17l-5-5`,key:`1gmf2c`}]]),a=r(`copy`,[[`rect`,{width:`14`,height:`14`,x:`8`,y:`8`,rx:`2`,ry:`2`,key:`17jyea`}],[`path`,{d:`M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2`,key:`zix9uf`}]]),o=r(`download`,[[`path`,{d:`M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`,key:`ih7n3h`}],[`polyline`,{points:`7 10 12 15 17 10`,key:`2ggqvy`}],[`line`,{x1:`12`,x2:`12`,y1:`15`,y2:`3`,key:`1vk2je`}]]),s=r(`shield`,[[`path`,{d:`M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z`,key:`oel41y`}]]),c=e(n()),l=`#!/usr/bin/env bash
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
    --gpu) GPU="\${2:-}"; shift 2 ;;
    --machine) MACHINE="\${2:-}"; shift 2 ;;
    --cpu) CPU="\${2:-}"; shift 2 ;;
    --steam) STEAM_KIND="\${2:-}"; shift 2 ;;
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

say() { printf '== %s\\n' "$*"; }
warn() { printf '!! %s\\n' "$*" >&2; }

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
  printf '%s %%command%%\\n' "$line"
}

record_file() {
  printf '%s\\n' "$HOME/.config/wolfsgate/installs.tsv"
}

record_add() {
  local dest="$1" key="$2" file
  file="$(record_file)"
  mkdir -p "$(dirname "$file")"
  [[ -f "$file" ]] || : >"$file"
  local tmp
  tmp="$(mktemp)"
  awk -F '\\t' -v d="$dest" '$1 != d { print }' "$file" >"$tmp"
  printf '%s\\t%s\\n' "$dest" "$key" >>"$tmp"
  mv "$tmp" "$file"
}

record_rows() {
  local file
  file="$(record_file)"
  [[ -f "$file" ]] || return 0
  awk -F '\\t' 'NF >= 2 { print }' "$file"
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
  for c in "\${candidates[@]}"; do
    [[ -d "$c" ]] || continue
    real="$(realpath -m "$c")"
    [[ -n "\${seen[$real]:-}" ]] && continue
    if [[ -d "$real/steamapps" || -d "$real/config" || -d "$real/ubuntu12_32" || -f "$real/steam.sh" ]]; then
      seen[$real]=1
      CLIENTS+=("$real")
    fi
  done
}

pick_client() {
  resolve_clients
  if [[ "\${#CLIENTS[@]}" -eq 0 ]]; then
    if [[ "$STEAM_KIND" == "flatpak" ]]; then
      warn "Flatpak Steam was not found under ~/.var/app/com.valvesoftware.Steam."
      warn "Install com.valvesoftware.Steam and start it once, or switch Wolfsgate to native Steam."
    else
      warn "Native Steam was not found under ~/.local/share/Steam."
      warn "Install the steam package, start it once, or switch Wolfsgate to Flatpak."
    fi
    exit 1
  fi
  CLIENT="\${CLIENTS[0]}"
}

steam_running() {
  pgrep -x steam >/dev/null 2>&1 && return 0
  pgrep -f 'com\\.valvesoftware\\.Steam' >/dev/null 2>&1 && return 0
  return 1
}

tool_key_from() {
  local vdf="$1"
  python3 - "$vdf" <<'PY'
import re, sys
text = open(sys.argv[1], errors="replace").read()
m = re.search(r'"compat_tools"\\s*\\{\\s*"([^"]+)"', text)
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
m = re.search(r'"display_name"\\s+"([^"]*)"', text)
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
    parts = re.split(r'"path"\\s+"([^"]+)"', text)
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
pat = re.compile(r'("' + re.escape(appid) + r'"\\s*\\{\\s*"name"\\s*)"[^"]*"')
if pat.search(text):
    text = pat.sub(lambda m: m.group(1) + '"' + tool + '"', text, count=1)
else:
    insert = (
        '\\n\\t\\t"' + appid + '"\\n\\t\\t{\\n\\t\\t\\t"name"\\t\\t"' + tool + '"'
        '\\n\\t\\t\\t"config"\\t\\t""\\n\\t\\t\\t"priority"\\t\\t"250"\\n\\t\\t}'
    )
    text2, n = re.subn(r'("CompatToolMapping"\\s*\\{)', lambda m: m.group(1) + insert, text, count=1)
    if n != 1:
        sys.exit("could not insert CompatToolMapping; pick the Proton inside Steam")
    text = text2
open(path, "w", encoding="utf-8").write(text)
print(backup)
PY
  say "Selected the Proton for The Witcher 3. Backup: \${cfg}.wolfsgate.bak"
}

print_after() {
  local key="$1"
  local shown="$2"
  cat <<EOF

Next:
  1. Quit Steam completely, including the tray icon, then open it again.
  2. The Witcher 3 → Properties → Compatibility.
  3. Enable "Force the use of a specific Steam Play compatibility tool".
  4. Choose: \${shown}
     (internal id \${key})
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
  URL="https://github.com/nanomatters/proton-cachyos/releases/download/\${TAG}/\${ARCHIVE}"
}

do_remove() {
  local row dest
  local any=0
  while IFS=$'\\t' read -r dest _; do
    [[ -n "\${dest:-}" ]] || continue
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
  dest="\${row%%$'\\t'*}"
  key="\${row#*$'\\t'}"
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
    exe="$(printf '%s\\n' "$game_info" | sed -n '1p')"
    digest="$(printf '%s\\n' "$game_info" | sed -n '2p')"
    label="$(printf '%s\\n' "$game_info" | sed -n '3p')"
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
  if [[ "\${avail:-0}" -lt 2000000 ]]; then
    warn "Need about 2 GB free on $parent (have \${avail:-0} KB)."
    exit 1
  fi

  WORKDIR="$(mktemp -d)"
  trap 'rm -rf "\${WORKDIR:-}"' EXIT
  say "Downloading…"
  curl -fL --retry 3 --retry-delay 2 -o "$WORKDIR/$ARCHIVE" "$URL"
  printf '%s  %s\\n' "$SHA" "$ARCHIVE" >"$WORKDIR/check.sha512"
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
    base="proton-wineland-\${TAG}-\${CPU}"
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
`,u={gpu:`nvidia`,machine:`desktop`,cpu:`v3`,steam:`native`,pin:!1},d=[`nvidia`,`amd`,`intel`],f=[`desktop`,`hybrid`],p=[`v3`,`baseline`],m=[`native`,`flatpak`],h=`85cb18030a352fdd36f6d85c6f425a48c87620cddb14946ba1da04ff92de4aa69dadf29c43631d586563f13832c48334fe8f9ecac69bf77f815f346615847d3e`,g=`e54a4c5dd2485e285eda91fc07eea6358ced549c38b08d60df994752bbd0940314a99b1dab28d1a71bd1fb8b7a23653d8d8873720b6a653de2a820772b347655`,_={tag:`wineland-11.0-20260930`,page:`https://github.com/nanomatters/proton-cachyos/releases/tag/wineland-11.0-20260930`},v=[{version:`5.0.0.1044392`,steam:`25646871`,label:`5.00c hotfix · 1 Oct 2026`,sha:`9406eccc12b68e08920931442ef6a57340e910d3e01f2082e88232487433fe51`},{version:`5.0.0.1041720`,steam:`25575366`,label:`Remastered launch · 29 Sep 2026`,sha:`c272b2c2e61f84c758e28fab69ab2915944dd1e539dbb435fae9fc67494c7e25`}];function y(e){return d.includes(e)}function b(e){return f.includes(e)}function x(e){return p.includes(e)}function S(e){return m.includes(e)}function C(e){return{gpu:e?.gpu&&y(e.gpu)?e.gpu:u.gpu,machine:e?.machine&&b(e.machine)?e.machine:u.machine,cpu:e?.cpu&&x(e.cpu)?e.cpu:u.cpu,steam:e?.steam&&S(e.steam)?e.steam:u.steam,pin:!!e?.pin}}function w(e){return e===`v3`?`proton-wineland-11.0-20260930-x86_64_v3.tar.xz`:`proton-wineland-11.0-20260930-x86_64.tar.xz`}function T(e){return e===`v3`?h:g}function E(e){let t=C(e),n=l.replaceAll(`__DEFAULT_GPU__`,t.gpu).replaceAll(`__DEFAULT_MACHINE__`,t.machine).replaceAll(`__DEFAULT_CPU__`,t.cpu).replaceAll(`__DEFAULT_STEAM__`,t.steam).replaceAll(`__DEFAULT_PIN__`,t.pin?`1`:`0`);if(n.includes(`__DEFAULT_`))throw Error(`Installer template still has placeholders`);return n}function D(e){let t=C(e),n=w(t.cpu),r=T(t.cpu),i=`https://github.com/nanomatters/proton-cachyos/releases/download/${_.tag}/${n}`;return`# Unofficial CachyOS / Arch package. Native Steam only.
# Flatpak Steam cannot see /usr/share — use wolfsgate-cachyos.sh instead.
pkgname=proton-wineland-w3
pkgver=11.0.20260930
pkgrel=1
pkgdesc="Proton Wineland so The Witcher 3 Remastered stops hiding DLSS and ray tracing"
arch=('x86_64')
url="${_.page}"
license=('custom')
options=('!strip')
source=("${n}::${i}")
sha512sums=('${r}')

package() {
  cd "$srcdir"
  local vdf dir name
  vdf=$(find . -name compatibilitytool.vdf -print -quit)
  if [[ -z "$vdf" ]]; then
    echo "compatibilitytool.vdf not found in the archive" >&2
    exit 1
  fi
  dir=$(dirname "$vdf")
  name=$(basename "$dir")
  if [[ "$name" == "." ]]; then
    name="proton-wineland-11.0-20260930"
    install -d "$pkgdir/usr/share/steam/compatibilitytools.d/$name"
    cp -a "$dir"/. "$pkgdir/usr/share/steam/compatibilitytools.d/$name/"
  else
    install -d "$pkgdir/usr/share/steam/compatibilitytools.d"
    cp -a "$dir" "$pkgdir/usr/share/steam/compatibilitytools.d/$name"
  fi
}
`}function O(e){let t=C(e);return t.machine===`hybrid`&&t.gpu===`nvidia`?{line:`PROTON_ENABLE_NVAPI=1 VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json __NV_PRIME_RENDER_OFFLOAD=1 __VK_LAYER_NV_optimus=NVIDIA_only %command%`,note:`Paste this. With an iGPU left visible, the remaster picks the weak GPU, locks the low preset, and hides ray tracing again.`}:t.machine===`hybrid`&&t.gpu===`amd`?{line:`PROTON_DISABLE_NVAPI=1 VK_DRIVER_FILES=/usr/share/vulkan/icd.d/radeon_icd.json VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/radeon_icd.json %command%`,note:`Paste this so Vulkan only sees the Radeon. Wineland already disables NVAPI when the GPU is not NVIDIA.`}:t.machine===`hybrid`&&t.gpu===`intel`?{line:`PROTON_DISABLE_NVAPI=1 VK_DRIVER_FILES=/usr/share/vulkan/icd.d/intel_icd.json %command%`,note:`Paste this so the game does not bind the wrong GPU.`}:t.gpu===`nvidia`?{line:`PROTON_ENABLE_NVAPI=1 %command%`,note:`Leave launch options empty at first. Wineland already enables NVAPI on NVIDIA. Paste this only if DLSS stays grey.`}:{line:`PROTON_DISABLE_NVAPI=1 %command%`,note:`Leave launch options empty at first. If startup crashes and Mesa Anti-Lag is installed, add DISABLE_LAYER_MESA_ANTI_LAG=1 in front of %command%.`}}function k(e){return e===`nvidia`?[{name:`DLSS Super Resolution`,state:`yes`,detail:`RTX 20 series and newer`},{name:`DLSS Ray Reconstruction`,state:`yes`,detail:`DLSS 4.5, with the remaster`},{name:`DLSS Frame Generation`,state:`some`,detail:`RTX 40 and 50 only`},{name:`NVIDIA Reflex`,state:`yes`,detail:`Comes back with Streamline`},{name:`Ray tracing`,state:`yes`,detail:`Needs this Proton’s vkd3d-proton`},{name:`Path tracing`,state:`yes`,detail:`PC-only mode in the remaster`},{name:`Path-traced hair`,state:`no`,detail:`Needs Linear Swept Spheres, which Proton does not report`}]:e===`amd`?[{name:`FSR upscaling`,state:`yes`,detail:`FSR 4 on RX 7000 and newer, otherwise FSR 2`},{name:`FSR frame generation`,state:`yes`,detail:`Hidden while the game thinks it is under Wine`},{name:`Ray tracing`,state:`yes`,detail:`RADV shader fix is in this Proton`},{name:`Path tracing`,state:`yes`,detail:`Reported stable on RX 6000 and 7000`},{name:`DLSS`,state:`no`,detail:`NVIDIA only. Do not force it with OptiScaler here`},{name:`Path-traced hair`,state:`no`,detail:`Unavailable under Proton`}]:[{name:`Ray tracing`,state:`yes`,detail:`Same Wine check as AMD, without the DLSS patches`},{name:`Path tracing`,state:`yes`,detail:`Selectable once Wine is hidden`},{name:`XeSS`,state:`some`,detail:`May appear. Treat frame generation as untested`},{name:`DLSS`,state:`no`,detail:`NVIDIA only`},{name:`Path-traced hair`,state:`no`,detail:`Unavailable under Proton`}]}function A(e){return e===`v3`?`Proton Wineland 11.0-20260930 x86-64-v3`:`Proton Wineland 11.0-20260930 x86-64`}var j=`bash wolfsgate-cachyos.sh --yes`,M=t(),N=`wolfsgate-options`;function P(){let[e,t]=(0,c.useState)(u),[n,r]=(0,c.useState)(!1),[l,d]=(0,c.useState)(!1),[f,p]=(0,c.useState)(!1),[m,h]=(0,c.useState)(null);(0,c.useEffect)(()=>{try{let e=localStorage.getItem(N);e&&t(C(JSON.parse(e)))}catch{}r(!0)},[]),(0,c.useEffect)(()=>{n&&localStorage.setItem(N,JSON.stringify(e))},[e,n]);let g=(0,c.useMemo)(()=>E(e),[e]),y=(0,c.useMemo)(()=>D(e),[e]),b=O(e),x=k(e.gpu);function S(e,n){t(t=>({...t,[e]:n}))}async function w(e,t){try{await navigator.clipboard.writeText(t),h(e),window.setTimeout(()=>h(t=>t===e?null:t),1600)}catch{h(null)}}function T(e,t){let n=new Blob([t],{type:`text/plain;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=e,document.body.appendChild(i),i.click(),i.remove(),URL.revokeObjectURL(r)}return(0,M.jsxs)(`main`,{className:`mx-auto max-w-6xl px-4 pt-8 pb-28 sm:px-6 lg:pb-16`,children:[(0,M.jsxs)(`header`,{className:`border-b border-line pb-8`,children:[(0,M.jsxs)(`div`,{className:`flex items-center gap-4`,children:[(0,M.jsx)(`img`,{src:`/favicon.svg`,alt:``,width:48,height:48,className:`h-12 w-12`}),(0,M.jsxs)(`div`,{children:[(0,M.jsx)(`p`,{className:`text-xs font-medium tracking-widest text-gold uppercase`,children:`CachyOS · Steam · App 292030`}),(0,M.jsx)(`h1`,{className:`text-4xl text-fg`,children:`Wolfsgate`})]})]}),(0,M.jsx)(`p`,{className:`mt-6 max-w-3xl text-lg text-fg`,children:`The Witcher 3 Remastered ships DLSS 4.5, ray tracing, and path tracing, then hides them when it notices Wine. This package installs a Proton build that stops that check. The game files stay untouched.`}),(0,M.jsxs)(`dl`,{className:`mt-6 grid gap-3 sm:grid-cols-3`,children:[(0,M.jsx)(F,{k:`Proton`,v:`Wineland 11.0-20260930`}),(0,M.jsx)(F,{k:`Game edit`,v:`None`}),(0,M.jsx)(F,{k:`Download`,v:`About 360 MB, hash-checked`})]})]}),(0,M.jsxs)(`section`,{className:`mt-8 grid gap-6 lg:grid-cols-5`,children:[(0,M.jsxs)(`form`,{className:`flex flex-col gap-5 rounded-card border border-line bg-surface p-4 sm:p-5 lg:col-span-2`,onSubmit:e=>e.preventDefault(),children:[(0,M.jsx)(`h2`,{className:`text-xl text-fg`,children:`Your machine`}),(0,M.jsx)(R,{label:`GPU`,value:e.gpu,onChange:e=>S(`gpu`,e),options:[{id:`nvidia`,title:`NVIDIA`,detail:`DLSS, frame generation, ray tracing`},{id:`amd`,title:`AMD`,detail:`FSR, ray tracing, path tracing`},{id:`intel`,title:`Intel`,detail:`Ray tracing and path tracing`}]}),(0,M.jsx)(R,{label:`Display GPU`,value:e.machine,onChange:e=>S(`machine`,e),options:[{id:`desktop`,title:`Desktop`,detail:`One graphics card`},{id:`hybrid`,title:`Laptop`,detail:`Dedicated GPU plus an iGPU`}]}),(0,M.jsx)(R,{label:`CPU`,value:e.cpu,onChange:e=>S(`cpu`,e),options:[{id:`v3`,title:`x86-64-v3`,detail:`CachyOS default, needs AVX2`},{id:`baseline`,title:`Baseline`,detail:`Older CPUs without AVX2`}]}),(0,M.jsx)(R,{label:`Steam`,value:e.steam,onChange:e=>S(`steam`,e),options:[{id:`native`,title:`Native`,detail:`steam from the CachyOS repos`},{id:`flatpak`,title:`Flatpak`,detail:`com.valvesoftware.Steam`}]}),(0,M.jsxs)(`label`,{className:`flex items-start gap-3 text-sm text-fg`,children:[(0,M.jsx)(`input`,{type:`checkbox`,className:`mt-1 h-4 w-4 accent-gold`,checked:e.pin,onChange:e=>S(`pin`,e.target.checked)}),(0,M.jsx)(`span`,{children:`Also select this Proton in Steam’s config. Steam must be fully quit, tray icon included. A backup of config.vdf is written first.`})]})]}),(0,M.jsxs)(`div`,{className:`flex flex-col gap-5 lg:col-span-3`,children:[(0,M.jsxs)(`section`,{className:`rounded-card border border-line bg-bg-raise p-4 sm:p-5`,children:[(0,M.jsxs)(`div`,{className:`flex items-start justify-between gap-3`,children:[(0,M.jsxs)(`div`,{children:[(0,M.jsx)(`h2`,{className:`text-xl text-fg`,children:`What comes back`}),(0,M.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:A(e.cpu)})]}),(0,M.jsx)(s,{className:`h-5 w-5 shrink-0 text-gold`,"aria-hidden":!0})]}),(0,M.jsx)(`ul`,{className:`mt-4 divide-y divide-line`,children:x.map(e=>(0,M.jsxs)(`li`,{className:`flex items-start justify-between gap-4 py-3`,children:[(0,M.jsxs)(`div`,{children:[(0,M.jsx)(`p`,{className:`text-sm font-medium text-fg`,children:e.name}),(0,M.jsx)(`p`,{className:`text-sm text-muted`,children:e.detail})]}),(0,M.jsx)(L,{state:e.state})]},e.name))})]}),(0,M.jsxs)(`section`,{className:`rounded-card border border-gold bg-surface p-4 sm:p-5`,children:[(0,M.jsx)(`h2`,{className:`text-xl text-fg`,children:`Installer`}),(0,M.jsx)(`p`,{className:`mt-2 text-sm text-muted`,children:`Save the script, quit Steam, then run it in a terminal. It downloads Proton Wineland from GitHub, checks the SHA512, and puts it in Steam’s compatibility tools. It does not replace proton-cachyos from the repos.`}),(0,M.jsx)(`pre`,{className:`mt-4 overflow-x-auto rounded-card bg-bg px-3 py-3 text-sm text-gold-2`,children:j}),(0,M.jsxs)(`div`,{className:`mt-4 hidden flex-wrap gap-3 lg:flex`,children:[(0,M.jsxs)(`button`,{type:`button`,className:`inline-flex h-11 items-center gap-2 rounded-card bg-gold px-4 text-sm font-medium text-ink`,onClick:()=>T(`wolfsgate-cachyos.sh`,g),children:[(0,M.jsx)(o,{className:`h-4 w-4`,"aria-hidden":!0}),`Download installer`]}),(0,M.jsxs)(`button`,{type:`button`,className:`inline-flex h-11 items-center gap-2 rounded-card border border-line px-4 text-sm text-fg`,onClick:()=>w(`cmd`,j),children:[m===`cmd`?(0,M.jsx)(i,{className:`h-4 w-4`}):(0,M.jsx)(a,{className:`h-4 w-4`}),m===`cmd`?`Copied`:`Copy command`]}),(0,M.jsx)(`button`,{type:`button`,className:`inline-flex h-11 items-center rounded-card border border-line px-4 text-sm text-fg`,onClick:()=>w(`script`,g),children:m===`script`?`Copied`:`Copy script`})]}),(0,M.jsx)(`button`,{type:`button`,className:`mt-4 text-sm text-gold underline-offset-4 hover:underline`,onClick:()=>d(e=>!e),children:l?`Hide script`:`Read the script`}),l?(0,M.jsx)(`pre`,{className:`mt-3 max-h-80 overflow-auto rounded-card bg-bg p-3 text-xs leading-5 text-muted`,children:g}):null]})]})]}),(0,M.jsxs)(`section`,{className:`mt-10 grid gap-6 lg:grid-cols-2`,children:[(0,M.jsxs)(`article`,{className:`rounded-card border border-line p-4 sm:p-5`,children:[(0,M.jsx)(`h2`,{className:`text-xl text-fg`,children:`After the script`}),(0,M.jsxs)(`ol`,{className:`mt-4 flex list-decimal flex-col gap-3 pl-5 text-sm text-fg`,children:[(0,M.jsx)(`li`,{children:`Quit Steam completely, including the tray icon, then open it again.`}),(0,M.jsx)(`li`,{children:`The Witcher 3 → Properties → Compatibility.`}),(0,M.jsx)(`li`,{children:`Force a specific Steam Play tool and choose Proton Wineland.`}),(0,M.jsx)(`li`,{children:`Launch once. If the options are still grey, paste the launch line below.`})]}),(0,M.jsxs)(`div`,{className:`mt-4 rounded-card bg-bg-raise p-3`,children:[(0,M.jsxs)(`div`,{className:`flex items-center justify-between gap-3`,children:[(0,M.jsx)(`p`,{className:`text-xs tracking-wide text-faint uppercase`,children:`Launch options`}),(0,M.jsxs)(`button`,{type:`button`,className:`inline-flex h-8 items-center gap-1 text-sm text-gold`,onClick:()=>w(`launch`,b.line),children:[m===`launch`?(0,M.jsx)(i,{className:`h-4 w-4`}):(0,M.jsx)(a,{className:`h-4 w-4`}),m===`launch`?`Copied`:`Copy`]})]}),(0,M.jsx)(`pre`,{className:`mt-2 overflow-x-auto text-sm text-gold-2`,children:b.line}),(0,M.jsx)(`p`,{className:`mt-2 text-sm text-muted`,children:b.note})]})]}),(0,M.jsxs)(`article`,{className:`rounded-card border border-line p-4 sm:p-5`,children:[(0,M.jsx)(`h2`,{className:`text-xl text-fg`,children:`In the graphics menu`}),(0,M.jsxs)(`ul`,{className:`mt-4 flex flex-col gap-3 text-sm text-fg`,children:[(0,M.jsx)(`li`,{children:e.gpu===`nvidia`?`Set the upscaler to DLSS. Turn Ray Reconstruction on. Frame Generation only on RTX 40 and 50.`:e.gpu===`amd`?`Use FSR. FSR 4 is for Radeon RX 7000 and newer; other cards stay on FSR 2. Frame generation should be listed again.`:`Use XeSS if it is listed. Ray tracing should no longer be forced off.`}),(0,M.jsx)(`li`,{children:`Pick a ray-tracing preset, or enable path tracing on its own.`}),(0,M.jsx)(`li`,{children:`Every preset turns HairWorks back off. Set HairWorks after the preset if you want it.`}),(0,M.jsx)(`li`,{children:`Path-traced hair stays off. Proton does not expose the NVIDIA feature it needs.`})]})]})]}),(0,M.jsxs)(`section`,{className:`mt-10 rounded-card border border-line bg-bg-raise p-4 sm:p-5`,children:[(0,M.jsx)(`h2`,{className:`text-xl text-fg`,children:`Why the menu lies`}),(0,M.jsxs)(`div`,{className:`mt-4 grid gap-4 md:grid-cols-3`,children:[(0,M.jsx)(I,{title:`It asks for Wine`,body:`witcher3.exe looks up wine_get_version in ntdll. Proton has that export. Windows does not.`}),(0,M.jsx)(I,{title:`Streamline never starts`,body:`On a hit, the game skips slInit. DLSS, Ray Reconstruction, frame generation, and Reflex all report as unsupported.`}),(0,M.jsx)(I,{title:`Ray tracing is zeroed`,body:`A cached “Wine” flag clears the ray-tracing capability, skips path-tracing shaders, and disables FSR frame generation.`})]}),(0,M.jsx)(`p`,{className:`mt-4 text-sm text-muted`,children:`Wineland hides that export for witcher3.exe only, and it includes the vkd3d-proton fixes that keep ray tracing from hanging an NVIDIA GPU or crashing RADV. A game update does not undo it, because the executable is never patched.`})]}),(0,M.jsxs)(`section`,{className:`mt-10`,children:[(0,M.jsx)(`h2`,{className:`text-xl text-fg`,children:`Known builds`}),(0,M.jsx)(`p`,{className:`mt-2 max-w-3xl text-sm text-muted`,children:`The installer still works if a later hotfix changes the exe, because it never matches bytes inside the file. These two are the builds the optional byte mod accepts. Anything else, the mod refuses.`}),(0,M.jsx)(`div`,{className:`mt-4 overflow-x-auto rounded-card border border-line`,children:(0,M.jsxs)(`table`,{className:`w-full min-w-[36rem] text-left text-sm`,children:[(0,M.jsx)(`thead`,{className:`bg-surface text-faint`,children:(0,M.jsxs)(`tr`,{children:[(0,M.jsx)(`th`,{className:`px-3 py-3 font-medium`,children:`Exe`}),(0,M.jsx)(`th`,{className:`px-3 py-3 font-medium`,children:`Steam build`}),(0,M.jsx)(`th`,{className:`px-3 py-3 font-medium`,children:`When`}),(0,M.jsx)(`th`,{className:`px-3 py-3 font-medium`,children:`SHA256`})]})}),(0,M.jsx)(`tbody`,{children:v.map(e=>(0,M.jsxs)(`tr`,{className:`border-t border-line`,children:[(0,M.jsx)(`td`,{className:`px-3 py-3 font-medium text-fg`,children:e.version}),(0,M.jsx)(`td`,{className:`px-3 py-3 text-muted`,children:e.steam}),(0,M.jsx)(`td`,{className:`px-3 py-3 text-muted`,children:e.label}),(0,M.jsx)(`td`,{className:`px-3 py-3 font-mono text-xs text-muted`,children:e.sha})]},e.version))})]})})]}),(0,M.jsxs)(`section`,{className:`mt-10 grid gap-6 lg:grid-cols-2`,children:[(0,M.jsxs)(`article`,{className:`rounded-card border border-line p-4 sm:p-5`,children:[(0,M.jsx)(`h2`,{className:`text-xl text-fg`,children:`Native package`}),e.steam===`flatpak`?(0,M.jsx)(`p`,{className:`mt-3 text-sm text-muted`,children:`Flatpak Steam cannot see a system Proton under /usr/share. Use the installer above. Switch Steam to Native if you want a makepkg package instead.`}):(0,M.jsxs)(M.Fragment,{children:[(0,M.jsx)(`p`,{className:`mt-3 text-sm text-muted`,children:`On native Steam you can build an Arch package instead of the user installer. It lands in /usr/share/steam/compatibilitytools.d. Quit Steam, then:`}),(0,M.jsx)(`pre`,{className:`mt-3 overflow-x-auto rounded-card bg-bg px-3 py-3 text-sm text-gold-2`,children:`mkdir -p wolfsgate && cd wolfsgate
# save the PKGBUILD here
makepkg -si`}),(0,M.jsxs)(`div`,{className:`mt-3 flex flex-wrap gap-3`,children:[(0,M.jsxs)(`button`,{type:`button`,className:`inline-flex h-11 items-center gap-2 rounded-card border border-line px-4 text-sm text-fg`,onClick:()=>T(`PKGBUILD`,y),children:[(0,M.jsx)(o,{className:`h-4 w-4`,"aria-hidden":!0}),`Download PKGBUILD`]}),(0,M.jsx)(`button`,{type:`button`,className:`text-sm text-gold underline-offset-4 hover:underline`,onClick:()=>p(e=>!e),children:f?`Hide PKGBUILD`:`Read PKGBUILD`})]}),f?(0,M.jsx)(`pre`,{className:`mt-3 max-h-64 overflow-auto rounded-card bg-bg p-3 text-xs leading-5 text-muted`,children:y}):null]})]}),(0,M.jsxs)(`article`,{className:`rounded-card border border-line p-4 sm:p-5`,children:[(0,M.jsx)(`h2`,{className:`text-xl text-ember`,children:`Byte mod, only if you must`}),(0,M.jsx)(`p`,{className:`mt-3 text-sm text-muted`,children:`If you refuse to switch Proton, a public patch flips the same checks inside bin/x64_dx12/witcher3.exe. Use it only on the two builds above, and only with a vkd3d-proton that already has the ray-tracing fixes. GE-Proton 11-7 does not, and the game crashes at startup. Steam “Verify integrity of game files” puts the original back.`}),(0,M.jsx)(`pre`,{className:`mt-3 overflow-x-auto rounded-card bg-bg px-3 py-3 text-xs leading-5 text-gold-2`,children:e.gpu===`nvidia`?`python3 w3_proton_patch.py --rt`:`python3 w3_proton_patch.py --rt-only`}),(0,M.jsx)(`a`,{className:`mt-3 inline-flex h-11 items-center text-sm text-gold underline-offset-4 hover:underline`,href:`/w3_proton_patch.py`,download:`w3_proton_patch.py`,children:`Download w3_proton_patch.py`}),(0,M.jsx)(`p`,{className:`mt-3 text-sm text-muted`,children:`Editing the executable can conflict with the game’s EULA. It does not touch DRM. Wolfsgate’s recommended install never does this.`})]})]}),(0,M.jsxs)(`section`,{className:`mt-10 border-t border-line pt-6 text-sm text-muted`,children:[(0,M.jsx)(`h2`,{className:`text-xl text-fg`,children:`Remove it`}),(0,M.jsx)(`p`,{className:`mt-2`,children:`The installer records what it copied. It will not delete anything outside Steam’s compatibility tools folder.`}),(0,M.jsx)(`pre`,{className:`mt-3 overflow-x-auto text-sm text-gold-2`,children:`bash wolfsgate-cachyos.sh --remove`}),(0,M.jsxs)(`p`,{className:`mt-6`,children:[`Proton build by`,` `,(0,M.jsx)(`a`,{className:`text-gold underline-offset-4 hover:underline`,href:_.page,children:`nanomatters / proton-cachyos`}),`. The Wine check and the byte offsets are documented by gabrielmaialva33, with the 5.00c sites from d1g1talpump. This does not download the game, and it does not enable path-traced hair.`]})]}),(0,M.jsx)(`div`,{className:`fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg-raise p-3 lg:hidden`,children:(0,M.jsxs)(`button`,{type:`button`,className:`inline-flex h-12 w-full items-center justify-center gap-2 rounded-card bg-gold text-sm font-medium text-ink`,onClick:()=>T(`wolfsgate-cachyos.sh`,g),children:[(0,M.jsx)(o,{className:`h-4 w-4`,"aria-hidden":!0}),`Download installer`]})})]})}function F({k:e,v:t}){return(0,M.jsxs)(`div`,{className:`rounded-card border border-line bg-bg-raise px-3 py-3`,children:[(0,M.jsx)(`dt`,{className:`text-xs tracking-wide text-faint uppercase`,children:e}),(0,M.jsx)(`dd`,{className:`mt-1 text-sm text-fg`,children:t})]})}function I({title:e,body:t}){return(0,M.jsxs)(`div`,{children:[(0,M.jsx)(`h3`,{className:`text-base text-gold-2`,children:e}),(0,M.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:t})]})}function L({state:e}){return(0,M.jsx)(`span`,{className:`shrink-0 text-xs font-medium tracking-wide uppercase ${e===`yes`?`text-ok`:e===`some`?`text-gold`:`text-faint`}`,children:e===`yes`?`On`:e===`some`?`Partial`:`Off`})}function R({label:e,value:t,options:n,onChange:r}){return(0,M.jsxs)(`fieldset`,{children:[(0,M.jsx)(`legend`,{className:`text-xs tracking-wide text-faint uppercase`,children:e}),(0,M.jsx)(`div`,{className:`mt-2 grid gap-2`,role:`radiogroup`,"aria-label":e,children:n.map(e=>{let n=e.id===t;return(0,M.jsxs)(`button`,{type:`button`,role:`radio`,"aria-checked":n,onClick:()=>r(e.id),className:`flex min-h-11 flex-col items-start rounded-card border px-3 py-2 text-left ${n?`border-gold bg-surface-2`:`border-line bg-bg-raise`}`,children:[(0,M.jsx)(`span`,{className:`text-sm font-medium text-fg`,children:e.title}),(0,M.jsx)(`span`,{className:`text-xs text-muted`,children:e.detail})]},e.id)})})]})}export{P as component};