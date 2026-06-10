---
title: "12.28"
published: 2025-12-28
updated: 2025-12-28
description: "第一节课 基本概念 李宏毅机器学习深度学习系列课程https://www.bilibili.com/video/BV1TAtwzTE1S?p=2 重要的概念 M"
tags: ["待整理"]
category: "深度学习"
draft: true
---

<!-- source: 深度学习/12.28.md -->
## 第一节课 基本概念 [李宏毅机器学习深度学习系列课程](https://www.bilibili.com/video/BV1TAtwzTE1S?p=2)

### 重要的概念



Model y = b + wx~1~

Loss: how good a set of values is.
label:正确的值

计算误差的方式：

![image-20251228093631578](./remote-01.png)

要找到最小的loss就是找到最优的w&b：用Gradient Descent

![image-20251228094655307](./remote-02.png)

![image-20251228095210223](./remote-03.png)

上图就是更新参数的过程

结合真实情况改进模型

![image-20251228095734216](./remote-04.png)

模型名：linear model

![image-20251228113711083](./remote-05.png)

![image-20251228114237754](./remote-06.png)

用蓝色的线组合实现红色的效果

![image-20251228113936306](./remote-07.png)

蓝色的叫Hard Sigmoid

![image-20251228114853265](./remote-08.png)

![image-20251228114930160](./remote-09.png)

![image-20251228115140199](./remote-10.png)

为什么这里c要转置

![image-20251228115456114](./remote-11.png)

这是在合并未知向量



同上，更新参数

![image-20251228120316919](./remote-12.png)





把一个数据分段进行计算并更新，这些参数yolo训练时也有。如：batch epoch

![image-20251228120535397](./remote-13.png)





2种激活函数

![image-20251228121003157](./remote-14.png)



可多次重复  layers

![image-20251228121252874](./remote-15.png)

单一个是neuron 整个就是neural network    现在换了个名字Many layers means Deep    -->Deep Learning
