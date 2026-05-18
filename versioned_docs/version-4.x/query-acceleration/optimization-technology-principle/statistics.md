---
{
    "title": "Doris Statistics Collection and Management: CBO Optimizer Configuration Guide",
    "language": "en",
    "description": "How to collect, manage, and tune statistics in Apache Doris? This article introduces the ANALYZE command, automatic collection mechanism, external table statistics, configuration items, and common troubleshooting.",
    "keywords": ["Doris statistics", "ANALYZE", "CBO", "auto collection", "table stats", "column stats", "auto analyze"],
    "sidebar_label": "Statistics"
}
---

# Statistics

<!-- Knowledge type: Concept + Operation guide -->
<!-- Applicable scenarios: CBO tuning, statistics collection and management, query performance troubleshooting -->

Statistics are the cornerstone of cost estimation in the Doris CBO (Cost-Based Optimizer), and their accuracy directly determines the quality of the query execution plan. This article introduces how statistics are collected, the management commands, related configuration, and common troubleshooting methods.

**Applicable versions**: Doris 2.0 and later.

## Pre-reading Checklist

- [ ] You know your Doris version (the auto-collection feature requires 2.0.3 or later).
- [ ] You have confirmed the target object type: internal table, Hive, Iceberg, Paimon, JDBC, etc.
- [ ] You know the target column types (only basic types support collection).
- [ ] You know whether you need to trigger collection manually or rely on auto-collection.

## Core Concepts at a Glance

<!-- Knowledge type: Concept -->
<!-- Applicable scenarios: Understanding the role and composition of statistics -->

**One-sentence definition**: Statistics are the data-distribution metadata that Doris records at the table and column level, used by the optimizer to estimate cost and choose the optimal plan.

Doris collects statistics per column at the table level, including the following metrics:

| Metric          | Description                          |
| --------------- | ------------------------------------ |
| `row_count`     | Total number of rows                 |
| `data_size`     | Total data size of the column        |
| `avg_size_byte` | Average per-row data size of the column |
| `ndv`           | Number of distinct values (cardinality) |
| `min`           | Minimum value                        |
| `max`           | Maximum value                        |
| `null_count`    | Number of null values                |

**Supported column types**: BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DATE, DATETIME, STRING, VARCHAR, TEXT.

**Not supported (automatically skipped)**: JSONB, VARIANT, MAP, STRUCT, ARRAY, HLL, BITMAP, TIME, TIMEV2, VARBINARY.

Collection results are stored in the `internal.__internal_schema.column_statistics` table.

## Collecting Statistics

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenarios: Manually or automatically triggering statistics collection -->

Doris enables auto-sampling for internal tables by default, so in most cases you do not need to intervene manually. For precise control, use manual collection.

### Comparison of Collection Methods

| Dimension       | Manual Collection (ANALYZE)         | Auto Collection (Enabled by Default)        |
| --------------- | ----------------------------------- | ------------------------------------------- |
| Trigger         | User initiates execution            | Background thread scans periodically        |
| Use case        | Urgent updates, first-time collection, debugging | Routine maintenance, long-term freshness    |
| Minimum version | 2.0                                 | 2.0.3                                       |
| Sampling strategy | Specify row count or ratio        | Default samples 4194304 rows (2^22)         |
| Control granularity | Table / database / column       | Cluster-level switch + table-level policy   |

### Manual Collection

**Purpose**: Immediately trigger statistics collection and update for a table or database.

**Command**: Submit a collection job manually with the `ANALYZE` statement. See the SQL manual [ANALYZE](../../sql-manual/sql-statements/statistics/ANALYZE) for details.

**Typical examples**:

Perform a full collection on all columns of the `lineitem` table:

```sql
ANALYZE TABLE lineitem;
```

Perform a full collection on all columns of all tables in the `tpch100` database:

```sql
ANALYZE DATABASE tpch100;
```

