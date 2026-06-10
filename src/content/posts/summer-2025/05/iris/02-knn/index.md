---
title: "2knn"
published: 2026-04-08
updated: 2026-04-08
description: "Python人工智能学习笔记：KNN分类算法基础 一、机器学习基本概念 1. 核心思想：通过数据训练模型，让计算机学习规律并进行预测 2. 关键要素： 特征数据"
tags: ["待整理"]
category: "学习记录"
draft: true
---

<!-- source: 25暑假/5/鸢尾花/2knn.md -->
# Python人工智能学习笔记：KNN分类算法基础

## 一、机器学习基本概念

1. **核心思想**：通过数据训练模型，让计算机学习规律并进行预测
2. **关键要素**：
   - 特征数据（X）：描述样本特性的多维数据
   - 标签数据（y）：样本对应的类别或结果
   - 模型：学习数据规律的算法

## 二、scikit-learn基础

1. **数据格式要求**：

   - 特征X必须是数值矩阵（如150×4）
   - 标签y必须是数值向量（如150个0/1/2）

2. **数据预处理**：

   ```
   # 将文本标签转为数字
   iris_data['Label'] = iris_data['Species'].map({
       'Iris-setosa': 0,
       'Iris-versicolor': 1,
       'Iris-virginica': 2
   })
   ```

3. **数据划分**：

   ```
   from sklearn.model_selection import train_test_split
   X_train, X_test, y_train, y_test = train_test_split(
       X, y, test_size=0.33, random_state=10)
   ```

## 三、KNN算法原理

1. **工作原理**：
   - 计算测试样本与所有训练样本的距离
   - 找出距离最近的K个邻居
   - 根据邻居的多数类别确定预测结果
2. **K值影响**：
   - K=1：只考虑最近的一个样本（容易受噪声影响）
   - K增大：决策边界更平滑（可能忽略局部特征）

## 四、scikit-learn实现流程

1. **四步标准流程**：

   ```
   # 1. 导入模型
   from sklearn.neighbors import KNeighborsClassifier
   
   # 2. 创建模型（默认K=5）
   knn = KNeighborsClassifier()
   
   # 3. 训练模型
   knn.fit(X_train, y_train)
   
   # 4. 评估与预测
   accuracy = knn.score(X_test, y_test)
   y_pred = knn.predict(X_new)
   ```

2. **完整示例**：

   ```
   # 数据准备
   features = ['SepalLengthCm', 'SepalWidthCm', 'PetalLengthCm', 'PetalWidthCm']
   X = iris_data[features].values
   y = iris_data['Label'].values
   
   # 训练评估
   knn = KNeighborsClassifier()
   knn.fit(X_train, y_train)
   print(f'准确率: {knn.score(X_test, y_test):.2%}')
   ```

## 五、关键要点总结

1. **数据要求**：
   - 特征必须是数值型
   - 类别标签需要编码为数字
2. **模型特点**：
   - 简单直观，适合初学者
   - 计算复杂度随数据量增加
   - 对特征尺度敏感
3. **应用场景**：
   - 分类边界不规则的问题
   - 中小规模数据集
   - 需要解释预测结果的情况

注：实际代码实现时，建议参考完整代码示例，确保正确处理数据格式和模型参数。
