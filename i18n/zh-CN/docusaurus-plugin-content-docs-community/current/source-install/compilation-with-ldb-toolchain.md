---
title: 使用 LDB Toolchain 编译 Apache Doris
language: zh-CN
description: 使用 LDB Toolchain 在 Linux 上编译 Apache Doris，详细的工具链安装与构建步骤。
keywords:
    - LDB Toolchain
    - Apache Doris
    - 源码编译
    - Linux 编译
    - 预编译三方库
    - AVX2
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 首次编译 / 没有 Docker 环境 -->

本文介绍如何使用 LDB Toolchain 在 Linux 上编译 Apache Doris。该方式是 [Docker 镜像编译](./compilation-with-docker) 的补充，适合没有 Docker 环境的开发者。

:::tip
LDB Toolchain 全称 **Linux Distribution Based Toolchain Generator**，提供独立、可移植的现代 C++ 编译工具链，可在几乎所有 Linux 发行版上编译现代 C++ 项目。
:::

感谢 [Amos Bird](https://github.com/amosbird) 的贡献。

## 版本对照

<!-- 知识类型: 配置参数 -->

| Doris 版本 | 推荐 LDB Toolchain 版本 | 包含编译器 |
| ---------- | ----------------------- | ---------- |
| master | 0.25 | clang-20, gcc-15 |
| 3.1 / 3.0 / 2.1 | 0.19 | clang-17, gcc-13 |

## 适用人群与优缺点

| 维度 | 说明 |
| ---- | ---- |
| 适用人群 | 没有 Docker 环境、希望直接在物理机或虚拟机上编译的开发者 |
| 优点 | 不依赖 Docker；工具链独立，避免污染系统编译器 |
| 缺点 | 需要手动安装 Java、Maven、Node 以及系统级依赖 |

## 1. 准备编译环境

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 首次编译 -->

适用于绝大多数 Linux 发行版（CentOS、Ubuntu 等）。

### 1.1 下载 `ldb_toolchain_gen.sh`

从 [ldb_toolchain_gen Releases](https://github.com/amosbird/ldb_toolchain_gen/releases) 下载对应版本：

- x86_64 架构：下载 `ldb_toolchain_gen.sh`
- ARM 架构：下载 `ldb_toolchain_gen.aarch64.sh`

:::tip
项目主页：<https://github.com/amosbird/ldb_toolchain_gen>
:::

### 1.2 生成 LDB Toolchain

执行脚本生成工具链：

```bash
sh ldb_toolchain_gen.sh /path/to/ldb_toolchain/
```

其中 `/path/to/ldb_toolchain/` 为目标安装目录。执行成功后，该目录下会生成如下结构：

```text
├── bin
├── include
├── lib
├── share
├── test
└── usr
```

### 1.3 安装其他编译组件

| 组件 | 推荐版本 | 下载地址 |
| ---- | -------- | -------- |
| JDK 8 | 1.8.0_391 | [jdk-8u391-linux-x64.tar.gz](https://doris-thirdparty-1308700295.cos.ap-beijing.myqcloud.com/tools/jdk-8u391-linux-x64.tar.gz) |
| JDK 17 | 17.0.10 | [jdk-17.0.10_linux-x64](https://download.oracle.com/java/17/archive/jdk-17.0.10_linux-x64_bin.tar.gz) |
| Maven | 3.9.9 | [apache-maven-3.9.9-bin.tar.gz](https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.tar.gz) |
| Node | v12.13.0 | [node-v12.13.0-linux-x64.tar.gz](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/node-v12.13.0-linux-x64.tar.gz) |

JDK 版本选择规则：

- 编译 Doris 2.1（含）之前版本：使用 JDK 8
- 编译 Doris 3.0（含）之后版本或 master 分支：使用 JDK 17
- 也可以直接通过 Linux 发行版的包管理工具（`yum`、`apt` 等）安装 OpenJDK 8 或 17

不同 Linux 发行版默认包含的系统组件不同，可能需要额外安装一些工具。以 CentOS 6 为例：

```bash
# 安装系统依赖
sudo yum install -y byacc patch automake libtool make which file ncurses-devel gettext-devel unzip bzip2 zip util-linux wget git python2

# 安装 autoconf-2.69
wget http://ftp.gnu.org/gnu/autoconf/autoconf-2.69.tar.gz && \
    tar zxf autoconf-2.69.tar.gz && \
    cd autoconf-2.69 && \
    ./configure && \
    make && \
    make install

# 安装 bison-3.8.2
wget http://ftp.gnu.org/gnu/bison/bison-3.8.2.tar.gz && \
    tar xzf bison-3.8.2.tar.gz && \
    cd bison-3.8.2 && \
    ./configure && \
    make && \
    make install
```

### 1.4 下载 Doris 源码并配置环境变量

```bash
git clone https://github.com/apache/doris.git
```

进入源码目录，创建 `custom_env.sh` 写入环境变量：

```bash
export JAVA_HOME=/path/to/java/
export PATH=$JAVA_HOME/bin:$PATH
export PATH=/path/to/maven/bin:$PATH
export PATH=/path/to/node/bin:$PATH
export PATH=/path/to/ldb_toolchain/bin:$PATH
```

## 2. 编译 Doris

<!-- 知识类型: 操作步骤 -->

:::tip
`build.sh` 默认会先编译三方库。如果想跳过三方库编译，请参考 [3. 使用预编译三方库加速](#3-使用预编译三方库加速)。
:::

### 2.1 检查是否支持 AVX2

```bash
cat /proc/cpuinfo | grep avx2
```

输出非空表示 CPU 支持 AVX2。

### 2.2 执行编译

```bash
# 默认编译支持 AVX2 的产物
sh build.sh

# CPU 不支持 AVX2 时需附加 USE_AVX2=0
USE_AVX2=0 sh build.sh

# 编译 Debug 版本 BE
BUILD_TYPE=Debug sh build.sh
```

脚本会按顺序编译三方库 → FE → BE → MS，产物输出到 `output/` 目录。MS 模块用于存算分离模式，详情参考相关文档。

## 3. 使用预编译三方库加速

<!-- 适用场景: 加速编译 / 网络受限 -->

`build.sh` 默认会从源码编译三方库（耗时较长）。也可以直接下载社区预编译版本：

```text
https://github.com/apache/doris-thirdparty/releases
```

社区提供 Linux、macOS 和 ARM 三种预编译产物。下载并解压后会得到 `installed/` 目录，将其拷贝到 Doris 源码的 `thirdparty/` 目录下，再运行 `build.sh` 即可跳过三方库编译。

## FAQ

### Q1: 如何选择 LDB Toolchain 版本？

按表格选择：master 分支使用 0.25，3.1/3.0/2.1 分支使用 0.19。版本不匹配可能导致 ABI 不一致而链接失败。

### Q2: `cat /proc/cpuinfo | grep avx2` 没有输出怎么办？

说明 CPU 不支持 AVX2，编译时需要加 `USE_AVX2=0`，并改用 `-no-avx2` 系列预编译三方库或编译镜像。

### Q3: 编译时遇到 `Too many open files` 怎么办？

通过 `ulimit -n 65536` 提高文件句柄上限，或写入 `/etc/security/limits.conf` 永久生效。

### Q4: ARM 架构下编译需要注意什么？

下载 `ldb_toolchain_gen.aarch64.sh`，并参考 [ARM 平台编译](./compilation-arm) 关闭 AVX2、libunwind、Azure 等不兼容的三方库。

## 相关文档

- [使用 Docker 镜像编译](./compilation-with-docker)
- [Linux 平台直接编译](./compilation-linux)
- [ARM 平台编译](./compilation-arm)
