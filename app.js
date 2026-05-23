/* ============================================================
 * 科普视频 AI 解构器 - 前端主逻辑
 * 工作顺序按 prompt.txt：先用 mock 跑通骨架，再逐步接 API。
 * ============================================================ */

/* ---------- Mock 数据（没有后端时用） ---------- */
window.__MOCK__ = {
  title: "黑洞为什么不会发光？事件视界与时空弯曲入门",
  summary:
    "黑洞并非「完全黑」，而是因为其引力强到连光都无法逃脱事件视界。本视频从牛顿引力出发，类比逃逸速度的概念，逐步引入爱因斯坦广义相对论中「时空弯曲」的新理解，并简述霍金辐射如何让黑洞重新「被看见」。",
  key_concepts: [
    {
      name: "事件视界",
      explanation: "[核心] 黑洞周围的一个临界球面，进入它以后任何信息都无法再返回外部宇宙。",
      analogy: "像瀑布顶端的「不可挽回点」——一旦水流过了那条线，再怎么挣扎都只能往下掉。",
    },
    {
      name: "时空弯曲",
      explanation: "[核心] 广义相对论中,质量会使周围的时空发生几何变形,物体沿着弯曲的时空「直线」运动,表现为引力。",
      analogy: "像放在橡胶膜上的保龄球,周围会凹下去,小球滚过时会被吸过来。",
    },
    {
      name: "逃逸速度",
      explanation: "[分支] 要彻底摆脱一个天体引力束缚所需的最小速度。当逃逸速度超过光速时,黑洞就形成了。",
      analogy: "像在蹦床上跳——蹦床越软（引力越强），你要跳得越用力才能离开。",
    },
    {
      name: "霍金辐射",
      explanation: "[分支] 量子效应导致黑洞视界附近不断有粒子-反粒子对产生,其中一部分逃逸出去,使黑洞缓慢蒸发。",
      analogy: "像漏气的轮胎——看起来密封,实际每一秒都在微小地散发能量。",
    },
    {
      name: "奇点",
      explanation: "[分支] 黑洞中心理论上密度无限大、时空曲率无限大的点,目前物理定律在此失效。",
      analogy: "像数学公式里的「除以零」——不是真的无穷大,而是模型在这里破了。",
    },
    {
      name: "广义相对论",
      explanation: "[细节] 爱因斯坦 1915 年提出的引力理论，是当前描述黑洞与宇宙大尺度结构的最佳框架。",
      analogy: "像一本厚厚的菜谱，告诉你重的东西会让桌布凹下去。",
    },
    {
      name: "吸积盘",
      explanation: "[细节] 围绕黑洞旋转的高温气体盘，是我们能间接「看见」黑洞的主要光源。",
      analogy: "像水流被吸进下水道前打转产生的漩涡。",
    },
    {
      name: "EHT 望远镜",
      explanation: "[细节] 全球协作的射电望远镜阵列，2019 年首次拍到 M87 黑洞的「照片」。",
      analogy: "像八个朋友同时拍照拼起来还原一个超大场景。",
    },
  ],
  concept_relations: [
    { from: "逃逸速度", to: "事件视界", relation: "超过光速时定义出" },
    { from: "时空弯曲", to: "事件视界", relation: "几何描述" },
    { from: "事件视界", to: "霍金辐射", relation: "量子效应来源于" },
    { from: "事件视界", to: "奇点", relation: "包裹" },
    { from: "时空弯曲", to: "奇点", relation: "极端表现" },
    { from: "广义相对论", to: "时空弯曲", relation: "依赖于" },
    { from: "广义相对论", to: "事件视界", relation: "包含" },
    { from: "事件视界", to: "吸积盘", relation: "导致形成" },
    { from: "EHT 望远镜", to: "吸积盘", relation: "依赖" },
    { from: "霍金辐射", to: "奇点", relation: "对比" },
  ],
  key_points: [
    { point: "黑洞不是「洞」,而是一个极端致密的天体", timestamp: "00:32", importance: "high" },
    { point: "用逃逸速度类比解释为什么光也跑不掉", timestamp: "01:15", importance: "high" },
    { point: "广义相对论的「等效原理」是理解时空弯曲的入口", timestamp: "02:48", importance: "medium" },
    { point: "黑洞并非永恒,会通过霍金辐射缓慢蒸发", timestamp: "04:20", importance: "high" },
    { point: "奇点是当前物理理论的边界,不是物理实体", timestamp: "05:05", importance: "medium" },
    { point: "EHT 望远镜拍到的「照片」实际是吸积盘", timestamp: "06:30", importance: "low" },
  ],
  quiz: [
    {
      question: "黑洞之所以「黑」,最准确的解释是？",
      options: [
        "它是宇宙中的一个真实空洞",
        "它的引力大到连光都无法从事件视界逃逸",
        "它吸收了所有颜色的光",
        "它温度太低不发光",
      ],
      answer: "B",
      explanation: "黑洞并非空洞,而是质量极大、密度极高的天体,其引力使光的逃逸速度超过光速本身。",
    },
    {
      question: "下列哪一项最贴近「事件视界」的物理含义？",
      options: [
        "黑洞的物理表面",
        "黑洞的中心点",
        "信息无法返回外部的临界面",
        "吸积盘的最外缘",
      ],
      answer: "C",
      explanation: "事件视界是一个数学上的边界,跨过它的任何信息都无法再传回外部宇宙。",
    },
    {
      question: "霍金辐射意味着：",
      options: [
        "黑洞永远存在",
        "黑洞会缓慢蒸发",
        "黑洞会越变越大",
        "黑洞内部存在生命",
      ],
      answer: "B",
      explanation: "霍金辐射使黑洞缓慢损失质量,理论上最终会完全蒸发。",
    },
  ],
  follow_up_questions: [
    "如果我掉进黑洞会发生什么？",
    "黑洞和虫洞是同一回事吗？",
    "为什么科学家说黑洞内部「时间」和「空间」会调换？",
    "霍金辐射真的被观测到了吗？",
  ],
};

/* ---------- 全局状态 ---------- */
const state = {
  taskId: null,
  result: null,
  chatHistory: [],
  quiz: {
    idx: 0,
    correct: 0,
    answered: false,
    wrong: [],
  },
  selectedConcept: null,
  // 按 task_id 记录的来源信息，分析完成时取走（修 jinziyao 原版单例覆盖的 race）
  pendingSources: new Map(),
  // 当前 state.result 是不是从 localStorage 历史还原的（true 时聊天要把 analysis 一起发给后端）
  fromHistory: false,
  // huguangyu 三栏图谱用：左侧筛选状态 + 右侧掌握标记
  learning: {
    mastered: new Set(),
    visibleLevels: new Set(["core", "branch", "leaf", "unknown"]),
    visibleRelations: null,
  },
  // 用户认证：登录后 { user: {id, username}, token }；未登录 null
  auth: { user: null, token: null },
  // 图谱布局："force" 力导向 / "radial" 径向 mindmap
  graphLayout: "force",
};

/* ---------- 概念层级（从 explanation 前缀 [核心]/[分支]/[细节] 提取） ---------- */
const LEVEL_TAG_RE = /^\s*\[\s*(核心|分支|细节)\s*\]\s*/;
const LEVEL_STYLE = {
  core:    { fill: "#fbbf24", stroke: "#fde68a", radius: 36, label: "核心" },
  branch:  { fill: "#818cf8", stroke: "#c7d2fe", radius: 28, label: "分支" },
  leaf:    { fill: "#5b4ddc", stroke: "#818cf8", radius: 22, label: "细节" },
  unknown: { fill: "#4b5169", stroke: "#6b7180", radius: 22, label: "未分级" },
};
function extractLevel(explanation) {
  if (!explanation) return null;
  const m = explanation.match(LEVEL_TAG_RE);
  if (!m) return null;
  return { "核心": "core", "分支": "branch", "细节": "leaf" }[m[1]];
}
function cleanExplanation(explanation) {
  if (!explanation) return "";
  return explanation.replace(LEVEL_TAG_RE, "");
}

/* ---------- DOM 引用 ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ============================================================
 * 入口
 * ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  bindInput();
  bindTabs();
  bindChat();
  bindBack();
  bindHistoryClear();
  bindAuthModal();
  bindLayoutSwitcher();
  await bootstrapAuth();   // 启动时尝试恢复登录
  renderUserBar();
  renderHistory();
});

function bindLayoutSwitcher() {
  document.querySelectorAll(".layout-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lay = btn.dataset.layout;
      if (!state.result || lay === state.graphLayout) return;
      state.graphLayout = lay;
      document.querySelectorAll(".layout-btn").forEach((b) => b.classList.toggle("active", b === btn));
      renderGraph();
    });
  });
}

/* ============================================================
 * 输入区
 * ============================================================ */
function bindInput() {
  const dz = $("#dropzone");
  const fi = $("#file-input");

  dz.addEventListener("click", () => fi.click());
  dz.addEventListener("dragover", (e) => {
    e.preventDefault();
    dz.classList.add("drag-over");
  });
  dz.addEventListener("dragleave", () => dz.classList.remove("drag-over"));
  dz.addEventListener("drop", (e) => {
    e.preventDefault();
    dz.classList.remove("drag-over");
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  });
  fi.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  });

  $("#url-submit").addEventListener("click", () => {
    const url = $("#url-input").value.trim();
    if (!url) return;
    handleUrl(url);
  });
  $("#url-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#url-submit").click();
  });
}

function bindBack() {
  $("#back-btn").addEventListener("click", () => {
    $("#result-section").classList.add("hidden");
    $("#input-section").classList.remove("hidden");
    $("#hero-header")?.classList.remove("hidden");
    state.taskId = null;
    state.result = null;
    state.fromHistory = false;
  });
  $("#export-md")?.addEventListener("click", exportMarkdown);
}

/* ============================================================
 * 导出 Markdown 笔记
 * ============================================================ */
