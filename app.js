/* ============================================================
 * 科普视频 AI 解构器 - 前端主逻辑
 * 工作顺序按 prompt.txt：先用 mock 跑通骨架，再逐步接 API。
 * ============================================================ */

/* ---------- Mock 数据（没有后端时用） ---------- */
window.__MOCK__ = {
  title: "黑洞为什么不会发光？事件视界与时空弯曲入门",
  summary:
    "黑洞并非“完全黑”，而是因为其引力强到连光都无法逃脱事件视界。本视频从牛顿引力出发，类比逃逸速度的概念，逐步引入爱因斯坦广义相对论中“时空弯曲”的新理解，并简述霍金辐射如何让黑洞重新“被看见”。",
  key_concepts: [
    {
      name: "事件视界",
      explanation: "黑洞周围的一个临界球面，进入它以后任何信息都无法再返回外部宇宙。",
      analogy: "像瀑布顶端的“不可挽回点”——一旦水流过了那条线，再怎么挣扎都只能往下掉。",
    },
    {
      name: "逃逸速度",
      explanation: "要彻底摆脱一个天体引力束缚所需的最小速度。当逃逸速度超过光速时,黑洞就形成了。",
      analogy: "像在蹦床上跳——蹦床越软（引力越强），你要跳得越用力才能离开。",
    },
    {
      name: "时空弯曲",
      explanation: "广义相对论中,质量会使周围的时空发生几何变形,物体沿着弯曲的时空“直线”运动,表现为引力。",
      analogy: "像放在橡胶膜上的保龄球,周围会凹下去,小球滚过时会被吸过来。",
    },
    {
      name: "霍金辐射",
      explanation: "量子效应导致黑洞视界附近不断有粒子-反粒子对产生,其中一部分逃逸出去,使黑洞缓慢蒸发。",
      analogy: "像漏气的轮胎——看起来密封,实际每一秒都在微小地散发能量。",
    },
    {
      name: "奇点",
      explanation: "黑洞中心理论上密度无限大、时空曲率无限大的点,目前物理定律在此失效。",
      analogy: "像数学公式里的“除以零”——不是真的无穷大,而是模型在这里破了。",
    },
  ],
  concept_relations: [
    { from: "逃逸速度", to: "事件视界", relation: "超过光速时定义出" },
    { from: "时空弯曲", to: "事件视界", relation: "几何描述" },
    { from: "事件视界", to: "霍金辐射", relation: "量子效应来源于" },
    { from: "事件视界", to: "奇点", relation: "包裹" },
    { from: "时空弯曲", to: "奇点", relation: "极端表现" },
  ],
  key_points: [
    { point: "黑洞不是“洞”,而是一个极端致密的天体", timestamp: "00:32", importance: "high" },
    { point: "用逃逸速度类比解释为什么光也跑不掉", timestamp: "01:15", importance: "high" },
    { point: "广义相对论的“等效原理”是理解时空弯曲的入口", timestamp: "02:48", importance: "medium" },
    { point: "黑洞并非永恒,会通过霍金辐射缓慢蒸发", timestamp: "04:20", importance: "high" },
    { point: "奇点是当前物理理论的边界,不是物理实体", timestamp: "05:05", importance: "medium" },
    { point: "EHT 望远镜拍到的“照片”实际是吸积盘", timestamp: "06:30", importance: "low" },
  ],
  quiz: [
    {
      question: "黑洞之所以“黑”,最准确的解释是？",
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
      question: "下列哪一项最贴近“事件视界”的物理含义？",
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
    "为什么科学家说黑洞内部“时间”和“空间”会调换？",
    "霍金辐射真的被观测到了吗？",
  ],
};

/* ---------- 全局状态 ---------- */
const state = {
  taskId: null,
  result: null,
  // 记录本次提交的来源（用于历史卡片显示），由 handleFile / handleUrl 设置
  pendingSource: null,
  chatHistory: [],
  quiz: {
    idx: 0,
    correct: 0,
    answered: false,
  },
};

/* ---------- localStorage 历史记录 ---------- */
const HISTORY_KEY = "dyhk_history_v1";
const HISTORY_MAX = 20;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
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
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
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

/* 把分析完成的结果保存为一条历史记录。
   只在真实分析结束（listenProgress / fetchResult）时调用，
   不在点击历史卡片时调用（那只是重新渲染）。 */
function saveCurrentAnalysis(data) {
  if (!data) return;
  const item = {
    id: state.taskId || `local-${Date.now()}`,
    title: data.title || (state.pendingSource?.value ?? "未命名视频"),
    source_type: state.pendingSource?.type || "unknown",
    source_value: state.pendingSource?.value || "",
    savedAt: Date.now(),
    result: data,
  };
  saveHistoryItem(item);
  renderHistory();
  state.pendingSource = null;
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

/* ---------- DOM 引用 ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ============================================================
 * 入口
 * ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  bindInput();
  bindTabs();
  bindChat();
  bindBack();
  bindHistoryClear();
  renderHistory();
});

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
    state.taskId = null;
    state.result = null;
  });
}

/* ============================================================
 * 我的历史记录（来自 localStorage）
 * ============================================================ */
function renderHistory() {
  const list = $("#demo-list");
  const clearBtn = $("#history-clear");
  const items = loadHistory();

  if (!items.length) {
    // 空状态：还没解析过任何视频
    clearBtn?.classList.add("hidden");
    list.innerHTML = `
      <div class="col-span-full text-center py-10 text-white/30 text-sm">
        <div class="text-3xl mb-2">📭</div>
        <div>你还没有解析过视频</div>
        <div class="text-xs mt-1 text-white/20">上传或粘贴一个链接试试吧</div>
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

  // 点击卡片：还原结果面板
  list.querySelectorAll(".demo-card").forEach((el) => {
    el.addEventListener("click", (ev) => {
      // 点 × 按钮不要触发卡片点击
      if (ev.target.classList.contains("history-del")) return;
      const idx = +el.dataset.idx;
      const it = items[idx];
      if (!it) return;
      state.taskId = it.id;
      renderResult(it.result);
    });
  });

  // 点 ×：删除单条
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
 * 上传 & URL 提交
 * ============================================================ */
async function handleFile(file) {
  // 记录来源，分析完成后会写进历史
  state.pendingSource = { type: "file", value: file.name };
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
    listenProgress(task_id);
  } catch (e) {
    // 后端不可用时用 mock 走一遍流程
    fakeAnalyze();
  }
}

async function handleUrl(url) {
  state.pendingSource = { type: "url", value: url };
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
          saveCurrentAnalysis(data.result);
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
    // 后端 /api/result 返回的是包装层 { task_id, stage, result, ... }，
    // 真正的分析结果在 result 字段里；老路径返回的就是 data 本身
    const payload = data?.result ?? data;
    renderResult(payload);
    saveCurrentAnalysis(payload);
  } catch (e) {
    renderResult(window.__MOCK__);
  }
}

/* 没有后端时,假装跑一遍进度,方便看动画 */
function fakeAnalyze() {
  const steps = [
    { stage: "uploading", percent: 25, message: "上传完成" },
    { stage: "analyzing", percent: 55, message: "AI 正在理解视频内容…" },
    { stage: "structuring", percent: 85, message: "构建知识结构…" },
    { stage: "done", percent: 100, message: "完成！" },
  ];
  let i = 0;
  const tick = () => {
    if (i >= steps.length) {
      renderResult(window.__MOCK__);
      return;
    }
    const s = steps[i++];
    setStage(s.stage, s.percent, s.message);
    setTimeout(tick, 900);
  };
  tick();
}

/* ============================================================
 * 进度遮罩
 * ============================================================ */
function showProgressOverlay() {
  $("#progress-overlay").classList.remove("hidden");
}
function hideProgressOverlay() {
  $("#progress-overlay").classList.add("hidden");
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
  state.result = data;
  state.chatHistory = [];
  state.quiz = { idx: 0, correct: 0, answered: false };

  // 切到结果区
  setTimeout(() => {
    hideProgressOverlay();
    $("#input-section").classList.add("hidden");
    $("#result-section").classList.remove("hidden");
    switchTab("cards");
  }, 300);

  // Tab 1: 知识卡片
  $("#result-title").textContent = data.title || "";
  $("#result-summary").textContent = data.summary || "";

  $("#concept-grid").innerHTML = (data.key_concepts || [])
    .map(
      (c) => `
      <div class="concept-card">
        <div class="concept-name">${escapeHtml(c.name)}</div>
        <div class="concept-explanation">${escapeHtml(c.explanation)}</div>
        ${c.analogy ? `<div class="concept-analogy">${escapeHtml(c.analogy)}</div>` : ""}
      </div>`
    )
    .join("");

  const sortedKp = [...(data.key_points || [])].sort((a, b) =>
    tsToSeconds(a.timestamp) - tsToSeconds(b.timestamp)
  );
  $("#key-points-list").innerHTML = sortedKp
    .map(
      (k) => `
      <div class="kp-item">
        <div class="kp-dot ${k.importance}"></div>
        <div>
          <div class="kp-ts">${escapeHtml(k.timestamp || "")}</div>
          <div class="kp-text">${escapeHtml(k.point)}</div>
        </div>
      </div>`
    )
    .join("");

  // Tab 2 图谱在切换时再渲染（要拿到容器宽度）
  // Tab 3 聊天建议
  $("#chat-suggestions").innerHTML = (data.follow_up_questions || [])
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
  $("#chat-messages").innerHTML = `
    <div class="chat-bubble assistant">
      你好，我已经看完这段视频了。可以问我任何相关的问题，或者点上方的推荐问题。
    </div>`;

  // Tab 4 测验
  renderQuiz();
}

/* ============================================================
 * Tab 切换
 * ============================================================ */
function bindTabs() {
  $$(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}
function switchTab(name) {
  $$(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  ["cards", "graph", "chat", "quiz"].forEach((t) => {
    $(`#tab-${t}`).classList.toggle("hidden", t !== name);
  });
  if (name === "graph") renderGraph();
}

/* ============================================================
 * D3 概念图谱
 * ============================================================ */
let graphRendered = false;
function renderGraph() {
  if (!state.result) return;
  const svg = d3.select("#graph-svg");
  svg.selectAll("*").remove();
  graphRendered = true;

  const concepts = state.result.key_concepts || [];
  const rels = state.result.concept_relations || [];
  if (!concepts.length) return;

  const width = svg.node().clientWidth;
  const height = +svg.attr("height") || 600;
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const nodes = concepts.map((c) => ({ id: c.name, explanation: c.explanation, analogy: c.analogy }));
  const links = rels
    .map((r) => ({ source: r.from, target: r.to, relation: r.relation }))
    .filter((l) => nodes.find((n) => n.id === l.source) && nodes.find((n) => n.id === l.target));

  const sim = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(120))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(45));

  // 箭头
  svg
    .append("defs")
    .append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 28)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#6366f1")
    .attr("opacity", 0.7);

  const link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link")
    .attr("stroke-width", 1.5)
    .attr("marker-end", "url(#arrow)");

  const linkLabel = svg
    .append("g")
    .selectAll("text")
    .data(links)
    .join("text")
    .attr("class", "link-label")
    .attr("text-anchor", "middle")
    .text((d) => d.relation || "");

  const node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .call(
      d3
        .drag()
        .on("start", (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

  node
    .append("circle")
    .attr("r", 26)
    .attr("fill", "#6366f1")
    .attr("fill-opacity", 0.85)
    .attr("stroke", "#a5b4fc")
    .attr("stroke-width", 2);

  node
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 4)
    .text((d) => d.id);

  // Tooltip
  const tt = $("#graph-tooltip");
  node
    .on("mouseenter", (event, d) => {
      tt.classList.remove("hidden");
      tt.innerHTML = `<div class="font-bold mb-1 text-brandSoft">${escapeHtml(d.id)}</div>
        <div class="text-white/80">${escapeHtml(d.explanation || "")}</div>
        ${d.analogy ? `<div class="mt-2 text-white/60 italic">类比：${escapeHtml(d.analogy)}</div>` : ""}`;
    })
    .on("mousemove", (event) => {
      const rect = svg.node().getBoundingClientRect();
      tt.style.left = event.clientX - rect.left + 14 + "px";
      tt.style.top = event.clientY - rect.top + 14 + "px";
    })
    .on("mouseleave", () => tt.classList.add("hidden"));

  sim.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
    linkLabel
      .attr("x", (d) => (d.source.x + d.target.x) / 2)
      .attr("y", (d) => (d.source.y + d.target.y) / 2 - 4);
    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });
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
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: state.taskId,
        history: state.chatHistory.slice(0, -1),
        message: text,
      }),
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
    card.innerHTML = `<div class="text-white/40 text-center">该视频暂无测验题</div>`;
    return;
  }
  if (state.quiz.idx >= q.length) {
    const score = state.quiz.correct;
    const total = q.length;
    card.innerHTML = `
      <div class="text-center">
        <div class="text-5xl font-bold text-brand mb-3">${score} / ${total}</div>
        <div class="text-white/60 mb-6">${
          score === total ? "满分通过！" : score >= total / 2 ? "不错，继续加油" : "可以再看一遍视频哦"
        }</div>
        <button id="quiz-restart" class="bg-brand hover:bg-brandDeep px-6 py-3 rounded-xl2 font-medium transition">
          再来一遍
        </button>
      </div>`;
    $("#quiz-restart").addEventListener("click", () => {
      state.quiz = { idx: 0, correct: 0, answered: false };
      renderQuiz();
    });
    if (score === total) celebrate();
    return;
  }

  const item = q[state.quiz.idx];
  card.innerHTML = `
    <div class="text-sm text-white/40 mb-2">第 ${state.quiz.idx + 1} / ${q.length} 题</div>
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
    b.innerHTML = `<span class="text-brandSoft font-bold mr-3">${letters[i]}</span>${escapeHtml(opt)}`;
    b.addEventListener("click", () => answerQuiz(letters[i], item));
    opts.appendChild(b);
  });
  $("#quiz-next").addEventListener("click", () => {
    state.quiz.idx++;
    state.quiz.answered = false;
    renderQuiz();
  });
}

function answerQuiz(letter, item) {
  if (state.quiz.answered) return;
  state.quiz.answered = true;
  const ok = letter === item.answer;
  if (ok) state.quiz.correct++;
  const letters = ["A", "B", "C", "D"];
  $$("#quiz-options .quiz-option").forEach((btn, i) => {
    btn.disabled = true;
    if (letters[i] === item.answer) btn.classList.add("correct");
    else if (letters[i] === letter) btn.classList.add("wrong");
    else btn.classList.add("dim");
  });
  const fb = $("#quiz-feedback");
  fb.classList.remove("hidden");
  fb.style.background = ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)";
  fb.style.borderLeft = `3px solid ${ok ? "#22c55e" : "#ef4444"}`;
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
