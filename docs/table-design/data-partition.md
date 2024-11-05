---
{
    "title": "Dynamic Partition",
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

# Dynamic Partition

Dynamic partition is a new feature introduced in Doris version 0.12. It's designed to manage partition's Time-to-Life (TTL), reducing the burden on users.

At present, the functions of dynamically adding partitions and dynamically deleting partitions are realized.

Dynamic partitioning is only supported for Range partitions.

## Noun Interpretation

* FE: Frontend, the front-end node of Doris. Responsible for metadata management and request access.
* BE: Backend, Doris's back-end node. Responsible for query execution and data storage.

## Principle

In some usage scenarios, the user will partition the table according to the day and perform routine tasks regularly every day. At this time, the user needs to manually manage the partition. Otherwise, the data load may fail because the user does not create a partition. This brings additional maintenance costs to the user.

Through the dynamic partitioning feature, users can set the rules of dynamic partitioning when building tables. FE will start a background thread to create or delete partitions according to the rules specified by the user. Users can also change existing rules at runtime.

## Usage

### Establishment of tables

The rules for dynamic partitioning can be specified when the table is created or modified at runtime. Currently,dynamic partition rules can only be set for partition tables with single partition columns.    

* Specified when creating table

    ```
    CREATE TABLE tbl1
    (...)
    PROPERTIES
    (
        "dynamic_partition.prop1" = "value1",
        "dynamic_partition.prop2" = "value2",
        ...
    )
    ```
    
* Modify at runtime

    ```
    ALTER TABLE tbl1 SET
    (
        "dynamic_partition.prop1" = "value1",
        "dynamic_partition.prop2" = "value2",
        ...
    )
    ```
    
### Dynamic partition rule parameters

The rules of dynamic partition are prefixed with `dynamic_partition.`:

* `dynamic_partition.enable`

    Whether to enable the dynamic partition feature. Can be specified as `TRUE` or` FALSE`. If not filled, the default is `TRUE`. If it is `FALSE`, Doris will ignore the dynamic partitioning rules of the table.

* `dynamic_partition.time_unit`

    The unit for dynamic partition scheduling. Can be specified as `HOUR`,`DAY`,` WEEK`, and `MONTH`, means to create or delete partitions by hour, day, week, and month, respectively.

    When specified as `HOUR`, the suffix format of the dynamically created partition name is `yyyyMMddHH`, for example, `2020032501`. *When the time unit is HOUR, the data type of partition column cannot be DATE.*

    When specified as `DAY`, the suffix format of the dynamically created partition name is `yyyyMMdd`, for example, `20200325`.

    When specified as `WEEK`, the suffix format of the dynamically created partition name is `yyyy_ww`. That is, the week of the year of current date. For example, the suffix of the partition created for `2020-03-25` is `2020_13`, indicating that it is currently the 13th week of 2020.

    When specified as `MONTH`, the suffix format of the dynamically created partition name is `yyyyMM`, for example, `202003`.

* `dynamic_partition.time_zone`

    The time zone of the dynamic partition, if not filled in, defaults to the time zone of the current machine's system, such as `Asia/Shanghai`, if you want to know the supported TimeZone, you can found in `https://en.wikipedia.org/wiki/List_of_tz_database_time_zones`.

* `dynamic_partition.start`

    The starting offset of the dynamic partition, usually a negative number. Depending on the `time_unit` attribute, based on the current day (week / month), the partitions with a partition range before this offset will be deleted. If not filled, the default is `-2147483648`, that is, the history partition will not be  deleted.

* `dynamic_partition.end`

    The end offset of the dynamic partition, usually a positive number. According to the difference of the `time_unit` attribute, the partition of the corresponding range is created in advance based on the current day (week / month).

* `dynamic_partition.prefix`

    The dynamically created partition name prefix.

* `dynamic_partition.buckets`

    The number of buckets corresponding to the dynamically created partitions.

* `dynamic_partition.replication_num`

    The replication number of dynamic partition.If not filled in, defaults to the number of table's replication number.    

* `dynamic_partition.start_day_of_week`

    When `time_unit` is` WEEK`, this parameter is used to specify the starting point of the week. The value ranges from 1 to 7. Where 1 is Monday and 7 is Sunday. The default is 1, which means that every week starts on Monday.
    
* `dynamic_partition.start_day_of_month`

    When `time_unit` is` MONTH`, this parameter is used to specify the start date of each month. The value ranges from 1 to 28. 1 means the 1st of every month, and 28 means the 28th of every month. The default is 1, which means that every month starts at 1st. The 29, 30 and 31 are not supported at the moment to avoid ambiguity caused by lunar years or months.

* `dynamic_partition.create_history_partition`

    The default is false. When set to true, Doris will automatically create all partitions, as described in the creation rules below. At the same time, the parameter `max_dynamic_partition_num` of FE will limit the total number of partitions to avoid creating too many partitions at once. When the number of partitions expected to be created is greater than `max_dynamic_partition_num`, the operation will fail.

    When the `start` attribute is not specified, this parameter has no effect.

* `dynamic_partition.history_partition_num`

   When `create_history_partition` is `true`, this parameter is used to specify the number of history partitions. The default value is -1, which means it is not set.

* `dynamic_partition.hot_partition_num`

    Specify how many of the latest partitions are hot partitions. For hot partition, the system will automatically set its `storage_medium` parameter to SSD, and set `storage_cooldown_time`.
    
    **Note: If there is no SSD disk path under the storage path, configuring this parameter will cause dynamic partition creation to fail.**

    `hot_partition_num` is all partitions in the previous n days and in the future.

    
    Let us give an example. Suppose today is 2021-05-20, partition by day, and the properties of dynamic partition are set to: hot_partition_num=2, end=3, start=-3. Then the system will automatically create the following partitions, and set the `storage_medium` and `storage_cooldown_time` properties:
    
    ```
    p20210517: ["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
    p20210518: ["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
    p20210519: ["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
    p20210520: ["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
    p20210521: ["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
    p20210522: ["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
    p20210523: ["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
    ```


* `dynamic_partition.reserved_history_periods`

    The range of reserved history periods. It should be in the form of `[yyyy-MM-dd,yyyy-MM-dd],[...,...]` while the `dynamic_partition.time_unit` is "DAY, WEEK, and MONTH". And it should be in the form of `[yyyy-MM-dd HH:mm:ss,yyyy-MM-dd HH:mm:ss],[...,...]` while the dynamic_partition.time_unit` is "HOUR". And no more spaces expected. The default value is `"NULL"`, which means it is not set.

    Let us give an example. Suppose today is 2021-09-06, partitioned by day, and the properties of dynamic partition are set to: 

    ```time_unit="DAY/WEEK/MONTH", end=3, start=-3, reserved_history_periods="[2020-06-01,2020-06-20],[2020-10-31,2020-11-15]"```.

    The system will automatically reserve following partitions in following period :

    ```
    ["2020-06-01","2020-06-20"],
    ["2020-10-31","2020-11-15"]
    ```
    or

    ```time_unit="HOUR", end=3, start=-3, reserved_history_periods="[2020-06-01 00:00:00,2020-06-01 03:00:00]"```.

    The system will automatically reserve following partitions in following period :

    ```
    ["2020-06-01 00:00:00","2020-06-01 03:00:00"]
    ```

    Otherwise, every `[...,...]` in `reserved_history_periods` is a couple of properties, and they should be set at the same time. And the first date can't be larger than the second one.

- `dynamic_partition.storage_medium`

   <version since="1.2.3"></version>

   Specifies the default storage medium for the created dynamic partition. HDD is the default, SSD can be selected.

   Note that when set to SSD, the `hot_partition_num` property will no longer take effect, all partitions will default to SSD storage media and the cooldown time will be 9999-12-31 23:59:59.

#### Create History Partition Rules

When `create_history_partition` is `true`, i.e. history partition creation is enabled, Doris determines the number of history partitions to be created based on `dynamic_partition.start` and `dynamic_partition.history_partition_num`. 

Assuming the number of history partitions to be created is `expect_create_partition_num`, the number is as follows according to different settings.

1. `create_history_partition` = `true`  
   - `dynamic_partition.history_partition_num` is not set, i.e. -1.  
        `expect_create_partition_num` = `end` - `start`; 

   - `dynamic_partition.history_partition_num` is set   
        `expect_create_partition_num` = `end` - max(`start`, `-histoty_partition_num`);

2. `create_history_partition` = `false`  
    No history partition will be created, `expect_create_partition_num` = `end` - 0;

When `expect_create_partition_num` is greater than `max_dynamic_partition_num` (default 500), creating too many partitions is prohibited.

**Examples:** 

1. Suppose today is 2021-05-20, partition by day, and the attributes of dynamic partition are set to `create_history_partition=true, end=3, start=-3, history_partition_num=1`, then the system will automatically create the following partitions.

    ``` 
    p20210519
    p20210520
    p20210521
    p20210522
    p20210523
    ```

2. `history_partition_num=5` and keep the rest attributes as in 1, then the system will automatically create the following partitions.

    ```
    p20210517
    p20210518
    p20210519
    p20210520
    p20210521
    p20210522
    p20210523
    ```

3. `history_partition_num=-1` i.e., if you do not set the number of history partitions and keep the rest of the attributes as in 1, the system will automatically create the following partitions.

    ```
    p20210517
    p20210518
    p20210519
    p20210520
    p20210521
    p20210522
    p20210523
    ```

### Notice

If some partitions between `dynamic_partition.start` and `dynamic_partition.end` are lost due to some unexpected circumstances when using dynamic partition, the lost partitions between the current time and `dynamic_partition.end` will be recreated, but the lost partitions between `dynamic_partition.start` and the current time will not be recreated.

### Example

1. Table `tbl1` partition column k1, type is DATE, create a dynamic partition rule. By day partition, only the partitions of the last 7 days are kept, and the partitions of the next 3 days are created in advance.

    ```
    CREATE TABLE tbl1
    (
        k1 DATE,
        ...
    )
    PARTITION BY RANGE(k1) ()
    DISTRIBUTED BY HASH(k1)
    PROPERTIES
    (
        "dynamic_partition.enable" = "true",
        "dynamic_partition.time_unit" = "DAY",
        "dynamic_partition.start" = "-7",
        "dynamic_partition.end" = "3",
        "dynamic_partition.prefix" = "p",
        "dynamic_partition.buckets" = "32"
    );
    ```

    Suppose the current date is 2020-05-29. According to the above rules, tbl1 will produce the following partitions:
    
    ```
    p20200529: ["2020-05-29", "2020-05-30")
    p20200530: ["2020-05-30", "2020-05-31")
    p20200531: ["2020-05-31", "2020-06-01")
    p20200601: ["2020-06-01", "2020-06-02")
    ```

    On the next day, 2020-05-30, a new partition will be created `p20200602: [" 2020-06-02 "," 2020-06-03 ")`
    
    On 2020-06-06, because `dynamic_partition.start` is set to -7, the partition 7 days ago will be deleted, that is, the partition `p20200529` will be deleted.
    
2. Table tbl1 partition column k1, type is DATETIME, create a dynamic partition rule. Partition by week, only keep the partition of the last 2 weeks, and create the partition of the next 2 weeks in advance.

    ```
    CREATE TABLE tbl1
    (
        k1 DATETIME,
        ...
    )
    PARTITION BY RANGE(k1) ()
    DISTRIBUTED BY HASH(k1)
    PROPERTIES
    (
        "dynamic_partition.enable" = "true",
        "dynamic_partition.time_unit" = "WEEK",
        "dynamic_partition.start" = "-2",
        "dynamic_partition.end" = "2",
        "dynamic_partition.prefix" = "p",
        "dynamic_partition.buckets" = "8"
    );
    ```

    Suppose the current date is 2020-05-29, which is the 22nd week of 2020. The default week starts on Monday. Based on the above rules, tbl1 will produce the following partitions:
    
    ```
    p2020_22: ["2020-05-25 00:00:00", "2020-06-01 00:00:00")
    p2020_23: ["2020-06-01 00:00:00", "2020-06-08 00:00:00")
    p2020_24: ["2020-06-08 00:00:00", "2020-06-15 00:00:00")
    ```
    
    The start date of each partition is Monday of the week. At the same time, because the type of the partition column k1 is DATETIME, the partition value will fill the hour, minute and second fields, and all are 0.

    On 2020-06-15, the 25th week, the partition 2 weeks ago will be deleted, ie `p2020_22` will be deleted.

    In the above example, suppose the user specified the start day of the week as `"dynamic_partition.start_day_of_week" = "3"`, that is, set Wednesday as the start of week. The partition is as follows:
    
    ```
    p2020_22: ["2020-05-27 00:00:00", "2020-06-03 00:00:00")
    p2020_23: ["2020-06-03 00:00:00", "2020-06-10 00:00:00")
    p2020_24: ["2020-06-10 00:00:00", "2020-06-17 00:00:00")
    ```
    
    That is, the partition ranges from Wednesday of the current week to Tuesday of the next week.
    
    * Note: 2019-12-31 and 2020-01-01 are in same week, if the starting date of the partition is 2019-12-31, the partition name is `p2019_53`, if the starting date of the partition is 2020-01 -01, the partition name is `p2020_01`.

3. Table tbl1 partition column k1, type is DATE, create a dynamic partition rule. Partition by month without deleting historical partitions, and create partitions for the next 2 months in advance. At the same time, set the starting date on the 3rd of each month.

    ```
    CREATE TABLE tbl1
    (
        k1 DATE,
        ...
    )
    PARTITION BY RANGE(k1) ()
    DISTRIBUTED BY HASH(k1)
    PROPERTIES
    (
        "dynamic_partition.enable" = "true",
        "dynamic_partition.time_unit" = "MONTH",
        "dynamic_partition.end" = "2",
        "dynamic_partition.prefix" = "p",
        "dynamic_partition.buckets" = "8",
        "dynamic_partition.start_day_of_month" = "3"
    );
    ```
    
    Suppose the current date is 2020-05-29. Based on the above rules, tbl1 will produce the following partitions:
    
    ```
    p202005: ["2020-05-03", "2020-06-03")
    p202006: ["2020-06-03", "2020-07-03")
    p202007: ["2020-07-03", "2020-08-03")
    ```
    
    Because `dynamic_partition.start` is not set, the historical partition will not be deleted.

    Assuming that today is 2020-05-20, and set 28th as the start of each month, the partition range is:

    ```
    p202004: ["2020-04-28", "2020-05-28")
    p202005: ["2020-05-28", "2020-06-28")
    p202006: ["2020-06-28", "2020-07-28")
    ```

### Modify Dynamic Partition Properties

You can modify the properties of the dynamic partition with the following command

```
ALTER TABLE tbl1 SET
(
    "dynamic_partition.prop1" = "value1",
    ...
);
```

The modification of certain attributes may cause conflicts. Assume that the partition granularity was DAY and the following partitions have been created:

```
p20200519: ["2020-05-19", "2020-05-20")
p20200520: ["2020-05-20", "2020-05-21")
p20200521: ["2020-05-21", "2020-05-22")
```

If the partition granularity is changed to MONTH at this time, the system will try to create a partition with the range `["2020-05-01", "2020-06-01")`, and this range conflicts with the existing partition. So it cannot be created. And the partition with the range `["2020-06-01", "2020-07-01")` can be created normally. Therefore, the partition between 2020-05-22 and 2020-05-30 needs to be filled manually.

### Check Dynamic Partition Table Scheduling Status

You can further view the scheduling of dynamic partitioned tables by using the following command:

```    
mysql> SHOW DYNAMIC PARTITION TABLES;
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

* LastUpdateTime: The last time of modifying dynamic partition properties 
* LastSchedulerTime: The last time of performing dynamic partition scheduling
* State: The state of the last execution of dynamic partition scheduling
* LastCreatePartitionMsg: Error message of the last time to dynamically add partition scheduling
* LastDropPartitionMsg: Error message of the last execution of dynamic deletion partition scheduling

## Advanced Operation

### FE Configuration Item

* dynamic\_partition\_enable

    Whether to enable Doris's dynamic partition feature. The default value is false, which is off. This parameter only affects the partitioning operation of dynamic partition tables, not normal tables. You can modify the parameters in `fe.conf` and restart FE to take effect. You can also execute the following commands at runtime to take effect:
    
    MySQL protocol:
    
    `ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true")`
    
    HTTP protocol:
    
    `curl --location-trusted -u username:password -XGET http://fe_host:fe_http_port/api/_set_config?dynamic_partition_enable=true`
    
    To turn off dynamic partitioning globally, set this parameter to false.
    
* dynamic\_partition\_check\_interval\_seconds

    The execution frequency of dynamic partition threads defaults to 3600 (1 hour), that is, scheduling is performed every 1 hour. You can modify the parameters in `fe.conf` and restart FE to take effect. You can also modify the following commands at runtime:
    
    MySQL protocol:

    `ADMIN SET FRONTEND CONFIG ("dynamic_partition_check_interval_seconds" = "7200")`
    
    HTTP protocol:
    
    `curl --location-trusted -u username:password -XGET http://fe_host:fe_http_port/api/_set_config?dynamic_partition_check_interval_seconds=432000`
    
### Converting dynamic and manual partition tables to each other

For a table, dynamic and manual partitioning can be freely converted, but they cannot exist at the same time, there is and only one state.

#### Converting Manual Partitioning to Dynamic Partitioning

If a table is not dynamically partitioned when it is created, it can be converted to dynamic partitioning at runtime by modifying the dynamic partitioning properties with `ALTER TABLE`, an example of which can be seen with `HELP ALTER TABLE`.

When dynamic partitioning feature is enabled, Doris will no longer allow users to manage partitions manually, but will automatically manage partitions based on dynamic partition properties.

**NOTICE**: If `dynamic_partition.start` is set, historical partitions with a partition range before the start offset of the dynamic partition will be deleted.

#### Converting Dynamic Partitioning to Manual Partitioning

The dynamic partitioning feature can be disabled by executing `ALTER TABLE tbl_name SET ("dynamic_partition.enable" = "false") ` and converting it to a manual partition table.

When dynamic partitioning feature is disabled, Doris will no longer manage partitions automatically, and users will have to create or delete partitions manually by using `ALTER TABLE`.

## Common problem

1. After creating the dynamic partition table, it prompts ```Could not create table with dynamic partition when fe config dynamic_partition_enable is false```

	Because the main switch of dynamic partition, that is, the configuration of FE ```dynamic_partition_enable``` is false, the dynamic partition table cannot be created.
         
	At this time, please modify the FE configuration file, add a line ```dynamic_partition_enable=true```, and restart FE. Or execute the command ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true") to turn on the dynamic partition switch.

2. Replica settings for dynamic partitions

    Dynamic partitions are automatically created by scheduling logic inside the system. When creating a partition automatically, the partition properties (including the number of replicas of the partition, etc.) are all prefixed with `dynamic_partition`, rather than the default properties of the table. for example:

    ```
    CREATE TABLE tbl1 (
    `k1` int,
    `k2` date
    )
    PARTITION BY RANGE(k2)()
    DISTRIBUTED BY HASH(k1) BUCKETS 3
    PROPERTIES
    (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32",
    "dynamic_partition.replication_num" = "1",
    "dynamic_partition.start" = "-3",
    "replication_num" = "3"
    );
    ```

    In this example, no initial partition is created (partition definition in PARTITION BY clause is empty), and `DISTRIBUTED BY HASH(k1) BUCKETS 3`, `"replication_num" = "3"`, `"dynamic_partition is set. replication_num" = "1` and `"dynamic_partition.buckets" = "32"`.

    We make the first two parameters the default parameters for the table, and the last two parameters the dynamic partition-specific parameters.

    When the system automatically creates a partition, it will use the two configurations of bucket number 32 and replica number 1 (that is, parameters dedicated to dynamic partitions). Instead of the two configurations of bucket number 3 and replica number 3.

    When a user manually adds a partition through the `ALTER TABLE tbl1 ADD PARTITION` statement, the two configurations of bucket number 3 and replica number 3 (that is, the default parameters of the table) will be used.

    That is, dynamic partitioning uses a separate set of parameter settings. The table's default parameters are used only if no dynamic partition-specific parameters are set. as follows:

    ```
    CREATE TABLE tbl2 (
    `k1` int,
    `k2` date
    )
    PARTITION BY RANGE(k2)()
    DISTRIBUTED BY HASH(k1) BUCKETS 3
    PROPERTIES
    (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.start" = "-3",
    "dynamic_partition.buckets" = "32",
    "replication_num" = "3"
    );
    ```

    In this example, if `dynamic_partition.replication_num` is not specified separately, the default parameter of the table is used, which is `"replication_num" = "3"`.

	And the following example:

     ```
     CREATE TABLE tbl3 (
     `k1` int,
     `k2` date
     )
     PARTITION BY RANGE(k2)(
         PARTITION p1 VALUES LESS THAN ("2019-10-10")
     )
     DISTRIBUTED BY HASH(k1) BUCKETS 3
     PROPERTIES
     (
     "dynamic_partition.enable" = "true",
     "dynamic_partition.time_unit" = "DAY",
     "dynamic_partition.end" = "3",
     "dynamic_partition.prefix" = "p",
     "dynamic_partition.start" = "-3",
     "dynamic_partition.buckets" = "32",
     "dynamic_partition.replication_num" = "1",
     "replication_num" = "3"
     );
     ```

     In this example, there is a manually created partition p1. This partition will use the default settings for the table, which are 3 buckets and 3 replicas. The dynamic partitions automatically created by the subsequent system will still use the special parameters for dynamic partitions, that is, the number of buckets is 32 and the number of replicas is 1.

## More Help

For more detailed syntax and best practices for using dynamic partitions, see [SHOW DYNAMIC PARTITION](../../sql-manual/sql-reference/Show-Statements/SHOW-DYNAMIC-PARTITION.md) Command manual, you can also enter `HELP ALTER TABLE` in the MySql client command line for more help information.
Suppose today is 2021-05-20, partition by day, and the attributes of dynamic partition are set to `create_history_partition=true, end=3, start=-3, history_partition_num=1`, then the system will automatically create the following partitions.

```
p20210519
p20210520
p20210521
p20210522
p20210523
```

`history_partition_num=5` and keep the rest attributes as in 1, then the system will automatically create the following partitions.

```
p20210517
p20210518
p20210519
p20210520
p20210521
p20210522
p20210523
```

`history_partition_num=-1` i.e., if you do not set the number of history partitions and keep the rest of the attributes as in 1, the system will automatically create the following partitions.

```
p20210517
p20210518
p20210519
p20210520
p20210521
p20210522
p20210523
```

### Example

1. Table `tbl1` partition column k1, type is DATE, create a dynamic partition rule. By day partition, only the partitions of the last 7 days are kept, and the partitions of the next 3 days are created in advance.

   ```
   CREATE TABLE tbl1
   (
       k1 DATE,
       ...
   )
   PARTITION BY RANGE(k1) ()
   DISTRIBUTED BY HASH(k1)
   PROPERTIES
   (
       "dynamic_partition.enable" = "true",
       "dynamic_partition.time_unit" = "DAY",
       "dynamic_partition.start" = "-7",
       "dynamic_partition.end" = "3",
       "dynamic_partition.prefix" = "p",
       "dynamic_partition.buckets" = "32"
   );
   ```

   Suppose the current date is 2020-05-29. According to the above rules, tbl1 will produce the following partitions:

   ```
   p20200529: ["2020-05-29", "2020-05-30")
   p20200530: ["2020-05-30", "2020-05-31")
   p20200531: ["2020-05-31", "2020-06-01")
   p20200601: ["2020-06-01", "2020-06-02")
   ```

   On the next day, 2020-05-30, a new partition will be created `p20200602: [" 2020-06-02 "," 2020-06-03 ")`

   On 2020-06-06, because `dynamic_partition.start` is set to -7, the partition 7 days ago will be deleted, that is, the partition `p20200529` will be deleted.

2. Table tbl1 partition column k1, type is DATETIME, create a dynamic partition rule. Partition by week, only keep the partition of the last 2 weeks, and create the partition of the next 2 weeks in advance.

   ```
   CREATE TABLE tbl1
   (
       k1 DATETIME,
       ...
   )
   PARTITION BY RANGE(k1) ()
   DISTRIBUTED BY HASH(k1)
   PROPERTIES
   (
       "dynamic_partition.enable" = "true",
       "dynamic_partition.time_unit" = "WEEK",
       "dynamic_partition.start" = "-2",
       "dynamic_partition.end" = "2",
       "dynamic_partition.prefix" = "p",
       "dynamic_partition.buckets" = "8"
   );
   ```

   Suppose the current date is 2020-05-29, which is the 22nd week of 2020. The default week starts on Monday. Based on the above rules, tbl1 will produce the following partitions:

   ```
   p2020_22: ["2020-05-25 00:00:00", "2020-06-01 00:00:00")
   p2020_23: ["2020-06-01 00:00:00", "2020-06-08 00:00:00")
   p2020_24: ["2020-06-08 00:00:00", "2020-06-15 00:00:00")
   ```

   The start date of each partition is Monday of the week. At the same time, because the type of the partition column k1 is DATETIME, the partition value will fill the hour, minute and second fields, and all are 0.

   On 2020-06-15, the 25th week, the partition 2 weeks ago will be deleted, ie `p2020_22` will be deleted.

   In the above example, suppose the user specified the start day of the week as `"dynamic_partition.start_day_of_week" = "3"`, that is, set Wednesday as the start of week. The partition is as follows:

   ```
   p2020_22: ["2020-05-27 00:00:00", "2020-06-03 00:00:00")
   p2020_23: ["2020-06-03 00:00:00", "2020-06-10 00:00:00")
   p2020_24: ["2020-06-10 00:00:00", "2020-06-17 00:00:00")
   ```

   That is, the partition ranges from Wednesday of the current week to Tuesday of the next week.

   :::tip

   2019-12-31 and 2020-01-01 are in same week, if the starting date of the partition is 2019-12-31, the partition name is `p2019_53`, if the starting date of the partition is 2020-01 -01, the partition name is `p2020_01`.

   :::

3. Table tbl1 partition column k1, type is DATE, create a dynamic partition rule. Partition by month without deleting historical partitions, and create partitions for the next 2 months in advance. At the same time, set the starting date on the 3rd of each month.

   ```
   CREATE TABLE tbl1
   (
       k1 DATE,
       ...
   )
   PARTITION BY RANGE(k1) ()
   DISTRIBUTED BY HASH(k1)
   PROPERTIES
   (
       "dynamic_partition.enable" = "true",
       "dynamic_partition.time_unit" = "MONTH",
       "dynamic_partition.end" = "2",
       "dynamic_partition.prefix" = "p",
       "dynamic_partition.buckets" = "8",
       "dynamic_partition.start_day_of_month" = "3"
   );
   ```

   Suppose the current date is 2020-05-29. Based on the above rules, tbl1 will produce the following partitions:

   ```
   p202005: ["2020-05-03", "2020-06-03")
   p202006: ["2020-06-03", "2020-07-03")
   p202007: ["2020-07-03", "2020-08-03")
   ```

   Because `dynamic_partition.start` is not set, the historical partition will not be deleted.

   Assuming that today is 2020-05-20, and set 28th as the start of each month, the partition range is:

   ```
   p202004: ["2020-04-28", "2020-05-28")
   p202005: ["2020-05-28", "2020-06-28")
   p202006: ["2020-06-28", "2020-07-28")
   ```

### Principle and control behavior

Apache Doris sets a fixed FE control thread that continuously checks the table based on dynamic partitioning at specific time intervals (specified by the `dynamic_partition_check_interval_seconds` field) to perform the necessary partition creation and deletion operations.

Specifically, when dynamic partitioning is executed, the following checks and operations are performed (refer to the start time of the partition as `START` and the end time as `END`, and omit `dynamic_partition.`):

- All partitions before `START` are deleted. 
- If `create_history_partition` is `false`, create all partitions between the current time and `END`; if `create_history_partition` is `true`, not only all partitions between the current time and `END` are created, but also all partitions between `START` and current time are created. If `history_partition_num` is specified, the number of created partitions before current time cannot exceed the value of `history_partition_num`. 

Note that:

- If the partition time range intersects with the `[START, END]` range, it is considered to belong to the current dynamic partition time range.
- If the newly created partition conflicts with an existing partition, the current partition is retained, and the new partition is not created. If the conflict occurs when the table is created, DDL will occur an error.

Therefore, after the automatic maintenance of the partition table, the state presented is as follows:

- **No partitions are included** before the `START` time except for those specified in `reserved_history_periods`.
- **All manually created partitions** after the `END` time are retained. 
- Apart from manually deleted or accidentally lost partitions, the table contains all partitions within a specific range:
  - If `create_history_partition` is `true`, 
    - if `history_partition_num` is specified, the specific range is `[max(START, current time) - history_partition_num * time_unit), END]`;
    - if `history_partition_num` is not specified, the specific range is `[START, END]`.
  - If `dynamic_partition.create_history_partition` is `false`, the specific range is `[current time, END]`, also including existing partitions in `[START, current time)`.
  The entire specific range is divided into multiple partition ranges based on `time_unit`. If a range intersects with an existing partition `X`, `X` is preserved; otherwise, the range will be completely covered by a partition created by dynamic partition. 
- Unless the number of partitions is about to exceed `max_dynamic_partition_num`, the creation will fail.

### Modify properties

You can modify the properties of the dynamic partitioning with the following command:

```
ALTER TABLE tbl1 SET
(
    "dynamic_partition.prop1" = "value1",
    ...
);
```

The modification of certain attributes may cause conflicts. Assume that the partition granularity was DAY and the following partitions have been created:

```
p20200519: ["2020-05-19", "2020-05-20")
p20200520: ["2020-05-20", "2020-05-21")
p20200521: ["2020-05-21", "2020-05-22")
```

If the partition granularity is changed to MONTH at this time, the system will try to create a partition with the range `["2020-05-01", "2020-06-01")`, and this range conflicts with the existing partition. So it cannot be created. And the partition with the range `["2020-06-01", "2020-07-01")` can be created normally. Therefore, the partition between 2020-05-22 and 2020-05-30 needs to be filled manually.

### Check table scheduling status

You can further view the scheduling of dynamic partitioned tables by using the following command:

```sql
mysql> SHOW DYNAMIC PARTITION TABLES;
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

- `LastUpdateTime`: The last time of modifying dynamic partition properties 
- `LastSchedulerTime`: The last time of performing dynamic partition scheduling
- `State`: The state of the last execution of dynamic partition scheduling
- `LastCreatePartitionMsg`: Error message of the last time to dynamically add partition scheduling
- `LastDropPartitionMsg`: Error message of the last execution of dynamic deletion partition scheduling

### Advanced operations

**Modify FE configuration items**

- `dynamic\_partition\_enable`

  Whether to enable Doris's dynamic partition feature. The default value is `false`, which is off. This parameter only affects the partitioning operation of dynamic partition tables, not normal tables. You can modify the parameters in `fe.conf` and restart FE to take effect. You can also execute the following commands at runtime to take effect:

  ```sql
  MySQL protocol:

  `ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true")`

  HTTP protocol:

  `curl --location-trusted -u username:password -XGET http://fe_host:fe_http_port/api/_set_config?dynamic_partition_enable=true`
  ```

  To turn off dynamic partitioning globally, set this parameter to `false`.

- `dynamic\_partition\_check\_interval\_seconds`

  The execution frequency of dynamic partition threads defaults to 600 (10 minutes), that is, scheduling is performed every 10 minutes. You can modify the parameters in `fe.conf` and restart FE to take effect. You can also modify the following commands at runtime:

  ```sql
  MySQL protocol:
  
  `ADMIN SET FRONTEND CONFIG ("dynamic_partition_check_interval_seconds" = "7200")`
  
  HTTP protocol:
  
  `curl --location-trusted -u username:password -XGET http://fe_host:fe_http_port/api/_set_config?dynamic_partition_check_interval_seconds=432000`
  ```

**Switching between dynamic partitioning and manual partitioning**

You can switch a table between dynamic and manual partitioning, but a table cannot be partitioned simultaneously by dynamic and manual partitioning.

By running the `ALTER TABLE tbl_name SET ("dynamic_partition.enable" = "<true/false>")` command, you can turn on and off dynamic partitioning.

When dynamic partitioning is turned off, Apache Doris will no longer manage partitions automatically, and users need to create or delete partitions manually by using `ALTER TABLE`; when dynamic partitioning is turned on, redundant partitions will be deleted according to the rules of dynamic partitioning.

## Auto partitioning

### Application scenario

The Auto Partitioning feature supports automatic detection of whether the corresponding partition exists during the data import process. If it does not exist, the partition will be created automatically and imported normally.

The auto partition function mainly solves the problem that the user expects to partition the table based on a certain column, but the data distribution of the column is scattered or unpredictable, so it is difficult to accurately create the required partitions when building or adjusting the structure of the table, or the number of partitions is so large that it is too cumbersome to create them manually.

Take the time type partition column as an example, in dynamic partitioning, we support the automatic creation of new partitions to accommodate real-time data at specific time periods. For real-time user behavior logs and other scenarios, this feature basically meets the requirements. However, in more complex scenarios, such as dealing with non-real-time data, the partition column is independent of the current system time and contains a large number of discrete values. At this time, to improve efficiency we want to partition the data based on this column, but the data may actually involve the partition can not be grasped in advance, or the expected number of required partitions is too large. In this case, dynamic partitioning or manually created partitions cannot meet our needs, while auto partitioning covers such needs.

Suppose the table DDL is as follows:

```sql
CREATE TABLE `DAILY_TRADE_VALUE`
(
    `TRADE_DATE`              datev2 NOT NULL COMMENT 'TRADE_DATE',
    `TRADE_ID`                varchar(40) NOT NULL COMMENT 'TRADE_ID',
    ......
)
UNIQUE KEY(`TRADE_DATE`, `TRADE_ID`)
PARTITION BY RANGE(`TRADE_DATE`)
(
    PARTITION p_2000 VALUES [('2000-01-01'), ('2001-01-01')),
    PARTITION p_2001 VALUES [('2001-01-01'), ('2002-01-01')),
    PARTITION p_2002 VALUES [('2002-01-01'), ('2003-01-01')),
    PARTITION p_2003 VALUES [('2003-01-01'), ('2004-01-01')),
    PARTITION p_2004 VALUES [('2004-01-01'), ('2005-01-01')),
    PARTITION p_2005 VALUES [('2005-01-01'), ('2006-01-01')),
    PARTITION p_2006 VALUES [('2006-01-01'), ('2007-01-01')),
    PARTITION p_2007 VALUES [('2007-01-01'), ('2008-01-01')),
    PARTITION p_2008 VALUES [('2008-01-01'), ('2009-01-01')),
    PARTITION p_2009 VALUES [('2009-01-01'), ('2010-01-01')),
    PARTITION p_2010 VALUES [('2010-01-01'), ('2011-01-01')),
    PARTITION p_2011 VALUES [('2011-01-01'), ('2012-01-01')),
    PARTITION p_2012 VALUES [('2012-01-01'), ('2013-01-01')),
    PARTITION p_2013 VALUES [('2013-01-01'), ('2014-01-01')),
    PARTITION p_2014 VALUES [('2014-01-01'), ('2015-01-01')),
    PARTITION p_2015 VALUES [('2015-01-01'), ('2016-01-01')),
    PARTITION p_2016 VALUES [('2016-01-01'), ('2017-01-01')),
    PARTITION p_2017 VALUES [('2017-01-01'), ('2018-01-01')),
    PARTITION p_2018 VALUES [('2018-01-01'), ('2019-01-01')),
    PARTITION p_2019 VALUES [('2019-01-01'), ('2020-01-01')),
    PARTITION p_2020 VALUES [('2020-01-01'), ('2021-01-01')),
    PARTITION p_2021 VALUES [('2021-01-01'), ('2022-01-01'))
)
DISTRIBUTED BY HASH(`TRADE_DATE`) BUCKETS 10
PROPERTIES (
  "replication_num" = "1"
);
```

The table stores a large amount of business history data, partitioned based on the date the transaction occurred. As you can see when building the table, we need to manually create the partitions in advance. If the data range of the partitioned columns changes, for example, 2022 is added to the above table, we need to create a partition by [ALTER-TABLE-PARTITION](../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-PARTITION) to make changes to the table partition. If such partitions need to be changed, or subdivided at a finer level of granularity, it is very tedious to modify them. At this point we can rewrite the table DDL using auto partitioning.

### Syntax

When creating a table, use the following syntax to populate the `partition_info` section in the `CREATE-TABLE`statement:

- For RANGE partitioning:

  ```sql
   AUTO PARTITION BY RANGE (FUNC_CALL_EXPR)
     (
     )
  ```

   Where,

  ```sql
  FUNC_CALL_EXPR ::= date_trunc ( <partition_column>, '<interval>' )
  ```

:::info Note

In Apache Doris 2.1.0 version, `FUNC_CALL_EXPR` needs not to be enclosed in parentheses.

:::

- For LIST partitioning:

  ```sql
  AUTO PARTITION BY LIST(`partition_col`)
  (
  )
  ```

**Sample**


- For RANGE partitioning:

  ```sql
     CREATE TABLE `date_table` (
         `TIME_STAMP` datev2 NOT NULL COMMENT '采集日期'
     ) ENGINE=OLAP
     DUPLICATE KEY(`TIME_STAMP`)
     AUTO PARTITION BY RANGE (date_trunc(`TIME_STAMP`, 'month'))
     (
     )
     DISTRIBUTED BY HASH(`TIME_STAMP`) BUCKETS 10
     PROPERTIES (
     "replication_allocation" = "tag.location.default: 1"
     );
  ```

- For LIST partitioning:

  ```sql
  CREATE TABLE `str_table` (
      `str` varchar not null
  ) ENGINE=OLAP
  DUPLICATE KEY(`str`)
  AUTO PARTITION BY LIST (`str`)
  (
  )
  DISTRIBUTED BY HASH(`str`) BUCKETS 10
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
  );
  ```

**Constraints**

- In auto LIST partitioning, the partition name length **must** **not exceed 50 characters**. This length is derived from the concatenation and escape of contents of partition columns on corresponding data rows, so the actual allowed length may be shorter.
- In auto RANGE partitioning, the partition function only supports `date_trunc`, and the partition column supports only `DATE` or `DATETIME` formats. 
- In auto LIST partitioning, function calls are not supported, and the partition column supports `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `DATE`, `DATETIME`, `CHAR`, `VARCHAR` data types, with partition values being enumeration values. 
- In auto LIST partitioning, for every existing value in the partition column that does not correspond to a partition, a new independent partitioning will be created. 