function exportMarkdown() {
  if (!state.result) {
    showToast("还没有可导出的内容", "error");
    return;
  }
  const md = buildMarkdown(state.result);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeTitle = (state.result.title || "知识笔记")
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 60);
  a.download = `${safeTitle}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("已导出 " + safeTitle + ".md");
}

function buildMarkdown(d) {
  const L = [];
  L.push(`# ${d.title || "未命名"}`, "");
  if (d.summary) L.push(`> ${d.summary}`, "");

  if (Array.isArray(d.key_concepts) && d.key_concepts.length) {
    L.push("## 核心概念", "");
    d.key_concepts.forEach((c) => {
      L.push(`### ${c.name}`, "");
      if (c.explanation) L.push(c.explanation, "");
      if (c.analogy) L.push(`> **类比：** ${c.analogy}`, "");
    });
  }

  if (Array.isArray(d.key_points) && d.key_points.length) {
    L.push("## 关键时间点", "");
    const sorted = [...d.key_points].sort(
      (a, b) => tsToSeconds(a.timestamp) - tsToSeconds(b.timestamp)
    );
    sorted.forEach((k) => {
      const tag =
        k.importance === "high" ? " `[重点]`" :
        k.importance === "medium" ? " `[次重点]`" : "";
      L.push(`- **${k.timestamp}**${tag} ${k.point}`);
    });
    L.push("");
  }

  if (Array.isArray(d.concept_relations) && d.concept_relations.length) {
    L.push("## 概念关系", "");
    d.concept_relations.forEach((r) =>
      L.push(`- **${r.from}** → **${r.to}**：${r.relation}`)
    );
    L.push("");
  }

  if (Array.isArray(d.quiz) && d.quiz.length) {
    L.push("## 自测题", "");
    const letters = ["A", "B", "C", "D"];
    d.quiz.forEach((q, i) => {
      L.push(`### ${i + 1}. ${q.question}`, "");
      (q.options || []).forEach((o, j) => L.push(`- ${letters[j]}. ${o}`));
      L.push("", `**答案：${q.answer}** —— ${q.explanation || ""}`, "");
    });
  }

  if (Array.isArray(d.follow_up_questions) && d.follow_up_questions.length) {
    L.push("## 延伸思考", "");
    d.follow_up_questions.forEach((q) => L.push(`- ${q}`));
    L.push("");
  }

  L.push("---", "", `*由「科普解构器」自动生成 · douyinhackathon.xinguangtreehole.com*`);
  return L.join("\n");
}

/* ============================================================
 * 我的历史记录（localStorage，最多 HISTORY_MAX 条）
 * ============================================================ */
const HISTORY_KEY_PREFIX = "dyhk_history_v1_";
const HISTORY_MAX = 20;

/* 按当前登录用户分桶；未登录 → "guest"。 */
function getHistoryKey() {
  const u = state.auth?.user?.username;
  return HISTORY_KEY_PREFIX + (u ? u.toLowerCase() : "guest");
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(getHistoryKey());
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn("history corrupted, reset", e);
    return [];
  }
}

function writeHistory(arr) {
  try {
    localStorage.setItem(getHistoryKey(), JSON.stringify(arr));
  } catch (e) {
    console.warn("history write failed", e);
  }
}

function saveHistoryItem(item) {
  const arr = loadHistory().filter((x) => x.id !== item.id);
  arr.unshift(item);
  while (arr.length > HISTORY_MAX) arr.pop();
  writeHistory(arr);
}

function deleteHistoryItem(id) {
  writeHistory(loadHistory().filter((x) => x.id !== id));
}

function clearHistory() {
  writeHistory([]);
}

/* 真实分析完成时调（listenProgress / fetchResult），点击历史卡时不要调。 */
function saveCurrentAnalysis(data, taskId) {
  if (!data) return;
  const src = state.pendingSources.get(taskId) || null;
  const item = {
    id: taskId || `local-${Date.now()}`,
    title: data.title || (src?.value ?? "未命名视频"),
    source_type: src?.type || "unknown",
    source_value: src?.value || "",
    savedAt: Date.now(),
    result: data,
  };
  saveHistoryItem(item);
  renderHistory();
  if (taskId) state.pendingSources.delete(taskId);
}

function formatRelativeTime(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  return new Date(ts).toLocaleDateString("zh-CN");
}

function renderHistory() {
  const list = $("#demo-list");
  if (!list) return;
  const clearBtn = $("#history-clear");
  const items = loadHistory();

  if (!items.length) {
    clearBtn?.classList.add("hidden");
    list.innerHTML = `
      <div class="col-span-full text-center py-10 text-white/30 text-sm">
        <div class="text-3xl mb-2">📭</div>
        <div>你还没有解析过视频</div>
        <div class="text-xs mt-1 text-white/20">上传一个 mp4 试试吧</div>
      </div>`;
    return;
  }

  clearBtn?.classList.remove("hidden");
  list.innerHTML = items
    .map(
      (it, i) => `
      <div class="demo-card relative group" data-idx="${i}">
        <button class="history-del absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 text-white/60 opacity-0 group-hover:opacity-100 transition text-xs"
                data-id="${escapeHtml(it.id)}" title="删除这条记录">×</button>
        <div class="demo-thumb flex items-center justify-center text-2xl">🎬</div>
        <div class="demo-title">${escapeHtml(it.title)}</div>
        <div class="text-xs text-white/30 mt-1">${formatRelativeTime(it.savedAt)}</div>
      </div>`
    )
    .join("");

  // 卡片点击：还原结果面板（标记 fromHistory，让聊天能把 analysis 带给后端）
  list.querySelectorAll(".demo-card").forEach((el) => {
    el.addEventListener("click", (ev) => {
      if (ev.target.classList.contains("history-del")) return;
      const idx = +el.dataset.idx;
      const it = items[idx];
      if (!it) return;
      state.taskId = it.id;
      state.fromHistory = true;
      renderResult(it.result);
    });
  });

  // × 删除单条
  list.querySelectorAll(".history-del").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const id = btn.dataset.id;
      deleteHistoryItem(id);
      renderHistory();
    });
  });
}

function bindHistoryClear() {
  const btn = $("#history-clear");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!confirm("确定清空所有历史记录？")) return;
    clearHistory();
    renderHistory();
  });
}

/* ============================================================
 * 用户认证（前后端真登录，token 存 localStorage）
 * ============================================================ */
const AUTH_TOKEN_KEY = "dyhk_auth_token_v1";

/** 给所有 /api/* 调用统一带上 Authorization，方便后端识别当前用户。 */
function authHeaders() {
  return state.auth.token ? { Authorization: `Bearer ${state.auth.token}` } : {};
}

async function bootstrapAuth() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return;
  state.auth.token = token;
  try {
    const res = await fetch("/api/auth/me", { headers: authHeaders() });
    if (res.ok) {
      state.auth.user = await res.json();
    } else {
      // token 过期 / 无效
      state.auth.token = null;
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (e) {
    console.warn("bootstrapAuth network fail:", e);
    // 网络挂时保留 token，下次刷新再试
  }
}

function renderUserBar() {
  const bar = $("#user-bar");
  if (!bar) return;
  if (state.auth.user) {
    bar.innerHTML = `
      <div class="flex items-center gap-2">
        <button class="user-btn" id="user-name-btn" title="点击退出登录">
          <span class="user-name">${escapeHtml(state.auth.user.username)}</span>
          <span class="text-white/40 text-[11px]">▾</span>
        </button>
      </div>`;
    $("#user-name-btn").onclick = async () => {
      if (!confirm(`退出当前账号 ${state.auth.user.username}？`)) return;
      await logoutUser();
    };
  } else {
    bar.innerHTML = `
      <div class="flex items-center gap-2">
        <button class="user-btn" data-mode="login">登录</button>
        <button class="user-btn is-primary" data-mode="register">注册</button>
      </div>`;
    bar.querySelectorAll("[data-mode]").forEach((b) =>
      b.addEventListener("click", () => openAuthModal(b.dataset.mode))
    );
  }
}

let _authMode = "login";
function openAuthModal(mode) {
  _authMode = mode === "register" ? "register" : "login";
  const modal = $("#auth-modal");
  applyAuthMode();
  $("#auth-error").classList.add("hidden");
  $("#auth-form").reset();
  modal.classList.remove("hidden");
  setTimeout(() => $("#auth-username").focus(), 50);
}

function closeAuthModal() {
  $("#auth-modal").classList.add("hidden");
}

function applyAuthMode() {
  const isReg = _authMode === "register";
  $("#auth-title").textContent = isReg ? "注册新账号" : "登录";
  $("#auth-subtitle").textContent = isReg
    ? "用户名 2-32 字符 · 密码至少 6 位"
    : "用账号同步你的视频解析历史";
  $("#auth-confirm-field").hidden = !isReg;
  $("#auth-submit").textContent = isReg ? "注册" : "登录";
  $("#auth-switch-hint").textContent = isReg ? "已经有账号？" : "没有账号？";
  $("#auth-switch").textContent = isReg ? "去登录" : "注册一个";
}

function bindAuthModal() {
  $("#auth-close")?.addEventListener("click", closeAuthModal);
  $("#auth-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "auth-modal") closeAuthModal();
  });
  $("#auth-switch")?.addEventListener("click", (e) => {
    e.preventDefault();
    _authMode = _authMode === "register" ? "login" : "register";
    applyAuthMode();
    $("#auth-error").classList.add("hidden");
  });
  $("#auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = $("#auth-username").value.trim();
    const password = $("#auth-password").value;
    const errEl = $("#auth-error");
    errEl.classList.add("hidden");
    const submitBtn = $("#auth-submit");
    submitBtn.disabled = true;
    try {
      if (_authMode === "register") {
        const confirmPw = $("#auth-confirm").value;
        if (confirmPw !== password) throw new Error("两次输入的密码不一致");
        await registerUser(username, password);
      } else {
        await loginUser(username, password);
      }
      closeAuthModal();
      renderUserBar();
      renderHistory();  // 切换用户后历史记录立刻刷新
      showToast(_authMode === "register" ? "注册成功，已登录" : "登录成功");
    } catch (err) {
      errEl.textContent = err.message || String(err);
      errEl.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
    }
  });
  // ESC 关闭
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#auth-modal").classList.contains("hidden")) {
      closeAuthModal();
    }
  });
}

