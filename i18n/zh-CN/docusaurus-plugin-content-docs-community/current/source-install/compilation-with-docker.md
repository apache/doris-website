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

以下命令在宿主机上执行。示例编译 `master`；编译发布分支时，请根据上表同时修改分支和镜像。后续宿主机命令在同一个 shell 中执行，以复用这些变量。ARM64 与 JDK 的额外说明见[镜像选择注意事项](#镜像选择注意事项)。

```bash
DORIS_BRANCH=master
DORIS_BUILD_IMAGE=apache/doris:build-env-ldb-toolchain-latest
DORIS_SOURCE_DIR="$PWD/doris"

docker pull "$DORIS_BUILD_IMAGE"
```

## 3. 编译 Doris

<!-- 知识类型: 操作步骤 -->

### 3.1 下载 Doris 源码

在宿主机上，将所选分支克隆到上一步设置的目录：

```bash
git clone --branch "$DORIS_BRANCH" https://github.com/apache/doris.git "$DORIS_SOURCE_DIR"
```

### 3.2 启动构建容器

```bash
mkdir -p "$HOME/.m2"

docker run -it --network=host \
    --name doris-build \
    -v "$HOME/.m2:/root/.m2" \
    -v "$DORIS_SOURCE_DIR:/root/doris" \
    --workdir /root/doris \
    "$DORIS_BUILD_IMAGE"
```

容器启动后会自动进入 Bash，工作目录为挂载的源码目录 `/root/doris`。

`docker run` 关键参数说明：

| 参数 | 作用 |
| ---- | ---- |
| `-v` | 将宿主机目录挂载到容器，用于持久化源码与依赖 |
| `--name` | 指定容器名称，便于后续管理 |
| `--workdir` | 指定容器中的工作目录，直接进入挂载的源码目录 |
| `--network` | 容器网络模式。`host` 表示与宿主机共享网络栈，无需端口映射 |

建议：

- 始终挂载 Doris 源码目录，保证编译产物保留在宿主机，容器退出后不丢失。
- 挂载 `.m2` 目录，避免每次启动容器都重新下载 Maven 依赖。
- 容器内下载三方库需要访问外网，推荐使用 `--network=host` 模式。

### 3.3 执行构建

在容器内执行默认构建：

```bash
bash build.sh
```

编译完成后，产物位于源码目录下的 `output/`。

:::tip
**如何检查机器是否支持 AVX2 指令集？**

```bash
cat /proc/cpuinfo | grep avx2
```

输出非空即代表支持 AVX2。
:::

### 其他构建选项

按需选择以下命令替代默认构建命令：

```bash
# CPU 不支持 AVX2 时使用
USE_AVX2=0 bash build.sh

# 编译 Debug 版本 BE
BUILD_TYPE=Debug bash build.sh
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

### Q5: Git 提示 `detected dubious ownership in repository`？

挂载的源码目录可能属于宿主机上的另一个用户。确认该目录是你信任的源码仓库后，在容器内为该挂载路径添加例外：

```bash
git config --global --add safe.directory /root/doris
```

如果修改了容器内的挂载路径，请相应替换 `/root/doris`。

## 相关文档

- [使用 LDB Toolchain 编译](./compilation-with-ldb-toolchain)
- [Linux 平台直接编译](./compilation-linux)
- [ARM 平台编译](./compilation-arm)
