---
{
    "title": "Tiered Storage of SSD and HDD",
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

Doris supports tiered storage between different disk types (SSD and HDD), combining dynamic partitioning features to dynamically migrate data from SSD to HDD based on the characteristics of hot and cold data. This approach reduces storage costs while maintaining high performance for hot data reads and writes.

## Dynamic Partitioning and Tiered Storage

By configuring dynamic partitioning parameters of a table, users can set which partitions are stored on SSD and automatically migrate to HDD after cooling.

- **Hot Partitions**: Recently active partitions, prioritized to be stored on SSD to ensure high performance.
- **Cold Partitions**: Partitions that are accessed less frequently, which will gradually migrate to HDD to reduce storage costs.

For more information on dynamic partitioning, please refer to: [Data Partitioning - Dynamic Partitioning](../../table-design/data-partitioning/dynamic-partitioning).

## Parameter Description

### `dynamic_partition.hot_partition_num`

- **Function**:
  - Specifies how many of the most recent partitions are hot partitions, which are stored on SSD, while the remaining partitions are stored on HDD.

- **Note**:
  - `"dynamic_partition.storage_medium" = "HDD"` must be set simultaneously; otherwise, this parameter will not take effect.
  - If there are no SSD devices in the storage path, this configuration will cause partition creation to fail.

**Example Description**:

Assuming the current date is **2021-05-20**, with daily partitioning, the dynamic partitioning configuration is as follows:
```sql
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.hot_partition_num" = 2
    "dynamic_partition.start" = -3
    "dynamic_partition.end" = 3
```

The system will automatically create the following partitions and configure their storage medium and cooling time:

  ```Plain
  p20210517：["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210518：["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210519：["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
  p20210520：["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
  p20210521：["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
  p20210522：["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
  p20210523：["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
  ```

### `dynamic_partition.storage_medium`

- **Function**:
  - Specifies the final storage medium for dynamic partitions. The default is HDD, but SSD can be selected.

- **Note**:
  - When set to SSD, the `hot_partition_num` attribute will no longer take effect, and all partitions will default to SSD storage medium with a cooling time of 9999-12-31 23:59:59.

## Example

### 1. Create a table with dynamic_partition

```sql
    CREATE TABLE tiered_table (k DATE)
    PARTITION BY RANGE(k)()
    DISTRIBUTED BY HASH (k) BUCKETS 5
    PROPERTIES
    (
        "dynamic_partition.storage_medium" = "hdd",
        "dynamic_partition.enable" = "true",
        "dynamic_partition.time_unit" = "DAY",
        "dynamic_partition.hot_partition_num" = "2",
        "dynamic_partition.end" = "3",
        "dynamic_partition.prefix" = "p",
        "dynamic_partition.buckets" = "5",
        "dynamic_partition.create_history_partition"= "true",
        "dynamic_partition.start" = "-3"
    );
```

### 2. Check storage medium of partitions

```sql
    SHOW PARTITIONS FROM tiered_table;
```

You should have 7 partitions, 5 of which use SSD as the storage medium, while the other 2 use HDD.

```Plain
  p20210517：["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210518：["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210519：["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
  p20210520：["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
  p20210521：["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
  p20210522：["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
  p20210523：["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```
