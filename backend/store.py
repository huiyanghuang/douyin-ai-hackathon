"""In-process task store. Hackathon-grade: no DB, no Redis, just a dict."""
import asyncio
import time
from typing import Any, Literal

Stage = Literal["queued", "uploading", "analyzing", "structuring", "done", "error"]


class TaskStore:
    def __init__(self) -> None:
        self._tasks: dict[str, dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def create(self, task_id: str) -> None:
        async with self._lock:
            self._tasks[task_id] = {
                "stage": "queued",
                "percent": 0,
                "message": "排队中",
                "result": None,
                "error": None,
                "created_at": time.time(),
                "updated_at": time.time(),
            }

    async def update(
        self,
        task_id: str,
        *,
        stage: Stage | None = None,
        percent: int | None = None,
        message: str | None = None,
        result: dict[str, Any] | None = None,
        error: str | None = None,
    ) -> None:
        async with self._lock:
            t = self._tasks.get(task_id)
            if t is None:
                return
            if stage is not None:
                t["stage"] = stage
            if percent is not None:
                t["percent"] = percent
            if message is not None:
                t["message"] = message
            if result is not None:
                t["result"] = result
            if error is not None:
                t["error"] = error
            t["updated_at"] = time.time()

    async def get(self, task_id: str) -> dict[str, Any] | None:
        async with self._lock:
            t = self._tasks.get(task_id)
            return dict(t) if t else None

    async def snapshot(self, task_id: str) -> dict[str, Any] | None:
        return await self.get(task_id)

    async def gc(self, ttl_seconds: int) -> int:
        cutoff = time.time() - ttl_seconds
        async with self._lock:
            stale = [tid for tid, t in self._tasks.items() if t["updated_at"] < cutoff]
            for tid in stale:
                del self._tasks[tid]
            return len(stale)


store = TaskStore()
