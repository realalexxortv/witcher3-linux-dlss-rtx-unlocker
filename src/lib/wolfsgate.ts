import scriptTemplate from "./wolfsgate.sh?raw";

export type Gpu = "nvidia" | "amd" | "intel";
export type Machine = "desktop" | "hybrid";
export type Cpu = "v3" | "baseline";
export type SteamKind = "native" | "flatpak";

export type Options = {
  gpu: Gpu;
  machine: Machine;
  cpu: Cpu;
  steam: SteamKind;
  pin: boolean;
};

export const DEFAULT_OPTIONS: Options = {
  gpu: "nvidia",
  machine: "desktop",
  cpu: "v3",
  steam: "native",
  pin: false,
};

const GPUS: Gpu[] = ["nvidia", "amd", "intel"];
const MACHINES: Machine[] = ["desktop", "hybrid"];
const CPUS: Cpu[] = ["v3", "baseline"];
const STEAMS: SteamKind[] = ["native", "flatpak"];

const SHA_V3 =
  "85cb18030a352fdd36f6d85c6f425a48c87620cddb14946ba1da04ff92de4aa69dadf29c43631d586563f13832c48334fe8f9ecac69bf77f815f346615847d3e";
const SHA_BASE =
  "e54a4c5dd2485e285eda91fc07eea6358ced549c38b08d60df994752bbd0940314a99b1dab28d1a71bd1fb8b7a23653d8d8873720b6a653de2a820772b347655";

export const RELEASE = {
  tag: "wineland-11.0-20260930",
  page: "https://github.com/nanomatters/proton-cachyos/releases/tag/wineland-11.0-20260930",
};

export const BUILDS = [
  {
    version: "5.0.0.1044392",
    steam: "25646871",
    label: "5.00c hotfix · 1 Oct 2026",
    sha: "9406eccc12b68e08920931442ef6a57340e910d3e01f2082e88232487433fe51",
  },
  {
    version: "5.0.0.1041720",
    steam: "25575366",
    label: "Remastered launch · 29 Sep 2026",
    sha: "c272b2c2e61f84c758e28fab69ab2915944dd1e539dbb435fae9fc67494c7e25",
  },
] as const;

export type FeatureState = "yes" | "no" | "some";

export type Feature = {
  name: string;
  state: FeatureState;
  detail: string;
};

function isGpu(value: string): value is Gpu {
  return GPUS.includes(value as Gpu);
}
function isMachine(value: string): value is Machine {
  return MACHINES.includes(value as Machine);
}
function isCpu(value: string): value is Cpu {
  return CPUS.includes(value as Cpu);
}
function isSteam(value: string): value is SteamKind {
  return STEAMS.includes(value as SteamKind);
}

export function sanitizeOptions(input: Partial<Options> | null | undefined): Options {
  return {
    gpu: input?.gpu && isGpu(input.gpu) ? input.gpu : DEFAULT_OPTIONS.gpu,
    machine: input?.machine && isMachine(input.machine) ? input.machine : DEFAULT_OPTIONS.machine,
    cpu: input?.cpu && isCpu(input.cpu) ? input.cpu : DEFAULT_OPTIONS.cpu,
    steam: input?.steam && isSteam(input.steam) ? input.steam : DEFAULT_OPTIONS.steam,
    pin: Boolean(input?.pin),
  };
}

export function archiveName(cpu: Cpu): string {
  return cpu === "v3"
    ? "proton-wineland-11.0-20260930-x86_64_v3.tar.xz"
    : "proton-wineland-11.0-20260930-x86_64.tar.xz";
}

export function archiveSha(cpu: Cpu): string {
  return cpu === "v3" ? SHA_V3 : SHA_BASE;
}

export function buildInstallScript(input: Options): string {
  const o = sanitizeOptions(input);
  const script = scriptTemplate
    .replaceAll("__DEFAULT_GPU__", o.gpu)
    .replaceAll("__DEFAULT_MACHINE__", o.machine)
    .replaceAll("__DEFAULT_CPU__", o.cpu)
    .replaceAll("__DEFAULT_STEAM__", o.steam)
    .replaceAll("__DEFAULT_PIN__", o.pin ? "1" : "0");
  if (script.includes("__DEFAULT_")) {
    throw new Error("Installer template still has placeholders");
  }
  return script;
}

