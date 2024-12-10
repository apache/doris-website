---
{
    "title": "主键模型",
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


当用户有数据更新需求时，可以选择使用主键数据模型（Unique）。主键模型能够保证 Key（主键）的唯一性，当用户更新一条数据时，新写入的数据会覆盖具有相同 key（主键）的旧数据。

**主键模型提供了两种实现方式：**

- 写时合并 (merge-on-write)。在 1.2 版本中，我们引入了写时合并实现，该实现会在数据写入阶段完成所有数据去重的工作，因此能够提供非常好的查询性能。自 2.1 版本起，写时合并经过两个大版本的打磨，已经非常成熟稳定，由于其优秀的查询性能，写时合并成为 Unique 模型的默认实现。

- 读时合并 (merge-on-read)。在读时合并实现中，用户在进行数据写入时不会触发任何数据去重相关的操作，所有数据去重的操作都在查询或者 compaction 时进行。因此，读时合并的写入性能较好，查询性能较差，同时内存消耗也较高。

**数据更新的语义**

- Unique 模型默认的更新语义为**整行`UPSERT`**，即 UPDATE OR INSERT，该行数据的 key 如果存在，则进行更新，如果不存在，则进行新数据插入。在整行`UPSERT`语义下，即使用户使用 insert into 指定部分列进行写入，Doris 也会在 Planner 中将未提供的列使用 NULL 值或者默认值进行填充。

- 部分列更新。如果用户希望更新部分字段，需要使用写时合并实现，并通过特定的参数来开启部分列更新的支持。请查阅文档[部分列更新](../../data-operate/update/update-of-unique-model)。

下面以一个典型的用户基础信息表，来看看如何建立读时合并和写时合并的主键模型表。这个表数据没有聚合需求，只需保证主键唯一性。（这里的主键为 user_id + username）。

| ColumnName    | Type         | IsKey | Comment      |
| ------------- | ------------ | ----- | ------------ |
| user_id       | BIGINT       | Yes   | 用户 id       |
| username      | VARCHAR(50)  | Yes   | 用户昵称     |
| city          | VARCHAR(20)  | No    | 用户所在城市 |
| age           | SMALLINT     | No    | 用户年龄     |
| sex           | TINYINT      | No    | 用户性别     |
| phone         | LARGEINT     | No    | 用户电话     |
| address       | VARCHAR(500) | No    | 用户住址     |
| register_time | DATETIME     | No    | 用户注册时间 |


## 写时合并

写时合并建表语句为：

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    `user_id` LARGEINT NOT NULL COMMENT "用户id",
    `username` VARCHAR(50) NOT NULL COMMENT "用户昵称",
    `city` VARCHAR(20) COMMENT "用户所在城市",
    `age` SMALLINT COMMENT "用户年龄",
    `sex` TINYINT COMMENT "用户性别",
    `phone` LARGEINT COMMENT "用户电话",
    `address` VARCHAR(500) COMMENT "用户地址",
    `register_time` DATETIME COMMENT "用户注册时间"
)
UNIQUE KEY(`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 3"
);
```
## 读时合并

读时合并的建表语句如下：

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    `user_id` LARGEINT NOT NULL COMMENT "用户id",
    `username` VARCHAR(50) NOT NULL COMMENT "用户昵称",
    `city` VARCHAR(20) COMMENT "用户所在城市",
    `age` SMALLINT COMMENT "用户年龄",
    `sex` TINYINT COMMENT "用户性别",
    `phone` LARGEINT COMMENT "用户电话",
    `address` VARCHAR(500) COMMENT "用户地址",
    `register_time` DATETIME COMMENT "用户注册时间"
)
UNIQUE KEY(`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 3",
"enable_unique_key_merge_on_write" = "false"
);
```

用户需要在建表时添加下面的 property 来开启读时合并。

```Plain
"enable_unique_key_merge_on_write" = "false"
```
:::caution
在 2.1 版本中，写时合并将会是主键模型的默认方式。

对于新用户，强烈推荐使用 2.0 及其以上版本。在 2.0 版本中，写时合并的性能和稳定性都有大幅的提升和优化。

对于 1.2 的用户

- 建议使用 1.2.4 及以上版本，该版本修复了一些 bug 和稳定性问题。
- 在 be.conf 中添加配置项：disable_storage_page_cache=false。不添加该配置项可能会对数据导入性能产生较大影响

:::

## 使用注意

-   Unique 表的实现方式只能在建表时确定，无法通过 schema change 进行修改。

-   旧的 Merge-on-Read 的实现无法无缝升级到 Merge-on-Write 的实现（数据组织方式完全不同），如果需要改为使用写时合并的实现版本，需要手动执行 `insert into unique-mow-table select * from source table` 来重新导入。

-   整行更新：Unique 模型默认的更新语义为整行 `UPSERT`，即 UPDATE OR INSERT，该行数据的 key 如果存在，则进行更新，如果不存在，则进行新数据插入。在整行 `UPSERT` 语义下，即使用户使用 insert into 指定部分列进行写入，Doris 也会在 Planner 中将未提供的列使用 NULL 值或者默认值进行填充

-   部分列更新。如果用户希望更新部分字段，需要使用写时合并实现，并通过特定的参数来开启部分列更新的支持。请查阅文档[部分列更新](../../data-operate/update/update-of-unique-model)获取相关使用建议。