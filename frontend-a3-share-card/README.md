# A3 · 学习成就卡模块

## 做什么

测验做完后，得分页自动注入一个「保存成就卡」按钮。点击后用 html2canvas 把一张精心设计的卡片（含视频标题 + 得分 + 评语 + 前 6 个概念 + 二维码标识）渲染成 PNG 并下载。

适合用户截图分享朋友圈 / 小红书，**演示视频里这一帧极有传播力**。

## 文件

| 文件 | 作用 |
|---|---|
| `a3.html` | 隐藏在视口外的成就卡模板（被 html2canvas 抓取） |
| `a3.css` | 卡片视觉样式 + 注入按钮样式 |
| `a3.js` | 监听 quiz 结果出现 → 注入按钮 → 按需加载 html2canvas → 生成 PNG |

## 隔离设计

- CSS 前缀 `.a3-`
- DOM id `a3-*`
- 全局 `window.A3`
- html2canvas 通过 jsdelivr CDN **按需懒加载**（用户不点按钮就不下载）
- 不修改 main 的 `renderQuizResult` 函数

## 集成方法

1. 把 `a3.html` 内容粘进 `<body>`
2. `<head>` 加：`<link rel="stylesheet" href="a3.css" />`
3. `</body>` 前加：`<script src="a3.js"></script>`

> ⚠️ 不需要在 `<head>` 提前引 html2canvas —— A3 会在用户点按钮时才动态注入。

## 依赖

- main 的 `#quiz-card`、`#quiz-restart`、`#result-title`、`#concept-grid` DOM
- html2canvas 1.4.1（由模块自己懒加载）
