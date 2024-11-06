---
{
    "title": "概览",
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

## 创建表

使用 [CREATE TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE.md) 语句在 Doris 中创建一个表，也可以使用 [LIKE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE-LIKE.md) 或 [AS](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE-AS-SELECT.md) 子句从另一个表派生表定义。

## 表名

Doris 中表名默认是大小写敏感的，可以在第一次初始化集群时配置[lower_case_table_names](../admin-manual/config/fe-config.md)为大小写不敏感的。默认的表名最大长度为 64 字节，可以通过配置[table_name_length_limit](../admin-manual/config/fe-config.md)更改，不建议配置过大。创建表的语法请参考[CREATE TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE.md)。

## 表属性

Doris 的建表语句中可以指定[建表属性](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE.md#properties)，其中分桶数 (buckets)、存储介质 (storage_medium)、副本数 (replication_num)、冷热分离存储策略 (storage_policy) 属性作用于分区，即分区创建之后，分区就会有自己的属性，修改表属性只对未来创建的分区生效，对已经创建好的分区不生效，关于属性更多的信息请参考[修改表属性](../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-PROPERTY.md)


## 注意事项

1. 数据模型不可更改，因此建表时需要选择一个合适的[数据模型](../table-design/data-model/overview.md)。

2. 已经创建的分区不能修改分桶数，可以通过[替换分区](../data-operate/delete/table-temp-partition.md) 来修改分桶数，可以修改动态分区未创建的分区分桶数。

3. 加减 VALUE 列是轻量级实现，秒级别可以完成，加减 KEY 列或者修改数据类型是重量级操作，完成时间取决于数据量，大规模数据下尽量避免加减 KEY 列或者修改数据类型。

4. 可以使用层级存储将冷数据保存到 HDD 或者 S3 / HDFS。