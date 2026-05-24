/* ============================================================
 * A2 · 生成完成庆祝动画模块
 * MutationObserver 监听 #result-section 出现的瞬间 → 触发过场动画
 * + confetti（复用 main 既有的 .confetti-piece keyframes）
 *
 * 隔离策略：
 *   - 不修改任何 main 函数
 *   - 不依赖 window.state（数据从已渲染的 DOM 读）
 *   - 不与 main 的 celebrate() 冲突（celebrate 仍只在满分时被 quiz 调用）
 * ============================================================ */
(function () {
  "use strict";

  let overlay = null;
  let statsEl = null;
  let lastTriggered = 0;

  function init() {
    overlay = document.getElementById("a2-celebrate");
    statsEl = document.getElementById("a2-stats");
    const resultSection = document.getElementById("result-section");
    if (!overlay || !resultSection) return;

    const ob = new MutationObserver(() => {
      const visible = !resultSection.classList.contains("hidden");
      const now = Date.now();
      // 防抖：5 秒内最多触发一次（避免 class 抖动）
      if (visible && now - lastTriggered > 5000) {
        lastTriggered = now;
        run();
      }
    });
    ob.observe(resultSection, { attributes: true, attributeFilter: ["class"] });
  }

  function run() {
    // 等 renderResult 把字段渲染完
    setTimeout(() => {
      const conceptCount = document.querySelectorAll("#concept-grid .concept-card").length;
      const kpCount = document.querySelectorAll("#key-points-list .kp-item").length;

      if (statsEl) {
        if (conceptCount > 0 || kpCount > 0) {
          statsEl.innerHTML = [
            conceptCount ? `<span>${conceptCount}</span> 个概念` : "",
            kpCount ? `<span>${kpCount}</span> 个关键时间点` : "",
          ].filter(Boolean).join(" · ");
        } else {
          statsEl.textContent = "祝你学习愉快";
        }
      }

      overlay.classList.remove("hidden");
      rainConfetti();
      setTimeout(() => overlay.classList.add("hidden"), 1900);
    }, 380);
  }

  function rainConfetti() {
    const colors = ["#fde68a", "#f59e0b", "#fbbf24", "#818cf8", "#c7d2fe", "#f472b6"];
    for (let i = 0; i < 56; i++) {
      const p = document.createElement("div");
      p.className = "confetti-piece";
      if (i < 18) p.classList.add("a2-gold");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.4) + "s";
      p.style.animationDuration = (1.6 + Math.random() * 1.6) + "s";
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 3500);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.A2 = { run, rainConfetti };
})();
