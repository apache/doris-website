---
{
    "title": "partitions",
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

查看数据库中所有表的 partition 情况。在 3.0.2（不包含 3.0.2）之前恒为空表。

## 所属数据库

`information_schema`

## 表信息

| 列名                          | 类型          | 说明                 |
| :---------------------------- | :------------ | :------------------- |
| TABLE_CATALOG                 | varchar(64)   | Catalog 名字         |
| TABLE_SCHEMA                  | varchar(64)   | Database 名字        |
| TABLE_NAME                    | varchar(64)   | Table 名字           |
| PARTITION_NAME                | varchar(64)   | Partition 名字       |
| SUBPARTITION_NAME             | varchar(64)   | 永远为空             |
| PARTITION_ORDINAL_POSITION    | int           | Partition 的序号     |
| SUBPARTITION_ORDINAL_POSITION | int           | 永远为空             |
| PARTITION_METHOD              | varchar(13)   | Partition 的分区方法 |
| SUBPARTITION_METHOD           | varchar(13)   | 永远为空             |
| PARTITION_EXPRESSION          | varchar(2048) | Partition 的表达式   |
| SUBPARTITION_EXPRESSION       | varchar(2048) | 永远为空             |
| PARTITION_DESCRIPTION         | text          | Parititon 的描述信息 |
| TABLE_ROWS                    | bigint        |                      |
| AVG_ROW_LENGTH                | bigint        |                      |
| DATA_LENGTH                   | bigint        |                      |
| MAX_DATA_LENGTH               | bigint        |                      |
| INDEX_LENGTH                  | bigint        |                      |
| DATA_FREE                     | bigint        |                      |
| CREATE_TIME                   | bigint        |                      |
| UPDATE_TIME                   | datetime      |                      |
| CHECK_TIME                    | datetime      |                      |
| CHECKSUM                      | bigint        |                      |
| PARTITION_COMMENT             | text          |                      |
| NODEGROUP                     | varchar(256)  |                      |
| TABLESPACE_NAME               | varchar(268)  |                      |