**NULL value partitioning**

When the session variable `allow_partition_column_nullable` is enabled, LIST and RANGE partitioning support null columns as partition columns. 

When an actual insertion encounters a null value in the partition column:

- For auto LIST partitioning, the corresponding NULL value partition will be created automatically:
```sql
mysql> create table auto_null_list(
    -> k0 varchar null
    -> )
    -> auto partition by list (k0)
    -> (
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.10 sec)

mysql> insert into auto_null_list values (null);
Query OK, 1 row affected (0.28 sec)

mysql> select * from auto_null_list;
+------+
| k0   |
+------+
| NULL |
+------+
1 row in set (0.20 sec)

mysql> select * from auto_null_list partition(pX);
+------+
| k0   |
+------+
| NULL |
+------+
1 row in set (0.20 sec)
```

- For auto LIST partitioning, **null columns are not supported to be partition columns**.
```sql
mysql>  CREATE TABLE `range_table_nullable` (
    ->      `k1` INT,
    ->      `k2` DATETIMEV2(3),
    ->      `k3` DATETIMEV2(6)
    ->  ) ENGINE=OLAP
    ->  DUPLICATE KEY(`k1`)
    ->  AUTO PARTITION BY RANGE (date_trunc(`k2`, 'day'))
    ->  (
    ->  )
    ->  DISTRIBUTED BY HASH(`k1`) BUCKETS 16
    ->  PROPERTIES (
    ->  "replication_allocation" = "tag.location.default: 1"
    ->  );
ERROR 1105 (HY000): errCode = 2, detailMessage = AUTO RANGE PARTITION doesn't support NULL column
```

