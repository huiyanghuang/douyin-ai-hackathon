# A1 · 四 Tab 联动模块

## 做什么

点击「概念图谱」里的任意节点 → 浮出底部 chip 提示 → 点击 chip 自动跳到「知识卡片」Tab + 高亮匹配的概念卡片 + 高亮匹配的「关键时间点」侧栏条目。

把原本互相孤立的四个 Tab 串成一条联动链路，命中赛题"多模态交互"评分锚点。

## 文件

| 文件 | 作用 |
|---|---|
| `a1.html` | 一个浮动 chip 的 HTML 片段，插入 body 任意位置 |
| `a1.css` | chip 样式 + key_points 高亮动画（前缀 `.a1-`） |
| `a1.js` | 自挂载脚本（click capture + chip 行为） |

## 隔离设计

- 全部 CSS 类前缀 `.a1-`
- 全部 DOM id 前缀 `a1-`
- 全局命名空间 `window.A1`
- 不修改任何 main 的现有函数；通过 `document.addEventListener('click', fn, true)` 在 **capture 阶段**捕获 D3 节点点击（先于 D3 的 `stopPropagation` 执行）

## 集成方法

1. 把 `a1.html` 内容粘进 `index.html` 的 `<body>` 任意位置（推荐紧贴 `</body>` 之前）
2. `<head>` 加：`<link rel="stylesheet" href="a1.css" />`
3. `</body>` 前加：`<script src="a1.js"></script>`

## 依赖

- main 的 `switchTab` 函数（已存在）
- main 的 `#concept-grid`、`#key-points-list`、`#graph-svg` DOM（已存在）
- 浏览器原生 API（无第三方）
