---
{
    "title": "Doris 存算分离模式部署准备",
    "language": "zh-CN",
    "description": "本文档介绍了 Apache Doris 存算分离模式的部署准备工作。存算分离架构旨在提高系统的可扩展性和性能，适用于大规模数据处理场景。"
}
---

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

### 5.1 安装 FoundationDB

本节提供了脚本 `fdb_vars.sh` 和 `fdb_ctl.sh` 配置、部署和启动 FDB（FoundationDB）服务的分步指南。您可以下载 [doris tools](http://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-3.0.2-tools.tar.gz) 并从 `fdb` 目录获取 `fdb_vars.sh` 和 `fdb_ctl.sh`。

:::tip
Doris 默认依赖的 FDB 版本为 7.1.x 系列。若已提前安装 FDB，请确认其版本属于 7.1.x 系列，否则 Meta Service 将启动失败。
:::

#### 5.1.1 机器要求

通常，至少需要 3 台配备 SSD 的机器来形成具有双数据副本并允许单机故障的 FoundationDB 集群。
如果没有SSD, 也至少需要使用标准云盘或者本地盘以及标准的Posix 文件系统作为数据的存储,
否则可能 FoundationDB 不能正常工作, 比如不能 JuiceFS 等作为 FoundationDB 的存储.

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

FDB 集群部署完成后，您可以在每个节点上使用 `fdb_ctl.sh` 脚本启动 FDB 服务。

```bash
./fdb_ctl.sh start
```

此命令启动 FDB 服务，使集群工作并获取 FDB 集群连接字符串，后续可以用于配置 MetaService。

### 5.2 安装 OpenJDK 17

1. 下载 [OpenJDK 17](https://download.java.net/java/GA/jdk17.0.1/2a2082e5a09d4267845be086888add4f/12/GPL/openjdk-17.0.1_linux-x64_bin.tar.gz)
2. 解压并设置环境变量 JAVA_HOME.

## 6. 后续步骤

完成上述准备工作后，请参考以下文档继续部署：

1. [部署](./compilation-and-deployment.md)
2. [管理 Compute Group](./managing-compute-cluster.md)
3. [管理 Storage Vault](./managing-storage-vault.md)

## 7. 注意事项

- 确保所有节点的时间同步
- 定期备份 FoundationDB 数据
- 根据实际负载调整 FoundationDB 和 Doris 的配置参数
- 使用标准云盘或者本地盘以及标准的Posix 文件系统作为数据的存储, 否则 FoundationDB 可能不能正常工作
	* 比如不能 JuiceFS 等作为 FoundationDB 的存储

## 8. 参考资料

- [FoundationDB 官方文档](https://apple.github.io/foundationdb/index.html)
- [Apache Doris 官方网站](https://doris.apache.org/)