async function registerUser(username, password) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `注册失败 (HTTP ${res.status})`);
  }
  state.auth.token = data.token;
  state.auth.user = data.user;
  localStorage.setItem(AUTH_TOKEN_KEY, data.token);
}

async function loginUser(username, password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `登录失败 (HTTP ${res.status})`);
  }
  state.auth.token = data.token;
  state.auth.user = data.user;
  localStorage.setItem(AUTH_TOKEN_KEY, data.token);
}

async function logoutUser() {
  if (state.auth.token) {
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: authHeaders() });
    } catch {}
  }
  state.auth.token = null;
  state.auth.user = null;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  renderUserBar();
  renderHistory();
  showToast("已退出登录");
}

/* ============================================================
 * 「猜你想看」：进结果页就在右侧 panel 渲染 AI 延伸关键词
 * ============================================================ */
async function loadRecommendPanel() {
  if (!state.result) return;
  const body = $("#recommend-body");
  if (!body) return;
  const subtitle = $("#recommend-subtitle");
  const footer = $("#recommend-footer");

  if (subtitle) subtitle.textContent = "AI 正在想下一个该看的方向…";
  body.innerHTML = `
    <div class="rec-loading">
      <span class="rec-loading-dot"></span><span class="rec-loading-dot"></span><span class="rec-loading-dot"></span>
    </div>`;

  try {
    const data = await fetchRecommend();
    if (subtitle) {
      subtitle.textContent = data.source === "gemini"
        ? "看完这段，AI 觉得你还想搜这些"
        : "用视频里的延伸问题给你做了候选";
    }
    if (footer) {
      footer.textContent = data.source === "gemini"
        ? "关键词由 Gemini 提炼"
        : "由视频分析结果生成";
    }
    body.innerHTML = renderRecommendItems(data.items);
  } catch (e) {
    console.warn("recommend failed:", e);
    // Gemini 不可达：用 follow_up_questions / key_concepts 本地兜底
    const items = buildLocalRecommendItems(state.result);
    if (subtitle) subtitle.textContent = "AI 暂不可用，从视频里挑了几个延伸点";
    if (footer) footer.textContent = "本地兜底";
    body.innerHTML = items.length
      ? renderRecommendItems(items)
      : `<div class="rec-loading text-xs">没有可推荐的关键词</div>`;
  }
}

async function fetchRecommend() {
  const body = { task_id: state.taskId };
  if (state.fromHistory && state.result) body.analysis = state.result;
  // mock task_id（"mock-1" 这种）后端会找不到 task → 直接带 analysis
  if (typeof state.taskId === "string" && state.taskId.startsWith("mock-")) {
    body.analysis = state.result;
  }
  const res = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return await res.json();
}

function renderRecommendItems(items) {
  if (!items || !items.length) {
    return `<div class="rec-loading text-xs">AI 暂时没找到合适的延伸方向</div>`;
  }
  return items.map((it) => {
    const v = it.bilibili_video;
    return `
      <div class="rec-row">
        <div class="rec-kw"># ${escapeHtml(it.keyword)}</div>
        ${v ? `
          <a class="rec-video-card" target="_blank" rel="noopener noreferrer"
             href="${escapeHtml(v.url)}"
             title="${escapeHtml(v.reason || v.title)}">
            <div class="rec-video-cover">
              ${v.cover ? `<img src="${escapeHtml(v.cover)}" alt="" referrerpolicy="no-referrer" loading="lazy"
                              onerror="this.style.display='none';this.parentElement.classList.add('rec-cover-fallback');" />` : ''}
              <span class="rec-cover-placeholder">B 站</span>
            </div>
            <div class="rec-video-meta">
              <div class="rec-video-title">${escapeHtml(v.title)}</div>
              <div class="rec-video-sub">
                ${v.author ? `<span class="rec-author">${escapeHtml(v.author)}</span>` : ''}
                ${v.view ? `<span class="rec-sep">·</span><span>${formatView(v.view)}</span>` : ''}
                ${typeof v.score === 'number' ? `<span class="rec-sep">·</span><span class="rec-score">匹配 ${v.score}</span>` : ''}
              </div>
            </div>
          </a>` : ''}
        <div class="rec-links">
          <a class="rec-link rec-bilibili" target="_blank" rel="noopener noreferrer" href="${escapeHtml(it.bilibili_search_url)}">B 站${v ? '搜更多' : '搜'}</a>
          ${it.douyin_url ? `<a class="rec-link rec-douyin" target="_blank" rel="noopener noreferrer" href="${escapeHtml(it.douyin_url)}">抖音搜</a>` : ''}
        </div>
      </div>`;
  }).join("");
}

function formatView(n) {
  n = Number(n) || 0;
  if (n >= 10000) return (n / 10000).toFixed(n >= 100000 ? 0 : 1) + " 万";
  return String(n);
}

function buildLocalRecommendItems(result) {
  const kws = [];
  const seen = new Set();
  for (const q of (result.follow_up_questions || []).slice(0, 3)) {
    const k = (q || "").trim().replace(/[？?。.！!]+$/g, "");
    if (k && k.length >= 2 && k.length <= 16 && !seen.has(k)) {
      kws.push(k); seen.add(k);
    }
  }
  for (const c of (result.key_concepts || []).slice(0, 6)) {
    const k = (c.name || "").trim();
    if (k && k.length >= 2 && k.length <= 12 && !seen.has(k)) {
      kws.push(k); seen.add(k);
    }
    if (kws.length >= 5) break;
  }
  return kws.slice(0, 5).map((kw) => ({
    keyword: kw,
    bilibili_video: null,  // 本地兜底没有真实搜索结果
    bilibili_search_url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(kw)}`,
    douyin_url: `https://www.douyin.com/search/${encodeURIComponent(kw)}`,
  }));
}

/* ============================================================
 * 上传 & URL 提交
 * ============================================================ */
async function handleFile(file) {
  state.fromHistory = false;
  showProgressOverlay();
  setStage("uploading", 0, `正在上传 ${file.name}…`);
  const fd = new FormData();
  fd.append("video", file);
  try {
    const res = await postWithUploadProgress("/api/analyze", fd, (pct) => {
      setStage("uploading", pct, `上传中 ${pct}%`);
    });
    const { task_id } = res;
    state.taskId = task_id;
    state.pendingSources.set(task_id, { type: "file", value: file.name });
    listenProgress(task_id);
  } catch (e) {
    // 后端不可用时用 mock 走一遍流程
    fakeAnalyze();
  }
}

async function handleUrl(url) {
  state.fromHistory = false;
  showProgressOverlay();
  setStage("uploading", 5, "正在解析链接…");
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ url }),
    });
    const { task_id } = await res.json();
    state.taskId = task_id;
    state.pendingSources.set(task_id, { type: "url", value: url });
    listenProgress(task_id);
  } catch (e) {
    fakeAnalyze();
  }
}

function postWithUploadProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error("invalid JSON")); }
      } else reject(new Error("upload failed: " + xhr.status));
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.send(formData);
  });
}

function listenProgress(taskId) {
  const es = new EventSource(`/api/progress/${taskId}`);
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      setStage(data.stage, data.percent || 0, data.message || "");
      if (data.stage === "done") {
        es.close();
        if (data.result) {
          renderResult(data.result);
          saveCurrentAnalysis(data.result, taskId);
        } else {
          fetchResult(taskId);
        }
      } else if (data.stage === "error") {
        es.close();
        alert("分析失败：" + (data.error || "未知错误"));
        hideProgressOverlay();
      }
    } catch (err) {
      console.warn("bad sse payload", err);
    }
  };
  es.onerror = () => {
    es.close();
    // 离线兜底
    fakeAnalyze();
  };
}

async function fetchResult(taskId) {
  try {
    const res = await fetch(`/api/result/${taskId}`);
    const data = await res.json();
    // /api/result/{task_id} 返回的是 { task_id, stage, percent, message, result, error } 外壳，
    // 真正的分析结果在 data.result 字段里。只在 data.result 存在时渲染，避免传 wrapper 导致 title/summary undefined。
    if (data && data.result) {
      renderResult(data.result);
      saveCurrentAnalysis(data.result, taskId);
    } else {
      throw new Error("/api/result 返回了空 result");
    }
  } catch (e) {
    console.warn("fetchResult failed:", e);
    renderResult(window.__MOCK__);
  }
}

/* 没有后端时,假装跑一遍进度,方便看动画 */
function fakeAnalyze() {
  const steps = [
    { stage: "uploading",   percent: 12,  message: "视频拿到了，正在准备…" },
    { stage: "uploading",   percent: 30,  message: "上传完成 · 唤醒 AI 中" },
    { stage: "analyzing",   percent: 45,  message: "AI 正在一帧帧看视频，没漏" },
    { stage: "analyzing",   percent: 62,  message: "听懂了主讲人在说什么" },
    { stage: "structuring", percent: 78,  message: "把零散的概念串成知识图…" },
    { stage: "structuring", percent: 92,  message: "顺手帮你出几道题，别紧张" },
    { stage: "done",        percent: 100, message: "知识就绪 · 给你的私人课程" },
  ];
  let i = 0;
  const tick = () => {
    if (i >= steps.length) {
      renderResult(window.__MOCK__);
      return;
    }
    const s = steps[i++];
    setStage(s.stage, s.percent, s.message);
    setTimeout(tick, 700);
  };
  tick();
}

/* ============================================================
 * 进度遮罩
 * ============================================================ */
