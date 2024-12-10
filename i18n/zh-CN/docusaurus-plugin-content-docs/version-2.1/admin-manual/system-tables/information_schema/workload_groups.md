---
{
    "title": "workload_groups",
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

记录 Workload Group 的配置信息

## 所属数据库


`information_schema`


## 表信息

| 列名                           | 类型         | 说明                                 |
| :----------------------------- | :----------- | :----------------------------------- |
| ID                             | bigint       | Workload Group 的 ID                  |
| NAME                           | varchar(256) | Workload Group 的名字                |
| CPU_SHARE                      | bigint       | Workload Group 的 CPU 软限权重       |
| MEMORY_LIMIT                   | varchar(256) | Workload Group 的内存限制            |
| ENABLE_MEMORY_OVERCOMMIT       | varchar(256) | 是否开启 Workload Group 的内存的软限 |
| MAX_CONCURRENCY                | bigint       | Workload Group 的最大并发数          |
| MAX_QUEUE_SIZE                 | bigint       | Workload Group 最大排队大小          |
| QUEUE_TIMEOUT                  | bigint       | Workload Group 排队超时              |
| CPU_HARD_LIMIT                 | varchar(256) | Workload Group CPU 硬限大小          |
| SCAN_THREAD_NUM                | bigint       | 本地 Scan 的线程数                   |
| MAX_REMOTE_SCAN_THREAD_NUM     | bigint       | 远程 Scan 线程池的最大线程数         |
| MIN_REMOTE_SCAN_THREAD_NUM     | bigint       | 远程 Scan 线程池的最小线程数         |
| SPILL_THRESHOLD_LOW_WATERMARK  | varchar(256) | Workload Group 落盘的低水位          |
| SPILL_THRESHOLD_HIGH_WATERMARK | varchar(256) | Workload  Group 落盘的高水位         |
| TAG                            | varchar(256) | Workload Group 的标签                |
| READ_BYTES_PER_SECOND          | bigint       | 本地读每秒扫描的字节数               |
| REMOTE_READ_BYTES_PER_SECOND   | bigint       | 远程读每秒扫描的字节数               |