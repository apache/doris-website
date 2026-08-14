---
{
    "title": "backend_tablets",
    "language": "zh-CN",
    "description": "在 Backends 上查看 talbet 的信息。（doris 3.0.7添加）"
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

在 Backends 上查看 talbet 的信息。（doris 3.0.7添加）

## 所属数据库


`information_schema`


## 表信息

| 列名               | 类型          | 说明                 |
| ------------------ | ------------ | ------------------- |
| BE_ID              | bigint       | Backend 的 ID       |
| TABLET_ID          | bigint       | Tablet 的 ID        |
| REPLICA_ID         | bigint       | Replica 的 ID       |
| PARTITION_ID       | bigint       | Partition 的 ID     |
| TABLET_PATH        | varchar(256) | Tablet 的路径        |
| TABLET_LOCAL_SIZE  | bigint       | Tablet 在本地的大小   |
| TABLET_REMOTE_SIZE | bigint       | Tablet 在远端的大小   |
| VERSION_COUNT      | bigint       | Tablet 的 version 数 |
| SEGMENT_COUNT      | bigint       | Segment 的数量        |
| NUM_COLUMNS        | bigint       | Column 的数量         |
| ROW_SIZE           | bigint       | Row 的大小            |
| COMPACTION_SCORE   | int          | Compaction Score     |
| COMPRESS_KIND      | varchar(256) | Compression 的类型    |
| IS_USED            | bool         | Tablet 数据目录是否打开 |
| IS_ALTER_FAILED    | bool         | Alter 操作是否失败     |
| CREATE_TIME        | datetime     | Tablet 创建时间        |
| UPDATE_TIME        | datetime     | Tablet 更新时间        |
| IS_OVERLAP         | bool         | Tablets 是否 Overlap  |

## 存算分离模式下的数据大小语义

<!-- 知识类型: 行为说明 -->
<!-- 适用场景: 存算分离容量核对 -->

该表由 BE 直接上报，`TABLET_LOCAL_SIZE` 与 `TABLET_REMOTE_SIZE` 按 rowset 的实际存储位置区分：存放在远端存储的 rowset 计入 `TABLET_REMOTE_SIZE`。存算分离模式下数据存放于远端存储，因此数据量体现在 `TABLET_REMOTE_SIZE` 上。

自 4.0.8 版本起，[`SHOW TABLETS`](../../../sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET) 与 [`information_schema.partitions`](./partitions) 的本地/远端口径已与该表对齐：存算分离模式下数据量统一按远端大小上报。在 4.0.8 之前，三者的口径可能互相矛盾。