Collect on the `lineitem` table by sampling 100000 rows:

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
```

Collect on the `l_orderkey` and `l_linenumber` columns of the `lineitem` table by sampling 100000 rows:

```sql
ANALYZE TABLE lineitem (l_orderkey, l_linenumber) WITH SAMPLE ROWS 100000;
```

### Auto Collection

**Purpose**: Use a background thread to scan periodically and automatically maintain the freshness of statistics.

**Switch**: Controlled by the `ENABLE_AUTO_ANALYZE` variable.

```sql
SET GLOBAL ENABLE_AUTO_ANALYZE = TRUE;  -- Enable auto collection
SET GLOBAL ENABLE_AUTO_ANALYZE = FALSE; -- Disable auto collection
```

#### Working Mechanism

Once enabled, a background thread periodically scans all databases and tables under `InternalCatalog`. During each polling round, whether to re-collect is decided by the following rules:

1. The table contains columns without statistics.
2. The table's health is below the threshold (default 90, controlled by `table_stats_health_threshold`). The closer the health is to 100, the smaller the data change; below 90 means the statistics deviate significantly and need to be re-collected.
3. For internal tables, the data has changed but no statistics have been collected within the last 24 hours.

**Polling interval**: Default 5 minutes (configured by `auto_check_statistics_in_minutes` in `fe.conf`). The first round starts 5 minutes after the cluster starts, and after each round completes the thread sleeps for 5 minutes before starting the next round.

:::caution Note
The time required for a single round depends on the number of tables and data volume; there is no guarantee that a given table will be collected within 5 minutes.
:::

#### Key Parameters

| Parameter                            | Purpose                                       | Default      |
| ------------------------------------ | --------------------------------------------- | ------------ |
| `auto_analyze_table_width_threshold` | Maximum number of columns for auto collection | 300          |
| `huge_table_default_sample_rows`     | Number of sampled rows for auto collection    | 4194304 (2^22) |
| `auto_analyze_start_time`            | Start time for auto collection                | 0:00:00      |
| `auto_analyze_end_time`              | End time for auto collection                  | 23:59:59     |

**Adjust the wide-table limit** (avoid wide tables consuming too many resources):

```sql
SET GLOBAL auto_analyze_table_width_threshold = 350;
```

**Run during off-peak hours** (avoid impact on the business):

```sql
SET GLOBAL auto_analyze_start_time = "03:00:00"; -- Start time: 3:00 AM
SET GLOBAL auto_analyze_end_time   = "14:00:00"; -- End time: 2:00 PM
```

To obtain more accurate data-distribution information, you can increase `huge_table_default_sample_rows` to raise the number of sampled rows.

### External Table Collection

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenarios: Statistics for external tables such as Hive / Iceberg / JDBC / Paimon -->

**External table types**: Typically Hive, Iceberg, JDBC, Paimon, etc.

#### Capability Matrix

| External Table Type | Manual Full | Manual Sampling | Auto Collection |
| ------------------- | ----------- | --------------- | --------------- |
| Hive                | Supported   | Supported       | Supported       |
| Iceberg             | Supported   | Not supported   | Not supported   |
| JDBC                | Supported   | Not supported   | Not supported   |
| Others              | Not supported | Not supported | Not supported   |

#### Default Behavior

External catalogs do not participate in automatic column-statistics collection by default; only the table row count is collected, to avoid excessive scans of historical data. To enable auto-collection of column statistics:

```sql
ALTER CATALOG <catalog_name> SET PROPERTIES ('enable.auto.analyze'='true');  -- Enable
ALTER CATALOG <catalog_name> SET PROPERTIES ('enable.auto.analyze'='false'); -- Disable
```

**Table-level granularity control** (takes precedence over the catalog property):

```sql
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "enable");          -- Enable
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "disable");         -- Disable
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "base_on_catalog"); -- Follow the catalog
```

External tables do not have a health concept. Once auto-collection is enabled, by default an external table is auto-collected only once within 24 hours. You can adjust the minimum interval through `external_table_auto_analyze_interval_in_millis`.

#### Row-Count Estimation Strategy

| External Table Type | Estimation Method                                                       |
| ------------------- | ----------------------------------------------------------------------- |
| Hive                | First take `numRows` from Parameters; if missing, use `totalSize` together with the schema to estimate; if still missing, estimate based on file size |
| Iceberg             | Call the snapshot API to obtain `total-records` and `total-position-deletes` for the calculation |
| Paimon              | Call the scan API to sum the row counts of each split        |
| JDBC                | Obtained through the row-count statement of the backend database (supports MySQL, Oracle, PostgreSQL, SQLServer) |
| Others              | Automatic retrieval and estimation are not yet supported     |

If you are concerned that scanning file sizes consumes resources, you can disable file-size-based estimation for Hive:

```sql
SET GLOBAL enable_get_row_count_from_file_list = FALSE;
```

View the estimated row count of an external table:

```sql
SHOW TABLE STATS table_name;
```

:::tip Tip
If `row_count` shows `-1`, it means the row count could not be obtained or the table is empty.
:::

## Statistics Job Management

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenarios: View, terminate, and delete statistics jobs and statistics results -->

### Viewing Statistics Jobs

**Purpose**: View submitted asynchronous statistics collection jobs (synchronous jobs do not retain history).

**Command**:

```sql
SHOW ANALYZE [job_id];
```

See [SHOW ANALYZE](../../sql-manual/sql-statements/statistics/SHOW-ANALYZE) for details.

**Note**: The system retains only 20000 historical jobs. The output columns mean:

| Column          | Description                                |
| --------------- | ------------------------------------------ |
| `job_id`        | Statistics job ID                          |
| `catalog_name`  | Catalog name                               |
| `db_name`       | Database name                              |
| `tbl_name`      | Table name                                 |
| `col_name`      | List of column names (`index_name:column_name`) |
| `job_type`      | Job type                                   |
| `analysis_type` | Statistics type                            |
| `message`       | Job message                                |
| `state`         | Job state                                  |
| `progress`      | Job progress                               |
| `schedule_type` | Scheduling type                            |
| `start_time`    | Job start time                             |
| `end_time`      | Job end time                               |

**Example**:

```sql
mysql> SHOW ANALYZE 245073\G
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

