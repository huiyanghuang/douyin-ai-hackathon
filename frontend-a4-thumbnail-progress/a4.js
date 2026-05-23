/* ============================================================
 * A4 · 视频缩略图 + 智能进度文案
 * - 用户选视频后 → canvas 抓首帧 → 显示在进度遮罩里
 * - 进度遮罩可见时 → 启动文案轮播（伪装"AI 正在看第 X 秒"）
 *
 * 隔离策略：
 *   - 在 #file-input 上添加额外 change listener（与原 handleFile 并行）
 *   - 缩略图渲染在客户端，不上传任何额外数据
 *   - 不修改 main 的 setStage / showProgressOverlay
 * ============================================================ */
(function () {
  "use strict";

  let injectEl = null;
  let canvas = null;
  let timeEl = null;
  let flavorEl = null;
  let flavorTimer = null;
  let videoDuration = 0;
  let hasThumb = false;

  const FLAVOR_TEMPLATES = [
    (t) => `AI 正在看第 ${t} 的镜头…`,
    (t) => `读到第 ${t} · 听主讲在讲什么`,
    (t) => `在第 ${t} 这一帧识别出一个新概念`,
    (t) => `把第 ${t} 的字幕拼到结构里`,
    (t) => `回看第 ${t} 找跟前面概念的关联`,
    (t) => `第 ${t} 看完了，没漏要点`,
    (t) => `第 ${t} · 画面信息密度很高，慢慢嚼`,
  ];

  function init() {
    injectEl = document.getElementById("a4-overlay-inject");
    canvas = document.getElementById("a4-thumb-canvas");
    timeEl = document.getElementById("a4-thumb-time");
    flavorEl = document.getElementById("a4-flavor");
    if (!injectEl || !canvas) return;

    // 把模板节点 re-parent 到 progress-overlay 内部，紧贴在 #progress-message 上方
    const message = document.getElementById("progress-message");
    if (message && injectEl.parentNode !== message.parentNode) {
      message.parentNode.insertBefore(injectEl, message);
    }

    // file-input 变化 —— 与原 handleFile 并行，互不干扰
    const fi = document.getElementById("file-input");
    if (fi) fi.addEventListener("change", onFileChange);

    // 进度遮罩可见时启动文案轮播；隐藏时停
    const overlay = document.getElementById("progress-overlay");
    if (overlay) {
      const ob = new MutationObserver(() => {
        const visible = !overlay.classList.contains("hidden");
        if (visible) {
          if (hasThumb) injectEl.classList.remove("hidden");
          startFlavor();
        } else {
          stopFlavor();
          // overlay 完全隐藏后再藏缩略图，避免淡出闪烁
          setTimeout(() => injectEl?.classList.add("hidden"), 320);
        }
      });
      ob.observe(overlay, { attributes: true, attributeFilter: ["class"] });
    }
  }

  async function onFileChange(e) {
    const file = e.target?.files?.[0];
    if (!file || !file.type.startsWith("video/")) {
      hasThumb = false;
      return;
    }
    try {
      await captureFirstFrame(file);
      hasThumb = true;
      injectEl.classList.remove("hidden");
    } catch (err) {
      console.warn("[A4] thumb capture failed:", err);
      hasThumb = false;
    }
  }

  function captureFirstFrame(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.preload = "metadata";
      v.src = url;
      const cleanup = () => URL.revokeObjectURL(url);

      v.addEventListener("loadedmetadata", () => {
        videoDuration = isFinite(v.duration) ? v.duration : 0;
        if (timeEl) timeEl.textContent = fmt(videoDuration);
        // 跳到 0.5s 抓帧（避开纯黑首帧）
        try {
          v.currentTime = Math.min(0.5, videoDuration > 0 ? videoDuration / 2 : 0.5);
        } catch {
          // currentTime 设置失败 → 直接画当前帧
          drawAndResolve();
        }
      }, { once: true });

      v.addEventListener("seeked", drawAndResolve, { once: true });
      v.addEventListener("error", () => { cleanup(); reject(new Error("video load error")); }, { once: true });

      // 超时兜底：6 秒还没抓到帧 → 放弃
      const timeoutId = setTimeout(() => { cleanup(); reject(new Error("timeout")); }, 6000);

      function drawAndResolve() {
        clearTimeout(timeoutId);
        try {
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#1a1d29";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          cleanup();
          resolve();
        } catch (err) {
          cleanup();
          reject(err);
        }
      }
    });
  }

  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function randomTime() {
    const dur = videoDuration > 0 ? videoDuration : 480; // 没视频时假设 8 分钟
    return fmt(Math.random() * dur);
  }

  function startFlavor() {
    stopFlavor();
    const tick = () => {
      if (!flavorEl) return;
      const tpl = FLAVOR_TEMPLATES[Math.floor(Math.random() * FLAVOR_TEMPLATES.length)];
      flavorEl.textContent = tpl(randomTime());
    };
    tick();
    flavorTimer = setInterval(tick, 1800);
  }

  function stopFlavor() {
    if (flavorTimer) {
      clearInterval(flavorTimer);
      flavorTimer = null;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.A4 = { captureFirstFrame, startFlavor, stopFlavor };
})();
