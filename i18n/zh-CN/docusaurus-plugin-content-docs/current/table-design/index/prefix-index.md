---
{
    "title": "前缀索引与排序键",
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

## 索引原理

Apache Doris 的数据存储在类似 SSTable（Sorted String Table）的数据结构中。该结构是一种有序的数据结构，可以按照指定的一个或多个列进行排序存储。在这种数据结构上，以排序列的全部或者前面几个作为条件进行查找，会非常的高效。

在 Aggregate、Unique 和 Duplicate 三种数据模型中。底层的数据存储，是按照各自建表语句中，Aggregate Key、Unique Key 和 Duplicate Key 中指定的列进行排序存储的。这些 Key，称为排序键（Sort Key）。借助排序键，在查询时，通过给排序列指定条件，Apache Doris 不需要扫描全表即可快速找到需要处理的数据，降低搜索的复杂度，从而加速查询。

在排序键的基础上，又引入了前缀索引（Prefix Index）。前缀索引是一种稀疏索引。表中按照相应的行数的数据构成一个逻辑数据块 (Data Block)。每个逻辑数据块在前缀索引表中存储一个索引项，索引项的长度不超过 36 字节，其内容为数据块中第一行数据的排序列组成的前缀，在查找前缀索引表时可以帮助确定该行数据所在逻辑数据块的起始行号。由于前缀索引比较小，所以，可以全量在内存缓存，快速定位数据块，大大提升了查询效率。

:::tip

数据块一行数据的前 36 个字节作为这行数据的前缀索引。当遇到 VARCHAR 类型时，前缀索引会直接截断。如果第一列即为 VARCHAR，那么即使没有达到 36 字节，也会直接截断，后面的列不再加入前缀索引。
:::

## 使用场景

前缀索引可以加速等值查询和范围查询。

:::tip

因为一个表的 Key 定义是唯一的，所以一个表只有一种前缀索引。这对于使用其他不能命中前缀索引的列作为条件进行的查询来说，效率上可能无法满足需求，有两种解决方案：
1. 对需要加速查询的条件列创建倒排索引，由于一个表的倒排索引可以有很多个。
2. 对于 Duplicate 表可以通过创建相应的调整了列顺序的单表强一致物化视图来间接实现多种前缀索引，详情可参考查询加速/物化视图。

:::

## 使用语法

前缀索引没有专门的语法去定义，建表时自动取表的 Key 的前 36 字节作为前缀索引。


## 使用示例

-   假如表的排序列为如下 5 列，那么前缀索引为：user_id(8 Bytes) + age(4 Bytes) + message(prefix 20 Bytes)。

| ColumnName     | Type         |
| -------------- | ------------ |
| user_id        | BIGINT       |
| age            | INT          |
| message        | VARCHAR(100) |
| max_dwell_time | DATETIME     |
| min_dwell_time | DATETIME     |

-   假如表的排序列为如下 5 列，则前缀索引为 user_name(20 Bytes)。即使没有达到 36 个字节，因为遇到 VARCHAR，所以直接截断，不再往后继续。

| ColumnName     | Type         |
| -------------- | ------------ |
| user_name      | VARCHAR(20)  |
| age            | INT          |
| message        | VARCHAR(100) |
| max_dwell_time | DATETIME     |
| min_dwell_time | DATETIME     |

-   当我们的查询条件，是前缀索引的前缀时，可以极大地加快查询速度。比如在第一个例子中，执行如下查询：

```sql
SELECT * FROM table WHERE user_id=1829239 and age=20；
```

该查询的效率会远高于如下查询：

```sql
SELECT * FROM table WHERE age=20；
```

所以在建表时，正确选择列顺序，能够极大地提高查询效率。