**Purpose**: Each job can contain multiple tasks, with each task corresponding to one column. You can view task-level progress.

**Command**:

```sql
SHOW ANALYZE TASK STATUS [job_id];
```

**Example**:

```sql
mysql> SHOW ANALYZE TASK STATUS 93021;
+---------+-------------+------------+---------+------------------------+-----------------+----------+
| task_id | col_name    | index_name | message | last_state_change_time | time_cost_in_ms | state    |
+---------+-------------+------------+---------+------------------------+-----------------+----------+
| 93022   | r_regionkey | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
| 93023   | r_comment   | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
| 93024   | r_name      | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
+---------+-------------+------------+---------+------------------------+-----------------+----------+
```

### Viewing Column Statistics

**Purpose**: View the column-level statistics that have been collected.

**Command**:

```sql
SHOW COLUMN [cached] STATS table_name [ (column_name [, ...]) ];
```

**Parameters**:

| Parameter     | Description                                                          |
| ------------- | -------------------------------------------------------------------- |
| `cached`      | Show only the statistics in the FE memory cache                      |
| `table_name`  | Target table; can be in the form `db_name.table_name`                |
| `column_name` | Target column (multiple columns can be specified, separated by commas); if not specified, all columns are shown |

**Example**:

```sql
mysql> SHOW COLUMN STATS region (r_regionkey)\G
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

**Purpose**: View an overview of statistics collection at the table level.

**Command**:

```sql
SHOW TABLE STATS table_name;
```

`table_name` can be in the form `db_name.table_name`.

**Output columns**:

| Column          | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `updated_rows`  | Number of rows updated for this table since the last ANALYZE |
| `query_times`   | Reserved column, intended to record query counts in future versions |
| `row_count`     | Number of rows in the table (may not reflect the exact row count at command-execution time) |
| `updated_time`  | Last time the statistics were updated                      |
| `columns`       | Columns whose statistics have been collected               |
| `trigger`       | How the statistics were triggered                          |
| `new_partition` | Whether any new partition has loaded data for the first time |
| `user_inject`   | Whether the user has manually injected statistics          |

### Terminating Statistics Jobs

**Purpose**: Terminate an asynchronous statistics job that is currently running.

**Command**:

```sql
KILL ANALYZE job_id;
```

`job_id` is the value returned by an asynchronous `ANALYZE` execution and can also be obtained via `SHOW ANALYZE`.

**Example**: Terminate the statistics job with ID 52357.

```sql
mysql> KILL ANALYZE 52357;
```

### Deleting Statistics

**Purpose**: Manually clean up statistics for a table that still exists. Statistics for deleted objects are cleaned up periodically by the background and require no manual action.

**Command**:

```sql
DROP STATS table_name;
```

## Session Variables and Configuration Items

<!-- Knowledge type: Reference -->
<!-- Applicable scenarios: Tuning auto collection and statistics storage -->

### Session Variables

| Session Variable                      | Description                                                                                | Default                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------- |
| `auto_analyze_start_time`             | Start time for auto collection                                                             | `0:00:00`                        |
| `auto_analyze_end_time`               | End time for auto collection                                                               | `23:59:59`                       |
| `enable_auto_analyze`                 | Whether auto collection is enabled                                                         | `TRUE`                           |
| `huge_table_default_sample_rows`      | Number of sampled rows for large tables                                                    | `4194304`                        |
| `table_stats_health_threshold`        | Range 0-100; statistics are considered stale when (100 - threshold)% of data has changed   | `90`                             |
| `auto_analyze_table_width_threshold`  | Maximum number of columns for auto collection; tables with more columns are excluded       | `300`                            |
| `enable_get_row_count_from_file_list` | Whether to estimate Hive table row counts from file size                                   | `TRUE` (default `FALSE` before 2.1.5) |

### FE Configuration Items

:::info Note
The following FE configuration items usually do not need special attention.
:::

| FE Configuration Item                        | Description                                       | Default                  |
| -------------------------------------------- | ------------------------------------------------- | ------------------------ |
| `analyze_record_limit`                       | Controls the number of statistics-job execution records persisted | `20000`                  |
| `stats_cache_size`                           | Number of entries in the FE-side statistics cache | `500000`                 |
| `statistics_simultaneously_running_task_num` | Number of asynchronous statistics jobs that can run simultaneously | `3`                      |
| `statistics_sql_mem_limit_in_bytes`          | BE memory each statistics SQL can occupy          | `2L * 1024 * 1024` (2 GiB) |

## Frequently Asked Questions (FAQ)

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Common troubleshooting for statistics-related issues -->

### Q1: How do I confirm whether statistics have been collected for a table?

**Step 1**: Check whether collection results exist.

```sql
SHOW COLUMN STATS table_name;
```

**Step 2**: Check whether statistics are loaded in the FE cache.

```sql
SHOW COLUMN CACHED STATS table_name;
```

If both are empty, the table currently has no statistics. Example output when statistics have been collected:

```sql
mysql> SHOW COLUMN CACHED STATS mvTestDup;
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

