---
{
    "title": "动态分区（不推荐）",
    "language": "zh-CN",
    "description": "动态分区会按照设定的规则，滚动添加、删除分区，从而实现对表分区的生命周期管理（TTL），减少数据存储压力。在日志管理，时序数据管理等场景，通常可以使用动态分区能力滚动删除过期的数据。"
}
---

动态分区会按照设定的规则，滚动添加、删除分区，从而实现对表分区的生命周期管理（TTL），减少数据存储压力。在日志管理，时序数据管理等场景，通常可以使用动态分区能力滚动删除过期的数据。

下图中展示了使用动态分区进行生命周期管理，其中指定了以下规则：

* 动态分区调度单位 `dynamic_partition.time_unit` 为 DAY，按天组织分区；

* 动态分区起始偏移量 `dynamic_partition.start` 设置为 -1，保留一天前分区；

* 动态分区结束偏移量 `dynamic_partition.end` 设置为 2，保留未来两天分区

依据以上规则，随着时间推移，总会保留 4 个分区，即过去一天分区，当天分区与未来两天分区：

![dynamic-partition](/images/getting-started/dynamic-partition.png)

## 使用限制

在使用动态分区时，需要遵守以下规则：

* 动态分区与跨集群复制（CCR）同时使用时会失效；

* 动态分区只支持在 DATE/DATETIME 列上进行 Range 类型的分区；

* 动态分区只支持单一分区键。

## 创建动态分区

在建表时，通过指定 `dynamic_partition` 属性，可以创建动态分区表。

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

上例中创建了动态分区表，指定以下

