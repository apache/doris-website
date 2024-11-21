---
{
    "title": "backend_active_tasks",
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

View the tasks of the currently running Pipeline in the Backend

## Database


`information_schema`


## Table Information

| Column Name               | Type         | Description                                      |
| ------------------------- | ------------ | ------------------------------------------------ |
| BE_ID                     | bigint       | The ID of the Backend executing the task         |
| FE_HOST                   | varchar(256) | The address of the Frontend that issued the task |
| QUERY_ID                  | varchar(256) | The ID of the query                              |
| TASK_TIME_MS              | bigint       | The task execution time                          |
| TASK_CPU_TIME_MS          | bigint       | The CPU time used by the task                    |
| SCAN_ROWS                 | bigint       | The number of rows scanned                       |
| SCAN_BYTES                | bigint       | The number of bytes scanned                      |
| BE_PEAK_MEMORY_BYTES      | bigint       | The peak memory usage                            |
| CURRENT_USED_MEMORY_BYTES | bigint       | The current memory usage                         |
| SHUFFLE_SEND_BYTES        | bigint       | The number of bytes shuffled and sent            |
| SHUFFLE_SEND_ROWS         | bigint       | The number of rows shuffled and sent             |
| QUERY_TYPE                | varchar(256) | The type of query                                |
