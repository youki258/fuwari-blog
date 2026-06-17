---
title: "Maven 项目构建与依赖管理笔记"
published: 2025-05-01
updated: 2025-05-01
description: "整理 Maven 的项目结构、坐标、依赖配置、仓库模型和构建生命周期。"
tags: ["Maven","Java","后端","构建工具"]
category: "Java 全栈"
draft: false
---

这篇笔记记录 Maven 的基础使用方式，重点是理解 Maven 如何统一 Java 项目的结构、依赖和构建流程。后续精修时，可以把命令示例和 POM 配置拆成更清晰的实践小节。

## 本文要点

- Maven 用来管理 Java 项目的依赖、构建流程和标准目录结构。
- POM 是 Maven 项目的核心描述文件，坐标由 `groupId`、`artifactId`、`version` 组成。
- Maven 仓库分为本地仓库、中央仓库和远程私服。
- 生命周期命令可以串联完成编译、测试、打包和发布。

### 1. maven介绍

#### 1. 介绍
Maven 是一款用于管理和构建Java项目的工具，是Apache旗下的一个开源项目。

#### 2. 作用
1. 管理项目依赖：方便快捷的管理项目依赖的资源(jar包)，避免版本冲突问题。
2. 管理项目构建：通过Maven中的命令，就可以很方便的完成项目的编译(compile)、测试(test)、打包(package)、发布(deploy) 等操作。 
而且这些操作都是跨平台的，也就是说无论你是Windows系统，还是Linux系统，还是Mac系统，这些命令都是支持的。
3. Maven 还提供了标准、统一的项目结构。

### 2. Maven概述
#### 1. Maven的作用： 
   1. 方便的依赖管理
   2. 统一的项目结构
   3. 标准的项目构建流程

#### 2. Maven模型



- 项目对象模型 (Project Object Model)

- 依赖管理模型(Dependency)

- 构建生命周期/阶段(Build lifecycle & phases)

	


#### 3. Maven仓库
仓库：用于存储资源，管理各种jar包
仓库的本质就是一个目录(文件夹)，这个目录被用来存储开发中所有依赖(就是jar包)和插件

Maven仓库分为：
- 本地仓库：自己计算机上的一个目录(用来存储jar包)
- 中央仓库：由Maven团队维护的全球唯一的。仓库地址：https://repo1.maven.org/maven2/
- 远程仓库(私服)：一般由公司团队搭建的私有仓库
### 3. IDEA集成Maven
**Maven项目的目录结构:**
Maven项目的目录结构:
```
maven-project01

        |---  src  (源代码目录和测试代码目录)
               |---  main (源代码目录)
                        |--- java (源代码java文件目录)
                        |--- resources (源代码配置文件目录)
              |---  test (测试代码目录)
                        |--- java (测试代码java目录)
                        |--- resources (测试代码配置文件目录)
        |--- target (编译、打包生成文件存放目录)
	
```

#### 3. pom文件详解
**POM (Project Object Model)：项目对象模型，用来描述当前的maven项目。**
pom文件详解：
```
- <project> ：pom文件的根标签，表示当前maven项目
- <modelVersion>：声明项目描述遵循哪一个POM模型版本
  - 虽然模型本身的版本很少改变，但它仍然是必不可少的。目前POM模型版本是4.0.0
- 坐标 ：
  - <groupId> <artifactId> <version>
  - 定位项目在本地仓库中的位置，由以上三个标签组成一个坐标
- <maven.compiler.source> ：编译JDK的版本
- <maven.compiler.target> ：运行JDK的版本
- <project.build.sourceEncoding> : 设置项目的字符集
```


#### 4.  Maven坐标

什么是坐标？

- Maven中的坐标是**资源的唯一标识** , 通过该坐标可以唯一定位资源位置
- 使用坐标来定义项目或引入项目中需要的依赖

Maven坐标主要组成：

- groupId：定义当前Maven项目隶属组织名称（通常是域名反写，例如：com.itheima）
- artifactId：定义当前Maven项目名称（通常是模块名称，例如 order-service、goods-service）
- version：定义当前项目版本号
	- SNAPSHOT: 功能不稳定、尚处于开发中的版本，即快照版本
	- RELEASE: 功能趋于稳定、当前更新停止，可以用于发行的版本



### 4. 依赖配置

#### 1. 基本配置

依赖：指当前项目运行所需要的jar包。一个项目中可以引入多个依赖：

例如：在当前工程中，我们需要用到logback来记录日志，此时就可以在maven工程的pom.xml文件中，引入logback的依赖。具体步骤如下：

1. 在pom.xml中编写`<dependencies>`标签
2. 在`<dependencies>`标签中使用`<dependency>`引入坐标
3. 定义坐标的 `groupId`、`artifactId`、`version`

### 5. 生命周期
#### 1. 介绍
- clean：清理工作。
- default：核心工作。如：编译、测试、打包、安装、部署等。
- site：生成报告、发布站点等。

---

每套生命周期包含一些阶段（phase），阶段是有顺序的，后面的阶段依赖于前面的阶段。
我们看到这三套生命周期，里面有很多很多的阶段，这么多生命周期阶段，其实我们常用的并不多，主要关注以下几个：
- clean：移除上一次构建生成的文件
- compile：编译项目源代码
- test：使用合适的单元测试框架运行测试(junit)
- package：将编译后的文件打包，如：jar、war等
- install：安装项目到本地仓库

>Maven的生命周期是抽象的，这意味着生命周期本身不做任何实际工作。在Maven的设计中，实际任务（如源代码编译）都交由插件来完成。
---
- 生命周期的顺序是：clean --> validate --> compile --> test --> package --> verify --> install --> site --> deploy
- 我们需要关注的就是：clean -->  compile --> test --> package  --> install
#### 2. 执行
在日常开发中，当我们要执行指定的生命周期时，有两种执行方式：
1. 在idea工具右侧的maven工具栏中，选择对应的生命周期，双击执行
2. 在DOS命令行中，通过maven命令执行
3.

## 小结

Maven 的核心价值是把 Java 项目的依赖、目录结构和构建步骤标准化。先理解 POM、坐标、仓库和生命周期，再记常用命令，会比单独背配置更容易串起来。
