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

Doris 主键 (unique) 模型，从 Doris 2.0 开始，除了原来的 Merge-on-Read（MoR），也引入了 Merge-on-Write（MoW）的存储方式，MoR 是为了写入做优化，而 MoW 是为了更快的分析性能做优化。在实际测试中，MoW 存储方式的典型表，分析性能可以是 MoR 方式的 5-10 倍。

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
从 Doris 2.1 版本开始，写时合并是主键模型的默认方式。所以如果使用 Doris 2.1 及以上版本，务必要阅读相关建表文档。
:::

### 主键模型的两种更新方式

#### 使用`UPDATE`语句更新

无论是 MoR 还是 MoW，语义都是完成对指定列的更新。单次UPDATE的耗时会随着被更新的数据量的增加而增长。

#### 基于导入的批量更新

Doris 支持多种数据导入方式，包括 Stream Load、Broker Load、Routine Load 以及 Insert Into 等。对于主键表，所有导入操作默认采用“UPSERT”语义：当相同主键的记录不存在时执行插入操作，若记录已存在则进行更新操作。更新方式包括整行更新和部分列更新：

- **整行更新**：Unique Key 表的更新默认为整行更新。在导入数据时，用户可以选择提供所有字段，或仅提供部分字段。当用户只提供部分字段时，Doris 会用默认值填充缺失的字段，生成完整记录并进行更新。

- **部分列更新**：Unique Key MoW 支持部分列更新。用户可以通过设置会话变量 `enable_unique_key_partial_update = true` 或在 HTTP Header 中指定 `partial_columns:true` 来启用此功能。开启后，若导入数据的主键已存在，则仅更新指定的部分字段；若主键不存在，则使用默认值填充缺失字段。

我们会分别在文档 [主键模型的 Update 更新](../update/unique-update) 和 [主键模型的导入更新](../update/update-of-unique-model) 详细介绍两种更新方式。

### 主键模型的更新事务

#### 使用`UPDATE`语句更新数据

默认情况下，Doris 不允许在同一时间对同一张表进行多个`UPDATE`操作。`UPDATE`语句通过表级锁来确保事务的一致性。

用户可以通过修改 FE 配置`enable_concurrent_update=true`来调整并发限制。当放宽并发限制时，`UPDATE`语句将不再提供事务保证。

#### 基于导入的批量更新

Doris 对所有导入更新操作提供原子性保障，即每次导入数据要么全部成功应用，要么全部失败回滚。

对于并发导入更新，Doris 基于系统内部版本控制（按照导入完成提交的顺序进行分配），使用 MVCC 机制确定并发更新的顺序。

由于多个并发导入更新的提交顺序可能无法预期，若这些并发导入涉及相同主键的更新，则其生效顺序也无法预知，最终的可见结果会因此存在不确定性。为解决此问题，Doris 提供了 sequence 列机制，允许用户在并发导入更新时为每一行数据指定版本，以便明确控制并发更新的结果顺序，实现确定性。

我们将在文档[主键模型的更新事务](../update/unique-update-transaction.md) 中对事务机制进行详细介绍

## 聚合（Aggregate）模型的更新

聚合模型的更新，主要是指的是用新的列值和旧的聚合值按照聚合函数的要求产出新的聚合值。

New Agg Value = Agg Func ( Old Agg Value, New Column Value)

聚合模型只支持基于导入方式的更新，不支持使用 Update 语句更新。在定义聚合模型表的时候，如果把 value 列的聚合函数定义为 REPLACE_IF_NULL，也可以间接实现类似主键表的部分列更新能力。更多内容，请查看 [聚合模型的导入更新](../update/update-of-aggregate-model)。

## 不同模型/实现的更新能力对比

### 性能对比
|                | Unique Key MoW                                                                                                                                                                   | Unique Key MoR                                                                                                                                                                   | Aggregate Key |
|----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| 导入速度       | 导入过程中进行数据去重，小批量实时写入相比MoR约有10%-20%的性能损失，大批量导入（例如千万级/亿级数据）相比MoR约有30%-50%的性能损失                                                                                                      | 与Duplicate Key接近                                                                                                                                                                 | 与Duplicate Key接近  |
| 查询速度       | 与Duplicate Key接近                                                                                                                                                                 | 需要在查询期间进行去重，查询耗时约为 MoW 的3-10倍                                                                                                                                                    | 如果聚合函数为REPLACE/REPLACE_IF_NOT_NULL，查询速度与MoR接近 |
| 谓词下推       | 支持                                                                                                                                                                               | 不支持                                                                                                                                                                              | 不支持        |
| 资源消耗       | - **导入资源消耗**：相比Duplicate Key/Unique Key MoR，约额外消耗约10%-30%的CPU。<br /> - **查询资源消耗**：与Duplicate Key接近，无额外资源消耗。<br /> - **Compaction资源消耗**：相比Duplicate Key，消耗更多内存和CPU，具体取决于数据特征和数据量。 | - **导入资源消耗**：与Duplicate Key相近，无额外资源消耗。<br /> - **查询资源消耗**：相比Duplicate Key/Unique Key MoW，查询时额外消耗更多的CPU和内存。<br /> - **Compaction资源消耗**：相比Duplicate Key，需更多内存和CPU，具体数值取决于数据特征和数据量。 | 与Unique Key MoR相同 |

### 功能支持对比
|                | Unique Key MoW | Unique Key MoR | Aggregate Key  |
|----------------|----------------|----------------|----------------|
| UPDATE         |支持|支持| 不支持            |
| DELETE         |支持|支持| 不支持            |
| sequence列     |支持|支持| 不支持            |
| delete_sign    |支持|支持| 不支持            |
| 部分列更新     |支持|不支持| 支持(但无法更新null值) |
| 倒排索引       |支持|不支持| 不支持            |
