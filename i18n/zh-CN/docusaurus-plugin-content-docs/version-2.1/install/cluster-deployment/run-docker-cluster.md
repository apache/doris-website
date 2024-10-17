---
{
"title": "Docker 部署",
"language": "zh-CN"
}
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



该文档主要介绍了如何通过 Dockerfile 来制作 Apache Doris 的运行镜像，以便于在容器化编排工具或者快速测试过程中可迅速拉取一个 Apache Doris Image 来完成集群的创建和运行。

## 软硬件要求

**概述**

在制作 Docker 镜像前，请确保制作机器的平台架构与目标运行平台一致。例如，X86_64 机器应下载 X86_64 版本的 Doris 二进制程序，以确保镜像的兼容性。ARM64 平台同理。  

**硬件要求**

构建镜像时：推荐配置为 4 核 CPU 和 16GB 内存

**软件要求**

Docker Version：20.10 及以后版本

## Image 构建

### 构建前注意

**Dockerfile 脚本编写注意**

- 基础父镜像应选用经过 Docker-Hub 认证的 OpenJDK 官方镜像，版本为 JDK 8，推荐基础父镜像为 openjdk:8u342-jdk。  

- 需要编写内嵌脚本来完成 Doris FE 的启动、多 FE 注册、状态检查以及 BE 的启动、注册至 FE、状态检查等任务流程。这些脚本应正确处理 Doris 的依赖和环境变量。  

- 在 Docker 容器内启动应用程序时，不建议使用 --daemon 方式，以避免容器退出或进程管理问题。  

**构建方式**

编译 Docker Image 的 Dockerfile 脚本中，关于 Apache Doris 程序二进制包的加载方式，有两种：

- **在线下载**：通过 `wget` / `curl` 在编译时执行下载命令，随后完成 Docker Build 制作过程。这种方式可能减小镜像大小，但依赖于稳定的网络环境，且构建时间可能较长（取决于缓存命中情况）。  

- **提前下载**：将二进制包提前下载至编译目录，然后通过 `ADD` 或者 `COPY` 命令加载至 Docker Build 过程中。这种方式适用于网络环境不佳的情况。  

以下以第二种方式（提前下载）为例进行说明：

### 构建 FE 镜像

1. 构建 FE 镜像的环境目录

构建环境目录如下

```Plain
└── docker-build                                                // 构建根目录 
    └── fe                                                   // Doris 构建目录
        ├── dockerfile                                          // Dockerfile 脚本
        └── resource                                            // 资源目录
            ├── init_fe.sh                                      // FE 启动及注册脚本
            └── apache-doris-2.0.3-bin.tar.gz                   // 二进制程序包
```

2. 下载二进制包

