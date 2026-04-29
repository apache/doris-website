---
{
    "title": "主键模型的更新并发控制",
    "language": "zh-CN",
    "description": "Doris 主键模型并发更新控制指南：基于 MVCC 实现版本管理，通过 Sequence 列控制乱序数据替换顺序，并支持 UPDATE 并发配置。"
}
---

<!-- 知识类型: 功能说明 + 操作步骤 -->
<!-- 适用场景: 高并发数据导入 / 主键模型乱序更新 / UPDATE 事务控制 -->

Doris 在主键模型（Unique Key）下提供了完善的并发更新控制能力，主要解决以下三类典型场景：

| 用户场景 | 痛点 | Doris 解决方案 |
| --- | --- | --- |
| 同一主键的多次导入 | 并发导入时如何确定哪条记录最终生效 | MVCC 多版本并发控制，基于版本号决定覆盖顺序 |
| 多线程同步乱序到达 | 旧数据较晚到达，错误覆盖了新数据 | Sequence 列：由用户指定替换顺序，sequence 值大者生效 |
| 同一张表的并发 UPDATE | 行更新可能产生脏数据，默认串行执行 | 表级锁保证 Serializable 隔离级别，可选放开并发限制 |

下文将分别介绍这些机制的工作原理与使用方法。

## MVCC 多版本并发控制

<!-- 知识类型: 概念说明 -->

Doris 采用多版本并发控制机制（MVCC，Multi-Version Concurrency Control）来管理并发更新：

- 每次数据写入操作均会分配一个写入事务，事务确保数据写入的原子性（要么完全成功，要么完全失败）。
- 在写入事务提交时，系统会为其分配一个版本号。
- 当用户使用 Unique Key 模型并多次导入数据时，如果存在重复主键，Doris 会根据版本号确定覆盖顺序：**版本号较高的数据覆盖版本号较低的数据**。

## UPDATE 并发控制

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 多个 UPDATE 语句并发执行 -->

### 默认行为

默认情况下，Doris **不允许** 同一时间对同一张表并发执行多个 `UPDATE` 操作。

原因在于：Doris 目前支持的是行级更新，即使用户只声明 `SET v2 = 1`，实际上其他所有的 Value 列也会被覆盖一遍（尽管值没有变化）。如果同时有两个 `UPDATE` 操作对同一行进行更新，行为可能不确定，存在脏数据风险。

为此，`UPDATE` 语句默认通过表级锁提供 Serializable 隔离级别的事务能力，即多个 `UPDATE` 操作只能串行执行。

### 放开并发限制

在实际应用中，如果用户能够保证即使并发更新也不会同时对同一行进行操作，可以通过修改 FE 配置手动放开并发限制：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `enable_concurrent_update` | `false` | 设置为 `true` 时，允许并发执行 `UPDATE`，但不再提供事务保证 |

## Sequence 列

<!-- 知识类型: 功能说明 -->
<!-- 适用场景: 多线程并发同步 / 乱序数据导入 -->

### 为什么需要 Sequence 列

Unique 模型主要针对需要唯一主键的场景，可以保证主键唯一性约束。但在以下情形下，仅依赖导入版本号无法满足业务需求：

- 通过多线程并发同步数据到 Doris 时，不同线程的数据可能乱序到达；
- 旧数据可能因较晚到达而错误覆盖新数据；
- 同一批次或不同批次中导入相同主键的数据，替换顺序无法保证，最终结果存在不确定性。

为解决这一问题，Doris 支持在导入时指定 **Sequence 列**：相同 Key 列下，按照 Sequence 列的值进行替换，**较大值替换较小值**，反之则不会替换。这将顺序的决定权交给了用户。

实现层面，Doris 增加了一个隐藏列 `__DORIS_SEQUENCE_COL__`，该列的类型由用户在建表时指定，导入时确定具体值，并依据该值决定相同 Key 列下哪一行生效。

:::caution 注意
Sequence 列目前只支持 Unique 模型。
:::

### 启用 Sequence 列

启用方式有以下几种：

| 场景 | 操作方式 |
| --- | --- |
| 新建表时启用 | 在建表语句的 `PROPERTIES` 中设置 `function_column.sequence_col` 或 `function_column.sequence_type` |
| 已有表启用 | 执行 `ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")` |
| 检查是否已启用 | 设置 `SET show_hidden_columns=true`，再执行 `desc tablename`，若输出中包含 `__DORIS_SEQUENCE_COL__` 则表示已启用 |

两种属性的差异如下：

| 属性 | 含义 | 是否要求 schema 中存在对应列 |
| --- | --- | --- |
| `function_column.sequence_col` | 指定 Sequence 列映射到表中已有的某一列 | 是 |
| `function_column.sequence_type` | 仅指定 Sequence 列的类型，使用隐藏列存储 | 否 |

支持的列类型：整型、`DATE`、`DATETIME`。**列类型一旦创建后不能更改**。

### 使用示例

下面以 Stream Load 为例展示完整使用方式。

#### 1. 创建支持 Sequence 列的表

创建 Unique 模型的 `test_table`，并指定 Sequence 列映射到表中的 `modify_date` 列：

```sql
CREATE TABLE test.test_table
(
    user_id bigint,
    date date,
    group_id bigint,
    modify_date date,
    keyword VARCHAR(128)
)
UNIQUE KEY(user_id, date, group_id)
DISTRIBUTED BY HASH (user_id) BUCKETS 32
PROPERTIES(
    "function_column.sequence_col" = 'modify_date',
    "replication_num" = "1",
    "in_memory" = "false"
);
```

创建好的表结构如下：

