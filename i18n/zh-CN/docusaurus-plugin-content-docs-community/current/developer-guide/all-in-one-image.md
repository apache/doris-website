---
title: 集成测试用 all-in-one 镜像
sidebar_label: All-in-One 镜像
language: zh-CN
description: 介绍 Apache Doris 官方 all-in-one 容器镜像，它在单个容器中运行一套 FE + BE，可供上下游生态项目在 e2e / CI 中作为真实 Doris 环境使用，并说明镜像能力、base 与 -full 标签的差异、多架构支持以及自行构建方式。
keywords:
    - Apache Doris
    - all-in-one 镜像
    - 集成测试
    - e2e 测试
    - CI
    - Docker
    - Docker Compose
    - GitHub Actions
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

<!-- 知识类型: 工具使用 -->
<!-- 适用场景: 生态项目集成测试 / CI 环境搭建 -->

Connector、SDK、数据集成工具等 Apache Doris 上下游项目，在 e2e / CI 中往往需要一个真实的 Doris 实例，而不是 Mock。为此 Doris 官方提供了 all-in-one 镜像：单个容器内跑一套 FE + BE，启动即可用，带健康检查，可以直接当作测试夹具（test fixture）使用。

本文介绍这个镜像的能力和用法，以及如何自行构建它。

:::caution 注意

这个镜像是为集成测试设计的测试夹具：单 FE 单 BE、单副本、内存参数按 CI runner 调小、默认不持久化数据。请勿用于生产部署。

:::

## 镜像概览

