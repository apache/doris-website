---
{
    "title": "远程存储",
    "language": "zh-CN",
    "description": "远程存储支持将冷数据放到外部存储（例如对象存储，HDFS）上。"
}
---

## 概述

远程存储支持将冷数据放到外部存储（例如对象存储，HDFS）上。

:::warning 注意
远程存储的数据只有一个副本，数据可靠性依赖远程存储的数据可靠性，您需要保证远程存储有 ec（擦除码）或者多副本技术确保数据可靠性。
:::

## 使用方法

### 冷数据保存到 S3 兼容存储

*第一步：* 创建 S3 Resource。

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
创建 S3 RESOURCE 的时候，会进行 S3 远端的链接校验，以保证 RESOURCE 创建的正确。
:::

*第二步：* 创建 STORAGE POLICY。

之后创建 STORAGE POLICY，关联上文创建的 RESOURCE：

```sql
CREATE STORAGE POLICY test_policy
PROPERTIES(
    "storage_resource" = "remote_s3",
    "cooldown_ttl" = "1d"
);
```

*第三步：* 建表时使用 STORAGE POLICY。

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
UNIQUE 表如果设置了 `"enable_unique_key_merge_on_write" = "true"` 的话，无法使用此功能。
:::

### 冷数据保存到 HDFS

*第一步：* 创建 HDFS RESOURCE：

```sql
CREATE RESOURCE "remote_hdfs" PROPERTIES (
        "type"="hdfs",
        "fs.defaultFS"="fs_host:default_fs_port",
        "hadoop.username"="hive",
        "hadoop.password"="hive",
        "root_path"="/my/root/path",
        "dfs.nameservices" = "my_ha",
        "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );
```

*第二步：* 创建 STORAGE POLICY。

```sql
CREATE STORAGE POLICY test_policy PROPERTIES (
    "storage_resource" = "remote_hdfs",
    "cooldown_ttl" = "300"
)
```

*第三步：* 使用 STORAGE POLICY 创建表。

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
UNIQUE 表如果设置了 `"enable_unique_key_merge_on_write" = "true"` 的话，无法使用此功能。
:::

### 存量表冷却到远程存储

除了新建表支持设置远程存储外，Doris 还支持对一个已存在的表或者 PARTITION，设置远程存储。

对一个已存在的表，设置远程存储，将创建好的 STORAGE POLICY 与表关联：

```sql
ALTER TABLE create_table_not_have_policy set ("storage_policy" = "test_policy");
```

对一个已存在的 PARTITION，设置远程存储，将创建好的 STORAGE POLICY 与 PARTITON 关联：

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy"="test_policy");
```

:::tip
注意，如果用户在建表时给整张 Table 和部分 Partition 指定了不同的 Storage Policy，Partition 设置的 Storage policy 会被忽略，整张表的所有 Partition 都会使用 table 的 Policy. 如果您需要让某个 Partition 的 Policy 和别的不同，则可以使用上文中对一个已存在的 Partition，关联 Storage policy 的方式修改。

具体可以参考 Docs 目录下[RESOURCE](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE)、 [POLICY](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY)、 [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)、 [ALTER TABLE](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN)等文档。
:::

### 配置 compaction

-   BE 参数`cold_data_compaction_thread_num`可以设置执行远程存储的 Compaction 的并发，默认是 2。

-   BE 参数`cold_data_compaction_interval_sec`可以设置执行远程存储的 Compaction 的时间间隔，默认是 1800，单位：秒，即半个小时。

## 限制

-   使用了远程存储的表不支持备份。

-   不支持修改远程存储的位置信息，比如 endpoint、bucket、path。

-   Unique 模型表在开启 Merge-on-Write 特性时，不支持设置远程存储。

-   Storage policy 支持创建、修改和删除，删除前需要先保证没有表引用此 Storage policy。

-   一旦设置了 Storage policy 之后，不能取消设置。


## 冷数据空间

### 查看

方式一：通过 show proc '/backends'可以查看到每个 BE 上传到对象的大小，RemoteUsedCapacity 项，此方式略有延迟。

方式二：通过 show tablets from tableName 可以查看到表的每个 tablet 占用的对象大小，RemoteDataSize 项。

### 垃圾回收

远程存储上可能会有如下情况产生垃圾数据：

1.  上传 rowset 失败但是有部分 segment 上传成功。

2.  上传的 rowset 没有在多副本达成一致。

3.  Compaction 完成后，参与 compaction 的 rowset。

垃圾数据并不会立即清理掉。BE 参数`remove_unused_remote_files_interval_sec`可以设置远程存储的垃圾回收的时间间隔，默认是 21600，单位：秒，即 6 个小时。

## 查询与性能优化

为了优化查询的性能和对象存储资源节省，引入了本地 Cache。在第一次查询远程存储的数据时，Doris 会将远程存储的数据加载到 BE 的本地磁盘做缓存，Cache 有以下特性：

-   Cache 实际存储于 BE 本地磁盘，不占用内存空间。

-   Cache 是通过 LRU 管理的，不支持 TTL。

具体配置请参考 (../../lakehouse/data-cache)。

## 常见问题

1.  `ERROR 1105 (HY000): errCode = 2, detailMessage = Failed to create repository: connect to s3 failed: Unable to marshall request to JSON: host must not be null.`

S3 SDK 默认使用 virtual-hosted style 方式。但某些对象存储系统 (如：minio) 可能没开启或没支持 virtual-hosted style 方式的访问，此时我们可以添加 use_path_style 参数来强制使用 path style 方式：

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

2. 修改冷却时间相关参数之后的行为表现是怎么样的？

   冷却时间相关的参数修改之后只对还未冷却到远程存储的数据生效，对于已经冷却到远程存储的数据不生效。比如将 `cooldown_ttl` 从 21 天修改为 7天，已经在远程存储的数据不会回到本地；