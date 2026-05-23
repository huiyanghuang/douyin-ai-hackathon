"""「猜你想看」：

流程：
  1. 视频分析结果 → Gemini 抽 3-5 个延伸关键词
  2. 对每个关键词：
     a. 调 B 站搜索拿 top 5 候选
     b. Gemini 评分 (0-100)：哪个候选最契合 + 该关键词在抖音是否值得搜
     c. B 站 score >= THRESHOLD 才保留视频卡片；否则只保留搜索跳转
     d. 抖音 worth_searching=True 才保留跳转入口
  3. B 站 / 抖音都被剔除的关键词 → 丢弃整条

  全程异步，5 个关键词的"搜 + 评分"并发执行。
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any
from urllib.parse import quote

from google import genai
from google.genai import types

from . import config
from .search import search_bilibili

logger = logging.getLogger(__name__)

KEYWORD_SYSTEM_PROMPT = """你是「猜你想看」推荐器。下面是用户刚看完的一段视频的结构化分析（JSON）。

任务：抽 3-5 个「用户看完这条之后可能想接着搜的关键词」。

要求：
- 不要直接复述 title 原句，要提取「用户接下来可能想探索的下一个问题 / 主题」
- 中文，每个 2-8 字，适合在 B 站 / 抖音搜索框里输入
- 优先选择：视频里提到但没展开的衍生概念、follow_up_questions 里出现的、key_concepts 关联但不是主角的
- 避免：过于宽泛（如「物理」「科学」），过于具体（如「2019 年 EHT 望远镜首张照片」）

只输出 JSON 数组，例如 ["事件视界望远镜", "引力波探测", "白洞", "霍金辐射观测"]。
"""

SCORE_SYSTEM_PROMPT = """你是视频推荐评分员。下面给你：
  - 一个搜索关键词（用户想了解的延伸主题）
  - 视频原始主题（用来判断关键词在哪个语境下被解读）
  - B 站搜索返回的 5 个候选视频标题（按平台默认排序）

任务：
  1. 从 5 个候选里挑出最匹配该关键词且最契合视频原始语境的 1 个（best_index 从 0 开始）
  2. 给一个 0-100 的匹配分数 bilibili_score
  3. 判断该关键词在抖音上是否大概率能搜到优质相关视频（短视频/娱乐类 yes，长视频/学术类多半 no）
     输出 boolean: douyin_worth_search

只输出 JSON，严格 schema：
{
  "best_index": 0,
  "bilibili_score": 78,
  "douyin_worth_search": true,
  "reason": "一句话解释"
}

匹配分数标准：
  90-100 = 几乎就是同一主题的精品讲解
  70-89  = 主题相符，内容质量大致合适
  50-69  = 沾边但角度偏（比如科普关键词搜到电影解读）
  0-49   = 完全跑题（同名其他领域，比如「黑洞」搜到 ASMR、电影解读）
