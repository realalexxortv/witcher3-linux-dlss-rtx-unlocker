import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Check, i as Copy, n as Shield, r as Download } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BTEC65GA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var wolfsgate_default = "#!/usr/bin/env bash\n# Wolfsgate — CachyOS / Steam package for The Witcher 3: Wild Hunt — Remastered.\n# Installs Proton Wineland 11.0-20260930, which hides Wine from witcher3.exe\n# and carries the vkd3d-proton fixes ray tracing and path tracing need.\n# The game executable is not modified. Fully removable.\n#\n# Community Proton build: https://github.com/nanomatters/proton-cachyos/releases/tag/wineland-11.0-20260930\n# Why the options are missing: the remaster calls wine_get_version and then\n# skips Streamline (DLSS) and zeroes ray tracing. This is not a DRM crack.\nset -euo pipefail\n\nGPU=\"__DEFAULT_GPU__\"\nMACHINE=\"__DEFAULT_MACHINE__\"\nCPU=\"__DEFAULT_CPU__\"\nSTEAM_KIND=\"__DEFAULT_STEAM__\"\nYES=0\nDRY=0\nPIN=__DEFAULT_PIN__\nACTION=\"install\"\n\nTAG=\"wineland-11.0-20260930\"\nAPPID=\"292030\"\n\nusage() {\n  cat <<'EOF'\nWolfsgate — unlock DLSS, ray tracing, and path tracing in The Witcher 3 Remastered.\n\nUsage:\n  bash wolfsgate-cachyos.sh --yes\n  bash wolfsgate-cachyos.sh --dry-run\n  bash wolfsgate-cachyos.sh --remove\n  bash wolfsgate-cachyos.sh --pin-only\n\nOptions:\n  --gpu nvidia|amd|intel     What to print for Steam launch options\n  --machine desktop|hybrid   Hybrid hides the integrated GPU from the game\n  --cpu v3|baseline          v3 is the CachyOS default (AVX2). baseline if the CPU lacks it\n  --steam native|flatpak     Which Steam client receives the Proton build\n  --yes                      Do not ask before downloading\n  --dry-run                  Print the plan only\n  --pin                      Select this Proton for app 292030 (Steam must be quit)\n  --no-pin                   Do not edit Steam's config\n  --pin-only                 Only select an already installed Wolfsgate Proton\n  --remove                   Delete Proton builds this script installed\n  -h, --help                 This help\n\nThe download is about 360 MB and needs about 2 GB free. Quit Steam completely\n(including the tray icon) before --pin, and restart Steam afterwards.\nEOF\n}\n\nwhile [[ $# -gt 0 ]]; do\n  case \"$1\" in\n    --gpu) GPU=\"${2:-}\"; shift 2 ;;\n    --machine) MACHINE=\"${2:-}\"; shift 2 ;;\n    --cpu) CPU=\"${2:-}\"; shift 2 ;;\n    --steam) STEAM_KIND=\"${2:-}\"; shift 2 ;;\n    --yes|-y) YES=1; shift ;;\n    --dry-run) DRY=1; shift ;;\n    --pin) PIN=1; shift ;;\n    --no-pin) PIN=0; shift ;;\n    --pin-only) ACTION=\"pin\"; shift ;;\n    --remove) ACTION=\"remove\"; shift ;;\n    -h|--help) usage; exit 0 ;;\n    *) echo \"Unknown option: $1\" >&2; usage >&2; exit 2 ;;\n  esac\ndone\n\ncase \"$GPU\" in\n  nvidia|amd|intel) ;;\n  *) echo \"GPU must be nvidia, amd, or intel.\" >&2; exit 2 ;;\nesac\ncase \"$MACHINE\" in\n  desktop|hybrid) ;;\n  *) echo \"Machine must be desktop or hybrid.\" >&2; exit 2 ;;\nesac\ncase \"$CPU\" in\n  v3|baseline) ;;\n  *) echo \"CPU must be v3 or baseline.\" >&2; exit 2 ;;\nesac\ncase \"$STEAM_KIND\" in\n  native|flatpak) ;;\n  *) echo \"Steam must be native or flatpak.\" >&2; exit 2 ;;\nesac\n\nsay() { printf '== %s\\n' \"$*\"; }\nwarn() { printf '!! %s\\n' \"$*\" >&2; }\n\nconfirm() {\n  local prompt=\"$1\"\n  if [[ \"$YES\" -eq 1 || \"$DRY\" -eq 1 ]]; then\n    return 0\n  fi\n  if [[ ! -t 0 ]]; then\n    warn \"No terminal to confirm. Re-run with --yes.\"\n    exit 1\n  fi\n  local ans\n  read -r -p \"$prompt [y/N] \" ans\n  [[ \"$ans\" == \"y\" || \"$ans\" == \"Y\" ]]\n}\n\nneed() {\n  local c\n  for c in \"$@\"; do\n    command -v \"$c\" >/dev/null 2>&1 || { warn \"Missing command: $c\"; exit 1; }\n  done\n}\n\nlaunch_line() {\n  local line=\"\"\n  case \"$GPU\" in\n    nvidia) line=\"PROTON_ENABLE_NVAPI=1\" ;;\n    amd|intel) line=\"PROTON_DISABLE_NVAPI=1\" ;;\n  esac\n  if [[ \"$MACHINE\" == \"hybrid\" && \"$GPU\" == \"nvidia\" ]]; then\n    line=\"$line VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json __NV_PRIME_RENDER_OFFLOAD=1 __VK_LAYER_NV_optimus=NVIDIA_only\"\n  elif [[ \"$MACHINE\" == \"hybrid\" && \"$GPU\" == \"amd\" ]]; then\n    line=\"$line VK_DRIVER_FILES=/usr/share/vulkan/icd.d/radeon_icd.json VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/radeon_icd.json\"\n  elif [[ \"$MACHINE\" == \"hybrid\" && \"$GPU\" == \"intel\" ]]; then\n    line=\"$line VK_DRIVER_FILES=/usr/share/vulkan/icd.d/intel_icd.json\"\n  fi\n  printf '%s %%command%%\\n' \"$line\"\n}\n\nrecord_file() {\n  printf '%s\\n' \"$HOME/.config/wolfsgate/installs.tsv\"\n}\n\nrecord_add() {\n  local dest=\"$1\" key=\"$2\" file\n  file=\"$(record_file)\"\n  mkdir -p \"$(dirname \"$file\")\"\n  [[ -f \"$file\" ]] || : >\"$file\"\n  local tmp\n  tmp=\"$(mktemp)\"\n  awk -F '\\t' -v d=\"$dest\" '$1 != d { print }' \"$file\" >\"$tmp\"\n  printf '%s\\t%s\\n' \"$dest\" \"$key\" >>\"$tmp\"\n  mv \"$tmp\" \"$file\"\n}\n\nrecord_rows() {\n  local file\n  file=\"$(record_file)\"\n  [[ -f \"$file\" ]] || return 0\n  awk -F '\\t' 'NF >= 2 { print }' \"$file\"\n}\n\nresolve_clients() {\n  local -a candidates=()\n  if [[ \"$STEAM_KIND\" == \"native\" ]]; then\n    candidates+=(\"$HOME/.local/share/Steam\" \"$HOME/.steam/root\" \"$HOME/.steam/steam\")\n  else\n    candidates+=(\n      \"$HOME/.var/app/com.valvesoftware.Steam/.local/share/Steam\"\n      \"$HOME/.var/app/com.valvesoftware.Steam/data/Steam\"\n    )\n  fi\n  declare -A seen=()\n  CLIENTS=()\n  local c real\n  for c in \"${candidates[@]}\"; do\n    [[ -d \"$c\" ]] || continue\n    real=\"$(realpath -m \"$c\")\"\n    [[ -n \"${seen[$real]:-}\" ]] && continue\n    if [[ -d \"$real/steamapps\" || -d \"$real/config\" || -d \"$real/ubuntu12_32\" || -f \"$real/steam.sh\" ]]; then\n      seen[$real]=1\n      CLIENTS+=(\"$real\")\n    fi\n  done\n}\n\npick_client() {\n  resolve_clients\n  if [[ \"${#CLIENTS[@]}\" -eq 0 ]]; then\n    if [[ \"$STEAM_KIND\" == \"flatpak\" ]]; then\n      warn \"Flatpak Steam was not found under ~/.var/app/com.valvesoftware.Steam.\"\n      warn \"Install com.valvesoftware.Steam and start it once, or switch Wolfsgate to native Steam.\"\n    else\n      warn \"Native Steam was not found under ~/.local/share/Steam.\"\n      warn \"Install the steam package, start it once, or switch Wolfsgate to Flatpak.\"\n    fi\n    exit 1\n  fi\n  CLIENT=\"${CLIENTS[0]}\"\n}\n\nsteam_running() {\n  pgrep -x steam >/dev/null 2>&1 && return 0\n  pgrep -f 'com\\.valvesoftware\\.Steam' >/dev/null 2>&1 && return 0\n  return 1\n}\n\ntool_key_from() {\n  local vdf=\"$1\"\n  python3 - \"$vdf\" <<'PY'\nimport re, sys\ntext = open(sys.argv[1], errors=\"replace\").read()\nm = re.search(r'\"compat_tools\"\\s*\\{\\s*\"([^\"]+)\"', text)\nif not m:\n    sys.exit(\"compatibilitytool.vdf has no compat_tools entry\")\nkey = m.group(1)\nif not re.fullmatch(r\"[A-Za-z0-9._+-]+\", key):\n    sys.exit(\"refusing unexpected Proton tool id: \" + key)\nprint(key)\nPY\n}\n\ndisplay_name_from() {\n  local vdf=\"$1\"\n  python3 - \"$vdf\" <<'PY'\nimport re, sys\ntext = open(sys.argv[1], errors=\"replace\").read()\nm = re.search(r'\"display_name\"\\s+\"([^\"]*)\"', text)\nprint(m.group(1) if m else \"\")\nPY\n}\n\ninspect_game() {\n  python3 - \"$CLIENT\" \"$APPID\" <<'PY'\nimport hashlib, os, re, sys\nclient, appid = sys.argv[1], sys.argv[2]\nknown = {\n    \"c272b2c2e61f84c758e28fab69ab2915944dd1e539dbb435fae9fc67494c7e25\": \"5.0.0.1041720 (Remastered, Steam 25575366)\",\n    \"9406eccc12b68e08920931442ef6a57340e910d3e01f2082e88232487433fe51\": \"5.0.0.1044392 (5.00c hotfix, Steam 25646871)\",\n}\nvdfs = [\n    os.path.join(client, \"steamapps\", \"libraryfolders.vdf\"),\n    os.path.join(client, \"config\", \"libraryfolders.vdf\"),\n]\ncands = [os.path.join(client, \"steamapps\", \"common\", \"The Witcher 3\", \"bin\", \"x64_dx12\", \"witcher3.exe\")]\nfor vdf in vdfs:\n    if not os.path.isfile(vdf):\n        continue\n    text = open(vdf, errors=\"replace\").read()\n    parts = re.split(r'\"path\"\\s+\"([^\"]+)\"', text)\n    for i in range(1, len(parts), 2):\n        lib, body = parts[i], parts[i + 1] if i + 1 < len(parts) else \"\"\n        exe = os.path.join(lib, \"steamapps\", \"common\", \"The Witcher 3\", \"bin\", \"x64_dx12\", \"witcher3.exe\")\n        if appid in body:\n            cands.insert(0, exe)\n        else:\n            cands.append(exe)\nseen = set()\nfor exe in cands:\n    if exe in seen:\n        continue\n    seen.add(exe)\n    if os.path.isfile(exe):\n        digest = hashlib.sha256(open(exe, \"rb\").read()).hexdigest()\n        label = known.get(digest, \"not a pinned build\")\n        print(exe)\n        print(digest)\n        print(label)\n        sys.exit(0)\nsys.exit(0)\nPY\n}\n\npin_tool() {\n  local key=\"$1\"\n  local cfg=\"$CLIENT/config/config.vdf\"\n  if [[ ! -f \"$cfg\" ]]; then\n    warn \"No $cfg yet. Start Steam once, quit it, then re-run with --pin-only.\"\n    return 1\n  fi\n  if steam_running; then\n    warn \"Steam is running. Quit it fully (tray icon too), then re-run:\"\n    warn \"  bash wolfsgate-cachyos.sh --pin-only\"\n    return 1\n  fi\n  if [[ \"$DRY\" -eq 1 ]]; then\n    say \"Would select Proton '$key' for app $APPID in $cfg\"\n    return 0\n  fi\n  python3 - \"$cfg\" \"$key\" \"$APPID\" <<'PY'\nimport re, shutil, sys\npath, tool, appid = sys.argv[1], sys.argv[2], sys.argv[3]\ntext = open(path, encoding=\"utf-8\", errors=\"replace\").read()\nif '\"CompatToolMapping\"' not in text:\n    sys.exit(\"config.vdf has no CompatToolMapping; pick the Proton inside Steam instead\")\nbackup = path + \".wolfsgate.bak\"\nshutil.copy2(path, backup)\npat = re.compile(r'(\"' + re.escape(appid) + r'\"\\s*\\{\\s*\"name\"\\s*)\"[^\"]*\"')\nif pat.search(text):\n    text = pat.sub(lambda m: m.group(1) + '\"' + tool + '\"', text, count=1)\nelse:\n    insert = (\n        '\\n\\t\\t\"' + appid + '\"\\n\\t\\t{\\n\\t\\t\\t\"name\"\\t\\t\"' + tool + '\"'\n        '\\n\\t\\t\\t\"config\"\\t\\t\"\"\\n\\t\\t\\t\"priority\"\\t\\t\"250\"\\n\\t\\t}'\n    )\n    text2, n = re.subn(r'(\"CompatToolMapping\"\\s*\\{)', lambda m: m.group(1) + insert, text, count=1)\n    if n != 1:\n        sys.exit(\"could not insert CompatToolMapping; pick the Proton inside Steam\")\n    text = text2\nopen(path, \"w\", encoding=\"utf-8\").write(text)\nprint(backup)\nPY\n  say \"Selected the Proton for The Witcher 3. Backup: ${cfg}.wolfsgate.bak\"\n}\n\nprint_after() {\n  local key=\"$1\"\n  local shown=\"$2\"\n  cat <<EOF\n\nNext:\n  1. Quit Steam completely, including the tray icon, then open it again.\n  2. The Witcher 3 → Properties → Compatibility.\n  3. Enable \"Force the use of a specific Steam Play compatibility tool\".\n  4. Choose: ${shown}\n     (internal id ${key})\n  5. Launch options, only if you need them:\n     $(launch_line)\n  6. In game: Options → Graphics. Pick DLSS on NVIDIA, or FSR on AMD.\n     Turn on ray tracing or path tracing after the game lists them.\n     Presets turn HairWorks back off — set that after the preset.\n     Path-traced hair stays unavailable under Proton.\n\nDesktop NVIDIA usually needs no launch options with this Proton.\nA laptop with an iGPU should paste the launch options above, or the\nremaster can lock itself to the low preset and hide ray tracing again.\n\nThis did not change witcher3.exe. A later game update will not undo it.\nRemove with: bash wolfsgate-cachyos.sh --remove\nEOF\n}\n\narchive_for_cpu() {\n  if [[ \"$CPU\" == \"v3\" ]]; then\n    ARCHIVE=\"proton-wineland-11.0-20260930-x86_64_v3.tar.xz\"\n    SHA=\"85cb18030a352fdd36f6d85c6f425a48c87620cddb14946ba1da04ff92de4aa69dadf29c43631d586563f13832c48334fe8f9ecac69bf77f815f346615847d3e\"\n  else\n    ARCHIVE=\"proton-wineland-11.0-20260930-x86_64.tar.xz\"\n    SHA=\"e54a4c5dd2485e285eda91fc07eea6358ced549c38b08d60df994752bbd0940314a99b1dab28d1a71bd1fb8b7a23653d8d8873720b6a653de2a820772b347655\"\n  fi\n  URL=\"https://github.com/nanomatters/proton-cachyos/releases/download/${TAG}/${ARCHIVE}\"\n}\n\ndo_remove() {\n  local row dest\n  local any=0\n  while IFS=$'\\t' read -r dest _; do\n    [[ -n \"${dest:-}\" ]] || continue\n    case \"$dest\" in\n      */compatibilitytools.d/*) ;;\n      *) warn \"Refusing to delete unexpected path: $dest\"; continue ;;\n    esac\n    any=1\n    if [[ -d \"$dest\" && -f \"$dest/compatibilitytool.vdf\" ]]; then\n      say \"Removing $dest\"\n      if [[ \"$DRY\" -eq 0 ]]; then\n        rm -rf \"$dest\"\n      fi\n    else\n      warn \"Already gone: $dest\"\n    fi\n  done < <(record_rows || true)\n  if [[ \"$any\" -eq 0 ]]; then\n    warn \"Wolfsgate has no recorded Proton install to remove.\"\n    exit 1\n  fi\n  if [[ \"$DRY\" -eq 0 ]]; then\n    rm -f \"$(record_file)\"\n  fi\n  say \"Removed. In Steam, set The Witcher 3 back to Proton Experimental or proton-cachyos.\"\n}\n\ndo_pin_only() {\n  pick_client\n  local row dest key\n  row=\"$(record_rows | tail -n 1 || true)\"\n  if [[ -z \"$row\" ]]; then\n    warn \"Nothing installed yet. Run bash wolfsgate-cachyos.sh --yes first.\"\n    exit 1\n  fi\n  dest=\"${row%%$'\\t'*}\"\n  key=\"${row#*$'\\t'}\"\n  if [[ ! -f \"$dest/compatibilitytool.vdf\" ]]; then\n    warn \"Recorded Proton is missing: $dest\"\n    exit 1\n  fi\n  key=\"$(tool_key_from \"$dest/compatibilitytool.vdf\")\"\n  pin_tool \"$key\"\n}\n\ndo_install() {\n  need curl tar sha512sum python3 realpath awk\n  pick_client\n  archive_for_cpu\n  local compat=\"$CLIENT/compatibilitytools.d\"\n  say \"Steam client: $CLIENT\"\n  say \"Proton: $ARCHIVE\"\n  say \"Installs to: $compat\"\n\n  local game_info exe digest label\n  game_info=\"$(inspect_game || true)\"\n  if [[ -n \"$game_info\" ]]; then\n    exe=\"$(printf '%s\\n' \"$game_info\" | sed -n '1p')\"\n    digest=\"$(printf '%s\\n' \"$game_info\" | sed -n '2p')\"\n    label=\"$(printf '%s\\n' \"$game_info\" | sed -n '3p')\"\n    say \"Game: $exe\"\n    say \"Build: $label\"\n    if [[ \"$label\" == \"not a pinned build\" ]]; then\n      warn \"This exe hash is not 5.0.0.1041720 or 5.00c ($digest).\"\n      warn \"Wineland can still hide Wine. Do not byte-patch an unknown build.\"\n    fi\n  else\n    warn \"The Witcher 3 is not installed in this Steam yet. The Proton build will still be installed.\"\n  fi\n\n  if ! confirm \"Download Proton Wineland (~360 MB) and install it for Steam?\"; then\n    say \"Cancelled.\"\n    exit 0\n  fi\n\n  if [[ \"$DRY\" -eq 1 ]]; then\n    say \"Dry run: would verify SHA512 and extract into $compat\"\n    say \"Tool id is inside the archive and is printed on a real run.\"\n    if [[ \"$PIN\" -eq 1 ]]; then\n      say \"Would also try to select it for app $APPID.\"\n    fi\n    print_after \"proton-wineland\" \"Proton Wineland\"\n    return 0\n  fi\n\n  local parent avail\n  mkdir -p \"$compat\"\n  parent=\"$(dirname \"$compat\")\"\n  avail=\"$(df -Pk \"$parent\" | awk 'NR==2 { print $4 }')\"\n  if [[ \"${avail:-0}\" -lt 2000000 ]]; then\n    warn \"Need about 2 GB free on $parent (have ${avail:-0} KB).\"\n    exit 1\n  fi\n\n  WORKDIR=\"$(mktemp -d)\"\n  trap 'rm -rf \"${WORKDIR:-}\"' EXIT\n  say \"Downloading…\"\n  curl -fL --retry 3 --retry-delay 2 -o \"$WORKDIR/$ARCHIVE\" \"$URL\"\n  printf '%s  %s\\n' \"$SHA\" \"$ARCHIVE\" >\"$WORKDIR/check.sha512\"\n  (\n    cd \"$WORKDIR\"\n    sha512sum -c check.sha512\n  )\n  mkdir -p \"$WORKDIR/extract\"\n  tar -xJf \"$WORKDIR/$ARCHIVE\" -C \"$WORKDIR/extract\"\n\n  local vdf=\"\" f\n  while IFS= read -r -d '' f; do\n    if [[ -n \"$vdf\" ]]; then\n      warn \"Archive contains more than one compatibilitytool.vdf.\"\n      exit 1\n    fi\n    vdf=\"$f\"\n  done < <(find \"$WORKDIR/extract\" -name compatibilitytool.vdf -print0)\n  if [[ -z \"$vdf\" ]]; then\n    warn \"Archive has no compatibilitytool.vdf.\"\n    exit 1\n  fi\n\n  local src_dir base dest key shown\n  src_dir=\"$(dirname \"$vdf\")\"\n  base=\"$(basename \"$src_dir\")\"\n  if [[ \"$base\" == \"extract\" ]]; then\n    base=\"proton-wineland-${TAG}-${CPU}\"\n    dest=\"$compat/$base\"\n    rm -rf \"$dest\"\n    mkdir -p \"$dest\"\n    cp -a \"$src_dir\"/. \"$dest\"/\n  else\n    dest=\"$compat/$base\"\n    rm -rf \"$dest\"\n    cp -a \"$src_dir\" \"$dest\"\n  fi\n  key=\"$(tool_key_from \"$dest/compatibilitytool.vdf\")\"\n  shown=\"$(display_name_from \"$dest/compatibilitytool.vdf\")\"\n  [[ -n \"$shown\" ]] || shown=\"$key\"\n  record_add \"$dest\" \"$key\"\n  say \"Installed: $dest\"\n  say \"Steam will list it as: $shown\"\n\n  if [[ \"$PIN\" -eq 1 ]]; then\n    pin_tool \"$key\" || true\n  else\n    say \"Steam's compatibility tool was left as you set it. Pick this Proton in Properties.\"\n  fi\n  print_after \"$key\" \"$shown\"\n}\n\ncase \"$ACTION\" in\n  install) do_install ;;\n  remove) do_remove ;;\n  pin) do_pin_only ;;\nesac\n";
var DEFAULT_OPTIONS = {
	gpu: "nvidia",
	machine: "desktop",
	cpu: "v3",
	steam: "native",
	pin: false
};
var GPUS = [
	"nvidia",
	"amd",
	"intel"
];
var MACHINES = ["desktop", "hybrid"];
var CPUS = ["v3", "baseline"];
var STEAMS = ["native", "flatpak"];
var SHA_V3 = "85cb18030a352fdd36f6d85c6f425a48c87620cddb14946ba1da04ff92de4aa69dadf29c43631d586563f13832c48334fe8f9ecac69bf77f815f346615847d3e";
var SHA_BASE = "e54a4c5dd2485e285eda91fc07eea6358ced549c38b08d60df994752bbd0940314a99b1dab28d1a71bd1fb8b7a23653d8d8873720b6a653de2a820772b347655";
var RELEASE = {
	tag: "wineland-11.0-20260930",
	page: "https://github.com/nanomatters/proton-cachyos/releases/tag/wineland-11.0-20260930"
};
var BUILDS = [{
	version: "5.0.0.1044392",
	steam: "25646871",
	label: "5.00c hotfix · 1 Oct 2026",
	sha: "9406eccc12b68e08920931442ef6a57340e910d3e01f2082e88232487433fe51"
}, {
	version: "5.0.0.1041720",
	steam: "25575366",
	label: "Remastered launch · 29 Sep 2026",
	sha: "c272b2c2e61f84c758e28fab69ab2915944dd1e539dbb435fae9fc67494c7e25"
}];
function isGpu(value) {
	return GPUS.includes(value);
}
function isMachine(value) {
	return MACHINES.includes(value);
}
function isCpu(value) {
	return CPUS.includes(value);
}
function isSteam(value) {
	return STEAMS.includes(value);
}
function sanitizeOptions(input) {
	return {
		gpu: input?.gpu && isGpu(input.gpu) ? input.gpu : DEFAULT_OPTIONS.gpu,
		machine: input?.machine && isMachine(input.machine) ? input.machine : DEFAULT_OPTIONS.machine,
		cpu: input?.cpu && isCpu(input.cpu) ? input.cpu : DEFAULT_OPTIONS.cpu,
		steam: input?.steam && isSteam(input.steam) ? input.steam : DEFAULT_OPTIONS.steam,
		pin: Boolean(input?.pin)
	};
}
function archiveName(cpu) {
	return cpu === "v3" ? "proton-wineland-11.0-20260930-x86_64_v3.tar.xz" : "proton-wineland-11.0-20260930-x86_64.tar.xz";
}
function archiveSha(cpu) {
	return cpu === "v3" ? SHA_V3 : SHA_BASE;
}
function buildInstallScript(input) {
	const o = sanitizeOptions(input);
	const script = wolfsgate_default.replaceAll("__DEFAULT_GPU__", o.gpu).replaceAll("__DEFAULT_MACHINE__", o.machine).replaceAll("__DEFAULT_CPU__", o.cpu).replaceAll("__DEFAULT_STEAM__", o.steam).replaceAll("__DEFAULT_PIN__", o.pin ? "1" : "0");
	if (script.includes("__DEFAULT_")) throw new Error("Installer template still has placeholders");
	return script;
}
function buildPkgbuild(input) {
	const o = sanitizeOptions(input);
	const archive = archiveName(o.cpu);
	const sha = archiveSha(o.cpu);
	const url = `https://github.com/nanomatters/proton-cachyos/releases/download/${RELEASE.tag}/${archive}`;
	return `# Unofficial CachyOS / Arch package. Native Steam only.
# Flatpak Steam cannot see /usr/share — use wolfsgate-cachyos.sh instead.
pkgname=proton-wineland-w3
pkgver=11.0.20260930
pkgrel=1
pkgdesc="Proton Wineland so The Witcher 3 Remastered stops hiding DLSS and ray tracing"
arch=('x86_64')
url="${RELEASE.page}"
license=('custom')
options=('!strip')
source=("${archive}::${url}")
sha512sums=('${sha}')

package() {
  cd "\$srcdir"
  local vdf dir name
  vdf=\$(find . -name compatibilitytool.vdf -print -quit)
  if [[ -z "\$vdf" ]]; then
    echo "compatibilitytool.vdf not found in the archive" >&2
    exit 1
  fi
  dir=\$(dirname "\$vdf")
  name=\$(basename "\$dir")
  if [[ "\$name" == "." ]]; then
    name="proton-wineland-11.0-20260930"
    install -d "\$pkgdir/usr/share/steam/compatibilitytools.d/\$name"
    cp -a "\$dir"/. "\$pkgdir/usr/share/steam/compatibilitytools.d/\$name/"
  else
    install -d "\$pkgdir/usr/share/steam/compatibilitytools.d"
    cp -a "\$dir" "\$pkgdir/usr/share/steam/compatibilitytools.d/\$name"
  fi
}
`;
}
function launchOptions(input) {
	const o = sanitizeOptions(input);
	if (o.machine === "hybrid" && o.gpu === "nvidia") return {
		line: "PROTON_ENABLE_NVAPI=1 VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json __NV_PRIME_RENDER_OFFLOAD=1 __VK_LAYER_NV_optimus=NVIDIA_only %command%",
		note: "Paste this. With an iGPU left visible, the remaster picks the weak GPU, locks the low preset, and hides ray tracing again."
	};
	if (o.machine === "hybrid" && o.gpu === "amd") return {
		line: "PROTON_DISABLE_NVAPI=1 VK_DRIVER_FILES=/usr/share/vulkan/icd.d/radeon_icd.json VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/radeon_icd.json %command%",
		note: "Paste this so Vulkan only sees the Radeon. Wineland already disables NVAPI when the GPU is not NVIDIA."
	};
	if (o.machine === "hybrid" && o.gpu === "intel") return {
		line: "PROTON_DISABLE_NVAPI=1 VK_DRIVER_FILES=/usr/share/vulkan/icd.d/intel_icd.json %command%",
		note: "Paste this so the game does not bind the wrong GPU."
	};
	if (o.gpu === "nvidia") return {
		line: "PROTON_ENABLE_NVAPI=1 %command%",
		note: "Leave launch options empty at first. Wineland already enables NVAPI on NVIDIA. Paste this only if DLSS stays grey."
	};
	return {
		line: "PROTON_DISABLE_NVAPI=1 %command%",
		note: "Leave launch options empty at first. If startup crashes and Mesa Anti-Lag is installed, add DISABLE_LAYER_MESA_ANTI_LAG=1 in front of %command%."
	};
}
function features(gpu) {
	if (gpu === "nvidia") return [
		{
			name: "DLSS Super Resolution",
			state: "yes",
			detail: "RTX 20 series and newer"
		},
		{
			name: "DLSS Ray Reconstruction",
			state: "yes",
			detail: "DLSS 4.5, with the remaster"
		},
		{
			name: "DLSS Frame Generation",
			state: "some",
			detail: "RTX 40 and 50 only"
		},
		{
			name: "NVIDIA Reflex",
			state: "yes",
			detail: "Comes back with Streamline"
		},
		{
			name: "Ray tracing",
			state: "yes",
			detail: "Needs this Proton’s vkd3d-proton"
		},
		{
			name: "Path tracing",
			state: "yes",
			detail: "PC-only mode in the remaster"
		},
		{
			name: "Path-traced hair",
			state: "no",
			detail: "Needs Linear Swept Spheres, which Proton does not report"
		}
	];
	if (gpu === "amd") return [
		{
			name: "FSR upscaling",
			state: "yes",
			detail: "FSR 4 on RX 7000 and newer, otherwise FSR 2"
		},
		{
			name: "FSR frame generation",
			state: "yes",
			detail: "Hidden while the game thinks it is under Wine"
		},
		{
			name: "Ray tracing",
			state: "yes",
			detail: "RADV shader fix is in this Proton"
		},
		{
			name: "Path tracing",
			state: "yes",
			detail: "Reported stable on RX 6000 and 7000"
		},
		{
			name: "DLSS",
			state: "no",
			detail: "NVIDIA only. Do not force it with OptiScaler here"
		},
		{
			name: "Path-traced hair",
			state: "no",
			detail: "Unavailable under Proton"
		}
	];
	return [
		{
			name: "Ray tracing",
			state: "yes",
			detail: "Same Wine check as AMD, without the DLSS patches"
		},
		{
			name: "Path tracing",
			state: "yes",
			detail: "Selectable once Wine is hidden"
		},
		{
			name: "XeSS",
			state: "some",
			detail: "May appear. Treat frame generation as untested"
		},
		{
			name: "DLSS",
			state: "no",
			detail: "NVIDIA only"
		},
		{
			name: "Path-traced hair",
			state: "no",
			detail: "Unavailable under Proton"
		}
	];
}
function protonLabel(cpu) {
	return cpu === "v3" ? "Proton Wineland 11.0-20260930 x86-64-v3" : "Proton Wineland 11.0-20260930 x86-64";
}
var RUN_COMMAND = "bash wolfsgate-cachyos.sh --yes";
var STORAGE_KEY = "wolfsgate-options";
function Home() {
	const [opts, setOpts] = (0, import_react.useState)(DEFAULT_OPTIONS);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [showScript, setShowScript] = (0, import_react.useState)(false);
	const [showPkg, setShowPkg] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) setOpts(sanitizeOptions(JSON.parse(raw)));
		} catch {}
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
	}, [opts, hydrated]);
	const script = (0, import_react.useMemo)(() => buildInstallScript(opts), [opts]);
	const pkgbuild = (0, import_react.useMemo)(() => buildPkgbuild(opts), [opts]);
	const launch = launchOptions(opts);
	const rows = features(opts.gpu);
	function patch(key, value) {
		setOpts((current) => ({
			...current,
			[key]: value
		}));
	}
	async function copy(id, text) {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(id);
			window.setTimeout(() => setCopied((current) => current === id ? null : current), 1600);
		} catch {
			setCopied(null);
		}
	}
	function download(filename, text) {
		const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 pt-8 pb-28 sm:px-6 lg:pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-line pb-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/favicon.svg",
							alt: "",
							width: 48,
							height: 48,
							className: "h-12 w-12"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-widest text-gold uppercase",
							children: "CachyOS · Steam · App 292030"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-4xl text-fg",
							children: "Wolfsgate"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 max-w-3xl text-lg text-fg",
						children: "The Witcher 3 Remastered ships DLSS 4.5, ray tracing, and path tracing, then hides them when it notices Wine. This package installs a Proton build that stops that check. The game files stay untouched."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-6 grid gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
								k: "Proton",
								v: "Wineland 11.0-20260930"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
								k: "Game edit",
								v: "None"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
								k: "Download",
								v: "About 360 MB, hash-checked"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 grid gap-6 lg:grid-cols-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "flex flex-col gap-5 rounded-card border border-line bg-surface p-4 sm:p-5 lg:col-span-2",
					onSubmit: (event) => event.preventDefault(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl text-fg",
							children: "Your machine"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
							label: "GPU",
							value: opts.gpu,
							onChange: (gpu) => patch("gpu", gpu),
							options: [
								{
									id: "nvidia",
									title: "NVIDIA",
									detail: "DLSS, frame generation, ray tracing"
								},
								{
									id: "amd",
									title: "AMD",
									detail: "FSR, ray tracing, path tracing"
								},
								{
									id: "intel",
									title: "Intel",
									detail: "Ray tracing and path tracing"
								}
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
							label: "Display GPU",
							value: opts.machine,
							onChange: (machine) => patch("machine", machine),
							options: [{
								id: "desktop",
								title: "Desktop",
								detail: "One graphics card"
							}, {
								id: "hybrid",
								title: "Laptop",
								detail: "Dedicated GPU plus an iGPU"
							}]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
							label: "CPU",
							value: opts.cpu,
							onChange: (cpu) => patch("cpu", cpu),
							options: [{
								id: "v3",
								title: "x86-64-v3",
								detail: "CachyOS default, needs AVX2"
							}, {
								id: "baseline",
								title: "Baseline",
								detail: "Older CPUs without AVX2"
							}]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
							label: "Steam",
							value: opts.steam,
							onChange: (steam) => patch("steam", steam),
							options: [{
								id: "native",
								title: "Native",
								detail: "steam from the CachyOS repos"
							}, {
								id: "flatpak",
								title: "Flatpak",
								detail: "com.valvesoftware.Steam"
							}]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-start gap-3 text-sm text-fg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								className: "mt-1 h-4 w-4 accent-gold",
								checked: opts.pin,
								onChange: (event) => patch("pin", event.target.checked)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Also select this Proton in Steam’s config. Steam must be fully quit, tray icon included. A backup of config.vdf is written first." })]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-5 lg:col-span-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-card border border-line bg-bg-raise p-4 sm:p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-xl text-fg",
								children: "What comes back"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: protonLabel(opts.cpu)
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, {
								className: "h-5 w-5 shrink-0 text-gold",
								"aria-hidden": true
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 divide-y divide-line",
							children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start justify-between gap-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium text-fg",
									children: row.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: row.detail
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatePill, { state: row.state })]
							}, row.name))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-card border border-gold bg-surface p-4 sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-xl text-fg",
								children: "Installer"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: "Save the script, quit Steam, then run it in a terminal. It downloads Proton Wineland from GitHub, checks the SHA512, and puts it in Steam’s compatibility tools. It does not replace proton-cachyos from the repos."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
								className: "mt-4 overflow-x-auto rounded-card bg-bg px-3 py-3 text-sm text-gold-2",
								children: RUN_COMMAND
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 hidden flex-wrap gap-3 lg:flex",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "inline-flex h-11 items-center gap-2 rounded-card bg-gold px-4 text-sm font-medium text-ink",
										onClick: () => download("wolfsgate-cachyos.sh", script),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
											className: "h-4 w-4",
											"aria-hidden": true
										}), "Download installer"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "inline-flex h-11 items-center gap-2 rounded-card border border-line px-4 text-sm text-fg",
										onClick: () => copy("cmd", RUN_COMMAND),
										children: [copied === "cmd" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" }), copied === "cmd" ? "Copied" : "Copy command"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "inline-flex h-11 items-center rounded-card border border-line px-4 text-sm text-fg",
										onClick: () => copy("script", script),
										children: copied === "script" ? "Copied" : "Copy script"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "mt-4 text-sm text-gold underline-offset-4 hover:underline",
								onClick: () => setShowScript((open) => !open),
								children: showScript ? "Hide script" : "Read the script"
							}),
							showScript ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
								className: "mt-3 max-h-80 overflow-auto rounded-card bg-bg p-3 text-xs leading-5 text-muted",
								children: script
							}) : null
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-card border border-line p-4 sm:p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl text-fg",
							children: "After the script"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
							className: "mt-4 flex list-decimal flex-col gap-3 pl-5 text-sm text-fg",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Quit Steam completely, including the tray icon, then open it again." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The Witcher 3 → Properties → Compatibility." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Force a specific Steam Play tool and choose Proton Wineland." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Launch once. If the options are still grey, paste the launch line below." })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 rounded-card bg-bg-raise p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs tracking-wide text-faint uppercase",
										children: "Launch options"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "inline-flex h-8 items-center gap-1 text-sm text-gold",
										onClick: () => copy("launch", launch.line),
										children: [copied === "launch" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" }), copied === "launch" ? "Copied" : "Copy"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
									className: "mt-2 overflow-x-auto text-sm text-gold-2",
									children: launch.line
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-muted",
									children: launch.note
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-card border border-line p-4 sm:p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl text-fg",
						children: "In the graphics menu"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-4 flex flex-col gap-3 text-sm text-fg",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: opts.gpu === "nvidia" ? "Set the upscaler to DLSS. Turn Ray Reconstruction on. Frame Generation only on RTX 40 and 50." : opts.gpu === "amd" ? "Use FSR. FSR 4 is for Radeon RX 7000 and newer; other cards stay on FSR 2. Frame generation should be listed again." : "Use XeSS if it is listed. Ray tracing should no longer be forced off." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Pick a ray-tracing preset, or enable path tracing on its own." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Every preset turns HairWorks back off. Set HairWorks after the preset if you want it." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Path-traced hair stays off. Proton does not expose the NVIDIA feature it needs." })
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 rounded-card border border-line bg-bg-raise p-4 sm:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl text-fg",
						children: "Why the menu lies"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-4 md:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reason, {
								title: "It asks for Wine",
								body: "witcher3.exe looks up wine_get_version in ntdll. Proton has that export. Windows does not."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reason, {
								title: "Streamline never starts",
								body: "On a hit, the game skips slInit. DLSS, Ray Reconstruction, frame generation, and Reflex all report as unsupported."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reason, {
								title: "Ray tracing is zeroed",
								body: "A cached “Wine” flag clears the ray-tracing capability, skips path-tracing shaders, and disables FSR frame generation."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-sm text-muted",
						children: "Wineland hides that export for witcher3.exe only, and it includes the vkd3d-proton fixes that keep ray tracing from hanging an NVIDIA GPU or crashing RADV. A game update does not undo it, because the executable is never patched."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl text-fg",
						children: "Known builds"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-3xl text-sm text-muted",
						children: "The installer still works if a later hotfix changes the exe, because it never matches bytes inside the file. These two are the builds the optional byte mod accepts. Anything else, the mod refuses."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 overflow-x-auto rounded-card border border-line",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[36rem] text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "bg-surface text-faint",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-3 font-medium",
										children: "Exe"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-3 font-medium",
										children: "Steam build"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-3 font-medium",
										children: "When"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-3 font-medium",
										children: "SHA256"
									})
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: BUILDS.map((build) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-line",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-3 font-medium text-fg",
										children: build.version
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-3 text-muted",
										children: build.steam
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-3 text-muted",
										children: build.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-3 font-mono text-xs text-muted",
										children: build.sha
									})
								]
							}, build.version)) })]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-card border border-line p-4 sm:p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl text-fg",
						children: "Native package"
					}), opts.steam === "flatpak" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "Flatpak Steam cannot see a system Proton under /usr/share. Use the installer above. Switch Steam to Native if you want a makepkg package instead."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-muted",
							children: "On native Steam you can build an Arch package instead of the user installer. It lands in /usr/share/steam/compatibilitytools.d. Quit Steam, then:"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "mt-3 overflow-x-auto rounded-card bg-bg px-3 py-3 text-sm text-gold-2",
							children: `mkdir -p wolfsgate && cd wolfsgate
# save the PKGBUILD here
makepkg -si`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-11 items-center gap-2 rounded-card border border-line px-4 text-sm text-fg",
								onClick: () => download("PKGBUILD", pkgbuild),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
									className: "h-4 w-4",
									"aria-hidden": true
								}), "Download PKGBUILD"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "text-sm text-gold underline-offset-4 hover:underline",
								onClick: () => setShowPkg((open) => !open),
								children: showPkg ? "Hide PKGBUILD" : "Read PKGBUILD"
							})]
						}),
						showPkg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "mt-3 max-h-64 overflow-auto rounded-card bg-bg p-3 text-xs leading-5 text-muted",
							children: pkgbuild
						}) : null
					] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-card border border-line p-4 sm:p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl text-ember",
							children: "Byte mod, only if you must"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-muted",
							children: "If you refuse to switch Proton, a public patch flips the same checks inside bin/x64_dx12/witcher3.exe. Use it only on the two builds above, and only with a vkd3d-proton that already has the ray-tracing fixes. GE-Proton 11-7 does not, and the game crashes at startup. Steam “Verify integrity of game files” puts the original back."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "mt-3 overflow-x-auto rounded-card bg-bg px-3 py-3 text-xs leading-5 text-gold-2",
							children: opts.gpu === "nvidia" ? "python3 w3_proton_patch.py --rt" : "python3 w3_proton_patch.py --rt-only"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "mt-3 inline-flex h-11 items-center text-sm text-gold underline-offset-4 hover:underline",
							href: "/w3_proton_patch.py",
							download: "w3_proton_patch.py",
							children: "Download w3_proton_patch.py"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-muted",
							children: "Editing the executable can conflict with the game’s EULA. It does not touch DRM. Wolfsgate’s recommended install never does this."
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 border-t border-line pt-6 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl text-fg",
						children: "Remove it"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2",
						children: "The installer records what it copied. It will not delete anything outside Steam’s compatibility tools folder."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "mt-3 overflow-x-auto text-sm text-gold-2",
						children: "bash wolfsgate-cachyos.sh --remove"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-6",
						children: [
							"Proton build by",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "text-gold underline-offset-4 hover:underline",
								href: RELEASE.page,
								children: "nanomatters / proton-cachyos"
							}),
							". The Wine check and the byte offsets are documented by gabrielmaialva33, with the 5.00c sites from d1g1talpump. This does not download the game, and it does not enable path-traced hair."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg-raise p-3 lg:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "inline-flex h-12 w-full items-center justify-center gap-2 rounded-card bg-gold text-sm font-medium text-ink",
					onClick: () => download("wolfsgate-cachyos.sh", script),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
						className: "h-4 w-4",
						"aria-hidden": true
					}), "Download installer"]
				})
			})
		]
	});
}
function Fact({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-card border border-line bg-bg-raise px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs tracking-wide text-faint uppercase",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-1 text-sm text-fg",
			children: v
		})]
	});
}
function Reason({ title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
		className: "text-base text-gold-2",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-1 text-sm text-muted",
		children: body
	})] });
}
function StatePill({ state }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `shrink-0 text-xs font-medium tracking-wide uppercase ${state === "yes" ? "text-ok" : state === "some" ? "text-gold" : "text-faint"}`,
		children: state === "yes" ? "On" : state === "some" ? "Partial" : "Off"
	});
}
function Choice({ label, value, options, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
		className: "text-xs tracking-wide text-faint uppercase",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-2 grid gap-2",
		role: "radiogroup",
		"aria-label": label,
		children: options.map((option) => {
			const selected = option.id === value;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "radio",
				"aria-checked": selected,
				onClick: () => onChange(option.id),
				className: `flex min-h-11 flex-col items-start rounded-card border px-3 py-2 text-left ${selected ? "border-gold bg-surface-2" : "border-line bg-bg-raise"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-medium text-fg",
					children: option.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: option.detail
				})]
			}, option.id);
		})
	})] });
}
//#endregion
export { Home as component };
