# A2 · 生成完成庆祝动画模块

## 做什么

视频分析结束、结果区淡入时，全屏弹出一个 1.8 秒的金光过场：
- 中央"你的私人课程已就绪"渐变大字
- 副标 X 个概念 · Y 个关键时间点
- 自动撒一波金色 + 紫色 confetti（复用 styles.css 既有 `.confetti-piece` 动画）

强化赛题要求的"获得感"评分点，演示视频里这一帧能直接当封面。

## 文件

| 文件 | 作用 |
|---|---|
| `a2.html` | 中央过场 overlay 模板 |
| `a2.css` | 大字 + 光晕 + confetti 金色变体 |
| `a2.js` | MutationObserver 监听 `#result-section` 出现，自动播放 |

## 隔离设计

- CSS 前缀 `.a2-`
- DOM id `a2-celebrate` / `a2-stats`
- 全局 `window.A2`
- 完全不修改 main 既有 `celebrate()`（满分庆祝仍归 quiz）
- 数据从 DOM 读（概念数/要点数），不依赖 `window.state`

## 集成方法

1. 把 `a2.html` 内容粘进 `<body>`
2. `<head>` 加：`<link rel="stylesheet" href="a2.css" />`
3. `</body>` 前加：`<script src="a2.js"></script>`

## 依赖

- main 的 `#result-section`、`#concept-grid`、`#key-points-list` DOM
- main 的 `.confetti-piece` CSS keyframes（已存在，无需重写）
