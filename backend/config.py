import os
from pathlib import Path

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY env var not set. "
        "Set it via /etc/douyin-backend.env (loaded by systemd) or your shell."
    )

MODEL_ANALYZE = "gemini-2.5-pro"
MODEL_CHAT = "gemini-2.5-pro"

MAX_UPLOAD_BYTES = 100 * 1024 * 1024
MAX_DURATION_SECONDS = 600

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/tmp/douyin_uploads")).resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

DEMOS_FILE = Path(__file__).parent / "demos.json"

SSE_POLL_INTERVAL = 0.5
TASK_TTL_SECONDS = 60 * 60 * 2

# 用户认证：SQLite 数据库路径
AUTH_DB_PATH = Path(os.environ.get("AUTH_DB_PATH", "_data/dyhk_auth.db")).resolve()

# 各平台 Cookies 文件（可选，Netscape/Mozilla cookies.txt 格式）。
# 通过环境变量传入：留空就走 fake-header 兜底；指向真实导出的 cookies 文件
# 就用登录态，B站 412 / 抖音 403 概率显著降低。
# 浏览器插件 "Get cookies.txt LOCALLY" 可一键导出。
BILIBILI_COOKIES_FILE = (
    Path(os.environ["BILIBILI_COOKIES_FILE"]).resolve()
    if os.environ.get("BILIBILI_COOKIES_FILE")
    else None
)
DOUYIN_COOKIES_FILE = (
    Path(os.environ["DOUYIN_COOKIES_FILE"]).resolve()
    if os.environ.get("DOUYIN_COOKIES_FILE")
    else None
)
YOUTUBE_COOKIES_FILE = (
    Path(os.environ["YOUTUBE_COOKIES_FILE"]).resolve()
    if os.environ.get("YOUTUBE_COOKIES_FILE")
    else None
)
