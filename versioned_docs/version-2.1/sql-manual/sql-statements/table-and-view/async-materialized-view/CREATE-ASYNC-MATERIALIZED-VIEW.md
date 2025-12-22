---
{
    "title": "CREATE ASYNC MATERIALIZED VIEW",
    "language": "en",
    "description": "Statement for creating an asynchronous materialized view. The column names and types are derived from the materialized view SQL statement."
}
---

## Description

Statement for creating an asynchronous materialized view. The column names and types are derived from the materialized view SQL statement. Custom column names are allowed, but column types cannot be defined.

## Syntax


```sql
CREATE MATERIALIZED VIEW 
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ] 
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [<refresh_trigger>]]
    [ [DUPLICATE] KEY (<key_cols>) ]
    [ COMMENT '<table_comment>' ]
    [ PARTITION BY (
        { <partition_col> 
            | DATE_TRUNC(<partition_col>, <partition_unit>) }
        )]
    [ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
        [ BUCKETS { <bucket_count> | AUTO } ]
    ]               
    [ PROPERTIES (
          -- Table property
          <table_property>
          -- Additional table properties
          [ , ... ]) 
    ]
    AS <query>
```

Where:


```sql
columns_definition
  : -- Column definition
    <col_name> 
      [ COMMENT '<col_comment>' ]
refresh_trigger
  : ON MANUAL
  | ON SCHEDULE EVERY <int_value> <refresh_unit> [ STARTS '<start_time>']
  | ON COMMIT
```

## Required Parameters

**1. `<materialized_view_name>`**

