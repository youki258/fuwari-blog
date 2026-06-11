---
title: "Git 使用指南"
published: 2026-04-08
updated: 2026-04-08
description: "git下载 略 本地环境配置: 用户名,邮箱,ssh https://www.bilibili.com/video/BV1G8CFYvEjt 图形化工具:Sou"
tags: ["Git","SSH","Sourcetree","版本控制"]
category: "Git"
draft: true
---

<!-- source: git使用/git.md -->
### git下载

略

本地环境配置:

用户名,邮箱,ssh

https://www.bilibili.com/video/BV1G8CFYvEjt

图形化工具:Sourcetree

### Pycharm中使用Git进行版本控制和协作编辑:https://www.bilibili.com/video/BV1tfuKzzEE6/


想把这个 **Obsidian 配置文件从 Git 跟踪中移除，但本地文件完全保留**，核心是用 `git rm --cached` 命令（**绝对不会删除本地文件**），再配合 `.gitignore` 永久禁止跟踪，两步就能搞定，我给你最直接、可复制的操作：

---

## 一、核心操作（复制命令直接用）

### 1. 移除 Git 跟踪（保留本地文件）

在终端进入你的笔记仓库根目录，执行这条命令（**替换成你的配置文件实际路径**）：

```
# 格式：git rm --cached 你的配置文件路径
# Obsidian 配置通常在 .obsidian/ 文件夹下，示例：
git rm --cached .obsidian/app.json
```

✅ 关键：`--cached` 是**只移除跟踪、不删文件**的核心参数，千万别丢！

### 2. 永久加入忽略列表（防止再次被跟踪）

编辑仓库根目录的 `.gitignore` 文件，把这个配置文件加进去：

在 `.gitignore` 里添加一行（**写你的配置文件路径**）：


```
# 单个配置文件忽略
.obsidian/app.json

# 👉 推荐：直接忽略整个 Obsidian 配置文件夹（更省心）
.obsidian/
```

### 3. 提交变更

```
git add .gitignore
git commit -m "移除配置文件Git跟踪，添加到忽略列表"
```
