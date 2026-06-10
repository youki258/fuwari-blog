---
title: "卡通风格的前端"
published: 2026-06-01
updated: 2026-06-01
description: "根据你提供的四个仓库，我帮你梳理了与卡通/漫画/视觉艺术相关的前端 skill： 🎯 最推荐：JimLiu/baoyuskills 这个仓库有最贴合卡通风格的"
tags: ["待整理"]
category: "技术随笔"
draft: true
---

<!-- source: 博客备选笔记/卡通风格的前端.md -->
根据你提供的四个仓库，我帮你梳理了与**卡通/漫画/视觉艺术**相关的前端 skill：

---

## 🎯 最推荐：JimLiu/baoyu-skills

这个仓库有**最贴合卡通风格**的 skill：

### 1. `baoyu-comic` — 漫画创作者
专门生成教育漫画/卡通内容，支持多种艺术风格：
- **`ligne-claire`** —  uniform线条、平涂色，欧洲漫画传统（丁丁风格）
- **`manga`** — 大眼睛、日式漫画表现
- **`ink-brush`** — 水墨笔触效果
- **`chalk`** — 黑板手绘风格
- **`realistic`** — 写实数字绘画

还支持 tone（氛围）和 layout（分镜）控制，能直接生成带面板布局的连续漫画 

### 2. `baoyu-infographic` — 信息图（含卡通风格）
包含多种视觉风格，其中卡通相关的有：
- **`claymation`** — 黏土动画风格
- **`kawaii`** — 可爱风
- **`pixel-art`** — 像素艺术
- **`lego-brick`** — 乐高积木风格
- **`storybook-watercolor`** — 绘本水彩风 

### 3. `baoyu-xhs-images` — 小红书卡片生成
支持 **`cute`**（可爱卡通）等多种风格，自动生成带插画的图文卡片 

---

## 🎨 视觉艺术类：anthropics/skills（官方）

- **`algorithmic-art`** — 用 p5.js 生成艺术/卡通风格图案，支持粒子系统、流场等 
- **`canvas-design`** — 设计静态视觉艺术（PNG/PDF），适合做海报、卡通插画 
- **`frontend-design`** — 前端设计 skill，强调"反 AI Slop"，能做出独特、有创意的视觉风格（包含卡通/大胆配色可能）
- **`slack-gif-creator`** — 创建动画 GIF，可做简单卡通动画 

---

## 📦 ComposioHQ/awesome-claude-skills

这个仓库主要是**skill 集合目录**，上面提到的官方 skill 在这里也有收录，额外还有：
- **`anydesign`** — 分析任意图片/URL/Figma，生成 design.md 设计系统，可用来复刻卡通风格界面 
- **`swiftui-design-skill`** — SwiftUI 前端设计，含"反 AI Slop 六条铁律" 

---

## ⚠️ cexll/myclaude

这个仓库主要是**多 Agent 开发编排框架**（如 `/do`、`/omo` 等命令），**没有专门的卡通/视觉设计 skill**，偏向工程工作流自动化 

---

## 💡 总结建议

| 需求 | 推荐 Skill | 来源仓库 |
|------|-----------|---------|
| **生成漫画/卡通插画** | `baoyu-comic` | JimLiu/baoyu-skills |
| **黏土/像素/可爱风格信息图** | `baoyu-infographic` | JimLiu/baoyu-skills |
| **生成艺术/算法卡通图案** | `algorithmic-art` | anthropics/skills |
| **做卡通风格网页/UI** | `frontend-design` + `canvas-design` | anthropics/skills |
| **复刻参考图的卡通风格** | `anydesign` | ComposioHQ/awesome-claude-skills |

如果你主要想做**卡通风格的网页/前端界面**，建议组合使用：
1. `baoyu-comic` 或 `baoyu-infographic` 生成卡通素材
2. `frontend-design` 做前端页面搭建
3. `algorithmic-art` 做动态背景/装饰元素
