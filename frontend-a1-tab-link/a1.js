/* ============================================================
 * A1 · 四 Tab 联动模块
 * 监听图谱节点点击 → 浮出 chip → 点击 chip 跳卡片 Tab + 高亮匹配
 * 概念卡片 + 高亮匹配的 key_points 时间戳条目。
 *
 * 隔离策略：
 *   - 不修改 main 现有任何函数
 *   - 用 document.addEventListener('click', ..., true) capture 阶段拦截
 *     节点点击（先于 D3 的 stopPropagation 执行）
 *   - 只读 main 的 switchTab 函数和 #concept-grid / #key-points-list DOM
 * ============================================================ */
(function () {
  "use strict";

  let chipEl = null;
  let chipNameEl = null;
  let currentName = null;
  let hideTimer = null;

  function init() {
    chipEl = document.getElementById("a1-chip");
    chipNameEl = document.getElementById("a1-chip-name");
    if (!chipEl || !chipNameEl) return;

    const goBtn = document.getElementById("a1-chip-go");
    const closeBtn = document.getElementById("a1-chip-close");
    if (goBtn) goBtn.addEventListener("click", goCards);
    if (closeBtn) closeBtn.addEventListener("click", hideChip);

    // 整个 chip 区域可点（除关闭键以外）也触发跳转
    chipEl.addEventListener("click", (e) => {
      if (e.target === closeBtn || closeBtn?.contains(e.target)) return;
      if (e.target === goBtn || goBtn?.contains(e.target)) return;
      goCards();
    });

    // capture 阶段监听节点点击 —— 先于 D3 内部 stopPropagation
    document.addEventListener("click", onAnyClick, true);
  }

  function onAnyClick(e) {
    const nodeEl = e.target.closest("#graph-svg .node, #graph-svg .radial-node");
    if (!nodeEl) return;
    const text = nodeEl.querySelector("text");
    if (!text) return;
    const name = (text.textContent || "").trim();
    if (!name) return;
    showChip(name);
  }

  function showChip(name) {
    currentName = name;
    chipNameEl.textContent = name;
    chipEl.classList.remove("hidden");
    requestAnimationFrame(() => chipEl.classList.add("is-show"));
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideChip, 5000);
  }

  function hideChip() {
    if (!chipEl) return;
    chipEl.classList.remove("is-show");
    clearTimeout(hideTimer);
    setTimeout(() => chipEl?.classList.add("hidden"), 280);
  }

  function goCards() {
    if (!currentName) return;
    const name = currentName;
    hideChip();
    if (typeof window.switchTab === "function") {
      window.switchTab("cards", { highlight: name });
    }
    requestAnimationFrame(() => highlightKeyPoints(name));
  }

  function highlightKeyPoints(name) {
    const items = document.querySelectorAll("#key-points-list .kp-item");
    let firstHit = null;
    items.forEach((el) => {
      const text = el.querySelector(".kp-text")?.textContent || "";
      if (text.includes(name)) {
        el.classList.remove("a1-active");
        void el.offsetWidth; // 强制重排，让 animation 重放
        el.classList.add("a1-active");
        if (!firstHit) firstHit = el;
        setTimeout(() => el.classList.remove("a1-active"), 1600);
      }
    });
    if (firstHit && typeof firstHit.scrollIntoView === "function") {
      firstHit.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 暴露给外部（调试或集成时手动触发）
  window.A1 = { showChip, hideChip, goCards, highlightKeyPoints };
})();
