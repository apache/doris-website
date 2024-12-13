---
{
    "title": "删除操作概述",
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

在 Apache Doris 中，删除操作（Delete）是一项关键功能，用于管理和清理数据，以满足用户在大规模数据分析场景中的灵活性需求。Doris 的删除机制支持高效的标记删除和多版本数据管理，在性能和灵活性之间达到了良好的平衡。

## 删除的实现机制

Doris 的删除操作采用**标记删除（Logical Deletion）**的方式，而不是直接物理删除数据。以下是其核心实现机制：

1. **标记删除**。删除操作不会直接从存储中移除数据，而是为目标数据添加一条删除标记。标记删除主要有两种实现方式：delete 谓词和 delete sign。

   1. delete 谓词用于 Duplicate 模型和 Aggregate 模型，每次删除会直接在对应的数据集上记录一个条件谓词，用于在查询时过滤掉被删除的数据。
   2. delete sign 用于 Unique Key 模型，每次删除会新写入一批数据覆盖要被删除的数据，同时新写入的数据会将隐藏列 `__DORIS_VERSION_COL__` 设置为 1，表示该数据已经被删除。
   3. 性能比较：“delete 谓词”的操作速度非常快，无论是删除 1 条数据还是 1 亿条数据，速度都差不多——都是写一个条件谓词到数据集上；delete sign 的写入速度与数据量成正比。

2. **多版本数据管理**。Doris 支持多版本数据（MVCC，Multi-Version Concurrency Control），允许在同一数据集上进行并发操作而不会影响查询结果。删除操作会创建一个新的版本，其中包含删除标记，而旧版本数据仍然被保留。

3. **物理删除（Compaction）**。定期执行的合并压缩（Compaction）过程会清理标记为删除的数据，从而释放存储空间。此过程由系统自动完成，无需用户手动干预。注意，只有 Base Compaction 才会对数据进行物理删除，Cumulative Compaction 仅对数据进行合并及重新排序，减少 rowset 及 segment 数量。

## 删除操作的使用场景

Doris 提供多种删除方式，以满足不同场景的需求：

### 条件删除

用户可以通过指定过滤条件，删除满足条件的行。例如：

```sql
DELETE FROM table_name WHERE condition;
```

### 通过导入进行批量删除

在数据导入时，通过覆盖的方式实现逻辑删除。这种方式适用于批量删除大量的 key，或者在 CDC 同步 binlog 时同步 TP 数据库的删除操作。

### 删除全部数据

在某些情况下，可以通过直接清空表或分区实现对数据的删除，例如：

```sql
TRUNCATE TABLE table_name;
```

### 使用临时分区实现原子覆盖写

某些情况下，用户希望能够重写某一分区的数据，但如果采用先删除再导入的方式进行，在中间会有一段时间无法查看数据。这时，用户可以先创建一个对应的临时分区，将新的数据导入到临时分区后，通过替换操作，原子性地替换原有分区，以达到目的。

## 注意事项

1. 删除操作会生成新的数据版本，因此频繁执行删除可能会导致版本数量增加，从而影响查询性能。
2. 合并压缩是释放存储空间的关键步骤，建议用户根据系统负载调整压缩策略。
3. 删除后的数据在合并压缩完成之前仍会占用存储，因此删除操作本身不会立即降低存储使用。

