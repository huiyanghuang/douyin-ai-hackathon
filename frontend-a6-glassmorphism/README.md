# A6 · 毛玻璃 Glassmorphism 特效模块

## 做什么

把 iOS 风格的毛玻璃质感引入到以下"原本看起来很死板"的元素：

- 登录/注册弹窗（Auth Modal）
- 进度遮罩（Progress Overlay）
- 「猜你想看」推荐边栏
- Tab 纵向导航
- Dropzone 拖拽上传框
- 用户区按钮 / 图谱控制按钮 / 图例
- 概念卡片

通过 `backdrop-filter: blur(...) saturate(...)` + 半透明背景 + 微妙边框光晕，让 UI 整体气质往 苹果级 / 字节级 视觉规范上提一档。

## 文件

| 文件 | 作用 |
|---|---|
| `a6.css` | 全部覆盖样式（纯 CSS，无 JS） |

## 隔离设计

- 没有引入新的 DOM
- 通过 element selector + `!important` 覆盖 main 既有背景色
- 浅色模式（A5 主题切换）下使用不同透明度 + 阴影，确保两套色板都好看
- 不依赖任何 JS

## 集成方法

只需要 1 行：在 `<head>` 加  
```html
<link rel="stylesheet" href="a6.css" />
```

> ⚠️ 必须在 main `styles.css` **之后** 加载（让覆盖生效）。  
> ⚠️ 推荐放在 A5 (`a5.css`) **之后** 加载（A6 的 `:root[data-theme="light"]` 规则才能赢过 A5 同选择器规则）。

## 浏览器兼容

- `backdrop-filter` 在 Chrome 76+ / Safari 9+ / Firefox 103+ / Edge 79+ 都支持
- 不支持时仍能看到半透明背景，只是没有"磨砂感"，**不会破坏排版**

## 与 A5 的关系

- A5 负责整体主题色（深/浅）；A6 负责"质感"
- A6 已经针对 A5 的 `:root[data-theme="light"]` 写了配套规则
- 两个模块同时启用效果最好（建议默认全开）