function showProgressOverlay() {
  const el = $("#progress-overlay");
  el.classList.remove("hidden", "fading");
}
function hideProgressOverlay() {
  const el = $("#progress-overlay");
  el.classList.add("fading");
  setTimeout(() => el.classList.add("hidden"), 320);
}
function setStage(stage, percent, message) {
  const order = ["uploading", "analyzing", "structuring", "done"];
  const curIdx = order.indexOf(stage);
  $$(".stage-icon").forEach((el) => {
    const i = order.indexOf(el.dataset.stage);
    el.classList.remove("active", "done");
    if (i < curIdx) el.classList.add("done");
    else if (i === curIdx) el.classList.add(stage === "done" ? "done" : "active");
  });
  $("#progress-message").textContent = message || "";
  $("#progress-bar").style.width = `${percent}%`;
  $("#progress-pct").textContent = `${percent}%`;
}

/* ============================================================
 * 渲染结果
 * ============================================================ */
function renderResult(data) {
  try {
    if (!data || typeof data !== "object") {
      throw new Error("结果数据为空");
    }
    state.result = data;
    state.chatHistory = [];
    state.quiz = { idx: 0, correct: 0, answered: false, wrong: [] };
    state.selectedConcept = null;
    state.learning.mastered = new Set();
    state.learning.visibleLevels = new Set(["core", "branch", "leaf", "unknown"]);
    state.learning.visibleRelations = null;

    // 切到结果区（淡出 overlay）
    setTimeout(() => {
      hideProgressOverlay();
      $("#hero-header")?.classList.add("hidden");
      $("#input-section").classList.add("hidden");
      $("#result-section").classList.remove("hidden");
      switchTab("cards");
    }, 300);

    // Tab 1: 知识卡片
    $("#result-title").textContent = data.title || "（未命名视频）";
    $("#result-summary").textContent = data.summary || "（暂无概览）";

    const concepts = Array.isArray(data.key_concepts) ? data.key_concepts : [];
    if (concepts.length) {
      $("#concept-grid").innerHTML = concepts
        .map(
          (c) => `
          <div class="concept-card" data-concept="${escapeHtml(c.name)}" role="button" tabindex="0" aria-label="在图谱中查看「${escapeHtml(c.name)}」">
            <div class="concept-name">${escapeHtml(c.name)}</div>
            <div class="concept-explanation">${escapeHtml(c.explanation)}</div>
            ${c.analogy ? `<div class="concept-analogy">${escapeHtml(c.analogy)}</div>` : ""}
            <div class="concept-hint">点击在图谱中定位 →</div>
          </div>`
        )
        .join("");
      $("#concept-grid")
        .querySelectorAll(".concept-card")
        .forEach((el) => {
          el.addEventListener("click", () =>
            switchTab("graph", { highlight: el.dataset.concept })
          );
          el.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              el.click();
            }
          });
        });
    } else {
      $("#concept-grid").innerHTML = emptyState("该视频暂无核心概念");
    }

    const kps = Array.isArray(data.key_points) ? data.key_points : [];
    if (kps.length) {
      const sortedKp = [...kps].sort(
        (a, b) => tsToSeconds(a.timestamp) - tsToSeconds(b.timestamp)
      );
      $("#key-points-list").innerHTML = sortedKp
        .map(
          (k) => `
          <div class="kp-item">
            <div class="kp-dot ${k.importance || ""}"></div>
            <div>
              <div class="kp-ts">${escapeHtml(k.timestamp || "")}</div>
              <div class="kp-text">${escapeHtml(k.point)}</div>
            </div>
          </div>`
        )
        .join("");
    } else {
      $("#key-points-list").innerHTML = emptyState("暂无关键时间点", "compact");
    }

    // Tab 3 聊天建议
    const followUps = Array.isArray(data.follow_up_questions) ? data.follow_up_questions : [];
    if (followUps.length) {
      $("#chat-suggestions").innerHTML = followUps
        .map((q) => `<button class="suggestion-chip">${escapeHtml(q)}</button>`)
        .join("");
      $("#chat-suggestions")
        .querySelectorAll(".suggestion-chip")
        .forEach((b) =>
          b.addEventListener("click", () => {
            $("#chat-input").value = b.textContent;
            sendChat();
          })
        );
    } else {
      $("#chat-suggestions").innerHTML = `<div class="text-xs text-white/30">直接在下方输入你想问的问题</div>`;
    }
    $("#chat-messages").innerHTML = `
      <div class="chat-bubble assistant">
        你好，我已经看完这段视频了。可以问我任何相关的问题，或者点上方的推荐问题。
      </div>`;

    // Tab 4 测验
    renderQuiz();

    // 图谱左栏筛选（节点/连线分级显示）
    renderFilterPanel();

    // 「猜你想看」：进结果页就在右栏渲染
    loadRecommendPanel();
  } catch (err) {
    console.error("renderResult failed:", err);
    hideProgressOverlay();
    $("#input-section").classList.remove("hidden");
    $("#result-section").classList.add("hidden");
    showToast(`渲染失败：${err.message || err}`, "error");
  }
}

function emptyState(text, variant = "default") {
  const pad = variant === "compact" ? "py-4" : "py-10";
  return `<div class="empty-state ${pad}">${escapeHtml(text)}</div>`;
}

