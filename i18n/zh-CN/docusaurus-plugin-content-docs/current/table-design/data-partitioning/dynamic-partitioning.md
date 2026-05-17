---
{
    "title": "动态分区",
    "language": "zh-CN",
    "description": "动态分区按规则滚动创建和删除分区，实现表分区生命周期管理（TTL）。适用于日志、时序数据等需要自动清理过期数据的场景。"
}
---

:::info 提示
更推荐使用[自动分区](./auto-partitioning)实现分区自动管理，它是动态分区的上位替代。
:::

<!-- 知识类型: Feature 介绍 + 操作步骤 + 配置参数 -->
<!-- 适用场景: 日志管理 / 时序数据 / 数据生命周期管理 -->

动态分区按照设定的规则滚动添加、删除分区，实现对表分区的生命周期管理（TTL），减少数据存储压力。在日志管理、时序数据管理等场景中，通常使用动态分区能力滚动删除过期数据。

## 适用场景

| 场景             | 说明                                                       |
| ---------------- | ---------------------------------------------------------- |
| 日志数据管理     | 按天/小时滚动保留近 N 天日志，自动删除过期分区             |
| 时序数据管理     | 监控、IoT 等场景，按时间维度自动维护分区                   |
| 数据生命周期管理 | 通过 TTL 控制数据保留范围，降低存储成本                    |
| 预创建未来分区   | 提前创建未来 N 天的分区，避免写入时因分区缺失而失败        |

下图展示了使用动态分区进行生命周期管理的示例，其中指定了以下规则：

- 调度单位 `dynamic_partition.time_unit` 为 DAY，按天组织分区；
- 起始偏移量 `dynamic_partition.start` 设置为 -1，保留一天前的分区；
- 结束偏移量 `dynamic_partition.end` 设置为 2，保留未来两天的分区。

依据以上规则，随着时间推移，总会保留 4 个分区：过去一天分区、当天分区与未来两天分区。

![dynamic-partition](/images/getting-started/dynamic-partition.png)

## 使用限制

使用动态分区时，需要遵守以下限制：

- 动态分区与跨集群复制（CCR）同时使用时会失效；
- 动态分区只支持在 DATE/DATETIME 列上进行 Range 类型的分区；
- 动态分区只支持单一分区键。

## 创建动态分区

<!-- 知识类型: 操作步骤 -->

建表时通过指定 `dynamic_partition` 属性，即可创建动态分区表：

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

