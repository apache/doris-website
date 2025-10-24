---
{
    "title": "workload_group_resource_usage",
    "language": "en"
}
---

## Overview

Stores usage information for Workload Group resources.

## Database


`information_schema`


## Table Information

| Column Name                  | Type   | Description                               |
| ---------------------------- | ------ | ----------------------------------------- |
| BE_ID                        | bigint | The ID of the Backend                     |
| WORKLOAD_GROUP_ID            | bigint | The ID of the Workload Group              |
| MEMORY_USAGE_BYTES           | bigint | Memory usage in bytes                     |
| CPU_USAGE_PERCENT            | double | CPU usage percentage                      |
| LOCAL_SCAN_BYTES_PER_SECOND  | bigint | Local scan data rate in bytes per second  |
| REMOTE_SCAN_BYTES_PER_SECOND | bigint | Remote scan data rate in bytes per second |