---
title: Doris Docker 快速搭建开发环境
language: zh-CN
description: 使用 Docker 快速搭建 Apache Doris 开发环境，含 Dockerfile 示例与 VSCode Remote 配置。
keywords:
    - Apache Doris
    - Docker
    - 开发环境
    - Dockerfile
    - VSCode Remote
    - SYS_PTRACE
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

# Doris Docker 快速搭建开发环境

本文介绍如何使用 Docker 构建 Doris 开发镜像、编译并运行 FE/BE，配合 VSCode Remote 完成开发与调试。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: IDE 配置 / 容器化开发环境 -->

## 相关详细文档

- [使用 Docker 开发镜像编译](/docs/install/source-install/compilation)
- [部署](/docs/install/install-deploy)
- [VSCode BE 开发调试](./be-vscode-dev)

## 1. 环境准备

| 组件          | 说明                              |
| ------------- | --------------------------------- |
| Docker        | 已安装并可正常运行                |
| VSCode        | 最新稳定版                        |
| Remote 插件   | VSCode Remote - Containers / SSH  |

## 2. 构建镜像

### 2.1 创建 Dockerfile

在工作目录下创建 `Dockerfile`。VSCode 中可使用 Ctrl+D 替换以下占位符：

| 占位符                          | 含义                |
| ------------------------------- | ------------------- |
| `<!!! your user !!!>`           | 容器内创建的用户名  |
| `<!!! your user password !!!>`  | 该用户密码          |
| `<!!! root password !!!>`       | root 用户密码       |
| `<!!! your git email !!!>`      | git 配置邮箱        |
| `<!!! your git username !!!>`   | git 配置用户名      |

```dockerfile
FROM apache/incubator-doris:build-env-latest

USER root
WORKDIR /root
RUN echo '<!!! root password !!!>' | passwd root --stdin

RUN yum install -y vim net-tools man wget git mysql lsof bash-completion \
        && cp /var/local/thirdparty/installed/bin/thrift /usr/bin

# 更安全的使用，创建用户而不是使用 root
RUN yum install -y sudo \
        && useradd -ms /bin/bash <!!! your user !!!> && echo <!!! your user password !!!> | passwd <!!! your user !!!> --stdin \
        && usermod -a -G wheel <!!! your user !!!>

USER <!!! your user !!!>
WORKDIR /home/<!!! your user !!!>
RUN git config --global color.ui true \
        && git config --global user.email "<!!! your git email !!!>" \
        && git config --global user.name "<!!! your git username !!!>"

# 按需安装 zsh and oh my zsh, 更易于使用，不需要的移除
USER root
RUN yum install -y zsh \
        && chsh -s /bin/zsh <!!! your user !!!>
USER <!!! your user !!!>
RUN wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | zsh \
        && git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions \
        && git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

### 2.2 构建镜像

```shell
docker build -t doris .
```

### 2.3 运行镜像

<!-- 知识类型: 配置参数 -->

挂载方式参考 [Docker 编译挂载说明](../source-install/compilation-with-docker)，建议以挂载本地 Doris 源码目录的方式运行镜像。

:::caution Windows 用户
Windows 下挂载存在跨文件系统访问的问题，请自行斟酌设置。
:::

`--cap-add SYS_PTRACE` 参数允许 Docker 内部使用 ptrace，便于 ptrace 与 GDB 远程调试：

```shell
docker run -it --cap-add SYS_PTRACE doris:latest /bin/bash
```

| 参数                  | 作用                                |
| --------------------- | ----------------------------------- |
| `--cap-add SYS_PTRACE` | 允许容器内调用 ptrace（GDB 必需） |
| `-it`                 | 交互式 TTY                          |
| `-v <local>:<container>` | 挂载本地源码目录（按需）         |

### 2.4 配置 zsh（可选）

如果选择安装了 zsh，在 `~/.zshrc` 中替换 plugins 行：

```bash
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
```

### 2.5 拉取 Doris 源码

```shell
su <your user>
mkdir code && cd code
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive
```

## 3. 编译

:::caution 首次编译
第一次编译使用以下命令强制清理：

```shell
sh build.sh --clean --be --fe --ui
```

`build-env-for-0.15.0` 版本镜像升级了 thrift（0.9 → 0.13），需要通过 `--clean` 强制使用新版本的 thrift 生成代码文件，否则会出现不兼容的代码。
:::

之后正常编译 Doris：

```shell
sh build.sh
```

## 4. 运行

### 4.1 准备元数据目录

手动创建 `meta_dir` 元数据存放目录，默认值为 `${DORIS_HOME}/doris-meta`：

```shell
mkdir meta_dir
```

### 4.2 启动 FE

```shell
cd output/fe
sh bin/start_fe.sh --daemon
```

### 4.3 启动 BE

```shell
cd output/be
sh bin/start_be.sh --daemon
```

### 4.4 使用 mysql-client 连接

```shell
mysql -h 127.0.0.1 -P 9030 -u root
```

## 5. 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->

### Q1：GDB 报 `ptrace: Operation not permitted`

容器未添加 `--cap-add SYS_PTRACE`，重新启动容器并加上该参数。

### Q2：编译报 thrift version mismatch

首次编译未带 `--clean`，参考 3 节命令清理后重新编译。

### Q3：FE / BE 启动后立即退出

检查 `meta_dir`、`storage_root_path` 是否已创建，端口未被占用，`priority_networks` 是否覆盖容器 IP。

### Q4：VSCode Remote 容器无法 attach 进程调试

未加 `SYS_PTRACE` 能力，或 VSCode C/C++ 插件未指定合适的 `miDebuggerPath`。
