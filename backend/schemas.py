"""Gemini response schema + Pydantic models for API I/O."""
from typing import Any, Literal

from pydantic import BaseModel, Field

GEMINI_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "summary": {"type": "string"},
        "key_concepts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "explanation": {"type": "string"},
                    "analogy": {"type": "string"},
                },
                "required": ["name", "explanation", "analogy"],
            },
        },
        "concept_relations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "from": {"type": "string"},
                    "to": {"type": "string"},
                    "relation": {"type": "string"},
                },
                "required": ["from", "to", "relation"],
            },
        },
        "key_points": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "point": {"type": "string"},
                    "timestamp": {"type": "string"},
                    "importance": {"type": "string", "enum": ["high", "medium", "low"]},
                },
                "required": ["point", "timestamp", "importance"],
            },
        },
        "quiz": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "options": {"type": "array", "items": {"type": "string"}},
                    "answer": {"type": "string"},
                    "explanation": {"type": "string"},
                },
                "required": ["question", "options", "answer", "explanation"],
            },
        },
        "follow_up_questions": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "title",
        "summary",
        "key_concepts",
        "concept_relations",
        "key_points",
        "quiz",
        "follow_up_questions",
    ],
}


class ChatTurn(BaseModel):
    # 前端发 "assistant"（Web/LLM 通用术语），Gemini 内部叫 "model"，两个都接，统一在 chat_service 里转。
    role: Literal["user", "assistant", "model"]
    text: str


class ChatRequest(BaseModel):
    task_id: str
    history: list[ChatTurn] = Field(default_factory=list)
    message: str
    # 历史还原项：前端把存在 localStorage 里的分析结果传过来，
    # 后端 store 找不到 task_id 时用这个兜底。schema 不强约束字段，留 dict 让 chat 直接吃。
    analysis: dict[str, Any] | None = None


class ChatResponse(BaseModel):
    reply: str


class AnalyzeAccepted(BaseModel):
    task_id: str


class DemoItem(BaseModel):
    id: str
    title: str
    thumb: str | None = None
    cached_result: dict[str, Any]


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class UserInfo(BaseModel):
    id: int
    username: str


class AuthResponse(BaseModel):
    token: str
    user: UserInfo


# ---------- 猜你想看 ----------
class RecommendRequest(BaseModel):
    task_id: str | None = None
    # 历史还原项 task_id 已经过 TTL → 前端把分析结果带过来兜底
    analysis: dict[str, Any] | None = None


class BilibiliVideo(BaseModel):
    title: str
    url: str
    bvid: str | None = None
    cover: str | None = None
    author: str | None = None
    view: int = 0
    duration: str | None = None
    description: str | None = None
    score: int | None = None     # Gemini 评分 0-100
    reason: str | None = None    # Gemini 评分理由


class RecommendItem(BaseModel):
    keyword: str
    bilibili_video: BilibiliVideo | None = None  # 评分达阈值才有
    bilibili_search_url: str                       # 始终有，作为兜底跳转
    douyin_url: str | None = None                  # Gemini 判断"适合抖音搜"才有


class RecommendResponse(BaseModel):
    keywords: list[str]
    items: list[RecommendItem]
    source: str  # "gemini" / "local"
