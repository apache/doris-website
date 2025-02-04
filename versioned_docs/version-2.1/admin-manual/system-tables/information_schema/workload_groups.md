---
{
    "title": "workload_groups",
    "language": "en"
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

## Overview

Records the configuration information of Workload Groups.

## Database


`information_schema`


## Table Information

| Column Name                    | Type         | Description                                                  |
| ------------------------------ | ------------ | ------------------------------------------------------------ |
| ID                             | bigint       | ID of the Workload Group                                     |
| NAME                           | varchar(256) | Name of the Workload Group                                   |
| CPU_SHARE                      | bigint       | Soft limit weight for CPU of the Workload Group              |
| MEMORY_LIMIT                   | varchar(256) | Memory limit for the Workload Group                          |
| ENABLE_MEMORY_OVERCOMMIT       | varchar(256) | Whether to enable soft limit for memory of the Workload Group |
| MAX_CONCURRENCY                | bigint       | Maximum concurrency for the Workload Group                   |
| MAX_QUEUE_SIZE                 | bigint       | Maximum queue size for the Workload Group                    |
| QUEUE_TIMEOUT                  | bigint       | Queue timeout for the Workload Group                         |
| CPU_HARD_LIMIT                 | varchar(256) | Hard limit size for CPU of the Workload Group                |
| SCAN_THREAD_NUM                | bigint       | Number of threads for local scan                             |
| MAX_REMOTE_SCAN_THREAD_NUM     | bigint       | Maximum number of threads in the remote scan thread pool     |
| MIN_REMOTE_SCAN_THREAD_NUM     | bigint       | Minimum number of threads in the remote scan thread pool     |
| SPILL_THRESHOLD_LOW_WATERMARK  | varchar(256) | Low watermark for disk spill of the Workload Group           |
| SPILL_THRESHOLD_HIGH_WATERMARK | varchar(256) | High watermark for disk spill of the Workload Group          |
| TAG                            | varchar(256) | Tag for the Workload Group                                   |
| READ_BYTES_PER_SECOND          | bigint       | Bytes scanned per second for local reads                     |
| REMOTE_READ_BYTES_PER_SECOND   | bigint       | Bytes scanned per second for remote reads                    |