详细的 `dynamic_partition` 参数请参考[动态分区属性参数](#动态分区属性参数)。

## 管理动态分区

### 修改动态分区属性

:::info 提示
使用 ALTER TABLE 语句修改动态分区时不会立即生效，会按 `dynamic_partition_check_interval_seconds` 参数指定的时间间隔轮询检查动态分区，完成所需的分区创建与删除操作。
:::

下例通过 ALTER TABLE 语句将非动态分区表修改为动态分区表：

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

通过 [SHOW-DYNAMIC-PARTITION](../../sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES) 可以查看当前数据库下所有动态分区表的调度情况：

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

### 历史分区管理

使用 `start` 与 `end` 属性指定动态分区数量时，为避免一次性创建所有分区造成等待时间过长，默认不会创建历史分区，只创建当前时间之后的分区。如需一次性创建所有分区，需开启 `create_history_partition` 参数。

例如当前日期为 2024-10-11，指定 `start = -2`，`end = 2`：

- 当 `create_history_partition = true` 时，立即创建 `[10-09, 10-13]` 共 5 个分区；
- 当 `create_history_partition = false` 时，仅创建 `[10-11, 10-13]` 共 3 个分区。

## 动态分区参数说明

### 动态分区属性参数

<!-- 知识类型: 配置参数 -->

动态分区的规则参数以 `dynamic_partition` 为前缀，可设置以下规则参数：

| 参数                                            | 必选 | 说明                                                                                                                                                                                                                                                          |
| ----------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dynamic_partition.enable`                      | 否   | 是否开启动态分区特性。可指定为 TRUE 或 FALSE。如果指定了动态分区其他必填参数，默认为 TRUE。                                                                                                                                                                   |
| `dynamic_partition.time_unit`                   | 是   | 动态分区调度的单位。可指定为 `HOUR`、`DAY`、`WEEK`、`MONTH`、`YEAR`，分别表示按小时、按天、按星期、按月、按年进行分区创建或删除。                                                                                                                             |
| `dynamic_partition.start`                       | 否   | 动态分区的起始偏移，为负数。默认值为 -2147483648，即不删除历史分区。根据 `time_unit` 属性的不同，以当天（星期/月）为基准，分区范围在此偏移之前的分区将被删除。此偏移之后至当前时间的历史分区如不存在，是否创建取决于 `dynamic_partition.create_history_partition`。 |
| `dynamic_partition.end`                         | 是   | 动态分区的结束偏移，为正数。根据 `time_unit` 属性的不同，以当天（星期/月）为基准，提前创建对应范围的分区。                                                                                                                                                    |
| `dynamic_partition.prefix`                      | 是   | 动态创建的分区名前缀。                                                                                                                                                                                                                                        |
| `dynamic_partition.buckets`                     | 否   | 动态创建的分区所对应的分桶数。设置该参数后会覆盖 `DISTRIBUTED` 中指定的分桶数。                                                                                                                                                                               |
| `dynamic_partition.replication_num`             | 否   | 动态创建的分区所对应的副本数量，如果不填写，则默认为该表创建时指定的副本数量。                                                                                                                                                                                |
| `dynamic_partition.create_history_partition`    | 否   | 默认为 false。当置为 true 时，Doris 会自动创建所有分区，具体创建规则见下文。同时，FE 的参数 `max_dynamic_partition_num` 会限制总分区数量，以避免一次性创建过多分区。当期望创建的分区个数大于 `max_dynamic_partition_num` 值时，操作将被禁止。当不指定 `start` 属性时，该参数不生效。 |
| `dynamic_partition.history_partition_num`       | 否   | 当 `create_history_partition` 为 `true` 时，该参数用于指定创建历史分区数量。默认值为 -1，即未设置。该变量与 `dynamic_partition.start` 作用相同，建议同时只设置一个。                                                                                          |
| `dynamic_partition.start_day_of_week`           | 否   | 当 `time_unit` 为 `WEEK` 时，该参数用于指定每周的起始点。取值为 1 到 7，其中 1 表示周一，7 表示周日。默认为 1，即每周以周一为起始点。                                                                                                                         |
| `dynamic_partition.start_day_of_month`          | 否   | 当 `time_unit` 为 `MONTH` 时，该参数用于指定每月的起始日期。取值为 1 到 28，其中 1 表示每月 1 号，28 表示每月 28 号。默认为 1，即每月以 1 号为起始点。暂不支持以 29、30、31 号为起始日，以避免因闰年或闰月带来的歧义。                                       |
| `dynamic_partition.reserved_history_periods`    | 否   | 需要保留的历史分区时间范围。当 `dynamic_partition.time_unit` 设置为 `DAY/WEEK/MONTH/YEAR` 时，需以 `[yyyy-MM-dd,yyyy-MM-dd],[...,...]` 格式进行设置；当 `dynamic_partition.time_unit` 设置为 `HOUR` 时，需以 `[yyyy-MM-dd HH:mm:ss,yyyy-MM-dd HH:mm:ss],[...,...]` 格式进行设置。如果不设置，默认为 `"NULL"`。 |
| `dynamic_partition.time_zone`                   | 否   | 动态分区时区，默认为当前服务器的系统时区，如 `Asia/Shanghai`。更多时区设置可参考[时区管理](../../admin-manual/cluster-management/time-zone)。                                                                                                                 |

### FE 配置参数

可在 FE 配置文件中或通过 `ADMIN SET FRONTEND CONFIG` 命令修改 FE 中的动态分区参数配置：

| 参数                                         | 默认值 | 说明                                                              |
| -------------------------------------------- | ------ | ----------------------------------------------------------------- |
| `dynamic_partition_enable`                   | false  | 是否开启 Doris 的动态分区功能。该参数只影响动态分区表的分区操作，不影响普通表。 |
| `dynamic_partition_check_interval_seconds`   | 600    | 动态分区线程的执行频率，单位为秒。                                |
| `max_dynamic_partition_num`                  | 500    | 用于限制创建动态分区表时可创建的最大分区数，避免一次创建过多分区。 |

## 动态分区最佳实践

### 示例 1：日志数据滚动保留

按天分区，只保留过去 7 天及当天的分区，并预先创建未来 3 天的分区：

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

### 示例 2：按月分区且保留全部历史

按月分区，不删除历史分区，并预先创建未来 2 个月的分区，同时设定每月 3 号为起始日：

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

### 示例 3：保留指定历史时间范围

按天分区，保留过去 10 天及未来 10 天的分区，并保留 `[2020-06-01, 2020-06-20]` 与 `[2020-10-31, 2020-11-15]` 期间的历史数据：

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
    "dynamic_partition.reserved_history_periods" = "[2020-06-01,2020-06-20],[2020-10-31,2020-11-15]"
);
```
