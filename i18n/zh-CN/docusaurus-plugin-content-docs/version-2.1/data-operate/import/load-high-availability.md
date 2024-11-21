---
{
    "title": "导入高可用性",
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

# 导入高可用性

## 概述

Doris 在数据导入过程中提供了多种机制来确保高可用性。本文将详细介绍 Doris 的默认导入行为以及为提高导入可用性而提供的额外选项，特别是最小写入副本数功能。

## 多数派写入

默认情况下，Doris 采用多数派写入策略来确保数据的可靠性和一致性：

- 当成功写入的副本数超过总副本数的一半时，导入被视为成功。
- 例如，对于三副本的表，至少需要两个副本写入成功才算导入成功。

### 工作原理

1. 数据分发：导入任务首先将数据分发到所有相关的 BE 节点。

2. 并行写入：各个 BE 节点并行处理数据写入操作。

3. 写入确认：每个 BE 节点在完成数据写入后，会向 FE 发送确认信息。

4. 多数派判断：FE 统计成功写入的副本数，当达到多数派时，认为导入成功。

5. 事务提交：FE 提交导入事务，使数据对外可见。

6. 异步复制：对于未成功写入的副本，系统会在后台异步进行数据复制，以确保最终所有副本的数据一致性。

多数派写入策略是 Doris 在数据可靠性和系统可用性之间的一个平衡。对于有特殊需求的场景，Doris 提供了最小写入副本数等其他选项来进一步提高系统的灵活性。

## 最小写入副本数

多数派写入策略在保证数据可靠性的同时，也可能在某些场景下影响系统的可用性。例如，在两副本的情况下，必须两个副本都写入成功才能完成导入，这意味着在导入过程中不允许任何一个副本不可用。

为了解决上述问题并提高导入的可用性，Doris 提供了最小写入副本数（Min Load Replica Num）选项。

### 功能说明

最小写入副本数允许用户指定导入数据时需要成功写入的最少副本数。当成功写入的副本数大于或等于这个值时，导入即视为成功。

### 使用场景

- 在部分节点不可用时，仍需要保证数据能够成功导入。

- 对数据导入速度有较高要求，愿意在一定程度上牺牲可靠性来换取更高的可用性。

### 配置方法

#### 1. 单表配置

a. 创建表时设置：

```sql
CREATE TABLE example_table
(
id INT,
name STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES
(
'replication_num' = '3',
'min_load_replica_num' = '2'
);
```

b. 修改现有表：

```sql
ALTER TABLE example_table
SET ( 'min_load_replica_num' = '2' );
```

#### 2. 全局配置
通过 FE 配置项 `min_load_replica_num` 设置。

- 有效值：大于 0

- 默认值：-1（表示不开启全局最小写入副本数）

优先级：表属性 > 全局配置 > 默认多数派规则

如果表属性未设置或无效，且全局配置有效，则表的最小写入副本数为：
`min(FE配置的min_load_replica_num，表的副本数/2 + 1)`

关于 FE 配置项的查看和修改，请参考[FE 配置项文档](../../admin-manual/config/fe-config.md)。

## 其他高可用性机制

除了最小写入副本数选项，Doris 还采用了以下机制来提高导入的可用性：

1. 导入重试：自动重试因临时故障导致的失败导入任务。

2. 负载均衡：将导入任务分散到不同的 BE 节点，避免单点压力过大。

3. 事务机制：确保数据的一致性，失败时自动回滚。