### Example

When using auto partitioning, the example in the Application scenarios section can be rewritten as:

```sql
CREATE TABLE `DAILY_TRADE_VALUE`
(
    `TRADE_DATE`              datev2 NOT NULL COMMENT '交易日期',
    `TRADE_ID`                varchar(40) NOT NULL COMMENT '交易编号',
    ......
)
UNIQUE KEY(`TRADE_DATE`, `TRADE_ID`)
AUTO PARTITION BY RANGE (date_trunc(`TRADE_DATE`, 'year'))
(
)
DISTRIBUTED BY HASH(`TRADE_DATE`) BUCKETS 10
PROPERTIES (
  "replication_num" = "1"
);
```

At this point, the new table has no default partitions:

```sql
mysql> show partitions from `DAILY_TRADE_VALUE`;
Empty set (0.12 sec)
```

After inserting data and checking again, it is found that the table has created the corresponding partitions:

```sql
mysql> insert into `DAILY_TRADE_VALUE` values ('2012-12-13', 1), ('2008-02-03', 2), ('2014-11-11', 3);
Query OK, 3 rows affected (0.88 sec)

mysql> show partitions from `DAILY_TRADE_VALUE`;
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
| PartitionId | PartitionName   | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
| 180060      | p20080101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2008-01-01]; ..types: [DATEV2]; keys: [2009-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
| 180039      | p20120101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2012-01-01]; ..types: [DATEV2]; keys: [2013-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
| 180018      | p20140101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2014-01-01]; ..types: [DATEV2]; keys: [2015-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
3 rows in set (0.12 sec)
```

