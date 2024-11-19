---
{
    "title": "优化表 Schema 设计",
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

Schema 设计和调优中，表的 Schema 设计是其中重要的一部分，包括表引擎选择、分区分桶列选择、分区分桶大小设置、key 列和字段类型优化等。缺乏 Schema 设计的系统，有可能会导致数据倾斜等问题，不能充分利用系统并行和排序特性，从而影响 Doris 在业务系统中发挥真实的性能优势。

详细的设计原则可以参考[数据表设计](../../../table-design/overview)章节了解详细信息。本章将从实际案例的角度，展示几种典型场景下因 Schema 设计问题导致的性能瓶颈，并给出优化建议，供业务调优参考。

## 案例 1：表引擎选择

Doris 支持 Duplicate、Unique、Aggregate 三种表模型。其中，Unique 又可以进一步分为 Merge-On-Read（MOR）和 Merge-On-Write（MOW）两种。

这几种表模型的查询性能，由好到差依次为：Duplicate > MOW > MOR == Aggregate。因此，通常情况下，如果没有特殊需求，推荐使用 Duplicate 表，以获得更好的查询性能。

:::tip 优化建议

当业务无数据更新需求，但对查询性能有较高要求时，推荐使用 [Duplicate 表](../../../table-design/data-model/duplicate)。

:::

## 案例 2：分桶列选择

Doris 支持对数据进行分桶操作，即依据 Schema 中预设的分桶键来分布数据，进而形成数据 Bucket。

选取恰当的分桶列，对于原始数据的合理分布至关重要，它能有效防止数据倾斜所引发的性能问题。同时，这也能最大化地利用 Doris 提供的 Colocate Join 和 Bucket Shuffle Join 特性，从而显著提升 Join 操作的性能。

以下面 t1 表的建表语句为例，当前分桶列选定为 c2。然而，在实际数据导入过程中，若 c2 列的值全部默认为 null，那么即便设定了 64 个分桶，实际上也只有一个分桶会包含所有数据。这种极端情况会导致严重的数据倾斜，进而产生性能瓶颈。

```sql
CREATE TABLE `t1` (
  `c1` INT NULL,
  `c2` INT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 64
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
）;
insert into t1 select number, null from numbers ('number'='10000000');
```

针对上述情况，我们可以将分桶列从 c2 改为 c1，以实现数据的充分散列，并最大化地利用系统的并行处理能力，从而达到调优的目的。

因此，在 Schema 设计阶段，业务人员需要根据业务特性，提前进行合理的分桶列设计。例如，如果预先了解到 c2 列的业务含义中可能包含大量倾斜的值，如 null 或某些特定的值，那么就应该避免选择这些字段作为分桶列。相反，应该选择那些在业务含义上具有充分散列特性的字段，如用户 ID，作为分桶列。在性能问题排查阶段，可以使用以下 SQL 语句来确认分桶字段是否存在数据倾斜，并据此进行后续的优化调整。

```sql
select c2，count(*) cnt from t1 group by c2 order by cnt desc limit 10;
```

可以明确的是，良好的事前设计能够显著降低事后问题发生时的定位和修正成本。因此，强烈推荐业务人员在 Schema 设计阶段进行严格的设计和检查，以避免引入不必要的成本。

:::tip 优化建议
检查分桶列是否存在数据倾斜问题，如果存在，则更换为在业务含义上具有充分散列特性的字段作为分桶列。
:::

## 案例 3：Key 列优化

在三种表模型中，若建表 Schema 明确指定了 Duplicate Key、Unique Key 或 Aggregate Key，Doris 将在存储层面确保数据依据 Key 列进行排序。这一特性为数据查询的性能优化提供了新的思路。具体来说，在 Schema 设计阶段，若能将业务查询中频繁使用的等值或范围查询列定义为 Key 列，将会显著提升这类查询的执行速度，进而提升整体性能。

以下是一组业务查询需求的示例：

```sql
select * from t1 where t1.c1 = 1;
select * from t1 where t1.c1 > 1 and t1.c1 < 10;
select * from t1 where t1.c1 in (1, 2, 3);
```

针对上述业务需求和 t1 表的 Schema 设计与后期优化，可以考虑将 c1 列作为 Key 列，以加速查询过程。以下是一个示例：

```sql
CREATE TABLE `t1` (
  `c1` INT NULL,
  `c2` INT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
）;
```

:::tip 优化建议
将业务查询中频繁使用的列设定为 Key 列，以加速查询过程。
:::

## 案例 4：字段类型优化

在数据库系统中，不同类型的数据其处理复杂程度可能存在显著差异。例如，变长类型的数据处理相较于定长类型而言，其复杂性要高得多；同样，高精类型的数据处理也比低精类型更为复杂。

这一特性对业务系统 Schema 的设计及后期优化提供了重要启示：

1. 在满足业务系统表达和计算需求的前提下，应优先选择定长类型，避免使用变长类型；

2. 尽量采用低精类型，避免高精类型。具体实践包括：使用 BIGINT 替代 VARCHAR 或 STRING 类型的字段，以及用 FLOAT / INT / BIGINT 替换 DECIMAL 类型的字段等。此类字段类型的合理设计和优化，将极大地提升业务的计算效率，从而增强系统性能。

:::tip 优化建议
在定义 Schema 类型时，应遵循定长和低精优先的原则。
:::

## 总结

综上所述，一个精心设计的 Schema 能够最大化地利用 Doris 的特性，进而显著提升业务性能。反观未经过调优的 Schema 设计则可能对业务造成全局性的负面影响，例如数据倾斜等问题。因此，前期的 Schema 设计优化工作显得尤为重要。

针对性能调优方面，你还可以参考使用 [Colocate Group 优化 Join](../../../query-data/join#colocate-join)，该文档将详细介绍如何充分利用 Doris 的特性来进行性能优化，为你的业务性能提升提供有力支持。