---
{
    "title": "Dynamic Partitioning",
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

Dynamic partitioning will add and remove partitions in a rolling manner according to predefined rules, thereby managing the lifecycle of table partitions (TTL) and reducing data storage pressure. In scenarios such as log management and time-series data management, dynamic partitioning can typically be used to roll-delete expired data.

The diagram below illustrates lifecycle management using dynamic partitioning, with the following rules specified:

* The dynamic partition scheduling unit `dynamic_partition.time_unit` is set to DAY, organizing partitions by day;
* The dynamic partition start offset `dynamic_partition.start` is set to -1, retaining the partition from one day ago;
* The dynamic partition end offset `dynamic_partition.end` is set to 2, retaining partitions for the next two days.

According to the above rules, as time progresses, a total of 4 partitions will always be retained: the partition from the past day, the current day partition, and the partitions for the next two days.


![dynamic-partition](/images/getting-started/dynamic-partition.png)

## Usage Restrictions

When using dynamic partitioning, the following rules must be followed:

* Dynamic partitioning will fail when used simultaneously with Cross-Cluster Replication (CCR).
* Dynamic partitioning only supports Range type partitions on DATE/DATETIME columns.
* Dynamic partitioning only supports a single partition key.

:::caution Note: 
The dynamic partitioning feature will become invalid when synchronized by CCR. If this table is replicated via CCR, meaning the PROPERTIES include is_being_synced=true, the SHOW CREATE TABLE command will display it as enabled, but it will not actually take effect. When is_being_synced is set to false, these features will resume functionality. However, the is_being_synced property is exclusively for use by CCR peripheral modules—do not manually modify it during the CCR synchronization process. 
:::

## Creating Dynamic Partitions

When creating a table, you can create a dynamic partitioned table by specifying the `dynamic_partition` property.


```sql
CREATE TABLE test_dynamic_partition(
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
DUPLICATE KEY(order_id)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(order_id) BUCKETS 10
PROPERTIES(
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-1",
    "dynamic_partition.end" = "2",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.create_history_partition" = "true"
);
```

In the example above, a dynamic partitioned table was created with the following specifications.

For detailed `dynamic_partition` parameters, refer to [Dynamic Partition Parameter Description](#dynamic-partition-property-parameters).

## Managing Dynamic Partitions

### Modifying Dynamic Partition Properties

:::info Tip:

When using the ALTER TABLE statement to modify dynamic partitioning, the changes will not take effect immediately. The dynamic partitions will be polled and checked at intervals specified by the `dynamic_partition_check_interval_seconds` parameter to complete the necessary partition creation and deletion operations.

:::

In the example below, the ALTER TABLE statement is used to modify a non-dynamic partitioned table to a dynamic partitioned table:

```sql
CREATE TABLE test_dynamic_partition(
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 10;

ALTER TABLE test_partition SET (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-1",
    "dynamic_partition.end" = "2",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.create_history_partition" = "true"
);

```

### 查看动态分区调度情况

通过 [SHOW-DYNAMIC-PARTITION](../../sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES) 可以查看当前数据库下，所有动态分区表的调度情况：

```sql
SHOW DYNAMIC PARTITION TABLES;
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| TableName | Enable | TimeUnit | Start       | End  | Prefix | Buckets | StartOf   | LastUpdateTime | LastSchedulerTime   | State  | LastCreatePartitionMsg | LastDropPartitionMsg | ReservedHistoryPeriods  |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| d3        | true   | WEEK     | -3          | 3    | p      | 1       | MONDAY    | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | [2021-12-01,2021-12-31] |
| d5        | true   | DAY      | -7          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d4        | true   | WEEK     | -3          | 3    | p      | 1       | WEDNESDAY | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    | 
| d6        | true   | MONTH    | -2147483648 | 2    | p      | 8       | 3rd       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d2        | true   | DAY      | -3          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d7        | true   | MONTH    | -2147483648 | 5    | p      | 8       | 24th      | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
7 rows in set (0.02 sec)
```

### Historical Partition Management

When specifying the number of dynamic partitions using the `start` and `end` attributes, historical partitions are not created all at once to avoid long waiting times. Only partitions after the current time are created. If you need to create all partitions at once, you must enable the `create_history_partition` parameter.

For example, if the current date is 2024-10-11 and you set `start = -2` and `end = 2`:

* If `create_history_partition = true` is specified, all partitions are created immediately, resulting in five partitions: [10-09, 10-13].
* If `create_history_partition = false` is specified, only partitions from 10-11 onwards are created, resulting in three partitions: [10-11, 10-13].

## Dynamic Partition Parameter Description

### Dynamic Partition Property Parameters

Dynamic partition rule parameters are prefixed with `dynamic_partition` and can be set with the following rule parameters:

| Parameter                                        | Required | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dynamic_partition.enable`                       | No       | Whether to enable the dynamic partition feature. Can be set to TRUE or FALSE. If other required dynamic partition parameters are specified, it defaults to TRUE.                                                                                                                                                                                                                                                                                                                                        |
| `dynamic_partition.time_unit`                   | Yes      | The unit of dynamic partition scheduling. Can be set to `HOUR`, `DAY`, `WEEK`, `MONTH`, or `YEAR`, indicating partition creation or deletion by hour, day, week, month, or year respectively.                                                                                                                                                                                                                                                                                                                  |
| `dynamic_partition.start`                        | No       | The starting offset for dynamic partitions, which is a negative number. The default value is -2147483648, meaning historical partitions are not deleted. Depending on the `time_unit` attribute, partitions before this offset based on the current day (week/month) will be deleted. Whether historical partitions after this offset up to the current time are created depends on `dynamic_partition.create_history_partition`.                                                                                                     |
| `dynamic_partition.end`                          | Yes      | The ending offset for dynamic partitions, which is a positive number. Depending on the `time_unit` attribute, partitions within the specified range ahead of the current day (week/month) are created in advance.                                                                                                                                                                                                                                                                                                  |
| `dynamic_partition.prefix`                       | Yes      | The prefix for dynamically created partition names.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `dynamic_partition.buckets`                      | No       | The number of buckets corresponding to dynamically created partitions. Setting this parameter will override the number of buckets specified in `DISTRIBUTED`.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `dynamic_partition.replication_num`              | No       | The number of replicas corresponding to dynamically created partitions. If not specified, it defaults to the number of replicas specified when the table was created.                                                                                                                                                                                                                                                                                                                                 |
| `dynamic_partition.create_history_partition`     | No       | Defaults to false. When set to true, Doris will automatically create all partitions according to the rules below. Additionally, the FE parameter `max_dynamic_partition_num` will limit the total number of partitions to avoid creating too many partitions at once. If the number of partitions to be created exceeds the `max_dynamic_partition_num` value, the operation will be prohibited. This parameter does not take effect if the `start` attribute is not specified.                                               |
| `dynamic_partition.history_partition_num`        | No       | When `create_history_partition` is set to `true`, this parameter specifies the number of historical partitions to create. The default value is -1, meaning it is not set. This variable functions the same as `dynamic_partition.start`, and it is recommended to set only one of them simultaneously.                                                                                                                                                                                                 |
| `dynamic_partition.start_day_of_week`            | No       | When `time_unit` is set to `WEEK`, this parameter specifies the starting day of the week. Values range from 1 to 7, where 1 represents Monday and 7 represents Sunday. The default is 1, meaning the week starts on Monday.                                                                                                                                                                                                                                                                                    |
| `dynamic_partition.start_day_of_month`           | No       | When `time_unit` is set to `MONTH`, this parameter specifies the starting date of the month. Values range from 1 to 28, where 1 represents the first day of the month and 28 represents the 28th day. The default is 1, meaning the month starts on the first day. Starting on the 29th, 30th, or 31st is not supported to avoid ambiguities caused by leap years or leap months.                                                                                                                                         |
| `dynamic_partition.reserved_history_periods`      | No       | The time range of historical partitions that need to be retained. When `dynamic_partition.time_unit` is set to "DAY/WEEK/MONTH/YEAR", it should be set in the format `[yyyy-MM-dd,yyyy-MM-dd],[...,...]`. When `dynamic_partition.time_unit` is set to "HOUR", it should be set in the format `[yyyy-MM-dd HH:mm:ss,yyyy-MM-dd HH:mm:ss],[...,...]`. If not set, it defaults to `"NULL"`.                                                                                                                        |
| `dynamic_partition.time_zone`                     | No       | The time zone for dynamic partitioning, which defaults to the server's system time zone, such as `Asia/Shanghai`. For more time zone settings, refer to [Time Zone Management](../../admin-manual/cluster-management/time-zone).                                                                                                                                                                                                                                                                                |

### FE Configuration Parameters

Dynamic partition parameter configurations in FE can be modified in the FE configuration file or via the `ADMIN SET FRONTEND CONFIG` command:

| Parameter                               | Default Value | Description                                                                                                  |
| --------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| `dynamic_partition_enable`              | false         | Whether to enable Doris's dynamic partition feature. This parameter only affects partition operations of dynamic partition tables and does not affect regular tables. |
| `dynamic_partition_check_interval_seconds` | 600           | The execution frequency of the dynamic partition thread, in seconds.                                       |
| `max_dynamic_partition_num`            | 500           | Limits the maximum number of partitions that can be created when creating a dynamic partition table to avoid creating too many partitions at once. |

## Dynamic Partition Best Practices

Example 1: Partition by day, retain partitions for the past 7 days and the current day, and pre-create partitions for the next 3 days.

```sql
CREATE TABLE tbl1 (
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(create_dt)
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-7",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32"
);
```

Example 2: Partition by month, do not delete historical partitions, and pre-create partitions for the next 2 months. Additionally, set the starting day to the 3rd of each month.

```sql
CREATE TABLE tbl1 (
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(create_dt)
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "MONTH",
    "dynamic_partition.end" = "2",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "8",
    "dynamic_partition.start_day_of_month" = "3"
);
```

Example 3: Partition by day, retain partitions for the past 10 days and the next 10 days, and retain historical data during the periods [2020-06-01, 2020-06-20] and [2020-10-31, 2020-11-15].

```sql
CREATE TABLE tbl1 (
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(create_dt)
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-10",
    "dynamic_partition.end" = "10",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "8",
    "dynamic_partition.reserved_history_periods"="[2020-06-01,2020-06-20],[2020-10-31,2020-11-15]"
);
```