export function buildPkgbuild(input: Options): string {
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

export function launchOptions(input: Options): { line: string; note: string } {
  const o = sanitizeOptions(input);
  if (o.machine === "hybrid" && o.gpu === "nvidia") {
    return {
      line: "PROTON_ENABLE_NVAPI=1 VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json __NV_PRIME_RENDER_OFFLOAD=1 __VK_LAYER_NV_optimus=NVIDIA_only %command%",
      note: "Paste this. With an iGPU left visible, the remaster picks the weak GPU, locks the low preset, and hides ray tracing again.",
    };
  }
  if (o.machine === "hybrid" && o.gpu === "amd") {
    return {
      line: "PROTON_DISABLE_NVAPI=1 VK_DRIVER_FILES=/usr/share/vulkan/icd.d/radeon_icd.json VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/radeon_icd.json %command%",
      note: "Paste this so Vulkan only sees the Radeon. Wineland already disables NVAPI when the GPU is not NVIDIA.",
    };
  }
  if (o.machine === "hybrid" && o.gpu === "intel") {
    return {
      line: "PROTON_DISABLE_NVAPI=1 VK_DRIVER_FILES=/usr/share/vulkan/icd.d/intel_icd.json %command%",
      note: "Paste this so the game does not bind the wrong GPU.",
    };
  }
  if (o.gpu === "nvidia") {
    return {
      line: "PROTON_ENABLE_NVAPI=1 %command%",
      note: "Leave launch options empty at first. Wineland already enables NVAPI on NVIDIA. Paste this only if DLSS stays grey.",
    };
  }
  return {
    line: "PROTON_DISABLE_NVAPI=1 %command%",
    note: "Leave launch options empty at first. If startup crashes and Mesa Anti-Lag is installed, add DISABLE_LAYER_MESA_ANTI_LAG=1 in front of %command%.",
  };
}

export function features(gpu: Gpu): Feature[] {
  if (gpu === "nvidia") {
    return [
      { name: "DLSS Super Resolution", state: "yes", detail: "RTX 20 series and newer" },
      { name: "DLSS Ray Reconstruction", state: "yes", detail: "DLSS 4.5, with the remaster" },
      { name: "DLSS Frame Generation", state: "some", detail: "RTX 40 and 50 only" },
      { name: "NVIDIA Reflex", state: "yes", detail: "Comes back with Streamline" },
      { name: "Ray tracing", state: "yes", detail: "Needs this Proton’s vkd3d-proton" },
      { name: "Path tracing", state: "yes", detail: "PC-only mode in the remaster" },
      { name: "Path-traced hair", state: "no", detail: "Needs Linear Swept Spheres, which Proton does not report" },
    ];
  }
  if (gpu === "amd") {
    return [
      { name: "FSR upscaling", state: "yes", detail: "FSR 4 on RX 7000 and newer, otherwise FSR 2" },
      { name: "FSR frame generation", state: "yes", detail: "Hidden while the game thinks it is under Wine" },
      { name: "Ray tracing", state: "yes", detail: "RADV shader fix is in this Proton" },
      { name: "Path tracing", state: "yes", detail: "Reported stable on RX 6000 and 7000" },
      { name: "DLSS", state: "no", detail: "NVIDIA only. Do not force it with OptiScaler here" },
      { name: "Path-traced hair", state: "no", detail: "Unavailable under Proton" },
    ];
  }
  return [
    { name: "Ray tracing", state: "yes", detail: "Same Wine check as AMD, without the DLSS patches" },
    { name: "Path tracing", state: "yes", detail: "Selectable once Wine is hidden" },
    { name: "XeSS", state: "some", detail: "May appear. Treat frame generation as untested" },
    { name: "DLSS", state: "no", detail: "NVIDIA only" },
    { name: "Path-traced hair", state: "no", detail: "Unavailable under Proton" },
  ];
}

export function protonLabel(cpu: Cpu): string {
  return cpu === "v3" ? "Proton Wineland 11.0-20260930 x86-64-v3" : "Proton Wineland 11.0-20260930 x86-64";
}

export const RUN_COMMAND = "bash wolfsgate-cachyos.sh --yes";
