---
{
    "title": "rowsets",
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

返回 Rowset 的基础信息。

## 所属数据库


`information_schema`


## 表信息

| 列名                   | 类型        | 说明                                   |
| :--------------------- | :---------- | :------------------------------------- |
| BACKEND_ID             | bigint      | Backend 的 ID，是 Backend 的唯一标识。 |
| ROWSET_ID              | varchar(64) | Rowset 的 ID，是 Rowset 的唯一标识。   |
| TABLET_ID              | bigint      | Tablet 的 ID，是 Tablet 的唯一标识。   |
| ROWSET_NUM_ROWS        | bigint      | Rowset 包含的数据行数。                |
| TXN_ID                 | bigint      | 写入 Rowset 的事务 ID。                |
| NUM_SEGMENTS           | bigint      | Rowset 包含的 Segment 数目。           |
| START_VERSION          | bigint      | Rowset 的开始版本号。                  |
| END_VERSION            | bigint      | Rowset 的结束版本号。                  |
| INDEX_DISK_SIZE        | bigint      | Rowset 内索引的存储空间。              |
| DATA_DISK_SIZE         | bigint      | Rowset 内数据的存储空间。              |
| CREATION_TIME          | datetime    | Rowset 的创建时间。                    |
| NEWEST_WRITE_TIMESTAMP | datetime    | Rowset 的最近写入时间。                |
| SCHEMA_VERSION         | int         | Rowset 数据对应的表 Schema 版本号。    |