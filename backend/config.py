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