详细 `dynamic_partition` 参数可以参考[动态分区参数说明](#动态分区属性参数)。

## 管理动态分区

### 修改动态分区属性

:::info 提示：

在使用 ALTER TABLE 语句修改动态分区时，不会立即生效。会以 `dynamic_partition_check_interval_seconds` 参数指定的时间间隔轮训检查 dynamic partition 分区，完成需要的分区创建与删除操作。

:::

下例中通过 ALTER TABLE 语句，将非动态分区表修改为动态分区：

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

### 历史分区管理

在使用 `start` 与 `end` 属性指定动态分区数量时，为了避免一次性创建所有的分区造成等待时间过长，不会创建历史分区，只会创建当前时间以后得分区。如果需要一次性创建所有分区，需要开启 `create_history_partition` 参数。

例如当前日期为 2024-10-11，指定 start = -2，end = 2：

* 如果指定了 `create_history_partition = true`，立即创建所有分区，即 [10-09, 10-13] 五个分区；

* 如果指定了 `create_history_partition = false`，只创建包含 10-11 以后的分区，即 [10-11, 10-13] 三个分区。

## 动态分区参数说明

### 动态分区属性参数

动态分区的规则参数以 dynamic_partition 为前缀，可以设置以下规则参数：

| 参数                                            | 必选 | 说明                                                                                                                                                                                                                                                          |
| --------------------------------------------- | -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dynamic_partition.enable`                     | 否  | 是否开启动态分区特性。可以指定为 TRUE 或 FALSE。如果指定了动态分区其他必填参数，默认为 TRUE。                                                                                                                                                                                                     |
| `dynamic_partition.time_unit`                 | 是  | 动态分区调度的单位。可指定为 `HOUR`、`DAY`、`WEEK`、`MONTH`、`YEAR`。分别表示按小时、按天、按星期、按月、按年进行分区创建或删除：                                                                                                                                                                            |
| `dynamic_partition.start`                      | 否  | 动态分区的起始偏移，为负数。默认值为 -2147483648，即不删除历史分区。根据 `time_unit` 属性的不同，以当天（星期/月）为基准，分区范围在此偏移之前的分区将会被删除。此偏移之后至当前时间的历史分区如不存在，是否创建取决于 `dynamic_partition.create_history_partition`。                                                                                      |
| `dynamic_partition.end`                        | 是  | 动态分区的结束偏移，为正数。根据 `time_unit` 属性的不同，以当天（星期/月）为基准，提前创建对应范围的分区。                                                                                                                                                                                                |
| `dynamic_partition.prefix`                     | 是  | 动态创建的分区名前缀。                                                                                                                                                                                                                                                 |
| `dynamic_partition.buckets`                    | 否  | 动态创建的分区所对应的分桶数。设置该参数后会覆盖 `DISTRIBUTED` 中指定的分桶数。量。                                                                                                                                                                                                                                            |
| `dynamic_partition.replication_num`           | 否  | 动态创建的分区所对应的副本数量，如果不填写，则默认为该表创建时指定的副本数量。                                                                                                                                                                                                                     |
| `dynamic_partition.create_history_partition` | 否  | 默认为 false。当置为 true 时，Doris 会自动创建所有分区，具体创建规则见下文。同时，FE 的参数 `max_dynamic_partition_num` 会限制总分区数量，以避免一次性创建过多分区。当期望创建的分区个数大于 `max_dynamic_partition_num` 值时，操作将被禁止。当不指定 `start` 属性时，该参数不生效。                                                                      |
| `dynamic_partition.history_partition_num`    | 否  | 当`create_history_partition` 为 `true` 时，该参数用于指定创建历史分区数量。默认值为 -1，即未设置。该变量与 `dynamic_partition.start` 作用相同，建议同时只设置一个。                                                                                                                                          |
| `dynamic_partition.start_day_of_week`       | 否  | 当 `time_unit` 为 `WEEK` 时，该参数用于指定每周的起始点。取值为 1 到 7。其中 1 表示周一，7 表示周日。默认为 1，即表示每周以周一为起始点。                                                                                                                                                                       |
| `dynamic_partition.start_day_of_month`      | 否  | 当 `time_unit` 为 `MONTH` 时，该参数用于指定每月的起始日期。取值为 1 到 28。其中 1 表示每月 1 号，28 表示每月 28 号。默认为 1，即表示每月以 1 号为起始点。暂不支持以 29、30、31 号为起始日，以避免因闰年或闰月带来的歧义。                                                                                                                    |
| `dynamic_partition.reserved_history_periods` |  否  | 需要保留的历史分区的时间范围。当`dynamic_partition.time_unit` 设置为 "DAY/WEEK/MONTH/YEAR" 时，需要以 `[yyyy-MM-dd,yyyy-MM-dd],[...,...]` 格式进行设置。当`dynamic_partition.time_unit` 设置为 "HOUR" 时，需要以 `[yyyy-MM-dd HH:mm:ss,yyyy-MM-dd HH:mm:ss],[...,...]` 的格式来进行设置。如果不设置，默认为 `"NULL"`。 |
| `dynamic_partition.time_zone`                 | 否  | 动态分区时区，默认为当前服务器的系统时区，如 `Asia/Shanghai`。更多时区设置可以参考[时区管理](../../admin-manual/cluster-management/time-zone)。                                                                                                                 |

### FE 配置参数

可以在 FE 配置文件或通过 `ADMIN SET FRONTEND CONFIG` 命令修改 FE 中的动态分区参数配置：

| 参数                                           | 默认值   | 说明                                          |
| -------------------------------------------- | ----- | ------------------------------------------- |
| `dynamic_partition_enable`                   | false | 是否开启 Doris 的动态分区功能。该参数只影响动态分区表的分区操作，不影响普通表。 |
| `dynamic_partition_check_interval_seconds` | 600   | 动态分区线程的执行频率，单位为秒。                           |
| `max_dynamic_partition_num`                 | 500   | 用于限制创建动态分区表时可以创建的最大分区数，避免一次创建过多分区。          |

## 动态分区最佳实践

示例 1：按天分区，只保留过去 7 天的及当天分区，并且预先创建未来 3 天的分区。

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

示例 2：按月分区，不删除历史分区，并且预先创建未来 2 个月的分区。同时设定以每月 3 号为起始日。

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

示例 3：按天分区，保留过去 10 天及未来 10 天分区，并且保留 [2020-06-01,2020-06-20] 及 [2020-10-31,2020-11-15] 期间的历史数据。

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
