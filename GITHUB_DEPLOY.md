# 长期部署到 GitHub Pages

本文把王乐的数字名片发布到 **GitHub Pages**，得到一个免费、长期有效的公网地址：

- 项目仓库：`https://<你的用户名>.github.io/<仓库名>/`
- 用户主页仓库（仓库名必须是 `<你的用户名>.github.io`）：`https://<你的用户名>.github.io/`

项目已经包含 `.github/workflows/deploy-pages.yml`，之后每次 `git push` 到 `main` 都会自动构建并部署。

---

## 一、准备

1. 注册 / 登录 GitHub。
2. 新建一个 **Public** 仓库，例如 `wangle-digital-card`。免费账号的 GitHub Pages 通常需要公开仓库。
3. 安装 Git for Windows：<https://git-scm.com/download/win>，安装后在 PowerShell 执行：

   ```powershell
   git --version
   ```

   如果不想用命令行，也可以安装 [GitHub Desktop](https://desktop.github.com/)，直接走文末的「GitHub Desktop 方式」。

4. 首次使用 Git 时配置提交身份：

   ```powershell
   git config --global user.name "王乐"
   git config --global user.email "3402990356@qq.com"
   ```

---

## 二、创建 Pages 站点

1. 打开 GitHub 仓库页面。
2. 进入 **Settings → Pages**。
3. 在 **Build and deployment → Source** 中选择 **GitHub Actions**。
4. 这一步必须先做，否则工作流里的 `actions/configure-pages` 可能报错。

---

## 三、把本地项目推送到 GitHub

在 PowerShell 中执行（把 `<你的用户名>` 和 `<仓库名>` 换成真实值）：

```powershell
cd "C:\Users\wangl\Documents\deepseek-harness\default-workspace"

git init
git add .
git commit -m "feat: 王乐个人数字名片"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

第一次 `git push` 时，Git Credential Manager 会弹出 GitHub 登录窗口；按提示登录并授权即可。也可以使用 GitHub Personal Access Token 代替密码。

> `.gitignore` 已经排除了 `dist/`、`release/`、`.deploy/` 等目录。  
> **不要把 `.deploy/` 提交到 GitHub**：里面保存了临时预览平台的 owner token / claim token。源码仓库只需要提交 `src/`、`scripts/`、配置文件和 `.github/`。

---

## 四、等待自动部署

推送成功后：

1. 打开仓库的 **Actions** 标签页。
2. 找到 **Deploy Wang Le digital card to GitHub Pages**。
3. 等待 `build` 和 `deploy` 两个 job 都变成绿色。
4. 回到 **Settings → Pages**，页面顶部会显示站点地址。

地址规则：

| 仓库名 | 访问地址 |
| --- | --- |
| `wangle-digital-card` | `https://<用户名>.github.io/wangle-digital-card/` |
| `<用户名>.github.io` | `https://<用户名>.github.io/` |

首次部署可能有 1–3 分钟延迟；如果刚部署完打开是 404，先等一分钟再刷新。

---

## 五、以后如何更新

修改姓名、课程、绩点、留言示例或样式后，执行：

```powershell
cd "C:\Users\wangl\Documents\deepseek-harness\default-workspace"
npm run build
npm run preview      # 本地检查 http://127.0.0.1:4173
git add .
git commit -m "update: 更新个人资料"
git push
```

GitHub Actions 会自动重新构建并部署，不需要手动上传 `dist/`，也不需要每次在网页上操作。

常用修改位置：

| 内容 | 文件 |
| --- | --- |
| 姓名、简介、教育、技能、联系方式 | `src/index.html` |
| 雷达图数据 | `src/js/app.js` 中的 `radarData` |
| 留言示例 / 本地存储键 | `src/js/app.js` 中的 `seedMessages`、`STORAGE_KEY` |
| 配色、圆角、间距 | `src/css/styles.css` 的 `:root` |
| 头像 | `src/assets/avatar.svg` |
| 分享封面 | `src/assets/og-cover.png` |

---

## 六、可选：绑定自己的域名

如果以后买了域名（例如 `wangle.example.com`）：

1. 在仓库 **Settings → Pages → Custom domain** 填入域名并保存。
2. 在域名服务商处添加 DNS 记录：
   - 子域名：`CNAME` 指向 `<你的用户名>.github.io`
   - 根域名：按 GitHub 文档配置 A 记录
3. 在 `src/CNAME` 中写入域名（构建时会复制到 `dist/CNAME`），或者在 Pages 设置中配置。
4. 等待 HTTPS 证书签发。
5. 把 `src/index.html` 里 `<meta property="og:image">` 改成绝对地址，例如：
   `https://wangle.example.com/assets/og-cover.png`，否则部分社交平台无法抓取分享封面。

GitHub 官方自定义域名文档：<https://docs.github.com/zh/pages/configuring-a-custom-domain-for-your-github-pages-site>

---

## 七、常见问题

### Actions 报错：Get Pages site failed

说明 Pages 还没启用，或 Source 没有选择 **GitHub Actions**。进入 **Settings → Pages** 按第二步设置，然后重新运行 Actions。

### 部署成功但页面 404

- 等 1–3 分钟。
- 确认访问的是 `https://<用户名>.github.io/<仓库名>/`，而不是仓库首页。
- 确认仓库是 Public。
- 检查 Actions 的 `deploy` job 是否成功。

### 页面样式或图片丢失

本项目全部使用相对路径，正常部署到 `/<仓库名>/` 子路径不会丢样式。如果手动修改过路径，检查是否误用了以 `/` 开头的绝对路径。

### 私有仓库能免费用 Pages 吗

免费账号通常需要 Public 仓库；Private 仓库的 Pages 可能需要付费计划。个人名片建议使用 Public 仓库。

### 不想用命令行

使用 GitHub Desktop：

1. 安装并登录 GitHub Desktop。
2. **File → Add local repository**，选择本项目文件夹。
3. 点击 **Publish repository**，取消勾选 “Keep this code private”。
4. 发布后进入 GitHub 网页的 **Settings → Pages**，把 Source 设为 **GitHub Actions**。
5. 之后在 GitHub Desktop 中修改并 **Push origin** 即可自动部署。

---

## 八、为什么不用手动上传 dist

`dist/` 是构建产物，GitHub Actions 会在云端执行：

```bash
npm run build
```

然后只上传构建后的 `dist/` 作为 Pages artifact。这样仓库里保留的是可维护的源码，而不是每次都要手动覆盖的静态文件。
