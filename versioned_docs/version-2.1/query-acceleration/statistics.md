---
{
"title": "Statistics",
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

Starting from version 2.0, Doris integrated Cost-Based Optimization (CBO) capabilities into its optimizer. Statistics are the cornerstone of CBO, and their accuracy directly determines the accuracy of cost estimation, which is crucial for selecting the optimal execution plan. This document serves as a guide to statistical usage in Doris 2.1, focusing on the collection and management methods, relevant configuration options, and frequently asked questions.

## Collection of Statistics

Starting from the current version, Doris collects statistics at the column level for each table. The information collected includes:

| Info of Statistics | Description                              |
| ------------------ | ---------------------------------------- |
| row_count          | Total number of rows                     |
| data_size          | Total data size of the column            |
| avg_size_byte      | Average data size per row for the column |
| ndv                | Number of distinct values                |
| min                | Minimum value                            |
| max                | Maximum value                            |
| null_count         | Number of null values                    |

Currently, the system only supports collecting statistics for columns of basic data types, including BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DATE, DATETIME, STRING, VARCHAR, TEXT, among others.

Columns of complex types, such as JSONB, VARIANT, MAP, STRUCT, ARRAY, HLL, BITMAP, TIME, TIMEV2, are skipped.

Statistics can be collected manually or automatically, and the results are stored in the `internal.__internal_schema.column_statistics` table. The following sections detail these two collection methods.

### Manual Collection

Doris allows users to manually trigger the collection and update of statistics by submitting an ANALYZE statement.

**1. Syntax**

```sql
ANALYZE < TABLE table_name > | < DATABASE db_name > 
    [ (column_name [, ...]) ]
    [ [ WITH SYNC ] [ WITH SAMPLE PERCENT | ROWS ] ];
```

Parameters Explanation:

- `table_name`: Specifies the target table for which statistics will be collected.

- `column_name`: Specifies the target columns for which statistics will be collected. These columns must exist in `table_name`, and multiple column names are separated by commas. If no column names are specified, statistics will be collected for all columns in the table.

- `sync`: Optional parameter to collect statistics synchronously. If specified, the result will be returned after collection is complete; if not specified, the operation will be performed asynchronously, and a JOB ID will be returned, which can be used to check the status of the collection task.

- `sample percent | rows`: Optional parameter for sampling during statistics collection. Allows specifying a sampling percentage or number of rows. If `WITH SAMPLE` is not specified, a full table scan will be performed. For large tables (e.g., over 5 GiB), sampling is generally recommended from a cluster resource utilization perspective. To ensure the accuracy of statistics, it is recommended to sample at least 4 million rows.

**2. Examples**

Collect statistics for all columns in the `lineitem` table:

```sql
ANALYZE TABLE lineitem;
```

Collect statistics for all columns in all tables in the `tpch100` database:

```sql
ANALYZE DATABASE tpch100;
```

Collect statistics for the `l_orderkey` and `l_linenumber` columns in the `lineitem` table by sampling 100,000 rows (note: the correct syntax should be used `WITH SAMPLE ROWS` or `WITH SAMPLE PERCENT`):

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
```

### Automatic Collection

Automatic collection is supported from version 2.0.3 onwards and is enabled by default throughout the day. Users can control the feature's activation or deactivation by setting the `ENABLE_AUTO_ANALYZE` variable:

```sql
SET GLOBAL ENABLE_AUTO_ANALYZE = TRUE; // Enable automatic collection  
SET GLOBAL ENABLE_AUTO_ANALYZE = FALSE; // Disable automatic collection
```

When enabled, a background thread periodically scans all tables in the `InternalCatalog` within the cluster. For tables requiring statistics collection, the system automatically creates and executes collection jobs without manual intervention.

To avoid excessive resource usage for wide tables, tables with more than 100 columns are not automatically collected by default. Users can adjust this threshold by modifying the session variable `auto_analyze_table_width_threshold`:

```sql
SET GLOBAL auto_analyze_table_width_threshold = 120;
```

The default polling interval for automatic collection is 5 minutes (adjustable via the `auto_check_statistics_in_minutes` configuration in `fe.conf`). The first iteration starts 5 minutes after cluster startup. After all tables requiring collection are processed, the background thread sleeps for 5 minutes before starting the next iteration. Therefore, there is no guarantee that a table will have its statistics collected within 5 minutes, as the time to iterate through all tables can vary based on the number and size of tables.

When a table is polled, the system first determines if statistical collection is required. If so, a collection job is created and executed; otherwise, the table is skipped. Statistics collection is required if:

1. The table has columns without statistics.

2. The table's health is below the threshold (default 60, adjustable via `table_stats_health_threshold`). Health indicates the percentage of data that has remained unchanged since the last statistics collection: 100 indicates no change; 0 indicates all changes; a health below 60 indicates significant deviation in current statistics, necessitating re-collection.

To reduce background job overhead and improve collection speed, automatic collection uses sampling by default, sampling 4,194,304 (`2^22`) rows. Users can adjust the sampling size by modifying `huge_table_default_sample_rows` for more accurate data distribution information.

To prevent automatic collection jobs from interfering with business operations, users can specify the execution window for automatic collection based on their requirements by setting `auto_analyze_start_time` and `auto_analyze_end_time`:

```sql
SET GLOBAL auto_analyze_start_time = "03:00:00"; // Set the start time to 3 AM  
SET GLOBAL auto_analyze_end_time = "14:00:00"; // Set the end time to 2 PM
```

### External Table Collection

External tables typically include Hive, Iceberg, JDBC, and other types.

- Manual Collection: Hive, Iceberg, and JDBC tables support manual statistics collection. Hive tables support both full and sampled collection, while Iceberg and JDBC tables only support full collection. Other external table types do not support manual collection.

- Automatic Collection: Currently, only Hive tables are supported.

External Catalogs do not participate in automatic collection by default because they often contain large amounts of historical data, which could consume excessive resources during automatic collection. However, you can enable or disable automatic collection for an external Catalog by setting its properties:

```sql
ALTER CATALOG external_catalog SET PROPERTIES ('enable.auto.analyze'='true'); // Enable automatic collection  
ALTER CATALOG external_catalog SET PROPERTIES ('enable.auto.analyze'='false'); // Disable automatic collection
```

External tables do not have the concept of health. When automatic collection is enabled for a Catalog, the system defaults to collecting statistics for an external table only once every 24 hours to avoid frequent collection. You can adjust the minimum collection interval for external tables using the `external_table_auto_analyze_interval_in_millis` variable.

By default, external tables do not collect statistics, but for Hive and Iceberg tables, the system attempts to obtain row count information through the Hive Metastore and Iceberg API.

**1. For Hive Tables:**

The system first attempts to retrieve `numRows` or `totalSize` information from the Hive table's Parameters:

- If `numRows` is found, its value is used as the table's row count.

- If `numRows` is not found but `totalSize` is available, the row count is estimated based on the table's schema and `totalSize`.

- If neither `numRows` nor `totalSize` is available, the row count cannot be obtained by default. Users can enable row count estimation by setting the following variable (default is `false`):

  ```sql
  SET GLOBAL enable_get_row_count_from_file_list = TRUE
  ```

In versions after 2.1.5, the default value of this parameter changes to `true`, but it does not automatically update after upgrading from an older version. If needed, it can be manually changed. When enabled, the system estimates the row count based on the file sizes and schema of the Hive table. Due to the heavy operation of obtaining all file sizes, this feature is disabled by default to avoid excessive resource usage.

**2. For Iceberg Tables:**

The system calls the Iceberg snapshot API to retrieve `total-records` and `total-position-deletes` information to calculate the table's row count.

**3. For Other External Tables:**

Automatic row count acquisition and estimation are currently not supported.

Users can view the estimated row count for external tables using the following command (see Section 2.4 for viewing table statistics):

```sql
SHOW table stats table_name;
```

- If `row_count` displays as `-1`, row count information could not be obtained.

- If `row_count` displays as `0` but the table is not empty, users can execute the command multiple times to obtain the final result, as the operation retrieves values from a cache. If the cache is empty, the estimation logic for Hive and Iceberg tables is executed asynchronously. Before the estimation completes, `row_count` will display as `0`.

## Statistics Job Management

### Viewing Statistics Jobs

Use `SHOW ANALYZE` to view information about statistics collection jobs. Currently, the system retains information for only 20,000 historical jobs. Note that only information for asynchronous jobs can be viewed using this command; synchronous jobs (using `WITH SYNC`) do not retain historical job information.

**1. Syntax**:

```sql
SHOW [AUTO] ANALYZE < table_name | job_id >
    [ WHERE STATE = < "PENDING" | "RUNNING" | "FINISHED" | "FAILED" > ];
```

- `AUTO`: Displays information about historical automatic collection jobs. If unspecified, displays information about manual `ANALYZE` historical jobs.

- `table_name`: Table name, specifying which allows you to view statistics job information for that table. Can be in the form `db_name.table_name`. If unspecified, returns information about all statistics jobs.

- `job_id`: Statistics job ID, obtained when executing an asynchronous `ANALYZE` collection. If unspecified, the command returns information about all statistics jobs.

**2. Output**:

Includes the following columns:

| Column Name   | Description                                   |
| ------------- | --------------------------------------------- |
| job_id        | Statistics job ID                             |
| catalog_name  | Catalog name                                  |
| db_name       | Database name                                 |
| tbl_name      | Table name                                    |
| col_name      | List of column names (index_name:column_name) |
| job_type      | Job type                                      |
| analysis_type | Statistics type                               |
| message       | Job information                               |
| state         | Job state                                     |
| progress      | Job progress                                  |
| schedule_type | Scheduling type                               |
| start_time    | Job start time                                |
| end_time      | Job end time                                  |

**3. Example:**

```sql
mysql show analyze 245073\G;
*************************** 1. row ***************************
              job_id: 93021
        catalog_name: internal
             db_name: tpch
            tbl_name: region
            col_name: [region:r_regionkey,region:r_comment,region:r_name]
            job_type: MANUAL
       analysis_type: FUNDAMENTALS
             message: 
               state: FINISHED
            progress: 3 Finished  |  0 Failed  |  0 In Progress  |  3 Total
       schedule_type: ONCE
          start_time: 2024-07-11 15:15:00
            end_time: 2024-07-11 15:15:33
```

### Viewing Statistics Tasks

Each collection job can contain one or more tasks, with each task corresponding to the collection of a single column. Users can view the completion status of statistics collection for each column using the following command.

**1. Syntax:**

```sql
SHOW ANALYZE TASK STATUS [job_id]
```

**2. Example:**

```sql
mysql> show analyze task status 93021;
+---------+-------------+------------+---------+------------------------+-----------------+----------+
| task_id | col_name    | index_name | message | last_state_change_time | time_cost_in_ms | state    |
+---------+-------------+------------+---------+------------------------+-----------------+----------+
| 93022   | r_regionkey | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
| 93023   | r_comment   | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
| 93024   | r_name      | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
+---------+-------------+------------+---------+------------------------+-----------------+----------+
```

### Viewing Statistics

Users can view collected column statistics using the `SHOW COLUMN STATS` command.

**1. Syntax:**

```sql
SHOW COLUMN [cached] STATS table_name [ (column_name [, ...]) ];
```

Where:

- `cached`: Displays statistics currently cached in the FE memory.

- `table_name`: Target table for which statistics were collected, can be in the form `db_name.table_name`.

- `column_name`: Specified target column, must exist in `table_name`, multiple column names separated by commas. If unspecified, displays information for all columns.

**2. Example:**

```sql
mysql> show column stats region (r_regionkey)\G
*************************** 1. row ***************************
  column_name: r_regionkey
   index_name: region
        count: 5.0
          ndv: 5.0
     num_null: 0.0
    data_size: 20.0
avg_size_byte: 4.0
          min: 0
          max: 4
       method: FULL
         type: FUNDAMENTALS
      trigger: MANUAL
  query_times: 0
 updated_time: 2024-07-11 15:15:33
1 row in set (0.36 sec)
```

### Viewing Table Statistics Overview

Use `SHOW TABLE STATS` to view an overview of table statistics collection.

**1. Syntax:**

```sql
SHOW TABLE STATS table_name;
```

Where: `table_name`: Target table name, can be in the form `db_name.table_name`.

**2. Output:**

Includes the following columns:

| Column Name   | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| updated_rows  | Number of rows updated in the table since the last ANALYZE   |
| query_times   | Reserved column, for recording the number of queries on the table in future versions |
| row_count     | Number of rows in the table (may not reflect the exact count at command execution) |
| updated_time  | Time of the last statistics update                           |
| columns       | Columns for which statistics have been collected             |
| trigger       | Method by which statistics were triggered                    |
| new_partition | Whether there are new partitions with first-time data imports |
| user_inject   | Whether statistics were manually injected by the user        |

**3. Example:**

```sql
mysql> show column stats region (r_regionkey)\G
*************************** 1. row ***************************
  column_name: r_regionkey
   index_name: region
        count: 5.0
          ndv: 5.0
     num_null: 0.0
    data_size: 20.0
avg_size_byte: 4.0
          min: 0
          max: 4
       method: FULL
         type: FUNDAMENTALS
      trigger: MANUAL
  query_times: 0
 updated_time: 2024-07-11 15:15:33
1 row in set (0.36 sec)
```

### Killing Statistics Jobs

Use `KILL ANALYZE` to terminate a currently running asynchronous statistics job.

**1. Syntax:**

```sql
KILL ANALYZE job_id;
```

Where: `job_id`: The ID of the statistics job. This is the value returned when executing an asynchronous statistics collection with `ANALYZE` or obtained using the `SHOW ANALYZE` statement.

**2. Example:**

Terminate the statistics job with ID 52357.

```sql
mysql> KILL ANALYZE 52357;
```

### Deleting Statistics

If a Catalog, Database, or Table is deleted, users do not need to manually delete its statistics as the background process will periodically clean up this information.

However, for tables that still exist, the system does not automatically clear their statistics. In this case, users need to manually delete them using the following syntax:

```sql
DROP STATS table_name
```

## Session Variables and Configuration Options

### Session Variables

| Session Variable                    | Description                                                  | Default Value                       |
| ----------------------------------- | ------------------------------------------------------------ | ----------------------------------- |
| auto_analyze_start_time             | Start time for automatic statistics collection               | 0:00:00                             |
| auto_analyze_end_time               | End time for automatic statistics collection                 | 23:59:59                            |
| enable_auto_analyze                 | Whether to enable automatic collection functionality         | TRUE                                |
| huge_table_default_sample_rows      | Number of rows to sample for large tables                    | 4194304                             |
| table_stats_health_threshold        | Value range 0-100, indicating the percentage of data updated since the last statistics collection (100 - table_stats_health_threshold)% at which statistics are considered outdated | 60                                  |
| auto_analyze_table_width_threshold  | Controls the maximum table width for automatic statistics collection, tables exceeding this column count do not participate in automatic statistics collection | 100                                 |
| enable_get_row_count_from_file_list | Whether to estimate row counts for Hive tables based on file sizes | FALSE (TRUE by default after 2.1.5) |

### FE Configuration

:::info Note

The following FE configuration options typically do not require special attention.

:::

| FE Configuration Option                    | Description                                                  | Default Value           |
| ------------------------------------------ | ------------------------------------------------------------ | ----------------------- |
| analyze_record_limit                       | Controls the number of persistent rows for statistics job execution records | 20000                   |
| stats_cache_size                           | Number of statistics entries cached on the FE side           | 500000                  |
| statistics_simultaneously_running_task_num | Number of asynchronous statistics jobs that can run simultaneously | 3                       |
| statistics_sql_mem_limit_in_bytes          | Controls the amount of BE memory each statistics SQL can occupy | 2L * 1024 * 1024 (2GiB) |

## FAQs

### Q1: How can I check if statistics have been collected for a table and if the content is correct?

First, execute `show column stats table_name` to see if there are any statistical outputs.

Next, execute `show column cached stats table_name` to check if the statistics for the table are loaded into the cache.

```sql
mysql> show column stats test_table\G
Empty set (0.02 sec)

mysql> show column cached stats test_table\G
Empty set (0.00 sec)
```

The empty result indicates that there are currently no statistics for the `test_table`. If statistics exist, the result will be similar to the following:

```sql
mysql> show column cached stats mvTestDup;
+-------------+------------+-------+------+----------+-----------+---------------+------+------+--------+--------------+---------+-------------+---------------------+
| column_name | index_name | count | ndv  | num_null | data_size | avg_size_byte | min  | max  | method | type         | trigger | query_times | updated_time        |
+-------------+------------+-------+------+----------+-----------+---------------+------+------+--------+--------------+---------+-------------+---------------------+
| key1        | mvTestDup  | 6.0   | 4.0  | 0.0      | 48.0      | 8.0           | 1    | 1001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| key2        | mvTestDup  | 6.0   | 4.0  | 0.0      | 48.0      | 8.0           | 2    | 2001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| value2      | mvTestDup  | 6.0   | 4.0  | 0.0      | 24.0      | 4.0           | 4    | 4001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| value1      | mvTestDup  | 6.0   | 4.0  | 0.0      | 24.0      | 4.0           | 3    | 3001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| mv_key1     | mv1        | 6.0   | 4.0  | 0.0      | 48.0      | 8.0           | 1    | 1001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| value3      | mvTestDup  | 6.0   | 4.0  | 0.0      | 24.0      | 4.0           | 5    | 5001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
+-------------+------------+-------+------+----------+-----------+---------------+------+------+--------+--------------+---------+-------------+---------------------+
6 rows in set (0.00 sec)
```

If statistics exist, you can manually execute SQL queries to verify their accuracy.

```sql
Select count(1), ndv(col1), min(col1), max(col1) from table
```

If the errors in `count` and `ndv` are within an order of magnitude, the accuracy is generally acceptable.

### Q2: Why are statistics not being automatically collected for a table?

First, check if automatic collection is enabled:

```sql
Show variables like "enable_auto_analyze";  // If false, set it to true:  

Set global enable_auto_analyze = true
```

If it's already true, check the number of columns in the table. If it exceeds the `auto_analyze_table_width_threshold`, the table will not participate in automatic collection. Modify this value to be greater than the current number of columns in the table:

```sql
Show variables like "auto_analyze_table_width_threshold"  

// If the value is less than the width of the table, you can modify it:

Set global auto_analyze_table_width_threshold=200
```

If the number of columns does not exceed the threshold, execute `show auto analyze` to check if there are other collection tasks running (in the running state). Since automatic collection is executed serially by a single thread, the execution cycle may be long as it polls all databases and tables.

### Q3: Why are statistics not available for some columns?

Currently, the system only supports collecting statistics for columns of basic data types. For complex types such as JSONV, VARIANT, MAP, STRUCT, ARRAY, HLL, BITMAP, TIME, and TIMEV2, the system skips them.

### Q4: Error: "Stats table not available, please make sure your cluster status is normal"

This error typically indicates that the internal statistics table is in an unhealthy state.

First, check if all BEs (Backend) in the cluster are in a normal state and ensure they are all functioning correctly.

Next, execute the following statement to retrieve all `tabletId`s (first column of the output):

```sql
show tablets from internal.__internal_schema.column_statistics;
```

Then, check each tablet's status using its `tablet_id`:

```sql
ADMIN DIAGNOSE TABLET tablet_id
```

If any tablets are found to be abnormal, repair them first before re-collecting statistics.

### Q5: How can I address the issue of untimely statistics collection?

The interval for automatic collection is uncertain and depends on the number and size of tables in the system. In urgent cases, manually execute an `analyze` operation on the table.

If automatic collection is not triggered after importing large amounts of data, consider adjusting the `table_stats_health_threshold` parameter. Its default value is 60, meaning that automatic collection is triggered when more than 40% (100 - 60) of the table's data changes. You can increase this value, for example, to 80, so that statistics are recollected when more than 20% of the table's data changes.

### Q6: How can I address excessive resource usage during automatic collection?

Automatic collection uses sampling and does not require full table scans, and the tasks are executed serially by a single thread. Usually, system resource usage is manageable and does not impact normal query tasks.

For some special tables, such as those with many partitions or large individual tablets, memory usage may be higher.

It is recommended to plan the number of tablets reasonably when creating tables to avoid creating oversized tablets. If the tablet structure is not easily adjustable, consider enabling automatic collection or manually collecting statistics for large tables during off-peak hours to avoid impacting business operations. In the Doris 3.x series, we will optimize for such scenarios.