/* ============================================================
 * A1 · 图谱节点点击 → 高亮对应 key_points 条目
 *
 * 主 app.js 在 D3 节点 click 里已经做了：
 *   switchTab("cards", { highlight: d.id })
 * 自动跳卡片 Tab + 高亮匹配概念卡。所以原版 A1 的"浮动 chip 提示再跳"
 * 完全冗余——chip 出现的同时 tab 已经切走，chip 被盖死。
 *
 * 现版只保留一件主 app 没做的事：高亮 key_points 里提到该概念的条目。
 * 用 capture 阶段监听，跟 D3 的 click handler 并行不阻塞。
 * ============================================================ */
(function () {
  "use strict";

  function init() {
    document.addEventListener("click", onAnyClick, true);
  }

  function onAnyClick(e) {
    const nodeEl = e.target.closest("#graph-svg .node, #graph-svg .radial-node");
    if (!nodeEl) return;
    const text = nodeEl.querySelector("text");
    if (!text) return;
    const name = (text.textContent || "").trim();
    if (!name) return;
    // 等主 app 把 tab 切到 cards 之后再高亮 key_points
    setTimeout(() => highlightKeyPoints(name), 60);
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

  window.A1 = { highlightKeyPoints };
})();
