# Wolfsgate AppImage

Launchable desktop build of the Wolfsgate GUI for CachyOS and other Linux systems.

The file you run is `Wolfsgate-x86_64.AppImage` in the repository root, and the same file is attached to the GitHub release.

```bash
chmod +x Wolfsgate-x86_64.AppImage
./Wolfsgate-x86_64.AppImage
```

A window opens in your browser. Quit Steam first, including the tray icon, pick the GPU, then press Install. The game executable is not modified.

Needs `python3` and `xdg-open`, both present on CachyOS. If FUSE is missing:

```bash
./Wolfsgate-x86_64.AppImage --appimage-extract-and-run
```

Rebuild from this directory with `./build-appimage.sh` after installing appimagetool.