It can be concluded that the partitions created by auto partitioning share the same functionality as partitions created by manual partitioning.

### Conjunct with dynamic partitioning

In order to maintain a clear partitioning logic, Apache Doris prohibits the simultaneous use of auto partitioning and dynamic partitioning on a single table, as this usage can easily lead to misuse. It is recommended to replace this with the standalone Auto Partitioning feature.

:::info Note
In some early versions of Doris 2.1, this functionality was not prohibited but not recommended.
:::

### Key points

- Similar to regular partitioned tables, aoto LIST partitioning supports multi-column partitioning with no syntax differences. 
- If partitions are created during data insertion or import processes, and the entire import process is not completed (fails or is canceled), the created partitions will not be automatically deleted. 
- Tables using auto partitioning only differ in the method of partition creation, switching from manual to automatic. The original usage of the table and its created partitions remains the same as non-auto partitioning tables or partitions. 
- To prevent the accidental creation of too many partitions, Apache Doris controls the maximum number of partitions an auto partitioning table can accommodate through the `max_auto_partition_num setting` in the FE configuration. This value can be adjusted if needed.
- When importing data into a table with auto partitioning enabled, the coordinator sends data with a polling interval different from regular tables. Refer to `olap_table_sink_send_interval_auto_partition_factor`  in [BE Configuration](../admin-manual/config/be-config.md) for details. This setting does not have an impact after `enable_memtable_on_sink_node` is enabled. 
- During data insertion using `INSERT-OVERWRITE`, if a specific partition for override is specified, the auto partitioning table behaves like a regular table during this process and does not create new partitions. 
- If metadata operations are involved when importing and creating partitions, the import process may fail.

