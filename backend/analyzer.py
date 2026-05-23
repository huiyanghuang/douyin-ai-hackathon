"""Video analysis pipeline: upload → Gemini File API → 2.5 Pro JSON output."""
from __future__ import annotations

import asyncio
import json
import logging
import random
import re
import time
import uuid
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types
from google.genai.errors import ServerError

from . import config
from .prompts import ANALYZE_SYSTEM_PROMPT
from .schemas import GEMINI_RESPONSE_SCHEMA
from .store import store

# Pro 高峰期会 503 UNAVAILABLE，Flash 用同一个 schema 走得通，做一次自动回落。
ANALYZE_FALLBACK_MODEL = "gemini-2.5-flash"

# 伪装成桌面 Chrome 124，绕过裸 HTTP 请求被各家平台风控直接拦截。
_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

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

        resp = await _generate_with_fallback(
            client,
            task_id,
            primary=config.MODEL_ANALYZE,
            fallback=ANALYZE_FALLBACK_MODEL,
            contents=[uploaded, "请解构这段科普视频"],
            gen_config=gen_config,
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


async def _generate_with_fallback(
    client: genai.Client,
    task_id: str,
    *,
    primary: str,
    fallback: str,
    contents: list,
    gen_config: types.GenerateContentConfig,
):
    """Pro 高峰期 503 时：先睡 5s 重试一次 Pro，再不行换 Flash。"""

    def _call(model: str):
        return client.models.generate_content(model=model, contents=contents, config=gen_config)

    # 第一次：Pro
    try:
        return await asyncio.to_thread(_call, primary)
    except ServerError as e:
        if getattr(e, "code", None) != 503:
            raise
        logger.warning("[%s] %s 503，5s 后重试一次", task_id, primary)

    await store.update(task_id, message=f"AI 服务高峰，{primary} 重试中...")
    await asyncio.sleep(5)

    # 第二次：Pro 再试
    try:
        return await asyncio.to_thread(_call, primary)
    except ServerError as e:
        if getattr(e, "code", None) != 503:
            raise
        logger.warning("[%s] %s 仍 503，回落到 %s", task_id, primary, fallback)

    # 第三次：Flash 兜底
    await store.update(task_id, message=f"切换到 {fallback} 兜底...")
    return await asyncio.to_thread(_call, fallback)


# URL 末尾常见的中英文句末标点，提取时一并剥掉。
# 不包含 / ? = & 这类 URL 合法字符。
_URL_TRAILING_PUNCT = ".,;:!?。，；：！？)）】〕」』"


def _extract_url(text: str) -> str:
    """从用户粘贴的文本里提取第一个 http(s):// 开头的 URL。

    设计目的：抖音/B站 App 的"复制分享"按钮生成的是带文案的整段字符串，例如
        '0.23 复制打开抖音，看看【XX的作品】... https://v.douyin.com/abc/ s@r.eO 05/20'
    yt-dlp 收到这种字符串会被 generic extractor 直接拒：
        'X is not a valid URL'
    错误发生在 HTTP 请求之前，412 重试 / fake buvid3 完全没机会跑。
    本函数在 yt_dlp_download 入口先把真正的 URL 摘出来。

    规则：
    - 用 re.search(r"https?://\\S+") 抓第一个 URL token（非空白即 URL 内容）
    - 末尾剥掉常见句末标点
    - 找不到时抛 ValueError，由调用方决定怎么报错
    """
    text = (text or "").strip()
    if not text:
        raise ValueError("输入为空")
    m = re.search(r"https?://\S+", text)
    if not m:
        raise ValueError(f"输入中没有 http/https 链接: {text[:80]}")
    return m.group(0).rstrip(_URL_TRAILING_PUNCT)


def _make_buvid3() -> str:
    """生成一枚伪造的 B站 buvid3 cookie 值。
    格式：XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXinfoc（全大写十六进制）。
    B站 412 拦截的核心是"无 buvid3 的裸请求"，给一个合法格式的值就能放行 ≈80%。
    """
    h = uuid.uuid4().hex.upper()
    return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}infoc"


