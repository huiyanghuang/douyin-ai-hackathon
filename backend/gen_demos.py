"""Pre-generate demo cache. Run once per demo video; writes/merges into demos.json.

Usage:
  py gen_demos.py <video_path> <demo_id> <title>
"""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

from analyzer import analyze_video
from config import DEMOS_FILE
from store import store


async def main(video_path: str, demo_id: str, title: str) -> None:
    p = Path(video_path)
    assert p.exists(), f"missing {p}"

    task_id = f"gen_{demo_id}"
    await store.create(task_id)
    await analyze_video(task_id, p)

    snap = await store.get(task_id)
    if not snap or snap["stage"] != "done":
        print("FAILED:", snap)
        sys.exit(1)

    item = {
        "id": demo_id,
        "title": title,
        "thumb": None,
        "cached_result": snap["result"],
    }

    existing: list[dict] = []
    if DEMOS_FILE.exists():
        try:
            existing = json.loads(DEMOS_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existing = []
    existing = [d for d in existing if d.get("id") != demo_id]
    existing.append(item)
    DEMOS_FILE.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved demo {demo_id!r}: {item['cached_result'].get('title')}")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("usage: py gen_demos.py <video_path> <demo_id> <title>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1], sys.argv[2], sys.argv[3]))