## Manual bucketing

If partitions are used, `DISTRIBUTED ..`. statement describes the rules for dividing data within each partition.

If partitions are not used, it describes the rules for dividing the data across the entire table.

It is also possible to specify a bucketing method for each partition individually.

The bucket columns can be multiple columns. For the Aggregate and Unique models, they must be Key columns, while for the duplicate key data model, they can be both key and value columns. Bucket columns can be the same as or different from Partition columns.

The choice of bucket columns involves a trade-off between query throughput and query concurrency:

- If multiple bucket columns are selected, the data distribution will be more uniform. If a query condition does not include equal conditions for all bucket columns, the query will trigger simultaneous scanning of all buckets, increasing query throughput and reducing the latency of individual queries. This approach is suitable for high-throughput, low-concurrency query scenarios.
- If only one or a few bucket columns are selected, a point query can trigger scanning of just one bucket. In this case, when multiple point queries are concurrent, there is a higher probability that they will trigger scanning of different buckets, reducing the IO impact between queries (especially when different buckets are distributed across different disks). Therefore, this approach is suitable for high-concurrency point query scenarios.

### Recommendations for bucket number and data volume:

- The total number of tablets for a table is equal to (Partition num * Bucket num).
- Without considering expansion, it is recommended that the number of tablets for a table be slightly more than the total number of disks in the cluster.
- In theory, there is no upper or lower limit for the data volume of a single tablet, but it is recommended to be within the range of 1G - 10G. If the data volume of a single tablet is too small, the data aggregation effect will not be good, and the metadata management pressure will be high. If the data volume is too large, it will not be conducive to the migration and replenishment of replicas, and it will increase the cost of retrying failed operations such as Schema Change or Rollup (the granularity of retrying these operations is the tablet).
- When there is a conflict between the data volume principle and the quantity principle of tablets, it is recommended to prioritize the data volume principle.
- When creating a table, the bucket number for each partition is uniformly specified. However, when dynamically adding partitions `ADD PARTITION`, the bucket number for the new partition can be specified separately. This feature can be conveniently used to handle data reduction or expansion.
- Once the bucket number for a partition is specified, it cannot be changed. Therefore, when determining the bucket number, it is necessary to consider the cluster expansion scenario in advance. For example, if there are only 3 hosts with 1 disk each, and the bucket number is set to 3 or less, then even if more machines are added later, the concurrency cannot be improved.

