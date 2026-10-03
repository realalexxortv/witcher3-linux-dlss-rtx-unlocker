#!/bin/bash
# Build Wolfsgate-x86_64.AppImage from the packaging directory.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
APP="$HERE/Wolfsgate.AppDir"
TOOL="${APPIMAGETOOL:-/tmp/appimage-tools/appimagetool-x86_64.AppImage}"
OUT="${1:-$ROOT/dist/Wolfsgate-x86_64.AppImage}"

rm -rf "$APP"
mkdir -p "$APP/usr/bin" "$APP/usr/share/wolfsgate"
sed \
  -e 's/__DEFAULT_GPU__/nvidia/' \
  -e 's/__DEFAULT_MACHINE__/desktop/' \
  -e 's/__DEFAULT_CPU__/v3/' \
  -e 's/__DEFAULT_STEAM__/native/' \
  -e 's/__DEFAULT_PIN__/0/' \
  "$ROOT/src/lib/wolfsgate.sh" > "$APP/usr/bin/wolfsgate"
cp "$HERE/server.py" "$HERE/index.html" "$APP/usr/share/wolfsgate/"
python3 "$HERE/make_icon.py" "$APP/wolfsgate.png"
cp "$APP/wolfsgate.png" "$APP/.DirIcon"
cat > "$APP/wolfsgate.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=Wolfsgate
Comment=Unlock DLSS and path tracing in The Witcher 3 Remastered
Exec=AppRun
Icon=wolfsgate
Categories=Utility;
Terminal=false
EOF
cat > "$APP/AppRun" << 'EOF'
#!/bin/sh
HERE="$(dirname "$(readlink -f "$0")")"
export WOLFSGATE_HERE="$HERE"
if ! command -v python3 >/dev/null 2>&1; then
  echo "Wolfsgate needs python3. On CachyOS: sudo pacman -S python" >&2
  exit 1
fi
exec python3 -u "$HERE/usr/share/wolfsgate/server.py"
EOF
chmod 755 "$APP/AppRun" "$APP/usr/bin/wolfsgate" "$APP/usr/share/wolfsgate/server.py"

mkdir -p "$(dirname "$OUT")"
export ARCH=x86_64
export APPIMAGE_EXTRACT_AND_RUN=1
"$TOOL" "$APP" "$OUT"
chmod 755 "$OUT"
echo "Built $OUT"
