---
{
    "title": "workload_groups",
    "language": "en"
}
---

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