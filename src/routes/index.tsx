import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Shield } from "lucide-react";
import {
  BUILDS,
  DEFAULT_OPTIONS,
  RELEASE,
  RUN_COMMAND,
  type Cpu,
  type FeatureState,
  type Gpu,
  type Machine,
  type Options,
  type SteamKind,
  buildInstallScript,
  buildPkgbuild,
  features,
  launchOptions,
  protonLabel,
  sanitizeOptions,
} from "@/lib/wolfsgate";

export const Route = createFileRoute("/")({ component: Home });

const STORAGE_KEY = "wolfsgate-options";

function Home() {
  const [opts, setOpts] = useState<Options>(DEFAULT_OPTIONS);
  const [hydrated, setHydrated] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [showPkg, setShowPkg] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOpts(sanitizeOptions(JSON.parse(raw) as Partial<Options>));
    } catch {
      /* keep defaults */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
  }, [opts, hydrated]);

  const script = useMemo(() => buildInstallScript(opts), [opts]);
  const pkgbuild = useMemo(() => buildPkgbuild(opts), [opts]);
  const launch = launchOptions(opts);
  const rows = features(opts.gpu);

  function patch<K extends keyof Options>(key: K, value: Options[K]) {
    setOpts((current) => ({ ...current, [key]: value }));
  }

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1600);
    } catch {
      setCopied(null);
    }
  }

  function download(filename: string, text: string) {
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

  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-28 sm:px-6 lg:pb-16">
      <header className="border-b border-line pb-8">
        <div className="flex items-center gap-4">
          <img src="/favicon.svg" alt="" width={48} height={48} className="h-12 w-12" />
          <div>
            <p className="text-xs font-medium tracking-widest text-gold uppercase">
              CachyOS · Steam · App 292030
            </p>
            <h1 className="text-4xl text-fg">Wolfsgate</h1>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-lg text-fg">
          The Witcher 3 Remastered ships DLSS 4.5, ray tracing, and path tracing, then hides them
          when it notices Wine. This package installs a Proton build that stops that check. The game
          files stay untouched.
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <Fact k="Proton" v="Wineland 11.0-20260930" />
          <Fact k="Game edit" v="None" />
          <Fact k="Download" v="About 360 MB, hash-checked" />
        </dl>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-5">
        <form
          className="flex flex-col gap-5 rounded-card border border-line bg-surface p-4 sm:p-5 lg:col-span-2"
          onSubmit={(event) => event.preventDefault()}
        >
          <h2 className="text-xl text-fg">Your machine</h2>
          <Choice
            label="GPU"
            value={opts.gpu}
            onChange={(gpu) => patch("gpu", gpu)}
            options={[
              { id: "nvidia", title: "NVIDIA", detail: "DLSS, frame generation, ray tracing" },
              { id: "amd", title: "AMD", detail: "FSR, ray tracing, path tracing" },
              { id: "intel", title: "Intel", detail: "Ray tracing and path tracing" },
            ]}
          />
          <Choice
            label="Display GPU"
            value={opts.machine}
            onChange={(machine) => patch("machine", machine)}
            options={[
              { id: "desktop", title: "Desktop", detail: "One graphics card" },
              { id: "hybrid", title: "Laptop", detail: "Dedicated GPU plus an iGPU" },
            ]}
          />
          <Choice
            label="CPU"
            value={opts.cpu}
            onChange={(cpu) => patch("cpu", cpu)}
            options={[
              { id: "v3", title: "x86-64-v3", detail: "CachyOS default, needs AVX2" },
              { id: "baseline", title: "Baseline", detail: "Older CPUs without AVX2" },
            ]}
          />
          <Choice
            label="Steam"
            value={opts.steam}
            onChange={(steam) => patch("steam", steam)}
            options={[
              { id: "native", title: "Native", detail: "steam from the CachyOS repos" },
              { id: "flatpak", title: "Flatpak", detail: "com.valvesoftware.Steam" },
            ]}
          />
          <label className="flex items-start gap-3 text-sm text-fg">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-gold"
              checked={opts.pin}
              onChange={(event) => patch("pin", event.target.checked)}
            />
            <span>
              Also select this Proton in Steam’s config. Steam must be fully quit, tray icon
              included. A backup of config.vdf is written first.
            </span>
          </label>
        </form>

        <div className="flex flex-col gap-5 lg:col-span-3">
          <section className="rounded-card border border-line bg-bg-raise p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl text-fg">What comes back</h2>
                <p className="mt-1 text-sm text-muted">{protonLabel(opts.cpu)}</p>
              </div>
              <Shield className="h-5 w-5 shrink-0 text-gold" aria-hidden />
            </div>
            <ul className="mt-4 divide-y divide-line">
              {rows.map((row) => (
                <li key={row.name} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-fg">{row.name}</p>
                    <p className="text-sm text-muted">{row.detail}</p>
                  </div>
                  <StatePill state={row.state} />
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-card border border-gold bg-surface p-4 sm:p-5">
            <h2 className="text-xl text-fg">Installer</h2>
            <p className="mt-2 text-sm text-muted">
              Save the script, quit Steam, then run it in a terminal. It downloads Proton Wineland
              from GitHub, checks the SHA512, and puts it in Steam’s compatibility tools. It does
              not replace proton-cachyos from the repos.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-card bg-bg px-3 py-3 text-sm text-gold-2">
              {RUN_COMMAND}
            </pre>
            <div className="mt-4 hidden flex-wrap gap-3 lg:flex">
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-card bg-gold px-4 text-sm font-medium text-ink"
                onClick={() => download("wolfsgate-cachyos.sh", script)}
              >
                <Download className="h-4 w-4" aria-hidden />
                Download installer
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-card border border-line px-4 text-sm text-fg"
                onClick={() => copy("cmd", RUN_COMMAND)}
              >
                {copied === "cmd" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "cmd" ? "Copied" : "Copy command"}
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center rounded-card border border-line px-4 text-sm text-fg"
                onClick={() => copy("script", script)}
              >
                {copied === "script" ? "Copied" : "Copy script"}
              </button>
            </div>
            <button
              type="button"
              className="mt-4 text-sm text-gold underline-offset-4 hover:underline"
              onClick={() => setShowScript((open) => !open)}
            >
              {showScript ? "Hide script" : "Read the script"}
            </button>
            {showScript ? (
              <pre className="mt-3 max-h-80 overflow-auto rounded-card bg-bg p-3 text-xs leading-5 text-muted">
                {script}
              </pre>
            ) : null}
          </section>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="rounded-card border border-line p-4 sm:p-5">
          <h2 className="text-xl text-fg">After the script</h2>
          <ol className="mt-4 flex list-decimal flex-col gap-3 pl-5 text-sm text-fg">
            <li>Quit Steam completely, including the tray icon, then open it again.</li>
            <li>The Witcher 3 → Properties → Compatibility.</li>
            <li>Force a specific Steam Play tool and choose Proton Wineland.</li>
            <li>Launch once. If the options are still grey, paste the launch line below.</li>
          </ol>
          <div className="mt-4 rounded-card bg-bg-raise p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs tracking-wide text-faint uppercase">Launch options</p>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1 text-sm text-gold"
                onClick={() => copy("launch", launch.line)}
              >
                {copied === "launch" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "launch" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="mt-2 overflow-x-auto text-sm text-gold-2">{launch.line}</pre>
            <p className="mt-2 text-sm text-muted">{launch.note}</p>
          </div>
        </article>

        <article className="rounded-card border border-line p-4 sm:p-5">
          <h2 className="text-xl text-fg">In the graphics menu</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-fg">
            <li>
              {opts.gpu === "nvidia"
                ? "Set the upscaler to DLSS. Turn Ray Reconstruction on. Frame Generation only on RTX 40 and 50."
                : opts.gpu === "amd"
                  ? "Use FSR. FSR 4 is for Radeon RX 7000 and newer; other cards stay on FSR 2. Frame generation should be listed again."
                  : "Use XeSS if it is listed. Ray tracing should no longer be forced off."}
            </li>
            <li>Pick a ray-tracing preset, or enable path tracing on its own.</li>
            <li>Every preset turns HairWorks back off. Set HairWorks after the preset if you want it.</li>
            <li>Path-traced hair stays off. Proton does not expose the NVIDIA feature it needs.</li>
          </ul>
        </article>
      </section>

      <section className="mt-10 rounded-card border border-line bg-bg-raise p-4 sm:p-5">
        <h2 className="text-xl text-fg">Why the menu lies</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Reason
            title="It asks for Wine"
            body="witcher3.exe looks up wine_get_version in ntdll. Proton has that export. Windows does not."
          />
          <Reason
            title="Streamline never starts"
            body="On a hit, the game skips slInit. DLSS, Ray Reconstruction, frame generation, and Reflex all report as unsupported."
          />
          <Reason
            title="Ray tracing is zeroed"
            body="A cached “Wine” flag clears the ray-tracing capability, skips path-tracing shaders, and disables FSR frame generation."
          />
        </div>
        <p className="mt-4 text-sm text-muted">
          Wineland hides that export for witcher3.exe only, and it includes the vkd3d-proton fixes
          that keep ray tracing from hanging an NVIDIA GPU or crashing RADV. A game update does not
          undo it, because the executable is never patched.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl text-fg">Known builds</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          The installer still works if a later hotfix changes the exe, because it never matches
          bytes inside the file. These two are the builds the optional byte mod accepts. Anything
          else, the mod refuses.
        </p>
        <div className="mt-4 overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-surface text-faint">
              <tr>
                <th className="px-3 py-3 font-medium">Exe</th>
                <th className="px-3 py-3 font-medium">Steam build</th>
                <th className="px-3 py-3 font-medium">When</th>
                <th className="px-3 py-3 font-medium">SHA256</th>
              </tr>
            </thead>
            <tbody>
              {BUILDS.map((build) => (
                <tr key={build.version} className="border-t border-line">
                  <td className="px-3 py-3 font-medium text-fg">{build.version}</td>
                  <td className="px-3 py-3 text-muted">{build.steam}</td>
                  <td className="px-3 py-3 text-muted">{build.label}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted">{build.sha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="rounded-card border border-line p-4 sm:p-5">
          <h2 className="text-xl text-fg">Native package</h2>
          {opts.steam === "flatpak" ? (
            <p className="mt-3 text-sm text-muted">
              Flatpak Steam cannot see a system Proton under /usr/share. Use the installer above.
              Switch Steam to Native if you want a makepkg package instead.
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted">
                On native Steam you can build an Arch package instead of the user installer. It
                lands in /usr/share/steam/compatibilitytools.d. Quit Steam, then:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-card bg-bg px-3 py-3 text-sm text-gold-2">
                {`mkdir -p wolfsgate && cd wolfsgate
# save the PKGBUILD here
makepkg -si`}
              </pre>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-card border border-line px-4 text-sm text-fg"
                  onClick={() => download("PKGBUILD", pkgbuild)}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Download PKGBUILD
                </button>
                <button
                  type="button"
                  className="text-sm text-gold underline-offset-4 hover:underline"
                  onClick={() => setShowPkg((open) => !open)}
                >
                  {showPkg ? "Hide PKGBUILD" : "Read PKGBUILD"}
                </button>
              </div>
              {showPkg ? (
                <pre className="mt-3 max-h-64 overflow-auto rounded-card bg-bg p-3 text-xs leading-5 text-muted">
                  {pkgbuild}
                </pre>
              ) : null}
            </>
          )}
        </article>

        <article className="rounded-card border border-line p-4 sm:p-5">
          <h2 className="text-xl text-ember">Byte mod, only if you must</h2>
          <p className="mt-3 text-sm text-muted">
            If you refuse to switch Proton, a public patch flips the same checks inside
            bin/x64_dx12/witcher3.exe. Use it only on the two builds above, and only with a
            vkd3d-proton that already has the ray-tracing fixes. GE-Proton 11-7 does not, and the
            game crashes at startup. Steam “Verify integrity of game files” puts the original back.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-card bg-bg px-3 py-3 text-xs leading-5 text-gold-2">
            {opts.gpu === "nvidia"
              ? "python3 w3_proton_patch.py --rt"
              : "python3 w3_proton_patch.py --rt-only"}
          </pre>
          <a
            className="mt-3 inline-flex h-11 items-center text-sm text-gold underline-offset-4 hover:underline"
            href="/w3_proton_patch.py"
            download="w3_proton_patch.py"
          >
            Download w3_proton_patch.py
          </a>
          <p className="mt-3 text-sm text-muted">
            Editing the executable can conflict with the game’s EULA. It does not touch DRM.
            Wolfsgate’s recommended install never does this.
          </p>
        </article>
      </section>

      <section className="mt-10 border-t border-line pt-6 text-sm text-muted">
        <h2 className="text-xl text-fg">Remove it</h2>
        <p className="mt-2">
          The installer records what it copied. It will not delete anything outside Steam’s
          compatibility tools folder.
        </p>
        <pre className="mt-3 overflow-x-auto text-sm text-gold-2">bash wolfsgate-cachyos.sh --remove</pre>
        <p className="mt-6">
          Proton build by{" "}
          <a className="text-gold underline-offset-4 hover:underline" href={RELEASE.page}>
            nanomatters / proton-cachyos
          </a>
          . The Wine check and the byte offsets are documented by gabrielmaialva33, with the 5.00c
          sites from d1g1talpump. This does not download the game, and it does not enable
          path-traced hair.
        </p>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg-raise p-3 lg:hidden">
        <button
          type="button"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-card bg-gold text-sm font-medium text-ink"
          onClick={() => download("wolfsgate-cachyos.sh", script)}
        >
          <Download className="h-4 w-4" aria-hidden />
          Download installer
        </button>
      </div>
    </main>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-card border border-line bg-bg-raise px-3 py-3">
      <dt className="text-xs tracking-wide text-faint uppercase">{k}</dt>
      <dd className="mt-1 text-sm text-fg">{v}</dd>
    </div>
  );
}

function Reason({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-base text-gold-2">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}

function StatePill({ state }: { state: FeatureState }) {
  const label = state === "yes" ? "On" : state === "some" ? "Partial" : "Off";
  const tone =
    state === "yes" ? "text-ok" : state === "some" ? "text-gold" : "text-faint";
  return <span className={`shrink-0 text-xs font-medium tracking-wide uppercase ${tone}`}>{label}</span>;
}

function Choice<T extends Gpu | Machine | Cpu | SteamKind>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; title: string; detail: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs tracking-wide text-faint uppercase">{label}</legend>
      <div className="mt-2 grid gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={`flex min-h-11 flex-col items-start rounded-card border px-3 py-2 text-left ${
                selected ? "border-gold bg-surface-2" : "border-line bg-bg-raise"
              }`}
            >
              <span className="text-sm font-medium text-fg">{option.title}</span>
              <span className="text-xs text-muted">{option.detail}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
