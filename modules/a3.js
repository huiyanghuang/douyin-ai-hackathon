/* ============================================================
 * A3 · 学习成就卡可分享 PNG
 * - 监听 #quiz-card 内出现 #quiz-restart → 注入"保存成就卡"按钮
 * - 用户点击 → 懒加载 html2canvas → 渲染模板 → 下载 PNG
 *
 * 隔离策略：
 *   - 不修改 main 的 renderQuizResult / renderQuiz
 *   - html2canvas 按需懒加载（不点不下载）
 *   - 数据从 DOM 读，不依赖 window.state
 * ============================================================ */
(function () {
  "use strict";

  const HTML2CANVAS_URL = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
  let html2canvasReady = null;

  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (html2canvasReady) return html2canvasReady;
    html2canvasReady = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = HTML2CANVAS_URL;
      s.async = true;
      s.onload = () => resolve(window.html2canvas);
      s.onerror = () => reject(new Error("html2canvas 加载失败"));
      document.head.appendChild(s);
    });
    return html2canvasReady;
  }

  function init() {
    const quizCard = document.getElementById("quiz-card");
    if (!quizCard) return;
    const ob = new MutationObserver(() => maybeInject());
    ob.observe(quizCard, { childList: true, subtree: true });
  }

  function maybeInject() {
    const restart = document.getElementById("quiz-restart");
    if (!restart) return;
    if (document.getElementById("a3-share-btn")) return;
    // 还要看看是否在 review 视图（错题回顾），那个也有 restart，但不放分享按钮
    const onResultPage = !!document.querySelector("#quiz-card .quiz-score");
    if (!onResultPage) return;

    const btn = document.createElement("button");
    btn.id = "a3-share-btn";
    btn.className = "a3-share-btn";
    btn.type = "button";
    btn.innerHTML = '<span class="a3-share-icon">📷</span><span>保存成就卡</span>';
    btn.addEventListener("click", onShareClick);
    restart.parentNode.insertBefore(btn, restart);
  }

  async function onShareClick() {
    const btn = document.getElementById("a3-share-btn");
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="a3-share-icon">⌛</span><span>生成中…</span>';
    try {
      populate();
      const html2canvas = await loadHtml2Canvas();
      const node = document.querySelector("#a3-card-template .a3-card");
      if (!node) throw new Error("成就卡模板未注入");
      const canvas = await html2canvas(node, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      });
      download(canvas.toDataURL("image/png"));
      btn.innerHTML = '<span class="a3-share-icon">✓</span><span>已保存到下载</span>';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '<span class="a3-share-icon">📷</span><span>再存一张</span>';
      }, 1800);
    } catch (e) {
      console.error("[A3] generate failed:", e);
      btn.disabled = false;
      btn.innerHTML = '<span class="a3-share-icon">↻</span><span>生成失败 · 点击重试</span>';
    }
  }

  function populate() {
    const title = (document.getElementById("result-title")?.textContent || "").trim() || "我的视频学习卡片";
    setText("a3-video-title", title);

    const scoreEl = document.querySelector("#quiz-card .quiz-score");
    const scoreText = (scoreEl?.textContent || "").trim() || "—/—";
    setText("a3-score", scoreText);

    let label = "已完成";
    const m = scoreText.match(/^(\d+)\s*\/\s*(\d+)/);
    if (m) {
      const ratio = +m[1] / +m[2];
      label =
        ratio === 1 ? "满分通关 ✦"
        : ratio >= 0.7 ? "学得不错"
        : ratio >= 0.5 ? "继续加油"
        : "再看一遍会更稳";
    }
    setText("a3-score-label", label);

    const ul = document.getElementById("a3-concepts");
    if (ul) {
      ul.innerHTML = "";
      const names = document.querySelectorAll("#concept-grid .concept-card .concept-name");
      Array.from(names).slice(0, 6).forEach((n) => {
        const li = document.createElement("li");
        li.textContent = (n.textContent || "").trim();
        ul.appendChild(li);
      });
    }
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function download(dataUrl) {
    const a = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[^\d]/g, "").slice(0, 14);
    a.href = dataUrl;
    a.download = `成就卡_${stamp}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.A3 = { onShareClick, loadHtml2Canvas };
})();
