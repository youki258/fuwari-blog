---
title: "GFW识别 CDN相关"
published: 2026-04-08
updated: 2026-04-08
description: "GFW 大战 Cloudflare，以及积至公司推荐的火爆翻墙项目免费且速度很快https://github.com/XTLS/BBS/issues/23 1."
tags: ["待整理"]
category: "技术随笔"
draft: true
---

<!-- source: 博客备选笔记/GFW识别 CDN相关.md -->
[GFW 大战 Cloudflare，以及积至公司推荐的火爆翻墙项目免费且速度很快](https://github.com/XTLS/BBS/issues/23)
## 1. SNI（服务器名称指示）—— 明文的"门牌号"

### 什么是 SNI？

当你访问一个 HTTPS 网站时，在加密连接建立之前，你会明文发送一个字段叫 **SNI**，告诉服务器你要访问哪个域名。

比如访问 `worker-demo.yourname.workers.dev`，这个域名会以**明文**形式在网络上传输。

### GFW 如何利用 SNI？

```text
正常用户访问的 SNI：
- www.baidu.com
- www.bilibili.com
- api.github.com

翻墙用户访问的 SNI：
- proxy123.username.workers.dev  ← Workers 默认域名
- tunnel.abcd.pages.dev          ← Pages 域名
- *.trycloudflare.com            ← Tunnel 临时域名
```

**识别逻辑：**

- GFW 可以维护一个"Workers 子域名黑名单"
    
- 只要检测到 SNI 包含 `workers.dev`、`pages.dev` 等特征，或匹配已知的翻墙 Worker 子域名，就直接阻断
    
- 即使你用自定义域名（如 `my-proxy.com`），如果 GFW 发现这个域名指向 Cloudflare Workers IP 且有异常流量模式，也会被标记



**长时间连接检测：**

- 正常 HTTPS 连接平均持续 30-60 秒
    
- 代理连接可能持续 30 分钟以上，且期间一直有数据传输
    
- GFW 标记"持续活跃的 HTTPS 长连接"为可疑
    

**流量指纹（Packet Size & Timing）：**

- 你的代理工具（如 Clash、V2Ray）在加密数据时，会产生特定大小的数据包
    
- 比如每 2 秒发送一个 1400 字节的心跳包
    
- GFW 通过机器学习识别这种"机械式"的流量模式


## 综合举例：GFW 如何判定你在用 edgetunnel

假设你在用 edgetunnel（一个基于 Workers 的代理）：

1. **DNS 阶段**：你的电脑查询 `edgetunnel.yourname.workers.dev` → **可疑**
    
2. **TLS 握手阶段**：SNI 明文显示 `yourname.workers.dev` → **确认是 Workers**
    
3. **指纹检测**：JA3 显示这不是浏览器，是代理客户端 → **确认是代理**
    
4. **流量分析**：连接持续 2 小时，上下行流量对称，心跳包规律 → **确认是代理隧道**
    
5. **IP 分析**：你连接的 Cloudflare IP 是 `104.16.x.x`，不是最优节点 → **确认使用了优选 IP**
    

**结论：阻断该连接，或限速，或记录你的 IP 进行重点监控。**




```plain
GFW 识别 Workers 代理的多重手段：

1. SNI 明文检查（第一层）
   workers.dev / pages.dev → 直接标记

2. 自定义域名（第二层）
   yourdomain.com → 指向 104.16.x.x 
                 → 流量特征异常 
                 → 回溯发现是 Workers IP 
                 → 标记

3. DNS 情报收集（第三层）
   监控全国 DNS 查询日志
   → 发现大量 .workers.dev 查询来自特定用户群
   → 分析这些域名
   → 发现是代理工具
   → 加入黑名单

4. IP + 流量指纹（第四层）
   无论域名是什么
   → 只要连接到 Workers IP 段
   → 且 JA3/流量模式匹配代理特征
   → 精准识别
```

说起来Hysteria协议都出来好久了，咋没看见有什么机场用

1.Hysteria 比较新，原有机场原来协议正常使用压根没必要换
2.Hysteria 是 quic，运营商 qos 限流严重，尤其是高峰期，自己可以建一个试试
3.Vless+reality 就是目前抗审查能力最强的方式，vless 开销小，也好用
