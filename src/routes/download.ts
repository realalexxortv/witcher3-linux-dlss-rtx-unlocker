import { createFileRoute } from "@tanstack/react-router";
import { buildInstallScript, sanitizeOptions, type Cpu, type Dlss5Gpu, type Gpu, type Machine, type SteamKind } from "@/lib/wolfsgate";

export const Route = createFileRoute("/download")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const script = buildInstallScript(
          sanitizeOptions({
            gpu: url.searchParams.get("gpu") as Gpu,
            machine: url.searchParams.get("machine") as Machine,
            cpu: url.searchParams.get("cpu") as Cpu,
            steam: url.searchParams.get("steam") as SteamKind,
            pin: url.searchParams.get("pin") === "1",
            dlss5: url.searchParams.get("dlss5") === "1",
            dlss5Gpu: url.searchParams.get("dlss5Gpu") as Dlss5Gpu,
          }),
        );
        return new Response(script, {
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": 'attachment; filename="wolfsgate"',
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
