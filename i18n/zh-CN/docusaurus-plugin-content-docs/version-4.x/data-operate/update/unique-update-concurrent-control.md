---
{
    "title": "主键模型的更新并发控制",
    "language": "zh-CN",
    "description": "Doris 采用多版本并发控制机制（MVCC - Multi-Version Concurrency Control）来管理并发更新。每次数据写入操作均会分配一个写入事务，该事务确保数据写入的原子性（即写入操作要么完全成功，要么完全失败）。在写入事务提交时，系统会为其分配一个版本号。"
}
---

## 概览

Doris 采用多版本并发控制机制（MVCC - Multi-Version Concurrency Control）来管理并发更新。每次数据写入操作均会分配一个写入事务，该事务确保数据写入的原子性（即写入操作要么完全成功，要么完全失败）。在写入事务提交时，系统会为其分配一个版本号。当用户使用 Unique Key 模型并多次导入数据时，如果存在重复主键，Doris 会根据版本号确定覆盖顺序：版本号较高的数据会覆盖版本号较低的数据。

在某些场景中，用户可能需要通过在建表语句中指定 sequence 列来灵活调整数据的生效顺序。例如，当通过多线程并发同步数据到 Doris 时，不同线程的数据可能会乱序到达。这种情况下，可能出现旧数据因较晚到达而错误覆盖新数据的情况。为解决这一问题，用户可以为旧数据指定较低的 sequence 值，为新数据指定较高的 sequence 值，从而让 Doris 根据用户提供的 sequence 值来正确确定数据的更新顺序。

此外，`UPDATE` 语句与通过导入实现更新在底层机制上存在较大差异。`UPDATE` 操作涉及两个步骤：从数据库中读取待更新的数据，以及写入更新后的数据。默认情况下，`UPDATE` 语句通过表级锁提供了 Serializable 隔离级别的事务能力，即多个 `UPDATE` 操作只能串行执行。用户也可以通过调整配置绕过这一限制，具体方法请参阅以下章节的详细说明。

## UPDATE 并发控制

默认情况下，并不允许同一时间对同一张表并发进行多个 `UPDATE` 操作。

主要原因是，Doris 目前支持的是行更新，这意味着，即使用户声明的是 `SET v2 = 1`，实际上，其他所有的 Value 列也会被覆盖一遍（尽管值没有变化）。

这就会存在一个问题，如果同时有两个 `UPDATE` 操作对同一行进行更新，那么其行为可能是不确定的，也就是可能存在脏数据。

但在实际应用中，如果用户自己可以保证即使并发更新，也不会同时对同一行进行操作的话，就可以手动打开并发限制。通过修改 FE 配置 `enable_concurrent_update`，当该配置值设置为 `true` 时，更新命令将不再提供事务保证。

## Sequence 列

Unique 模型主要针对需要唯一主键的场景，可以保证主键唯一性约束，在同一批次中导入或者不同批次中导入的数据，替换顺序不做保证。替换顺序无法保证则无法确定最终导入到表中的具体数据，存在了不确定性。

为了解决这个问题，Doris 支持了 sequence 列，通过用户在导入时指定 sequence 列，相同 key 列下，按照 sequence 列的值进行替换，较大值可以替换较小值，反之则无法替换。该方法将顺序的确定交给了用户，由用户控制替换顺序。

在实现层面，Doris 增加了一个隐藏列 **__DORIS_SEQUENCE_COL__** ，该列的类型由用户在建表时指定，在导入时确定该列具体值，并依据该值决定相同 Key 列下，哪一行生效。

:::caution 注意
sequence 列目前只支持 Unique 模型。
:::

### 启用 sequence column 支持

在新建表时如果设置了 `function_column.sequence_col` 或者 `function_column.sequence_type` ，则新建表将支持 sequence column。

对于一个不支持 sequence column 的表，如果想要使用该功能，可以使用如下语句： `ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")` 来启用。

如果不确定一个表是否支持 sequence column，可以通过设置一个 session variable 来显示隐藏列 `SET show_hidden_columns=true` ，之后使用 `desc tablename`，如果输出中有 `__DORIS_SEQUENCE_COL__` 列则支持，如果没有则不支持。

### 使用示例

下面以 Stream Load 为例展示使用方式：

**1. 创建支持 sequence col 的表**

