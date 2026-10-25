# 王乐 · 数字经济数字名片

武汉理工大学数字经济专业王乐的个人数字名片。纯 HTML / CSS / JavaScript，无运行时依赖，包含基础信息、学习成果可视化和本地留言板三个模块，适配桌面与移动端，可打包部署到 GitHub Pages、Netlify、Vercel、Cloudflare Pages 等静态托管平台。

## 公网地址

**当前公网预览：** https://wangle-card-niqck2fr-rlzp3hxow3.brewpage.app/

该地址由 BrewPage 提供，用于即时验收，有效期至 **2026-11-24**。免费预览右侧会显示一个 BrewPage 平台归属小徽标，不影响站点功能。

**长期部署：** 请按 [GITHUB_DEPLOY.md](GITHUB_DEPLOY.md) 把项目推送到你的 GitHub 仓库，使用已内置的 GitHub Actions 工作流发布到 GitHub Pages，获得长期有效的 `https://<用户名>.github.io/<仓库名>/` 地址。

## 已填写的信息

- 姓名：王乐
- 性别：男
- 学校：武汉理工大学
- 专业：数字经济
- 年级：大二
- 绩点：3.9
- 在修课程：SQL 数据库、人工智能技术及应用、数智编程
- 联系方式：3402990356@qq.com
- 城市：武汉

页面中不再展示虚构的项目、奖项和实习内容；同时保留 **项目作品、竞赛奖项、实习经历** 三个「待补充」占位区，后续可直接替换为真实内容，也可以接入 JSON / API / CMS 做动态更新。

## 功能

### 01 基础信息

- 插画头像、姓名、性别、专业、年级与个人简介
- 武汉理工大学教育经历、在修课程、绩点
- 四组学习能力标签：数据库与数据、智能技术、数字经济、学习与表达
- 邮箱一键复制、学校与城市信息
- 数字身份卡、状态徽章与轻量悬浮交互

### 02 学习成果可视化

- Canvas 绘制的六维能力雷达图，适配高 DPI 屏幕
- `ResizeObserver` + 设备像素比处理，手机端平滑缩放、圆形比例不变形
- 指针悬停 / 触摸可查看单项能力值
- 重点课程、绩点、年级、技能方向四张统计卡片，滚动进入时数字递增
- 学习地图：个人数字名片、SQL 数据库、人工智能技术及应用、数智编程
- 成果档案预留区：项目作品、竞赛奖项、实习经历，使用 `data-slot` 标记，方便后续动态替换

### 03 基础留言

- 昵称、留言、字数统计与提交按钮
- 必填校验、错误提示、提交成功反馈
- 留言即时展示并按时间排序
- `localStorage` 本地持久化，刷新后保留
- 全部留言通过 `textContent` 渲染，避免 HTML 注入
- 内置一条王乐的欢迎留言

## 预留内容区与后续更新

项目作品、竞赛奖项、实习经历等信息暂未提供，但页面结构已经保留，不会因为暂时为空而删除：

- `data-slot="projects"`：项目作品
- `data-slot="awards"`：竞赛奖项
- `data-slot="internships"`：实习经历

当前它们显示为「待补充」占位卡片。后续更新有两种方式：

1. **直接替换文案**：修改 `src/index.html` 中对应 `.archive-slot` 的标题、描述和状态即可。
2. **改成动态渲染**：保留 `.archive-grid` 容器，用 `fetch()` 读取 `data/portfolio.json`，或接入 Supabase / Firebase / 自己的 API，按 `data-slot` 渲染真实数据。现有卡片样式可以直接复用。

学习地图中的 `.project-list` 也保留了同样的扩展空间，可以继续增加真实课程项目、竞赛作品或数据分析实践。

## 本地运行

要求 Node.js 18 或更高版本，无需安装任何 npm 依赖。

```bash
npm run build
npm run preview
```

打开 http://127.0.0.1:4173 预览。构建会生成：

- `dist/`：可直接部署的静态站点
- `release/wangle-digital-card.zip`：用于拖拽上传或云平台导入的压缩包
- `dist/deploy-info.json`：构建文件清单与体积信息

如需更新本次 BrewPage 公网预览：

```bash
npm run deploy:preview
```

该命令会重新构建并复用 `.deploy/brewpage.json` 中保存的 owner token 更新同一地址。`.deploy/` 含私密凭据，已被 `.gitignore` 忽略，请勿提交或公开。

## 目录结构

```text
.
├─ src/
│  ├─ index.html              # 页面结构与文案
│  ├─ css/styles.css          # 设计系统、布局、响应式与动效
│  ├─ js/app.js               # 雷达图、数字动画、留言板、复制、导航
│  ├─ assets/
│  │  ├─ avatar.svg           # 插画头像
│  │  ├─ favicon.svg
│  │  ├─ apple-touch-icon.png
│  │  ├─ og-cover.png         # 1200 × 630 社交分享封面
│  │  └─ fonts/               # Space Grotesk（SIL OFL）
│  ├─ _headers                # Cloudflare Pages / Netlify 安全与缓存头
│  ├─ robots.txt
│  └─ site.webmanifest
├─ scripts/
│  ├─ build.mjs               # 零依赖构建 + ZIP 打包
│  ├─ preview.mjs             # 本地静态服务器
│  └─ deploy-preview.mjs      # 可选：BrewPage 临时公网预览
├─ .github/workflows/
│  └─ deploy-pages.yml        # GitHub Pages 自动部署
├─ GITHUB_DEPLOY.md           # GitHub Pages 长期部署详细步骤
├─ netlify.toml
├─ vercel.json
├─ wrangler.toml
└─ package.json
```