```sql
MySQL>  desc test_table;
+-------------+--------------+------+-------+---------+---------+
| Field       | Type         | Null | Key   | Default | Extra   |
+-------------+--------------+------+-------+---------+---------+
| user_id     | BIGINT       | No   | true  | NULL    |         |
| date        | DATE         | No   | true  | NULL    |         |
| group_id    | BIGINT       | No   | true  | NULL    |         |
| modify_date | DATE         | No   | false | NULL    | REPLACE |
| keyword     | VARCHAR(128) | No   | false | NULL    | REPLACE |
+-------------+--------------+------+-------+---------+---------+
```

如果不希望表 schema 中存在该列，可以改用 `function_column.sequence_type` 指定类型：

```sql
PROPERTIES (
    "function_column.sequence_type" = 'Date'
);
```

#### 2. 导入数据并验证 Sequence 行为

使用列映射方式（`function_column.sequence_col`）时，导入命令无需额外指定参数。下面用 Stream Load 导入如下数据：

```Plain
1	2020-02-22	1	2020-02-21	a
1	2020-02-22	1	2020-02-22	b
1	2020-02-22	1	2020-03-05	c
1	2020-02-22	1	2020-02-26	d
1	2020-02-22	1	2020-02-23	e
1	2020-02-22	1	2020-02-24	b
```

Stream Load 命令：

```shell
curl --location-trusted -u root: -T testData http://host:port/api/test/test_table/_stream_load
```

查询结果：

```sql
MySQL> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

由于 Sequence 列（即 `modify_date`）中 `2020-03-05` 为最大值，因此 `keyword` 列最终保留了 `c`。

#### 3. 在不同导入方式中指定 Sequence 列

当建表时使用 `function_column.sequence_type`（即未直接映射到表中的列）时，导入时需要显式指定 Sequence 列到数据列的映射。

**Stream Load**

在 header 中通过 `function_column.sequence_col` 指定隐藏列对应的 `source_sequence` 映射：

```shell
curl --location-trusted -u root \
    -H "columns: k1,k2,source_sequence,v1,v2" \
    -H "function_column.sequence_col: source_sequence" \
    -T testData http://host:port/api/testDb/testTbl/_stream_load
```

**Broker Load**

在 `ORDER BY` 处指定隐藏列映射的 `source_sequence` 字段：

```sql
LOAD LABEL db1.label1
(
    DATA INFILE("hdfs://host:port/user/data/*/test.txt")
    INTO TABLE `tbl1`
    COLUMNS TERMINATED BY ","
    (k1,k2,source_sequence,v1,v2)
    ORDER BY source_sequence
)
WITH BROKER 'broker'
(
    "username"="user",
    "password"="pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

**Routine Load**

映射方式同上，示例如下：

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl 
    [WITH MERGE|APPEND|DELETE]
    COLUMNS(k1, k2, source_sequence, v1, v2),
    WHERE k1  100 and k2 like "%doris%"
    [ORDER BY source_sequence]
    PROPERTIES
    (
        "desired_concurrent_number"="3",
        "max_batch_interval" = "20",
        "max_batch_rows" = "300000",
        "max_batch_size" = "209715200",
        "strict_mode" = "false"
    )
    FROM KAFKA
    (
        "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
        "kafka_topic" = "my_topic",
        "kafka_partitions" = "0,1,2,3",
        "kafka_offsets" = "101,0,0,200"
    );
```

#### 4. 验证替换顺序保证

接续上文示例，再导入如下数据（Sequence 值均小于已有最大值 `2020-03-05`）：

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-02-23	b
```

查询结果：

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

由于本次导入的 Sequence 值均小于已有最大值 `2020-03-05`，因此结果保持不变。

继续导入更大 Sequence 值的数据：

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```

查询结果：

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-23  | w       |
+---------+------------+----------+-------------+---------+
```

由于新导入数据的 Sequence 值 `2020-03-23` 大于已有最大值 `2020-03-05`，原有数据被替换。

**结论**：在导入过程中，Doris 会比较所有批次的 Sequence 列值，**选择值最大的记录写入表中**。

### 使用注意事项

<!-- 知识类型: 注意事项 -->

1. **必须显式指定 Sequence 列**：在 Stream Load / Broker Load 等导入任务以及行更新 `INSERT` 语句中，用户必须显式指定 Sequence 列（除非 Sequence 列的默认值为 `CURRENT_TIMESTAMP`），否则会收到如下报错：

    ```Plain
    Table test_tbl has sequence column, need to specify the sequence column
    ```

2. **关闭 Sequence 列检查约束**：在表复制、内部数据迁移等场景下，可以通过 session 参数关闭对 `INSERT` 语句中 Sequence 列的强制检查：

    ```sql
    set require_sequence_in_insert = false;
    ```

3. **部分列更新的兼容**：自 2.0 版本起，Doris 对 Unique Key 表的 Merge-on-Write 实现支持了部分列更新能力。在部分列更新导入中，每次可以只更新一部分列，因此**并不强制包含 Sequence 列**：

    - 若导入任务包含 Sequence 列，行为不受影响；
    - 若导入任务不包含 Sequence 列，Doris 会使用匹配的历史数据中的 Sequence 列作为更新后该行的 Sequence 列值；
    - 若历史数据中不存在相同 Key 的记录，则会自动用 `null` 或默认值填充。

4. **并发导入下的正确性保证**：当出现并发导入时，Doris 会利用 MVCC 机制保证数据的正确性。如果两批数据导入都更新了同一 Key 的不同列，则系统版本较高的导入任务会在版本较低的导入任务成功后，使用版本较低的导入任务写入的相同 Key 的数据行重新进行补齐。
