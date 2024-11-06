---
{
    "title": "Auto partitioning",
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


## Application scenario

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

## Syntax

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

## Example

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

## Conjunct with dynamic partitioning

In order to maintain a clear partitioning logic, Apache Doris prohibits the simultaneous use of auto partitioning and dynamic partitioning on a single table, as this usage can easily lead to misuse. It is recommended to replace this with the standalone Auto Partitioning feature.

:::info Note
In some early versions of Doris 2.1, this functionality was not prohibited but not recommended.
:::

## Key points

- Similar to regular partitioned tables, aoto LIST partitioning supports multi-column partitioning with no syntax differences. 
- If partitions are created during data insertion or import processes, and the entire import process is not completed (fails or is canceled), the created partitions will not be automatically deleted. 
- Tables using auto partitioning only differ in the method of partition creation, switching from manual to automatic. The original usage of the table and its created partitions remains the same as non-auto partitioning tables or partitions. 
- To prevent the accidental creation of too many partitions, Apache Doris controls the maximum number of partitions an auto partitioning table can accommodate through the `max_auto_partition_num setting` in the FE configuration. This value can be adjusted if needed.
- When importing data into a table with auto partitioning enabled, the coordinator sends data with a polling interval different from regular tables. Refer to `olap_table_sink_send_interval_auto_partition_factor`  in [BE Configuration](../admin-manual/config/be-config.md) for details. This setting does not have an impact after `enable_memtable_on_sink_node` is enabled. 
- During data insertion using `INSERT-OVERWRITE`, if a specific partition for override is specified, the auto partitioning table behaves like a regular table during this process and does not create new partitions. 
- If metadata operations are involved when importing and creating partitions, the import process may fail.