function showToast(msg, kind = "info") {
  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

/* ============================================================
 * Tab 切换
 * ============================================================ */
function bindTabs() {
  $$(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}
function switchTab(name, opts = {}) {
  $$(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  ["cards", "graph", "chat", "quiz"].forEach((t) => {
    const panel = $(`#tab-${t}`);
    const isActive = t === name;
    panel.classList.toggle("hidden", !isActive);
    if (isActive) {
      panel.classList.remove("fade-in");
      void panel.offsetWidth;
      panel.classList.add("fade-in");
    }
  });
  if (name === "graph") {
    renderGraph(opts.highlight);
  } else if (name === "cards" && opts.highlight) {
    requestAnimationFrame(() => highlightConceptCard(opts.highlight));
  }
  if (name === "quiz") attachQuizKeyboard();
  else detachQuizKeyboard();
}

/* ============================================================
 * D3 概念图谱
 * ============================================================ */
let _graphApi = null;
let _graphTimers = [];
let _tourState = null;

const RELATION_TYPES = {
  contain:  { match: /包含|包括|属于|内含/,             color: "#6366f1", label: "包含" },
  cause:    { match: /导致|引起|造成|来源|产生|引发/,   color: "#ef4444", label: "导致" },
  contrast: { match: /对比|区别|不同|相反|差异/,        color: "#f59e0b", label: "对比" },
  progress: { match: /递进|发展|演化|延伸|进一步|衍生/, color: "#22c55e", label: "递进" },
  analogy:  { match: /类比|相似|类似|像/,               color: "#a855f7", label: "类比" },
  depend:   { match: /依赖|基于|建立在|前提|定义|描述/, color: "#0ea5e9", label: "依赖" },
};

function classifyRelation(text) {
  if (!text) return "default";
  for (const [k, v] of Object.entries(RELATION_TYPES)) {
    if (v.match.test(text)) return k;
  }
  return "default";
}
function relationColor(type) {
  return RELATION_TYPES[type]?.color || "#6b7180";
}
function clearGraphTimers() {
  _graphTimers.forEach((id) => clearInterval(id));
  _graphTimers = [];
  if (_tourState) _tourState.stopped = true;
  _tourState = null;
}

function renderGraph(highlightName) {
  if (!state.result) return;
  clearGraphTimers();

  // 重置 UI 控件
  const playBtn = $("#graph-play");
  if (playBtn) {
    playBtn.querySelector(".graph-ctrl-icon").textContent = "▶";
    playBtn.querySelector(".graph-ctrl-label").textContent = "讲解";
    playBtn.classList.remove("is-playing");
  }
  $("#graph-tour-bar")?.classList.add("hidden");
  const legendEl = $("#graph-legend");
  if (legendEl) legendEl.innerHTML = "";

  // 同步 layout 按钮的 active 态（首次进入或切换 demo 时）
  document.querySelectorAll(".layout-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.layout === state.graphLayout)
  );

  // 径向 mindmap 模式
  if (state.graphLayout === "radial") {
    return renderRadialGraph(highlightName);
  }

  const svg = d3.select("#graph-svg");
  svg.selectAll("*").remove();

  const concepts = state.result.key_concepts || [];
  const rels = state.result.concept_relations || [];
  if (!concepts.length) {
    svg.append("text")
      .attr("x", "50%").attr("y", "50%")
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.4)")
      .text("该视频没有提取出概念关系");
    _graphApi = null;
    return;
  }

  const width = svg.node().clientWidth;
  const height = +svg.attr("height") || 600;
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  // ---- 节点 & 链接数据 ----
  const nodes = concepts.map((c) => {
    const lv = extractLevel(c.explanation);
    return {
      id: c.name,
      explanation: cleanExplanation(c.explanation),
      analogy: c.analogy,
      level: lv,                  // "core" / "branch" / "leaf" / null
    };
  });
  const links = rels
    .map((r) => ({
      source: r.from,
      target: r.to,
      relation: r.relation,
      type: classifyRelation(r.relation),
    }))
    .filter((l) => nodes.find((n) => n.id === l.source) && nodes.find((n) => n.id === l.target));

  // ---- 节点重要性分级：degree + key_points 提及 ----
  const keyPoints = state.result.key_points || [];
  const mentions = {};
  const degrees = {};
  nodes.forEach((n) => { mentions[n.id] = 0; degrees[n.id] = 0; });
  keyPoints.forEach((kp) => {
    nodes.forEach((n) => {
      if (kp.point && kp.point.includes(n.id)) mentions[n.id]++;
    });
  });
  links.forEach((l) => {
    degrees[l.source] = (degrees[l.source] || 0) + 1;
    degrees[l.target] = (degrees[l.target] || 0) + 1;
  });
  const rawScore = (id) => degrees[id] * 1.5 + mentions[id] * 1.2;
  const maxScore = Math.max(...nodes.map((n) => rawScore(n.id)), 1);
  nodes.forEach((n) => {
    n.score = rawScore(n.id) / maxScore;
    if (n.level) {
      n.radius = LEVEL_STYLE[n.level].radius;
      n.isCore = n.level === "core";
    } else {
      n.radius = 22 + n.score * 22;
      n.isCore = n.score >= 0.7;
    }
  });

  // ---- 邻接表 ----
  const neighbors = new Map(nodes.map((n) => [n.id, new Set([n.id])]));
  links.forEach((l) => {
    neighbors.get(l.source).add(l.target);
    neighbors.get(l.target).add(l.source);
  });

  // ---- 力布局：核心节点斥力更强、collide 用半径 ----
  const sim = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(130))
    .force("charge", d3.forceManyBody().strength((d) => -350 - d.score * 250))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius((d) => d.radius + 8));

  // ---- 缩放/平移 ----
  const container = svg.append("g").attr("class", "graph-zoom");
  svg.call(
    d3.zoom()
      .scaleExtent([0.4, 3])
      .filter((event) => !event.target.closest(".node"))
      .on("zoom", (event) => container.attr("transform", event.transform))
  );

  // ---- defs: 每种关系一个箭头 marker + 核心节点发光 filter ----
  const defs = container.append("defs");
  ["default", ...Object.keys(RELATION_TYPES)].forEach((t) => {
    defs.append("marker")
      .attr("id", `arrow-${t}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 30).attr("refY", 0)
      .attr("markerWidth", 6).attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", relationColor(t))
      .attr("opacity", 0.85);
  });
  const glow = defs.append("filter")
    .attr("id", "node-glow").attr("x", "-50%").attr("y", "-50%")
    .attr("width", "200%").attr("height", "200%");
  glow.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
  const merge = glow.append("feMerge");
  merge.append("feMergeNode").attr("in", "blur");
  merge.append("feMergeNode").attr("in", "SourceGraphic");

  // ---- 连线 ----
  const link = container
    .append("g").attr("class", "links")
    .selectAll("line").data(links).join("line")
    .attr("class", (d) => `link link-${d.type}`)
    .attr("stroke", (d) => relationColor(d.type))
    .attr("stroke-width", 1.6)
    .attr("stroke-opacity", 0.7)
    .attr("marker-end", (d) => `url(#arrow-${d.type})`);

  const linkLabel = container
    .append("g").attr("class", "link-labels")
    .selectAll("text").data(links).join("text")
    .attr("class", "link-label")
    .attr("text-anchor", "middle")
    .attr("fill", (d) => relationColor(d.type))
    .text((d) => d.relation || "");

  // ---- 粒子层：每条 link 一个粒子，周期性从 source→target 流动 ----
  const particle = container
    .append("g").attr("class", "particles")
    .selectAll("circle").data(links).join("circle")
    .attr("class", "particle")
    .attr("r", 2.6)
    .attr("fill", (d) => relationColor(d.type))
    .attr("opacity", 0);

  // ---- 节点 ----
  const node = container
    .append("g").attr("class", "nodes")
    .selectAll("g").data(nodes).join("g")
    .attr("class", (d) => "node" + (d.isCore ? " is-core" : ""))
    .attr("data-concept", (d) => d.id)
    .call(d3.drag()
      .on("start", (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end", (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null; d.fy = null;
      }));

  // 核心节点的外圈柔光
  node.filter((d) => d.isCore)
    .append("circle")
    .attr("class", "node-halo")
    .attr("r", (d) => d.radius + 10)
    .attr("fill", "#818cf8")
    .attr("fill-opacity", 0.12);

  node
    .append("circle")
    .attr("class", "node-bg")
    .attr("r", (d) => d.radius)
    .attr("fill", (d) => d.level
      ? LEVEL_STYLE[d.level].fill
      : d3.interpolateRgb("#3730a3", "#a5b4fc")(d.score))
    .attr("fill-opacity", 0.95)
    .attr("stroke", (d) => d.level
      ? LEVEL_STYLE[d.level].stroke
      : (d.isCore ? "#fde68a" : "#c7d2fe"))
    .attr("stroke-width", (d) => d.isCore ? 2.8 : 1.5)
    .attr("filter", (d) => d.isCore ? "url(#node-glow)" : null);

  node
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 4)
    .attr("font-size", (d) => Math.round(Math.max(11, Math.min(15, 10 + d.score * 6))))
    .attr("font-weight", (d) => d.isCore ? 700 : 500)
    .attr("fill", (d) => d.level === "core" ? "#1a1d29" : "#fff")
    .text((d) => d.id);

  // ---- 邻域聚焦 ----
  function focusNeighborhood(id) {
    const ns = neighbors.get(id) || new Set([id]);
    node.classed("dim", (d) => !ns.has(d.id));
    node.classed("focus", (d) => d.id === id);
    link.classed("dim", (d) => !(d.source.id === id || d.target.id === id));
    link.classed("focus", (d) => d.source.id === id || d.target.id === id);
    linkLabel.classed("dim", (d) => !(d.source.id === id || d.target.id === id));
  }
  function clearFocus() {
    node.classed("dim", false).classed("focus", false);
    link.classed("dim", false).classed("focus", false);
    linkLabel.classed("dim", false);
  }

  const tt = $("#graph-tooltip");
  node
    .on("mouseenter", (event, d) => {
      focusNeighborhood(d.id);
      tt.classList.remove("hidden");
      tt.innerHTML = `<div class="font-bold mb-1 text-brandSoft">${escapeHtml(d.id)}${d.isCore ? '<span class="text-xs text-yellow-300 ml-1">· 核心</span>' : ''}</div>
        <div class="text-white/80">${escapeHtml(d.explanation || "")}</div>
        ${d.analogy ? `<div class="mt-2 text-white/60 italic">类比：${escapeHtml(d.analogy)}</div>` : ""}`;
    })
    .on("mousemove", (event) => {
      const rect = svg.node().getBoundingClientRect();
      tt.style.left = event.clientX - rect.left + 14 + "px";
      tt.style.top = event.clientY - rect.top + 14 + "px";
    })
    .on("mouseleave", () => {
      if (!state.selectedConcept) clearFocus();
      else focusNeighborhood(state.selectedConcept);
      tt.classList.add("hidden");
    })
    .on("click", (event, d) => {
      event.stopPropagation();
      state.selectedConcept = d.id;
      focusNeighborhood(d.id);
      switchTab("cards", { highlight: d.id });
    });

  svg.on("click", () => {
    state.selectedConcept = null;
    clearFocus();
  });

  sim.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
    linkLabel
      .attr("x", (d) => (d.source.x + d.target.x) / 2)
      .attr("y", (d) => (d.source.y + d.target.y) / 2 - 4);
    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });

  // ---- 粒子动画：每 2.2s 启动一次 source→target 流动 ----
  function emitParticles() {
    particle
      .attr("cx", (d) => d.source.x)
      .attr("cy", (d) => d.source.y)
      .attr("opacity", 0.9)
      .transition().duration(1700).ease(d3.easeCubicInOut)
      .attr("cx", (d) => d.target.x)
      .attr("cy", (d) => d.target.y)
      .attr("opacity", 0);
  }
  setTimeout(emitParticles, 700);
  _graphTimers.push(setInterval(emitParticles, 2200));

  // ---- 图例 + 控制按钮 ----
  renderGraphLegend(links);
  bindGraphControls({ nodes, sim, focusNeighborhood, clearFocus });

  _graphApi = {
    pulse(name) {
      const target = node.filter((d) => d.id === name);
      if (target.empty()) return;
      target.classed("pulsing", true);
      setTimeout(() => target.classed("pulsing", false), 1600);
      state.selectedConcept = name;
      focusNeighborhood(name);
    },
    focusNeighborhood,
    clearFocus,
    nodes,
    sim,
  };

  if (highlightName) {
    setTimeout(() => _graphApi && _graphApi.pulse(highlightName), 250);
  }
}

/* ============================================================
 * 径向 mindmap：root(视频主题) → core 节点 → 分支/细节
 * 用 d3.cluster() 算坐标，d3.linkRadial() 画曲线
 * ============================================================ */
function renderRadialGraph(highlightName) {
  const svg = d3.select("#graph-svg");
  svg.selectAll("*").remove();

  const concepts = state.result.key_concepts || [];
  const rels = state.result.concept_relations || [];
  if (!concepts.length) {
    svg.append("text")
      .attr("x", "50%").attr("y", "50%")
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.4)")
      .text("该视频没有提取出概念");
    _graphApi = null;
    return;
  }

  // 准备节点数据（同 force 版逻辑：level + score）
  const nodes = concepts.map((c) => {
    const lv = extractLevel(c.explanation);
    return {
      id: c.name,
      explanation: cleanExplanation(c.explanation),
      analogy: c.analogy,
      level: lv,
    };
  });
  const links = rels
    .map((r) => ({
      source: r.from,
      target: r.to,
      relation: r.relation,
      type: classifyRelation(r.relation),
    }))
    .filter((l) => nodes.find((n) => n.id === l.source) && nodes.find((n) => n.id === l.target));

  // 度数 + key_points 提及打 score（决定 root 选择和 fallback 分级）
  const keyPoints = state.result.key_points || [];
  const mentions = {};
  const degrees = {};
  nodes.forEach((n) => { mentions[n.id] = 0; degrees[n.id] = 0; });
  keyPoints.forEach((kp) => {
    nodes.forEach((n) => { if (kp.point && kp.point.includes(n.id)) mentions[n.id]++; });
  });
  links.forEach((l) => {
    degrees[l.source] = (degrees[l.source] || 0) + 1;
    degrees[l.target] = (degrees[l.target] || 0) + 1;
  });
  const maxRaw = Math.max(...nodes.map((n) => degrees[n.id] * 1.5 + mentions[n.id] * 1.2), 1);
  nodes.forEach((n) => {
    n.score = (degrees[n.id] * 1.5 + mentions[n.id] * 1.2) / maxRaw;
    n.isCore = n.level === "core" || (!n.level && n.score >= 0.7);
  });

  const tree = buildRadialHierarchy(nodes, links);
  const root = d3.hierarchy(tree);

  const width = svg.node().clientWidth || 800;
  const height = +svg.attr("height") || svg.node().clientHeight || 600;
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const radius = Math.min(width, height) / 2 - 90;
  d3.cluster().size([2 * Math.PI, radius])(root);

  // 缩放/平移容器，内部以画布中心为原点（方便 d3.linkRadial 直接画）
  const container = svg.append("g").attr("class", "graph-zoom");
  svg.call(
    d3.zoom().scaleExtent([0.5, 2.5])
      .filter((event) => !event.target.closest(".node"))
      .on("zoom", (event) => container.attr("transform", event.transform))
  );
  // 把中心移到画布正中
  const root_g = container.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

  // ----- 链接（root → core 不画；core → leaf 画曲线） -----
  const visibleLinks = root.links().filter((l) => !l.source.data.isRoot);
  const linkPath = d3.linkRadial().angle((d) => d.x).radius((d) => d.y);
  const link = root_g.append("g")
    .attr("class", "links")
    .attr("fill", "none")
    .attr("stroke", "#4b5169")
    .attr("stroke-opacity", 0.55)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(visibleLinks)
    .join("path")
    .attr("class", "link link-radial")
    .attr("d", linkPath);

  // ----- 节点（跳过虚拟 root） -----
  const visibleNodes = root.descendants().filter((d) => !d.data.isRoot);
  const radialPoint = (d) => {
    const a = d.x - Math.PI / 2;
    return [Math.cos(a) * d.y, Math.sin(a) * d.y];
  };

  const node = root_g.append("g").attr("class", "nodes")
    .selectAll("g")
    .data(visibleNodes)
    .join("g")
    .attr("class", (d) => "node radial-node" + (d.data.data?.isCore ? " is-core" : ""))
    .attr("data-concept", (d) => d.data.id)
    .attr("transform", (d) => {
      const [x, y] = radialPoint(d);
      return `translate(${x},${y})`;
    });

  // 节点圆
  node.append("circle")
    .attr("r", (d) => {
      const data = d.data.data;
      const lv = data?.level;
      if (lv === "core") return 18;
      if (lv === "branch") return 13;
      if (lv === "leaf") return 9;
      return data?.isCore ? 16 : 10;
    })
    .attr("fill", (d) => {
      const lv = d.data.data?.level;
      if (lv && LEVEL_STYLE[lv]) return LEVEL_STYLE[lv].fill;
      return d.data.data?.isCore ? "#fbbf24" : "#818cf8";
    })
    .attr("stroke", (d) => d.data.data?.level === "core" || d.data.data?.isCore ? "#fde68a" : "#c7d2fe")
    .attr("stroke-width", 1.5)
    .attr("filter", (d) => d.data.data?.level === "core" || d.data.data?.isCore ? "url(#radial-glow)" : null);

  // 节点文字：始终保持水平正向（不旋转），靠 x 偏移 + text-anchor 决定左/右展开
  node.append("text")
    .attr("dy", "0.32em")
    .attr("x", (d) => (d.x < Math.PI ? 14 : -14))
    .attr("text-anchor", (d) => (d.x < Math.PI ? "start" : "end"))
    .attr("fill", (d) => d.data.data?.level === "core" ? "#fde68a" : "#fff")
    .attr("font-size", (d) => {
      const lv = d.data.data?.level;
      if (lv === "core") return 14;
      if (lv === "branch") return 12;
      return 11;
    })
    .attr("font-weight", (d) => d.data.data?.level === "core" ? 700 : 500)
    .text((d) => d.data.id);

  // 中心：视频标题
  const centerTitle = (state.result.title || "视频主题").slice(0, 14);
  root_g.append("circle")
    .attr("r", 38)
    .attr("fill", "#1f2231")
    .attr("stroke", "#fde68a")
    .attr("stroke-width", 2)
    .attr("filter", "url(#radial-glow)");
  root_g.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.32em")
    .attr("fill", "#fde68a")
    .attr("font-size", 13)
    .attr("font-weight", 700)
    .text(centerTitle);

  // 发光 filter
  const defs = container.append("defs");
  const glow = defs.append("filter").attr("id", "radial-glow")
    .attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
  glow.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "blur");
  const merge = glow.append("feMerge");
  merge.append("feMergeNode").attr("in", "blur");
  merge.append("feMergeNode").attr("in", "SourceGraphic");

  // Tooltip + 点击跳卡片（跟 force 版一致）
  const tt = $("#graph-tooltip");
  node
    .on("mouseenter", (event, d) => {
      const data = d.data.data;
      if (!data) return;
      tt.classList.remove("hidden");
      tt.innerHTML = `<div class="font-bold mb-1 text-brandSoft">${escapeHtml(d.data.id)}${data.isCore ? '<span class="text-xs text-yellow-300 ml-1">· 核心</span>' : ''}</div>
        <div class="text-white/80">${escapeHtml(data.explanation || "")}</div>
        ${data.analogy ? `<div class="mt-2 text-white/60 italic">类比：${escapeHtml(data.analogy)}</div>` : ""}`;
    })
    .on("mousemove", (event) => {
      const rect = svg.node().getBoundingClientRect();
      tt.style.left = event.clientX - rect.left + 14 + "px";
      tt.style.top = event.clientY - rect.top + 14 + "px";
    })
    .on("mouseleave", () => tt.classList.add("hidden"))
    .on("click", (event, d) => {
      event.stopPropagation();
      state.selectedConcept = d.data.id;
      switchTab("cards", { highlight: d.data.id });
    });

  // 图例（用一致的 force 关系图例）—— mindmap 模式下隐藏，因为不画关系颜色
  $("#graph-legend").innerHTML = `
    <div class="graph-legend-panel">
      <div class="graph-legend-title">节点层级</div>
      <div class="graph-legend-item"><span class="graph-legend-swatch" style="background:#fbbf24"></span><span>核心</span></div>
      <div class="graph-legend-item"><span class="graph-legend-swatch" style="background:#818cf8"></span><span>分支</span></div>
      <div class="graph-legend-item"><span class="graph-legend-swatch" style="background:#5b4ddc"></span><span>细节</span></div>
    </div>`;

  // 径向模式下「讲解」按钮暂时禁用（讲解逻辑跟 force 的 sim/focusNeighborhood 绑死）
  const playBtn = $("#graph-play");
  if (playBtn) {
    playBtn.onclick = () => showToast("讲解模式暂只在力布局下可用");
  }
  const resetBtn = $("#graph-reset");
  if (resetBtn) {
    resetBtn.onclick = () => renderGraph();
  }

  _graphApi = {
    pulse(name) {
      const target = node.filter((d) => d.data.id === name);
      if (target.empty()) return;
      target.classed("pulsing", true);
      setTimeout(() => target.classed("pulsing", false), 1600);
    },
    nodes: visibleNodes.map((d) => d.data.data).filter(Boolean),
  };

  if (highlightName) {
    setTimeout(() => _graphApi && _graphApi.pulse(highlightName), 250);
  }
}

