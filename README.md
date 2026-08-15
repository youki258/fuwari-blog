# 🍥 youki的笔记

![Node.js >= 20](https://img.shields.io/badge/node.js-%3E%3D20-brightgreen)
![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue)
![Astro](https://img.shields.io/badge/Astro-6.4-black)

基于 [Astro](https://astro.build) 的个人静态博客，记录 AI、全栈开发、服务器运维和网络相关的学习与实践。你可以把它当作一个数字花园——把想法做成可以访问的东西。

在线访问：[**youki.me**](https://youki.me/)

> 📄 给 AI 的发布指南见 [AGENTS.md](AGENTS.md)

## ✨ 特性

- 基于 [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com) + [Svelte](https://svelte.dev) 构建
- 自定义主页：Hero + 项目卡片 + 最近文章
- 单页博客列表，纵排文章卡片（封面、元数据、阅读时长）
- 明暗模式 / 可调主题色
- 响应式设计
- 全文搜索（[Pagefind](https://pagefind.app/)）
- 丰富的 Markdown 扩展：Admonition、GitHub 仓库卡片、Expressive Code 代码块、KaTeX 数学公式
- 目录（TOC）、RSS、sitemap
- 联系链接 base64 混淆，防止明文暴露邮箱
- Cloudflare Worker 反向代理，隐藏源站地址
- husky + lint-staged：提交前自动 Biome 格式化 / lint
- CI 流水线：type-check → lint → build（Node 20 / 22 / 24）

## 📝 文章 Frontmatter

```yaml
---
title: 我的第一篇文章
published: 2026-01-01
description: 这篇文章的简介，会展示在文章卡片上。
image: ./cover.jpg   # 可选，封面图
tags: [Astro, 笔记]
category: Front-end  # 可选
draft: false         # true 时仅在开发环境可见
lang: zh_CN          # 可选，仅当文章语言与站点语言不同时设置
updated: 2026-01-15  # 可选，更新日期
---
```

## 🧩 Markdown 扩展语法

在 Astro 默认的 [GitHub Flavored Markdown](https://github.github.com/gfm/) 之外，本站额外支持：

- **Admonition 提示框**：`:::note` / `:::tip` / `:::warning` / `:::caution` / `:::important`
- **GitHub 仓库卡片**：`:github{repo="用户名/仓库"}`
- **增强代码块**：基于 [Expressive Code](https://expressive-code.com/)，带语言徽章、自定义复制按钮、行号、可折叠区块
- **数学公式**：KaTeX 渲染 `$...$` / `$$...$$`

## 🗂️ 目录结构

```
src/
├── content/
│   ├── posts/          # 所有文章（index.md + 图片资源）
│   └── spec/           # 特殊页面（如 about.md）
├── pages/              # 路由：index、blog、archive、about、posts/[...slug]、rss
├── components/         # Astro / Svelte 组件（PostCard、Navbar、Widgets…）
├── layouts/            # Layout 与 MainGridLayout
├── plugins/            # 自定义 remark / rehype 插件
└── config.ts           # 站点配置入口
scripts/                # 维护脚本（scan-public / localize:images）
worker.js               # Cloudflare Worker 反向代理
```

## ⚡ 命令

所有命令均在项目根目录运行：

| 命令 | 说明 |
|:---|:---|
| `pnpm dev` | 启动开发服务器，`localhost:4321` |
| `pnpm build` | 生产构建 + Pagefind 索引，输出到 `./dist/` |
| `pnpm preview` | 本地预览生产构建 |
| `pnpm localize:images` | 将文章中引用的远程图片下载到本地 |
| `pnpm scan:public` | 扫描已发布内容中的密钥 / PII 泄露 |
| `pnpm type-check` | TypeScript 类型检查 |
| `pnpm lint` | Biome lint + 自动修复 |
| `pnpm format` | Biome 格式化 |
| `pnpm check` | Astro 诊断检查 |
| `pnpm verify` | 完整流水线：type-check → build → scan:public |

## 🔒 隐私与安全

- **`scan:public`**：构建后扫描 `src/content/posts/` 与 `dist/`，检查是否泄露密钥、邮箱、手机号、IP 等敏感信息。
- **联系链接混淆**：邮箱等联系方式以 base64 存储，点击时由 JS 解码，避免明文出现在页面 HTML 中。
- **Worker 代理**：通过 Cloudflare Worker 转发请求，不直接暴露源站地址。

## 📄 License

- 站点内容采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。
- 框架代码基于 [Fuwari](https://github.com/saicaca/fuwari)（MIT）fork，并在页脚 / 关于页保留致谢。