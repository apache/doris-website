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

在 Apache Doris 中，删除操作（Delete）是一项关键功能，用于管理和清理数据，以满足用户在大规模数据分析场景中的灵活性需求。

Doris 提供了丰富多样的删除功能支持，包括：DELETE 语句、删除标记（delete sign）、分区删除、全表删除以及使用临时分区实现原子覆盖写等功能。下面将详细介绍每一项功能：

### DELETE 语句

删除数据时最常用的是 DELETE 语句，该功能支持所有表模型，用户可以使用它删除符合条件的数据。

DELETE 语句的语法如下：

```sql
DELETE FROM table_name WHERE condition;
```

DELETE 语句基本能满足大部分用户在使用 Doris 过程中的删除需求，但在某些场景下它并不是最高效的。为了灵活高效地满足用户在各类场景的删除需求，Doris 还提供了如下几种删除方式。

### 分区删除

在 Doris 中，通过日期分区等方式来管理数据是很常见的实践。很多用户只需要保留最近一段时间的数据（例如 7 天），对于过期的数据分区，可以采用分区删除（truncate partition）功能来进行高效的删除。

相比 DELETE 语句，分区删除只需要修改一些分区元数据即可完成删除，是这种场景下最佳的删除方式。

分区删除的语法如下：

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

### 整表删除

整表删除适用于快速清空表且保留表结构的场景，例如在离线分析场景中需要重做数据时。

整表删除的语法如下：

```sql
TRUNCATE TABLE table_name;
```

### 删除标记（Delete Sign）

数据删除可以视作数据更新的一种情况。因此，在具有更新能力的主键模型（Unique Key）上，用户可以通过删除标记功能，使用数据更新的方式实现删除操作。

例如在 CDC 数据同步场景中，CDC 程序可以将一条 DELETE 操作的 binlog 打上删除标记，当这条数据写入 Doris 时，就会删除掉对应的主键。

这种方式相对于 DELETE 语句来说，可以批量进行大量主键的删除操作，效率较高。

删除标记属于高级功能，使用起来相比前几种要更复杂一些，详细的用法请参考文档[批量删除](./delete-overview.md)。

### 使用临时分区实现原子覆盖写

某些情况下，用户希望能够重写某一分区的数据，但如果采用先删除再导入的方式进行，在中间会有一段时间无法查看数据。这时，用户可以先创建一个对应的临时分区，将新的数据导入到临时分区后，通过替换操作，原子性地替换原有分区，以达到目的。详细用法请参考文档[表原子替换](./atomicity-replace.md)。

## 注意事项

1. 删除操作会生成新的数据版本，因此频繁执行删除可能会导致版本数量增加，从而影响查询性能。
2. 删除后的数据在合并压缩完成之前仍会占用存储，因此删除操作本身不会立即降低存储使用。