/** 把图状 nodes/links 转成 mindmap 层级：root → cores → 其余按邻接 / 轮询分配 */
function buildRadialHierarchy(nodes, links) {
  const adj = new Map();
  nodes.forEach((n) => adj.set(n.id, new Set()));
  links.forEach((l) => {
    const s = typeof l.source === "string" ? l.source : l.source.id;
    const t = typeof l.target === "string" ? l.target : l.target.id;
    if (adj.has(s) && adj.has(t)) {
      adj.get(s).add(t);
      adj.get(t).add(s);
    }
  });

  // 找核心节点
  let cores = nodes.filter((n) => n.level === "core" || n.isCore);
  if (cores.length === 0) {
    const sorted = [...nodes].sort((a, b) => (b.score || 0) - (a.score || 0));
    cores = sorted.slice(0, Math.min(5, Math.max(2, Math.ceil(nodes.length * 0.25))));
  }
  cores = cores.slice(0, 6); // 最多 6 个 core 不然环上太挤

  const coreIds = new Set(cores.map((c) => c.id));
  const others = nodes.filter((n) => !coreIds.has(n.id));

  const childrenByCore = new Map();
  cores.forEach((c) => childrenByCore.set(c.id, []));

  let robin = 0;
  others.forEach((o) => {
    const neighbors = adj.get(o.id) || new Set();
    const linked = cores.filter((c) => neighbors.has(c.id));
    let parent;
    if (linked.length > 0) {
      // 选邻居最少的 core 来"均衡"
      linked.sort((a, b) => childrenByCore.get(a.id).length - childrenByCore.get(b.id).length);
      parent = linked[0];
    } else {
      parent = cores[robin % cores.length];
      robin++;
    }
    childrenByCore.get(parent.id).push(o);
  });

  return {
    id: "__root__",
    isRoot: true,
    children: cores.map((c) => ({
      id: c.id,
      data: c,
      children: (childrenByCore.get(c.id) || []).map((n) => ({ id: n.id, data: n })),
    })),
  };
}