Here are some examples: Assuming there are 10 BEs, each with one disk. If a table has a total size of 500MB, 4-8 tablets can be considered. For 5GB: 8-16 tablets. For 50GB: 32 tablets. For 500GB: It is recommended to partition the table, with each partition size around 50GB and 16-32 tablets per partition. For 5TB: It is recommended to partition the table, with each partition size around 50GB and 16-32 tablets per partition.

The data volume of a table can be viewed using the [SHOW DATA](../sql-manual/sql-statements/Show-Statements/SHOW-DATA) command, and the result should be divided by the number of replicas to obtain the actual data volume of the table.

### Random distribution

- If an OLAP table does not have fields of the update type, setting the data bucketing mode of the table to RANDOM can avoid severe data skew. When data is imported into the corresponding partitions of the table, each batch of a single import job will randomly select a tablet for writing.
- When the bucketing mode of a table is set to RANDOM, there is no bucketing column, it is not possible to query only a few buckets based on the values of the bucketing column. Queries on the table will simultaneously scan all buckets that hit the partition. This setting is suitable for aggregate query analysis of the entire table data, but not suitable for high-concurrency point queries.
- If the data distribution of the OLAP table is Random Distribution, then during data import, single-tablet import mode can be set (set `load_to_single_tablet` to true). Then, during large-volume data import, a task will only write to one tablet when writing data to the corresponding partition. This can improve the concurrency and throughput of data import, reduce the write amplification caused by data import and compaction, and ensure the stability of the cluster.

