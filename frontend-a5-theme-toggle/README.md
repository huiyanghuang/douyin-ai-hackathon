# A5 · 浅色/深色模式 + 颜色点缀模块

## 做什么

1. **主题切换**：左上角浮动 ☀/☾ 按钮，一键在深色（默认，与 main 一致）和浅色之间切换，偏好存 localStorage，刷新保持
2. **跟随系统**：首次访问没有偏好时，根据 `prefers-color-scheme` 媒体查询自动选择
3. **颜色点缀**：hero 主标题改为 紫→粉→金 三色渐变（深浅模式都生效），避免原版"全紫"的单调感

## 文件

| 文件 | 作用 |
|---|---|
| `a5.html` | 左上角浮动切换按钮 |
| `a5.css` | CSS variables + `:root[data-theme="light"]` 选择器覆盖 + hero 渐变 |
| `a5.js` | 初始化主题 + 绑定按钮 |

## 隔离设计

- CSS 前缀 `.a5-`
- DOM id `a5-toggle`
- 全局 `window.A5`
- 通过 `<html data-theme="...">` 切换主题
- 浅色 CSS 全部用 `:root[data-theme="light"]` 选择器，**默认深色不受影响**

## 集成方法

1. 把 `a5.html` 内容粘进 `<body>` 顶部（任意位置）
2. `<head>` 加：`<link rel="stylesheet" href="a5.css" />`（必须在 main `styles.css` **之后**加载，让覆盖规则生效）
3. **强烈推荐**在 `<head>` 第一个 `<script>` 前加这段内联脚本，避免主题切换时的 FOUC 闪烁：
   ```html
   <script>(function(){var t=localStorage.getItem("a5_theme");if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.setAttribute("data-theme",t);})();</script>
   ```
4. `</body>` 前加：`<script src="a5.js"></script>`

## 依赖

- 浏览器原生 localStorage + matchMedia
- 无第三方库
