"""第三方视频平台搜索（目前接 B 站）。

实测路径（验证可行）：
  1. GET https://www.bilibili.com/  → 拿到合法 cookies（buvid3 等）
  2. 用同一 session GET https://api.bilibili.com/x/web-interface/search/type?...
  3. 不需要 wbi 签名（旧 API 仍能正常返回）

注意：
  - cookies session 要 warmup 一次，之后可以复用
  - 风控偶发，加 try/except 不让 recommend 整体失败
  - 不爬抖音 web API（status_code 2483 强制登录）
"""
from __future__ import annotations

import asyncio
import logging
import re
from typing import Any
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
_HTML_TAG_RE = re.compile(r"<[^>]+>")


class BilibiliClient:
    """异步 B 站搜索 client，进程级单例。"""

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            headers={
                "User-Agent": _UA,
                "Referer": "https://www.bilibili.com/",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "zh-CN,zh;q=0.9",
            },
            timeout=httpx.Timeout(6.0, connect=4.0),
            follow_redirects=True,
        )
        self._warmed = False
        self._lock = asyncio.Lock()

    async def _warmup(self) -> None:
        async with self._lock:
            if self._warmed:
                return
            try:
                r = await self._client.get("https://www.bilibili.com/")
                logger.info("bilibili warmup: HTTP %s, %d cookies", r.status_code, len(self._client.cookies.jar))
            except Exception as e:  # noqa: BLE001
                logger.warning("bilibili warmup failed (ok to proceed without): %s", e)
            finally:
                # 无论成功失败都标记，避免 N 个并发任务都重试 warmup 拖慢 pipeline
                self._warmed = True

    async def search(self, keyword: str, n: int = 5) -> list[dict[str, Any]]:
        if not keyword:
            return []
        await self._warmup()
        params = {
            "search_type": "video",
            "keyword": keyword,
            "page": 1,
            "page_size": n,
            "order": "totalrank",
        }
        try:
            r = await self._client.get(
                "https://api.bilibili.com/x/web-interface/search/type",
                params=params,
                # Referer 必须 ASCII 安全；中文 keyword 要先 URL encode 否则 httpx 报错
                headers={"Referer": f"https://search.bilibili.com/all?keyword={quote(keyword)}"},
            )
            r.raise_for_status()
            data = r.json()
        except Exception as e:  # noqa: BLE001
            logger.warning("bilibili search '%s' failed: %s", keyword, e)
            return []

        if data.get("code") != 0:
            logger.info("bilibili search '%s' returned code=%s msg=%s", keyword, data.get("code"), data.get("message"))
            return []

        results = (data.get("data") or {}).get("result") or []
        out: list[dict[str, Any]] = []
        for item in results[:n]:
            title = _HTML_TAG_RE.sub("", item.get("title") or "").strip()
            if not title:
                continue
            cover = item.get("pic") or ""
            if cover and not cover.startswith("http"):
                cover = "https:" + cover
            arcurl = item.get("arcurl") or (
                f"https://www.bilibili.com/video/{item['bvid']}" if item.get("bvid") else ""
            )
            out.append({
                "title": title,
                "url": arcurl,
                "bvid": item.get("bvid"),
                "cover": cover,
                "author": item.get("author") or "",
                "view": int(item.get("play") or 0),
                "duration": item.get("duration") or "",
                "description": (item.get("description") or "")[:200],
            })
        return out

    async def close(self) -> None:
        await self._client.aclose()


_bili_client: BilibiliClient | None = None


def get_bilibili_client() -> BilibiliClient:
    global _bili_client
    if _bili_client is None:
        _bili_client = BilibiliClient()
    return _bili_client


async def search_bilibili(keyword: str, n: int = 5) -> list[dict[str, Any]]:
    """便捷入口。"""
    return await get_bilibili_client().search(keyword, n)
