---
title: "MCP 配置快速参考"
published: 2026-03-21
updated: 2026-03-21
description: "【快速参考】ECC 标准 MCP 三件套 + 按需扩展 核心三个 MCP 来源与安装 1. memory（会话记忆） 来源：npm 官方包 @modelcont"
tags: ["MCP","AI","配置"]
category: "技术随笔"
draft: true
---

<!-- source: 博客备选笔记/MCP配置快速参考.md -->
# 【快速参考】ECC 标准 MCP 三件套 + 按需扩展

## 核心三个 MCP 来源与安装

### 1. memory（会话记忆）
- **来源**：npm 官方包 `@modelcontextprotocol/server-memory`
- **用途**：跨对话保留重要信息
- **无需 API Key**：✓ 完全本地

### 2. sequential-thinking（复杂推理）
- **来源**：npm 官方包 `@modelcontextprotocol/server-sequential-thinking`
- **用途**：长链路思考与推理
- **无需 API Key**：✓ 完全本地

### 3. filesystem（本地文件操作）
- **来源**：npm 官方包 `@modelcontextprotocol/server-filesystem`
- **用途**：安全的文件系统访问
- **无需 API Key**：✓ 完全本地
- **必改参数**：路径（默认示例要换成你的真实项目目录）

---

## 配置示例（复制到 ~/.codex/config.toml）

```toml
# 核心无密钥组合（推荐默认）
[mcp_servers.memory]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-memory"]

[mcp_servers.sequential-thinking]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-sequential-thinking"]

[mcp_servers.filesystem]
command = "npx"
# 重要：把下面的 /home/user/project 改成你真实的项目根目录
args = ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\14733\\Desktop", "C:\\Users\\14733\\everything-claude-code", "D:\\studio"]
# 格式说明：可以填多个目录，用逗号分隔，系统会允许访问这些路径下的文件

# 按需启用：documentation lookup（无密钥）
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp@latest"]

# 按需启用：浏览器自动化（无密钥，但需要 Chrome/Chromium）
[mcp_servers.playwright]
command = "npx"
args = ["-y", "@playwright/mcp@latest", "--extension"]
```

---

## 配置到 Claude Desktop（~/.claude.json）

如果你用的是 Claude Desktop 而不是 Codex，改用这个格式：

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\14733\\Desktop", "C:\\Users\\14733\\everything-claude-code", "D:\\studio"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

---

## 验证安装与测试

### 测试 1：检查 npx 能否拉取这些包
```powershell
# 按顺序测试，每个都应该显示版本号/帮助信息
npx -y @modelcontextprotocol/server-memory --version
npx -y @modelcontextprotocol/server-sequential-thinking --version
npx -y @modelcontextprotocol/server-filesystem --help
```

### 测试 2：如果上面卡住或超时
可能是国内网络问题，换个镜像：
```powershell
npm config set registry https://registry.npmmirror.com
# 再试一遍上面三个命令
```

### 测试 3：启动后检查是否正常
重启 Claude Desktop / Codex，然后问以下问题：
- **Memory**：对 model 说 "请记住我的名字是 xxx"，下一对话问它你叫什么——如果能回答，说明生效了
- **Sequential-thinking**：问一个复杂的多步推理题，看回复里是否包含详细的思考过程
- **Filesystem**：尝试用代理读取你指定目录里的某个文件

---

## 已弹 API 窗的那些服务怎么办

你现在配置里可能还有这些会要求 API Key 的：
- github（需要 GITHUB_PERSONAL_ACCESS_TOKEN）
- exa（需要 EXA_API_KEY）
- firecrawl（需要 FIRECRAWL_API_KEY）
- fal-ai（需要 FAL_KEY）
- browserbase（需要 BROWSERBASE_API_KEY）
- confluence（需要 3 个 token）

**快速解决办法**：
1. 暂时全部注释掉或删掉这些 section
2. 只保留上面三个 + context7 + 可选 playwright
3. 等真正需要某个功能时，再按需打开并补齐 API Key

---

## 各工具用途速查表

| MCP | 用途 | 何时用 | 是否需要 Key |
|-----|------|--------|-----------|
| memory | 记住任务上下文、用户偏好 | 一直开着 | ✗ |
| sequential-thinking | 复杂逻辑推理、多步规划 | 解决难题时自动用 | ✗ |
| filesystem | 读写本地文件、创建项目 | 任何涉及文件操作 | ✗ |
| context7 | 查实时文档（React、Next.js 等） | 学习新库、查 API | ✗ |
| playwright | 网页自动化、截图、E2E 测试 | UI/自动化测试时 | ✗ |
| github | 拉 PR、查分支、操作 issue | 需要 GitHub CI 集成 | ✓ 需要 PAT |
| exa | 神经网络搜索、代码示例查找 | 深度研究、竞品分析 | ✓ 需要 Key |
| firecrawl | 网页爬取、数据提取 | 大规模数据采集 | ✓ 需要 Key |
