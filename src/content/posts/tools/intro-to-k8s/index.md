---
title: "初识 Kubernetes"
published: 2026-05-27
updated: 2026-05-26
description: "1. Service：一个虚拟的、稳定的“门牌号” 你创建 Service 的时候，Kubernetes 会在集群内部为它分配一个固定的虚拟 IP（Cluste"
tags: ["Kubernetes","K8s","容器编排"]
category: "工具"
draft: true
---

<!-- source: 博客备选笔记/初识k8s.md -->
#### 1. Service：一个**虚拟的、稳定的“门牌号”**

你创建 `Service` 的时候，Kubernetes 会在集群内部为它分配一个**固定的虚拟 IP**（ClusterIP）。这个 IP 永远不会变，只要 Service 存在，它就在那里。

- 你把后端部署成了 3 份 Pod（每个 Pod 有自己的随机 IP）。
    
- 你创建一个 `Service`，名叫 `backend`，它拿到一个 ClusterIP（比如 `10.96.100.1`）。
    
- 这个 `Service` 背后，Kubernetes 会自动维护一个**负载均衡器**，把发往 `10.96.100.1:80` 的请求，均匀转发到那 3 个后端 Pod 上。
    

**所以前端只需要记住 `backend:80` 这一个地址，就能访问到后端的任意副本。** 后端 Pod 增减、重启、IP 变化，前端完全不感知。

#### 2. CoreDNS：一个**内置的“黄页”**

你不可能让前端去记 `10.96.100.1` 这种数字。于是 Kubernetes 内建了一个 DNS 服务（CoreDNS），它相当于集群内部的电话本：

- 你创建了一个叫 `backend` 的 Service。
    
- CoreDNS 就会自动注册一条记录：`backend` → `10.96.100.1`。
    
- 前端 Pod 里的应用发起 `http://backend:80` 请求时，容器里的 DNS 解析器会自动把 `backend` 翻译成 `10.96.100.1`，流量就精准抵达了后端的 Service。
    

**这就是“服务发现”的本质：你只需要知道服务名，不需要知道它有几个副本、IP 是什么、跑在哪台机器上。**

---

### 🔁 一个完整调用链路

在你的集群里，完整的通信过程是这样的：

1. **数据库**：你部署了一个 `Deployment`，跑一个 MySQL Pod，并创建了一个 `Service`，名叫 `db`。
    
2. **后端**：你部署了后端 `Deployment`，副本 3 个，并创建 `Service` 名叫 `backend`。后端代码里，数据库连接地址直接写成 `db:3306`。
    
3. **前端**：你部署了前端 `Deployment`，创建 `Service` 名叫 `frontend`，类型是 `NodePort`（对外暴露）。前端代码里，API 请求地址写成 `backend:80`。
    

最终效果：

- 用户从浏览器访问 `Master节点IP:NodePort` → 流量进入集群，打到 `frontend` Service，再转发给前端 Pod。
    
- 前端 Pod 发起 `GET http://backend:80/api` → CoreDNS 把 `backend` 解析成 ClusterIP → 请求到达 `backend` Service → 负载均衡到某个后端 Pod。
    
- 后端 Pod 连接 `mysql -h db` → CoreDNS 把 `db` 解析成 ClusterIP → 请求到达 `db` Service → 连上数据库 Pod。
    

**整个过程中，没有一个地方出现了具体的 Pod IP 或节点 IP。** 服务之间完全通过 Service 名称通信，而且 Kubernetes 自动处理了负载均衡和高可用。

---

### 💡 这和你在单机上部署有什么本质区别？

|特性|单机 `localhost` 方式|Kubernetes Service 方式|
|---|---|---|
|服务地址|固定写死 IP/端口|通过虚拟 IP 和 DNS，动态发现|
|扩展性|无法横向扩展（端口冲突）|随时增减副本，前端无感知|
|故障恢复|进程挂了就断了|副本自动重新调度，Service 自动转发到健康实例|
|部署灵活性|所有服务绑死在同一台机器|服务可以分布在集群的任何节点上|

**简单说，单机部署是“我告诉你地址”，Kubernetes 是“告诉我你叫什么，我帮你找到地址”。** 后者让服务之间的通信变得松耦合、高可用，也更符合微服务架构的理念。

所以，你在集群里做这个多服务部署实验，不只是在“跑通服务”，而是在**亲眼见证一个微服务架构的通信机制是如何在不改一行代码的情况下实现的**。这在单台服务器上根本无法做到。