> Specifies the identifier (i.e., name) of the materialized view; it must be unique within the database where the table is created.
>
> The identifier must start with a letter character (if Unicode name support is enabled, it can be any character from any language) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Object`).
>
> The identifier cannot be a reserved keyword.
>
> For more details, refer to the requirements for identifiers and reserved keywords.

**2. `<query>`**

> A required parameter when creating a materialized view. Specifies the SELECT statement that populates the data.

## Optional Parameters

**1. `<key_cols>`**

> The key columns of the table. In Doris, key columns must be the first K columns of the table. For more information on key restrictions and how to choose key columns, refer to the respective sections in the "Data Model" chapter.

**2. `<build_mode>`**

> Refresh timing: whether the materialized view should be refreshed immediately after creation.
>
> IMMEDIATE: Refresh immediately. Default is IMMEDIATE.
>
> DEFERRED: Delayed refresh.

**3. `<refresh_method>`**

> Refresh method:
>
> COMPLETE: Refresh all partitions.
>
> AUTO: Try to refresh incrementally, only refreshing partitions that have changed since the last materialized view refresh. If incremental refresh is not possible, all partitions will be refreshed.

:::caution Note
If a partitioned materialized view uses COMPLETE refresh mode, it will perform a full refresh of all partition data, effectively degenerating into a non-partitioned materialized view.
:::

**4. `<refresh_trigger>`**

> Trigger method:
>
> MANUAL: Manual refresh.
>
> ON SCHEDULE: Scheduled refresh.
>
> ON COMMIT: Triggered refresh, where changes to the base table data trigger a refresh of the materialized view.

**5. `<refresh_unit>`**

> The time unit for periodic refreshes. Currently supported units are MINUTE, HOUR, DAY, and WEEK.

**6. `<partition_col>`**

> If PARTITION BY is not specified, there will be only one partition by default.
>
> If a partition field is specified, it will automatically infer which base table the field comes from and synchronize the base table (currently supports internal tables and Hive tables). For internal tables, only one partition field is allowed.
>
> Materialized views can also reduce the number of partitions through partition roll-up. Currently, the partition roll-up function supports `date_trunc`.

**7. `<partition_unit>`**

> The aggregation granularity for partition roll-up. Currently supported units are HOUR, DAY, WEEK, QUARTER, MONTH, and YEAR.

**8. `<start_time>`**

> The scheduled start time must be in the future, i.e., later than the current time.

**9. `<table_property>`**

Properties used by internal tables, most of which can be used by materialized views, along with some properties specific to materialized views, as listed below:

| Property Name                    | Description                                                  |
| -------------------------------- | ------------------------------------------------------------ |
| grace_period                     | The maximum allowed delay in seconds for materialized view data during query rewriting. If partition A of the materialized view and the base table data are inconsistent, and the last refresh time of partition A was 10:15:00, with the current system time being 10:15:08, the partition will not be transparently rewritten. However, if `grace_period` is set to 10, the partition will be used for transparent rewriting. |
| excluded_trigger_tables          | Comma-separated table names to be ignored during data refresh. For example, `table1,table2`. |
| refresh_partition_num            | The number of partitions refreshed by a single INSERT statement, defaulting to 1. When refreshing a materialized view, it first calculates the list of partitions to be refreshed and then splits them into multiple INSERT statements for sequential execution. If an INSERT statement fails, the entire task will stop. The materialized view ensures the atomicity of a single INSERT statement, and a failed INSERT will not affect partitions that have already been refreshed successfully. |
| workload_group                   | The name of the `workload_group` used when the materialized view executes refresh tasks. This is used to limit the resources used by the materialized view during data refresh to avoid impacting other business operations. For more information on creating and using `workload_group`, refer to the [WORKLOAD-GROUP](https://doris.apache.org/zh-CN/docs/admin-manual/workload-group.md) documentation. |
| partition_sync_limit             | When the base table's partition field is of type time, this property can be used to configure the range of partitions to synchronize with the base table, in conjunction with `partition_sync_time_unit`. For example, setting it to 2 with `partition_sync_time_unit` set to `MONTH` means that only the partitions and data from the last 2 months of the base table will be synchronized. The minimum value is `1`. As time progresses, the materialized view will automatically add and remove partitions during each refresh. For example, if the materialized view currently has data for months 2 and 3, next month it will automatically remove the data for month 2 and add data for month 4. |
| partition_sync_time_unit         | The time unit for partition refresh, supporting DAY/MONTH/YEAR (default is DAY). |
| partition_date_format            | When the base table's partition field is of type string, if you want to use the `partition_sync_limit` capability, you can set the date format to parse the partition time according to the `partition_date_format` setting. |
| enable_nondeterministic_function | Whether the materialized view definition SQL is allowed to contain nondeterministic functions, such as current_date(), now(), random(), etc. If set to true, it allows the inclusion; otherwise, it does not. The default is not to allow. |
| use_for_rewrite                  | Indicates whether this materialized view participates in transparent rewriting. If set to false, it does not participate in transparent rewriting. The default is true. In data modeling scenarios, if the materialized view is only used for direct queries, this property can be set so that the materialized view does not participate in transparent rewriting, thereby improving query response speed. |

:::caution Note
The DISTRIBUTED BY clause is mandatory before Apache Doris 2.1.10 - omitting it will cause an error.
Since Apache Doris 2.1.10, if not specified, the default distribution becomes RANDOM.
:::

:::caution Note
Before Apache Doris 2.1.10/3.0.6, the excluded_trigger_tables property only supported specifying base table names.
Since these versions, it now supports fully qualified table names including Catalog and Database (e.g., internal.db1.table1).
:::

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege   | Object      | Notes                                                        |
| ----------- | ----------- | ------------------------------------------------------------ |
| CREATE_PRIV | Database    |                                                              |
| SELECT_PRIV | Table, View | Requires SELECT_PRIV permission on the tables or views queried in `<query>` |

## Notes

- Materialized view DML and DDL limitations:

  Materialized views do not support schema change operations such as modifying column types, adding, or deleting columns, as the columns are derived from the materialized view definition SQL.

  Materialized views do not support manual insert into or insert overwrite operations.

- Conditions for creating partitioned materialized views:

  > The SQL definition of the materialized view and the partition field must meet the following conditions to perform partitioned incremental updates:
  >
  > 1. At least one of the base tables used by the materialized view must be a partitioned table.
  > 2. The partitioned base table used by the materialized view must use a List or Range partitioning strategy.
  > 3. The materialized view definition SQL can only have one partition field in the Partition By clause.
  > 4. The partition field in the Partition By clause of the materialized view SQL must appear after the Select clause.
  > 5. If the materialized view definition SQL uses Group By, the partition field must appear after the Group By clause.
  > 6. If the materialized view definition SQL uses a Window function, the partition field must appear after the Partition By clause.
  > 7. Data changes should occur on the partitioned table; if they occur on a non-partitioned table, the materialized view requires a full build.
  > 8. If the materialized view uses a field from the NULL-generating side of a Join as a partition field, it cannot perform partitioned incremental updates. For example, for a LEFT OUTER JOIN, the partition field must be on the left side, not


## Examples
1. Non-Partitioned Materialized View

```sql

