---
{
"title": "统计信息",
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

从 2.0 版本开始，Doris 在优化器中加入了 CBO 的能力。统计信息是 CBO 的基石，其准确性直接决定了代价估算的准确性，对于选择最优 Plan 至关重要。本文是 Doris 2.1 版本的统计信息使用指南，主要介绍统计信息的收集和管理方法、相关配置项以及常见问题。

## 统计信息的收集

从当前版本开始，Doris 收集统计信息的对象是列。它会在表级别收集每一列的统计信息，收集的内容包括：

| 信息          | 描述               |
| ------------- | ------------------ |
| row_count     | 总行数             |
| data_size     | 列的总数据量       |
| avg_size_byte | 列的平均每行数据量 |
| ndv           | 不同值数量         |
| min           | 最小值             |
| max           | 最大值             |
| null_count    | 空值数量           |

目前，系统仅支持收集基本类型列的统计信息，包括 BOOLEAN、TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DATE、DATETIME、STRING、VARCHAR、TEXT 等。

复杂类型的列会被跳过，包括 JSONB、VARIANT、MAP、STRUCT、ARRAY、HLL、BITMAP、TIME、TIMEV2 等。

统计信息的收集方式有手动和自动两种，收集的结果会保存在 `internal.__internal_schema.column_statistics` 表中。下面将详细介绍这两种收集方式。

### 手动收集

Doris 支持用户通过提交 ANALYZE 语句来手动触发统计信息的收集和更新。

**1. 语法**

```sql
ANALYZE < TABLE table_name > | < DATABASE db_name > 
    [ (column_name [, ...]) ]
    [ [ WITH SYNC ] [ WITH SAMPLE PERCENT | ROWS ] ];
```

其中各参数解释如下：

- `table_name`: 指定要收集统计信息的目标表。

- `column_name`: 指定要收集统计信息的目标列。这些列必须存在于 table_name 中，多个列名称之间用逗号分隔。如果不指定列名，则会对表中的所有列进行统计信息的收集。

- `sync`：选择同步收集统计信息。如果指定此选项，收集完成后才会返回结果；如果不指定，则会异步执行并返回一个 JOB ID，用户可以通过该 JOB ID 查看收集任务的状态。

- `sample percent | rows`：选择抽样收集统计信息。可以指定抽样比例或者抽样行数。如果不指定 WITH SAMPLE，则会对表进行全量采样。对于较大的表（例如超过 5 GiB），从集群资源利用的角度出发，通常建议采用抽样收集。为了保证统计信息的准确性，采样的行数建议不低于 400 万行。

**2. 示例**

对 lineitem 表的所有列进行全量收集：

```sql
ANALYZE TABLE lineitem;
```

对 tpch100 数据库中所有表的所有列进行全量收集：

```sql
ANALYZE DATABASE tpch100;
```

对 lineitem 表的所有列按照 10% 的比例进行抽样收集（注意这里应更改为 PERCENT 以符合语法说明）：

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
```

对 lineitem 表的 `l_orderkey` 和 `l_linenumber` 列按照采样 100000 行进行收集：

```sql
ANALYZE TABLE lineitem (l_orderkey, l_linenumber) WITH SAMPLE ROWS 100000;
```

### 自动收集

自动收集功能自 2.0.3 版本起开始支持，且默认全天开启。用户可以通过设置 `ENABLE_AUTO_ANALYZE` 变量来控制该功能的启用或停用：

```sql
SET GLOBAL ENABLE_AUTO_ANALYZE = TRUE; // 打开自动收集
SET GLOBAL ENABLE_AUTO_ANALYZE = FALSE; // 关闭自动收集
```

在启用状态下，后台线程会定期扫描集群中 `InternalCatalog` 下的所有库表。对于需要收集统计信息的表，系统会自动创建并执行收集作业，无需用户手动干预。

需要注意的是，为避免自动收集对大宽表造成过多资源占用，默认不收集宽度超过 100 列的表。用户可以通过修改 Session 变量 `auto_analyze_table_width_threshold` 的值来调整这一宽度上限，例如将其设置为 120：

```sql
SET GLOBAL auto_analyze_table_width_threshold = 120;
```

自动收集的默认轮询间隔为 5 分钟（此间隔可通过 `fe.conf` 中的 `auto_check_statistics_in_minutes` 配置项进行调整）。默认情况下，集群启动 5 分钟后开始第一轮遍历。当所有需要收集的表完成收集后，后台线程会休眠 5 分钟，然后开启第二轮遍历，以此类推。因此不能保证一张表在 5 分钟内一定能收集到统计信息，因为遍历一轮库表的时间是不确定的。在表较多且数据量较大的情况下，遍历一轮的时间可能会较长。

当轮询到一张表时，系统会首先判断该表是否需要收集统计信息。如果需要，则创建收集作业并开始收集；否则，跳过该表并继续轮询下一张。以下任意条件满足时，表明该表需要重新收集统计信息：

1. 表中存在无统计信息的列；

2. 表的健康度低于阈值（默认为 60，可通过 `table_stats_health_threshold` 变量进行调整）。健康度表示从上次收集统计信息到当前时刻，表中数据保持不变的比例：100 表示完全没有变化；0 表示全部改变；当健康度低于 60 时，表示当前的统计信息已有较大偏差，需要重新收集。通过健康度评估，可以降低不必要的重复收集，从而节省系统资源。

为了降低后台作业的开销并提高收集速度，自动收集采用采样收集方式，默认采样 4194304`（2^22）`行。如果用户希望采样更多行以获得更准确的数据分布信息，可通过调整参数 `huge_table_default_sample_rows` 来增加采样行数。

如果担心自动收集作业会对业务造成干扰，可根据自身需求通过设置参数 `auto_analyze_start_time` 和 `auto_analyze_end_time` 来指定自动收集作业在业务负载较低的时间段内执行。此外，也可以通过将参数 `enable_auto_analyze` 设置为 `false` 来完全停用此功能。

```sql
SET GLOBAL auto_analyze_start_time = "03:00:00"; // 把起始时间设置为凌晨3点
SET GLOBAL auto_analyze_end_time = "14:00:00"; // 把终止时间设置为下午2点
```

### 外表收集

外表通常为 Hive、Iceberg、JDBC 以及其他类型的表。

- 在手动收集方面，Hive, Iceberg 和 JDBC 表均支持手动收集统计信息。其中，Hive 表支持手动进行全量和采样收集，而 Iceberg 和 JDBC 表则仅支持手动全量收集。其他类型的外表则不支持手动收集统计信息。

- 在自动收集方面，当前仅 Hive 表提供支持。

需要注意的是，外部 Catalog 默认情况下不参与自动收集。这是因为外部 Catalog 通常包含大量历史数据，如果进行自动收集，可能会占用过多资源。然而，你可以通过设置 Catalog 的属性来启用或禁用外部 Catalog 的自动收集功能。

```sql
ALTER CATALOG external_catalog SET PROPERTIES ('enable.auto.analyze'='true'); // 打开自动收集
ALTER CATALOG external_catalog SET PROPERTIES ('enable.auto.analyze'='false'); // 关闭自动收集
```

外表没有健康度的概念。在启用了 Catalog 的自动收集属性后，为了避免频繁收集，对于一张外表，系统默认在 24 小时之内只对其进行一次自动收集。你可以通过 `external_table_auto_analyze_interval_in_millis` 变量来控制外表的最小收集时间间隔。

在默认状态下，外表不会收集统计信息。但是对于 Hive 和 Iceberg 表，系统会尝试通过 Hive Metastore 和 Iceberg API 来获取行数信息。

**1. 对于 Hive 表**

系统首先尝试从 Hive 表的 Parameters 中获取 `numRows` 或 `totalSize` 的信息：

- 如果找到 `numRows`，则将其值作为表的行数。

- 如果没有找到 `numRows`，但找到了 `totalSize` 信息，则根据表的 Schema 和 `totalSize` 来估算表的行数。

- 如果 `totalSize` 也没有，则默认情况下无法获取行数。用户可以通过设置以下变量（默认为 false）来启用这一功能：

  ```sql
  SET GLOBAL enable_get_row_count_from_file_list = TRUE
  ```

  在 2.1.5 版本之后，该参数的默认值变为 true。但是从旧版本升级后，其值不会自动更改，如果需要，可以手动修改。启用后，系统会根据 Hive 表对应的文件大小和 Schema 来估算行数。由于获取所有文件大小是一个较重的操作，为了避免过度占用系统资源，这个开关默认是关闭的。

**2. 对于 Iceberg 表**

系统会调用 Iceberg 的 snapshot API 来获取 `total-records` 和 `total-position-deletes` 信息，以计算表的行数。

**3. 对于其他外表**

系统目前不支持行数的自动获取和估算。

用户可以通过以下命令来查看外表估算的行数（见 2.4 查看表信息概况）：

```sql
SHOW table stats table_name;
```

- 如果 `row_count` 显示为 -1，则表示未能获取到行数信息。

- 如果 `row_count` 显示为 0，但表不为空，用户可以多次执行上述命令以获取最终结果。因为这个操作是从缓存中获取数值，如果缓存为空，则需要异步执行 Hive 和 Iceberg 表的估算逻辑。在估算完成之前，`row_count` 会显示为 0。

## 统计信息作业管理

### 查看统计作业

通过 `SHOW ANALYZE` 来查看统计信息收集作业的信息。目前，系统仅保留 20000 个历史作业的信息。请注意，仅异步作业的信息可通过该命令查看，同步作业（使用 `WITH SYNC`）不保留历史作业信息。

**1. 语法：**

```sql
SHOW [AUTO] ANALYZE < table_name | job_id >
    [ WHERE STATE = < "PENDING" | "RUNNING" | "FINISHED" | "FAILED" > ];
```

- `AUTO`：展示自动收集历史作业信息。如果不指定，则展示手动 `ANALYZE` 历史作业信息。

- `table_name`：表名，指定后可查看该表对应的统计作业信息。可以是 `db_name.table_name` 形式。不指定时返回所有统计作业信息。

- `job_id`：统计信息作业 ID，执行 `ANALYZE` 异步收集时得到。不指定 ID 时，此命令返回所有统计作业信息。

**2. 输出结果**

包含以下列：

| 列名          | 说明                                 |
| ------------- | ------------------------------------ |
| job_id        | 统计作业 ID                          |
| catalog_name  | Catalog 名称                         |
| db_name       | 数据库名称                           |
| tbl_name      | 表名称                               |
| col_name      | 列名称列表（index_name:column_name） |
| job_type      | 作业类型                             |
| analysis_type | 统计类型                             |
| message       | 作业信息                             |
| state         | 作业状态                             |
| progress      | 作业进度                             |
| schedule_type | 调度方式                             |
| start_time    | 作业开始时间                         |
| end_time      | 作业结束时间                         |

**3. 示例：**

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

### 查看统计任务

每个收集作业可包含一到多个任务，且每个任务对应一列的收集。用户可通过以下命令查看具体每列的统计信息收集完成情况。

**1. 语法**

```sql
SHOW ANALYZE TASK STATUS [job_id]
```

**2. 示例**

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

### 查看统计信息

用户可以通过 `SHOW COLUMN STATS` 命令来查看已经收集的列统计信息。

**1. 语法**

```sql
SHOW COLUMN [cached] STATS table_name [ (column_name [, ...]) ];
```

其中：

- `cached`: 展示当前 FE 内存缓存中的统计信息。

- `table_name`: 收集统计信息的目标表，可以是 `db_name.table_name` 形式。

- `column_name`: 指定的目标列，必须是 `table_name` 中存在的列，多个列名称用逗号分隔。如不指定，则展示所有列的信息。

**2. 示例**

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

### 查看表信息概况

通过 `SHOW TABLE STATS` 查看表的统计信息收集概况。

**1. 语法**

```sql
SHOW TABLE STATS table_name;
```

其中：table_name: 目标表表名。可以是  `db_name.table_name`  形式。

**2. 输出结果**

包含以下列：

| 列名          | 说明                                       |
| ------------- | ------------------------------------------ |
| updated_rows  | 自上次 ANALYZE 以来该表的更新行数          |
| query_times   | 保留列，用于在后续版本中记录该表的查询次数 |
| row_count     | 表的行数（可能不反映命令执行时的准确行数） |
| updated_time  | 上次统计信息的更新时间                     |
| columns       | 已收集统计信息的列                         |
| trigger       | 统计信息触发的方式                         |
| new_partition | 是否有新分区首次导入了数据                 |
| user_inject   | 用户是否手动注入了统计信息                 |

**3. 示例**

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

### 终止统计作业

通过 `KILL ANALYZE` 来终止当前正在运行的异步统计作业。

**1. 语法**

```sql
KILL ANALYZE job_id;
```

其中：`job_id`：表示统计信息作业的 ID。这是执行 `ANALYZE` 异步收集统计信息时返回的值，也可以通过 `SHOW ANALYZE` 语句获取。

**2. 示例**

终止 ID 为 52357 的统计作业。

```sql
mysql> KILL ANALYZE 52357;
```

### 删除统计信息

如果某个 Catalog、Database 或 Table 被删除，用户无需手动删除其统计信息，因为后台会定期清理这些信息。

然而对于仍然存在的表，系统不会自动清除其统计信息。此时需要用户手动进行删除操作，语法如下：

```sql
DROP STATS table_name
```

## 会话变量及配置项

### 会话变量

| 会话变量                            | 说明                                                         | 默认值                       |
| ----------------------------------- | ------------------------------------------------------------ | ---------------------------- |
| auto_analyze_start_time             | 自动统计信息收集的开始时间                                   | 0:00:00                      |
| auto_analyze_end_time               | 自动统计信息收集的结束时间                                   | 23:59:59                     |
| enable_auto_analyze                 | 是否开启自动收集功能                                         | TRUE                         |
| huge_table_default_sample_rows      | 对大表进行采样时的行数                                       | 4194304                      |
| table_stats_health_threshold        | 取值范围 0-100，表示自上次统计信息收集后，数据更新达到 (100 - table_stats_health_threshold)%时，认为统计信息已过时 | 60                           |
| auto_analyze_table_width_threshold  | 控制自动统计信息收集处理的最大表宽度，超过此列数的表不参与自动统计信息收集 | 100                          |
| enable_get_row_count_from_file_list | Hive 表是否通过文件大小来估算行数                             | FALSE（2.1.5 之后默认为 TRUE） |

### FE 配置项

:::info 备注
以下 FE 配置项在通常情况下无需特别关注
:::

| FE 配置项                                   | 说明                                  | 默认值                  |
| ------------------------------------------ | ------------------------------------- | ----------------------- |
| analyze_record_limit                       | 控制统计信息作业执行记录的持久化行数  | 20000                   |
| stats_cache_size                           | FE 侧统计信息缓存的条数                | 500000                  |
| statistics_simultaneously_running_task_num | 可同时执行的异步统计作业数量          | 3                       |
| statistics_sql_mem_limit_in_bytes          | 控制每个统计信息 SQL 可占用的 BE 内存大小 | 2L * 1024 * 1024 (2GiB) |

## 常见 FAQ

### Q1：如何查看一张表是否收集了统计信息以及内容是否正确？

首先，执行 `show column stats table_name` 查看是否有统计信息输出。

其次，执行 `show column cached stats table_name` 查看缓存中是否加载了该表的统计信息。

```sql
mysql> show column stats test_table\G
Empty set (0.02 sec)

mysql> show column cached stats test_table\G
Empty set (0.00 sec)
```

上图显示结果为空，说明 `test_table` 表目前没有统计信息。如果有统计信息，结果将类似以下内容：

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

在有统计信息的情况下，可以通过手动执行 SQL 来验证统计信息的准确性。

```sql
Select count(1), ndv(col1), min(col1), max(col1) from table
```

如果 `count` 和 `ndv` 的误差在一个数量级以内，那么准确度基本可以接受。

### Q2：为什么一张表一直没有自动收集统计信息？

首先，查看自动收集功能是否打开：

```sql
Show variables like "enable_auto_analyze"  // 如果是 false，需要设置为 true：
Set global enable_auto_analyze = true
```

如果已经是 true，再确认一下表的列数。如果超过`auto_analyze_table_width_threshold`的值，则这个表不会参与自动收集。此时，需要修改这个值，使其大于当前表的列数：

```sql
Show variables like "auto_analyze_table_width_threshold"  // 如果 Value 小于表的宽度，可以修改：
Set global auto_analyze_table_width_threshold=200
```

如果列数没有超过阈值，可以执行`show auto analyze`，检查是否有其他收集任务正在执行（处于 running 状态）。由于自动收集是单线程串行执行，会轮询所有库表，因此执行周期可能较长。

### Q3：为什么部分列没有统计信息？

目前，系统仅支持收集基本类型列的统计信息。对于复杂类型的列，如 JSONV、VARIANT、MAP、STRUCT、ARRAY、HLL、BITMAP、TIME 以及 TIMEV2 等系统会选择跳过。

### Q4：报错 "Stats table not available, please make sure your cluster status is normal"

出现这种报错通常意味着内部统计信息表处于不健康状态。

首先，需要检查集群中所有的 BE（Backend）是否都处于正常状态，确保所有 BE 都在正常工作。

其次，执行以下语句，以获取到所有的 `tabletId`（输出结果的第一列）。

```sql
show tablets from internal.__internal_schema.column_statistics;
```

接着，通过 `tablet_id` 逐一查看每个 tablet 是否正常：

```sql
ADMIN DIAGNOSE TABLET tablet_id
```

如果发现有不正常的 tablet，需要先进行修复，再重新收集统计信息。

### Q5：如何解决统计信息收集不及时问题？

自动收集的时间间隔具有不确定性，它与系统中表的数量及表的大小均有关联。若情况紧急，建议对表进行手动 `analyze` 操作。

若在导入大量数据后仍未触发自动收集，可能需要调整 `table_stats_health_threshold` 参数。其默认值为 60，意味着表的数据变化量需超过 40%（即 100 - 60）才会触发自动收集。可适当提高此值，例如设为 80，这样当表中数据变化量超过 20% 时，便会重新收集统计信息。

### Q6：自动收集时资源占用太多，该如何解决？

自动收集采用采样方式，无需全量扫描表数据，且自动收集任务以单线程串行执行，通常系统资源占用可控，不会对正常查询任务造成影响。

对于某些特殊表，如分区众多的表或单个 Tablet 体积庞大的表，可能会出现内存占用较多的情况。

建议用户在建表时合理规划 Tablet 数量，避免产生超大 Tablet。若 Tablet 结构不易调整，建议在系统低峰期开启自动收集，或于低峰期手动收集这些大表，以免在高峰期影响业务运行。在 Doris 3.x 系列中，我们将针对此类场景进行优化。