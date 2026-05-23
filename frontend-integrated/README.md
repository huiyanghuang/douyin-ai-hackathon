# frontend-integrated · A1–A6 合体版前端

把 main 分支的前端三件套与 A1-A6 六个模块整合到一起，**可直接替换 main 的 `index.html` / `styles.css` / `app.js`** 部署上线。

## 目录结构

```
frontend-integrated/
├── README.md          ← 本文件
├── index.html         ← 整合版（main 原版 + 6 个模块挂载点 + 6 个 link/script 标签）
├── app.js             ← main 原版，未改动一行
├── styles.css         ← main 原版，未改动一行
└── modules/
    ├── a1.css  a1.js  ← 四 Tab 联动
    ├── a2.css  a2.js  ← 生成完成庆祝
    ├── a3.css  a3.js  ← 学习成就卡 PNG（懒加载 html2canvas）
    ├── a4.css  a4.js  ← 视频缩略图 + 智能进度文案
    ├── a5.css  a5.js  ← 浅色/深色模式 + 颜色点缀
    └── a6.css         ← 毛玻璃 Glassmorphism（纯 CSS）
```

## 跟原版的差异

| 文件 | 是否改动 | 说明 |
|---|---|---|
| `app.js` | **未改** | 模块完全靠 MutationObserver / 事件 capture / DOM 查询自挂载 |
| `styles.css` | **未改** | 模块样式都用独立前缀（`.a1-` ~ `.a6-`）或 `:root[data-theme]` 选择器覆盖 |
| `index.html` | 改动 | 新增：`data-theme` 根属性 + FOUC 防护 inline 脚本 + 6 个 link + 5 个 script + 4 个挂载点 div |

## 部署

1. 把整个 `frontend-integrated/` 目录的内容复制到生产环境的网站根目录（覆盖原有 `index.html` + `styles.css` + `app.js`）
2. 同时把 `modules/` 子目录也带过去
3. 完成 —— 浏览器打开即生效

## 加载顺序（关键）

CSS：
```
1. tailwind CDN
2. styles.css (main)
3. modules/a1.css
4. modules/a2.css
5. modules/a3.css
6. modules/a4.css
7. modules/a5.css    ← 必须在主样式之后，覆盖才生效
8. modules/a6.css    ← 必须最后，A6 才能赢 A5 同选择器
```

JS：
```
1. <head> 内 inline FOUC 脚本（最先跑，设置 data-theme）
2. tailwind / d3 / marked CDN
3. app.js (main)
4. modules/a1.js
5. modules/a2.js
6. modules/a3.js
7. modules/a4.js
8. modules/a5.js
```

## 测试清单

- [ ] 首页 hero 标题显示三色渐变（A5 颜色点缀）
- [ ] 左上角有 ☾/☀ 切换按钮，点击切换深/浅色（A5）
- [ ] 登录弹窗、推荐边栏、概念卡片等都有毛玻璃质感（A6）
- [ ] 上传 MP4 → 进度遮罩里看到首帧缩略图 + 时长徽章（A4）
- [ ] 进度文案下方动态轮播"AI 正在看第 XX:XX..."（A4）
- [ ] 分析完成 → 全屏过场"你的私人课程已就绪 · X 概念 / Y 时间点"（A2）
- [ ] 点击概念图谱节点 → 底部弹 chip "已选中：XXX · 在卡片中查看"（A1）
- [ ] 点 chip → 跳到知识卡片 Tab + 卡片高亮脉冲 + 匹配的关键时间点高亮（A1）
- [ ] 测验做完 → 得分页有"📷 保存成就卡"按钮 → 下载 PNG（A3）

## 故障排查

| 现象 | 原因 | 修复 |
|---|---|---|
| 主题切换瞬间闪烁 | inline FOUC 脚本未生效 | 确保 `<head>` 第一个 `<script>` 标签是 A5 FOUC 脚本 |
| A6 毛玻璃看不到 | 浏览器太老 | Chrome 76+ / Safari 9+ / Firefox 103+ |
| A3 点击按钮无反应 | html2canvas CDN 被墙 | 把 html2canvas 下载到本地 + 修改 a3.js 的 `HTML2CANVAS_URL` |
| A4 缩略图全黑 | 浏览器 HEVC 不支持 | 浏览器局限，换 H.264 视频测试即可 |
| A1 chip 不弹 | 当前在径向布局点节点 | 已兼容力布局和径向，再次确认 graph-svg 内 .node/.radial-node 存在 |