CREATE MATERIALIZED VIEW complete_mv (
orderdate COMMENT 'Order date',
orderkey COMMENT 'Order key',
partkey COMMENT 'Part key'
)
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
DISTRIBUTED BY HASH (orderkey) BUCKETS 2
PROPERTIES
("replication_num" = "1")
AS
SELECT
o_orderdate,
l_orderkey,
l_partkey
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey
and l_suppkey = ps_suppkey;
```

2. Partitioned Materialized View

As shown below, if a partition column is specified, the system automatically identifies which base table the column comes from and synchronizes the base table partitions. The base table is partitioned by day (partition column: o_orderdate, partition type: RANGE). The materialized view is partitioned by month, using the DATE_TRUNC function to roll up the base table partitions by month.
```sql
CREATE TABLE IF NOT EXISTS orders  (
o_orderkey       integer not null,
o_custkey        integer not null,
o_orderstatus    char(1) not null,
o_totalprice     decimalv3(15,2) not null,
o_orderdate      date not null,
o_orderpriority  char(15) not null,  
o_clerk          char(15) not null,
o_shippriority   integer not null,
o_comment        varchar(79) not null
)
DUPLICATE KEY(o_orderkey, o_custkey)
PARTITION BY RANGE(o_orderdate)(
FROM ('2023-10-16') TO ('2023-11-30') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
PROPERTIES (
"replication_num" = "3"
);
```

```sql
CREATE MATERIALIZED VIEW partition_mv
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
PARTITION BY (DATE_TRUNC(o_orderdate, 'MONTH'))
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2
PROPERTIES
("replication_num" = "3")
AS
SELECT
o_orderdate,
l_orderkey,
l_partkey
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey
and l_suppkey = ps_suppkey;
```

The following example cannot create a partitioned materialized view because the partition column uses a non-date_trunc function. The error message is: because column to check use invalid implicit expression, invalid expression is min(o_orderdate#4)

```sql
CREATE MATERIALIZED VIEW partition_mv_2
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
PARTITION BY (DATE_TRUNC(min_orderdate, 'MONTH'))
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2
PROPERTIES
("replication_num" = "3")
AS
SELECT
min(o_orderdate) AS min_orderdate,
l_orderkey,
l_partkey
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey
and l_suppkey = ps_suppkey
GROUP BY
o_orderdate,
l_orderkey,
l_partkey;
```

3. Modifying Materialized View Properties Use the ALTER MATERIALIZED VIEW statement.

For example:
```sql
ALTER MATERIALIZED VIEW partition_mv
SET (
"grace_period" = "10",
"excluded_trigger_tables" = "lineitem,partsupp"
);
```

4. Changing Materialized View Refresh Mode Use the ALTER MATERIALIZED VIEW statement.
   For example:

```sql
ALTER MATERIALIZED VIEW partition_mv REFRESH COMPLETE;
After running SHOW CREATE MATERIALIZED VIEW partition_mv;, you can see that the refresh mode has been changed to COMPLETE.
```
