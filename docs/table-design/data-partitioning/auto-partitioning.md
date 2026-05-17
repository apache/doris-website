---
{
    "title": "Auto Partitioning",
    "language": "en",
    "description": "Doris auto partitioning (AUTO PARTITION) creates RANGE or LIST partitions automatically based on partition column values during data ingestion, solving the problem of being unable to predefine partitions for discrete data or massive partition counts."
}
---

<!-- Knowledge type: Feature / Procedure -->
<!-- Use cases: Partitioned table design / Large-scale partition management / Data lifecycle management -->

Auto partitioning (AUTO PARTITION) is the ability of Doris to create partitions automatically during data ingestion based on the values of the partition column. It addresses the following problems:

- The partition column has scattered, hard-to-predict data, so the required partitions cannot be enumerated accurately at table creation time.
- The number of partitions is too large to create manually.
- The partition column is unrelated to system time, so dynamic partitioning cannot cover the case.

Doris supports two types of auto partitioning:

| Type | Partitioning method | Partition function | Supported partition column types |
| --- | --- | --- | --- |
| AUTO **RANGE** PARTITION | Auto partition by range | `date_trunc` | `DATE`, `DATETIME` |
| AUTO **LIST** PARTITION | Auto partition by enumerated value | Function calls not supported | `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `DATE`, `DATETIME`, `CHAR`, `VARCHAR` |

## Use Cases

Take a time-typed partition column as an example:

- With dynamic partitioning, Doris can automatically create new partitions on a fixed time cycle to hold real-time data. For scenarios such as real-time user-behavior logs, this feature generally meets the need.
- In more complex scenarios, however (for example, processing non-real-time data), the partition column has nothing to do with the current system time and contains many discrete values. You still want to partition by this column, but the involved partitions cannot be known in advance, or the number of required partitions is too large.

In these cases, neither dynamic partitioning nor manual partitioning meets the need, and auto partitioning covers such scenarios well.

### Example Scenario: Trade History Table

Suppose the business has a trade history table partitioned by trade date. With manual partitioning, the DDL is typically as follows:

```sql
CREATE TABLE `DAILY_TRADE_VALUE`
(
    `TRADE_DATE`              datev2 NOT NULL COMMENT 'Trade date',
    `TRADE_ID`                varchar(40) NOT NULL COMMENT 'Trade ID',
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

This approach has the following problems:

1. All partitions must be listed manually at table creation time.
2. When the value range of the partition column changes (for example, when 2022 data is added), partitions must be modified through [ALTER-TABLE-PARTITION](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PARTITION), which is cumbersome.
3. If you need to change partitions or use a finer granularity, the cost of modification is high.

Rewritten with AUTO PARTITION, the DDL can be simplified to:

```sql
CREATE TABLE `DAILY_TRADE_VALUE`
(
    `TRADE_DATE`              datev2 NOT NULL,
    `TRADE_ID`                varchar(40) NOT NULL,
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

The newly created table has no default partitions:

```sql
show partitions from `DAILY_TRADE_VALUE`;
Empty set (0.12 sec)
```

After data is inserted, the corresponding partitions are created automatically:

```sql
insert into `DAILY_TRADE_VALUE` values ('2012-12-13', 1), ('2008-02-03', 2), ('2014-11-11', 3);

show partitions from `DAILY_TRADE_VALUE`;
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
| PartitionId | PartitionName   | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
| 180060      | p20080101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2008-01-01]; ..types: [DATEV2]; keys: [2009-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
| 180039      | p20120101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2012-01-01]; ..types: [DATEV2]; keys: [2013-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
| 180018      | p20140101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2014-01-01]; ..types: [DATEV2]; keys: [2015-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
```

Partitions created by auto partitioning are functionally identical to partitions created manually.

## Syntax

Use the following syntax in the `partitions_definition` part of [CREATE-TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE).

### AUTO RANGE PARTITION

```sql
[AUTO] PARTITION BY RANGE(<partition_expr>)
<origin_partitions_definition>
```

Where:

```sql
partition_expr ::= date_trunc(<partition_column>, '<interval>')
```

:::tip
In AUTO RANGE PARTITION, the `AUTO` keyword can be omitted; the meaning of auto partitioning is preserved.
:::

Example:

```sql
CREATE TABLE `date_table` (
    `TIME_STAMP` datev2 NOT NULL
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

### AUTO LIST PARTITION

```sql
AUTO PARTITION BY LIST(`partition_col1` [, `partition_col2`, ...])
<origin_partitions_definition>
```

LIST auto partitioning supports multi-column partitioning, with the same syntax as a regular LIST partition: `AUTO PARTITION BY LIST(`col1`, `col2`, ...)`. For each value of the partition column that does not yet have a corresponding partition, an independent new partition is created.

Example:

```sql
CREATE TABLE `str_table` (
    `str` varchar not null
) ENGINE=OLAP
DUPLICATE KEY(`str`)
AUTO PARTITION BY LIST (`str`)
()
DISTRIBUTED BY HASH(`str`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Constraint Comparison

| Constraint | AUTO RANGE PARTITION | AUTO LIST PARTITION |
| --- | --- | --- |
| Supported partition functions | `date_trunc` only | Function calls not supported |
| Supported partition column types | `DATE`, `DATETIME` | `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `DATE`, `DATETIME`, `CHAR`, `VARCHAR` |
| Multi-column partitioning supported | No | Yes |
| Partition name length limit | - | Must not exceed 50 (derived from concatenation and escaping of partition column content; the actual allowed length may be shorter) |
| Partition value rule | Divided by the time range truncated by `date_trunc` | Each new enumerated value with no existing partition creates an independent new partition |

## NULL Value Partitioning

After enabling the session variable `allow_partition_column_nullable`, the two auto partitioning types differ in their support for NULLABLE columns:

| Auto partitioning type | NULLABLE partition column supported |
| --- | --- |
| AUTO LIST PARTITION | Supported. Writing NULL creates a NULL partition normally. |
| AUTO RANGE PARTITION | Not supported |

### AUTO LIST PARTITION: NULLABLE Column Supported

```sql
create table auto_null_list(
    k0 varchar null
)
auto partition by list (k0)
(
)
DISTRIBUTED BY HASH(`k0`) BUCKETS 1
properties("replication_num" = "1");

insert into auto_null_list values (null);

select * from auto_null_list;
+------+
| k0   |
+------+
| NULL |
+------+

select * from auto_null_list partition(pX);
+------+
| k0   |
+------+
| NULL |
+------+
```

### AUTO RANGE PARTITION: NULLABLE Column Not Supported

```sql
CREATE TABLE `range_table_nullable` (
    `k1` INT,
    `k2` DATETIMEV2(3),
    `k3` DATETIMEV2(6)
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
AUTO PARTITION BY RANGE (date_trunc(`k2`, 'day'))
()
DISTRIBUTED BY HASH(`k1`) BUCKETS 16
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

ERROR 1105 (HY000): errCode = 2, detailMessage = AUTO RANGE PARTITION doesn't support NULL column
```

## Lifecycle Management

:::info
Doris supports using auto partitioning together with dynamic partitioning to implement lifecycle management, but this combination is no longer recommended.
:::

AUTO RANGE PARTITION tables support managing the lifecycle of historical partitions through the `partition.retention_count` property. This property accepts a positive integer `N`, meaning **only the `N` historical partitions with the largest partition values are retained**; current and future partitions are all retained.

### Concept Definitions

- **Historical partition**: A partition whose upper bound is less than or equal to the current time.
- **Current and future partition**: A partition whose lower bound is greater than or equal to the current time.
- **Partition value comparison**: Because RANGE partitions never overlap, "the value of partition A is greater than that of partition B" is equivalent to "the lower bound of partition A is greater than the upper bound of partition B", which is also equivalent to "the upper bound of partition A is greater than the upper bound of partition B".

### Example

```sql
create table auto_recycle(
    k0 datetime(6) not null
)
AUTO PARTITION BY RANGE (date_trunc(k0, 'day')) ()
DISTRIBUTED BY HASH(`k0`) BUCKETS 1
properties(
    "partition.retention_count" = "3"
);
```

This configuration means that only the 3 historical partitions with the largest date values are retained. Suppose the current date is `2025-10-21` and data is inserted for each day from `2025-10-16` to `2025-10-23`. After one round of recycling, 6 partitions remain, as shown below:

![Recycle](/images/blogs/auto-partition-lifetime1.png)

The remaining partition list:

- p20251018000000
- p20251019000000
- p20251020000000 (this partition and above: only three historical partitions are retained)
- p20251021000000 (this partition and below: current and future partitions are unaffected)
- p20251022000000
- p20251023000000

## Used Together with Auto Bucketing

Only AUTO RANGE PARTITION can be used together with the [auto bucketing](./data-bucketing.md#auto-set-bucket-number) feature.

When using this combination, Doris assumes that data is loaded into the table incrementally in time order, and that each load involves only one partition. Therefore, **this combination is recommended only for tables loaded incrementally in batches**.

:::warning Note
If the data load pattern does not follow the above paradigm and both auto partitioning and auto bucketing are used, the bucket number of new partitions may be highly unreasonable, which can significantly affect query performance.
:::

## Partition Management

After enabling auto partitioning, you can locate partitions precisely with the following two tools:

- The `auto_partition_name` function: Maps a partition column value to a partition name.
- The `partitions` table function: Retrieves partition details by partition name.

Continuing with the `DAILY_TRADE_VALUE` table, after data is inserted, query the partition that a specific record belongs to:

```sql
select * from partitions("catalog"="internal","database"="optest","table"="DAILY_TRADE_VALUE") where PartitionName = auto_partition_name('range', 'year', '2008-02-03');
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName   | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
|      127095 | p20080101000000 |              2 | 2024-11-14 17:29:02 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2008-01-01]; ..types: [DATEV2]; keys: [2009-01-01]; ) | TRADE_DATE      |      10 |              1 | HDD           | 9999-12-31 23:59:59 |                     | \N                       | 985.000 B |          0 | tag.location.default: 1 |         1 |                  1 | \N           |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

This approach lets you precisely select the ID and value of each partition for follow-up partition-specific operations (for example, `insert overwrite partition`).

Detailed syntax:

- [auto_partition_name function reference](../../sql-manual/sql-functions/scalar-functions/string-functions/auto-partition-name)
- [partitions table function reference](../../sql-manual/sql-functions/table-valued-functions/partitions)

## Notes

| Note | Description |
| --- | --- |
| Multi-column partitioning support | AUTO LIST PARTITION supports multi-column partitioning, with the same syntax as a regular LIST partition. |
| Partitions from failed loads are not cleaned up automatically | If partitions are created during a data insert or load but the entire load does not complete (fails or is canceled), the created partitions are not deleted automatically. |
| Same usage as regular partitions | For a table that uses AUTO PARTITION, only the way partitions are created changes from manual to automatic. All other usage of the table and its partitions is the same as for non-AUTO PARTITION tables. |
| Maximum partition count limit | The maximum number of partitions per table is controlled by `max_auto_partition_num` in [FE configuration](../../admin-manual/config/fe-config). Adjust this as needed to avoid accidentally creating too many partitions. |
| Data send polling interval | When loading data into an AUTO PARTITION table, the polling interval at which the Coordinator sends data differs from that of regular tables. It is controlled by `olap_table_sink_send_interval_auto_partition_factor` in [BE configuration](../../admin-manual/config/be-config). After enabling sink-node memtable (`enable_memtable_on_sink_node = true`), this variable does not take effect. |
| INSERT OVERWRITE behavior | For the specific behavior of an AUTO PARTITION table when using [insert-overwrite](../../sql-manual/sql-statements/data-modification/DML/INSERT-OVERWRITE) to insert data, see the INSERT OVERWRITE documentation. |
| Metadata conflicts may cause load failures | When a load creates partitions, if the table is undergoing other metadata operations (such as Schema Change or Rebalance), the load may fail. |
