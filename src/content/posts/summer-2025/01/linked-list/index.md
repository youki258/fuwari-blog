---
title: "链表"
published: 2026-04-08
updated: 2026-04-08
description: "一、链表概念 1. 与数组的区别 数组：连续内存空间，随机访问高效（O1），但插入/删除需移动元素（On） 链表：节点离散存储，通过指针连接（逻辑连续，物理非连"
tags: ["待整理"]
category: "学习记录"
draft: true
---

<!-- source: 25暑假/1/链表.md -->
### **一、链表概念**

1. **与数组的区别**
	- 数组：连续内存空间，随机访问高效（O(1)），但插入/删除需移动元素（O(n)）
	- 链表：**节点离散存储**，通过指针连接（逻辑连续，物理非连续）
	- **访问效率**：链表只能顺序访问（O(n)），但插入/删除只需修改指针（O(1)）
2. **节点结构（C++实现）**

```java
struct ListNode {
    int val;         // 存储数据
    ListNode* next;  // 指向下一节点的指针
    // 构造函数（C++特有）
    ListNode(int x) : val(x), next(nullptr) {} 
};
```
------
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

------

### **三、链表五大基础操作（C++实现）**

#### **1. 遍历链表**

```java
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

	```java
	void insertAtHead(ListNode*& head, int val) { //ListNode*&是指针的引用（C++特有）。允许函数内修改外部传入的指针（普通指针参数只能修改指针指向的内容，不能修改指针本身）
	    ListNode* newNode = new ListNode(val);
	    newNode->next = head;  // 新节点指向原头节点
	    head = newNode;        // 更新头指针
	}
	```

- **尾部插入**

	```java
	void insertAtTail(ListNode*& head, int val) {
	    ListNode* newNode = new ListNode(val);
	    if (head == nullptr) {
	        head = newNode;
	        return;
	    }//处理空链表
	    ListNode* cur = head;
	    while (cur->next != nullptr) { // 找到最后一个节点
	        cur = cur->next;
	    }
	    cur->next = newNode;
	}
	```

- **中间插入（在pos节点后插入）**

	```java
	void insertAfter(ListNode* pos, int val) {
	    if (pos == nullptr) return;
	    ListNode* newNode = new ListNode(val);
	    newNode->next = pos->next;  // 新节点指向原下一节点
	    pos->next = newNode;        // 当前节点指向新节点
	}
	```

#### **3. 删除节点**

```java
void deleteNode(ListNode*& head, int val) {
    if (head == nullptr) return;
    
    // 删除头节点
    if (head->val == val) {
        ListNode* temp = head;
        head = head->next;
        delete temp;
        return;
    }

    // 查找目标节点的前驱
    ListNode* cur = head;
    while (cur->next != nullptr && cur->next->val != val) {
        cur = cur->next;
    }

    // 找到目标节点
    if (cur->next != nullptr) {
        ListNode* temp = cur->next;
        cur->next = cur->next->next;  // 跳过待删除节点
        delete temp;  // 释放内存
    }
}
```

#### **4. 修改节点值**

```java
void updateNode(ListNode* head, int oldVal, int newVal) {
    ListNode* cur = head;
    while (cur != nullptr) {
        if (cur->val == oldVal) {
            cur->val = newVal;  // 直接修改值
            return;
        }
        cur = cur->next;
    }
}
```

#### **5. 查找节点**

```java
ListNode* searchNode(ListNode* head, int val) {
    ListNode* cur = head;
    while (cur != nullptr) {
        if (cur->val == val) {
            return cur;  // 返回节点指针
        }
        cur = cur->next;
    }
    return nullptr;  // 未找到
}
```

------

### **四、关键点 **

1. **头指针的特殊处理**

	- 头节点可能被修改 → 使用`ListNode*&`（指针引用）或二级指针
	- 空链表判断：`if (head == nullptr)`

2. **边界条件检查**

	- 插入/删除头节点
	- 操作空链表
	- 处理尾节点（`next`指向`nullptr`）

3. **内存管理要点**

	- 每次`new`后必须对应`delete`

	- 删除节点时需先保存下一节点指针：

		```java
		ListNode* temp = cur->next;
		cur->next = temp->next;  // 重新链接
		delete temp;             // 再释放
		```

4. **哨兵节点技巧（简化操作）**

```java
ListNode* dummy = new ListNode(0); // 创建虚拟头节点
dummy->next = head;
// ...执行操作（无需特殊处理头节点）...
head = dummy->next; // 更新真实头节点
delete dummy;       // 删除哨兵
```

------

### **五、链表进阶知识**

1. **双向链表**

```java
struct DoublyListNode {
    int val;
    DoublyListNode *prev, *next;
    DoublyListNode(int x) : val(x), prev(nullptr), next(nullptr) {}
};
```

- 优势：可双向遍历，删除操作更高效
- 劣势：内存占用增加，维护指针更复杂

1. **链表VS数组应用场景**

	| **操作**   | 数组 | 链表 | 胜出方 |
	| ---------- | ---- | ---- | ------ |
	| 随机访问   | O(1) | O(n) | 数组   |
	| 头部插入   | O(n) | O(1) | 链表   |
	| 中间插入   | O(n) | O(1) | 链表   |
	| 局部性原理 | 优   | 差   | 数组   |
