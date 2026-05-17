---
{
    "title": "本地-远程分层存储",
    "language": "zh-CN",
    "description": "Apache Doris 远程存储（Remote Storage）支持将冷数据自动迁移至 S3 兼容对象存储或 HDFS，降低本地存储成本，适用于冷热数据分层场景。",
    "keywords": [
        "Doris 远程存储",
        "冷热分层",
        "冷数据归档",
        "S3 对象存储",
        "HDFS 存储",
        "Storage Policy",
        "cooldown_ttl"
    ]
}
---

<!-- 知识类型: 功能介绍 + 操作步骤 + 配置参数 -->
<!-- 适用场景: 冷热数据分层 / 降低存储成本 / 历史数据归档 -->


本地-远程分层存储是 Apache Doris 提供的冷热数据分层能力，支持将冷数据自动迁移至外部存储系统（如 S3 兼容对象存储或 HDFS），从而降低本地磁盘占用与整体存储成本。

**适用场景**：

- 历史数据归档：将访问频率低的历史数据迁移至低成本对象存储。
- 冷热分层：热数据保留在本地 SSD/HDD，冷数据下沉至远程存储。
- 存储成本优化：通过对象存储替代本地高性能存储，降低 TCO。

:::warning 注意
远程存储的数据**只有一个副本**，数据可靠性依赖于远程存储自身的可靠性保障。请确保远程存储已启用 EC（擦除码）或多副本机制。
:::

## 快速导航