**Step 3**: Verify accuracy by running SQL manually.

```sql
SELECT count(1), ndv(col1), min(col1), max(col1) FROM table;
```

If the difference between `count` and `ndv` is within one order of magnitude, the accuracy is acceptable.

### Q2: Why does a table never get statistics collected automatically?

**Check 1**: Whether the auto-collection switch is on.

```sql
SHOW VARIABLES LIKE "enable_auto_analyze";
-- If false, enable it:
SET GLOBAL enable_auto_analyze = TRUE;
```

**Check 2**: Whether the number of columns in the table exceeds `auto_analyze_table_width_threshold` (default 300). Tables that exceed it are excluded from auto-collection.

```sql
SHOW VARIABLES LIKE "auto_analyze_table_width_threshold";
-- If smaller than the table width, adjust:
SET GLOBAL auto_analyze_table_width_threshold = 350;
```

**Check 3**: Whether other jobs are running.

```sql
SHOW AUTO ANALYZE;
```

Auto-collection runs serially on a single thread and polls all databases and tables, so the traversal cycle may be long.

### Q3: Why do some columns have no statistics?

Only basic-type columns support statistics collection. Complex types (such as JSONB, VARIANT, MAP, STRUCT, ARRAY, HLL, BITMAP, TIME, TIMEV2, VARBINARY) are automatically skipped.

### Q4: Error `Stats table not available, please make sure your cluster status is normal`

This usually means the internal statistics table is in an unhealthy state. Troubleshooting steps:

**Step 1**: Check whether all BEs are in a normal state.

**Step 2**: Get all `tabletId`s of the statistics table.

```sql
SHOW TABLETS FROM internal.__internal_schema.column_statistics;
```

**Step 3**: Diagnose tablets one by one.

```sql
ADMIN DIAGNOSE TABLET tablet_id;
```

**Step 4**: After fixing the abnormal tablets, re-collect statistics.

### Q5: How do I deal with statistics collection that is not timely enough?

- **Urgent scenarios**: Run `ANALYZE` manually on the target table.
- **Adjust the health threshold**: The default `table_stats_health_threshold = 90` means collection is triggered only when more than 10% of the data has changed. You can raise it to 95 (so changes greater than 5% trigger collection):

```sql
SET GLOBAL table_stats_health_threshold = 95;
```

### Q6: What if auto-collection consumes too many resources?

Auto-collection uses sampling and runs serially on a single thread, so resource usage is generally controllable. However, the following scenarios may have higher memory usage:

- Tables with a large number of partitions.
- Tables with very large individual tablets.

**Optimization suggestions**:

1. Plan tablet counts reasonably at table-creation time and avoid oversized tablets.
2. Enable auto-collection during system off-peak hours (see `auto_analyze_start_time` / `auto_analyze_end_time`).
3. Manually collect large tables during off-peak hours.
4. The Doris 3.x series will further optimize such scenarios.
