"""Video analysis pipeline: upload → Gemini File API → 2.5 Pro JSON output."""
from __future__ import annotations

import asyncio
import http.cookiejar
import json
import logging
import os
import random
import re
import tempfile
import time
import urllib.request
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


def _make_ttwid() -> str:
    """生成一枚伪造的抖音 ttwid cookie 值。
    格式：1|<base64_id>|<unix_ts>|<base64_hash>
    真 ttwid 服务端 HMAC 校验签名，假值通过率约 30-50%，但比裸请求好。
    要 ≈100% 通过率需要导出真实浏览器 cookies 到 DOUYIN_COOKIES_FILE。
    """
    import base64
    rand1 = base64.urlsafe_b64encode(uuid.uuid4().bytes).rstrip(b"=").decode()
    rand2 = base64.urlsafe_b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes).rstrip(b"=").decode()
    return f"1|{rand1}|{int(time.time())}|{rand2}"


def _make_retry_cookie(url: str) -> str | None:
    """重试时生成新一份 fake cookie；返回 None 表示该平台无需 cookie 重试。"""
    if "bilibili.com" in url or "b23.tv" in url:
        return f"buvid3={_make_buvid3()}; innersign=0; b_lsid=auto;"
    if "douyin.com" in url or "iesdouyin.com" in url:
        return (
            f"ttwid={_make_ttwid()}; "
            f"passport_csrf_token={uuid.uuid4().hex}; "
            f"odin_tt={uuid.uuid4().hex}{uuid.uuid4().hex}; "
        )
    return None


def _bootstrap_session_cookies(url: str) -> str | None:
    """先用真浏览器 headers 访问平台首页，让对方主动 Set-Cookie 给我们 anonymous
    anti-bot cookies（ttwid/buvid3/...），存到 temp Netscape cookies.txt 返回。

    Why: yt-dlp 抖音 extractor 报错 "Fresh cookies (not necessarily logged in)
    are needed"——它从 cookiejar 读 cookie，不读 http_headers["Cookie"]，所以
    我们之前塞 fake header 的方案对 extractor 不可见。访问首页是最稳妥的拿真
    cookies 方式（首页本来就是 anonymous 设计，不需要登录）。

    Returns: temp cookies file path（调用方负责 unlink），None 表示首页访问失败。
    """
    if "douyin.com" in url or "iesdouyin.com" in url:
        homepage = "https://www.douyin.com/"
    elif "bilibili.com" in url or "b23.tv" in url:
        homepage = "https://www.bilibili.com/"
    else:
        return None

    fd, cookie_path = tempfile.mkstemp(suffix=".cookies.txt", prefix="dyhk_yt_")
    os.close(fd)

    jar = http.cookiejar.MozillaCookieJar(cookie_path)
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    opener.addheaders = [
        ("User-Agent", _BROWSER_UA),
        ("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"),
        ("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8"),
        ("Sec-Fetch-Dest", "document"),
        ("Sec-Fetch-Mode", "navigate"),
        ("Sec-Fetch-Site", "none"),
        ("Upgrade-Insecure-Requests", "1"),
    ]
    try:
        with opener.open(homepage, timeout=15) as resp:
            resp.read(4096)  # 读一点让 Set-Cookie 完成处理
        n = len(list(jar))
        if n == 0:
            logger.warning("[yt-dlp] homepage %s set no cookies", homepage)
            try:
                os.unlink(cookie_path)
            except OSError:
                pass
            return None
        jar.save(ignore_discard=True, ignore_expires=True)
        logger.info("[yt-dlp] bootstrapped %d cookies from %s -> %s", n, homepage, cookie_path)
        return cookie_path
    except Exception as e:  # noqa: BLE001
        logger.warning("[yt-dlp] bootstrap cookies failed for %s: %s", homepage, e)
        try:
            os.unlink(cookie_path)
        except OSError:
            pass
        return None


