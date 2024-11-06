---
{
    "title": "冷热数据分层",
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
## 需求场景

未来一个很大的使用场景是类似于 ES 日志存储，日志场景下数据会按照日期来切割数据，很多数据是冷数据，查询很少，需要降低这类数据的存储成本。从节约存储成本角度考虑：

-   各云厂商普通云盘的价格都比对象存储贵

-   在 Doris 集群实际线上使用中，普通云盘的利用率无法达到 100%

-   云盘不是按需付费，而对象存储可以做到按需付费

-   基于普通云盘做高可用，需要实现多副本，某副本异常要做副本迁移。而将数据放到对象存储上则不存在此类问题，因为对象存储是共享的。

## 解决方案

在 Partition 级别上设置 Freeze time，表示多久这个 Partition 会被 Freeze，并且定义 Freeze 之后存储的 Remote storage 的位置。在 BE 上 daemon 线程会周期性的判断表是否需要 freeze，若 freeze 后会将数据上传到兼容 S3 协议的对象存储和 HDFS 上。

冷热分层支持所有 Doris 功能，只是把部分数据放到对象存储上，以节省成本，不牺牲功能。因此有如下特点：

-   冷数据放到对象存储上，用户无需担心数据一致性和数据安全性问题
-   灵活的 Freeze 策略，冷却远程存储 Property 可以应用到表和 Partition 级别

-   用户查询数据，无需关注数据分布位置，若数据不在本地，会拉取对象上的数据，并 cache 到 BE 本地

-   副本 clone 优化，若存储数据在对象上，则副本 clone 的时候不用去拉取存储数据到本地

-   远程对象空间回收 recycler，若表、分区被删除，或者冷热分层过程中异常情况产生的空间浪费，则会有 recycler 线程周期性的回收，节约存储资源

-   cache 优化，将访问过的冷数据 cache 到 BE 本地，达到非冷热分层的查询性能

-   BE 线程池优化，区分数据来源是本地还是对象存储，防止读取对象延时影响查询性能

## Storage policy 的使用

存储策略是使用冷热分层功能的入口，用户只需要在建表或使用 Doris 过程中，给表或分区关联上 Storage policy，即可以使用冷热分层的功能。

:::tip
创建 S3 RESOURCE 的时候，会进行 S3 远端的链接校验，以保证 RESOURCE 创建的正确。
:::

下面演示如何创建 S3 RESOURCE：

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

CREATE STORAGE POLICY test_policy
PROPERTIES(
    "storage_resource" = "remote_s3",
    "cooldown_ttl" = "1d"
);

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

以及如何创建 HDFS RESOURCE：

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

或者对一个已存在的表，关联 Storage policy

```sql
ALTER TABLE create_table_not_have_policy set ("storage_policy" = "test_policy");
```

或者对一个已存在的 partition，关联 Storage policy

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy"="test_policy");
```

:::tip
注意，如果用户在建表时给整张 Table 和部分 Partition 指定了不同的 Storage Policy，Partition 设置的 Storage policy 会被无视，整张表的所有 Partition 都会使用 table 的 Policy. 如果您需要让某个 Partition 的 Policy 和别的不同，则可以使用上文中对一个已存在的 Partition，关联 Storage policy 的方式修改。

具体可以参考 Docs 目录下[RESOURCE](../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-RESOURCE)、 [POLICY](../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-POLICY)、 [CREATE TABLE](../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE)、 [ALTER TABLE](../sql-manual/sql-reference/Data-Definition-Statements/Alter/ALTER-TABLE-COLUMN)等文档，里面有详细介绍。
:::

### 一些限制

-   单表或单 Partition 只能关联一个 Storage policy，关联后不能 Drop 掉 Storage policy，需要先解除二者的关联。

-   Storage policy 关联的对象信息不支持修改数据存储 path 的信息，比如 bucket、endpoint、root_path 等信息

-   Storage policy 支持创建 和修改和支持删除，删除前需要先保证没有表引用此 Storage policy。

-   Unique 模型在开启 Merge-on-Write 特性时，不支持设置 Storage policy。

## 冷数据占用对象大小

方式一：通过 show proc '/backends'可以查看到每个 BE 上传到对象的大小，RemoteUsedCapacity 项，此方式略有延迟。

方式二：通过 show tablets from tableName 可以查看到表的每个 tablet 占用的对象大小，RemoteDataSize 项。

## 冷数据的 cache

上文提到冷数据为了优化查询的性能和对象存储资源节省，引入了 cache 的概念。在冷却后首次命中，Doris 会将已经冷却的数据又重新加载到 BE 的本地磁盘，cache 有以下特性：

-   cache 实际存储于 BE 磁盘，不占用内存空间。

-   cache 可以限制膨胀，通过 LRU 进行数据的清理

-   cache 的实现和联邦查询 Catalog 的 cache 是同一套实现，文档参考[此处](../lakehouse/filecache)

## 冷数据的 Compaction

冷数据传入的时间是数据 rowset 文件写入本地磁盘时刻起，加上冷却时间。由于数据并不是一次性写入和冷却的，因此避免在对象存储内的小文件问题，Doris 也会进行冷数据的 Compaction。但是，冷数据的 Compaction 的频次和资源占用的优先级并不是很高，也推荐本地热数据 compaction 后再执行冷却。具体可以通过以下 BE 参数调整：

-   BE 参数`cold_data_compaction_thread_num`可以设置执行冷数据的 Compaction 的并发，默认是 2。

-   BE 参数`cold_data_compaction_interval_sec`可以设置执行冷数据的 Compaction 的时间间隔，默认是 1800，单位：秒，即半个小时。。

## 冷数据的 Schema Change

数据冷却后支持 Schema Change 类型如下：

-   增加、删除列

-   修改列类型

-   调整列顺序

-   增加、修改索引

## 冷数据的垃圾回收

冷数据的垃圾数据是指没有被任何 Replica 使用的数据，对象存储上可能会有如下情况产生的垃圾数据：

1.  上传 rowset 失败但是有部分 segment 上传成功。

2.  FE 重新选 CooldownReplica 后，新旧 CooldownReplica 的 rowset version 不一致，FollowerReplica 都去同步新 CooldownReplica 的 CooldownMeta，旧 CooldownReplica 中 version 不一致的 rowset 没有 Replica 使用成为垃圾数据。

3.  冷数据 Compaction 后，合并前的 rowset 因为还可能被其他 Replica 使用不能立即删除，但是最终 FollowerReplica 都使用了最新的合并后的 rowset，合并前的 rowset 成为垃圾数据。

另外，对象上的垃圾数据并不会立即清理掉。BE 参数`remove_unused_remote_files_interval_sec`可以设置冷数据的垃圾回收的时间间隔，默认是 21600，单位：秒，即 6 个小时。

## 未尽事项

-   一些远端占用指标更新获取不够完善

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

