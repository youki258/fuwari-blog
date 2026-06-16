---
title: "虚拟机网络配置"
published: 2026-03-07
updated: 2026-03-07
description: "VMware NAT 网络下为虚拟机配置静态 IP 的最佳实践：避开 DHCP 池，用 nmcli 一步到位"
tags: ["虚拟机","VMware","网络配置"]
category: "网络与架构"
draft: false
---

<!-- source: 博客备选笔记/虚拟机网络配置.md -->

VMware NAT 网络默认用 DHCP 给虚拟机分配 IP，地址会浮动，多台虚拟机一起开还可能撞 IP 导致 SSH（如 MobaXterm）断连。要彻底解决这个问题，推荐采用 **"静态 IP + 避开 DHCP 池"** 的策略：把静态 IP 设在 DHCP 分配范围之外，既固定又不会和自动分配的地址冲突。

下面以 VMware NAT 网段 `192.168.17.0/24` 为例，演示如何把一台虚拟机的 IP 永久固定为 `192.168.17.10`。

### 💡 最稳妥的 IP 分配策略

VMware NAT 的 DHCP 默认会给虚拟机分配 `192.168.17.128` 到 `192.168.17.254` 之间的 IP。
如果把虚拟机的 IP 手动固定在这个范围内（比如常见的 `.128`），一旦开启多台虚拟机，VMware 的 DHCP 可能会把 `.128` 分配给别人，导致 IP 冲突，SSH 就会断连。

**黄金法则：将静态 IP 设置在 DHCP 范围之外。**
在这个网段里，可用的安全 IP 范围是：**`192.168.17.3` 到 `192.168.17.127`**。

可以这样规划虚拟机：

* **宿主机 (Windows)**: `192.168.17.1` (系统固定)
* **NAT 网关**: `192.168.17.2` (系统固定)
* **虚拟机 A (当前这台)**: `192.168.17.10`
* **虚拟机 B**: `192.168.17.11`
* **虚拟机 C**: `192.168.17.12`
*(以此类推，永远不会冲突)*

---

### 🛠️ 通用配置步骤（每台虚拟机只需做一次）

请确保这台虚拟机的网络适配器已经设置为 **NAT 模式**。然后在这台虚拟机中，直接复制粘贴并执行以下命令（这比图形界面更精准，不会出错）。

我们将把这台虚拟机的 IP 永久固定为 **`192.168.17.10`**：

```bash
# 1. 设置静态 IP 和子网掩码 (将 10 替换为你想要的数字)
sudo nmcli connection modify ens160 ipv4.addresses 192.168.17.10/24

# 2. 设置正确的网关
sudo nmcli connection modify ens160 ipv4.gateway 192.168.17.2

# 3. 设置稳定的 DNS (Google 和 114)
sudo nmcli connection modify ens160 ipv4.dns "8.8.8.8,114.114.114.114"

# 4. 将网络获取方式改为手动 (彻底摆脱 DHCP 干扰)
sudo nmcli connection modify ens160 ipv4.method manual

# 5. 重启网卡让配置生效
sudo nmcli connection down ens160 && sudo nmcli connection up ens160

```

---

### 🔍 验证与连接

1. 执行完上面的命令后，输入 `ip addr`，你应该会看到 `ens160` 的 IP 变成了 `192.168.17.10`。
2. 输入 `ping -c 3 baidu.com`，确认外网依然畅通。
3. 打开 MobaXterm，新建一个 SSH Session，Host 填入 `192.168.17.10`，即可完美连接。

只要不去动 VMware 的 `Restore Defaults`，这个 `17` 网段和 `10` 这个 IP 就会一直稳定，无论怎么切换物理网络环境。