function renderGraphLegend(links) {
  const el = $("#graph-legend");
  if (!el) return;
  const used = Array.from(new Set(links.map((l) => l.type).filter((t) => t !== "default")));
  if (!used.length) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <div class="graph-legend-panel">
      <div class="graph-legend-title">关系类型</div>
      ${used.map((t) => `
        <div class="graph-legend-item">
          <span class="graph-legend-swatch" style="background:${relationColor(t)}"></span>
          <span>${RELATION_TYPES[t].label}</span>
        </div>
      `).join("")}
    </div>`;
}

function bindGraphControls(ctx) {
  const playBtn = $("#graph-play");
  const resetBtn = $("#graph-reset");
  if (playBtn) {
    playBtn.onclick = () => {
      if (_tourState && !_tourState.stopped) stopTour(ctx);
      else startTour(ctx);
    };
  }
  if (resetBtn) {
    resetBtn.onclick = () => {
      state.selectedConcept = null;
      ctx.clearFocus();
      ctx.sim.alpha(0.7).restart();
    };
  }
  // 学习进度重置
  const learnReset = $("#learn-reset");
  if (learnReset) {
    learnReset.onclick = () => {
      state.learning.mastered = new Set();
      updateLearnProgress();
      renderConceptListPanel();
    };
  }
}

/* ============================================================
 * 整合视图：左侧筛选 + 右侧学习清单 + 学习进度
 * ============================================================ */
function renderFilterPanel() {
  if (!state.result) return;
  const concepts = state.result.key_concepts || [];
  const relations = state.result.concept_relations || [];

  // 统计每个 level 的概念数 + 关系类型分布
  const levelCount = { core: 0, branch: 0, leaf: 0, unknown: 0 };
  concepts.forEach((c) => {
    const lv = extractLevel(c.explanation) || "unknown";
    levelCount[lv]++;
  });
  const relCount = {};
  relations.forEach((r) => {
    const t = classifyRelation(r.relation);
    if (t === "default") return;
    relCount[t] = (relCount[t] || 0) + 1;
  });

  // 概念层级（仅显示有数据的层级）
  const levelsEl = $("#filter-levels");
  if (levelsEl) {
    const levels = ["core", "branch", "leaf", "unknown"].filter((l) => levelCount[l] > 0);
    levelsEl.innerHTML = levels.map((lv) => `
      <label class="filter-row" data-key="${lv}">
        <input type="checkbox" data-level="${lv}" ${state.learning.visibleLevels.has(lv) ? "checked" : ""} />
        <span class="filter-swatch" style="background:${LEVEL_STYLE[lv].fill}; border-color:${LEVEL_STYLE[lv].stroke}"></span>
        <span class="filter-label">${LEVEL_STYLE[lv].label}</span>
        <span class="filter-count">${levelCount[lv]}</span>
      </label>
    `).join("");
    levelsEl.querySelectorAll("input[data-level]").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const lv = e.target.dataset.level;
        if (e.target.checked) state.learning.visibleLevels.add(lv);
        else state.learning.visibleLevels.delete(lv);
        applyGraphFilters();
      });
    });
  }

  // 关系类型
  const relsEl = $("#filter-relations");
  if (relsEl) {
    const types = Object.keys(relCount);
    if (!types.length) {
      relsEl.innerHTML = '<div class="text-xs text-white/30 px-1">无关系信息</div>';
    } else {
      const isOn = (t) => state.learning.visibleRelations == null || state.learning.visibleRelations.has(t);
      relsEl.innerHTML = types.map((t) => `
        <label class="filter-row" data-key="${t}">
          <input type="checkbox" data-rel="${t}" ${isOn(t) ? "checked" : ""} />
          <span class="filter-swatch" style="background:${relationColor(t)}; border-color:${relationColor(t)}"></span>
          <span class="filter-label">${RELATION_TYPES[t].label}</span>
          <span class="filter-count">${relCount[t]}</span>
        </label>
      `).join("");
      relsEl.querySelectorAll("input[data-rel]").forEach((cb) => {
        cb.addEventListener("change", () => {
          // 收集当前所有 checked 的关系类型
          const checked = new Set();
          relsEl.querySelectorAll("input[data-rel]:checked").forEach((c) => checked.add(c.dataset.rel));
          state.learning.visibleRelations =
            checked.size === types.length ? null : checked;
          applyGraphFilters();
        });
      });
    }
  }

  // 统计行
  const stats = $("#graph-stats");
  if (stats) {
    stats.textContent = `节点 ${concepts.length} · 连线 ${relations.length}`;
  }
}

function applyGraphFilters() {
  // 节点：按 level 显示/隐藏（在 SVG 上加 .filtered class）
  const svg = d3.select("#graph-svg");
  svg.selectAll(".node").classed("filtered", (d) => {
    const lv = d.level || "unknown";
    return !state.learning.visibleLevels.has(lv);
  });
  svg.selectAll(".link").classed("filtered", (d) => {
    const visibleRel =
      state.learning.visibleRelations == null ||
      state.learning.visibleRelations.has(d.type);
    const sLv = (d.source.level) || "unknown";
    const tLv = (d.target.level) || "unknown";
    const visibleEnds =
      state.learning.visibleLevels.has(sLv) &&
      state.learning.visibleLevels.has(tLv);
    return !(visibleRel && visibleEnds);
  });
  svg.selectAll(".link-label").classed("filtered", function (d, i) {
    const link = svg.selectAll(".link").nodes()[i];
    return link ? link.classList.contains("filtered") : false;
  });
  svg.selectAll(".particle").classed("filtered", function (d, i) {
    const link = svg.selectAll(".link").nodes()[i];
    return link ? link.classList.contains("filtered") : false;
  });
}

function renderConceptListPanel() {
  const el = $("#concept-list-panel");
  if (!el) return;
  const concepts = state.result?.key_concepts || [];
  if (!concepts.length) {
    el.innerHTML = '<div class="text-xs text-white/30 py-2">暂无概念</div>';
    return;
  }
  // 按 level 排序：core > branch > leaf > unknown
  const order = { core: 0, branch: 1, leaf: 2, unknown: 3 };
  const sorted = [...concepts].sort((a, b) => {
    const la = extractLevel(a.explanation) || "unknown";
    const lb = extractLevel(b.explanation) || "unknown";
    return order[la] - order[lb];
  });
  el.innerHTML = sorted.map((c) => {
    const lv = extractLevel(c.explanation) || "unknown";
    const mastered = state.learning.mastered.has(c.name);
    return `
      <div class="concept-list-item ${mastered ? "is-mastered" : ""}" data-concept="${escapeHtml(c.name)}">
        <span class="cli-dot" style="background:${LEVEL_STYLE[lv].fill}"></span>
        <span class="cli-name">${escapeHtml(c.name)}</span>
        <button class="cli-toggle" data-action="toggle" title="${mastered ? "标为未掌握" : "标为已掌握"}">
          ${mastered ? "✓" : "○"}
        </button>
      </div>`;
  }).join("");
  el.querySelectorAll(".concept-list-item").forEach((row) => {
    const name = row.dataset.concept;
    row.addEventListener("click", (e) => {
      if (e.target.closest("[data-action=toggle]")) return;
      // 在图谱里高亮
      if (_graphApi) _graphApi.pulse(name);
    });
    row.querySelector("[data-action=toggle]").addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.learning.mastered.has(name)) state.learning.mastered.delete(name);
      else state.learning.mastered.add(name);
      updateLearnProgress();
      renderConceptListPanel();
    });
  });
}

function updateLearnProgress() {
  const total = state.result?.key_concepts?.length || 0;
  const done = state.learning.mastered.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const bar = $("#learn-progress-bar");
  const txt = $("#learn-progress-text");
  if (bar) bar.style.width = pct + "%";
  if (txt) txt.textContent = `${done} / ${total} 个 · ${pct}%`;
}

function startTour(ctx) {
  if (_tourState && !_tourState.stopped) return;
  const order = [...ctx.nodes].sort((a, b) => b.score - a.score);
  const playBtn = $("#graph-play");
  const tourBar = $("#graph-tour-bar");
  if (playBtn) {
    playBtn.querySelector(".graph-ctrl-icon").textContent = "⏸";
    playBtn.querySelector(".graph-ctrl-label").textContent = "暂停";
    playBtn.classList.add("is-playing");
  }
  tourBar?.classList.remove("hidden");

  _tourState = { stopped: false, idx: 0 };
  const step = () => {
    if (!_tourState || _tourState.stopped) return;
    if (_tourState.idx >= order.length) {
      if (tourBar) tourBar.innerHTML = `<div class="text-center text-white/60">讲解完毕 · 已带你走完 ${order.length} 个核心概念</div>`;
      setTimeout(() => stopTour(ctx), 1800);
      return;
    }
    const n = order[_tourState.idx++];
    state.selectedConcept = n.id;
    ctx.focusNeighborhood(n.id);
    if (_graphApi) _graphApi.pulse(n.id);
    if (tourBar) {
      tourBar.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="text-xs text-white/40 shrink-0 font-mono">${_tourState.idx}/${order.length}</div>
          <div class="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium" style="background:rgba(99,102,241,0.22); color:#c7d2fe;">${escapeHtml(n.id)}${n.isCore ? ' · 核心' : ''}</div>
          <div class="text-white/85 truncate flex-1">${escapeHtml(n.explanation || "")}</div>
        </div>`;
    }
  };
  step();
  const tid = setInterval(step, 3400);
  _tourState.timer = tid;
  _graphTimers.push(tid);
}

function stopTour(ctx) {
  if (!_tourState) return;
  _tourState.stopped = true;
  if (_tourState.timer) clearInterval(_tourState.timer);
  _tourState = null;
  const playBtn = $("#graph-play");
  if (playBtn) {
    playBtn.querySelector(".graph-ctrl-icon").textContent = "▶";
    playBtn.querySelector(".graph-ctrl-label").textContent = "讲解";
    playBtn.classList.remove("is-playing");
  }
  $("#graph-tour-bar")?.classList.add("hidden");
  if (ctx) ctx.clearFocus();
  state.selectedConcept = null;
}

/* ============================================================
 * 跨 Tab 联动 - 概念卡片高亮
 * ============================================================ */
