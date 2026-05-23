"""FastAPI entry point.

Routes:
  POST /api/analyze              -- upload file or url, returns task_id
  GET  /api/progress/{task_id}   -- SSE stream of progress events
  GET  /api/result/{task_id}     -- snapshot JSON
  POST /api/chat                 -- chat with Flash, grounded on a task's analysis
  GET  /api/demos                -- pre-generated demo list (no Gemini call)
  GET  /healthz                  -- liveness
"""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from pathlib import Path

import aiofiles
from fastapi import BackgroundTasks, Depends, FastAPI, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from . import auth, config
from .analyzer import analyze_video, yt_dlp_download
from .chat_service import chat_reply
from .schemas import (
    AnalyzeAccepted,
    AuthResponse,
    ChatRequest,
    ChatResponse,
    LoginRequest,
    RegisterRequest,
    UserInfo,
)
from .store import store

auth.set_db_path(config.AUTH_DB_PATH)
auth.init_db()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("backend")

app = FastAPI(title="抖音黑客松 - 科普视频解构器", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


# ============================================================
# 用户认证 /api/auth/*
# ============================================================
def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return authorization.strip() or None


async def get_optional_user(authorization: str | None = Header(default=None)) -> dict | None:
    """从 Authorization 头解析当前用户；无 token / 无效 → None。"""
    token = _extract_token(authorization)
    if not token:
        return None
    return await asyncio.to_thread(auth.get_session_user, token)


async def get_required_user(user: dict | None = Depends(get_optional_user)) -> dict:
    if user is None:
        raise HTTPException(401, "未登录或登录已过期")
    return user


@app.post("/api/auth/register", response_model=AuthResponse, status_code=201)
async def register(req: RegisterRequest) -> AuthResponse:
    try:
        user = await asyncio.to_thread(auth.register_user, req.username, req.password)
    except auth.UsernameTakenError as e:
        raise HTTPException(409, str(e))
    except auth.InvalidCredentialError as e:
        raise HTTPException(400, str(e))
    token = await asyncio.to_thread(auth.create_session, user["id"])
    return AuthResponse(token=token, user=UserInfo(**user))


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest) -> AuthResponse:
    uid = await asyncio.to_thread(auth.verify_password, req.username, req.password)
    if uid is None:
        raise HTTPException(401, "用户名或密码错误")
    token = await asyncio.to_thread(auth.create_session, uid)
    return AuthResponse(token=token, user=UserInfo(id=uid, username=req.username))


@app.get("/api/auth/me", response_model=UserInfo)
async def me(user: dict = Depends(get_required_user)) -> UserInfo:
    return UserInfo(**user)


@app.post("/api/auth/logout", status_code=204)
async def logout(authorization: str | None = Header(default=None)) -> None:
    token = _extract_token(authorization)
    if token:
        await asyncio.to_thread(auth.delete_session, token)
    return None


@app.post("/api/analyze", response_model=AnalyzeAccepted)
async def analyze(
    background: BackgroundTasks,
    video: UploadFile | None = None,
    url: str | None = Form(default=None),
) -> AnalyzeAccepted:
    if video is None and not url:
        raise HTTPException(400, "请提供 video 文件或 url 字段")
    if video is not None and url:
        raise HTTPException(400, "video 和 url 只能二选一")

    task_id = uuid.uuid4().hex
    await store.create(task_id)

    if video is not None:
        suffix = Path(video.filename or "upload.mp4").suffix or ".mp4"
        dest = config.UPLOAD_DIR / f"{task_id}{suffix}"
        size = 0
        async with aiofiles.open(dest, "wb") as f:
            while True:
                chunk = await video.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > config.MAX_UPLOAD_BYTES:
                    await f.close()
                    dest.unlink(missing_ok=True)
                    raise HTTPException(413, f"文件超过 {config.MAX_UPLOAD_BYTES // 1024 // 1024}MB 限制")
                await f.write(chunk)
        logger.info("[%s] saved upload %s (%d bytes)", task_id, dest, size)
        background.add_task(_run_analyze, task_id, dest)
    else:
        assert url is not None
        background.add_task(_run_from_url, task_id, url)

    return AnalyzeAccepted(task_id=task_id)


