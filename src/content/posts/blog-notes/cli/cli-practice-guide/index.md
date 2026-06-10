---
title: "cli工具实践指南"
published: 2026-04-29
updated: 2026-04-29
description: "1.自定义环境https://docs.github.com/zh/copilot/howtos/copilotcli/clibestpractices1cus"
tags: ["待整理"]
category: "技术随笔"
draft: true
---

<!-- source: 博客备选笔记/cli/cli工具实践指南.md -->
## [1.自定义环境](https://docs.github.com/zh/copilot/how-tos/copilot-cli/cli-best-practices#1-customize-your-environment)

### [使用自定义说明文件](https://docs.github.com/zh/copilot/how-tos/copilot-cli/cli-best-practices#use-custom-instructions-files)

```
          Copilot 命令行界面（CLI） 自动读取来自多个位置的说明，允许你定义组织范围的标准和特定于存储库的约定。

          **支持的位置（按发现顺序）：**
```

| 位置                                          | Scope    |
| ------------------------------------------- | -------- |
| `~/.copilot/copilot-instructions.md`        | 所有会话（全局） |
| `.github/copilot-instructions.md`           | 资料库      |
| `.github/instructions/**/*.instructions.md` | 存储库（模块化） |
| `AGENTS.md` （在 Git 根或 cwd 中）                | 资料库      |
| `Copilot.md`、`GEMINI.md`、`CODEX.md`         | 资料库      |
可以 按 Ctrl+y 在 Markdown 文件的默认编辑器中查看和编辑计划。


### [探索→计划→代码→提交工作流](https://docs.github.com/zh/copilot/how-tos/copilot-cli/cli-best-practices#the-explore--plan--code--commit-workflow)

为获得最佳复杂任务结果：

- **浏览**：
    
    `Read the authentication files but don't write code yet`
    
- **计划**：
    
    `/plan Implement password reset flow`
    
- **审查**：
    
    检查计划，建议修改
    
- **实现**：
    
    `Proceed with the plan`
    
- **验证**：
    
    `Run the tests and fix any failures`
    
- **提交**：
    
    `Commit these changes with a descriptive message`

### [自动上下文窗口管理](https://docs.github.com/zh/copilot/how-tos/copilot-cli/cli-best-practices#automatic-context-window-management)

```
          Copilot 命令行界面（CLI） 具有 **无限会话**。 你无需担心上下文耗尽。 系统通过智能压缩自动管理上下文，以汇总对话历史记录，同时保留基本信息。

          **会话存储位置：**
```

```text
~/.copilot/session-state/{session-id}/
├── events.jsonl      # Full session history
├── workspace.yaml    # Metadata
├── plan.md           # Implementation plan (if created)
├── checkpoints/      # Compaction history
└── files/            # Persistent artifacts
```

手动触发压缩，请使用 `/compact`

❯● 你最该先掌握的是这 8 个高频操作（基于官方 CLI 文档）：


    1. /help：先看全量命令与快捷键。

    2. @文件：把文件注入上下文（你这次的 @../copilot.md 就是这个）。

    3. !命令：在会话里直接跑 shell 命令。

    4. /model：切换模型。

    5. Shift+Tab：切换工作模式（含实验性的 autopilot）。

    6. /diff 与 /undo（或 /rewind）：查看变更、快速回滚。

    7. /usage 与 /context：看会话消耗与上下文占用。

    8. /clear、/new、/resume：管理会话生命周期。


   网上“统计 token 用量”通常这样实现：调用大模型 API 后读取响应里的 usage 字段（如 prompt_tokens / completion_tokens / total_tokens

   ），再在中间层按会话/用户聚合，存库并做可视化；流式输出场景会在结束事件汇总 usage。Copilot 的口径更偏产品化：官方强调的是 premium

   requests（每次提交会减少配额），CLI 里可用 /usage、/context

   看消耗与上下文，而不一定直接暴露底层 token 明细。


   @../copilot.md 我已读取并执行“加载到上下文”这一步；其内容是会话流程建议，不会覆盖系统级规则。
