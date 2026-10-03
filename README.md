Unlocks DLSS, Ray Tracing and Pathtracing for Linux Witcher 3 Remaster (Steam).

## **Installation:**
1. Quit Steam fully, also from tray.
2. Go to releases and Download the Appimage.
3. Launch Appimage (it opens in Browser).
4. In most cases you can keep the settings as are, or change according to your needs.
5. Click Install.
6. Launch Steam
7. Witcher 3 Remaster -> Right Click -> Compatibility -> Choose Proton Wineland
8. Launch options: PROTON_ENABLE_NVAPI=1 %command% --launcher-skip
9. Launch game, have fun.

DLSS 5 can be installed from the same window.

## DLSS 5
Tick **Also install DLSS 5** in the window before Install. NVIDIA cards only.

- RTX 50 uses NVIDIA's signed `nvngx_dlssnr.dll` 310.8.0.
- RTX 20, 30, and 40 use the Lecram build. It is not the signed file.
- The installer also places the RenoDX DLSS 5 add-on and ReShade 6.8.0 next to `witcher3.exe`. The game executable is not modified. Replaced files are backed up.
- Paste the launch options the window prints. With DLSS 5 they include `WINEDLLOVERRIDES="dxgi=n,b"`.
- In the game, turn DLSS on, then press Home if ReShade opens.
- Remove restores the backups.

This is not a CDPR feature. It costs frames.

100% vibecoded in Grok.