async def _run_analyze(task_id: str, path: Path) -> None:
    await analyze_video(task_id, path)


async def _run_from_url(task_id: str, url: str) -> None:
    await store.update(task_id, stage="uploading", percent=5, message="正在下载视频...")
    try:
        path = await yt_dlp_download(url, config.UPLOAD_DIR)
    except Exception as e:  # noqa: BLE001
        logger.exception("[%s] yt-dlp failed", task_id)
        await store.update(
            task_id,
            stage="error",
            message=f"链接下载失败：{e}。请改用文件上传。",
            error=str(e),
        )
        return
    # rename to task_id-prefixed for cleanup
    new = config.UPLOAD_DIR / f"{task_id}{path.suffix}"
    try:
        path.rename(new)
        path = new
    except OSError:
        pass
    await analyze_video(task_id, path)


@app.get("/api/progress/{task_id}")
async def progress(task_id: str) -> EventSourceResponse:
    snap = await store.get(task_id)
    if snap is None:
        raise HTTPException(404, "task not found")

    async def event_generator():
        last_serialized = ""
        while True:
            snap = await store.get(task_id)
            if snap is None:
                yield {"event": "message", "data": json.dumps({"stage": "error", "message": "task missing"})}
                return
            payload = {
                "stage": snap["stage"],
                "percent": snap["percent"],
                "message": snap["message"],
            }
            if snap["stage"] == "done":
                payload["result"] = snap["result"]
            elif snap["stage"] == "error":
                payload["error"] = snap.get("error") or snap.get("message")
            serialized = json.dumps(payload, ensure_ascii=False)
            if serialized != last_serialized:
                yield {"event": "message", "data": serialized}
                last_serialized = serialized
            if snap["stage"] in ("done", "error"):
                return
            await asyncio.sleep(config.SSE_POLL_INTERVAL)

    return EventSourceResponse(event_generator())


@app.get("/api/result/{task_id}")
async def result(task_id: str) -> JSONResponse:
    snap = await store.get(task_id)
    if snap is None:
        raise HTTPException(404, "task not found")
    return JSONResponse(
        {
            "task_id": task_id,
            "stage": snap["stage"],
            "percent": snap["percent"],
            "message": snap["message"],
            "result": snap["result"],
            "error": snap["error"],
        }
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    snap = await store.get(req.task_id)
    analysis: dict | None = None
    if snap and snap.get("result"):
        analysis = snap["result"]
    else:
        # maybe it's a demo id
        demo = _find_demo(req.task_id)
        if demo:
            analysis = demo["cached_result"]
    # 兜底：前端历史还原项的 task_id 已经过了内存 TTL，请求体里会带 analysis 字段
    if analysis is None and req.analysis is not None:
        analysis = req.analysis
    if analysis is None:
        raise HTTPException(404, "task 还没分析完成或不存在")

    reply = await chat_reply(analysis, req.history, req.message)
    return ChatResponse(reply=reply)


_demos_cache: list[dict] | None = None


def _load_demos() -> list[dict]:
    global _demos_cache
    if _demos_cache is not None:
        return _demos_cache
    if config.DEMOS_FILE.exists():
        try:
            _demos_cache = json.loads(config.DEMOS_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            logger.exception("demos.json malformed")
            _demos_cache = []
    else:
        _demos_cache = []
    return _demos_cache


def _find_demo(demo_id: str) -> dict | None:
    for d in _load_demos():
        if d.get("id") == demo_id:
            return d
    return None


@app.get("/api/demos")
async def demos() -> list[dict]:
    return _load_demos()


@app.on_event("startup")
async def _startup_gc_task() -> None:
    async def loop():
        while True:
            await asyncio.sleep(600)
            n = await store.gc(config.TASK_TTL_SECONDS)
            if n:
                logger.info("gc cleaned %d stale tasks", n)

    asyncio.create_task(loop())
