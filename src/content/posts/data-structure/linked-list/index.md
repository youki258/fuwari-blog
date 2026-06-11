---
title: "链表基础与 LeetCode 练习"
published: 2026-04-08
updated: 2026-04-08
description: "链表基础概念、五大操作、LeetCode 经典题解（反转链表、设计链表、扁平化多级链表等）"
tags: ["数据结构", "C++", "链表", "LeetCode"]
category: "数据结构"
draft: true
---

<!-- source: 25暑假/1/链表.md + 25暑假/2/链表2.md + 25暑假/3/链表3.md -->

### **一、链表概念**

1. **与数组的区别**
	- 数组：连续内存空间，随机访问高效（O(1)），但插入/删除需移动元素（O(n)）
	- 链表：**节点离散存储**，通过指针连接（逻辑连续，物理非连续）
	- **访问效率**：链表只能顺序访问（O(n)），但插入/删除只需修改指针（O(1)）
2. **节点结构（C++实现）**

```cpp
struct ListNode {
    int val;         // 存储数据
    ListNode* next;  // 指向下一节点的指针
    ListNode(int x) : val(x), next(nullptr) {}
};
```

---

### **二、链表底层机制**

1. **内存分配原理**
	- 节点内存非连续 → **动态分配**（C++用`new`/`delete`）
	- 创建节点：`ListNode* node = new ListNode(10);`
	- 释放节点：`delete node;`（避免内存泄漏）
2. **指针操作图解**

```
初始： head → A → B → C → nullptr
删除B：
  1. 定位A: A->next = B->next
  2. 释放B: delete B
结果： head → A → C → nullptr
```

---

### **三、链表五大基础操作（C++实现）**

#### **1. 遍历链表**

```cpp
void traverse(ListNode* head) {
    ListNode* cur = head;
    while (cur != nullptr) {
        cout << cur->val << " ";
        cur = cur->next;
    }
}
```

#### **2. 插入节点**

- **头部插入**

	```cpp
	void insertAtHead(ListNode*& head, int val) {
	    ListNode* newNode = new ListNode(val);
	    newNode->next = head;
	    head = newNode;
	}
	```

- **尾部插入**

	```cpp
	void insertAtTail(ListNode*& head, int val) {
	    ListNode* newNode = new ListNode(val);
	    if (head == nullptr) {
	        head = newNode;
	        return;
	    }
	    ListNode* cur = head;
	    while (cur->next != nullptr) {
	        cur = cur->next;
	    }
	    cur->next = newNode;
	}
	```

- **中间插入（在pos节点后插入）**

	```cpp
	void insertAfter(ListNode* pos, int val) {
	    if (pos == nullptr) return;
	    ListNode* newNode = new ListNode(val);
	    newNode->next = pos->next;
	    pos->next = newNode;
	}
	```

#### **3. 删除节点**

```cpp
void deleteNode(ListNode*& head, int val) {
    if (head == nullptr) return;

    if (head->val == val) {
        ListNode* temp = head;
        head = head->next;
        delete temp;
        return;
    }

    ListNode* cur = head;
    while (cur->next != nullptr && cur->next->val != val) {
        cur = cur->next;
    }

    if (cur->next != nullptr) {
        ListNode* temp = cur->next;
        cur->next = cur->next->next;
        delete temp;
    }
}
```

#### **4. 修改节点值**

```cpp
void updateNode(ListNode* head, int oldVal, int newVal) {
    ListNode* cur = head;
    while (cur != nullptr) {
        if (cur->val == oldVal) {
            cur->val = newVal;
            return;
        }
        cur = cur->next;
    }
}
```

#### **5. 查找节点**

```cpp
ListNode* searchNode(ListNode* head, int val) {
    ListNode* cur = head;
    while (cur != nullptr) {
        if (cur->val == val) {
            return cur;
        }
        cur = cur->next;
    }
    return nullptr;
}
```

---

### **四、关键点**

1. **头指针的特殊处理**
	- 头节点可能被修改 → 使用`ListNode*&`（指针引用）或二级指针
	- 空链表判断：`if (head == nullptr)`