| 章节 | 内容 |
| --- | --- |
| [冷数据保存到 S3 兼容存储](#冷数据保存到-s3-兼容存储) | 将冷数据下沉至 S3 兼容对象存储 |
| [冷数据保存到 HDFS](#冷数据保存到-hdfs) | 将冷数据下沉至 HDFS |
| [存量表冷却到远程存储](#存量表冷却到远程存储) | 为已存在的表或分区设置远程存储 |
| [配置 Compaction](#配置-compaction) | 调整远程存储的 Compaction 行为 |
| [使用限制](#使用限制) | 远程存储的功能限制 |
| [冷数据空间管理](#冷数据空间管理) | 查看与回收冷数据 |
| [查询与性能优化](#查询与性能优化) | 本地 Cache 机制 |
| [常见问题（FAQ）](#常见问题-faq) | 错误排查与配置说明 |

## 使用方法

<!-- 知识类型: 操作步骤 -->

远程存储的使用流程统一为三步：**创建 Resource → 创建 Storage Policy → 建表/改表关联 Policy**。

### 冷数据保存到 S3 兼容存储

<!-- 适用场景: 使用 AWS S3、MinIO、阿里云 OSS、腾讯云 COS 等对象存储 -->

#### 第一步：创建 S3 Resource

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "bj.s3.com",
    "s3.region" = "bj",
    "s3.bucket" = "test-bucket",
    "s3.root.path" = "path/to/root",
    "s3.access_key" = "bbb",
    "s3.secret_key" = "aaaa",
    "s3.connection.maximum" = "50",
    "s3.connection.request.timeout" = "3000",
    "s3.connection.timeout" = "1000"
);
```

:::tip
创建 S3 Resource 时会进行远端连接校验，确保 Resource 配置正确。
:::

#### 第二步：创建 Storage Policy

关联上一步创建的 Resource：

```sql
CREATE STORAGE POLICY test_policy
PROPERTIES(
    "storage_resource" = "remote_s3",
    "cooldown_ttl" = "1d"
);
```

#### 第三步：建表时使用 Storage Policy

```sql
CREATE TABLE IF NOT EXISTS create_table_use_created_policy
(
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048)
)
UNIQUE KEY(k1)
DISTRIBUTED BY HASH (k1) BUCKETS 3
PROPERTIES(
    "enable_unique_key_merge_on_write" = "false",
    "storage_policy" = "test_policy"
);
```

:::warning 注意
Unique 表如果设置了 `"enable_unique_key_merge_on_write" = "true"`，无法使用远程存储功能。
:::

### 冷数据保存到 HDFS

<!-- 适用场景: 已有 Hadoop/HDFS 集群作为冷数据存储池 -->

#### 第一步：创建 HDFS Resource

```sql
CREATE RESOURCE "remote_hdfs" PROPERTIES (
    "type" = "hdfs",
    "fs.defaultFS" = "fs_host:default_fs_port",
    "hadoop.username" = "hive",
    "hadoop.password" = "hive",
    "root_path" = "/my/root/path",
    "dfs.nameservices" = "my_ha",
    "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
    "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
    "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
    "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

#### 第二步：创建 Storage Policy

```sql
CREATE STORAGE POLICY test_policy PROPERTIES (
    "storage_resource" = "remote_hdfs",
    "cooldown_ttl" = "300"
);
```

#### 第三步：使用 Storage Policy 创建表

```sql
CREATE TABLE IF NOT EXISTS create_table_use_created_policy (
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048)
)
UNIQUE KEY(k1)
DISTRIBUTED BY HASH (k1) BUCKETS 3
PROPERTIES(
    "enable_unique_key_merge_on_write" = "false",
    "storage_policy" = "test_policy"
);
```

:::warning 注意
Unique 表如果设置了 `"enable_unique_key_merge_on_write" = "true"`，无法使用远程存储功能。
:::

### 存量表冷却到远程存储

<!-- 适用场景: 已存在的表或分区需要追加远程存储能力 -->

除新建表外，Doris 还支持为已存在的表或分区（PARTITION）设置远程存储。

**为整张表设置远程存储**：

```sql
ALTER TABLE create_table_not_have_policy SET ("storage_policy" = "test_policy");
```

**为指定分区设置远程存储**：

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy" = "test_policy");
```

:::tip 表级与分区级 Policy 的优先级
如果建表时同时为整张表和部分分区指定了**不同的** Storage Policy，分区级 Policy 会被忽略，整张表的所有分区都会使用表级 Policy。

如需为某个分区设置不同的 Policy，请使用上述 `ALTER TABLE ... MODIFY PARTITION` 的方式修改。

更多语法详见：

- [CREATE RESOURCE](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE)
- [CREATE STORAGE POLICY](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY)
- [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)
- [ALTER TABLE](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN)
:::

### 配置 Compaction

<!-- 知识类型: 配置参数 -->

远程存储的 Compaction 行为通过 BE 参数控制：

| 参数名 | 默认值 | 单位 | 说明 |
| --- | --- | --- | --- |
| `cold_data_compaction_thread_num` | 2 | 个 | 远程存储 Compaction 的并发线程数 |
| `cold_data_compaction_interval_sec` | 1800 | 秒 | 远程存储 Compaction 的执行时间间隔（默认 30 分钟） |

## 使用限制

<!-- 知识类型: 功能限制 -->

远程存储功能存在以下限制：

- 已使用远程存储的表**不支持备份**。
- **不支持修改**远程存储的位置信息（如 endpoint、bucket、path）。
- Unique 模型表在开启 Merge-on-Write 特性时，**不支持**设置远程存储。
- Storage Policy 支持创建、修改和删除；**删除前必须确保没有表引用**该 Storage Policy。
- 表一旦设置了 Storage Policy，**不能取消**。

## 冷数据空间管理

### 查看冷数据使用量

可通过两种方式查看冷数据空间占用：

| 方式 | 命令 | 字段 | 特点 |
| --- | --- | --- | --- |
| 方式一 | `SHOW PROC '/backends'` | `RemoteUsedCapacity` | 查看每个 BE 上传的对象总大小，**略有延迟** |
| 方式二 | `SHOW TABLETS FROM tableName` | `RemoteDataSize` | 查看每个 Tablet 占用的对象大小 |

### 垃圾回收

远程存储中可能产生垃圾数据的场景：

1. 上传 Rowset 失败但有部分 Segment 上传成功。
2. 上传的 Rowset 未在多副本间达成一致。
3. Compaction 完成后，参与 Compaction 的旧 Rowset。

**回收策略**：垃圾数据不会立即清理。可通过 BE 参数 `remove_unused_remote_files_interval_sec` 控制回收间隔，默认 `21600` 秒（6 小时）。

## 查询与性能优化

<!-- 知识类型: 性能优化 -->

为优化查询性能并节省对象存储 API 调用成本，Doris 引入了**本地 Cache** 机制：首次查询远程存储数据时，Doris 会将其加载到 BE 本地磁盘作为缓存。

**Cache 特性**：

- 实际存储于 BE 本地磁盘，**不占用内存**。
- 通过 LRU（最近最少使用）策略管理，**不支持 TTL**。

具体配置请参考 [Data Cache](../../lakehouse/data-cache) 文档。

## 常见问题（FAQ） {#常见问题-faq}
<!-- 知识类型: Troubleshooting -->

### Q1：创建 S3 Resource 报错 `host must not be null` 怎么办？

**报错信息**：

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Failed to create repository:
connect to s3 failed: Unable to marshall request to JSON: host must not be null.
```

**原因**：S3 SDK 默认使用 virtual-hosted style 方式访问，但部分对象存储（如 MinIO）未启用或不支持该方式。

**解决方案**：在 Resource 配置中添加 `"use_path_style" = "true"`，强制使用 path style 访问：

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "bj.s3.com",
    "s3.region" = "bj",
    "s3.bucket" = "test-bucket",
    "s3.root.path" = "path/to/root",
    "s3.access_key" = "bbb",
    "s3.secret_key" = "aaaa",
    "s3.connection.maximum" = "50",
    "s3.connection.request.timeout" = "3000",
    "s3.connection.timeout" = "1000",
    "use_path_style" = "true"
);
```

### Q2：修改 `cooldown_ttl` 等冷却时间参数后的行为如何？

冷却时间相关参数修改后，**仅对尚未冷却到远程存储的数据生效**，对已经冷却到远程存储的数据不生效。

**示例**：将 `cooldown_ttl` 从 21 天调整为 7 天，已经位于远程存储的数据**不会回到本地**。

### Q3：哪些表模型不支持远程存储？

Unique 模型表在开启 Merge-on-Write（即 `"enable_unique_key_merge_on_write" = "true"`）时不支持远程存储。其他模型（Duplicate、Aggregate、Unique 关闭 MoW）均支持。

### Q4：远程存储的数据可靠性如何保证？

Doris 在远程存储中**只保留一个副本**，数据可靠性完全依赖远程存储自身。建议远程存储启用 **EC（擦除码）** 或 **多副本** 等机制以保障数据安全。
