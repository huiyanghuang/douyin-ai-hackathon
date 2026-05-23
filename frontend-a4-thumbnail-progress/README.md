# A4 · 视频缩略图 + 智能进度文案模块

## 做什么

用户选定 MP4 文件后：

1. **客户端立刻 canvas 抓首帧** —— 在进度遮罩里展示一张 220×124 的缩略图（带视频总时长徽章）
2. **进度文案动态轮播** —— 在原有的"上传中 / 分析中"文案下方，每 1.8 秒切换一条像「AI 正在看第 02:35 的镜头…」的"AI 正在工作"文案

让"AI 真的在看视频"这件事被用户*看见*，强化产品可信度。

## 文件

| 文件 | 作用 |
|---|---|
| `a4.html` | 缩略图 canvas + 文案占位 |
| `a4.css` | 缩略图框 + 时长徽章 + 文案脉冲 |
| `a4.js` | 监听 `#file-input` change → 抓首帧；监听 `#progress-overlay` 可见 → 启停文案轮播 |

## 隔离设计

- CSS 前缀 `.a4-`
- DOM id `a4-*`
- 全局 `window.A4`
- 在 `#file-input` 上添加额外 change listener（与原 handleFile 并行，互不干扰）
- JS 自挂载，把模板节点 re-parent 到 `#progress-message` 上方

## 集成方法

1. 把 `a4.html` 内容粘进 `<body>`（任意位置，JS 启动时会自动移动到进度遮罩里）
2. `<head>` 加：`<link rel="stylesheet" href="a4.css" />`
3. `</body>` 前加：`<script src="a4.js"></script>`

## 依赖

- main 的 `#file-input`、`#progress-overlay`、`#progress-message` DOM
- 浏览器原生：HTMLMediaElement、CanvasRenderingContext2D、URL.createObjectURL