镜像标签形如 `apache/doris:all-in-one-<version>`，例如 `apache/doris:all-in-one-4.1.3`。本文所有示例都以 4.1.3 为例，换成你需要的版本即可；可用标签见 [Docker Hub 上的 apache/doris 仓库](https://hub.docker.com/r/apache/doris/tags?name=all-in-one)。

镜像由官方的 `apache/doris:fe-<version>` 和 `apache/doris:be-<version>` 组装而成，里面跑的就是正式发布的产物本身，只针对 CI 场景做了两处处理：对 `doris_be` 剥离调试信息（保留 `.symtab`，崩溃堆栈仍能解析出函数名），以及裁掉当前标签用不到的 JNI scanner 目录。

面向集成测试的几个关键行为：

| 特性 | 说明 |
| --- | --- |
| 开箱即用 | 容器内部已完成 FE 启动、`ALTER SYSTEM ADD BACKEND` 注册 BE、等待 BE 上线的全过程，不需要外部脚本介入 |
| 健康检查 | 镜像自带 `HEALTHCHECK`，只有 FE 就绪且 BE 已上线时才会变为 `healthy`，通常在 20 秒内完成。CI 里直接等这个状态即可，不需要 `sleep` |
| 单副本 | 已设置 `force_olap_table_replication_num = 1`，`CREATE TABLE` 不必再写 `replication_num` |
| 资源可控 | 按 CI runner 的规格调小了内存：FE 堆 `-Xmx2048m`，BE 侧 JNI 堆 `-Xmx1024m`，BE `mem_limit = 40%` |
| fail-fast | FE 或 BE 任一进程退出，容器随即以非零状态退出，不会静默重启，故障会立刻在 CI 中暴露出来 |
| 优雅停止 | `docker stop` 会先停 BE 再停 FE，正常退出 0 |
| 多架构 | 同一个标签同时覆盖 linux/amd64 和 linux/arm64 |

### 两个标签：base 与 -full

| 标签 | 覆盖能力 | 镜像体积（4.1.3，未压缩） |
| --- | --- | --- |
| `apache/doris:all-in-one-<version>` | 内表、Hive、Iceberg（含系统表）、Paimon、JDBC Catalog、外表写回、Java UDF | 约 2.5 GB |
| `apache/doris:all-in-one-<version>-full` | 在上述基础上增加 Hudi、Trino Connector、MaxCompute | 约 3.0 GB |

体积是在 4.1.3 上实测的，作为参照，未经剥离和裁剪的等价负载约为 4.9 GB。

**只有测试确实要读 Hudi 表、走 Trino Connector 或 MaxCompute 时才需要 `-full`**，其余场景用不带后缀的标签即可。

两个标签的差异来自 BE 的加载方式：BE 启动时通过枚举 `be/lib/java_extensions/` 下的目录来加载 JNI scanner，既没有列表也没有配置项，因此镜像里保留了哪些目录，就支持哪些格式。需要注意的是，Hive 和 Iceberg 的**数据**读取走的是 BE 原生的 parquet / orc reader，不属于这套 JNI scanner，因此两个标签都支持。

### 多架构支持

`apache/doris:all-in-one-4.1.3` 是一个 OCI image index，下面挂着 linux/amd64 和 linux/arm64 两个 manifest，`docker pull` 会自动选择与宿主机匹配的那一个，行为与 `apache/doris:fe-4.1.3` 一致。CI 中不需要为不同架构的 runner 写不同的标签。

```shell
docker buildx imagetools inspect apache/doris:all-in-one-4.1.3
```

:::caution 注意

Doris BE 通常无法在跨架构模拟下运行。例如在 Apple Silicon 上用 `--platform linux/amd64` 拉起 amd64 镜像会 segfault，官方的 `apache/doris:be-*` 镜像同样如此。请在与镜像架构一致的真实硬件上运行。

:::

## 在集成测试中使用

### 连接信息

| 项 | 说明 |
| --- | --- |
| MySQL 协议 | 端口 `9030`，用户 `root`，无密码 |
| FE HTTP | 端口 `8030`，`/api/health` 无需鉴权 |
| BE HTTP | 端口 `8040`，Stream Load 入口 |
| BE 心跳 | 端口 `9050`，容器内部使用，一般不需要映射到宿主机 |

### 直接用 docker run

```shell
docker run -d --name doris \
    -p 9030:9030 -p 8030:8030 -p 8040:8040 \
    apache/doris:all-in-one-4.1.3

# 等待容器变为 healthy
until [ "$(docker inspect -f '{{.State.Health.Status}}' doris)" = healthy ]; do sleep 1; done

mysql -uroot -h127.0.0.1 -P9030 -e "SHOW BACKENDS"
```

镜像内自带 MySQL 客户端，宿主机上没有装的话，可以直接在容器里执行：

```shell
docker exec doris mysql -uroot -h127.0.0.1 -P9030 -e "SHOW BACKENDS"
```

### Docker Compose

`depends_on` 配合 `service_healthy`，测试容器会在 Doris 真正可用之后才启动：

```yaml
services:
  doris:
    image: apache/doris:all-in-one-4.1.3
    ports: ["9030:9030", "8030:8030", "8040:8040"]

  integration-test:
    image: my-project-tests:latest
    depends_on:
      doris:
        condition: service_healthy
```

### GitHub Actions

作为 service container 使用时，GitHub Actions 会自动等待容器 `healthy` 之后才执行 `steps`，测试代码里不需要再写重试等待逻辑：

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      doris:
        image: apache/doris:all-in-one-4.1.3
        ports: ['9030:9030', '8030:8030', '8040:8040']
    steps:
      - uses: actions/checkout@v4
      - run: mvn -B verify -Pe2e
```

### 调整配置

镜像里已经是一套面向集成测试的默认配置。需要改动时，用下面两个环境变量追加配置项，它们会在启动时分别附加到 `fe.conf` 和 `be.conf` 的末尾（后写的赋值生效）：

```shell
docker run -d --name doris \
    -p 9030:9030 -p 8030:8030 -p 8040:8040 \
    -e BE_CONFIG_EXTRA="mem_limit = 80%" \
    -e FE_CONFIG_EXTRA="qe_max_connection = 2048" \
    apache/doris:all-in-one-4.1.3
```

| 环境变量 | 作用 |
| --- | --- |
| `FE_CONFIG_EXTRA` | 追加到 `fe.conf`，多行配置用换行分隔 |
| `BE_CONFIG_EXTRA` | 追加到 `be.conf`，多行配置用换行分隔 |

**数据持久化**：默认不持久化，容器销毁后数据即消失，这通常正是 CI 想要的。需要保留数据时，挂载 `/opt/apache-doris/fe/doris-meta` 和 `/opt/apache-doris/be/storage` 即可，启动流程是幂等的，同一份数据目录可以反复拉起。

### 排查问题

- `docker logs <container>` 输出的是 entrypoint 的启动日志和 FE 的 console 流，可用于判断集群卡在启动的哪一步。
- 完整日志在容器内的 `fe/log/fe.log` 和 `be/log/be.INFO`。
- 容器非零退出，说明 FE 或 BE 挂了，退出前的日志里会指明是哪一个以及去看哪个日志文件。
- 数据量较大的测试可能需要在**宿主机**上调大 `vm.max_map_count`（`sysctl -w vm.max_map_count=2000000`）。这不是 namespace 化的 sysctl，容器内改不了，因此镜像里跳过了 `start_be.sh` 对它的检查。

## 自行构建镜像

Dockerfile 和构建脚本位于 Doris 主仓库的 `docker/runtime/all-in-one/<版本线>/` 下，目前提供 `4.1`。各版本线的产物布局差异较大，因此按版本线分目录，而不是在一份 Dockerfile 里做版本开关。

`build.sh` 是唯一的入口，构建上下文固定为仓库根目录，脚本本身可以在任意目录下执行：

```shell
# 用官方 4.1.3 组件镜像构建 base 和 -full 两个标签（仅宿主机架构）
./build.sh -v 4.1.3

# 只构建 base，并跑一遍冒烟测试
./build.sh -v 4.1.3 -f base -t

# 用本地编译产物 ./output 构建，便于验证自己修改过的内核
# 需先完成 Doris 编译，产出 ./output/fe 和 ./output/be
./build.sh -v dev -s local
```

不带 `--platform` 时只构建宿主机架构。多架构需要显式指定，例如 `./build.sh -v 4.1.3 --platform linux/amd64,linux/arm64 --push`。跨架构构建走模拟，耗时很长，因此发布时更推荐在各架构的机器上分别构建，再用 `docker buildx imagetools create` 合并成一个标签。

`./build.sh --help` 列出全部选项。

:::tip

镜像裁剪了哪些内容、为什么有些看起来像外表插件的目录其实不能裁、体积构成、冒烟测试怎么跑等实现细节，见目录下的 [README](https://github.com/apache/doris/blob/master/docker/runtime/all-in-one/4.1/README.md)。

:::
