#!/usr/bin/env python3
"""Local GUI for the Wolfsgate AppImage. Binds to 127.0.0.1 only."""
import json
import os
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = os.environ["WOLFSGATE_HERE"]
INSTALLER = os.path.join(ROOT, "usr", "bin", "wolfsgate")
INDEX = os.path.join(ROOT, "usr", "share", "wolfsgate", "index.html")

ALLOWED = {
    "gpu": {"nvidia", "amd", "intel"},
    "machine": {"desktop", "hybrid"},
    "cpu": {"v3", "baseline"},
    "steam": {"native", "flatpak"},
}

log_lock = threading.Lock()
log_lines = []
proc = None
proc_lock = threading.Lock()


def append(line):
    with log_lock:
        log_lines.append(line)
        if len(log_lines) > 2000:
            del log_lines[:400]


def drain(child):
    if child.stdout is not None:
        for line in child.stdout:
            append(line.rstrip("\n"))
    code = child.wait()
    append(f"[finished, exit {code}]")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def _send(self, code, body, content_type):
        data = body if isinstance(body, bytes) else body.encode()
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/", "/index.html"):
            with open(INDEX, "rb") as handle:
                self._send(200, handle.read(), "text/html; charset=utf-8")
            return
        if path == "/log":
            with log_lock:
                text = "\n".join(log_lines)
            with proc_lock:
                running = proc is not None and proc.poll() is None
                code = None if proc is None or running else proc.returncode
            payload = json.dumps({"log": text, "running": running, "code": code})
            self._send(200, payload, "application/json")
            return
        self._send(404, "not found", "text/plain; charset=utf-8")

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw = self.rfile.read(length) if length else b"{}"
        if path == "/install":
            self.start(raw, remove=False)
            return
        if path == "/remove":
            self.start(raw, remove=True)
            return
        if path == "/quit":
            threading.Thread(target=self.server.shutdown, daemon=True).start()
            self._send(200, '{"ok":true}', "application/json")
            return
        self._send(404, "not found", "text/plain; charset=utf-8")

    def start(self, raw, remove):
        global proc
        try:
            body = json.loads(raw.decode() or "{}")
        except json.JSONDecodeError:
            self._send(400, '{"error":"bad json"}', "application/json")
            return
        if not isinstance(body, dict):
            self._send(400, '{"error":"bad json"}', "application/json")
            return
        args = [INSTALLER]
        if remove:
            args.append("--remove")
        else:
            for key, allowed in ALLOWED.items():
                value = body.get(key, "")
                if value not in allowed:
                    self._send(400, json.dumps({"error": "bad " + key}), "application/json")
                    return
                args.extend(["--" + key, value])
            args.append("--pin" if body.get("pin") else "--no-pin")
            if body.get("dlss5"):
                if body.get("gpu") != "nvidia":
                    self._send(400, '{"error":"dlss5 needs nvidia"}', "application/json")
                    return
                generation = body.get("dlss5Gpu", "50")
                if generation not in {"50", "40"}:
                    self._send(400, '{"error":"bad dlss5 gpu"}', "application/json")
                    return
                args.extend(["--dlss5", "--dlss5-gpu", generation])
            else:
                args.append("--no-dlss5")
        args.append("--yes")
        with proc_lock:
            if proc is not None and proc.poll() is None:
                self._send(409, '{"error":"already running"}', "application/json")
                return
            with log_lock:
                log_lines.clear()
            append("$ " + " ".join(args[1:]))
            child = subprocess.Popen(
                args,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )
            proc = child
            threading.Thread(target=drain, args=(child,), daemon=True).start()
        self._send(200, '{"ok":true}', "application/json")


def open_browser(url):
    try:
        subprocess.Popen(["xdg-open", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except OSError:
        print("Open this address in a browser:", url)


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    host, port = server.server_address
    url = f"http://{host}:{port}/"
    print("Wolfsgate is open at", url, flush=True)
    print("Leave this running. Use Quit in the window when you are done.", flush=True)
    threading.Timer(0.4, open_browser, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
