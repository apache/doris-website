---
title: 使用 Docker 镜像编译 Apache Doris
language: zh-CN
description: 使用官方 Docker 镜像编译 Apache Doris 源码，无需手动配置 thirdparty 与 toolchain。
keywords:
    - Docker 编译
    - Apache Doris
    - 源码编译
    - build-env
    - AVX2
    - JDK 8
    - JDK 17
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
<!-- 适用场景: 首次编译 / 环境验收 -->

本文介绍如何使用 Apache Doris 官方编译镜像编译 Doris 源码。该镜像由社区维护并随依赖及时更新，免去手动安装 toolchain 与三方库的过程，是**最推荐**的编译方式。

:::tip
目前 Docker 镜像方式还不支持存算分离模式的编译部署。
:::

## 适用人群与优缺点

| 维度 | 说明 |
| ---- | ---- |
| 适用人群 | 希望快速搭建编译环境、不想手动配置依赖的开发者 |
| 优点 | 镜像已预装 thirdparty、toolchain、JDK，开箱即用 |
| 缺点 | 需要本地有可用的 Docker 环境，镜像体积较大（约 3.3 GB） |

如果机器上没有 Docker 环境，可改用 [LDB Toolchain 编译](./compilation-with-ldb-toolchain)。

## 1. 安装 Docker

在 CentOS 上可直接通过包管理器安装：

```bash
yum install docker
```

