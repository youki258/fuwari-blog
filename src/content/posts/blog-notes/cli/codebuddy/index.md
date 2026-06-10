---
title: "codebuddy"
published: 2026-04-29
updated: 2026-04-29
description: "● 你可以通过以下方式查看使用额度： 1. /cost — 查看当前会话 Token 消耗 /cost 会显示： API 调用总时长 实际耗时 代码变更行数 各"
tags: ["待整理"]
category: "技术随笔"
draft: true
---

<!-- source: 博客备选笔记/cli/codebuddy.md -->
● 你可以通过以下方式查看使用额度：

  1. /cost — 查看当前会话 Token 消耗

  /cost

  会显示：
  - API 调用总时长
  - 实际耗时
  - 代码变更行数
  - 各模型的 input/output/cache token 用量

  2. /context — 查看上下文占用

  /context

  会显示当前上下文的使用比例和分布（系统提示、工具定义、消息历史等各占多少 token）。

  3. /status — 查看账号与连接状态

  /status

  可查看当前模型、账号信息和 API 连通性。

  ---
  关于账户总额度：如果需要查看账户层面的剩余额度/配额，通常需要登录 CodeBuddy 的 Web 端控制台查看，CLI
  内没有直接查看账户总额度的命令。