## Auto bucket

Users often encounter various issues due to improper bucket settings. To address this, we provide an automated approach for setting the number of buckets, which is currently applicable only to OLAP tables.

:::tip

This feature will be disabled when synchronized by CCR. If this table is copied by CCR, that is, PROPERTIES contains `is_being_synced = true`, it will be displayed as enabled in show create table, but will not actually take effect. When `is_being_synced` is set to `false`, these features will resume working, but the `is_being_synced` property is for CCR peripheral modules only and should not be manually set during CCR synchronization.  

:::

In the past, user had to set the number of buckets manually when creating table, but the automatic bucket feature is a way for Apache Doris to dynamically project the number of buckets, so that the number of buckets always stays within a suitable range and users don't have to worry about the minutiae of the number of buckets.

For the sake of clarity, this section splits the bucket into two periods, the initial bucket and the subsequent bucket; the initial and subsequent are just terms used in this article to describe the feature clearly, there is no initial or subsequent Apache Doris bucket.

As we know from the section above on creating buckets, `BUCKET_DESC` is very simple, but you need to specify the number of buckets; for the automatic bucket projection feature, the syntax of BUCKET_DESC directly changes the number of buckets to `Auto` and adds a new Properties configuration.

```sql
-- old version of the creation syntax for specifying the number of buckets
DISTRIBUTED BY HASH(site) BUCKETS 20

-- Newer versions use the creation syntax for automatic bucket imputation
DISTRIBUTED BY HASH(site) BUCKETS AUTO
properties("estimate_partition_size" = "100G")
```

The new configuration parameter estimate_partition_size indicates the amount of data for a single partition. This parameter is optional and if not given, Doris will take the default value of estimate_partition_size to 10GB.

As you know from the above, a partitioned bucket is a tablet at the physical level, and for best performance, it is recommended that the tablet size be in the range of 1GB - 10GB. So how does the automatic bucketing projection ensure that the tablet size is within this range? 

To summarize, there are a few principles.

- If the overall data volume is small, the number of buckets should not be set too high
- If the overall data volume is large, the number of buckets should be related to the total number of disk blocks, so as to fully utilize the capacity of each BE machine and each disk

:::tip
propertie estimate_partition_size not support alter
:::

### Initial bucketing projection

1. Obtain a number of buckets N based on the data size. Initially, we divide the value of `estimate_partition_size` by 5 (considering a data compression ratio of 5 to 1 when storing data in text format in Doris). The result obtained is

```
(, 100MB), then take N=1

[100MB, 1GB), then take N=2

(1GB, ), then one bucket per GB
```

2. calculate the number of buckets M based on the number of BE nodes and the disk capacity of each BE node.

