/* ============================================================
 * A5 · 浅色/深色主题切换 + localStorage 持久化
 * - 首次访问跟随系统 prefers-color-scheme
 * - 切换后写入 localStorage("a5_theme")，刷新保持
 *
 * 隔离策略：
 *   - 在 <html> 元素上设 data-theme="light"/"dark"
 *   - 所有视觉变化交给 a5.css 用 :root[data-theme="..."] 选择器实现
 * ============================================================ */
(function () {
  "use strict";

  const STORAGE_KEY = "a5_theme";

  function getInitialTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch {}
    try {
      if (window.matchMedia?.("(prefers-color-scheme: light)").matches) return "light";
    } catch {}
    return "dark";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }

  function toggle() {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(cur === "dark" ? "light" : "dark");
  }

  function init() {
    // 如果 inline FOUC 脚本没有先跑，这里兜底再设一次
    if (!document.documentElement.getAttribute("data-theme")) {
      applyTheme(getInitialTheme());
    }
    const btn = document.getElementById("a5-toggle");
    if (btn) btn.addEventListener("click", toggle);
  }

  // FOUC 防护：尽早执行
  applyTheme(getInitialTheme());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.A5 = { toggle, applyTheme, getInitialTheme };
})();
