---
title: "BFS 算法笔记（AI 优化版）"
published: 2025-07-26
updated: 2025-07-26
description: "1. BFS（广度优先搜索） 核心思想 层级遍历：从起点逐层向外扩展，使用队列（FIFO）保证访问顺序。 适用场景：无权图最短路径、连通性检测、迷宫问题（如MC"
tags: ["BFS","算法","C++","图搜索"]
category: "算法练习"
draft: true
---

<!-- source: 码蹄杯/算法（ai优化.md -->
### **1. BFS（广度优先搜索）**

#### **核心思想**

- **层级遍历**：从起点逐层向外扩展，使用队列（FIFO）保证访问顺序。
- **适用场景**：无权图最短路径、连通性检测、迷宫问题（如MC0329都市路径）。

#### **C++模板代码**

```c++
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

void BFS(vector<vector<int>>& graph, int start) {
    vector<bool> visited(graph.size(), false);
    queue<int> q;
    q.push(start);
    visited[start] = true;

    while (!q.empty()) {
        int node = q.front();
        q.pop();
        cout << node << " "; // 处理节点
        for (int neighbor : graph[node]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.push(neighbor);
            }
        }
    }
}

// 示例：邻接表图遍历
int main() {
    vector<vector<int>> graph = {{1,2}, {0,3}, {0,3,4}, {1,2,4}, {2,3}};
    cout << "BFS顺序：";
    BFS(graph, 0); // 输出：0 1 2 3 4
    return 0;
}
```

**关键点**：

- **队列管理**：`queue`存储待访问节点，确保层级顺序。
- **时间复杂度**：`O(V+E)`（节点数+边数）。

#### **典型应用**

- **迷宫最短路径**：使用方向数组`dir[4][2]`遍历相邻格子，记录步数（见完整代码）。
- **社交网络好友推荐**：按层级遍历好友关系。

------

### **2. 贪心算法**

#### **核心思想**

- **局部最优**：每一步选择当前最优解，无后效性。
- **适用条件**：问题需满足**贪心选择性**和**最优子结构**。

#### **C++模板与示例**

```c++
#include <algorithm>
#include <vector>
using namespace std;

// 活动选择问题（最早结束优先）
struct Activity { int start, end; };
bool compare(Activity a, Activity b) { return a.end < b.end; }

int maxActivities(vector<Activity>& acts) {
    sort(acts.begin(), acts.end(), compare);
    int count = 1, lastEnd = acts[0].end;
    for (int i = 1; i < acts.size(); i++) {
        if (acts[i].start >= lastEnd) {
            count++;
            lastEnd = acts[i].end;
        }
    }
    return count;
}
```

**典型场景**：

1. **活动安排**：按结束时间排序，选择相容活动。
2. **Huffman编码**：合并频率最低的节点（需优先队列）。
3. **最小硬币找零**：面值从大到小遍历（**注意**：仅适用特定面值，如`{1,5,10,25}`）。

**局限性**：
 贪心不一定全局最优！例如硬币面值`{1,3,4}`找零6：贪心得`{4,1,1}`（3枚），最优解是`{3,3}`（2枚）。

------

### **3. 前缀和与差分**

#### **一维前缀和**

**用途**：快速计算区间和，预处理`O(n)`，查询`O(1)`。

```c++
vector<int> prefix(n+1, 0);
for (int i=1; i<=n; i++) 
    prefix[i] = prefix[i-1] + arr[i-1];

// 查询[L,R]和：sum = prefix[R] - prefix[L-1];
```

#### **二维前缀和**

**用途**：子矩阵求和（如LeetCode 304）。

```c++
// 预处理
vector<vector<int>> sum(n+1, vector<int>(m+1, 0));
for (int i=1; i<=n; i++)
    for (int j=1; j<=m; j++)
        sum[i][j] = sum[i-1][j] + sum[i][j-1] - sum[i-1][j-1] + matrix[i-1][j-1];

// 查询(x1,y1)到(x2,y2)和： 
int area = sum[x2][y2] - sum[x1-1][y2] - sum[x2][y1-1] + sum[x1-1][y1-1];
```

#### **差分**

**用途**：高效处理区间增减（如批量加减k）。

