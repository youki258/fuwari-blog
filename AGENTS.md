# AGENTS.md

本文件是给 AI 助手（opencode、Codex、Cursor、Claude Code 等）的项目指引。阅读时请优先关注本文档，完整架构细节见 [CLAUDE.md](CLAUDE.md)。

## 项目简介

基于 **Astro 6.4 + Svelte + Tailwind CSS** 的个人静态博客，站点语言 `zh_CN`。文章直接用 Markdown 写在 `src/content/posts/` 下。发布流程：新建 Markdown → 推送 `master` → CI 自动构建 → Cloudflare Pages 自动部署上线。

## 📝 发布一篇文章

按现有目录约定手动创建文章（不使用 new-post 脚本）：

```
src/content/posts/<分类>/<slug>/index.md
```

例如：

```text
src/content/posts/
├── network/
│   └── flclash-ssh-misroute/
│       └── index.md
└── tools/
    └── codex-best-practices/
        └── index.md
```

分类用英文小写（如 `ai`、`cs`、`frontend`、`java`、`network`、`tools`），slug 用短横线命名。文章相关图片放同目录（如 `images/`）。

### Frontmatter

`title` 与 `published` 必填，其余可选：

```yaml
---
title: 文章标题
published: 2026-08-15
description: 简介，展示在文章卡片上
image: ./cover.jpg   # 可选，封面图
tags: [标签1, 标签2]
category: 分类名
draft: false         # true 时仅在开发环境可见
lang: zh_CN          # 可选，仅当文章语言与站点语言不同时设置
updated: 2026-08-15  # 可选，更新日期
---
```

### 正文

支持 GitHub Flavored Markdown 及扩展语法：Admonition 提示框（`:::note` / `:::tip` / `:::warning` / `:::caution` / `:::important`）、GitHub 仓库卡片（`:github{repo="用户名/仓库"}`）、Expressive Code 代码块、KaTeX 数学公式（`$...$` / `$$...$$`）。

## ✅ 验证与发布

1. 本地验证：
   - `pnpm check` — Astro 诊断检查
   - `pnpm verify` — 完整流水线：type-check → build → 泄露扫描（`scan:public` 会检查密钥 / PII，发布前务必通过）
2. 提交并推送到 **`master`** 分支：
   ```sh
   git add src/content/posts/...
   git commit -m "feat(post): <文章主题>"
   git push origin master
   ```
3. 推送后 CI 自动运行 type-check / lint / build，通过后 Cloudflare Pages 自动部署到线上。

## ⚡ 常用命令

| 命令 | 说明 |
|:---|:---|
| `pnpm dev` | 本地开发服务器，`localhost:4321` |
| `pnpm build` | 生产构建 + Pagefind 索引 → `./dist/` |
| `pnpm preview` | 本地预览生产构建 |
| `pnpm check` | Astro 诊断检查 |
| `pnpm verify` | type-check → build → 泄露扫描 |
| `pnpm localize:images` | 将文章引用的远程图片下载到本地 |
| `pnpm scan:public` | 扫描已发布内容中的密钥 / PII |

## 📚 更多信息

- 完整架构（内容管线、布局、插件、代码规范）见 [CLAUDE.md](CLAUDE.md)
- 站点配置入口：`src/config.ts`