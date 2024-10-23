---
{
    "title": "backend_active_tasks",
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

查看当前 Backend 正在运行的 Pipeline 的任务

## 所属数据库


`information_schema`


## 表信息

| 列名                      | 类型         | 说明                     |
| :------------------------ | :----------- | :----------------------- |
| BE_ID                     | bigint       | 执行任务的 Backend 的 ID |
| FE_HOST                   | varchar(256) | 下发任务的 Frontend 地址 |
| QUERY_ID                  | varchar(256) | 查询的 ID                |
| TASK_TIME_MS              | bigint       | 任务运行时间             |
| TASK_CPU_TIME_MS          | bigint       | 任务运行的 CPU 时间      |
| SCAN_ROWS                 | bigint       | 扫描数据行数             |
| SCAN_BYTES                | bigint       | 扫描数据字节数           |
| BE_PEAK_MEMORY_BYTES      | bigint       | 使用的内存峰值           |
| CURRENT_USED_MEMORY_BYTES | bigint       | 当前使用的内存           |
| SHUFFLE_SEND_BYTES        | bigint       | Shuffle 数据字节数       |
| SHUFFLE_SEND_ROWS         | bigint       | Shuffle 数据行数         |
| QUERY_TYPE                | varchar(256) | 查询类型                 |