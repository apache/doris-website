---
{
    "title": "数据更新概述",
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

数据更新，主要指针对相同 Key 的数据 Value 列的值的更新，这个更新对于主键模型来说，就是替换，对于聚合模型来说，就是如何完成针对 value 列上的聚合。

## 主键（Unique）模型的更新

Doris 主键 (unique) 模型，从 Doris 2.0 开始，除了原来的 Merge on Read（MoR），也引入了 Merge on Write（MoW）的存储方式，MoR 是为了写入做优化，而 MoW 是为了更快的分析性能做优化。在实际测试中，MoW 存储方式的典型表，分析性能可以是 MoR 方式的 5-10 倍。

在 Doris 2.0，默认创建的 unique 模型依旧是 MoR 的，如果要创建 MoW 的，需要通过参数 "enable_unique_key_merge_on_write" = "true" 手动指定，如下示例：

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique_merge_on_write
(
    `user_id` LARGEINT NOT NULL,
    `username` VARCHAR(50) NOT NULL ,
    `city` VARCHAR(20),
    `age` SMALLINT,
    `sex` TINYINT,
    `phone` LARGEINT,
    `address` VARCHAR(500),
    `register_time` DATETIME
)
UNIQUE KEY(`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"enable_unique_key_merge_on_write" = "true"
);
```

:::caution
在 Doris 2.1 版本中，写时合并将会是主键模型的默认方式。所以如果使用 Doris 2.1 版本，务必要阅读相关建表文档。
:::

### 主键模型的两种更新方式

- 使用 Update 语句更新

无论是 MoR 还是 MoW，语义都是完成对指定列的更新。这个适合少量数据，不频繁的更新。

- 基于导入的批量更新

Doris 支持 Stream Load、Broker Load、Routine Load、Insert Into 等多种导入方式，对于主键表，所有的导入都是“UPSERT”的语义，即如果相同 Key 的行不存在，则插入。对于已经存在的记录，则进行更新。

- 如果更新的是所有列，MoR 和 MoW 的语义是一样的，都是覆盖相同 Key 的所有 Value 列。

- 如果更新的是部分列，MoR 和 MoW 的默认语义是一样的，即使用表 Schema 中缺失列的默认值作为缺失列的值，去覆盖旧的记录。

- 如果更新的是部分列，主键模型采用的是 MoW，并且设置了 MySQL Session 变量 partial_columns = true 或者 HTTP Header partial_columns:true，则被更新的缺失列的值，不是再使用表 Schema 中缺失列的默认值，而是已经存在记录的对应缺失列的值。

我们会分别在文档 主键模型的 Update 更新 和 主键模型的导入更新 详细介绍两种更新方式。

### 主键模型的更新事务

无论是使用 Update 语句更新，还是基于导入的批量更新，都可能有多个更新语句或者导入作业在进行，那么多个更新如何生效，如何确保更新的原子性，如何防止数据的不一致，这就是主键模型的更新事务。

主键模型的更新事务 文档会介绍这块内容。在这篇文档中，我们会重点介绍通过引入隐藏列__**DORIS_SEQUENCE_COL__，**如何实现让开发者自己控制哪一个更新生效，这样通过与开发者协同，可以实现更好的更新事务。

## 聚合（Aggregate）模型的更新

上面提到的主键模型的更新方式，更多指的是对于相同的 Key，用新的值替换旧的值。而聚合模型的更新，主要是指的是用新的列值和旧的聚合值按照聚合函数的要求产出新的聚合值。

New Agg Value = Agg Func ( Old Agg Value + New Column Value)

聚合模型只支持基于导入方式的更新，不支持使用 Update 语句更新。

在定义聚合模型表的时候，如果把 value 列的聚合函数定义为 REPLACE_IF_NULL，也可以间接实现类似主键表的部分列更新能力。

更多内容，请查看 聚合模型的导入更新。