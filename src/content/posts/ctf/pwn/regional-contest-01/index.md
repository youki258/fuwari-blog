---
title: "区域赛1"
published: 2026-05-13
updated: 2026-05-13
description: "checksec file=notepad 使用本地虚拟环境"
tags: ["待整理"]
category: "CTF"
draft: true
---

<!-- source: CTF/pwn/区域赛1.md -->
checksec --file=notepad
使用本地虚拟环境
```python
# 激活虚拟环境
source venv/bin/activate

# 然后运行脚本
python3 exp.py

# 运行完成后，可以退出虚拟环境
deactivate
```
```python
# 使用虚拟环境的 Python 解释器
venv/bin/python3 exp.py
```
