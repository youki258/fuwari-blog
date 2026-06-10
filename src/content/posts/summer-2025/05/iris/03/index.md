---
title: "3"
published: 2026-04-08
updated: 2026-04-08
description: "Python人工智能学习笔记：KNN算法深入与参数调优 一、KNN算法深入理解 1. 相似性度量（距离计算） 明可夫斯基距离（Minkowski Distanc"
tags: ["待整理"]
category: "学习记录"
draft: true
---

<!-- source: 25暑假/5/鸢尾花/3.md -->
# Python人工智能学习笔记：KNN算法深入与参数调优

## 一、KNN算法深入理解

### 1. 相似性度量（距离计算）

- **明可夫斯基距离（Minkowski Distance）**：

  - 通用距离公式：`distance = (∑|x_i - y_i|^p)^(1/p)`
  - 当p=2时：欧式距离（默认）
  - 当p=1时：曼哈顿距离（出租车距离）

- **scikit-learn中的设置**：

  ```
  KNeighborsClassifier(metric='minkowski', p=2)  # 默认欧式距离
  KNeighborsClassifier(metric='minkowski', p=1)  # 曼哈顿距离
  ```

### 2. K值的影响

- **K值增大**：
  - 分类边界更平滑
  - 模型更稳定（减少噪声影响）
  - 但可能忽略局部特征
- **K值减小**：
  - 分类边界更复杂
  - 对噪声更敏感
  - 可能过拟合

## 二、模型参数分类

### 1. 超参数（Hyperparameters）

- **特点**：
  - 需要人工预先设定
  - 不能从数据中学习得到
  - 直接影响模型性能
- **示例**：
  - KNN中的K值和距离度量方式
  - 神经网络中的层数和节点数

### 2. 模型参数（Model Parameters）

- **特点**：
  - 通过训练数据自动学习得到
  - 不需要人工设定
  - 如线性回归的系数、神经网络的权重

## 三、KNN优缺点总结

### 优点：

1. 原理简单直观，易于实现
2. 无需训练过程（惰性学习）
3. 对数据分布没有假设

### 缺点：

1. 计算量大（需计算与所有训练样本的距离）
2. 对高维数据效果差（维度灾难）
3. 需要合理选择K值和距离度量
4. 对不平衡数据敏感

## 四、实践案例：鸢尾花分类边界可视化

### 代码框架：

```
from sklearn.neighbors import KNeighborsClassifier
import matplotlib.pyplot as plt

# 测试不同K值
k_values = [3, 5, 10]
selected_features = ['SepalLengthCm', 'SepalWidthCm']

for k in k_values:
    # 1. 创建模型
    knn = KNeighborsClassifier(n_neighbors=k)
    
    # 2. 训练模型
    knn.fit(X_train[selected_features], y_train)
    
    # 3. 评估模型
    accuracy = knn.score(X_test[selected_features], y_test)
    print(f'K={k}时准确率: {accuracy:.2%}')
    
    # 4. 可视化决策边界
    plt.figure()
    # 绘制决策边界代码...
    plt.title(f'K={k}决策边界')
    plt.savefig(f'k_{k}_boundary.png')
```

### 实验结果分析：

1. 仅使用花萼长宽两个特征时：
   - K=3：准确率66%
   - K=5：准确率68%
   - K=10：准确率78%
2. 可视化观察：
   - K值增大，决策边界更平滑
   - 适当增大K值可能提升模型泛化能力

## 五、关键知识点总结

1. **距离度量选择**：
   - 欧式距离（默认）适合大多数情况
   - 曼哈顿距离对异常值更鲁棒
2. **K值选择原则**：
   - 需要通过交叉验证确定最优值
   - 一般取3-20之间的奇数（避免平票）
   - 小数据集：较小K值
   - 大数据集：较大K值
3. **特征选择影响**：
   - 不同特征组合会影响分类效果
   - 可视化时通常选择2个主要特征
4. **实际应用建议**：
   - 对数据进行标准化（KNN对特征尺度敏感）
   - 使用KD树等数据结构加速搜索（大数据集）
   - 考虑特征重要性（高维数据需降维）

注：完整代码实现时，建议参考文档中的可视化部分，理解不同K值对决策边界的影响。实际应用中应使用全部有效特征而非仅两个特征。
