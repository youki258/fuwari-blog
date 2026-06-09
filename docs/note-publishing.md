# 笔记发布流程

这个 Fuwari 项目只发布 `export-manifest.json` 里 `status: "publish"` 的文章。

## 日常命令

```powershell
cd D:\studio\fuwari-blog
pnpm sync:notes
pnpm dev --host 127.0.0.1 --port 8788
```

完整验证：

```powershell
pnpm verify
```

## 加一篇文章

在 `export-manifest.json` 的 `entries` 中添加：

```json
{
  "status": "publish",
  "source": "博客备选笔记/初识k8s.md",
  "slug": "intro-to-k8s",
  "title": "初识 Kubernetes",
  "description": "Kubernetes 基础概念、实验环境与入门理解整理。",
  "date": "2026-05-27",
  "category": "云原生",
  "tags": ["Kubernetes", "学习笔记", "容器"]
}
```

## 安全规则

- 不直接发布整个 Obsidian vault。
- 只发布 `.md` 文件。
- `slug` 只能使用小写英文、数字和短横线。
- 本地图片只能来自文章同目录。
- 本地图片只允许 `.png`、`.jpg`、`.jpeg`、`.webp`、`.gif`。
- `密码/`、`密钥/`、`日记/`、`学校邮箱/`、`.obsidian/`、`.trash/`、`.vscode/` 永不发布。
- `*.pem`、`*.key`、`*.env*`、压缩包、Office/PDF 附件永不发布。

## 部署

```powershell
$env:SITE_URL = "https://你的域名"
pnpm verify
```

上传 `dist/` 到 VPS，用 Caddy/Nginx 提供静态站点。
