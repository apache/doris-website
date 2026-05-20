---
title: Linux 平台直接编译 Apache Doris
language: zh-CN
description: 在 Linux 上直接编译 Apache Doris：JDK、依赖、AVX2 指令集检查与构建命令。
keywords:
    - Linux 编译
    - Apache Doris
    - 源码编译
    - Ubuntu
    - JDK 17
    - AVX2
    - build.sh
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
<!-- 适用场景: 首次编译 / 直接在物理机上编译 -->

本文介绍如何在 Linux（以 Ubuntu 24.04 及以上为例）系统上直接编译 Apache Doris，不借助 Docker 镜像或 LDB Toolchain。

## 适用人群与优缺点

| 维度 | 说明 |
| ---- | ---- |
| 适用人群 | 使用较新发行版（如 Ubuntu 24.04+）、希望使用系统自带 GCC 的开发者 |
| 优点 | 步骤最少，直接使用系统包管理器安装依赖 |
| 缺点 | 老旧发行版可能因 GCC 或 glibc 版本过旧无法编译，建议改用 [LDB Toolchain](./compilation-with-ldb-toolchain) |

## 环境要求

<!-- 知识类型: 硬件要求 -->

| 组件 | 版本要求 |
| ---- | -------- |
| 操作系统 | Ubuntu 24.04+（或同等版本的其他发行版） |
| JDK | 8+（2.1 及以下版本）；17（3.0 及以上版本或 master 分支） |
| GCC | 10+ |
| Python | 2.7+ |
| Apache Maven | 3.5+ |
| CMake | 3.19.2+ |
| Bison | 3.0+ |

## 1. 安装 JDK

<!-- 知识类型: 操作步骤 -->

根据目标 Doris 版本选择 JDK：

```bash
# 编译 Doris 2.1 及以下版本，可安装 JDK 8
sudo apt install openjdk-8-jdk

# 编译 Doris 3.0 及以上版本或 master 分支，需要安装 JDK 17
sudo apt install openjdk-17-jdk
```

## 2. 安装系统依赖

```bash
sudo apt install build-essential maven cmake byacc flex automake libtool-bin bison binutils-dev libiberty-dev zip unzip libncurses5-dev curl git ninja-build python
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
sudo apt update
sudo apt install gcc-10 g++-10
sudo apt-get install autoconf automake libtool autopoint
```

## 3. 检查是否支持 AVX2 指令集

```bash
cat /proc/cpuinfo | grep avx2
```

输出非空表示 CPU 支持 AVX2，可使用默认编译选项；否则需在编译时附加 `USE_AVX2=0`。

## 4. 执行编译

```bash
# 默认编译支持 AVX2 的产物
sh build.sh

# CPU 不支持 AVX2 时需附加 USE_AVX2=0
USE_AVX2=0 sh build.sh

# 编译 Debug 版本 BE
BUILD_TYPE=Debug sh build.sh
```

## 5. 查看产物

编译完成后，产出文件位于源码根目录的 `output/`。

## FAQ

### Q1: 老版本 Ubuntu/CentOS 是否可以直接编译？

老旧发行版的 GCC 与 glibc 版本通常过低，建议使用 [LDB Toolchain](./compilation-with-ldb-toolchain) 或 [Docker 镜像](./compilation-with-docker)。

### Q2: 编译时报 `AVX2 not supported`？

CPU 不支持 AVX2 指令集。重新运行 `USE_AVX2=0 sh build.sh`，并下载 `no-avx2` 系列预编译三方库。

### Q3: 编译过程中遇到 `Too many open files`？

通过 `ulimit -n 65536` 提高单进程文件句柄上限，或在 `/etc/security/limits.conf` 中永久配置。

### Q4: 编译中途因内存不足被 kill？

提示 `ninja failed with: signal: killed` 通常是 OOM。改用至少 16 GB 内存的机器，或降低并发度（`-j` 参数）。

## 相关文档

- [使用 LDB Toolchain 编译](./compilation-with-ldb-toolchain)
- [使用 Docker 镜像编译](./compilation-with-docker)
- [ARM 平台编译](./compilation-arm)