下载[官方二进制包](https://doris.apache.org/zh-CN/download)/编译的二进制包，然后覆盖`./docker-build/fe/resource`中的 apache-doris 安装包。

3. 编写 Dockerfile

```shell
# 选择基础镜像
FROM openjdk:8u342-jdk

# 设置环境变量
ENV JAVA_HOME="/usr/local/openjdk-8/"
ENV PATH="/opt/apache-doris/fe/bin:$PATH"

# 下载软件至镜像内，可根据需要替换
ADD ./resource/apache-doris-2.0.3-bin.tar.gz /opt/

RUN apt-get update && \
    apt-get install -y default-mysql-client && \
    apt-get clean && \
    mkdir /opt/apache-doris && \
    cd /opt && \
    mv apache-doris-2.0.3-bin/fe /opt/apache-doris/

ADD ./resource/init_fe.sh /opt/apache-doris/fe/bin
RUN chmod 755 /opt/apache-doris/fe/bin/init_fe.sh

ENTRYPOINT ["/opt/apache-doris/fe/bin/init_fe.sh"]
```

-   编写后命名为 `Dockerfile` 并保存至 `./docker-build/fe` 目录下

-   FE 的执行脚本 init_fe.sh 的内容可以参考 Doris 源码库中的 [init_fe.sh](https://github.com/apache/doris/tree/master/docker/runtime/fe/resource/init_fe.sh) 的内容

4. 执行构建

需要注意的是，`${tagName}` 需替换为你想要打包命名的 tag 名称，如：`apache-doris:2.0.3-fe`

```Shell
cd ./docker-build/fe
docker build . -t ${fe-tagName}
```

### 构建 BE 镜像

1.  构建环境目录如下：

```sql
└── docker-build                                                // 构建根目录 
    └── be                                                      // BE 构建目录
        ├── Dockerfile                                          // Dockerfile 脚本
        └── resource                                            // 资源目录
            ├── init_be.sh                                      // 启动及注册脚本
            └── apache-doris-2.0.3-bin.tar.gz                   // 二进制程序包
```

2. 编写 BE 的 Dockerfile 脚本

```PowerShell
# 选择基础镜像
FROM openjdk:8u342-jdk

# 设置环境变量
ENV JAVA_HOME="/usr/local/openjdk-8/" 
ENV PATH="/opt/apache-doris/be/bin:$PATH"

# 下载软件至镜像内，可根据需要替换
ADD ./resource/apache-doris-2.0.3-bin.tar.gz /opt/

RUN apt-get update && \
    apt-get install -y default-mysql-client && \
    apt-get clean && \
    mkdir /opt/apache-doris && \
    cd /opt && \
    mv apache-doris-2.0.3-bin/be /opt/apache-doris/

ADD ./resource/init_be.sh /opt/apache-doris/be/bin
RUN chmod 755 /opt/apache-doris/be/bin/init_be.sh

ENTRYPOINT ["/opt/apache-doris/be/bin/init_be.sh"]
```

-   编写后命名为 `Dockerfile` 并保存至 `./docker-build/be` 目录下

-   编写 BE 的执行脚本，可参考复制 [init_be.sh](https://github.com/apache/doris/tree/master/docker/runtime/be/resource/init_be.sh) 的内容

3. 执行构建

需要注意的是，`${tagName}` 需替换为你想要打包命名的 tag 名称，如：`apache-doris:2.0.3-be`

```Shell
cd ./docker-build/be
docker build . -t ${be-tagName}
```

### 推送镜像至 DockerHub 或私有仓库

登录 DockerHub 账号

```Plain
docker login
```

登录成功会提示 `Success` 相关提示，随后推送至仓库即可

```Shell
docker push ${tagName}
```

## 部署 Docker 集群

这里将简述如何通过 `docker run` 或 `docker-compose up` 命令快速构建一套完整的 Doris 测试集群。

在生产环境上，当前尽量避免使用容器化的方案进行 Doris 部署，在 K8s 中部署 Doris，请采用 Doris Operator 来部署。

### 前期环境准备

**软件环境**

| 软件           | 版本        |
| -------------- | ----------- |
| Docker         | 20.0 及以上 |
| docker-compose | 20.1 及以上 |

**硬件环境**

| 配置类型 | 硬件信息 | 最大运行集群规模 |
| -------- | -------- | ---------------- |
| 最低配置 | 2C 4G    | 1FE 1BE          |
| 推荐配置 | 4C 16G   | 3FE 3BE          |

**在宿主机执行如下命令**

```Shell
sysctl -w vm.max_map_count=2000000
```

### Docker Compose

不同平台需要使用不同 Image 镜像，本篇以 `X86_64` 平台为例。

**网络模式说明**

Doris Docker 适用的网络模式有两种。

-   适合跨多节点部署的 HOST 模式，这种模式适合每个节点部署 1 FE 1 BE。

-   适合单节点部署多 Doris 进程的桥接网络模式，这种模式适合单节点部署（推荐），若要多节点混部需要做更多组件部署（不推荐）。

为便于展示，本章节仅演示桥接网络模式编写的脚本。

**接口说明**

从 `Apache Doris 2.0.3 Docker Image` 版本起，各个进程镜像接口列表如下：

| 进程名 | 接口名    | 接口定义        | 接口示例         |
| ------ | --------- | --------------- | ---------------- |
| FE     | BE        | BROKER          | FE_SERVERS       |
| FE     | FE_ID     | FE 节点 ID      | 1                |
| BE     | BE_ADDR   | BE 节点主要信息 | 172.20.80.5:9050 |
| BE     | NODE_ROLE | BE 节点类型     | computation      |

注意，以上接口必须填写信息，否则进程无法启动。

:::tip
- FE_SERVERS 接口规则为：`FE_NAME:FE_HOST:FE_EDIT_LOG_PORT[,FE_NAME:FE_HOST:FE_EDIT_LOG_PORT]`

- FE_ID 接口规则为：`1-9` 的整数，其中 `1` 号 FE 为 Master 节点。

- BE_ADDR 接口规则为：`BE_HOST:BE_HEARTBEAT_SERVICE_PORT`

- NODE_ROLE 接口规则为：`computation` 或为空，其中为空或为其他值时表示节点类型为 `mix` 类型

- BROKER_ADDR 接口规则为：`BROKER_HOST:BROKER_IPC_PORT`
:::

**脚本模板**

**1. Docker Run 命令**

1 FE & 1 BE 命令模板

注意需要修改 `${当前机器的内网IP}` 替换为当前机器的内网 IP

```Shell
docker run -itd \
--name=fe \
--env FE_SERVERS="fe1:${当前机器的内网IP}:9010" \
--env FE_ID=1 \
-p 8030:8030 \
-p 9030:9030 \
-v /data/fe/doris-meta:/opt/apache-doris/fe/doris-meta \
-v /data/fe/log:/opt/apache-doris/fe/log \
--net=host \
apache/doris:2.0.3-fe-x86_64

docker run -itd \
--name=be \
--env FE_SERVERS="fe1:${当前机器的内网IP}:9010" \
--env BE_ADDR="${当前机器的内网IP}:9050" \
-p 8040:8040 \
-v /data/be/storage:/opt/apache-doris/be/storage \
-v /data/be/log:/opt/apache-doris/be/log \
--net=host \
apache/doris:2.0.3-be-x86_64
```
:::note
3 FE & 3 BE Run 命令模板如有需要[点击此处](https://github.com/apache/doris/tree/master/docker/runtime/docker-compose-demo/build-cluster/rum-command/3fe_3be.sh)访问下载。
:::

**2. Docker Compose 脚本**

1 FE & 1 BE 模板

注意需要修改 `${当前机器的内网IP}` 替换为当前机器的内网 IP

```YAML
version: "3"
services:
  fe:
    image: apache/doris:2.0.3-fe-x86_64
    hostname: fe
    environment:
     - FE_SERVERS=fe1:${当前机器的内网IP}:9010
     - FE_ID=1
    volumes:
     - /data/fe/doris-meta/:/opt/apache-doris/fe/doris-meta/
     - /data/fe/log/:/opt/apache-doris/fe/log/
    network_mode: host
  be:
    image: apache/doris:2.0.3-be-x86_64
    hostname: be
    environment:
     - FE_SERVERS=fe1:${当前机器的内网IP}:9010
     - BE_ADDR=${当前机器的内网IP}:9050
    volumes:
     - /data/be/storage/:/opt/apache-doris/be/storage/
     - /data/be/script/:/docker-entrypoint-initdb.d/
    depends_on:
      - fe
    network_mode: host
```

:::note
3 FE & 3 BE Docker Compose 脚本模板如有需要[点击此处](https://github.com/apache/doris/tree/master/docker/runtime/docker-compose-demo/build-cluster/docker-compose/3fe_3be/docker-compose.yaml)访问下载。
:::

### 部署 Doris Docker

部署方式二选一即可：

1.  执行 `docker run` 命令创建集群

2.  保存 `docker-compose.yaml` 脚本，同目录下执行 `docker-compose up -d` 命令创建集群