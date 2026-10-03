#!/usr/bin/env python3
"""Write a 256px Wolfsgate icon. No image libraries."""
import struct
import sys
import zlib


def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def pixel(x, y):
    cx, cy, r = 128, 128, 108
    dx, dy = x - cx, y - cy
    dist = (dx * dx + dy * dy) ** 0.5
    if dist > 120:
        return (16, 12, 9, 0)
    if 96 <= dist <= 104:
        return (198, 161, 90, 255)
    # Two ears and a chevron, gold on umber.
    gold = False
    if y < 118 and abs(x - 96) < 18 and y > 70 + abs(x - 96):
        gold = True
    if y < 118 and abs(x - 160) < 18 and y > 70 + abs(x - 160):
        gold = True
    if 130 < y < 168 and abs(x - 128) < (y - 118):
        gold = True
    if gold:
        return (198, 161, 90, 255)
    return (16, 12, 9, 255)


def main():
    size = 256
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            raw.extend(pixel(x, y))
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(sys.argv[1], "wb") as handle:
        handle.write(png)


if __name__ == "__main__":
    main()