def _get_platform_opts(url: str, bootstrap_cookies_path: str | None = None) -> dict:
    """根据 URL 域名返回平台特定的 yt-dlp 选项补丁。

    cookies 三级回落：
    1) 用户配置的 *_COOKIES_FILE（最稳，登录态 ≈100%）
    2) 本进程访问首页 bootstrap 的 anonymous cookies（中等，extractor 实际能读）
    3) fake Cookie HTTP header（最次，extractor 经常不读它，所以兜底意义有限）

    bootstrap_cookies_path 由上层 yt_dlp_download 一次性 bootstrap 后传进来。
    """
    opts: dict[str, Any] = {
        "http_headers": {"User-Agent": _BROWSER_UA},
        "retries": 3,
        "fragment_retries": 3,
    }

    # ---------- BiliBili ----------
    if "bilibili.com" in url or "b23.tv" in url:
        # 光发 Referer + Origin 还不够：B站 412 也看 Accept-Language / Sec-Fetch-*
        # 等"是不是真浏览器"信号。把全套 Chrome 桌面 headers 发齐。
        opts["http_headers"].update({
            "Referer": "https://www.bilibili.com/",
            "Origin": "https://www.bilibili.com",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        })
        opts["socket_timeout"] = 30
        opts["extractor_retries"] = 5
        if config.BILIBILI_COOKIES_FILE and config.BILIBILI_COOKIES_FILE.exists():
            opts["cookiefile"] = str(config.BILIBILI_COOKIES_FILE)
        elif bootstrap_cookies_path:
            # 真 anonymous cookies 来自 bilibili.com 首页，yt-dlp extractor 能读
            opts["cookiefile"] = bootstrap_cookies_path
        else:
            # bootstrap 失败时的最次兜底
            opts["http_headers"]["Cookie"] = (
                f"buvid3={_make_buvid3()}; innersign=0; b_lsid=auto;"
            )

    # ---------- 抖音 ----------
    elif "douyin.com" in url or "iesdouyin.com" in url:
        # 模仿真实 Chrome 桌面浏览器：anti-bot 看的不只是 UA，还有 Accept-*/Sec-Fetch-*
        opts["http_headers"].update({
            "Referer": "https://www.douyin.com/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        })
        opts["socket_timeout"] = 30
        opts["extractor_retries"] = 5
        if config.DOUYIN_COOKIES_FILE and config.DOUYIN_COOKIES_FILE.exists():
            opts["cookiefile"] = str(config.DOUYIN_COOKIES_FILE)
        elif bootstrap_cookies_path:
            # 真 anonymous cookies 来自 douyin.com 首页，extractor "Fresh cookies needed" 满足
            opts["cookiefile"] = bootstrap_cookies_path
        else:
            # bootstrap 失败时的最次兜底（已知 extractor 多半不读这条）
            opts["http_headers"]["Cookie"] = (
                f"ttwid={_make_ttwid()}; "
                f"passport_csrf_token={uuid.uuid4().hex}; "
                f"odin_tt={uuid.uuid4().hex}{uuid.uuid4().hex}; "
            )

    # ---------- YouTube ----------
    elif "youtube.com" in url or "youtu.be" in url:
        if config.YOUTUBE_COOKIES_FILE and config.YOUTUBE_COOKIES_FILE.exists():
            opts["cookiefile"] = str(config.YOUTUBE_COOKIES_FILE)
        # YouTube 在视频流 URL 上加了 n-参数 JS 挑战，必须用 EJS solver 跑 deno 才能拿到
        # 真实下载 URL。yt-dlp 默认不自动下 solver 脚本（安全），这里显式启用 GitHub 源。
        # 前置依赖：服务器装了 deno（/usr/local/bin/deno）和 ffmpeg（合并分离视频/音频流）。
        opts["remote_components"] = {"ejs:github"}

    return opts


async def yt_dlp_download(url: str, out_dir: Path) -> Path:
    """Best-effort download via yt-dlp.
    遇到 B站 412 时换新 buvid3 最多重试 3 次；其他平台错误立即抛出。

    入口先调 _extract_url 把粘贴文案里的真 URL 摘出来——抖音/B站 的"复制
    分享"按钮会带一长串文案，直接给 yt-dlp 会被 generic extractor 拒掉。

    然后再访问平台首页 bootstrap anonymous anti-bot cookies（ttwid/buvid3/...），
    传给 yt-dlp 的 cookiefile——extractor 报 "Fresh cookies needed" 时它就是
    在抱怨 cookiejar 是空的，单塞 HTTP header 不管用。
    """
    import yt_dlp  # heavy import, do it lazily

    # 先把真 URL 摘出来（_extract_url 会抛 ValueError 如果连 URL 都没有）
    url = _extract_url(url)
    logger.info("[yt-dlp] extracted url: %s", url)

    out_dir.mkdir(parents=True, exist_ok=True)
    outtmpl = str(out_dir / "%(id)s.%(ext)s")

    # Bootstrap anonymous cookies once per request；用户配了 *_COOKIES_FILE 就跳过
    bootstrap_cookies_path: str | None = None
    is_bili = "bilibili.com" in url or "b23.tv" in url
    is_douyin = "douyin.com" in url or "iesdouyin.com" in url
    has_user_bili = bool(config.BILIBILI_COOKIES_FILE and config.BILIBILI_COOKIES_FILE.exists())
    has_user_douyin = bool(config.DOUYIN_COOKIES_FILE and config.DOUYIN_COOKIES_FILE.exists())
    needs_bootstrap = (is_bili and not has_user_bili) or (is_douyin and not has_user_douyin)
    if needs_bootstrap:
        bootstrap_cookies_path = await asyncio.to_thread(_bootstrap_session_cookies, url)

    # 抖音特殊处理：海外机房 IP（如 Vultr）访问 douyin.com 不下发 anti-bot cookies，
    # bootstrap 会返回 None。直接进 yt-dlp 只会得到晦涩的 "Fresh cookies needed"，
    # 不如这里 fail-fast，给前端一条人能看懂的提示。
    if is_douyin and not has_user_douyin and bootstrap_cookies_path is None:
        raise RuntimeError(
            "抖音从本服务器无法匿名访问（海外机房 IP 被 anti-bot 拦截）。"
            "请联系管理员上传 cookies.txt 并配置 DOUYIN_COOKIES_FILE 环境变量"
        )

    def _do() -> str:
        def _attempt(extra_cookie: str | None = None) -> str:
            base_opts: dict[str, Any] = {
                "outtmpl": outtmpl,
                # 三级回落：单 mp4 文件（最小，无需合并）→ adaptive 视频+音频 ffmpeg 合并 → yt-dlp 默认 best
                # B站只提供分离的 video/audio adaptive 流，没单 mp4，必须走第二级
                "format": "best[ext=mp4][acodec!=none]/bv*+ba/best",
                "merge_output_format": "mp4",
                "quiet": True,
                "no_warnings": True,
                "noprogress": True,
                "max_filesize": config.MAX_UPLOAD_BYTES,
            }
            platform_patch = _get_platform_opts(url, bootstrap_cookies_path)
            # 二次/三次重试时换一个新的 buvid3 注进 Cookie header（作为 cookiefile 之外的额外提示）
            if extra_cookie:
                platform_patch.setdefault("http_headers", {})["Cookie"] = extra_cookie
            opts = {**base_opts, **platform_patch}

            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
                if "requested_downloads" in info and info["requested_downloads"]:
                    return info["requested_downloads"][0]["filepath"]
                return ydl.prepare_filename(info)

        # 最多 3 次尝试（首次 + 2 次 anti-bot 重试），按平台轮换 fake cookie
        last_err: Exception | None = None
        for attempt in range(3):
            try:
                return _attempt(
                    extra_cookie=_make_retry_cookie(url) if attempt > 0 else None
                )
            except yt_dlp.utils.DownloadError as e:
                last_err = e
                # 海外服务器 IP 跑 B站/抖音 anti-bot 失败信号五花八门：412 / 403 /
                # JSON 解析失败 / Unable to extract / Sign in needed / Fresh cookies needed。
                # 干脆：只要是这两个平台的 yt-dlp DownloadError，统一当作 anti-bot 处理。
                is_bilibili_block = "bilibili.com" in url or "b23.tv" in url
                is_douyin_block = "douyin.com" in url or "iesdouyin.com" in url
                if (is_bilibili_block or is_douyin_block) and attempt < 2:
                    wait = random.uniform(1.0, 3.0)
                    platform = "B站 412" if is_bilibili_block else "抖音 anti-bot"
                    logger.warning(
                        "[yt-dlp] %s 拦截，第 %d 次重试，等 %.1fs",
                        platform,
                        attempt + 1,
                        wait,
                    )
                    time.sleep(wait)
                    continue
                # 重试耗尽：把晦涩的 yt-dlp 错误包成清楚的中文，提示走 cookies 文件
                if is_bilibili_block:
                    raise RuntimeError(
                        "B站 anti-bot 拦截。海外机房 IP 即便发完整浏览器请求也常被拦"
                        "（包括 412 / JSON 解析失败等变种）。"
                        "请管理员在 B站登录后导出 cookies.txt 配置 BILIBILI_COOKIES_FILE 环境变量"
                    ) from e
                if is_douyin_block:
                    raise RuntimeError(
                        "抖音 anti-bot 拦截。"
                        "请管理员在抖音登录后导出 cookies.txt 配置 DOUYIN_COOKIES_FILE 环境变量"
                    ) from e
                raise
        assert last_err is not None
        raise last_err

    try:
        fp_str = await asyncio.to_thread(_do)
    finally:
        if bootstrap_cookies_path:
            try:
                os.unlink(bootstrap_cookies_path)
            except OSError:
                pass
    fp = Path(fp_str)
    if not fp.exists():
        raise RuntimeError(f"download finished but file missing: {fp}")
    return fp
