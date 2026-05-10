---
{
    "title": "backend_active_tasks",
    "language": "en",
    "description": "View the resource usage of Query or Load tasks currently running on Backends."
}
---

## Overview

View the resource usage of Query or Load tasks currently running on Backends.

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
