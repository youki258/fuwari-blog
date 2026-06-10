---
title: "1选择器"
published: 2026-04-08
updated: 2026-04-08
description: "人工智能、机器学习与深度学习的关系 人工智能（AI） 概念起源：1950年代 目标：创建能够达到人类智慧水平的机器 实现方式：有多种方法，机器学习是其中之一 机"
tags: ["待整理"]
category: "学习记录"
draft: true
---

<!-- source: 25暑假/5/鸢尾花/1选择器.md -->
## 人工智能、机器学习与深度学习的关系

- **人工智能（AI）**
  - 概念起源：1950年代
  - 目标：创建能够达到人类智慧水平的机器
  - 实现方式：有多种方法，机器学习是其中之一

- **机器学习（ML）**
  - 发展时间：1980年代开始兴起
  - 地位：实现人工智能的一种重要方法
  - 发展推动因素：
    - 数据量增长
    - 硬件设施发展
    - 算法进步

- **深度学习（DL）**
  - 发展时间：2010年左右开始热门
  - 原因：大数据量和在图像识别、语音识别等领域的良好表现
  - 地位：机器学习的一个重要分支
  - 包含算法：CNN、RNN等

关系总结：深度学习 ⊂ 机器学习 ⊂ 人工智能

## 机器学习基本概念

### 机器学习解决问题的基本流程

1. **训练样本**：N个已知样本数据
2. **特征提取**：从样本中提取有用属性
3. **算法学习**：使用算法学习特征规律
4. **模型构建**：形成可预测的模型
5. **预测未知**：对新数据进行预测

### 机器学习分类

- **监督学习**：
  - 训练样本包含标签
  - 应用：分类、回归问题
  - 示例：人脸识别、房价预测

- **无监督学习**：
  - 训练样本不包含标签
  - 应用：聚类分析
  - 示例：用户行为分析、市场细分

## 鸢尾花分类项目实践

### 数据集介绍

- 样本数量：150个
- 特征数量：4个
  - 花萼长度（sepal_length）
  - 花萼宽度（sepal_width）
  - 花瓣长度（petal_length）
  - 花瓣宽度（petal_width）
- 分类类别：3种
  - 山鸢尾（Iris-setosa）
  - 变色鸢尾（Iris-versicolor）
  - 维吉尼亚鸢尾（Iris-virginica）

### 实践步骤

1. **数据集划分**
   - 使用`train_test_split`将数据分为训练集(2/3)和测试集(1/3)
   - 设置随机种子确保实验可重复

2. **K近邻算法实现**
   - 核心思想："近朱者赤"，找最近的训练样本
   - 距离计算：欧氏距离
   - 预测方法：选择距离最近样本的标签

3. **模型评估**
   - 准确率计算：预测正确的样本数/总样本数
   - 实际效果：达到96%的准确率




让我详细解释一下当数据是 `5.1,3.5,1.4,0.2,Iris-setosa` 时，`row[FEAT_COLS]` 是如何工作的：

## 数据读取和结构

首先，让我们看看数据是如何被读取和组织的：

```python
# 定义列名
columns = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species']
iris_data = pd.read_csv(DATA_FILE, names=columns)
```


当你的一行数据 `5.1,3.5,1.4,0.2,Iris-setosa` 被读取后，pandas 会将其组织成这样的结构：

| sepal_length | sepal_width | petal_length | petal_width | species     |
| ------------ | ----------- | ------------ | ----------- | ----------- |
| 5.1          | 3.5         | 1.4          | 0.2         | Iris-setosa |

## row[FEAT_COLS] 的工作原理

当你在循环中执行 `for idx, row in train_data.iterrows():` 时，对于上面这行数据：

1. `row` 变量会是这样一个 pandas Series 对象：
   ```
   sepal_length    5.1
   sepal_width     3.5
   petal_length    1.4
   petal_width     0.2
   species         Iris-setosa
   ```


2. [FEAT_COLS](file://D:\工作室\鸢尾花\knn\knn_01.py#L15-L15) 是我们定义的特征列列表：
   ```python
   FEAT_COLS = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width']
   ```


3. 当执行 `row[FEAT_COLS]` 时，pandas 会：
   - 根据 [FEAT_COLS](file://D:\工作室\鸢尾花\knn\knn_01.py#L15-L15) 中的列名列表
   - 从 `row` 中选择对应的列数据
   - 结果是：
     ```
     sepal_length    5.1
     sepal_width     3.5
     petal_length    1.4
     petal_width     0.2
     ```


4. 最后 `.values` 将这个 pandas Series 转换为 numpy 数组：
   ```python
   [5.1, 3.5, 1.4, 0.2]
   ```


## 完整过程示例

```python
# 假设原始数据行是：5.1,3.5,1.4,0.2,Iris-setosa

# 读取后变成 DataFrame 中的一行：
#    sepal_length  sepal_width  petal_length  petal_width      species
# 0           5.1          3.5           1.4          0.2  Iris-setosa

# 在循环中 row 变量是：
# sepal_length    5.1
# sepal_width     3.5
# petal_length    1.4
# petal_width     0.2
# species         Iris-setosa

# row[FEAT_COLS] 选择指定的特征列：
# sepal_length    5.1
# sepal_width     3.5
# petal_length    1.4
# petal_width     0.2

# .values 转换为 numpy 数组：
# [5.1, 3.5, 1.4, 0.2]
```


所以 `row[FEAT_COLS].values` 的作用就是从完整的一行数据中提取出数值特征部分，用于后续的距离计算。
