#!/usr/bin/env python3
"""Append extra dsh-pet clips to the runtime asset set without re-importing.

`import_dshpet_webm.py` rebuilds every clip and recomputes the canvas crop,
which would shift the alignment of the frames already shipped. This tool
encodes new clips with the crop recorded in the current manifest and appends
them, so existing frames stay byte-identical.

Usage:
    python scripts/add_dshpet_clips.py \
        --source ../dsh-pet/dsh-pet/assets/webm \
        --ffmpeg /opt/homebrew/bin --out . \
        --clip idle_hum=悠闲哼歌.webm --clip idle_mirror=照镜子.webm \
        --micro idle_hum --micro idle_mirror
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

FPS = 24
FRAME_MS = 42


def run(command: list[str]) -> None:
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"command failed ({result.returncode}): {' '.join(command)}\n{result.stderr[-2000:]}")


def encode(ffmpeg: Path, cwebp: Path, source: Path, crop: list[int], target: Path) -> list[Path]:
    # Homebrew ffmpeg ships without libwebp here, so decode to PNG and encode
    # each frame with cwebp using the quality the import script used.
    target.mkdir(parents=True, exist_ok=True)
    run([
        str(ffmpeg), "-v", "error", "-c:v", "libvpx-vp9", "-i", str(source),
        "-vf", f"fps={FPS},crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]}",
        f"{target}/frame_%03d.png",
    ])
    frames = []
    for png in sorted(target.glob("frame_*.png")):
        webp = png.with_suffix(".webp")
        run([str(cwebp), "-quiet", "-q", "68", "-m", "4", str(png), "-o", str(webp)])
        png.unlink()
        frames.append(webp)
    return frames


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--ffmpeg", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--clip", action="append", required=True,
                        help="key=source.webm[:startSec,endSec][:loop]")
    parser.add_argument("--micro", action="append", default=[],
                        help="clip key to add to the idle micro rotation")
    args = parser.parse_args()

    ffmpeg = args.ffmpeg / "ffmpeg"
    if not ffmpeg.exists():
        ffmpeg = args.ffmpeg / "ffmpeg.exe"
    cwebp = args.ffmpeg / "cwebp"
    root = args.out.resolve()
    pet_root = root / "assets" / "pet"
    manifest_path = root / "assets" / "pet-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    crop = manifest["assetSource"]["crop"]

    for spec in args.clip:
        key, _, rest = spec.partition("=")
        parts = rest.split(":")
        name = parts[0]
        window = None
        loop = False
        if len(parts) >= 2 and parts[1]:
            start, end = parts[1].split(",")
            window = (float(start), float(end))
        if len(parts) >= 3 and parts[2] == "loop":
            loop = True
        if key in manifest["clips"]:
            print(f"skip {key}: already present", file=sys.stderr)
            continue
        source = args.source / name
        if not source.exists():
            print(f"missing source: {source}", file=sys.stderr)
            return 1
        temp = pet_root / f"_tmp_{key}"
        shutil.rmtree(temp, ignore_errors=True)
        encoded = encode(ffmpeg, cwebp, source, crop, temp)
        start = int(round((window[0] if window else 0.0) * FPS))
        end = int(round(window[1] * FPS)) if window else len(encoded)
        end = min(end, len(encoded))
        clip_dir = pet_root / key
        shutil.rmtree(clip_dir, ignore_errors=True)
        clip_dir.mkdir(parents=True)
        frames = []
        for index, frame in enumerate(encoded[start:end], start=1):
            target = clip_dir / f"{key}_{index:03d}.webp"
            shutil.copyfile(frame, target)
            frames.append(f"{key}/{target.name}")
        shutil.rmtree(temp, ignore_errors=True)
        manifest["clips"][key] = {
            "frames": frames, "frameMs": FRAME_MS, "loop": loop,
            "source": {
                "file": name,
                "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                "startFrame": start, "endFrame": end, "frameCount": len(encoded),
            },
        }
        size_kb = sum(p.stat().st_size for p in clip_dir.glob("*.webp")) // 1024
        print(f"clip {key}: {len(frames)} frames, {size_kb} KB, loop={loop}")

    micros = manifest.get("idleMicroClips", [])
    for key in args.micro:
        if key not in micros:
            micros.append(key)
    manifest["idleMicroClips"] = micros
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    total = sum(p.stat().st_size for p in pet_root.rglob("*.webp")) // (1024 * 1024)
    print(f"manifest written; idleMicroClips={micros}; total {total} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
