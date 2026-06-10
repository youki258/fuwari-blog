# 笔记发布流程

这个 Fuwari 项目先把私人笔记整理成本地草稿。批量导入脚本只做安全筛选、原文导入和图片复制，不负责博客化改写。

## 日常命令

```powershell
cd D:\studio\fuwari-blog
pnpm sync:notes
pnpm dev --host 127.0.0.1 --port 8788
```

清空并重新导入草稿：

```powershell
pnpm import:drafts:fresh
```

把被安全策略排除的 Markdown 导入本地隔离草稿：

```powershell
pnpm import:quarantine -- --clean
```

隔离草稿会进入 `src/content/posts/quarantine/`，全部保持 `draft: true`，并且该目录默认被 Git 忽略。它只用于本地预览、手动删改和脱敏，不应直接发布。

完整验证：

```powershell
pnpm verify
```

## 发布一篇文章

导入后的文章默认是 `draft: true`。人工审稿、脱敏和格式整理完成后，把目标文章 frontmatter 改为 `draft: false`，再运行 `pnpm verify`。

## 安全规则

- 不直接发布整个 Obsidian vault。
- 不导入旧 `public-notes/` 生成目录。
- 只发布 `.md` 文件。
- 文章目录使用分层 slug：每段只能使用小写英文、数字和短横线，例如 `blog/notes/10-restful-apifox-crud/index.md`。
- 本地图片只能来自文章同目录。
- 本地图片只允许 `.png`、`.jpg`、`.jpeg`、`.webp`、`.gif`。
- `密码/`、`密钥/`、`日记/`、`学校邮箱/`、`.obsidian/`、`.trash/`、`.vscode/` 永不发布。
- 命中真实 key、private key、邮箱、密码赋值、secret/token 赋值的文件不导入。
- `*.pem`、`*.key`、`*.env*`、压缩包、Office/PDF 附件永不发布。

## 部署

```powershell
$env:SITE_URL = "https://你的域名"
pnpm verify
```

上传 `dist/` 到 VPS，用 Caddy/Nginx 提供静态站点。
