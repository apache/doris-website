---
{
    "title": "partition_statistics",
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

## 概述

分区统计信息

## 所属数据库


`__internal_schema`


## 表信息

| 列名               | 类型           | 说明                      |
| :----------------- | :------------- | :------------------------ |
| catalog_id         | varchar(64)    | Catalog 的 ID             |
| db_id              | varchar(64)    | Database 的 ID            |
| tbl_id             | varchar(64)    | Table 的 ID               |
| idx_id             | varchar(64)    | Index 的 ID               |
| part_name          | varchar(64)    | Partition 的名字          |
| part_id            | bigint         | Partition 的 ID           |
| col_id             | varchar(64)    | 列的 ID，当前存储的是列名 |
| count              | bigint         | 行数                      |
| ndv                | hll            | 不同值的数量              |
| null_count         | bigint         | NULL 的数量               |
| min                | varchar(65533) | 最小值                    |
| max                | varchar(65533) | 最大值                    |
| data_size_in_bytes | bigint         | 以字节计算的数据量        |
| update_time        | datetime       | 当前统计信息最后更新时间  |