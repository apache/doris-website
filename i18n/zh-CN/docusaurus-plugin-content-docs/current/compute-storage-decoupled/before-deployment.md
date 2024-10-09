---
{
    "title": "Doris 存算分离模式部署准备",
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

# Doris 存算分离模式部署准备

## 1. 概述

本文档介绍了 Apache Doris 存算分离模式的部署准备工作。存算分离架构旨在提高系统的可扩展性和性能，适用于大规模数据处理场景。

## 2. 架构组件

Doris 存算分离架构包含三个主要模块：

1. **Frontend (FE)**：处理用户请求和管理元数据。
2. **Backend (BE)**：无状态计算节点，执行查询任务。
3. **Meta Service (MS)**：管理元数据操作和数据回收。

## 3. 系统要求

### 3.1 硬件要求

- 最小配置：3 台服务器
- 推荐配置：5 台或更多服务器

### 3.2 软件依赖

- FoundationDB (FDB) 7.1.38 或更高版本
- OpenJDK 17

## 4. 部署规划

### 4.1 测试环境部署

单机部署所有模块，不适用于生产环境。

### 4.2 生产部署

- 3 台或更多机器部署 FDB
- 3 台或更多机器部署 FE 和 Meta Service
- 3 台或更多机器部署 BE

机器配置高时，可以考虑 FDB、FE 和 Meta Service 混布，但是磁盘不要混用。

## 5. 安装步骤

### 5.1. 安装 FoundationDB

本节提供了脚本 `fdb_vars.sh` 和 `fdb_ctl.sh` 配置、部署和启动 FDB（FoundationDB）服务的分步指南。

#### 5.1.1 机器要求

通常，至少需要 3 台配备 SSD 的机器来形成具有双数据副本并允许单机故障的 FoundationDB 集群。

:::tip
如果仅用于开发/测试目的，单台机器就足够了。
:::

#### 5.1.2 `fdb_vars.sh` 配置

##### 必需的自定义设置

| 参数 | 描述 | 类型 | 示例 | 注意事项 |
|------|------|------|------|----------|
| `DATA_DIRS` | 指定 FoundationDB 存储的数据目录 | 以逗号分隔的绝对路径列表 | `/mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3` | - 运行脚本前确保目录已创建<br/>- 生产环境建议使用 SSD 和独立目录 |
| `FDB_CLUSTER_IPS` | 定义集群 IP | 字符串（以逗号分隔的 IP 地址） | `172.200.0.2,172.200.0.3,172.200.0.4` | - 生产集群至少应有 3 个 IP 地址<br/>- 第一个 IP 地址将用作协调器<br/>- 为高可用性，将机器放置在不同机架上 |
| `FDB_HOME` | 定义 FoundationDB 主目录 | 绝对路径 | `/fdbhome` | - 默认路径为 /fdbhome<br/>- 确保此路径是绝对路径 |
| `FDB_CLUSTER_ID` | 定义集群 ID | 字符串 | `SAQESzbh` | - 每个集群的 ID 必须唯一<br/>- 可使用 `mktemp -u XXXXXXXX` 生成 |
| `FDB_CLUSTER_DESC` | 定义 FDB 集群的描述 | 字符串 | `dorisfdb` | - 建议更改为对部署有意义的内容 |

##### 可选的自定义设置

| 参数 | 描述 | 类型 | 示例 | 注意事项 |
|------|------|------|------|----------|
| `MEMORY_LIMIT_GB` | 定义 FDB 进程的内存限制，单位为 GB | 整数 | `MEMORY_LIMIT_GB=16` | 根据可用内存资源和 FDB 进程的要求调整此值 |
| `CPU_CORES_LIMIT` | 定义 FDB 进程的 CPU 核心限制 | 整数 | `CPU_CORES_LIMIT=8` | 根据可用的 CPU 核心数量和 FDB 进程的要求设置此值 |

#### 5.1.3 部署 FDB 集群

使用 `fdb_vars.sh` 配置环境后，您可以在每个节点上使用 `fdb_ctl.sh` 脚本部署 FDB 集群。

```bash
./fdb_ctl.sh deploy
```

此命令启动 FDB 集群的部署过程。

#### 5.1.4 启动 FDB 服务

FDB 集群部署完成后，您可以使用 `fdb_ctl.sh` 脚本启动 FDB 服务。

```bash
./fdb_ctl.sh start
```

此命令启动 FDB 服务，使集群工作并获取 FDB 集群连接字符串，后续可以用于配置 MetaService。

### 5.2 安装 OpenJDK 17

1. 下载 [OpenJDK 17](https://download.java.net/java/GA/jdk17.0.1/2a2082e5a09d4267845be086888add4f/12/GPL/openjdk-17.0.1_linux-x64_bin.tar.gz)
2. 解压并设置环境变量 JAVA_HOME.

### 5.3 安装 S3 或 HDFS 服务（可选）

Apache Doris 存算分离模式会将数据存储在 S3 服务或 HDFS 服务上面，如果您已经有相关服务，直接使用即可。如果没有，本文档提供 MinIO 的简单部署教程：

1. 在 MinIO 的[下载页面](https://min.io/download?license=agpl&platform=linux)选择合适的版本以及操作系统，下载对应的 Server 以及 Client 的二进制包或安装包。
2. 启动 MinIO Server
   ```bash
   export MINIO_REGION_NAME=us-east-1
   export MINIO_ROOT_USER=minio # 在较老版本中，该配置为 MINIO_ACCESS_KEY=minio
   export MINIO_ROOT_PASSWORD=minioadmin # 在较老版本中，该配置为 MINIO_SECRET_KEY=minioadmin
   nohup ./minio server /mnt/data 2>&1 &
   ```
3. 配置 MinIO Client
   ```bash
   # 如果你使用的是安装包安装的客户端，那么客户端名为 mcli，直接下载客户端二进制包，则其名为 mc
   ./mc config host add myminio http://127.0.0.1:9000 minio minioadmin
   ```
4. 创建一个桶
   ```bash
   ./mc mb myminio/doris
   ```
5. 验证是否正常工作
   ```bash
   # 上传一个文件
   ./mc mv test_file myminio/doris
   # 查看这个文件
   ./mc ls myminio/doris
   ```

## 6. 后续步骤

完成上述准备工作后，请参考以下文档继续部署：

1. [部署](./compilation-and-deployment.md)
2. [管理 Compute Group](./managing-compute-cluster.md)
3. [管理 Storage Vault](./managing-storage-vault.md)

## 7. 注意事项

- 确保所有节点的时间同步
- 定期备份 FoundationDB 数据
- 根据实际负载调整 FoundationDB 和 Doris 的配置参数

## 8. 参考资料

- [FoundationDB 官方文档](https://apple.github.io/foundationdb/index.html)
- [Apache Doris 官方网站](https://doris.apache.org/)
