---
title: "初识CTF：符号执行与逆向入门"
published: 2026-04-15
updated: 2026-04-15
description: "符号执行基本概念与 CTF 逆向工程入门"
tags: ["CTF", "符号执行", "逆向工程", "入门"]
category: "CTF"
draft: false
---

本文记录符号执行的核心思想，以及在 CTF 逆向题中如何用它自动求解 flag。

### 符号执行是什么

符号执行（Symbolic Execution）是一种程序分析技术，可以通过分析程序来得到让特定代码区域执行的输入。

使用符号执行分析一个程序时，该程序会使用**符号值**作为输入，而非一般执行程序时使用的具体值。在达到目标代码时，分析器可以得到相应的**路径约束**，然后通过**约束求解器**（SMT solver）来得到可以触发目标代码的具体值。

在实际环境下，符号执行被广泛运用到自动化漏洞挖掘测试的过程中。

![符号执行示意](./remote-01.png)

### 为什么 CTF 逆向喜欢用符号执行

在 CTF 中，符号执行很适合解决各种逆向题：只需让符号执行引擎自动分析，找到让程序执行到"输出 flag 正确"的位置，然后求解出所需的输入即可。相比于手工逆向算法再写解密脚本，符号执行省去了大量人工反推过程，尤其适合**输入经过复杂变换后与目标常量比较**的题目。

典型适用题型：

- 输入经多轮位运算/算术运算后与 `correct_flag` 比较
- "输入正确则打印 Congrats" 类的控制流
- 带大量魔法常量、人工逆向很费时间的题目

### 常用工具

| 工具 | 定位 | 说明 |
|------|------|------|
| **angr** | Python 符号执行框架 | CTF 逆向最常用，支持二进制加载、符号执行、约束求解一体化 |
| **Z3** | SMT 约束求解器 | angr 底层使用，也可单独用来解数学/位运算约束 |
| **Triton** | 动态二进制分析 | 结合动态执行，缓解路径爆炸 |
| **KLEE** | LLVM IR 级符号执行 | 主要面向源码/中间表示，多用于研究 |

### CTF 逆向基本流程

1. **静态分析**：用 `file`、`strings`、IDA/Ghidra 看程序结构、找到输入读取点（`scanf`、`argv`）和"成功/失败"分支。
2. **定位目标**：找到"成功"分支的地址，作为符号执行要到达的目标（`find=`）。
3. **符号执行**：用 angr 把输入设为符号变量，探索到目标地址的路径。
4. **求解**：拿到可达路径后，让 Z3 解出输入的具体值，提交验证。

### angr 最小示例

下面是一个典型模板——假设程序在地址 `0x40129c` 处打印成功、在 `0x40128f` 处打印失败：

```python
import angr
import claripy

proj = angr.Project('./rev_chall', auto_load_libs=False)

# 把输入当作符号（假设程序用 fgets 读最多 0x20 字节）
flag_size = 0x20
flag = claripy.BVS('flag', flag_size * 8)

state = proj.factory.full_init_state(
    stdin=angr.SimPackets(name='stdin', content=[(flag, flag_size)]),
    add_options={angr.options.LAZY_SOLVES},
)

# 对每个字节加可打印约束，缩小搜索空间
for i in range(flag_size):
    byte = flag.get_byte(i)
    state.solver.add(byte >= 0x20)
    state.solver.add(byte <= 0x7e)

simgr = proj.factory.simulation_manager(state)
simgr.explore(find=0x40129c, avoid=0x40128f)  # 找成功、避开失败

if simgr.found:
    found = simgr.found[0]
    print('flag =', found.solver.eval(flag, cast_to=bytes))
else:
    print('未找到可行路径')
```

### 局限性

符号执行并非万能，常见坑：

- **路径爆炸**：循环次数多、分支密集时，需要探索的路径指数增长。
- **复杂库函数**：`auto_load_libs=False` 能避开 libc，但程序自己调用复杂函数时仍可能卡住。
- **不适用加密题**：标准 AES/RC4 等强加密算法的约束太复杂，Z3 通常解不动，这种情况还是要手工识别算法后写解密脚本。

实践建议：先用静态分析缩小符号执行的范围（比如只对"校验函数"内部做符号执行），能显著提高成功率。