function highlightConceptCard(name) {
  const card = $(`#concept-grid .concept-card[data-concept="${cssEscape(name)}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.remove("is-highlight");
  void card.offsetWidth;
  card.classList.add("is-highlight");
  setTimeout(() => card.classList.remove("is-highlight"), 1800);
}

function cssEscape(s) {
  if (window.CSS && CSS.escape) return CSS.escape(s);
  return String(s).replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
}

/* ============================================================
 * 测验键盘快捷键（仅在 Tab4 active 时绑定）
 * ============================================================ */
let _quizKeyHandler = null;
function attachQuizKeyboard() {
  if (_quizKeyHandler) return;
  _quizKeyHandler = (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    const q = state.result?.quiz || [];
    const onResult = state.quiz.idx >= q.length;
    if (!onResult && !state.quiz.answered && /^[1-4]$/.test(e.key)) {
      const idx = +e.key - 1;
      const btn = $$("#quiz-options .quiz-option")[idx];
      if (btn && !btn.disabled) btn.click();
      e.preventDefault();
    } else if (!onResult && state.quiz.answered && (e.key === "Enter" || e.key === " ")) {
      const next = $("#quiz-next");
      if (next && !next.classList.contains("hidden")) {
        next.click();
        e.preventDefault();
      }
    } else if (onResult && (e.key === "r" || e.key === "R")) {
      const r = $("#quiz-restart");
      if (r) r.click();
    }
  };
  document.addEventListener("keydown", _quizKeyHandler);
}
function detachQuizKeyboard() {
  if (_quizKeyHandler) {
    document.removeEventListener("keydown", _quizKeyHandler);
    _quizKeyHandler = null;
  }
}

/* ============================================================
 * Tab 3 聊天
 * ============================================================ */
function bindChat() {
  $("#chat-send").addEventListener("click", sendChat);
  $("#chat-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });
}
async function sendChat() {
  const input = $("#chat-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  appendChat("user", text);
  state.chatHistory.push({ role: "user", text });

  const thinking = appendChat("assistant", "思考中…");
  let reply = "";
  try {
    const body = {
      task_id: state.taskId,
      history: state.chatHistory.slice(0, -1),
      message: text,
    };
    // 历史还原项的 task_id 在后端 in-memory store 早就 GC 了，把当前分析直接捎给后端做兜底
    if (state.fromHistory && state.result) {
      body.analysis = state.result;
    }
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    reply = data.reply || "（无响应）";
  } catch (e) {
    reply = "**离线 mock 回复：** 这是一个示例答复，待后端就位后会替换为 AI 真实回答。";
  }
  thinking.innerHTML = window.marked ? marked.parse(reply) : escapeHtml(reply);
  state.chatHistory.push({ role: "assistant", text: reply });
  scrollChatToBottom();
}
function appendChat(role, text) {
  const div = document.createElement("div");
  div.className = `chat-bubble ${role}`;
  div.innerHTML = role === "assistant" && window.marked ? marked.parse(text) : escapeHtml(text);
  $("#chat-messages").appendChild(div);
  scrollChatToBottom();
  return div;
}
function scrollChatToBottom() {
  const el = $("#chat-messages");
  el.scrollTop = el.scrollHeight;
}

/* ============================================================
 * Tab 4 测验
 * ============================================================ */
function renderQuiz() {
  const q = state.result?.quiz || [];
  const card = $("#quiz-card");
  if (!q.length) {
    card.innerHTML = `<div class="text-white/40 text-center py-12">该视频暂无测验题</div>`;
    return;
  }
  if (state.quiz.idx >= q.length) {
    renderQuizResult(q);
    return;
  }

  const item = q[state.quiz.idx];
  const progressPct = Math.round((state.quiz.idx / q.length) * 100);
  card.innerHTML = `
    <div class="quiz-progress mb-4" aria-label="进度">
      <div class="quiz-progress-bar" style="width: ${progressPct}%"></div>
    </div>
    <div class="flex items-center justify-between mb-3">
      <div class="text-sm text-white/40">第 ${state.quiz.idx + 1} / ${q.length} 题</div>
      <div class="kbd-hint">
        <span class="kbd">1</span><span class="kbd">2</span><span class="kbd">3</span><span class="kbd">4</span>
        <span class="text-white/30 ml-1">选答案 ·</span>
        <span class="kbd">Enter</span>
        <span class="text-white/30">下一题</span>
      </div>
    </div>
    <div class="text-lg font-medium mb-6 leading-relaxed">${escapeHtml(item.question)}</div>
    <div id="quiz-options"></div>
    <div id="quiz-feedback" class="hidden mt-5 p-4 rounded-lg text-sm leading-relaxed"></div>
    <div class="mt-6 text-right">
      <button id="quiz-next" class="hidden bg-brand hover:bg-brandDeep px-5 py-2 rounded-xl2 font-medium transition">
        ${state.quiz.idx === q.length - 1 ? "查看结果" : "下一题"}
      </button>
    </div>`;

  const opts = $("#quiz-options");
  const letters = ["A", "B", "C", "D"];
  (item.options || []).forEach((opt, i) => {
    const b = document.createElement("button");
    b.className = "quiz-option";
    b.innerHTML = `<span class="quiz-option-letter">${letters[i]}</span><span class="quiz-option-text">${escapeHtml(opt)}</span>`;
    b.addEventListener("click", () => answerQuiz(letters[i], item));
    opts.appendChild(b);
  });
  $("#quiz-next").addEventListener("click", () => {
    state.quiz.idx++;
    state.quiz.answered = false;
    renderQuiz();
  });
}

function renderQuizResult(q) {
  const card = $("#quiz-card");
  const score = state.quiz.correct;
  const total = q.length;
  const hasWrong = state.quiz.wrong.length > 0;
  const tone =
    score === total ? "全部答对！" :
    score >= total * 0.7 ? "不错，继续保持" :
    score >= total / 2 ? "及格了，回看一遍会更稳" : "可以再看一遍视频哦";

  card.innerHTML = `
    <div class="text-center">
      <div class="quiz-score ${score === total ? "is-perfect" : ""} mb-2">${score} / ${total}</div>
      <div class="text-white/60 mb-7">${tone}</div>
      <div class="flex gap-3 justify-center flex-wrap">
        ${hasWrong ? `<button id="quiz-review" class="bg-inkLine hover:bg-inkLine/70 px-5 py-3 rounded-xl2 transition">
          查看错题 <span class="ml-1 px-2 py-0.5 rounded-full text-xs bg-red-500/30 text-red-200">${state.quiz.wrong.length}</span>
        </button>` : ""}
        <button id="quiz-restart" class="bg-brand hover:bg-brandDeep px-6 py-3 rounded-xl2 font-medium transition">
          再来一遍 <span class="kbd kbd-inline ml-1">R</span>
        </button>
      </div>
    </div>`;
  $("#quiz-restart").addEventListener("click", () => {
    state.quiz = { idx: 0, correct: 0, answered: false, wrong: [] };
    renderQuiz();
  });
  if (hasWrong) {
    $("#quiz-review").addEventListener("click", showQuizReview);
  }
  if (score === total) celebrate();
}

function showQuizReview() {
  const card = $("#quiz-card");
  const wrong = state.quiz.wrong;
  const letters = ["A", "B", "C", "D"];
  card.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="text-sm text-white/40">错题回顾 · ${wrong.length} 题</div>
      <button id="quiz-back-result" class="text-xs text-white/50 hover:text-white">← 返回得分</button>
    </div>
    <div class="space-y-5">
      ${wrong.map((w, i) => {
        const yourIdx = letters.indexOf(w.your);
        const ansIdx = letters.indexOf(w.item.answer);
        return `
        <div class="quiz-review-item">
          <div class="font-medium mb-3 leading-relaxed">${i + 1}. ${escapeHtml(w.item.question)}</div>
          <div class="space-y-1.5 mb-3">
            ${(w.item.options || []).map((opt, j) => {
              const isAns = j === ansIdx;
              const isYour = j === yourIdx;
              const cls = isAns ? "text-green-400" : isYour ? "text-red-400 line-through" : "text-white/40";
              const mark = isAns ? "✓" : isYour ? "✗" : " ";
              return `<div class="text-sm ${cls}"><span class="font-mono mr-2">${letters[j]} ${mark}</span>${escapeHtml(opt)}</div>`;
            }).join("")}
          </div>
          <div class="text-sm text-white/75 leading-relaxed concept-analogy" style="border-left-color:#22c55e">
            <span class="text-green-300 font-medium">解析：</span>${escapeHtml(w.item.explanation || "")}
          </div>
        </div>`;
      }).join("")}
    </div>
    <div class="mt-6 text-center">
      <button id="quiz-restart" class="bg-brand hover:bg-brandDeep px-6 py-3 rounded-xl2 font-medium transition">
        再来一遍
      </button>
    </div>`;
  $("#quiz-back-result").addEventListener("click", () => renderQuiz());
  $("#quiz-restart").addEventListener("click", () => {
    state.quiz = { idx: 0, correct: 0, answered: false, wrong: [] };
    renderQuiz();
  });
}

function answerQuiz(letter, item) {
  if (state.quiz.answered) return;
  state.quiz.answered = true;
  const ok = letter === item.answer;
  if (ok) state.quiz.correct++;
  else state.quiz.wrong.push({ idx: state.quiz.idx, item, your: letter });
  const letters = ["A", "B", "C", "D"];
  $$("#quiz-options .quiz-option").forEach((btn, i) => {
    btn.disabled = true;
    if (letters[i] === item.answer) {
      btn.classList.add("correct");
      // 答错时给正确答案加 pulse 让眼睛知道在哪
      if (!ok) btn.classList.add("reveal-pulse");
    } else if (letters[i] === letter) {
      btn.classList.add("wrong");
    } else {
      btn.classList.add("dim");
    }
  });
  const fb = $("#quiz-feedback");
  fb.classList.remove("hidden");
  fb.classList.add(ok ? "ok" : "ng");
  fb.innerHTML = `<div class="font-medium mb-1">${ok ? "回答正确 ✓" : "答错啦"}</div>
    <div class="text-white/80">${escapeHtml(item.explanation || "")}</div>`;
  $("#quiz-next").classList.remove("hidden");
}

function celebrate() {
  const colors = ["#6366f1", "#818cf8", "#22c55e", "#fbbf24", "#f472b6"];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = Math.random() * 0.4 + "s";
    piece.style.animationDuration = 1.8 + Math.random() * 1.2 + "s";
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3500);
  }
}

/* ============================================================
 * 工具
 * ============================================================ */
function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function tsToSeconds(ts) {
  if (!ts) return 0;
  const parts = ts.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return Number(ts) || 0;
}
