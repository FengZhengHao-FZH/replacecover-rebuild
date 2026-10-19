# Replace Cover —— React 重建版

> 英文版本：[README.md](README.md)

对 [replacecover.com](https://replacecover.com)（一个纯浏览器端、用来制作专辑/歌单封面图的工具）的
净室（clean-room）重建。本项目是从**已发布的产物（shipped artifact）**还原出来的，而不是原始源码 ——
原站从未公开过源码，网站本体和它的 Adobe Fonts 字体包都已经下线；这里的代码是从 Wayback Machine 保存的
生产包快照加上运行时证据还原而来，再用现代的 Vite + React 重新搭建。

这是一份研究性质的重建，**不是**官方分支，也与原作者没有任何隶属关系。公开部署前请先阅读
[授权与素材声明](#授权与素材声明)。

## 还原方法

整个重建由 Reverse Engineering Assistant（REA，`rea-agents@6.5.0`）驱动，其中每一处都可回溯到证据：

- **分析样本（specimen）** —— `../replacecover/site/` 保存着归档的生产包，保持字节级不变、不做任何修改，
  并在 `127.0.0.1:8765` 上原样对外服务，作为对照基线。它是被分析对象，不是本次要部署的东西。
- **提取** —— 压缩后的模块图、类名清单，以及四张数据表（主题、贴纸、默认文案、字号）都从 bundle 中还原，
  并生成为 `src/data/` 下的 ES 模块。
- **运行时证据** —— 原版与重建版在同一个 Chromium、同一套确定性环境下逐路由采集并对照。结论以及对照必须的
  时序协议见 [docs/runtime-verification.md](docs/runtime-verification.md)（英文）。

## 当前状态

| 路由 | 视口 | 无障碍树摘要 | 归一化后的 `#root` 差异 |
| --- | --- | --- | --- |
| `/changelog` | 1280×720 | 一致 | 3 行（全部已解释） |
| `/about` | 1280×720 | 一致 | 3 行 |
| `/` | 1280×720 | 一致 | 6 行 |
| `/` 首屏以下的网格 | 1280×200 | 一致 | 6 行 |

这里的摘要是对浏览器完整生成的无障碍序列化结果（名称、角色、取值）做 SHA-256，因此摘要相同意味着两侧的子树
逐字节一致 —— 这是该类证据能支持的最强等价结论。剩余差异就是重建版有意不再加载的 3 个 Typekit `<script>` 节点，
外加 react-tabs 生成的 `id` 方案不同。我们**没有**声明像素级等价：替代字体会改变文字度量。

本地可复现的校验：

```
npm test        # 8 个测试文件、106 个用例，全部通过
npm run build   # 162 个模块，JS 约 428 kB（gzip 约 121 kB），CSS 约 32 kB
```

## 功能

原站能做的，这里在同样的 600×600 画布上都能做：

- **主题网格** —— 15 组「背景色 / 正文色 / 对比色」三元色；选中的一组同时决定画布底色、标题颜色和胶囊条颜色。
- **贴纸网格** —— 61 个图案，格子滚入视口时才挂载。原版用的是 `react-lazyload`，该包依赖已被移除的
  `findDOMNode`，因此 `src/lib/` 用 `IntersectionObserver` 重实现了同样的可见区行为。
- **洗牌（Shuffle）** —— 一次点击同时随机文案、主题和贴纸。
- **字号 / 对齐 / 作者名与标题编辑** —— 自适应高度的 textarea，文字对齐方式决定胶囊条的 `align-self`。
- **导出 JPEG** —— 用 `html2canvas` 把 `#canvasPreview` 栅格化后以 `.jpeg` 下载；不需要服务端、不需要账号、运行时没有任何网络请求。
- **`/about`、`/changelog`** —— 真实路径、客户端路由、可以直接深链访问。

## 技术栈

Vite 5 · React 18.3 · Redux 4 + react-redux 8 · react-router-dom 5（特意留在 v5，因为原站用的就是它的 `render=` 路由 API）
· react-tabs 6 · react-textarea-autosize 8 · html2canvas 1 · @fontsource/poppins 5 ·
Vitest 2 + Testing Library 16 + jsdom 25。

## 目录结构

```
rebuild/
├── index.html          # 从生产 HTML 还原的文档外壳，含水合前的动画 loader
├── public/             # 原样提供的静态资源（贴纸、favicon、PWA manifest、
│                       # og 图、svg logo）——约 12 MB，构建时直接拷进 dist
├── src/
│   ├── App.jsx         # Provider + 三条路由 + 原版那个 Tab 焦点怪癖
│   ├── components/     # Home、Editor、CanvasPreview、ThemesGrid、ThingsGrid、各工具、页面
│   ├── data/           # 生成物：themes、things、playlistNames、defaults、pageTrees
│   ├── lib/            # 懒挂载、渐进式图片、设备判定、analytics 空实现
│   ├── store/          # redux actions + reducer
│   └── styles/         # original.css —— 原站样式表，类名保持不变
├── tests/              # 按还原义务分组的用例（画布、下载、洗牌、懒加载网格、路由）
├── scripts/            # 证据 → 源码 的生成脚本（见下）
└── docs/               # runtime-verification.md
```

类名刻意不做现代化重命名：`src/styles/original.css` 就是原站样式表，所以标记里保留了
`c-canvasPreview--pill` 这类名字。原版自身的两处缺陷也被有意保留 —— `s-convasContainer` 这个拼写错误，
以及一个字面量 `"false"` 类名 —— 因为目标是还原产物的保真度，而不是顺手做清理。

## 从产物重新生成数据

`src/data/*.js` 和 `index.html` 都是生成的，不是手写的：

```
node scripts/emit-data.js         # bundle  → src/data/{themes,things,playlistNames,defaults,pageTrees}
node scripts/emit-index-html.mjs  # HTML    → index.html
node scripts/substitute-font.mjs  # 装上 Poppins 的 @fontsource 引入
```

## 本地运行

```
npm ci
npm run dev        # http://localhost:5173
npm run preview    # npm run build 之后本地提供 dist/
```

开发需要 Node 18 以上（Vite 5 的最低要求）。`netlify.toml` 把版本固定在 Node 20；`vercel.json` 没有固定
Node 版本，如果希望两个平台一致，可以在 `package.json` 里加 `"engines": { "node": "20.x" }`。

## 部署

两份配置都已经提交进仓库，而且都已经包含单页应用必需的 "SPA 重写" 规则，因为 `/about` 和 `/changelog`
不能返回 404。

| 平台 | 配置文件 | 构建命令 | 输出目录 | 重写规则 |
| --- | --- | --- | --- | --- |
| Vercel | `vercel.json` | `npm run build` | `dist` | `/(.*) → /index.html` |
| Netlify | `netlify.toml` | `npm run build` | `dist` | `/* → /index.html`（200），Node 20 |

**项目根目录。** 应用根目录就是本目录（`rebuild/`）。如果你连接的仓库里同时含有 `replacecover/`
分析样本目录，必须把框架的根目录手动设为 `rebuild/`（Vercel：*Root Directory*；
Netlify：*Build settings → Base directory*），否则构建根本找不到 `package.json`。

不使用 Git 远程仓库时（当前这份工作副本还不是 git 仓库）：

```
npx vercel --prod          # 或：npx netlify deploy --prod
```

没有任何环境变量、密钥或服务端函数：站点是纯静态的，所以部署内容就是 `dist/` 产物加上 `public/` 静态资源。

## 与原站的有意差异

1. **字体。** 原站通过 Adobe Typekit 加载 `canada-type-gibson`（kit `szh8xsx`）。该字族是商业授权，
   而且那个 kit 按域名白名单绑定在原站作者的 Adobe 账号上，既不能复用也不能自建托管。因此改用
   Poppins（SIL OFL 授权）并打包进产物。代价：两行 60 px 的标题块高度约 136 px，而原版约 130 px。
2. **移除统计代码。** `react-ga` 及其 Google 跟踪 ID 已删除；`src/lib/analytics.js` 是空实现
   （保留调用点，但不投递任何数据）。
3. **运行时零第三方请求** —— 没有 Typekit、没有字体 CDN、没有 analytics 端点。
4. **react-tabs 6** 生成 tab/panel `id` 的方式与原站打包的版本不同；角色（role）和名称（name）不变。
5. **有两道 REA 收口闸门在当前这台 Windows 主机上无法满足** ——
   `verify_reconstruction` 会拒绝它自己产出的对照证据（`authority: "analyst-inference"`、
   `environment: null`）；`capture_process_scenario` 拒绝 Windows 上的 PTY 采集，所以这里的
   `npm test` 输出无法成为 REA 级别的证据。两条都按事实记录，没有绕过。上面的等价结论依据的是浏览器采集的
   摘要，而这台主机能够产出这类证据。

## 授权与素材声明

贴纸、文案字符串、favicon、PWA 图标以及 `og:image` 都是从归档产物中逐字复制而来，仅用于分析。
它们属于他人的创作成果，原始产物也没有附带任何授权许可。**在把这份部署公开之前，请确认你有权再分发这些素材
—— 或者把它们替换掉。** 本项目自己写的代码（本目录下的 `.jsx`、`.js`、`.css` 与文档）不在该限制之内。
