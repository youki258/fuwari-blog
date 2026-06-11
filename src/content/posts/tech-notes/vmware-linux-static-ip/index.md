---
title: "VMware 虚拟机 Linux 固定 IP 配置"
published: 2026-05-22
updated: 2026-05-22
description: "VMware虚拟机Linux固定IP配置（解决网卡未托管/无网问题） 一、问题背景 VMware虚拟机（Linux系统，网卡名ens160）初始状态： 网卡始终"
tags: ["VMware","Linux","静态IP","网络"]
category: "技术随笔"
draft: true
---

<!-- source: 博客备选笔记/VMware虚拟机Linux固定IP配置（解决网卡未托管_无网问题）.md -->
# VMware虚拟机Linux固定IP配置（解决网卡未托管/无网问题）

## 一、问题背景

VMware虚拟机（Linux系统，网卡名ens160）初始状态：

- 网卡始终处于 `state DOWN` 状态，无法启用

- VMware中「已连接」勾选不了，虚拟链路不通

- 配置固定IP时，NetworkManager报「未托管」「No suitable device found」

- 无法解析域名（ping www.baidu.com 提示未知名称或服务）

核心环境：VMware NAT模式，子网IP 192.168.17.0/24，NAT网关 192.168.17.2，目标固定IP 192.168.17.42

## 二、核心故障排查

1. **网卡物理链路问题**：VMware虚拟机未勾选「已连接」「启动时连接」，导致虚拟网卡模拟“网线未插”，Linux无法启用网卡

2. **NetworkManager未托管**：系统默认配置文件（10-globally-managed-devices.conf）禁止NetworkManager管理网卡，修改managed=true无效

3. **配置冲突**：多次修改网卡配置、重复创建连接，导致NetworkManager设备匹配异常

## 三、分步解决方案（全程可复制命令）

### 第一步：解决VMware虚拟链路问题（网卡DOWN）

1. 关闭虚拟机（非暂停），打开「虚拟机设置」→「网络适配器」

2. 勾选 ✅「已连接」、✅「启动时连接」，确认网络模式为「NAT模式」，点击确定

3. 重启宿主机（Windows）VMware核心服务：

    - Win+R输入 `services.msc`，找到「VMware NAT Service」「VMware DHCP Service」

    - 依次右键→「重新启动」，确保状态为「正在运行」

4. 启动虚拟机，验证网卡链路：
        `ip addr show ens160`成功标志：网卡显示 `<BROADCAST,MULTICAST,UP,LOWER_UP> state UP`

### 第二步：绕开NetworkManager，手动配置固定IP（核心）

因NetworkManager持续「未托管」，直接禁用该服务，用Linux原生命令手动配网：

```bash
# 1. 彻底关停并禁用NetworkManager（避免干扰）
systemctl stop NetworkManager
systemctl disable NetworkManager

# 2. 给ens160绑定固定IP（192.168.17.42）
ip addr add 192.168.17.42/24 dev ens160

# 3. 配置网关（必须为VMware NAT网关192.168.17.2）
ip route add default via 192.168.17.2 dev ens160

# 4. 配置DNS（解决域名解析失败问题）
echo -e "nameserver 8.8.8.8\nnameserver 114.114.114.114" > /etc/resolv.conf
```

### 第三步：验证网络连通性

```bash
# 1. 查看固定IP是否生效
ip addr show ens160

# 2. 测试网关连通性（核心，确保能访问外网）
ping 192.168.17.2 -c 2

# 3. 测试外网+域名解析（最终验证）
ping www.baidu.com -c 4
```

成功标志：所有ping命令均能正常通包，无超时、无“未知名称”提示

### 第四步：配置永久生效（重启虚拟机IP不变）

写入网卡配置文件，开机自动加载固定IP配置：

```bash
cat > /etc/sysconfig/network-scripts/ifcfg-ens160 <<EOF
TYPE=Ethernet
BOOTPROTO=static
ONBOOT=yes
DEVICE=ens160
IPADDR=192.168.17.42
NETMASK=255.255.255.0
GATEWAY=192.168.17.2
DNS1=8.8.8.8
DNS2=114.114.114.114
EOF
```

## 四、常见问题兜底方案

1. 若网卡仍DOWN：重新检查VMware「已连接」勾选状态，重启VMware NAT/DHCP服务

2. 若ping网关不通：确认VMware虚拟网络编辑器中，VMnet8的NAT网关为192.168.17.2

3. 若域名解析失败：重新执行DNS配置命令，确保/etc/resolv.conf中有正确的nameserver

## 五、最终效果

- 虚拟机开机后自动获取固定IP 192.168.17.42

- 可正常访问外网、解析域名

- 无需依赖NetworkManager，彻底解决「未托管」问题
> （注：文档部分内容可能由 AI 生成）




`strictly unmanaged` 的意思是：**NetworkManager 被系统配置强制排除管理 `ens160`，`nmcli device set` 无法覆盖。**

`unknown connection` 是因为你 `reload` 后，连接名已经变了（NM 重新读取了 ifcfg 文件，原来的 `System ens160` 已失效）。

别折腾 NM 了，直接**停用 NetworkManager，改用传统 `network.service`**：

```bash
# 1. 彻底停用 NetworkManager
systemctl stop NetworkManager
systemctl disable NetworkManager

# 2. 删除写坏的配置文件，重新正确写入
rm -f /etc/sysconfig/network-scripts/ifcfg-ens160
cat > /etc/sysconfig/network-scripts/ifcfg-ens160 <<'EOF'
TYPE=Ethernet
BOOTPROTO=static
NAME=ens160
DEVICE=ens160
ONBOOT=yes
IPADDR=192.168.17.43
PREFIX=24
GATEWAY=192.168.17.2
DNS1=192.168.17.2
EOF

# 3. 启用并启动传统网络服务
systemctl enable network
systemctl restart network
```