"""

SCORE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "best_index": {"type": "integer", "minimum": 0, "maximum": 4},
        "bilibili_score": {"type": "integer", "minimum": 0, "maximum": 100},
        "douyin_worth_search": {"type": "boolean"},
        "reason": {"type": "string"},
    },
    "required": ["best_index", "bilibili_score", "douyin_worth_search"],
}

BILI_SCORE_THRESHOLD = 60  # >= 才显示 B 站视频卡片，否则只保留搜索跳转
_FALLBACK_KW_LIMIT = 5


_GEMINI_CLIENT: genai.Client | None = None
def _client() -> genai.Client:
    """模块级单例，避免每次新建 client 的 SSL/连接池开销。"""
    global _GEMINI_CLIENT
    if _GEMINI_CLIENT is None:
        _GEMINI_CLIENT = genai.Client(api_key=config.GEMINI_API_KEY)
    return _GEMINI_CLIENT


# ----------------------------------------------------------------------
# Step 1: 抽关键词
# ----------------------------------------------------------------------
def _local_fallback_keywords(analysis: dict[str, Any]) -> list[str]:
    kws: list[str] = []
    seen: set[str] = set()
    for q in (analysis.get("follow_up_questions") or [])[:3]:
        q = (q or "").strip().rstrip("？?。.").strip()
        if 2 <= len(q) <= 16 and q not in seen:
            kws.append(q); seen.add(q)
    for c in (analysis.get("key_concepts") or [])[:6]:
        name = (c.get("name") or "").strip()
        if 2 <= len(name) <= 12 and name not in seen:
            kws.append(name); seen.add(name)
        if len(kws) >= _FALLBACK_KW_LIMIT:
            break
    return kws[:_FALLBACK_KW_LIMIT] or ["科普视频"]


def _gemini_keywords(analysis: dict[str, Any]) -> list[str]:
    client = _client()
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[json.dumps(analysis, ensure_ascii=False)],
        config=types.GenerateContentConfig(
            system_instruction=KEYWORD_SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema={
                "type": "array",
                "items": {"type": "string"},
                "minItems": 3,
                "maxItems": 5,
            },
            temperature=0.6,
        ),
    )
    raw = (resp.text or "").strip()
    if not raw:
        raise RuntimeError("Gemini returned empty keywords")
    arr = json.loads(raw)
    if not isinstance(arr, list):
        raise RuntimeError("Gemini didn't return an array")
    kws = [str(x).strip() for x in arr if str(x).strip()]
    return kws[:5] if kws else _local_fallback_keywords(analysis)


# ----------------------------------------------------------------------
# Step 2: Gemini 评分（关键词 + 5 个候选标题 → best_index + score + 抖音判断）
# ----------------------------------------------------------------------
def _gemini_score(
    keyword: str,
    video_topic: str,
    candidates: list[dict[str, Any]],
) -> dict[str, Any] | None:
    if not candidates:
        return None
    titles_block = "\n".join(
        f"{i}. {c['title']}  (UP: {c.get('author', '?')}, 播放: {c.get('view', 0)})"
        for i, c in enumerate(candidates)
    )
    prompt = (
        f"关键词：{keyword}\n"
        f"视频原始主题：{video_topic or '(未知)'}\n\n"
        f"候选视频（前 {len(candidates)} 个 B 站搜索结果）：\n{titles_block}"
    )
    client = _client()
    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
            config=types.GenerateContentConfig(
                system_instruction=SCORE_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=SCORE_SCHEMA,
                temperature=0.3,
            ),
        )
        return json.loads((resp.text or "").strip())
    except Exception as e:  # noqa: BLE001
        logger.warning("gemini score for '%s' failed: %s", keyword, e)
        return None


# ----------------------------------------------------------------------
# Step 3: 单关键词管线（搜 B 站 + 评分）
# ----------------------------------------------------------------------
async def _process_keyword(keyword: str, video_topic: str) -> dict[str, Any] | None:
    bili_candidates = await search_bilibili(keyword, n=5)
    score: dict[str, Any] | None = None
    if bili_candidates:
        try:
            # Gemini API 偶发卡住（一直 200 不返回），给单个评分 15s 死线，
            # 超时就当评分失败，不能拖累其他并发评分和整体响应
            score = await asyncio.wait_for(
                asyncio.to_thread(_gemini_score, keyword, video_topic, bili_candidates),
                timeout=15.0,
            )
        except asyncio.TimeoutError:
            logger.warning("gemini score for '%s' timed out after 15s", keyword)

    bili_video: dict[str, Any] | None = None
    douyin_worth = True  # 拿不到评分时默认显示抖音跳转

    if score is not None:
        idx = max(0, min(int(score.get("best_index", 0)), len(bili_candidates) - 1))
        s = int(score.get("bilibili_score", 0))
        if s >= BILI_SCORE_THRESHOLD:
            v = bili_candidates[idx]
            bili_video = {**v, "score": s, "reason": score.get("reason", "")}
        douyin_worth = bool(score.get("douyin_worth_search", True))

    encoded = quote(keyword)
    bili_search_url = f"https://search.bilibili.com/all?keyword={encoded}"
    douyin_url = f"https://www.douyin.com/search/{encoded}" if douyin_worth else None

    # 都没东西可展示 → 丢这个关键词
    if bili_video is None and douyin_url is None:
        return None

    return {
        "keyword": keyword,
        "bilibili_video": bili_video,
        "bilibili_search_url": bili_search_url,
        "douyin_url": douyin_url,
    }


# ----------------------------------------------------------------------
# 主入口
# ----------------------------------------------------------------------
async def recommend_for_analysis(analysis: dict[str, Any]) -> dict[str, Any]:
    if not analysis:
        return {"keywords": [], "items": [], "source": "empty"}

    # Step 1: 关键词（15s 死线，超时直接走本地兜底）
    try:
        keywords = await asyncio.wait_for(
            asyncio.to_thread(_gemini_keywords, analysis),
            timeout=15.0,
        )
        kw_source = "gemini"
    except (asyncio.TimeoutError, Exception) as e:  # noqa: BLE001
        logger.warning("gemini keyword extraction failed/timeout, fallback: %s", e)
        keywords = _local_fallback_keywords(analysis)
        kw_source = "local"

    video_topic = (analysis.get("title") or "")[:60]

    # Step 2: 并发处理每个关键词
    results = await asyncio.gather(
        *[_process_keyword(kw, video_topic) for kw in keywords],
        return_exceptions=True,
    )

    items: list[dict[str, Any]] = []
    for kw, r in zip(keywords, results):
        if isinstance(r, Exception):
            logger.warning("keyword '%s' pipeline crashed: %s", kw, r)
            continue
        if r is not None:
            items.append(r)

    return {
        "keywords": [it["keyword"] for it in items],
        "items": items,
        "source": kw_source,
    }
