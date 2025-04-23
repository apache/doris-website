---
{
    "title": "CREATE TABLE",
    "language": "en",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4
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


## Description

Create a new table in the current or specified database. A table can have multiple columns, and each column definition includes the name, data type, and optionally the following attributes:

- Whether it is a key
- Whether it has aggregation semantics
- Whether it is a generated column
- Whether it requires a value (NOT NULL)
- Whether it is an auto-increment column
- Whether there is a default value upon insertion
- Whether there is a default value upon update

Furthermore, this command also supports the following variations:

- CREATE TABLE … AS SELECT (to create a table pre-populated with data; also known as CTAS)
- CREATE TABLE … LIKE (to create an empty copy of an existing table)

## Syntax

```sql
CREATE [ EXTERNAL ] TABLE [ IF NOT EXISTS ] <table_name>
    (<columns_definition> [ <indexes_definition> ])
    [ ENGINE = <table_engine_type> ]
    [ <key_type> KEY (<key_cols>)
        [ CLUSTER BY (<cluster_cols>) ]
    ]
    [ COMMENT '<table_comment>' ]
    [ <partitions_definition> ]
    [ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
        [ BUCKETS { <bucket_count> | AUTO } ]
    ]
    [ <roll_up_definition> ]
    [ PROPERTIES (
          -- Table property
          <table_property>
          -- Additional table properties
          [ , ... ]) 
    ]
```

Where:

```sql
columns_definition
  : -- Column definition
    <col_name> <col_type>
      [ KEY ]
      [ <col_aggregate_type> ]
      [ [ GENERATED ALWAYS ] AS (<col_generate_expression>) ]
      [ [NOT] NULL ]
      [ AUTO_INCREMENT(<col_auto_increment_start_value>) ]
      [ DEFAULT <col_default_value> ]
      [ ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>) ]
      [ COMMENT '<col_comment>' ]
    -- Additional column definitions
    [ , <col_name> <col_type> [ ... ] ]
```

```sql    
indexes_definition
  : -- Index definition
    INDEX [ IF NOT EXISTS ]
      <index_name> (<index_cols>)
      [ USING <index_type> ]
      [ PROPERTIES (
            -- Table property
            <index_property>
            -- Additional table properties
            [ , ... ]) 
      ]
      [ COMMENT '<index_comment>' ]
    -- Additional index definitions
    [ , <index_name> (<index_cols>) [ ... ] ]
```

```sql
partitions_definition
  : AUTO PARTITION BY RANGE(
      <auto_partition_function>(<auto_partition_arguments>))
      ()
  | PARTITION BY <partition_type>
    (<partition_cols>)
    (
        -- Partition definition
        <one_partition_definition>
        -- Additional partition definition
        [ , ... ]
    )
```

- Where <one_partition_definition>:

    ```sql
    <one_partition_definition>
    : PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES LESS THAN <partition_value_list>
    | PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES [ <partition_lower_bound>, <partition_upper_bound>)
    | FROM <partition_lower_bound> TO <partition_upper_bound>
        INTERVAL <n> [ <datetime_unit> ]
    | PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES IN {
            (<partition_value> [, <partition_value> [ ... ] ])
            | <partition_value>
        }
    ```

```sql      
roll_up_definition
  : ROLLUP (
        -- Rollup definition
        <rollup_name> (<rollup_cols>)
        [ DUPLICATE KEY (<duplicate_cols>) ]
        -- Additional rollup definition
        [ , <rollup_name> (<rollup_cols>) [ ... ] ]
    )
```

## Varaint Syntax

### CREATE TABLE ... AS SELECT (Also Referred to as CTAS)

Generates a table and populates it with data returned from the `query`:

```sql
CREATE
    [ EXTERNAL ]
    TABLE [ IF NOT EXISTS ] <table_name>
    [ ( <column_definitions> ) ]
    [ <index_definitions> ]
    [ ENGINE = <storage_engine_type> ]
    [ <partitioning_key_type> KEY ( <key_columns> )
        [ CLUSTER BY ( <clustering_columns> ) ]
    ]
    [ COMMENT '<table_description>' ]
    [ <partition_definitions> ]
    [ DISTRIBUTED BY { HASH ( <distribution_columns> ) | RANDOM }
        [ BUCKETS { <number_of_buckets> | AUTO } ]
    ]
    [ <rollup_definitions> ]
    [ PROPERTIES (
          "<table_properties>"
          [ , ... ] 
    ) ]
AS <query>;
```

### CREATE TABLE ... LIKE

Creates a new table with the same column definitions as an existing table, without copying data from the existing table. All properties of the columns will be replicated in the new table. If a list of `rollup` names is specified, the corresponding `rollup` from the original table will also be replicated:

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```

## Required Parameters

**<name>**

> Specifies the identifier (i.e., name) of the table; it must be unique within the database where the table is created.
>
> The identifier must start with a letter (any language character if Unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., ``My Object``).
>
> Identifiers cannot use reserved keywords.
>
> For more details, see [Identifier Requirements](../../../basic-element/object-identifiers.md) and [Reserved Keywords](../../../basic-element/reserved-keywords.md).

**<col_name>**

> Specifies the column identifier (i.e., name). It must be unique within the created table.
>
> The identifier must start with a letter (any language character if Unicode name support is enabled), a digit, or the symbol `@`, and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., ``My Object``).
>
> For more details, see [Identifier Requirements](../../../basic-element/object-identifiers.md) and [Reserved Keywords](../../../basic-element/reserved-keywords.md).

**<col_type>**

> Specifies the data type of the column.
>
> For details on the data types that can be specified for table columns, see the [Data Types](../../../basic-element/sql-data-types/data-type-overview.md) section.

**<query>**

> A required parameter in CTAS. Specifies the SELECT statement that populates the data.

**<source_table>**

> A required parameter in CREATE TABLE ... LIKE. Specifies the original table to be copied.

## Optional Parameters

### Data Model Related Parameters

**<key_type>**

> The data model of the table. Optional values are DUPLICATE (detail model), UNIQUE (primary key model), AGGREGATE (aggregation model). For details on data models, see the [Data Model](../../../../table-design/data-model/overview.md) section.

**<key_cols>**

> The key columns of the table. In Doris, Key columns must be the first K columns of the table. Data in a single tablet will be kept in order by these columns. For restrictions on Keys and how to choose Key columns, see the various subsections in the [Data Model](../../../../table-design/data-model/overview.md) section.

**<cluster_cols>**

> Data local sort columns, can only be used when the data model is UNIQUE (primary key model). When `<cluster_cols>` is specified, data is sorted by `<cluster_cols>` instead of using `<key_cols>`.

**<col_aggregate_type>**

> The aggregation method of the column. Can only be used when the table is an aggregation model. For details on aggregation methods, see the [Aggregation Model](../../../../table-design/data-model/aggregate.md) section.

### Bucketing Related Parameters

**<distribute_cols> and <bucket_count>**

> Bucketing columns and bucket counts. Detail model bucket columns can be any columns, aggregation model and primary key model bucket columns must be consistent with key columns. Bucket count is any positive integer. For details on bucketing, see the [Manual Bucketing](../../../../table-design/data-partitioning/data-bucketing#manual-setting-bucket-count) and [Automatic Bucketing](../../../../table-design/data-partitioning/data-bucketing#automatic-setting-bucket-count) sections.

### Column Default Value Related Parameters

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> Generated column. Uses the columns before the current column to generate data for the current column through the expression `<col_generate_expression>`. A generated column is a special type of database table column whose value is calculated from the values of other columns, rather than being directly inserted or updated by the user. This feature supports pre-calculating the results of expressions and storing them in the database, suitable for scenarios that require frequent querying or complex calculations.

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> When importing data, Doris will assign a unique value within the table to rows of data in the auto-increment column that do not specify a value. `<col_auto_increment_start_value>` specifies the starting value for the auto-increment column. For more details on auto-increment columns, see the [Auto-Increment Columns](../../../../table-design/auto-increment.md) section.

**DEFAULT <col_default_value>**

> The default value for the column. When writing without including this column, this default value is used. If the default value is not explicitly set, NULL is used. Available default values include:
>
> - NULL: Available for all types, using NULL as the default value.
> - Numeric literals: Can only be used for numeric types.
> - String literals: Can only be used for string types.
> - CURRENT_DATE: Can only be used for date types. Uses the current date as the default value.
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]: Can only be used for datetime types. Uses the current timestamp as the default value. `<defaultValuePrecision>` can specify the time precision.
> - PI: Can only be used for double types. Uses pi as the default value.
> - E: Can only be used for double types. Uses the mathematical constant e as the default value.
> - BITMAP_EMPTY: Can only be used when the column is of bitmap type. Fills an empty bitmap.

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> When data is updated, if no value is specified for this column, the current timestamp is used to update the data in this column. Can only be used on tables with a UNIQUE (primary key model).

### Index Related Parameters

**<index_name>**

> Specifies the index identifier (i.e., name). It must be unique within the created table. For more details on identifiers, see [Identifier Requirements](../../../basic-element/object-identifiers.md) and [Reserved Keywords](../../../basic-element/reserved-keywords.md).

**<index_cols>**

> A list of columns to add an index to. Must be existing columns in the table.

**<index_type>**

> The type of index. Currently, only INVERTED is supported.

**<index_property>**

> The properties of the index. For detailed explanations, refer to the [Inverted Index](../../../../table-design/index/inverted-index.md) section.

### Automatic Partitioning Related Parameters

For a detailed introduction to partitioning, see the [Automatic Partitioning](../../../../table-design/data-partitioning/auto-partitioning.md) section.

**<auto_partition_function>(<auto_partition_arguments>)**

> The method of automatic partitioning. `<auto_partition_function>` currently only supports `date_trunc`. `<auto_partition_arguments>` specifies the column for automatic partitioning and the unit of `date_trunc`. For example, `date_trunc(col_1, 'day')`.
>
> When using automatic partitioning, the partition column must be NOT NULL.

### Manual Partitioning Related Parameters

For a detailed introduction to partitioning, see the "Manual Partitioning" section.

**<partition_type>**

> Doris supports RANGE partitioning and LIST partitioning. For details, see the [Manual Partitioning](../../../../table-design/data-partitioning/manual-partitioning.md) section.

**<partition_name>**

> The partition identifier (i.e., name). It must be unique within the created table. For more details on identifiers, see [Identifier Requirements](../../../basic-element/object-identifiers.md) and [Reserved Keywords](../../../basic-element/reserved-keywords.md).

**VALUES LESS THAN <partition_value_list>**

> RANGE partitioning. The partition data range is from the lower bound to `<partition_value_list>`.
>
> If it represents the upper bound, `<partition_value_list>` can be simplified to `MAX_VALUE`.
>
> The format of `<partition_value_list>` is as follows: `((col_1_value, ...), (col_1_value, ...), ...)`

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> RANGE partitioning. The partition data range is from `<partition_lower_bound>` to `<partition_upper_bound>`. Only one partition is created.
>
> The format of `<partition_lower_bound>` and `<partition_upper_bound>` is as follows: `(col_1_value, ...)`

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> RANGE partitioning. The partition data range is from `<partition_lower_bound>` to `<partition_value_list>`. A partition is created every `<n>`.
>
> The format of `<partition_lower_bound>` and `<partition_upper_bound>` is as follows: `(col_1_value, ...)`

**VALUES IN {**

​          **(<partition_value> [, <partition_value> [ ... ] ])**

​          **| <partition_value>**

​      **}**

> LIST partitioning. Rows where the partition column equals `<partition_value>` belong to this partition.
>
> The format of `<partition_value>` is as follows: `(col_1_value, ...)`


### Synchronized Materialized View Related

:::caution Note
The functionality of creating synchronized materialized views with rollup is limited and no longer recommended. It is advised to use separate statements to create synchronized materialized views. For details, please refer to the [CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md) statement and the [Synchronized Materialized View](../../../../query-acceleration/materialized-view/sync-materialized-view.md) section.
:::

**<rollup_name>**

> The identifier (i.e., name) of the synchronized materialized view. It must be unique within the created table. For more details on identifiers, see [Identifier Requirements](../../../basic-element/object-identifiers.md) and [Reserved Keywords](../../../basic-element/reserved-keywords.md).

**<rollup_cols>**

> The columns included in the synchronized materialized view.

### Table Property Related Parameters

**<table_property>**

| Property Name | Function |
| :------------ | :-------- |
| replication_num | The number of replicas. The default number of replicas is 3. If the number of BE nodes is less than 3, you must specify a number of replicas less than or equal to the number of BE nodes. After version 0.15, this property will automatically convert to the `replication_allocation` property, e.g., `"replication_num" = "3"` will automatically convert to `"replication_allocation" = "tag.location.default:3"`. |
| replication_allocation | Sets the distribution of replicas based on Tags. This property can completely override the functionality of the `replication_num` property. |
| min_load_replica_num | Sets the minimum number of replicas required for a successful data import, with a default value of -1. When this property is less than or equal to 0, it indicates that the majority of replicas must still succeed for the data import. |
| is_being_synced | Used to identify whether this table is being replicated by CCR and is currently being synchronized by the syncer, with a default value of `false`. If set to `true`, the `colocate_with` and `storage_policy` properties will be cleared. The `dynamic partition and` `auto bucket` features will become ineffective. That is, they will appear enabled in `show create table` but will not actually take effect. When `is_being_synced` is set to `false`, these features will resume. This property is for use only by the CCR peripheral module and should not be manually set during the CCR synchronization process. |
| storage_medium | Declares the initial storage medium for table data. |
| storage_cooldown_time | Sets the expiration time for the initial storage medium of the table data. After this time, it will automatically downgrade to the first-level storage medium. |
| colocate_with | When the Colocation Join feature is needed, use this parameter to set the Colocation Group. |
| bloom_filter_columns | A list of column names specified by the user that require the addition of a Bloom Filter index. Each column's Bloom Filter index is independent and not a composite index. For example: `"bloom_filter_columns" = "k1, k2, k3"` |
| compression | The default compression method for Doris tables is LZ4. After version 1.1, support for specifying ZSTD as the compression method is available for higher compression ratios. |
| function_column.sequence_col | When using the Unique Key model, you can specify a Sequence column. When Key columns are the same, REPLACE will be performed according to the Sequence column (the larger value replaces the smaller value; otherwise, it cannot be replaced). `function_column.sequence_col` is used to map the sequence column to a specific column in the table, which can be of integer or date/time types (DATE, DATETIME). The type of this column cannot be changed after creation. If `function_column.sequence_col` is set, `function_column.sequence_type` will be ignored. |
| function_column.sequence_type | When using the Unique Key model, you can specify a Sequence column. When Key columns are the same, REPLACE will be performed according to the Sequence column (the larger value replaces the smaller value; otherwise, it cannot be replaced). Here, you only need to specify the type of the sequence column, which supports date/time types or integers. Doris will create a hidden sequence column. |
| enable_unique_key_merge_on_write | Whether the Unique table uses the Merge-on-Write implementation. This property was default disabled before version 2.1 and default enabled from version 2.1 onwards. |
| light_schema_change | Whether to use the Light Schema Change optimization. If set to `true`, addition and subtraction operations on value columns can be completed faster and synchronously. This feature is enabled by default in versions 2.0.0 and later. |
| disable_auto_compaction | Whether to disable automatic compaction for this table. If this property is set to `true`, the background automatic compaction process will skip all tablets of this table. |
| enable_single_replica_compaction | Whether to enable single-replica compaction for this table. If this property is set to `true`, only one replica of all replicas of the table's tablets will perform the actual compaction action, and other replicas will pull the compacted rowset from that replica. |
| enable_duplicate_without_keys_by_default | When set to `true`, if no Unique, Aggregate, or Duplicate is specified when creating a table, a Duplicate model table without sort columns and prefix indexes will be created by default. |
| skip_write_index_on_load | Whether to enable not writing indexes during data import for this table. If this property is set to `true`, indexes will not be written during data import (currently only effective for inverted indexes), but will be delayed until compaction. This can avoid the CPU and IO resource consumption of writing indexes repeatedly during the first write and compaction, improving the performance of high-throughput imports. |
| compaction_policy | Configures the compaction merge policy for this table, supporting only time_series or size_basedtime_series: When the disk volume of rowsets accumulates to a certain size, version merging is performed. The merged rowset is directly promoted to the base compaction phase. This effectively reduces the write amplification of compact in scenarios with continuous imports. This policy will use parameters prefixed with time_series_compaction to adjust the execution of compaction. |
| time_series_compaction_goal_size_mbytes | When the compaction merge policy is time_series, this parameter is used to adjust the size of the input files for each compaction, with the output file size being comparable to the input. |
| time_series_compaction_file_count_threshold | When the compaction merge policy is time_series, this parameter is used to adjust the minimum number of input files for each compaction. If the number of files in a tablet exceeds this configuration, compaction will be triggered. |
| time_series_compaction_time_threshold_seconds | When the compaction merge policy is time_series, this parameter is used to adjust the longest interval between compactions, i.e., a compaction will be triggered if it has not been executed for a long time, in seconds. |
| time_series_compaction_level_threshold | When the compaction merge policy is time_series, this parameter defaults to 1. When set to 2, it is used to control that segments merged once are merged again to ensure that the segment size reaches time_series_compaction_goal_size_mbytes, achieving the effect of reducing the number of segments. |
| group_commit_interval_ms | Configures the Group Commit batch interval for this table. The unit is ms, with a default value of 10000ms, i.e., 10s. The timing of Group Commit depends on which of `group_commit_interval_ms` and `group_commit_data_bytes` reaches the set value first. |
| group_commit_data_bytes | Configures the Group Commit batch data size for this table. The unit is bytes, with a default value of 134217728, i.e., 128MB. The timing of Group Commit depends on which of `group_commit_interval_ms` and `group_commit_data_bytes` reaches the set value first. |
| enable_mow_light_delete | Whether to enable writing Delete predicate with Delete statements on Unique tables with Mow. If enabled, it will improve the performance of Delete statements, but partial column updates after Delete may result in some data errors. If disabled, it will reduce the performance of Delete statements to ensure correctness. The default value of this property is `false`. This property can only be enabled on Unique Merge-on-Write tables. |
| Dynamic Partitioning Related Properties | For dynamic partitioning, refer to [Data Partitioning - Dynamic Partitioning](../../../../table-design/data-partitioning/dynamic-partitioning) |


## Access Control Requirements

The [user](../../../../admin-manual/auth/authentication-and-authorization.md) executing this SQL command must have at least the following [privileges](../../../../admin-manual/auth/authentication-and-authorization.md):

| Privilege | Object | Description |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | Database | |
| SELECT_PRIV | Table, View | Required when executing CTAS to have SELECT_PRIV on the queried table, view, or materialized view |

## Usage Notes

- The database (Database) must not contain tables (Table) or views (View) with the same name.
- Table names, column names, and rollup names must not use [Reserved Keywords](../../../basic-element/reserved-keywords.md).
- CREATE TABLE ... LIKE:
  - This command can only be used on internal Doris tables.
  - Only explicitly specified rollups will be copied.
  - All synchronized materialized views will not be replicated.
- CREATE TABLE ... AS SELECT (CTAS):
  - If the alias of the column name in the SELECT list is a valid column, then column definitions are not required in the CTAS statement; if omitted, column names and data types will be inferred from the base query:
      
    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
  - Alternatively, you can explicitly specify names using the following syntax:
    
    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```

- Partitioning and Bucketing
  - A table must specify bucketing columns but can opt out of specifying partitions. For detailed information on partitioning and bucketing, refer to the [Data Partitioning](../../../../table-design/data-partition) documentation.
  - Tables in Doris can be either partitioned or non-partitioned. This attribute is determined at table creation and cannot be changed afterward. That is, for partitioned tables, partitions can be added or removed in subsequent use, while non-partitioned tables cannot have partitions added later.
  - Partition and bucket columns cannot be altered after table creation; neither the types of partition and bucket columns can be changed nor can these columns be added or removed.
- Dynamic Partitioning
  - The dynamic partitioning feature is primarily used to help users manage partitions automatically. By setting certain rules, the Doris system periodically adds new partitions or removes old ones. For more assistance, refer to the [Dynamic Partitioning](../../../../table-design/data-partitioning/dynamic-partitioning.md) documentation.
- Automatic Partitioning
  - Documentation for automatic partitioning can be found in [Automatic Partitioning](../../../../table-design/data-partitioning/auto-partitioning.md).
- Synchronized Materialized Views
  - Users can create multiple synchronized materialized views (ROLLUP) while creating a table. Synchronized materialized views can also be added after the table is created. Including them in the table creation statement facilitates the one-time creation of all synchronized materialized views.
  - If synchronized materialized views are created at the time of table creation, all subsequent data import operations will synchronously generate data for the materialized views. The number of materialized views may affect the efficiency of data import.
  - For an introduction to materialized views, please refer to the documentation on [Synchronized Materialized Views](../../../../query-acceleration/materialized-view/sync-materialized-view.md).
- Indexes
  - Users can create multiple column indexes while creating a table. Indexes can also be added after the table is created.
  - If indexes are added during subsequent use and there is existing data in the table, all data will need to be rewritten; hence, the time to create an index depends on the current volume of data.


## Examples

### Basic Examples

**Detail Model**

```sql
CREATE TABLE t1
(
  c1 INT,
  c2 STRING
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**Aggregation Model**

```sql
CREATE TABLE t2
(
  c1 INT,
  c2 INT MAX
)
AGGREGATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**Primary Key Model**

```sql
CREATE TABLE t3
(
  c1 INT,
  c2 INT
)
UNIQUE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**Using Generated Columns**

```sql
CREATE TABLE t4
(
  c1 INT,
  c2 INT GENERATED ALWAYS AS (c1 + 1)
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**Specifying Column Default Values**

```sql
CREATE TABLE t5
(
  c1 INT,
  c2 INT DEFAULT 10
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**Bucketing Method**

```sql
CREATE TABLE t6
(
  c1 INT,
  c2 INT
)
DUPLICATE KEY(c1)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```

**Automatic Partitioning**

```sql
CREATE TABLE t7
(
  c1 INT,
  c2 DATETIME NOT NULL
)
DUPLICATE KEY(c1)
AUTO PARTITION BY RANGE(date_trunc(c2, 'day')) ()
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```

**Range Partitioning**

```sql
CREATE TABLE t8
(
  c1 INT,
  c2 DATETIME NOT NULL
)
DUPLICATE KEY(c1)
PARTITION BY RANGE(c2) (
  FROM ('2020-01-01') TO ('2020-01-10') INTERVAL 1 DAY
)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```

**List Partitioning**

```sql
CREATE TABLE t9
(
  c1 INT,
  c2 DATE NOT NULL
)
DUPLICATE KEY(c1)
PARTITION BY LIST(c2) (
  PARTITION p1 VALUES IN (('2020-01-01'),('2020-01-02'))
)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```

**Storage Medium and Cooldown Time**

```sql
CREATE TABLE example_db.table_hash
(
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048),
    v2 SMALLINT DEFAULT "10"
)
UNIQUE KEY(k1, k2)
DISTRIBUTED BY HASH (k1, k2) BUCKETS 32
PROPERTIES(
    "storage_medium" = "SSD",
    "storage_cooldown_time" = "2015-06-04 00:00:00"
);
```

**Setting Table's Cold-Hot Tiered Data Migration Strategy with `storage_policy` Property**

1. You need to create an s3 resource and storage policy first for the table to successfully associate with the migration strategy.

    ```sql
    -- Non-partitioned table
    CREATE TABLE IF NOT EXISTS create_table_use_created_policy 
    (
        k1 BIGINT,
        k2 LARGEINT,
        v1 VARCHAR(2048)
    )
    UNIQUE KEY(k1)
    DISTRIBUTED BY HASH (k1) BUCKETS 3
    PROPERTIES(
        "storage_policy" = "test_create_table_use_policy",
        "replication_num" = "1"
    );

    -- Partitioned table
    CREATE TABLE create_table_partion_use_created_policy
    (
        k1 DATE,
        k2 INT,
        V1 VARCHAR(2048) REPLACE
    ) PARTITION BY RANGE (k1) (
        PARTITION p1 VALUES LESS THAN ("2022-01-01") ("storage_policy" = "test_create_table_partition_use_policy_1" ,"replication_num"="1"),
        PARTITION p2 VALUES LESS THAN ("2022-02-01") ("storage_policy" = "test_create_table_partition_use_policy_2" ,"replication_num"="1")
    ) DISTRIBUTED BY HASH(k2) BUCKETS 1;
    ```

**Colocation Group**

```sql
CREATE TABLE t1 (
    id int(11) COMMENT "",
    value varchar(8) COMMENT ""
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "colocate_with" = "group1"
);

CREATE TABLE t2 (
    id int(11) COMMENT "",
    value1 varchar(8) COMMENT "",
    value2 varchar(8) COMMENT ""
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "colocate_with" = "group1"
);
```

**Index**

```sql
CREATE TABLE example_db.table_hash
(
    k1 TINYINT,
    k2 DECIMAL(10, 2) DEFAULT "10.5",
    v1 CHAR(10) REPLACE,
    v2 INT SUM,
    INDEX k1_idx (k1) USING INVERTED COMMENT 'my first index'
)
AGGREGATE KEY(k1, k2)
DISTRIBUTED BY HASH(k1) BUCKETS 32
PROPERTIES (
    "bloom_filter_columns" = "k2"
);
```

**Setting Table's Replication Properties**

```sql
CREATE TABLE example_db.table_hash
(
    k1 TINYINT,
    k2 DECIMAL(10, 2) DEFAULT "10.5"
)
DISTRIBUTED BY HASH(k1) BUCKETS 32
PROPERTIES (
    "replication_allocation"="tag.location.group_a:1, tag.location.group_b:2"
);
```

**Dynamic Partitioning**

This table creates partitions 3 days in advance and deletes partitions from 3 days ago. For example, if today is `2020-01-08`, it will create partitions named `p20200108`, `p20200109`, `p20200110`, `p20200111`. The partition ranges are as follows:

```Plain
[types: [DATE]; keys: [2020-01-08]; ‥types: [DATE]; keys: [2020-01-09]; )
[types: [DATE]; keys: [2020-01-09]; ‥types: [DATE]; keys: [2020-01-10]; )
[types: [DATE]; keys: [2020-01-10]; ‥types: [DATE]; keys: [2020-01-11]; )
[types: [DATE]; keys: [2020-01-11]; ‥types: [DATE]; keys: [2020-01-12]; )
CREATE TABLE example_db.dynamic_partition
(
    k1 DATE,
    k2 INT,
    k3 SMALLINT,
    v1 VARCHAR(2048),
    v2 DATETIME DEFAULT "2014-02-04 15:36:00"
)
DUPLICATE KEY(k1, k2, k3)
PARTITION BY RANGE (k1) ()
DISTRIBUTED BY HASH(k2) BUCKETS 32
PROPERTIES(
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-3",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32" 
);
```

**Setting Dynamic Partition's Replication Properties**

```sql
CREATE TABLE example_db.dynamic_partition
(
    k1 DATE,
    k2 INT,
    k3 SMALLINT,
    v1 VARCHAR(2048),
    v2 DATETIME DEFAULT "2014-02-04 15:36:00"
)
PARTITION BY RANGE (k1) ()
DISTRIBUTED BY HASH(k2) BUCKETS 32
PROPERTIES(
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-3",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32",
    "dynamic_partition.replication_allocation" = "tag.location.group_a:3"
 );
```

### CTAS Example

```sql
CREATE TABLE t10
PROPERTIES (
  'replication_num' = '1'
)
AS SELECT * FROM t1;
```

### CREATE TABLE ... LIKE Example

```sql
CREATE TABLE t11 LIKE t10;
```