其他发行版请参考 [Docker 官方安装文档](https://docs.docker.com/engine/install/)。

## 2. 选择并下载构建镜像

<!-- 知识类型: 配置参数 -->

不同 Doris 版本对应不同的构建镜像。`apache/doris:build-env-ldb-toolchain-latest` 用于编译 master 主干代码，会随主干持续更新。

| 镜像 Tag | 适用 Doris 版本 | 备注 |
| -------- | --------------- | ---- |
| `apache/doris:build-env-for-2.0` | 2.0.x | 支持 AVX2 指令集 |
| `apache/doris:build-env-for-2.0-no-avx2` | 2.0.x | 兼容不支持 AVX2 的 CPU |
| `apache/doris:build-env-for-2.1` | 2.1.x | 支持 AVX2 指令集 |
| `apache/doris:build-env-for-2.1-no-avx2` | 2.1.x | 兼容不支持 AVX2 的 CPU |
| `apache/doris:build-env-for-3.0` | 3.0.x | 支持 AVX2 指令集 |
| `apache/doris:build-env-for-3.0-no-avx2` | 3.0.x | 兼容不支持 AVX2 的 CPU |
| `apache/doris:build-env-for-3.1` | 3.1.x | 支持 AVX2 指令集 |
| `apache/doris:build-env-for-3.1-no-avx2` | 3.1.x | 兼容不支持 AVX2 的 CPU |
| `apache/doris:build-env-ldb-toolchain-latest` | master | 跟随主干更新 |
| `apache/doris:build-env-ldb-toolchain-no-avx2-latest` | master | 兼容不支持 AVX2 的 CPU |

以编译 Doris 2.0 为例，下载并检查镜像：

```bash
# 也可以使用 docker.io/apache/doris:build-env-for-2.0
docker pull apache/doris:build-env-for-2.0

# 确认镜像下载成功
docker images
# REPOSITORY      TAG                  IMAGE ID        CREATED       SIZE
# apache/doris    build-env-for-2.0    f29cf1979dba    3 days ago    3.3GB
```

### 镜像选择注意事项

- 镜像 Tag 与 Doris 版本一一对应，请按目标分支选择，避免跨版本编译。
- `no-avx2` 镜像中的第三方库可运行在不支持 AVX2 的 CPU 上，需配合 `USE_AVX2=0` 选项编译。
- 镜像变更历史可参考 [thirdparty CHANGELOG](https://github.com/apache/doris/blob/master/thirdparty/CHANGELOG.md)。
- 最新的 `apache/doris:build-env-ldb-toolchain-latest`（目前仅支持 x86_64 架构）同时包含 JDK 8 与 JDK 17：2.1（含）之前版本请使用 JDK 8，3.0（含）之后版本或 master 分支请使用 JDK 17。
- ARM64 架构下使用 Docker 编译时，需先下载支持 ARM64 的 Linux 基础镜像（如 `apache/doris:base-latest`，对应 Ubuntu 22.04.5 LTS），再参考 [Linux 直接编译](./compilation-linux) 和 [ARM 平台编译](./compilation-arm) 文档安装依赖后编译。

容器内可通过环境变量切换 JDK：

```bash
# 切换到 JDK 8
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
export PATH=$JAVA_HOME/bin/:$PATH

# 切换到 JDK 17
export JAVA_HOME=/usr/lib/jvm/jdk-17.0.2/
export PATH=$JAVA_HOME/bin/:$PATH
```

## 3. 编译 Doris

<!-- 知识类型: 操作步骤 -->

### 3.1 下载 Doris 源码

在宿主机上获取目标分支代码（以 branch-2.0 为例）：

```bash
git clone -b branch-2.0 https://github.com/apache/doris.git
```

假设源码目录为 `~/doris-branch-2.0`。

### 3.2 启动构建容器

```bash
# 提前在宿主机准备 maven 的 .m2 目录，便于多次构建复用 Java 依赖
mkdir ~/.m2

# 挂载源码与 .m2 目录，启动构建镜像
docker run -it --network=host \
    --name mydocker \
    -v ~/.m2:/root/.m2 \
    -v ~/doris-branch-2.0:/root/doris-branch-2.0/ \
    apache/doris:build-env-for-2.0

# 命令执行成功后将自动进入容器
```

`docker run` 关键参数说明：

| 参数 | 作用 |
| ---- | ---- |
| `-v` | 将宿主机目录挂载到容器，用于持久化源码与依赖 |
| `--name` | 指定容器名称，便于后续管理 |
| `--network` | 容器网络模式。`host` 表示与宿主机共享网络栈，无需端口映射 |

建议：

- 始终挂载 Doris 源码目录，保证编译产物保留在宿主机，容器退出后不丢失。
- 挂载 `.m2` 目录，避免每次启动容器都重新下载 Maven 依赖。
- 容器内下载三方库需要访问外网，推荐使用 `--network=host` 模式。

### 3.3 执行构建

容器内进入源码目录后运行：

```bash
# 默认编译支持 AVX2 的产物
sh build.sh

# CPU 不支持 AVX2 时需附加 USE_AVX2=0
USE_AVX2=0 sh build.sh

# 编译 Debug 版本 BE
BUILD_TYPE=Debug sh build.sh
```

编译完成后，产物位于源码目录下的 `output/`。

:::tip
**如何检查机器是否支持 AVX2 指令集？**

```bash
cat /proc/cpuinfo | grep avx2
```

输出非空即代表支持 AVX2。
:::

## 4. 自行构建开发镜像

如需自定义基础镜像（例如更换基础发行版、增加调试工具），请参考源码中的 `docker/README.md`。

## FAQ

### Q1: 镜像版本和 Doris 版本不匹配会怎样？

镜像中的 thirdparty 与 toolchain 与 Doris 源码强耦合。跨版本组合很可能在编译阶段抛出 `undefined reference`、`incompatible library` 等链接错误，请严格按表格选择。

### Q2: 编译时报 `AVX2 not supported`？

宿主机或目标运行机 CPU 不支持 AVX2 指令集。改用带 `no-avx2` 后缀的镜像，并在 build 时设置 `USE_AVX2=0`。

### Q3: `docker pull` 拉取镜像太慢？

可配置 Docker 镜像加速器，或使用 `docker.io/apache/doris:...` 完整路径。

### Q4: 容器内 Java 库下载失败？

确认容器启动时使用了 `--network=host`，并将 `~/.m2` 目录挂载到容器，避免代理或网络隔离导致 Maven 中央仓库不可达。

## 相关文档

- [使用 LDB Toolchain 编译](./compilation-with-ldb-toolchain)
- [Linux 平台直接编译](./compilation-linux)
- [ARM 平台编译](./compilation-arm)
