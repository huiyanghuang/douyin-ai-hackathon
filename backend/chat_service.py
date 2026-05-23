"""Chat with Gemini 2.5 Flash, grounded on a task's video analysis."""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from google import genai
from google.genai import types

from . import config
from .prompts import chat_system_prompt
from .schemas import ChatTurn

logger = logging.getLogger(__name__)


def _client() -> genai.Client:
    return genai.Client(api_key=config.GEMINI_API_KEY)


def _to_gemini_contents(history: list[ChatTurn], message: str) -> list[types.Content]:
    contents: list[types.Content] = []
    for turn in history:
        contents.append(
            types.Content(role=turn.role, parts=[types.Part.from_text(text=turn.text)])
        )
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))
    return contents


async def chat_reply(
    analysis: dict[str, Any],
    history: list[ChatTurn],
    message: str,
) -> str:
    client = _client()
    system = chat_system_prompt(json.dumps(analysis, ensure_ascii=False))

    resp = await asyncio.to_thread(
        client.models.generate_content,
        model=config.MODEL_CHAT,
        contents=_to_gemini_contents(history, message),
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.7,
        ),
    )
    return (resp.text or "").strip() or "（AI 没说话，再问一次试试？）"