2. **边界条件检查**
	- 插入/删除头节点
	- 操作空链表
	- 处理尾节点（`next`指向`nullptr`）

3. **内存管理要点**
	- 每次`new`后必须对应`delete`
	- 删除节点时需先保存下一节点指针

4. **哨兵节点技巧（简化操作）**

```cpp
ListNode* dummy = new ListNode(0);
dummy->next = head;
// ...执行操作...
head = dummy->next;
delete dummy;
```

---

### **五、链表 vs 数组**

| 特性 | 数组 | 链表 |
|---|---|---|
| 内存连续性 | 连续 | 非连续 |
| 访问方式 | O(1)随机访问 | O(n)顺序访问 |
| 插入/删除成本 | O(n)需要移动元素 | O(1)修改指针 |
| 扩容 | 需重新分配内存 | 动态增加节点 |
| 头部插入 | O(n) | O(1) |
| 局部性原理 | 优 | 差 |

---

### **六、LeetCode 练习**

#### 1. 删除链表中的节点（LeetCode 237）

**问题本质**：在只给定被删除节点（非尾节点）的情况下，实现节点删除

```cpp
void deleteNode(struct ListNode* node) {
    node->val = node->next->val;
    node->next = node->next->next;
}
```

**要点**：
- 无法访问前驱节点，因此采用"值替换+跳过"策略
- 时间复杂度 O(1)，空间复杂度 O(1)
- 特例处理：不能删除尾节点（题目保证）

#### 2. 反转链表（LeetCode 206）

**迭代法**：

![反转链表图解](./remote-01.png)

```cpp
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode *cur = head, *pre = nullptr;
        while(cur != nullptr) {
            ListNode* tmp = cur->next;
            cur->next = pre;
            pre = cur;
            cur = tmp;
        }
        return pre;
    }
};
```

**递归法**：

```cpp
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        return recur(head, nullptr);
    }
private:
    ListNode* recur(ListNode* cur, ListNode* pre) {
        if (cur == nullptr) return pre;
        ListNode* res = recur(cur->next, cur);
        cur->next = pre;
        return res;
    }
};
```

| 方法 | 时间复杂度 | 空间复杂度 | 适用场景 |
|---|---|---|---|
| 迭代法 | O(n) | O(1) | 内存敏感场景 |
| 递归法 | O(n) | O(n) | 代码简洁要求场景 |

#### 3. 设计链表（LeetCode 707）

**双向链表实现框架**：

```cpp
typedef struct MyLinkedListNode {
    int val;
    struct MyLinkedListNode *prev;
    struct MyLinkedListNode *next;
} Node;

typedef struct {
    Node *head;
    Node *tail;
    int size;
} MyLinkedList;
```

**设计原则**：
- 虚拟头尾节点：统一处理边界情况
- size维护：避免多余遍历
- 指针安全：每次操作前检查NULL

#### 4. 扁平化多级双向链表（LeetCode 430）

**DFS 解法**：

![扁平化图解](./part3-remote-02.png)

```plaintext
原始结构：
 1---2---3---4---5---6--NULL
         |
         7---8---9---10--NULL
             |
             11--12--NULL

扁平化后：
1-2-3-7-8-11-12-9-10-4-5-6-NULL
```

```cpp
class Solution {
private:
    Node* dfs(Node* node) {
        Node* cur = node;
        Node* last = nullptr;

        while (cur) {
            Node* next = cur->next;

            if (cur->child) {
                Node* child_last = dfs(cur->child);
                next = cur->next;

                cur->next = cur->child;
                cur->child->prev = cur;

                if (next) {
                    child_last->next = next;
                    next->prev = child_last;
                }

                cur->child = nullptr;
                last = child_last;
            } else {
                last = cur;
            }

            cur = next;
        }

        return last;
    }

public:
    Node* flatten(Node* head) {
        dfs(head);
        return head;
    }
};
```

**关键点**：
- 深度优先处理嵌套结构
- 三步操作：保存next → 处理child → 重新连接
- 时间复杂度 O(n)，空间复杂度 O(深度)
