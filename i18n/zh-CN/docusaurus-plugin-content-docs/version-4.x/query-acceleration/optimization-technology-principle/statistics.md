---
{
    "title": "Doris 统计信息收集与管理：CBO 优化器配置指南",
    "language": "zh-CN",
    "description": "如何在 Apache Doris 中收集、管理和调优统计信息？本文介绍 ANALYZE 命令、自动收集机制、外表统计、配置项及常见问题排查。",
    "keywords": ["Doris 统计信息", "ANALYZE", "CBO", "自动收集", "table stats", "column stats", "auto analyze"],
    "sidebar_label": "统计信息"
}
---

# 统计信息

<!-- 知识类型：概念 + 操作指南 -->
<!-- 适用场景：CBO 调优、统计信息收集与管理、查询性能问题排查 -->

统计信息（Statistics）是 Doris CBO（Cost-Based Optimizer）进行代价估算的基石，其准确性直接决定查询执行计划的优劣。本文介绍统计信息的收集方式、管理命令、相关配置以及常见问题排查方法。

**适用版本**：Doris 2.0 及以上。

## 阅读前检查清单

- [ ] 已了解 Doris 版本（自动收集功能需 2.0.3 及以上）。
- [ ] 已确认目标对象类型：内表、Hive、Iceberg、Paimon、JDBC 等。
- [ ] 已了解目标列类型（仅基本类型支持收集）。
- [ ] 已知是否需要手动触发或依赖自动收集。

## 核心概念速览

<!-- 知识类型：概念 -->
<!-- 适用场景：理解统计信息的作用与组成 -->

**一句话定义**：统计信息是 Doris 在表与列级别记录的数据分布元信息，供优化器估算代价、选择最优 Plan。

Doris 在表级别按列收集统计信息，包含以下指标：

| 指标            | 描述                 |
| --------------- | -------------------- |
| `row_count`     | 总行数               |
| `data_size`     | 列的总数据量         |
| `avg_size_byte` | 列的平均每行数据量   |
| `ndv`           | 不同值数量（基数）   |
| `min`           | 最小值               |
| `max`           | 最大值               |
| `null_count`    | 空值数量             |

**支持的列类型**：BOOLEAN、TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DATE、DATETIME、STRING、VARCHAR、TEXT。

**不支持（自动跳过）**：JSONB、VARIANT、MAP、STRUCT、ARRAY、HLL、BITMAP、TIME、TIMEV2、VARBINARY。

收集结果保存在 `internal.__internal_schema.column_statistics` 表中。

## 统计信息的收集

<!-- 知识类型：操作指南 -->
<!-- 适用场景：手动或自动触发统计信息收集 -->

Doris 默认开启内表的自动抽样收集，绝大多数情况下用户无需手动干预。如需精确控制，可使用手动收集。

### 收集方式对比

| 维度         | 手动收集（ANALYZE）            | 自动收集（默认开启）               |
| ------------ | ------------------------------ | ---------------------------------- |
| 触发方式     | 用户主动执行                   | 后台线程定期扫描                   |
| 适用场景     | 紧急更新、首次收集、调试       | 日常维护、长期持续保鲜             |
| 最低版本     | 2.0                            | 2.0.3                              |
| 抽样策略     | 可指定行数或比例               | 默认抽样 4194304 行（2^22）        |
| 控制粒度     | 表 / 库 / 列                   | 集群级开关 + 表级策略              |

### 手动收集

**目的**：立即触发表或库的统计信息收集与更新。

**命令**：通过 `ANALYZE` 语句手动提交收集作业，详见 SQL 手册 [ANALYZE](../../sql-manual/sql-statements/statistics/ANALYZE)。

**典型示例**：

对 `lineitem` 表的所有列进行全量收集：

```sql
ANALYZE TABLE lineitem;
```

对 `tpch100` 数据库中所有表的所有列进行全量收集：

```sql
ANALYZE DATABASE tpch100;
```