```c++
vector<int> diff(n+2, 0); // 多开空间防越界
void add(int l, int r, int k) {
    diff[l] += k;
    diff[r+1] -= k;
}
// 还原数组
for (int i=1; i<=n; i++) 
    arr[i] = arr[i-1] + diff[i];
```

**典型题目**：

- **区间覆盖统计**（MC0351）：差分标记区间端点，前缀和还原。
- **航班预订统计**（LeetCode 1109）。

------

### **4. 字典序最小**

#### **定义与构造**

- **比较规则**：从左到右逐字符比较，首个不同位字符小的序列更小（如`"apple" < "apricot"`）。
- **贪心构造**：每一步选当前可用的最小字符，确保后续合法。

**示例问题**：拼接字符串使字典序最小

```c++
// 贪心策略：按a+b < b+a排序
sort(strs.begin(), strs.end(), [](string a, string b) {
    return a + b < b + a;
});
string ans;
for (string s : strs) ans += s;
```

------

### **5. 综合对比与总结**

| **算法** | **核心思想**        | **时间复杂度** | **典型应用**          |
| -------- | ------------------- | -------------- | --------------------- |
| BFS      | 层级遍历+队列       | O(V+E)         | 无权图最短路径、迷宫  |
| 贪心算法 | 局部最优无回溯      | 依策略而定     | 活动选择、Huffman编码 |
| 前缀和   | 预处理区间和        | O(n)预处理     | 静态数组区间求和      |
| 差分     | 端点修改+前缀和还原 | O(1)修改       | 区间批量增减          |

#### **学习建议**

- **BFS vs DFS**：BFS求最短路径（无权），DFS适合路径存在性检测。
- **贪心验证**：需数学证明贪心策略的全局最优性（如活动选择的结束时间排序）。
- **前缀和&差分**：差分是前缀和的逆操作，结合使用可高效处理“区间修改+单点查询”。

> 完整代码和题目解析可参考：[BFS迷宫模板](https://blog.csdn.net/2401_84978525/article/details/138779516) [活动选择代码](https://mp.weixin.qq.com/s?__biz=MzU2NDgzNjgzNw==&mid=2247488121&idx=1&sn=5394a3cfc653c97937bb2c84ff7e72f2)。以下是针对 C++ 中 `queue` 的补充内容，重点覆盖 BFS 实现中的队列使用细节、初始化方法及防重入注意事项，结合代码示例说明：

------

###  **一、C++ 队列（`queue`）基础操作**

#### ** 核心函数**

| **函数**  | **作用**         | **示例**                 |
| --------- | ---------------- | ------------------------ |
| `push()`  | 队尾插入元素     | `q.push(10);`            |
| `pop()`   | 删除队首元素     | `q.pop();`               |
| `front()` | 访问队首元素     | `int x = q.front();`     |
| `back()`  | 访问队尾元素     | `int y = q.back();`      |
| `empty()` | 检测队列是否为空 | `if (q.empty()) { ... }` |
| `size()`  | 返回队列元素数量 | `int len = q.size();`    |

>  **重要限制**：
>
> - `vector` 不能作为底层容器（缺少 `pop_front()`）
> - `front()` 和 `pop()` 前需检查队列非空，否则行为未定义！


#### ** BFS 最短路径应用**

```c++
#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>
using namespace std;

vector<string> shortest_path(unordered_map<string, vector<string>>& graph, string start, string end) {
    queue<string> q;
    unordered_map<string, bool> visited;
    unordered_map<string, string> parent;  // 记录路径父节点
    
    q.push(start);
    visited[start] = true;
    parent[start] = "";

    while (!q.empty()) {
        string cur = q.front();
        q.pop();
        if (cur == end) {
            // 反向回溯路径
            vector<string> path;
            for (string at = end; at != ""; at = parent[at]) 
                path.push_back(at);
            reverse(path.begin(), path.end());
            return path;
        }
        for (string neighbor : graph[cur]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                parent[neighbor] = cur;  // 记录父节点
                q.push(neighbor);
            }
        }
    }
    return {}; // 无路径
}
```

完整 BFS 模板参考：[C++ BFS 算法详解](https://blog.csdn.net/weixin_51566349/article/details/129632599)。