## 长期部署到 GitHub Pages

完整步骤见 **[GITHUB_DEPLOY.md](GITHUB_DEPLOY.md)**。最简流程：

1. 在 GitHub 新建 Public 仓库，例如 `wangle-digital-card`。
2. 在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。
3. 在项目目录执行：

   ```powershell
   git init
   git add .
   git commit -m "feat: 王乐个人数字名片"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```

4. 等待 Actions 中的 **Deploy Wang Le digital card to GitHub Pages** 完成。
5. 访问：

   - 普通仓库：`https://<用户名>.github.io/<仓库名>/`
   - 用户主页仓库 `<用户名>.github.io`：`https://<用户名>.github.io/`

之后每次修改并 `git push` 到 `main`，都会自动重新构建部署。

## 其他云平台

所有平台统一使用：

- 构建命令：`npm run build`
- 输出目录：`dist`
- Node.js：18+

### Netlify

在 Netlify 导入仓库，`netlify.toml` 已包含构建命令与发布目录；也可以在 [Netlify Drop](https://app.netlify.com/drop) 上传 `release/wangle-digital-card.zip`。

### Vercel

Framework Preset 选择 **Other**，构建命令 `npm run build`，输出目录 `dist`；`vercel.json` 已包含对应配置。

### Cloudflare Pages

Build command：`npm run build`；Build output directory：`dist`。也可使用：

```bash
npx wrangler pages deploy dist --project-name wangle-digital-card
```

### 任意静态托管

将 `dist/` 上传到 Nginx、对象存储、OSS、COS、Cloudflare R2 等即可。页面内全部资源使用相对路径，不依赖域名和根路径。

## 个性化修改

| 内容 | 位置 |
| --- | --- |
| 姓名、简介、教育、课程、技能、联系方式 | `src/index.html` |
| 头像 | 替换 `src/assets/avatar.svg`，保持正方形构图；也可以换成本人照片 |
| 雷达图六项能力与分数 | `src/js/app.js` 中的 `radarData` |
| 学习成果数字 | `src/index.html` 中 `data-count`、`data-decimals` 与文案 |
| 学习地图 / 项目 | `src/index.html` 中 `.project-list` |
| 项目 / 奖项 / 实习预留区 | `src/index.html` 中 `.archive-slot` 的 `data-slot="projects" / "awards" / "internships"` |
| 欢迎留言、存储键 | `src/js/app.js` 中的 `seedMessages`、`STORAGE_KEY` |
| 配色、圆角、间距 | `src/css/styles.css` 顶部 `:root` 变量 |
| 社交分享封面 | 替换 `src/assets/og-cover.png`（1200 × 630）；绑定正式域名后建议把 `<meta property="og:image">` 改为绝对 URL |
| 页面标题、SEO、JSON-LD | `src/index.html` 的 `<head>` |

## 留言数据说明

留言使用浏览器 `localStorage` 保存，键名为 `wangle-digital-card-messages-v1`。它不会上传服务器，也不会跨设备同步；清理浏览器数据后留言会消失。这满足轻量化、无复杂后端的要求。

如果需要真正跨设备留言，只需替换 `src/js/app.js` 中的 `safeRead()`、`saveMessages()` 两个函数，接入 Supabase、Firebase、LeanCloud 或自己的 API，现有 DOM 渲染、校验和动画逻辑可以继续复用。

## 设计与实现要点

- **统一设计系统**：奶油纸感底色、深绿主色、青柠强调色；统一使用 `--radius-*`、`--gap` 和卡片阴影。
- **响应式**：1080 / 960 / 760 / 460px 四个断点，桌面双栏、平板降级、手机单栏。
- **雷达图不变形**：Canvas 使用 CSS 尺寸乘 DPR 绘制，半径始终取容器宽高的最小值，重绘由 `ResizeObserver` 触发；手机端容器为 1:1。
- **轻量**：无框架、无 CDN、无第三方图表库，字体本地化；完整构建约 460 KB（含分享封面和字体）。
- **可访问性**：语义化标题、跳过链接、表单标签、`aria-live` 错误提示、Canvas 数据明细、键盘提交（`Ctrl / Cmd + Enter`）、`prefers-reduced-motion` 降级。
- **SEO**：标题、描述、Open Graph、Twitter Card、Person JSON-LD、`site.webmanifest`。

## 字体许可

Space Grotesk 通过 SIL Open Font License 1.1 授权，许可文本见 `src/assets/fonts/OFL.txt`。代码使用 MIT License，见 `LICENSE`。
