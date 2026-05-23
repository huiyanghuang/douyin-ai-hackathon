# 抖音黑客松 - 科普视频解构器（后端）

FastAPI + SSE + Gemini 2.5 Pro 视频直读。

## 本地启动

```bash
py -m pip install -r requirements.txt
# 在 backend/ 父目录下运行（这样 `backend` 是个 Python 包）
cd ..
py -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

健康检查：`curl http://localhost:8000/healthz`

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/analyze` | multipart `video=<file>` 或 form `url=<视频URL>`，返回 `{task_id}` |
| GET | `/api/progress/{task_id}` | SSE 推送 stage/percent/message，done 时附 result |
| GET | `/api/result/{task_id}` | 直接拿快照（前端刷新恢复用） |
| POST | `/api/chat` | body `{task_id, history:[{role,text}...], message}` |
| GET | `/api/demos` | 预缓存 demo 列表（不调 Gemini，秒级响应） |

CORS 全开。Stage 取值：`queued / uploading / analyzing / structuring / done / error`。

## 预生成 demo

```bash
cd backend
py gen_demos.py /path/to/video.mp4 demo_001 "气候变化是怎么算出来的"
```

## 部署

见 `deploy/` 目录的 systemd / nginx 配置。SSE 需要 nginx 关 buffering、加长 read_timeout。

## 关键约束

- 文件 ≤100MB，时长 ≤10min
- 模型：分析用 `gemini-2.5-pro`（150 RPM / 2M TPM / 10K RPD），闲聊用 `gemini-2.5-flash`（1K RPM）
- 抖音链接走 yt-dlp，best-effort，失败提示用户改上传

## 死亡之坑

`validate_gemini.py` 是冷启动验证脚本：上传一段本地 MP4 → File API → 2.5 Pro 强制 JSON 输出。
本地已知 2 条 MP4（HEVC + H.264）都在 Gemini 处理阶段 FAILED（code=12）。
**等拿到一条抖音下载的标准 MP4 再回头跑一遍**。
