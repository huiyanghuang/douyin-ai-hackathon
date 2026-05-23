"""死亡之坑验证：Gemini 2.5 Pro 直接读 MP4 + response_schema 强制 JSON 输出。

跑通这一步之前不写任何其他代码。
"""
import json
import os
import sys
import time
from pathlib import Path

from google import genai
from google.genai import types

API_KEY = "AIzaSyBfL5MxLtht8NcVayzNg8AtKhORrxMeeXU"
MODEL = "gemini-2.5-pro"

# 用契约中的 schema，但精简到能验证「视频直读 + 结构化输出」即可
RESPONSE_SCHEMA = {
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

SYSTEM_PROMPT = """你是一个科普视频解构专家。你将看到一段科普视频，请直接观察画面（包括字幕、图示、公式）和音频，输出严格符合 schema 的 JSON。

要求：
- 解释要让初中生能懂
- 类比要具体形象，避免空话
- 时间戳格式 mm:ss，对应视频中讲到该要点的位置
- 测验要有真正的辨析价值，覆盖记忆/理解/应用三个认知层级
- key_concepts 给 3-6 个，key_points 给 5-10 个，quiz 给 3-5 题，follow_up_questions 给 3 个
"""


def main(video_path: str) -> None:
    p = Path(video_path)
    assert p.exists(), f"file not found: {p}"
    print(f"[1/4] file: {p} ({p.stat().st_size / 1024:.1f} KB)")

    client = genai.Client(api_key=API_KEY)

    print("[2/4] uploading to Gemini File API...")
    t0 = time.time()
    uploaded = client.files.upload(file=str(p))
    print(f"      uploaded: name={uploaded.name} state={uploaded.state} ({time.time() - t0:.1f}s)")

    # wait until ACTIVE
    while uploaded.state and uploaded.state.name == "PROCESSING":
        time.sleep(2)
        uploaded = client.files.get(name=uploaded.name)
        print(f"      poll: state={uploaded.state.name}")
    if uploaded.state and uploaded.state.name != "ACTIVE":
        print(f"      FAIL: file state {uploaded.state.name}")
        print(f"      full file object: {uploaded}")
        sys.exit(1)
    print(f"      ACTIVE in {time.time() - t0:.1f}s")

    print("[3/4] calling gemini-2.5-pro with response_schema...")
    t1 = time.time()
    resp = client.models.generate_content(
        model=MODEL,
        contents=[uploaded, "请解构这段科普视频"],
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=RESPONSE_SCHEMA,
            temperature=0.4,
        ),
    )
    print(f"      response in {time.time() - t1:.1f}s")

    print("[4/4] parsing JSON...")
    raw = resp.text
    parsed = json.loads(raw)  # 如果 schema 没生效，这里会炸
    print("      OK, top-level keys:", list(parsed.keys()))
    print("      sample title:", parsed.get("title"))
    print("      key_concepts count:", len(parsed.get("key_concepts", [])))
    print("      key_points count:", len(parsed.get("key_points", [])))
    print("      quiz count:", len(parsed.get("quiz", [])))

    out = p.parent / f"_validate_output_{p.stem}.json"
    out.write_text(json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nFULL JSON written to: {out}")

    # cleanup
    try:
        client.files.delete(name=uploaded.name)
    except Exception as e:  # noqa: BLE001
        print(f"      (cleanup warn) {e}")


if __name__ == "__main__":
    default = r"C:\Users\owen\Desktop\cupt\控制航天器.mp4"
    main(sys.argv[1] if len(sys.argv) > 1 else default)
