---
{
    "title": "远程存储",
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

## 功能简介

远程存储支持把部分数据放到外部存储（例如对象存储，HDFS）上，节省成本，不牺牲功能。

:::warning 注意
远程存储的数据只有一个副本，数据可靠性依赖远程存储的数据可靠性，您需要保证远程存储有ec（擦除码）或者多副本技术确保数据可靠性。
:::

## 使用方法

以S3对象存储为例，首先创建S3 RESOURCE：

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

之后创建STORAGE POLICY，关联上文创建的RESOURCE：

```sql
CREATE STORAGE POLICY test_policy
PROPERTIES(
    "storage_resource" = "remote_s3",
    "cooldown_ttl" = "1d"
);
```

最后建表的时候指定STORAGE POLICY：

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

创建 HDFS RESOURCE：

```sql
CREATE RESOURCE "remote_hdfs" PROPERTIES (
        "type"="hdfs",
        "fs.defaultFS"="fs_host:default_fs_port",
        "hadoop.username"="hive",
        "hadoop.password"="hive",
        "dfs.nameservices" = "my_ha",
        "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );

    CREATE STORAGE POLICY test_policy PROPERTIES (
        "storage_resource" = "remote_hdfs",
        "cooldown_ttl" = "300"
    )

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

除了新建表支持设置远程存储外，Doris还支持对一个已存在的表或者PARTITION，设置远程存储。

对一个已存在的表，设置远程存储，将创建好的STORAGE POLICY与表关联：

```sql
ALTER TABLE create_table_not_have_policy set ("storage_policy" = "test_policy");
```

对一个已存在的PARTITION，设置远程存储，将创建好的STORAGE POLICY与PARTITON关联：

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy"="test_policy");
```

:::tip
注意，如果用户在建表时给整张 Table 和部分 Partition 指定了不同的 Storage Policy，Partition 设置的 Storage policy 会被无视，整张表的所有 Partition 都会使用 table 的 Policy. 如果您需要让某个 Partition 的 Policy 和别的不同，则可以使用上文中对一个已存在的 Partition，关联 Storage policy 的方式修改。

具体可以参考 Docs 目录下[RESOURCE](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-RESOURCE)、 [POLICY](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-POLICY)、 [CREATE TABLE](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE)、 [ALTER TABLE](../../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-COLUMN)等文档，里面有详细介绍。
:::

### 一些限制

-   单表或单 Partition 只能关联一个 Storage policy，关联后不能 Drop 掉 Storage policy，需要先解除二者的关联。

-   Storage policy 关联的对象信息不支持修改数据存储 path 的信息，比如 bucket、endpoint、root_path 等信息

-   Storage policy 支持创建、修改和删除，删除前需要先保证没有表引用此 Storage policy。

-   Unique 模型在开启 Merge-on-Write 特性时，不支持设置 Storage policy。

## 查看远程存储占用大小

方式一：通过 show proc '/backends'可以查看到每个 BE 上传到对象的大小，RemoteUsedCapacity 项，此方式略有延迟。

方式二：通过 show tablets from tableName 可以查看到表的每个 tablet 占用的对象大小，RemoteDataSize 项。

## 远程存储的 cache

为了优化查询的性能和对象存储资源节省，引入了 cache 的概念。在第一次查询远程存储的数据时，Doris 会将远程存储的数据加载到 BE 的本地磁盘做缓存，cache 有以下特性：

-   cache 实际存储于 BE 磁盘，不占用内存空间。

-   cache 可以限制膨胀，通过 LRU 进行数据的清理

-   cache 的实现和联邦查询 Catalog 的 cache 是同一套实现，文档参考[此处](../../lakehouse/filecache)

## 远程存储的 Compaction

远程存储数据传入的时间是 rowset 文件写入本地磁盘时刻起，加上冷却时间。由于数据并不是一次性写入和冷却的，因此避免在对象存储内的小文件问题，Doris 也会进行远程存储数据的 Compaction。但是，远程存储数据的 Compaction 的频次和资源占用的优先级并不是很高，也推荐本地热数据 compaction 后再执行冷却。具体可以通过以下 BE 参数调整：

-   BE 参数`cold_data_compaction_thread_num`可以设置执行远程存储的 Compaction 的并发，默认是 2。

-   BE 参数`cold_data_compaction_interval_sec`可以设置执行远程存储的 Compaction 的时间间隔，默认是 1800，单位：秒，即半个小时。。

## 远程存储的 Schema Change

远程存储支持 Schema Change 类型如下：

-   增加、删除列

-   修改列类型

-   调整列顺序

-   增加、修改索引

## 远程存储的垃圾回收

远程存储的垃圾数据是指没有被任何 Replica 使用的数据，对象存储上可能会有如下情况产生的垃圾数据：

1.  上传 rowset 失败但是有部分 segment 上传成功。

2.  FE 重新选 CooldownReplica 后，新旧 CooldownReplica 的 rowset version 不一致，FollowerReplica 都去同步新 CooldownReplica 的 CooldownMeta，旧 CooldownReplica 中 version 不一致的 rowset 没有 Replica 使用成为垃圾数据。

3.  远程存储数据 Compaction 后，合并前的 rowset 因为还可能被其他 Replica 使用不能立即删除，但是最终 FollowerReplica 都使用了最新的合并后的 rowset，合并前的 rowset 成为垃圾数据。

另外，对象上的垃圾数据并不会立即清理掉。BE 参数`remove_unused_remote_files_interval_sec`可以设置远程存储的垃圾回收的时间间隔，默认是 21600，单位：秒，即 6 个小时。

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

