---
title: All-in-One 镜像：单容器、多节点与存算分离集群
sidebar_label: All-in-One 镜像
language: zh-CN
description: 介绍 Apache Doris 官方 all-in-one 容器镜像的三种用法：单容器 FE + BE 作为 e2e / CI 测试夹具；通过 Docker Compose 拉起 3 FE + 3 BE 多节点集群；以及拉起带 Meta Service、FoundationDB 和 MinIO 的存算分离集群用于本地开发与演示。同时说明镜像标签、多架构支持、配置方式与自行构建方法。
keywords:
    - Apache Doris
    - all-in-one 镜像
    - 集成测试
    - e2e 测试
    - CI
    - Docker
    - Docker Compose
    - GitHub Actions
    - 多节点集群
    - 存算分离
    - 计算组
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
<!-- 适用场景: 生态项目集成测试 / CI 环境搭建 / 本地多节点与存算分离集群 -->

Apache Doris 官方提供 all-in-one 镜像 `apache/doris:all-in-one-<version>`，把正式发布的 FE、BE 和 Meta Service 打进同一个镜像，容器启动时由 `DORIS_ROLE` 环境变量决定里面跑什么。同一个镜像有三种用法：

| 用法 | 启动方式 | 适用场景 |
| --- | --- | --- |
| **[单容器](#single-container)**<br />1 FE + 1 BE，同一容器内，约 20 秒就绪 | `docker run apache/doris:all-in-one-4.1.3` | Connector、SDK、数据集成工具等生态项目的 e2e / CI 测试夹具，用真实 Doris 实例代替 Mock |
| **[多节点集群](#multi-node)**<br />3 FE + 3 BE，每个节点一个容器，约 35 秒就绪 | `docker compose -f multi-node.yml up --wait` | 本地验证 FE 选举与故障切换、三副本、均衡、节点下线等单容器覆盖不了的多节点行为 |
| **[存算分离集群](#cloud)**<br />FoundationDB + Meta Service + Recycler + MinIO + 1～3 FE + 3 BE（2 个计算组），约 50 秒就绪 | `docker compose -f cloud.yml up --wait` | 本地开发和演示存算分离特性：计算组、存储 Vault、云模式下的 FE 故障切换等，不依赖任何外部云资源 |

单容器模式面向 CI，`docker run` 即可用；两个 Compose 文件位于 Doris 主仓库的 [`docker/runtime/all-in-one/4.1/compose/`](https://github.com/apache/doris/tree/master/docker/runtime/all-in-one/4.1/compose) 下，面向本地功能开发与演示。三种用法都带健康检查，`healthy` 即代表集群已经成形，不需要外部脚本轮询或 `sleep`。

:::caution 注意

三种用法都是测试 / 开发环境，不是生产部署：内存参数按 CI runner 和开发机的规格调小，单容器只有单副本，默认都不持久化数据。多节点和存算分离集群也不能替代回归测试流水线，`regression-test/suites/cloud_p0` 下的 `docker()` 用例仍然需要 `doris-compose`。

:::

## 镜像概览

镜像标签形如 `apache/doris:all-in-one-<version>`，例如 `apache/doris:all-in-one-4.1.3`。本文所有示例都以 4.1.3 为例，换成你需要的版本即可；可用标签见 [Docker Hub 上的 apache/doris 仓库](https://hub.docker.com/r/apache/doris/tags?name=all-in-one)。

镜像由官方的 `apache/doris:fe-<version>`、`be-<version>` 和 `ms-<version>` 组装而成，里面跑的就是正式发布的产物本身，只针对体积做了两处处理：对 `doris_be` 以及 Meta Service 的 `doris_cloud`、`libfdb_c.so` 剥离调试信息（保留 `.symtab`，崩溃堆栈仍能解析出函数名），以及裁掉当前标签用不到的 JNI scanner 目录。

### 两个标签：base 与 -full

| 标签 | 覆盖能力 | 镜像体积（4.1.3，未压缩） |
| --- | --- | --- |
| `apache/doris:all-in-one-<version>` | 内表、Hive、Iceberg（含系统表）、Paimon、JDBC Catalog、外表写回、Java UDF | 约 2.7 GB |
| `apache/doris:all-in-one-<version>-full` | 在上述基础上增加 Hudi、Trino Connector、MaxCompute | 约 3.2 GB |

体积是在 4.1.3 上实测的各层未压缩之和，其中约 0.2 GB 是 Meta Service，只有存算分离集群会用到；作为参照，未经剥离和裁剪的等价负载约为 5.6 GB。

**只有测试确实要读 Hudi 表、走 Trino Connector 或 MaxCompute 时才需要 `-full`**，其余场景用不带后缀的标签即可。三种用法对标签没有要求，Compose 集群通过 `DORIS_IMAGE` 环境变量换用 `-full` 或自行构建的标签。

两个标签的差异来自 BE 的加载方式：BE 启动时通过枚举 `be/lib/java_extensions/` 下的目录来加载 JNI scanner，既没有列表也没有配置项，因此镜像里保留了哪些目录，就支持哪些格式。需要注意的是，Hive 和 Iceberg 的**数据**读取走的是 BE 原生的 parquet / orc reader，不属于这套 JNI scanner，因此两个标签都支持。

### 多架构支持

`apache/doris:all-in-one-4.1.3` 是一个 OCI image index，下面挂着 linux/amd64 和 linux/arm64 两个 manifest，`docker pull` 会自动选择与宿主机匹配的那一个，行为与 `apache/doris:fe-4.1.3` 一致。CI 中不需要为不同架构的 runner 写不同的标签。

```shell
docker buildx imagetools inspect apache/doris:all-in-one-4.1.3
```

:::caution 注意

Doris BE 通常无法在跨架构模拟下运行。例如在 Apple Silicon 上用 `--platform linux/amd64` 拉起 amd64 镜像会 segfault，官方的 `apache/doris:be-*` 镜像同样如此。请在与镜像架构一致的真实硬件上运行。

:::

## 单容器：集成测试夹具 {#single-container}

Connector、SDK、数据集成工具等 Apache Doris 上下游项目，在 e2e / CI 中往往需要一个真实的 Doris 实例，而不是 Mock。单容器模式就是为此设计的：容器内跑一套 FE + BE，启动即可用，可以直接当作测试夹具（test fixture）使用。

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

镜像里已经是一套面向集成测试的默认配置。需要改动时，用下面的环境变量覆盖，它们会在容器启动时写入 `fe.conf` / `be.conf`（后写的赋值生效）：

```shell
docker run -d --name doris \
    -p 9030:9030 -p 8030:8030 -p 8040:8040 \
    -e BE_CONFIG_EXTRA="mem_limit = 80%" \
    -e FE_CONFIG_EXTRA="qe_max_connection = 2048" \
    -e FE_HEAP=4096m \
    apache/doris:all-in-one-4.1.3
```

| 环境变量 | 作用 |
| --- | --- |
| `FE_CONFIG_EXTRA` | 追加到 `fe.conf`，多行配置用换行分隔 |
| `BE_CONFIG_EXTRA` | 追加到 `be.conf`，多行配置用换行分隔 |
| `FE_HEAP` / `BE_HEAP` | 覆盖 FE / BE 侧 JVM 的 `-Xmx`，如 `4096m`；默认分别为 `2048m` 和 `1024m` |

**数据持久化**：默认不持久化，容器销毁后数据即消失，这通常正是 CI 想要的。需要保留数据时，挂载 `/opt/apache-doris/fe/doris-meta` 和 `/opt/apache-doris/be/storage` 即可，启动流程是幂等的，同一份数据目录可以反复拉起。

### 排查问题

- `docker logs <container>` 输出的是 entrypoint 的启动日志和 FE 的 console 流，可用于判断集群卡在启动的哪一步。
- 完整日志在容器内的 `fe/log/fe.log` 和 `be/log/be.INFO`。
- 容器非零退出，说明 FE 或 BE 挂了，退出前的日志里会指明是哪一个以及去看哪个日志文件。
- 数据量较大的测试可能需要在**宿主机**上调大 `vm.max_map_count`（`sysctl -w vm.max_map_count=2000000`）。这不是 namespace 化的 sysctl，容器内改不了，因此镜像里跳过了 `start_be.sh` 对它的检查。

## 多节点与存算分离集群

两个 Compose 文件位于 Doris 主仓库的 `docker/runtime/all-in-one/4.1/compose/` 下，需要 Docker Compose v2（`docker compose` 子命令）。镜像默认为 `apache/doris:all-in-one-4.1.3`，可以通过环境变量或同目录下的 `.env` 文件里的 `DORIS_IMAGE` 更换，其他可调参数也都以同样方式传入，每个文件的头部注释里有完整列表。

```shell
cd <doris 仓库>/docker/runtime/all-in-one/4.1/compose
```

两个文件都带一个 `client` 服务：所有节点上线后它才变为 `healthy`，`docker compose up --wait` 等的就是它；之后它常驻在集群网络内，自带 `mysql` 和 `curl`，`docker compose exec client ...` 即可访问集群。

### 多节点集群：multi-node.yml {#multi-node}

```shell
docker compose -f multi-node.yml up --wait          # 约 35 秒后集群就绪
docker compose -f multi-node.yml exec client mysql -uroot -hfe-1 -P9030
docker compose -f multi-node.yml kill fe-1          # 几秒后选出新的 Master
docker compose -f multi-node.yml start fe-1         # 以 Follower 身份重新加入
docker compose -f multi-node.yml down               # 销毁集群，数据不保留
```

```
fe-1 ─┬─ fe-2, fe-3
      ├─ be-1, be-2, be-3
      └─ client
```

- `fe-1` 引导集群，`fe-2`、`fe-3` 以 Follower 身份加入；设置 `FE3_ROLE=observer` 可把 `fe-3` 改为 Observer。
- 建表默认三副本，每个 BE 一份，和真实集群一致。
- 宿主机端口：`fe-1` 为 `9030` / `8030`，`fe-2` 为 `9031` / `8031`，`fe-3` 为 `9032` / `8032`，`be-1` 的 HTTP 端口为 `8040`。
- 可调参数：`DORIS_IMAGE`、`SUBNET`（默认 `172.31.81`）、各宿主机端口、`FE_HEAP`（默认 `1024m`）、`BE_MEM_LIMIT`（默认 `25%`）、`FE3_ROLE`。

### 存算分离集群：cloud.yml {#cloud}

```shell
docker compose -f cloud.yml up --wait                  # 1 FE + 3 BE，约 50 秒后就绪
docker compose -f cloud.yml --profile ha up --wait     # 再加两个 Follower FE，共 3 FE
docker compose -f cloud.yml exec client mysql -uroot -hfe-1 -P9030
docker compose -f cloud.yml down                       # 销毁集群，数据不保留
```

```
fdb ─ fdb-init ─┬─ ms ─ cloud-init ─ fe-1 ─┬─ be-1, be-2  (计算组 cg_a)
                └─ recycler                 ├─ be-3        (计算组 cg_b)
minio ─ minio-init ─┘                       └─ client
```

- 所有 Doris 进程（FE、BE、Meta Service、Recycler）都来自 all-in-one 镜像，FoundationDB 和 MinIO 使用各自的上游镜像。
- `cloud-init` 是一次性容器，以 Storage Vault 模式在 Meta Service 上创建实例，MinIO 作为 Vault（path-style，明文 HTTP）；`fe-1` 启动后把 `built_in_storage_vault` 设为默认 Vault，因此 `CREATE TABLE` 不需要额外指定。两步都是幂等的。
- 三个 BE 分属两个计算组：`be-1`、`be-2` 在 `cg_a`，`be-3` 在 `cg_b`。可以直接试 `use @cg_b`、`SHOW COMPUTE GROUPS`、`ALTER SYSTEM ADD BACKEND ... ("tag.compute_group_name" = ...)`、存储 Vault、预热，以及云模式下的 FE 故障切换，还能在 MinIO 里观察对象写入。
- 宿主机端口：`fe-1` 为 `9030` / `8030`（`ha` profile 下 `fe-2`、`fe-3` 为 `9031` / `8031`、`9032` / `8032`），`be-1` 的 HTTP 端口为 `8040`，Meta Service HTTP API 为 `15000`（macOS 上 `5000` 被 AirPlay 占用），MinIO 为 `9000`，MinIO 控制台为 `9001`（`minioadmin` / `minioadmin`）。
- 可调参数：`DORIS_IMAGE`、`SUBNET`（默认 `172.31.80`）、各宿主机端口、`FE_HEAP`、`BE_MEM_LIMIT`、`CG_A` / `CG_B`（计算组名）、`INSTANCE_ID`（默认 `100001`，同时是 FE 的 `cluster_id`）、`S3_BUCKET` / `S3_AK` / `S3_SK`、`FDB_IMAGE` / `FDB_PLATFORM`。
- 用 `--profile ha` 启动的集群，后续的 `stop` / `down` 也带上同样的参数，profile 里的 `fe-2`、`fe-3` 才会一起处理。

### 使用须知

- **数据保留**：`docker compose stop` / `start`（或再次 `up`）会保留数据，实例创建、默认 Vault 和节点注册都是幂等的；`down` 会删除容器和网络，数据随之清空。
- **节点地址**：节点在私有子网内使用固定 IP（`SUBNET`，multi-node 默认 `172.31.81`，cloud 默认 `172.31.80`），容器重启后 Doris 仍按原地址识别它。两套集群子网不同，只要给其中一套换一组宿主机端口，就可以同时运行。
- **从宿主机访问**：使用映射出来的端口。在 Docker Desktop（macOS / Windows）上，容器地址在宿主机上不可路由，因此从宿主机发起的 Stream Load 无法跟随 FE 到 BE 的重定向；请改在 `client` 服务内执行（`docker compose -f <file> exec client curl ...`）。Linux 宿主机可以直接访问各节点。
- **内存**：默认 `FE_HEAP=1024m`，每个 BE `mem_limit = 25%`。一套完整的存算分离集群约占 9 GB 内存，Docker Desktop 请分配 12 GB 以上；16 GB 的虚拟机不要指望两套拓扑同时跑。
- **Apple Silicon 上的 FoundationDB**：上游 `foundationdb/foundationdb:7.1.x` 镜像只有 amd64 版本，在 Apple Silicon 上 `fdb` 会通过模拟运行，对这个用途来说足够；`FDB_IMAGE` / `FDB_PLATFORM` 可以换用其他镜像。Meta Service 链接的是 7.1 客户端，服务端请保持 7.1。
- **冒烟测试**：`compose/smoke-test.sh <multi-node|cloud> [image:tag]` 会用独立的 project 名、子网和宿主机端口拉起对应拓扑，检查副本或计算组与 Vault，通过 client 做 Stream Load，杀掉 Master FE、在旧 Master 宕机期间重启一个 BE、再恢复 Master，最后清理，每个拓扑约两分钟。

### 容器角色：DORIS_ROLE

两个 Compose 文件都是用同一个镜像的不同角色拼出来的，镜像的 entrypoint 根据 `DORIS_ROLE` 决定容器里运行什么。需要自定义拓扑（例如 1 FE + 5 BE）时，可以按同样的方式组合：

| `DORIS_ROLE` | 运行内容 | 必需变量 |
| --- | --- | --- |
| `all`（默认） | 同一容器内的 FE + BE，即单容器模式 | 无 |
| `fe` | 一个 FE。`FE_MASTER` 为空时引导新集群；否则以 `FE_ROLE`（`follower` \| `observer`）注册并加入 | `FE_MASTER` |
| `be` | 一个 BE，向 `FE_MASTER` 注册；存算分离模式下加入 `COMPUTE_GROUP` 指定的计算组 | `FE_MASTER` |
| `ms` / `recycler` | 存算分离的 Meta Service / Recycler | `FDB_CLUSTER` |
| `cloud-init` | 一次性任务：在 S3 兼容对象存储上创建存算分离实例，然后退出 | `MS_ENDPOINT`、`INSTANCE_ID`、`S3_*` |
| `client` | 等待 `EXPECT_FE` / `EXPECT_BE` 个节点在线后常驻，提供 `mysql` 和 `curl` | `FE_MASTER` |

- `DEPLOY_MODE=cloud` 把 `fe` 和 `be` 变成存算分离节点（自动写入 `deploy_mode`、`meta_service_endpoint`、file cache 等配置）；FE 以 `INSTANCE_ID` 作为 `cluster_id` 并通过 SQL 管理节点，不需要手工分配 `cloud_unique_id`。
- `FE_MASTER` 可以列出多个 FE（如 `fe-1,fe-2,fe-3`），使用第一个有响应的，这样某个节点重启时不会卡在恰好宕机的那个 FE 上；已有元数据的 FE 会自行重新加入集群。
- 所有角色都支持 `FE_CONFIG_EXTRA` / `BE_CONFIG_EXTRA` / `MS_CONFIG_EXTRA` 和 `FE_HEAP` / `BE_HEAP`，就绪后写入 ready 标记，镜像的 `HEALTHCHECK` 据此判断健康状态，所以 `docker compose up --wait` 会一直阻塞到整个集群成形；任一进程退出，容器同样以非零状态退出。
- `priority_networks`、副本数、均衡、存算分离相关的拓扑配置由 entrypoint 在容器启动时按角色写入，镜像里烘焙的配置文件只保留与资源规格有关的默认值。

## 自行构建镜像

Dockerfile 和构建脚本位于 Doris 主仓库的 `docker/runtime/all-in-one/<版本线>/` 下，目前提供 `4.1`。各版本线的产物布局差异较大，因此按版本线分目录，而不是在一份 Dockerfile 里做版本开关。

`build.sh` 是唯一的入口，脚本本身可以在任意目录下执行：

```shell
# 用官方 4.1.3 组件镜像（fe / be / ms）构建 base 和 -full 两个标签（仅宿主机架构）
./build.sh -v 4.1.3

# 只构建 base，并跑一遍冒烟测试
./build.sh -v 4.1.3 -f base -t

# 用本地编译产物 ./output 构建，便于验证自己修改过的内核
# 需先用 build.sh --fe --be --cloud 完成 Doris 编译；不带 --cloud 就没有 ./output/ms，
# 构建出的镜像无法用于存算分离集群
./build.sh -v dev -s local

# 用解压后的发行包构建，例如新版本的组件镜像还没上 Docker Hub 时
./build.sh -v 4.1.4 -s tarball --tarball-dir ~/apache-doris-4.1.4-bin-arm64
```

构建上下文固定为仓库根目录（由 `Dockerfile.dockerignore` 裁到几 KB），本地 `./output` 或发行包目录以 BuildKit 命名上下文（named context）的方式传入，因此可以放在任意位置，但需要 `docker buildx`。自行构建的镜像可以直接用于两个 Compose 文件：

```shell
DORIS_IMAGE=apache/doris:all-in-one-dev docker compose -f multi-node.yml up --wait
```

不带 `--platform` 时只构建宿主机架构。多架构需要显式指定，例如 `./build.sh -v 4.1.3 --platform linux/amd64,linux/arm64 --push`。跨架构构建走模拟，耗时很长，因此发布时更推荐在各架构的机器上分别构建，再用 `docker buildx imagetools create` 合并成一个标签。

`./build.sh --help` 列出全部选项。

:::tip

镜像裁剪了哪些内容、为什么有些看起来像外表插件的目录其实不能裁、体积构成、冒烟测试怎么跑等实现细节，见目录下的 [README](https://github.com/apache/doris/blob/master/docker/runtime/all-in-one/4.1/README.md)。

:::
