# 科普解构器 · 让视频变成你的私人课程

> 抖音黑客松 2025 · 赛道二「抖音精选-内容重构」· 25 小时全栈交付

把一段科普视频，自动解构成 **概念图谱 + 知识卡片 + AI 追问 + 游戏化测验** 四件套。从「看过」到「学会」——让被动观看变成可学、可判、可用的能力沉淀。

线上演示：<https://douyinhackathon.xinguangtreehole.com>

---

## 完整闭环：多模态输入 → 生成交互体验

```
 ┌──────────────────────────────────────────┐
 │  上传 MP4  /  粘贴抖音·B 站链接          │  ← 多模态输入
 └──────────────────────────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────┐
 │  Gemini 2.5 Pro 视频直读                  │
 │  ─ 同时观察画面（字幕/图示/公式）+ 音频   │
 │  ─ response_schema 强制结构化 JSON 输出   │
 │  ─ 503 时自动回落 2.5 Flash               │
 └──────────────────────────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────┐
 │  Structured Knowledge JSON                │
 │  title · summary · key_concepts ·         │
 │  concept_relations · key_points ·         │
 │  quiz · follow_up_questions               │
 └──────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬───────────┐
        ▼           ▼           ▼           ▼
   知识卡片     D3 图谱      AI 追问      知识测验
  （类比+        （讲解 tour  （Flash      （三认知层级
    时间戳）       动画）       grounded）   即时反馈）
        │           │           │           │
        └───────────┴───────────┴───────────┘
                    │
                    ▼
   导出 .md 笔记 · 历史回看 · 猜你想看（B 站/抖音站内搜索延伸）
```

---

## 技术栈

| 层 | 选型 | 25h 内为何这么选 |
|---|---|---|
| 前端 | 原生 HTML + ES6 + CSS，CDN 引 Tailwind / D3 v7 / marked.js | 零编译、零脚手架、刷新即上线 |
| 后端 | FastAPI + sse-starlette | 长任务进度流原生支持 |
| 多模态分析 | Gemini 2.5 Pro 视频直读 + response_schema | 一次调用拿到 JSON，免去 STT → 切片 → 拼装 |
| 追问 / 推荐 | Gemini 2.5 Flash | 高 RPM 配额适配多轮 |
| 视频抓取 | yt-dlp（伪装桌面 Chrome UA 绕风控） | 单二进制覆盖国内主流站点 |
| 鉴权 | sqlite + bearer token | 最简能上线方案 |
| 部署 | Nginx 静态 + systemd 守护 + 同域 `/api/*` 反代（关闭 buffering 兼容 SSE） | 一键部署上线 |

---

## 评审重点速查（技术工程验证材料对照）

| 赛题要求 | 实现位置 |
|---|---|
| **Prompt 编排** | [`backend/prompts.py`](backend/prompts.py) — 系统提示（数量动态规则 / 概念分层 / 关系连通 / 三认知层级 quiz）<br>[`backend/schemas.py`](backend/schemas.py) — `GEMINI_RESPONSE_SCHEMA` 强制结构化输出 |
| **Agent 核心逻辑** | [`backend/analyzer.py`](backend/analyzer.py) — 视频理解 Agent（File API 上传 → ACTIVE 轮询 → Pro 调用 → Flash 自动回落）<br>[`backend/chat_service.py`](backend/chat_service.py) — 追问 Agent（基于解析结果的 grounded 对话）<br>[`backend/recommend.py`](backend/recommend.py) — 「猜你想看」Agent（抽延伸关键词 + 构造站内搜索 URL） |
| **主要算法脚本** | [`backend/validate_gemini.py`](backend/validate_gemini.py) — 冷启动验证脚本，证明视频直读 + 强制 JSON 输出可行<br>[`backend/gen_demos.py`](backend/gen_demos.py) — 预缓存 demo 离线生成脚本 |

---

## 仓库结构

```
.
├─ index.html / app.js / styles.css   ← 前端 SPA（无框架，~2300 行 JS）
├─ poster.html                         ← 游园会海报页
├─ prompt.txt                          ← 前端开发规格说明书
├─ 题目.md                             ← 赛题原文
├─ dev_server.py                       ← 本地一体化启动入口（静态 + API）
├─ backend/
│   ├─ main.py                ← FastAPI 路由（analyze/progress/chat/demos/recommend/auth）
│   ├─ analyzer.py            ← ★ 视频理解 Agent
│   ├─ prompts.py             ← ★ Prompt 编排
│   ├─ schemas.py             ← ★ response_schema + Pydantic 契约
│   ├─ recommend.py           ← ★ 延伸推荐 Agent
│   ├─ chat_service.py        ← ★ 追问 Agent
│   ├─ auth.py / store.py     ← 鉴权 + 任务状态存储
│   ├─ search.py              ← yt-dlp 下载封装
│   ├─ validate_gemini.py     ← 冷启动验证脚本
│   ├─ gen_demos.py           ← demo 预缓存脚本
│   └─ requirements.txt
└─ deploy/                    ← systemd unit + nginx.conf + ssh 部署脚本
```

---

## 本地启动

```bash
# 1. 安装依赖
py -m pip install -r backend/requirements.txt

# 2. 配置 Gemini Key
cp backend/.env.example backend/.env
# 编辑 backend/.env 填入 GEMINI_API_KEY

# 3. 一体化启动（同时托管前端静态 + 后端 API）
py -m uvicorn dev_server:app --host 127.0.0.1 --port 8000 --reload
```

浏览器打开 <http://127.0.0.1:8000> 即可。

---

## API 契约

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/analyze` | multipart `video=<file>` 或 form `url=<URL>` → `{task_id}` |
| GET | `/api/progress/{task_id}` | SSE 流推送 `stage / percent / message`，`done` 时携带 `result` |
| GET | `/api/result/{task_id}` | 直接拿快照（刷新恢复用） |
| POST | `/api/chat` | `{task_id, history, message}` → `{reply}` |
| POST | `/api/recommend` | 抽延伸关键词 → `{keywords, links}` |
| GET | `/api/demos` | 预缓存 demo 列表（零 Gemini 调用） |
| POST | `/api/auth/register` `/login` `/logout` | 鉴权 |
| GET | `/healthz` | 存活检查 |

完整 JSON 结构见 [`backend/schemas.py`](backend/schemas.py)。

---

## 工程亮点

1. **零脱靶 LLM 输出**：`response_schema` + Pydantic 双层校验，从源头杜绝 JSON 解析失败。
2. **节点分层 + 连通图约束**：Prompt 里强制 `[核心]/[分支]/[细节]` 标签 + concept_relations 必须把所有节点串通，避免 D3 图谱出现孤立节点。
3. **Pro → Flash 自动降级**：高峰期 503 时无感切换 Flash 模型，保证演示稳定性。
4. **SSE 真实进度推送**：不是假进度条 —— 上传 / 处理 / 分析 / 结构化 四阶段实时反映 Gemini File API 真实状态。
5. **预缓存 demo 通道**：评审现场点击预置案例秒级响应，不依赖实时上传链路。
6. **历史回看降级**：内存 TTL 失效后，前端把 analysis 整体随 chat 请求带回，仍能正常追问。

---

## License

仅供抖音黑客松 2025 提交评审使用。
