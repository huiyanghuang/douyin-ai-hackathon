"""Local dev wrapper：把 backend FastAPI app 包一层，同时 serve 前端静态文件。

启动：
    .venv/Scripts/python -m uvicorn dev_server:app --host 127.0.0.1 --port 8000

只供本地端到端联调用，**不要 commit 到生产** —— 生产是 nginx 反代。
"""
from pathlib import Path

from fastapi.staticfiles import StaticFiles

from backend.main import app

ROOT = Path(__file__).parent

# 注意：StaticFiles mount("/") 会捕获所有未被前面路由匹配的请求。
# backend.main 里的 /api/* 和 /healthz 在前面定义，优先匹配；其余落到静态。
app.mount("/", StaticFiles(directory=str(ROOT), html=True), name="static")
