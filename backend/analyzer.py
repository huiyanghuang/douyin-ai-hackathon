"""Video analysis pipeline: upload → Gemini File API → 2.5 Pro JSON output."""
from __future__ import annotations

import asyncio
import json
import logging
import time
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types

from . import config
from .prompts import ANALYZE_SYSTEM_PROMPT
from .schemas import GEMINI_RESPONSE_SCHEMA
from .store import store

logger = logging.getLogger(__name__)


def _client() -> genai.Client:
    return genai.Client(api_key=config.GEMINI_API_KEY)


async def analyze_video(task_id: str, video_path: Path) -> None:
    """Drive the full pipeline, pushing progress to the store. Never raises."""
    client = _client()
    uploaded_name: str | None = None
    try:
        await store.update(task_id, stage="uploading", percent=10, message="正在上传视频到 AI...")
        logger.info("[%s] upload start: %s (%.1f KB)", task_id, video_path, video_path.stat().st_size / 1024)

        uploaded = await asyncio.to_thread(client.files.upload, file=str(video_path))
        uploaded_name = uploaded.name
        logger.info("[%s] uploaded: %s state=%s", task_id, uploaded.name, uploaded.state)

        await store.update(task_id, stage="uploading", percent=25, message="视频上传完成，等待 AI 准备...")

        # poll until ACTIVE
        t0 = time.time()
        while uploaded.state and uploaded.state.name == "PROCESSING":
            if time.time() - t0 > 180:
                raise RuntimeError("Gemini File API processing timed out (>180s)")
            await asyncio.sleep(2)
            uploaded = await asyncio.to_thread(client.files.get, name=uploaded.name)
            logger.info("[%s] poll: state=%s", task_id, uploaded.state.name if uploaded.state else "?")

        if uploaded.state and uploaded.state.name != "ACTIVE":
            err = getattr(uploaded, "error", None)
            raise RuntimeError(f"Gemini File API failed: state={uploaded.state.name} err={err}")

        await store.update(task_id, stage="analyzing", percent=40, message="AI 正在理解视频内容...")

        gen_config = types.GenerateContentConfig(
            system_instruction=ANALYZE_SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=GEMINI_RESPONSE_SCHEMA,
            temperature=0.4,
        )

        resp = await asyncio.to_thread(
            client.models.generate_content,
            model=config.MODEL_ANALYZE,
            contents=[uploaded, "请解构这段科普视频"],
            config=gen_config,
        )

        await store.update(task_id, stage="structuring", percent=80, message="正在构建知识图谱...")

        raw = resp.text
        if not raw:
            raise RuntimeError("Gemini returned empty response")
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as e:
            logger.error("[%s] non-JSON response (first 500): %r", task_id, raw[:500])
            raise RuntimeError(f"Gemini response was not valid JSON: {e}") from e

        await store.update(task_id, stage="done", percent=100, message="完成", result=parsed)
        logger.info("[%s] done in %.1fs, title=%r", task_id, time.time() - t0, parsed.get("title"))

    except Exception as e:  # noqa: BLE001
        logger.exception("[%s] analyze failed", task_id)
        await store.update(task_id, stage="error", percent=0, message=str(e), error=str(e))
    finally:
        if uploaded_name:
            try:
                await asyncio.to_thread(client.files.delete, name=uploaded_name)
            except Exception as e:  # noqa: BLE001
                logger.warning("[%s] cleanup remote file failed: %s", task_id, e)
        try:
            if video_path.exists():
                video_path.unlink()
        except OSError as e:
            logger.warning("[%s] cleanup local file failed: %s", task_id, e)


async def yt_dlp_download(url: str, out_dir: Path) -> Path:
    """Best-effort download via yt-dlp. Returns the downloaded file path or raises."""
    import yt_dlp  # heavy import, do it lazily

    out_dir.mkdir(parents=True, exist_ok=True)
    outtmpl = str(out_dir / "%(id)s.%(ext)s")

    def _do() -> str:
        ydl_opts = {
            "outtmpl": outtmpl,
            "format": "best[ext=mp4]/best",
            "quiet": True,
            "no_warnings": True,
            "noprogress": True,
            "max_filesize": config.MAX_UPLOAD_BYTES,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            if "requested_downloads" in info and info["requested_downloads"]:
                return info["requested_downloads"][0]["filepath"]
            return ydl.prepare_filename(info)

    fp_str = await asyncio.to_thread(_do)
    fp = Path(fp_str)
    if not fp.exists():
        raise RuntimeError(f"download finished but file missing: {fp}")
    return fp