创建 unique 模型的 test_table 数据表，并指定 sequence 列映射到表中的 modify_date 列。

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

sequence_col 用来指定 sequence 列到表中某一列的映射，该列可以为整型和时间类型（DATE、DATETIME），创建后不能更改该列的类型。

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

除了上述按照列映射的方式来指定 sequence 之外，Doris 还支持根据指定类型创建 sequence 列的语法，这种方式不要求建表时 schema 中必须有一列来做映射，下面是对应的语法：

```Plain
PROPERTIES (
    "function_column.sequence_type" = 'Date',
);
```

sequence_type 用来指定 sequence 列的类型，可以为整型和时间类型（DATE、DATETIME）。

**2. 导入数据：**

使用列映射的方式 (`function_column.sequence_col`) 来指定 sequence 列，不需要修改任何参数。下面我们用 Stream Load 导入如下数据：

```Plain
1	2020-02-22	1	2020-02-21	a
1	2020-02-22	1	2020-02-22	b
1	2020-02-22	1	2020-03-05	c
1	2020-02-22	1	2020-02-26	d
1	2020-02-22	1	2020-02-23	e
1	2020-02-22	1	2020-02-24	b
```

stream load 命令：

```shell
curl --location-trusted -u root: -T testData http://host:port/api/test/test_table/_stream_load
```

结果为

```sql
MySQL> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

在这次导入中，因 sequence column 的值（也就是 modify_date 中的值）中 '2020-03-05' 为最大值，所以 keyword 列中最终保留了 c。

如果建表时使用了 `function_column.sequence_col` 方式来指定 sequence 列，在导入时需要指定 sequence 列到其他列的映射。

**1. Stream Load**

Stream Load 的写法是在 header 中的 `function_column.sequence_col` 字段添加隐藏列对应的 source_sequence 的映射，示例如下：

```shell
curl --location-trusted -u root -H "columns: k1,k2,source_sequence,v1,v2" -H "function_column.sequence_col: source_sequence" -T testData http://host:port/api/testDb/testTbl/_stream_load
```

**2. Broker Load**

在 `ORDER BY` 处设置隐藏列映射的 source_sequence 字段

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

**3. Routine Load**

映射方式同上，示例如下

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

**3. 替换顺序的保证**

上述步骤完成后，接着导入如下数据

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-02-23	b
```

查询数据

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

在这次导入的数据中，会比较所有已导入数据的 sequence column (也就是 modify_date)，其中 '2020-03-05' 为最大值，所以 keyword 列中最终保留了 c。

**4. 再尝试导入如下数据**

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```

查询数据

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-23  | w       |
+---------+------------+----------+-------------+---------+
```

此时就可以替换表中原有的数据。综上，在导入过程中，会比较所有批次的 sequence 列值，选择值最大的记录导入 Doris 表中。

### 注意

1. 为防止误用，在 StreamLoad/BrokerLoad 等导入任务以及行更新 insert 语句中，用户必须显示指定 sequence 列 (除非 sequence 列的默认值为 CURRENT_TIMESTAMP)，不然会收到以下报错信息：

```Plain
Table test_tbl has sequence column, need to specify the sequence column
```

2. 在使用 Insert 语句插入数据时，由于用户必须显示指定 sequence 列，否则会报如上异常。为了方便用户在一些场景下（表复制，内部数据迁移等场景）使用，Doris 可以通过 session 参数控制，来关闭 sequence 列的检查约束：

```sql
set require_sequence_in_insert = false;
```

3. 自版本 2.0 起，Doris 对 Unique Key 表的 Merge-on-Write 实现支持了部分列更新能力，在部分列更新导入中，用户每次可以只更新一部分列，因此并不是必须要包含 sequence 列。若用户提交的导入任务中，包含 sequence 列，则行为无影响；若用户提交的导入任务不包含 sequence 列，Doris 会使用匹配的历史数据中的 sequence 列作为更新后该行的 sequence 列的值。如果历史数据中不存在相同 key 的列，则会自动用 null 或默认值填充。

4. 当出现并发导入时，Doris 会利用 MVCC 机制来保证数据的正确性。如果两批数据导入都更新了一个相同 key 的不同列，则其中系统版本较高的导入任务会在版本较低的导入任务成功后，使用版本较低的导入任务写入的相同 key 的数据行重新进行补齐。
