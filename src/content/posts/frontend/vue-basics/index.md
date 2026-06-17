---
title: "Vue 基础语法与数据驱动视图笔记"
published: 2025-05-12
updated: 2025-05-12
description: "整理 Vue 渐进式框架概念、数据驱动视图、插值表达式、常用指令和生命周期。"
tags: ["Vue","前端","JavaScript","数据驱动"]
category: "前端"
draft: false
---

这篇笔记整理 Vue 入门阶段的核心概念：渐进式框架、数据驱动视图、插值表达式和常用指令。

## 本文要点

- Vue 是用于构建用户界面的渐进式 JavaScript 框架。
- Vue 应用通过数据驱动视图，模板中可以使用插值表达式。
- 常用指令包括 `v-for`、`v-bind`、`v-if`、`v-show`、`v-model` 和 `v-on`。
- 生命周期有助于理解组件从创建到挂载、更新、销毁的过程。

### vue
#### 介绍
vue是一款用于**构建用户界面**的**渐进式**的JavaScript**框架**。[官方网站](https://cn.vuejs.org/)。
>1. **构建用户界面**
基于数据渲染出用户看到的界面，也就是所谓的 *构建用户界面*。
>2. **渐进式**
所谓*渐进*，指的是我们使用Vue框架呢，我们不需要把所有的组件、语法全部学习完毕才可以使用Vue。 而是，我们学习一点就可以使用一点了。
>3. **框架**
- 框架：就是一套完整的项目解决方案，用于快速构建项目 。这是我们接触的第一个框架，那在我们后面的学习中，我们还会学习很多的java语言中的框架，那通过这些框架呢，就可以来快速开发java项目，提高开发效率。
- 优点：大大提升前端项目的开发效率 。
- 缺点：需要理解记忆框架的使用规则 。（参照官网）

#### 程序
##### 1. 准备工作：

- 准备元素（div），交给 Vue 控制
##### 2. 数据驱动视图：

- 准备数据。 在创建Vue应用实例的时候，传入了一个js对象，在这个js对象中，我们要定义一个data方法，这个data方法的返回值就是Vue中的数据。
- 通过插值表达式渲染页面。 插值表达式的写法：{{...}}
3. 实现
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue-快速入门</title>
</head>
<body>
  <div id="app">
    {{message}}
  </div>

  <script type="module">
    import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
    createApp({
      data(){
        return {
          message: 'Hello Vue'
        }
      }
    }).mount('#app')
  </script>
</body>
</html>
```
在上述入门程序编写时，需要注意这么几点：
- Vue中定义数据，必须通过data方法来定义，data方法返回值是一个对象，在这个对象中定义数据。
- 插值表达式中编写的变量，一定是Vue中定义的数据，如果插值表达式中编写了一个变量，但是在Vue中未定义，将会报错 。
- Vue应用实例接管的区域是 `#app`，超出这个范围，就不受 Vue 控制了，所以 Vue 的插值表达式应写在 `<div id="app">...</div>` 里面。

#### vue指令
##### 1. **v-for**
作用：列表渲染，遍历容器的元素或者对象的属性
语法：`<tr v-for="(item,index) in items" :key="item.id">{{ item }}</tr>`
参数：
- items 为遍历的数组
- item 为遍历出来的元素
- index 为索引/下标，从0开始 ；可以省略，省略index语法： v-for = "item in items"
key：
- 作用：给元素添加的唯一标识，便于vue进行列表项的正确排序复用，提升渲染性能
- 推荐使用id作为key（唯一），不推荐使用index作为key（会变化，不对应）
**注意：遍历的数组，必须在data中定义； 要想让哪个标签循环展示多次，就在哪个标签上使用 v-for 指令。**
##### 2. **v-bind**
作用：动态为HTML标签绑定属性值，如设置href，src，style样式等。
语法：`v-bind:属性名="属性值"`，例如 `<img v-bind:src="item.image" width="30px">`
简化：`:属性名="属性值"`，例如 `<img :src="item.image" width="30px">`
**注意：v-bind 所绑定的数据，必须在data中定义/或基于data中定义的数据而来。**
##### 3. **v-if & v-show**
作用：这两类指令，都是用来控制元素的显示与隐藏的
v-if：
- 语法：v-if="表达式"，表达式值为 true，显示；false，隐藏
- 原理：基于条件判断，来控制创建或移除元素节点（条件渲染）
- 场景：要么显示，要么不显示，不频繁切换的场景
- 其它：可以配合 v-else-if / v-else 进行链式调用条件判断
示例：
```html
   <!-- 基于v-if/v-else-if/v-else指令来展示职位这一列 -->
  <td>
    <span v-if="emp.job === '1'">班主任</span>
    <span v-else-if="emp.job === '2'">讲师</span>
    <span v-else-if="emp.job === '3'">学工主管</span>
    <span v-else-if="emp.job === '4'">教研主管</span>
    <span v-else-if="emp.job === '5'">咨询师</span>
    <span v-else>其他</span>
  </td>
```
##### 4.**v-show**
- 语法：v-show="表达式"，表达式值为 true，显示；false，隐藏
- 原理：基于CSS样式display来控制显示与隐藏
- 场景：频繁切换显示隐藏的场景
##### 5. v-model
- 作用：在表单元素上使用，双向数据绑定。可以方便的 获取 或 设置 表单项数据 
- 语法：v-model="变量名"
- 这里的双向数据绑定，是指 Vue中的数据变化，会影响视图中的数据展示 。 视图中的输入的数据变化，也会影响Vue的数据模型 。
##### 6. v-on
作用：为html标签绑定事件（添加事件监听）
语法：
- v-on:事件名="方法名" 
- 简写为 @事件名="…" 
- `<input type="button" value="点我一下试试" v-on:click="handle">`
- `<input type="button" value="点我一下试试" @click="handle">`

这里的handle函数，就需要在Vue应用实例创建的时候创建出来，在methods定义。
### Ajax
#### 介绍
Ajax: 全称Asynchronous JavaScript And XML，异步的JavaScript和XML。其作用有如下2点：
- 与服务器进行数据交换：通过Ajax可以给服务器发送请求，并获取服务器响应的数据。
- 异步交互：可以在不重新加载整个页面的情况下，与服务器交换数据并更新部分网页的技术，如：搜索联想、用户名是否可用的校验等等。

#### Axios
Axios是对原生的AJAX进行封装，简化书写。
##### async、await
如果使用axios中提供的.then(function(){....}).catch(function(){....})，这种回调函数的写法，会使得代码的可读性和维护性变差。 而为了解决这个问题，我们可以使用两个关键字，分别是：async、await。
可以通过async、await可以让异步变为同步操作。async就是来声明一个异步方法，await是用来等待异步任务执行。 

代码修改前：
```javascript
search() {
    //基于axios发送异步请求，请求https://web-server.itheima.net/emps/list，根据条件查询员工列表
    axios.get(`https://web-server.itheima.net/emps/list?name=${this.searchForm.name}&gender=${this.searchForm.gender}&job=${this.searchForm.job}`).then(res => {
      this.empList = res.data.data
    })
  },
```
代码修改后：
```javascript
  async search() {
    //基于axios发送异步请求，请求https://web-server.itheima.net/emps/list，根据条件查询员工列表
    const result = await axios.get(`https://web-server.itheima.net/emps/list?name=${this.searchForm.name}&gender=${this.searchForm.gender}&job=${this.searchForm.job}`);
    this.empList = result.data.data;
  },
```
  修改后，代码就变成同步操作了，一行一行的从前往后执行。 在前端项目开发中，经常使用这两个关键字配合，使得代码的可读性和可维护性变高。

### 6. Vue生命周期
vue的生命周期：指的是vue对象从创建到销毁的过程。
vue的生命周期包含8个阶段：每触发一个生命周期事件，会自动执行一个生命周期方法，这些生命周期方法也被称为钩子方法。
**其中我们需要重点关注的是mounted，其他的我们了解即可。**
> mounted：挂载完成，Vue初始化成功，HTML页面渲染成功。以后我们一般用于页面初始化自动的ajax请求后台数据

## 小结

Vue 入门可以先围绕“数据如何驱动页面变化”来理解。插值表达式、指令、事件绑定和生命周期是后续学习组件化开发的基础。