对 `lineitem` 表按采样 100000 行进行收集：

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
```

对 `lineitem` 表的 `l_orderkey` 和 `l_linenumber` 列按采样 100000 行进行收集：

```sql
ANALYZE TABLE lineitem (l_orderkey, l_linenumber) WITH SAMPLE ROWS 100000;
```

### 自动收集

**目的**：通过后台线程定期扫描，自动维护统计信息的新鲜度。

**开关**：通过 `ENABLE_AUTO_ANALYZE` 变量控制。

```sql
SET GLOBAL ENABLE_AUTO_ANALYZE = TRUE;  -- 打开自动收集
SET GLOBAL ENABLE_AUTO_ANALYZE = FALSE; -- 关闭自动收集
```

#### 工作机制

启用后，后台线程定期扫描 `InternalCatalog` 下的所有库表。轮询时按以下规则判断是否需要重新收集：

1. 表中存在无统计信息的列。
2. 表的健康度低于阈值（默认 90，由 `table_stats_health_threshold` 控制）。健康度越接近 100 表示数据变化越小；低于 90 表示统计信息已偏差较大需重收。
3. 对于内表，数据发生过变化，但 24 小时之内没有收集过统计信息。

**轮询间隔**：默认 5 分钟（由 `fe.conf` 中的 `auto_check_statistics_in_minutes` 配置）。集群启动 5 分钟后开始第一轮，全部完成后休眠 5 分钟再开始下一轮。

:::caution 注意
单轮遍历耗时取决于表数量与数据量，无法保证 5 分钟内必然采集到某张表。
:::

#### 关键参数

| 参数                                | 作用                                       | 默认值       |
| ----------------------------------- | ------------------------------------------ | ------------ |
| `auto_analyze_table_width_threshold`| 自动收集的最大列数上限                     | 300          |
| `huge_table_default_sample_rows`    | 自动收集时的采样行数                       | 4194304（2^22） |
| `auto_analyze_start_time`           | 自动收集的起始时间                         | 0:00:00      |
| `auto_analyze_end_time`             | 自动收集的结束时间                         | 23:59:59     |

**调整宽表上限**（避免大宽表占用过多资源）：

```sql
SET GLOBAL auto_analyze_table_width_threshold = 350;
```

**指定低峰时段执行**（避免影响业务）：

```sql
SET GLOBAL auto_analyze_start_time = "03:00:00"; -- 起始时间：凌晨 3 点
SET GLOBAL auto_analyze_end_time   = "14:00:00"; -- 结束时间：下午 2 点
```

如需获取更准确的数据分布信息，可调高 `huge_table_default_sample_rows` 增加采样行数。

### 外表收集

<!-- 知识类型：操作指南 -->
<!-- 适用场景：Hive / Iceberg / JDBC / Paimon 等外表统计 -->

**外表类型**：通常为 Hive、Iceberg、JDBC、Paimon 等。

#### 收集能力矩阵

| 外表类型 | 手动全量 | 手动采样 | 自动收集 |
| -------- | -------- | -------- | -------- |
| Hive     | 支持     | 支持     | 支持     |
| Iceberg  | 支持     | 不支持   | 不支持   |
| JDBC     | 支持     | 不支持   | 不支持   |
| 其他     | 不支持   | 不支持   | 不支持   |

#### 默认行为

外部 Catalog 默认不参与列统计信息的自动收集，仅收集表的行数信息，避免对历史数据的过度扫描。如需启用列统计信息的自动收集：

```sql
ALTER CATALOG <catalog_name> SET PROPERTIES ('enable.auto.analyze'='true');  -- 打开
ALTER CATALOG <catalog_name> SET PROPERTIES ('enable.auto.analyze'='false'); -- 关闭
```

**表级粒度控制**（优先级高于 Catalog 属性）：

```sql
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "enable");          -- 打开
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "disable");         -- 关闭
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "base_on_catalog"); -- 跟随 Catalog
```

外表无健康度概念，启用自动收集后，默认 24 小时内只对一张外表自动收集一次。可通过 `external_table_auto_analyze_interval_in_millis` 调整最小间隔。

#### 行数估算策略

| 外表类型     | 估算方式                                                                 |
| ------------ | ------------------------------------------------------------------------ |
| Hive         | 优先取 Parameters 中的 `numRows`；缺失则用 `totalSize` 配合 Schema 估算；再次缺失则按文件大小估算 |
| Iceberg      | 调用 snapshot API 获取 `total-records` 与 `total-position-deletes` 计算 |
| Paimon       | 调用 scan API 累加每个 Split 的行数                                      |
| JDBC         | 通过后端数据库的行数获取语句获取（支持 MySQL、Oracle、PostgreSQL、SQLServer） |
| 其他         | 暂不支持自动获取与估算                                                   |

如担心扫描文件大小占用资源，可关闭 Hive 的文件大小估算：

```sql
SET GLOBAL enable_get_row_count_from_file_list = FALSE;
```

查看外表估算行数：

```sql
SHOW TABLE STATS table_name;
```

:::tip 提示
若 `row_count` 显示为 `-1`，表示未能获取到行数信息或表为空。
:::

## 统计信息作业管理

<!-- 知识类型：操作指南 -->
<!-- 适用场景：查看、终止、删除统计作业与统计结果 -->

### 查看统计作业

**目的**：查看已提交的异步统计信息收集作业（同步作业不保留历史）。

**命令**：

```sql
SHOW ANALYZE [job_id];
```

详见 [SHOW ANALYZE](../../sql-manual/sql-statements/statistics/SHOW-ANALYZE)。

**说明**：系统仅保留 20000 个历史作业。输出列含义：

| 列名            | 说明                                       |
| --------------- | ------------------------------------------ |
| `job_id`        | 统计作业 ID                                |
| `catalog_name`  | Catalog 名称                               |
| `db_name`       | 数据库名称                                 |
| `tbl_name`      | 表名称                                     |
| `col_name`      | 列名称列表（`index_name:column_name`）     |
| `job_type`      | 作业类型                                   |
| `analysis_type` | 统计类型                                   |
| `message`       | 作业信息                                   |
| `state`         | 作业状态                                   |
| `progress`      | 作业进度                                   |
| `schedule_type` | 调度方式                                   |
| `start_time`    | 作业开始时间                               |
| `end_time`      | 作业结束时间                               |

**示例**：

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

### 查看统计任务

**目的**：每个作业可包含多个任务，每个任务对应一列。可查看任务级进度。

**命令**：

```sql
SHOW ANALYZE TASK STATUS [job_id];
```

**示例**：

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

### 查看列统计信息

**目的**：查看已收集的列级统计信息。

**命令**：

```sql
SHOW COLUMN [cached] STATS table_name [ (column_name [, ...]) ];
```

**参数说明**：

| 参数          | 说明                                                                |
| ------------- | ------------------------------------------------------------------- |
| `cached`      | 仅展示当前 FE 内存缓存中的统计信息                                  |
| `table_name`  | 目标表，可使用 `db_name.table_name` 形式                            |
| `column_name` | 目标列（可指定多个，逗号分隔）；不指定则展示所有列                  |

**示例**：

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

### 查看表统计信息概况

**目的**：查看表级统计信息收集概况。

**命令**：

```sql
SHOW TABLE STATS table_name;
```

其中 `table_name` 可使用 `db_name.table_name` 形式。

**输出列说明**：

| 列名            | 说明                                           |
| --------------- | ---------------------------------------------- |
| `updated_rows`  | 自上次 ANALYZE 以来该表的更新行数              |
| `query_times`   | 保留列，预留用于在后续版本中记录查询次数       |
| `row_count`     | 表的行数（可能不反映命令执行时的准确行数）     |
| `updated_time`  | 上次统计信息更新时间                           |
| `columns`       | 已收集统计信息的列                             |
| `trigger`       | 统计信息触发方式                               |
| `new_partition` | 是否有新分区首次导入了数据                     |
| `user_inject`   | 用户是否手动注入了统计信息                     |

### 终止统计作业

**目的**：终止当前正在运行的异步统计作业。

**命令**：

```sql
KILL ANALYZE job_id;
```

其中 `job_id` 为 `ANALYZE` 异步执行返回的值，亦可通过 `SHOW ANALYZE` 获取。

**示例**：终止 ID 为 52357 的统计作业。

```sql
mysql> KILL ANALYZE 52357;
```

### 删除统计信息

**目的**：手动清理仍存在表的统计信息（已删除对象由后台定期清理，无需手动）。

**命令**：

```sql
DROP STATS table_name;
```

## 会话变量及配置项

<!-- 知识类型：参考 -->
<!-- 适用场景：调优自动收集与统计信息存储 -->

### 会话变量

| 会话变量                              | 说明                                                                                          | 默认值                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------- |
| `auto_analyze_start_time`             | 自动收集的开始时间                                                                            | `0:00:00`                       |
| `auto_analyze_end_time`               | 自动收集的结束时间                                                                            | `23:59:59`                      |
| `enable_auto_analyze`                 | 是否开启自动收集                                                                              | `TRUE`                          |
| `huge_table_default_sample_rows`      | 大表采样行数                                                                                  | `4194304`                       |
| `table_stats_health_threshold`        | 取值 0–100；当 (100 − 阈值)% 数据变化达到时认为统计信息过时                                   | `90`                            |
| `auto_analyze_table_width_threshold`  | 自动收集的最大列数；超过则不参与自动收集                                                      | `300`                           |
| `enable_get_row_count_from_file_list` | Hive 表是否通过文件大小估算行数                                                               | `TRUE`（2.1.5 之前默认 `FALSE`）|

### FE 配置项

:::info 备注
以下 FE 配置项通常无需特别关注。
:::

| FE 配置项                                    | 说明                                              | 默认值                  |
| -------------------------------------------- | ------------------------------------------------- | ----------------------- |
| `analyze_record_limit`                       | 控制统计信息作业执行记录的持久化行数              | `20000`                 |
| `stats_cache_size`                           | FE 侧统计信息缓存的条数                           | `500000`                |
| `statistics_simultaneously_running_task_num` | 可同时执行的异步统计作业数量                      | `3`                     |
| `statistics_sql_mem_limit_in_bytes`          | 每个统计 SQL 可占用的 BE 内存大小                 | `2L * 1024 * 1024`（2 GiB） |

## 常见问题（FAQ）

<!-- 知识类型：故障排查 -->
<!-- 适用场景：统计信息相关常见问题排查 -->

### Q1：如何确认一张表是否已收集统计信息？

**步骤 1**：查看是否存在收集结果。

```sql
SHOW COLUMN STATS table_name;
```

**步骤 2**：查看 FE 缓存中是否加载了统计信息。

```sql
SHOW COLUMN CACHED STATS table_name;
```

若两者均为空，说明该表当前没有统计信息。已收集的示例输出：

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

**步骤 3**：通过手动 SQL 验证准确性。

```sql
SELECT count(1), ndv(col1), min(col1), max(col1) FROM table;
```

若 `count` 与 `ndv` 误差在一个数量级以内，准确度可接受。

### Q2：为什么一张表始终没有自动收集统计信息？

**排查 1**：自动收集开关是否打开。

```sql
SHOW VARIABLES LIKE "enable_auto_analyze";
-- 若为 false 则打开：
SET GLOBAL enable_auto_analyze = TRUE;
```

**排查 2**：表的列数是否超过 `auto_analyze_table_width_threshold`（默认 300），超过将不会参与自动收集。

```sql
SHOW VARIABLES LIKE "auto_analyze_table_width_threshold";
-- 若小于表宽度，可调整：
SET GLOBAL auto_analyze_table_width_threshold = 350;
```

**排查 3**：是否有其他作业正在执行。

```sql
SHOW AUTO ANALYZE;
```

自动收集为单线程串行执行并轮询所有库表，遍历周期可能较长。

### Q3：为什么部分列没有统计信息？

仅基本类型列支持统计信息收集，复杂类型（如 JSONB、VARIANT、MAP、STRUCT、ARRAY、HLL、BITMAP、TIME、TIMEV2、VARBINARY）会被自动跳过。

### Q4：报错 `Stats table not available, please make sure your cluster status is normal`

通常表示内部统计信息表处于不健康状态。排查步骤：

**步骤 1**：检查所有 BE 是否处于正常状态。

**步骤 2**：获取统计信息表的所有 `tabletId`。

```sql
SHOW TABLETS FROM internal.__internal_schema.column_statistics;
```

**步骤 3**：逐个诊断 tablet。

```sql
ADMIN DIAGNOSE TABLET tablet_id;
```

**步骤 4**：修复异常 tablet 后重新收集统计信息。

### Q5：如何解决统计信息收集不及时？

- **紧急场景**：直接对目标表执行手动 `ANALYZE`。
- **调整健康度阈值**：默认 `table_stats_health_threshold = 90`，意味着数据变化超过 10% 才触发收集。可调高为 95（即变化超过 5% 即触发）：

```sql
SET GLOBAL table_stats_health_threshold = 95;
```

### Q6：自动收集占用资源过多怎么办？

自动收集采用采样且单线程串行执行，通常资源占用可控。但下列场景可能内存占用偏高：

- 分区数量众多的表。
- 单个 Tablet 体积庞大的表。

**优化建议**：

1. 建表时合理规划 Tablet 数量，避免超大 Tablet。
2. 在系统低峰期开启自动收集（参见 `auto_analyze_start_time`/`auto_analyze_end_time`）。
3. 在低峰期手动收集大表。
4. Doris 3.x 系列将进一步优化此类场景。