```
Where each BE node counts as 1, and every 50G of disk capacity counts as 1.

The calculation rule for M is: M = Number of BE nodes * (Size of one disk block / 50GB) * Number of disk blocks.

For example: If there are 3 BEs, and each BE has 4 disks of 500GB, then M = 3 * (500GB / 50GB) * 4 = 120.

```

3. Calculation logic to get the final number of buckets.

```
Calculate an intermediate value x = min(M, N, 128).

If x < N and x < the number of BE nodes, the final bucket is y.

The number of BE nodes; otherwise, the final bucket is x.
```

4. x = max(x, autobucket_min_buckets), Here autobucket_min_buckets is configured in Config (where, default is 1)

The pseudo-code representation of the above process is as follows

```
int N = Compute the N value;
int M = compute M value;

int y = number of BE nodes;
int x = min(M, N, 128);

if (x < N && x < y) {
  return y;
}
return x;
```

With the above algorithm in mind, let's introduce some examples to better understand this part of the logic.

```
case1:
Amount of data 100 MB, 10 BE machines, 2TB * 3 disks
Amount of data N = 1
BE disks M = 10* (2TB/50GB) * 3 = 1230
x = min(M, N, 128) = 1
Final: 1

case2:
Data volume 1GB, 3 BE machines, 500GB * 2 disks
Amount of data N = 2
BE disks M = 3* (500GB/50GB) * 2 = 60
x = min(M, N, 128) = 2
Final: 2

case3:
Data volume 100GB, 3 BE machines, 500GB * 2 disks
Amount of data N = 20
BE disks M = 3* (500GB/50GB) * 2 = 60
x = min(M, N, 128) = 20
Final: 20

case4:
Data volume 500GB, 3 BE machines, 1TB * 1 disk
Data volume N = 100
BE disks M = 3* (1TB /50GB) * 1 = 60
x = min(M, N, 128) = 63
Final: 63

case5:
Data volume 500GB, 10 BE machines, 2TB * 3 disks
Amount of data N = 100
BE disks M = 10* (2TB / 50GB) * 3 = 1230
x = min(M, N, 128) = 100
Final: 100

case 6:
Data volume 1TB, 10 BE machines, 2TB * 3 disks
Amount of data N = 205
BE disks M = 10* (2TB / 50GB) * 3 = 1230
x = min(M, N, 128) = 128
Final: 128

case 7:
Data volume 500GB, 1 BE machine, 100TB * 1 disk
Amount of data N = 100
BE disk M = 1* (100TB / 50GB) * 1 = 2048
x = min(M, N, 128) = 100
Final: 100

case 8:
Data volume 1TB, 200 BE machines, 4TB * 7 disks
Amount of data N = 205
BE disks M = 200* (4TB / 50GB) * 7 = 114800
x = min(M, N, 128) = 128
Final: 200
```

### Subsequent bucketing projection

The above is the calculation logic for the initial bucketing. The subsequent bucketing can be evaluated based on the amount of partition data available since there is already a certain amount of partition data. The subsequent bucket size is evaluated based on the EMA[1] (short term exponential moving average) value of up to the first 7 partitions, which is used as the estimate_partition_size. At this point there are two ways to calculate the partition buckets, assuming partitioning by days, counting forward to the first day partition size of S7, counting forward to the second day partition size of S6, and so on to S1.

- If the partition data in 7 days is strictly increasing daily, then the trend value will be taken at this time. There are 6 delta values, which are

```
S7 - S6 = delta1,
S6 - S5 = delta2,
...
S2 - S1 = delta6
```

This yields the ema(delta) value.Then, today's estimate_partition_size = S7 + ema(delta)

- not the first case, this time directly take the average of the previous days EMA. Today's estimate_partition_size = EMA(S1, ... , S7) , S7)

:::tip

According to the above algorithm, the initial number of buckets and the number of subsequent buckets can be calculated. Unlike before when only a fixed number of buckets could be specified, due to changes in business data, it is possible that the number of buckets in the previous partition is different from the number of buckets in the next partition, which is transparent to the user, and the user does not need to care about the exact number of buckets in each partition, and this automatic extrapolation will make the number of buckets more reasonable.

:::

## Common Issues

1. Incomplete syntax error prompts may occur in longer table creation statements. Here are some possible syntax errors for manual troubleshooting:

   - Syntax structure errors. Please carefully read [HELP CREATE TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE)  and check the relevant syntax structure.
   - Reserved words. When user-defined names encounter reserved words, they need to be enclosed in backticks ``. It is recommended to use this symbol for all custom names.
   - Chinese characters or full-width characters. Non-UTF8 encoded Chinese characters or hidden full-width characters (spaces, punctuation, etc.) can cause syntax errors. It is recommended to use a text editor that displays invisible characters for inspection.

2. Failed to create partition [xxx]. Timeout

   Doris creates tables sequentially based on partition granularity. When a partition fails to create, this error may occur. Even if partitions are not used, when there is a problem with table creation, `Failed to create partition` may still be reported because, as mentioned earlier, Doris creates an unmodifiable default partition for tables without specified partitions.

   When encountering this error, it is usually because the BE encountered a problem when creating data tablets. You can troubleshoot by following these steps:

   - In the fe.log, search for the `Failed to create partition` log entry at the corresponding timestamp. In this log entry, you may find a series of number pairs similar to `{10001-10010}`. The first number in the pair represents the Backend ID, and the second number represents the Tablet ID. For example, this number pair indicates that the creation of Tablet ID 10010 on Backend ID 10001 failed.  
   - Go to the be.INFO log of the corresponding Backend and search for Tablet ID-related logs within the corresponding time period to find error messages.  
   - Here are some common tablet creation failure errors, including but not limited to:  
     - The BE did not receive the relevant task. In this case, you cannot find Tablet ID-related logs in be.INFO or the BE reports success but actually fails. For these issues, please refer to the [Installation and Deployment](../install/cluster-deployment/standard-deployment) section to check the connectivity between FE and BE.  
     - Pre-allocated memory failure. This may be because the byte length of a row in the table exceeds 100KB.  
     - `Too many open files`. The number of open file handles exceeds the Linux system limit. You need to modify the handle limit of the Linux system.  

* If there is a timeout when creating data tablets, you can also extend the timeout by setting `tablet_create_timeout_second=xxx` and `max_create_table_timeout_second=xxx` in the fe.conf file. By default, `tablet_create_timeout_second` is set to 1 second, and `max_create_table_timeout_second` is set to 60 seconds. The overall timeout is calculated as `min(tablet_create_timeout_second * replication_num, max_create_table_timeout_second)`. For specific parameter settings, please refer to the [FE Configuration](../admin-manual/config/fe-config) section.

3. The table creation command does not return results for a long time.

* Doris's table creation command is a synchronous command. The timeout for this command is currently set simply as (tablet num * replication num) seconds. If many data tablets are created and some of them fail to create, it may result in a long wait before returning an error.  
* Under normal circumstances, the table creation statement should return within a few seconds or tens of seconds. If it exceeds one minute, it is recommended to cancel the operation directly and check the relevant errors in the FE or BE logs.

## More Help

For more detailed information on data partitioning, you can refer to the [CREATE TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE) command manual or enter `HELP CREATE TABLE;` in the MySQL client to get more help information.