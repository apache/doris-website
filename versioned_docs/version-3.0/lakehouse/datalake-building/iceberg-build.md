---
{
    "title": "Iceberg",
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

Since version 2.1.6, Apache Doris supports DDL and DML operations on Iceberg. Users can directly create library tables in Iceberg through Apache Doris and write data to Iceberg tables. With this feature, users can perform full data querying and writing operations on Iceberg through Apache Doris, further simplifying the lakehouse architecture for users.

This article introduces the Iceberg operations, syntax, and usage notes supported in Apache Doris.

:::tip
This is an experimental feature.
:::

:::tip
Before using, please set:
<br />
set global enable_nereids_planner = true;
set global enable_fallback_to_original_planner = false;
<br />
For clusters upgraded from older versions, these parameters may have changed.
:::

## Metadata Creation and Deletion

### Catalog

- Creation

    ```
    CREATE CATALOG [IF NOT EXISTS] iceberg PROPERTIES (
        "type" = "iceberg",
        "iceberg.catalog.type" = "hms",
        "hive.metastore.uris" = "thrift://172.21.16.47:7004",
        "warehouse" = "hdfs://172.21.16.47:4007/user/hive/warehouse/",
        "hadoop.username" = "hadoop",
        "fs.defaultFS" = "hdfs://172.21.16.47:4007"
    );
    ```
        
    The above mainly demonstrates how to create an HMS Iceberg Catalog in Apache Doris. Apache Doris currently supports multiple types of Iceberg Catalogs. For more configurations, please refer to [Iceberg Catalog](../datalake-analytics/iceberg.md).

    Note that if you need to create Iceberg tables or write data through HMS Catalog in Apache Doris, you need to explicitly add the `fs.defaultFS` property and `warehouse` property in the Catalog attributes. If the Catalog is created only for querying, these two parameters can be omitted.

- Deletion

    ```
    DROP CATALOG [IF EXISTS] iceberg;
    ```
    
    Deleting the Catalog does not remove any library table information in Iceberg. It simply removes the mapping of this Iceberg Catalog in Apache Doris.

### Database

- Creation

    You can switch to the corresponding Catalog and execute the `CREATE DATABASE` statement:
        
    ```
    SWITCH iceberg;
    CREATE DATABASE [IF NOT EXISTS] iceberg_db;
    ```
        
    You can also create using fully qualified names or specify a location, such as:
        
    ```
    CREATE DATABASE [IF NOT EXISTS] iceberg.iceberg_db;
    ```

    Afterwards, you can use the `SHOW CREATE DATABASE` command to view the relevant information of the Database:
    
    ```
    mysql> SHOW CREATE DATABASE iceberg_db;
    +------------+------------------------------+
    | Database   | Create Database              |
    +------------+------------------------------+
    | iceberg_db | CREATE DATABASE `iceberg_db` |
    +------------+------------------------------+
    ```

- Delete

    ```
    DROP DATABASE [IF EXISTS] iceberg.iceberg_db;
    ```
    
    :::caution Note
    For Iceberg Database, you must first delete all tables under this Database before deleting the Database, otherwise an error will occur. This operation will also synchronously delete the corresponding Database in Iceberg.
    :::

### Table

- Create

    Apache Doris supports creating partitioned or non-partitioned tables in Iceberg.
    
    ```
    -- Create unpartitioned iceberg table
    CREATE TABLE unpartitioned_table (
      `col1` BOOLEAN COMMENT 'col1',
      `col2` INT COMMENT 'col2',
      `col3` BIGINT COMMENT 'col3',
      `col4` FLOAT COMMENT 'col4',
      `col5` DOUBLE COMMENT 'col5',
      `col6` DECIMAL(9,4) COMMENT 'col6',
      `col7` STRING COMMENT 'col7',
      `col8` DATE COMMENT 'col8',
      `col9` DATETIME COMMENT 'col9'
    )  ENGINE=iceberg
    PROPERTIES (
      'write-format'='parquet'
    );
    
    -- Create partitioned iceberg table
    -- The partition columns must be in table's column definition list
    CREATE TABLE partition_table (
      `ts` DATETIME COMMENT 'ts',
      `col1` BOOLEAN COMMENT 'col1',
      `col2` INT COMMENT 'col2',
      `col3` BIGINT COMMENT 'col3',
      `col4` FLOAT COMMENT 'col4',
      `col5` DOUBLE COMMENT 'col5',
      `col6` DECIMAL(9,4) COMMENT 'col6',
      `col7` STRING COMMENT 'col7',
      `col8` DATE COMMENT 'col8',
      `col9` DATETIME COMMENT 'col9',
      `pt1` STRING COMMENT 'pt1',
      `pt2` STRING COMMENT 'pt2'
    )  ENGINE=iceberg
    PARTITION BY LIST (DAY(ts), pt1, pt2) ()
    PROPERTIES (
      'write-format'='orc',
      'compression-codec'='zlib'
    );
    ```

    After creation, you can use the `SHOW CREATE TABLE` command to view the table creation statement in Iceberg. For partitioned tables and partition functions, refer to the following section on **Partition**.

- Column Types

    The column types used to create Iceberg tables in Apache Doris correspond to the column types in Iceberg as follows:
    
    | Apache Doris | Iceberg |
    |---|---|
    | BOOLEAN    | BOOLEAN |
    | INT        | INT |
    | BIGINT     | BIGINT |
    | FLOAT      | FLOAT |
    | DOUBLE     | DOUBLE |
    | DECIMAL  | DECIMAL |
    | STRING     | STRING |
    | DATE     | DATE |
    | DATETIME | TIMESTAMP |
    | ARRAY      | ARRAY |
    | MAP        | MAP |
    | STRUCT     | STRUCT |
    
    - Note: Only these data types are currently supported; other data types will result in an error.
    - Column types can only be the default Nullable for now; NOT NULL is not supported.
    - After inserting data, if the types are not compatible, such as inserting `'abc'` into a numeric type, it will be converted to a null value before insertion.

- Drop

    You can delete an Iceberg table using the `DROP TABLE` statement. Currently, deleting a table will also delete the data, including partition data.

- Partition

    The partition types in Iceberg correspond to List partitions in Apache Doris. Therefore, when creating an Iceberg partitioned table in Apache Doris, you need to use the List partition creation statement, but you do not need to explicitly enumerate each partition. When writing data, Apache Doris will automatically create the corresponding Iceberg partition based on the data values.
    
    - Supports creating single-column or multi-column partitioned tables.
    - Supports partition transformation functions to support Iceberg implicit partitioning and partition evolution features. Specific Iceberg partition transformation functions can be found at [Iceberg partition transforms](https://iceberg.apache.org/spec/#partition-transforms)
        - `year(ts)` or `years(ts)`
        - `month(ts)` or `months(ts)`
        - `day(ts)` or `days(ts)` or `date(ts)`
        - `hour(ts)` or `hours(ts)` or `date_hour(ts)`
        - `bucket(N, col)`
        - `truncate(L, col)`

- File Formats

    - Parquet (default)
    - ORC

- Compression Formats

    - Parquet: snappy, zstd (default), plain. (plain means no compression)
    - ORC: snappy, zlib (default), zstd, plain. (plain means no compression)

- Storage Medium

    - HDFS
    - Object storage

## Data Operations

You can use the INSERT statement to write data into an Iceberg table.

Supports writing to Iceberg tables created by Apache Doris or to existing tables in Iceberg that support the format.

For partitioned tables, data will be automatically written to the corresponding partition or a new partition will be created based on the data.

Currently, specifying partition write is not supported.

### INSERT

The INSERT operation writes data to the target table in an append manner.

```
INSERT INTO iceberg_tbl values (val1, val2, val3, val4);
INSERT INTO iceberg.iceberg_db.iceberg_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO iceberg_tbl(col1, col2) values (val1, val2);
INSERT INTO iceberg_tbl(col1, col2, partition_col1, partition_col2) values (1, 2, "beijing", "2023-12-12");
```

### INSERT OVERWRITE

INSERT OVERWRITE completely replaces the existing data in the original table with new data.

```
INSERT OVERWRITE TABLE VALUES(val1, val2, val3, val4)
INSERT OVERWRITE TABLE iceberg.iceberg_db.iceberg_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;
```

### CTAS(CREATE TABLE AS SELECT)

You can create an Iceberg table and write data using the `CTAS` statement:

```
CREATE TABLE iceberg_ctas ENGINE=iceberg AS SELECT * FROM other_table;
```

CTAS supports specifying file formats, partitioning methods, and other information, such as:

```
CREATE TABLE iceberg_ctas ENGINE=iceberg
PARTITION BY LIST (pt1, pt2) ()
AS SELECT col1,pt1,pt2 FROM part_ctas_src WHERE col1>0;
    
CREATE TABLE iceberg.iceberg_db.iceberg_ctas (col1,col2,pt1) ENGINE=iceberg
PARTITION BY LIST (pt1) ()
PROPERTIES (
    'write-format'='parquet',
    'compression-codec'='zstd'
)
AS SELECT col1,pt1 as col2,pt2 as pt1 FROM test_ctas.part_ctas_src WHERE col1>0;
```

## Abnormal Data and Data Transformation

TODO

### HDFS File Operations

Data from Iceberg tables on HDFS is written to the final directory, and Iceberg metadata is managed by submitting it.

The data file naming format is: `<query-id>_<uuid>-<index>.<compress-type>.<file-type>`

### Object Storage File Operations

TODO

## Related Parameters

### FE

TODO

### BE

| Parameter Name | Default Value | Description |
| --- | --- | --- |
| `iceberg_sink_max_file_size` | Maximum size of data files. When the amount of data written exceeds this size, the current file will be closed, and a new file will be created to continue writing. | 1GB |
| `table_sink_partition_write_max_partition_nums_per_writer` | Maximum number of partitions written per Instance on a BE node. | 128 |
| `table_sink_non_partition_write_scaling_data_processed_threshold` | Threshold for the amount of data processed to trigger scaling-write for non-partitioned tables. For every increase of `table_sink_non_partition_write_scaling_data_processed_threshold` data, it will be sent to a new writer (instance) for writing. The scaling-write mechanism is mainly used to write data using a different number of writer (instance) based on the data volume, increasing the number of writer (instance) with the increase in data volume to improve concurrent write throughput. It also saves resources when the data volume is low and minimizes the number of generated files as much as possible. | 25MB |
| `table_sink_partition_write_min_data_processed_rebalance_threshold` | Minimum data amount threshold to trigger rebalancing for partitioned tables. If `accumulated data amount` - `data amount since the last rebalance or initial accumulation` >= `table_sink_partition_write_min_data_processed_rebalance_threshold`, the rebalancing mechanism will be triggered. If a significant difference in final file sizes is found, you can reduce this threshold to increase balance. Of course, a too small threshold will increase the cost of rebalancing and may affect performance. | 25MB |
| `table_sink_partition_write_min_partition_data_processed_rebalance_threshold` | Minimum partition data amount threshold when triggering rebalancing for partitioned tables. If `current partition data amount` >= `threshold` * `current partition allocated task number`, the partition will be rebalanced. If a significant difference in final file sizes is found, you can reduce this threshold to increase balance. Of course, a too small threshold will increase the cost of rebalancing and may affect performance. | 15MB |