def _get_platform_opts(url: str) -> dict:
    """根据 URL 域名返回平台特定的 yt-dlp 选项补丁。
    无状态——所有凭证只从 config（即环境变量）读取，不接受用户输入。
    将来要支持用户登录态时，在 API 路由层做 auth，这里保持纯净不动。
    """
    opts: dict[str, Any] = {
        "http_headers": {"User-Agent": _BROWSER_UA},
        "retries": 3,
        "fragment_retries": 3,
    }

    # ---------- BiliBili ----------
    if "bilibili.com" in url or "b23.tv" in url:
        opts["http_headers"]["Referer"] = "https://www.bilibili.com"
        opts["http_headers"]["Origin"] = "https://www.bilibili.com"
        if config.BILIBILI_COOKIES_FILE and config.BILIBILI_COOKIES_FILE.exists():
            # 方案 A：有真实 cookies 文件，登录态走，≈100% 成功
            opts["cookiefile"] = str(config.BILIBILI_COOKIES_FILE)
        else:
            # 方案 B：注入 fake buvid3，绕过 412 裸请求拦截，≈80% 成功
            opts["http_headers"]["Cookie"] = (
                f"buvid3={_make_buvid3()}; innersign=0; b_lsid=auto;"
            )

    # ---------- 抖音 ----------
    elif "douyin.com" in url or "iesdouyin.com" in url:
        opts["http_headers"]["Referer"] = "https://www.douyin.com"
        if config.DOUYIN_COOKIES_FILE and config.DOUYIN_COOKIES_FILE.exists():
            opts["cookiefile"] = str(config.DOUYIN_COOKIES_FILE)
        # 无 cookies 文件时不强行注入——抖音短链接通常不需要登录态

    # ---------- YouTube ----------
    elif "youtube.com" in url or "youtu.be" in url:
        if config.YOUTUBE_COOKIES_FILE and config.YOUTUBE_COOKIES_FILE.exists():
            opts["cookiefile"] = str(config.YOUTUBE_COOKIES_FILE)
        # 无 cookies 时 yt-dlp 默认 YouTube 提取器已足够

    return opts


async def yt_dlp_download(url: str, out_dir: Path) -> Path:
    """Best-effort download via yt-dlp.
    遇到 B站 412 时换新 buvid3 最多重试 3 次；其他平台错误立即抛出。

    入口先调 _extract_url 把粘贴文案里的真 URL 摘出来——抖音/B站 的"复制
    分享"按钮会带一长串文案，直接给 yt-dlp 会被 generic extractor 拒掉。
    """
    import yt_dlp  # heavy import, do it lazily

    # 先把真 URL 摘出来（_extract_url 会抛 ValueError 如果连 URL 都没有）
    url = _extract_url(url)
    logger.info("[yt-dlp] extracted url: %s", url)

    out_dir.mkdir(parents=True, exist_ok=True)
    outtmpl = str(out_dir / "%(id)s.%(ext)s")

    def _do() -> str:
        def _attempt(extra_cookie: str | None = None) -> str:
            base_opts: dict[str, Any] = {
                "outtmpl": outtmpl,
                "format": "best[ext=mp4]/best",
                "quiet": True,
                "no_warnings": True,
                "noprogress": True,
                "max_filesize": config.MAX_UPLOAD_BYTES,
            }
            platform_patch = _get_platform_opts(url)
            # 二次/三次重试时换一个新的 buvid3 注进 Cookie header
            if extra_cookie:
                platform_patch.setdefault("http_headers", {})["Cookie"] = extra_cookie
            opts = {**base_opts, **platform_patch}

            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
                if "requested_downloads" in info and info["requested_downloads"]:
                    return info["requested_downloads"][0]["filepath"]
                return ydl.prepare_filename(info)

        # 最多 3 次尝试（首次 + 2 次 412 重试）
        last_err: Exception | None = None
        for attempt in range(3):
            try:
                return _attempt(
                    extra_cookie=(
                        f"buvid3={_make_buvid3()}; innersign=0; b_lsid=auto;"
                        if attempt > 0
                        else None
                    )
                )
            except yt_dlp.utils.DownloadError as e:
                last_err = e
                msg = str(e)
                if "412" in msg or "Precondition Failed" in msg:
                    if attempt < 2:
                        wait = random.uniform(1.0, 3.0)
                        logger.warning(
                            "[yt-dlp] 412 拦截，第 %d 次重试，等 %.1fs",
                            attempt + 1,
                            wait,
                        )
                        time.sleep(wait)
                        continue
                raise
        assert last_err is not None
        raise last_err

    fp_str = await asyncio.to_thread(_do)
    fp = Path(fp_str)
    if not fp.exists():
        raise RuntimeError(f"download finished but file missing: {fp}")
    return fp
