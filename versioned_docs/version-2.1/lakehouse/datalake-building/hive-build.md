---
{
    "title": "Hive",
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

Starting from version 2.1.3, Doris supports DDL and DML operations for Hive. Users can directly create databases and tables in Hive through Doris and write data into Hive tables. With this feature, users can perform complete data queries and write operations on Hive through Doris, further helping to simplify the data lake integrated architecture.

This article introduces Hive operations supported in Doris, including syntax and usage notes.

:::tip
This is an experimental feature.
:::

:::tip
Before using, please set:
<br/>
set global enable_nereids_planner = true;

set global enable_fallback_to_original_planner = false;
<br/>
For clusters upgraded from old versions, these variables may change.
:::

## Metadata Creation and Deletion

### Catalog

- Create

    ```
    CREATE CATALOG [IF NOT EXISTS] hive PROPERTIES (
        "type"="hms",
        "hive.metastore.uris" = "thrift://172.21.16.47:7004",
        "hadoop.username" = "hadoop",
        "fs.defaultFS" = "hdfs://172.21.16.47:4007"
    );
    ```

    Note, if you need to create Hive tables or write data through Doris, you must explicitly include the `fs.defaultFS` property in the Catalog properties. If creating the Catalog is only for querying, this parameter can be omitted.

    For more parameters, please refer to [Hive Catalog](../datalake-analytics/hive.md)

- Drop

    ```
    DROP CATALOG [IF EXISTS] hive;
    ```

    Deleting a Catalog does not delete any database or table information in Hive. It merely removes the mapping to this Hive cluster in Doris.

### Database

- Create

    You can switch to the corresponding Catalog and execute the `CREATE DATABASE` statement:

    ```
    SWITCH hive;
    CREATE DATABASE [IF NOT EXISTS] hive_db;
    ```

    You can also create using the fully qualified name or specify the location, as:

    ```
    CREATE DATABASE [IF NOT EXISTS] hive.hive_db;

    CREATE DATABASE [IF NOT EXISTS] hive.hive_db
    PROPERTIES ('location'='hdfs://172.21.16.47:4007/path/to/db/');
    ```

    Later, you can view the Database's Location information using the `SHOW CREATE DATABASE` command:

    ```
    mysql> SHOW CREATE DATABASE hive_db;
    +----------+---------------------------------------------------------------------------------------------+
    | Database | Create Database                                                                             |
    +----------+---------------------------------------------------------------------------------------------+
    | hive_db  | CREATE DATABASE `hive_db` LOCATION 'hdfs://172.21.16.47:4007/usr/hive/warehouse/hive_db.db' |
    +----------+---------------------------------------------------------------------------------------------+
    ```

- Drop

    ```
    DROP DATABASE [IF EXISTS] hive.hive_db;
    ```

    Note that for Hive Databases, all tables within the Database must be deleted first, otherwise an error will occur. This operation will also delete the corresponding Database in Hive.

### Table

- Create

    Doris supports creating partitioned or non-partitioned tables in Hive.

    ```
    -- Create unpartitioned hive table
    CREATE TABLE unpartitioned_table (
      `col1` BOOLEAN COMMENT 'col1',
      `col2` INT COMMENT 'col2',
      `col3` BIGINT COMMENT 'col3',
      `col4` CHAR(10) COMMENT 'col4',
      `col5` FLOAT COMMENT 'col5',
      `col6` DOUBLE COMMENT 'col6',
      `col7` DECIMAL(9,4) COMMENT 'col7',
      `col8` VARCHAR(11) COMMENT 'col8',
      `col9` STRING COMMENT 'col9'
    )  ENGINE=hive
    PROPERTIES (
      'file_format'='parquet'
    );

    -- Create partitioned hive table
    -- The partition columns must be in table's column definition list
    CREATE TABLE partition_table (
      `col1` BOOLEAN COMMENT 'col1',
      `col2` INT COMMENT 'col2',
      `col3` BIGINT COMMENT 'col3',
      `col4` DECIMAL(2,1) COMMENT 'col4',
      `pt1` VARCHAR COMMENT 'pt1',
      `pt2` VARCHAR COMMENT 'pt2'
    )  ENGINE=hive
    PARTITION BY LIST (pt1, pt2) ()
    PROPERTIES (
      'file_format'='orc',
      'compression'='zlib'
    );

    -- Create text format table(Since 2.1.7 & 3.0.3)
    CREATE TABLE text_table (
        `id` INT,
        `name` STRING
    ) PROPERTIES (
        'file_format'='text',
        'compression'='gzip',
        'field.delim'='\t',
        'line.delim'='\n',
        'collection.delim'=';',
        'mapkey.delim'=':',
        'serialization.null.format'='\\N',
        'escape.delim'='\\'
    );
    ```

    After creation, you can view the Hive table creation statement using the `SHOW CREATE TABLE` command.

    Note, unlike Hive's table creation statements. In Doris, when creating a Hive partitioned table, the partition columns must also be included in the Table's Schema. At the same time, the partition columns must be at the end of all schemas and in the same order.

    :::tip

    For some Hive clusters that enable ACID transaction features by default, after using Doris to create a table, the table attribute `transactional` will be true. However, Doris only supports some features of Hive transaction tables, which may cause the problem that Doris itself cannot read the Hive created by Doris. Therefore, it is necessary to explicitly add: `"transactional" = "false"` in the table creation properties to create a non-transactional Hive table:

    ```
    CREATE TABLE non_acid_table(
      `col1` BOOLEAN COMMENT 'col1',
      `col2` INT COMMENT 'col2',
      `col3` BIGINT COMMENT 'col3'
    )  ENGINE=hive
    PROPERTIES (
      'transactional'='false',
    );
    ```
    :::

- Drop

    You can drop a Hive table using the `DROP TABLE` statement. Currently, deleting the table also removes the data, including partition data.

- Column Types

    The column types used when creating Hive tables in Doris correspond to those in Hive as follows:

    | Doris | Hive |
    |---|---|
    | BOOLEAN    | BOOLEAN |
    | TINYINT    | TINYINT |
    | SMALLINT   | SMALLINT |
    | INT        | INT |
    | BIGINT     | BIGINT |
    | DATE     | DATE |
    | DATETIME | TIMESTAMP |
    | FLOAT      | FLOAT |
    | DOUBLE     | DOUBLE |
    | CHAR       | CHAR |
    | VARCHAR    | STRING |
    | STRING     | STRING |
    | DECIMAL  | DECIMAL |
    | ARRAY      | ARRAY |
    | MAP        | MAP |
    | STRUCT     | STRUCT |

    > - Column types can only be nullable by default, NOT NULL is not supported.

    > - Hive 3.0 supports setting default values. If you need to set default values, you need to explicitly add `"hive.version" = "3.0.0"` in the Catalog properties.
    
    > - After inserting data, if the types are not compatible, such as `'abc'` being inserted into a numeric type, it will be converted to a null value before insertion.

- Partitions

    The partition types in Hive correspond to the List partition in Doris. Therefore, when creating a Hive partitioned table in Doris, you need to use the List partition table creation statement, but there is no need to explicitly enumerate each partition. When writing data, Doris will automatically create the corresponding Hive partition based on the values of the data.

    Supports creating single-column or multi-column partitioned tables.

- File Formats

    - ORC (default)
    - Parquet
    - Text (supported since version 2.1.7 & 3.0.3)
    
        The Text format also supports the following table properties:
        
        - `field.delim`: column delimiter. Default `\1`.
        - `line.delim`: row delimiter. Default `\n`.
        - `collection.delim`: delimiter between elements in complex types. Default `\2`.
        - `mapkey.delim`: key value delimiter of Map type. Default `\3`
        - `serialization.null.format`: storage format of NULL values. Default `\N`.
        - `escape.delim`: escape character. Default `\`.
    
- Compression Formats

    - Parquet: snappy(default), zstd, plain. (plain means no compression)
    - ORC: snappy, zlib(default), zstd, plain. (plain means no compression)
    - Text: gzip, defalte, bzip2, zstd, lz4, lzo, snappy, plain (default). (plain means no compression)

- Storage Medium

    - HDFS
    - Object Storage

## Data Operations

Data can be written into Hive tables through INSERT statements.

Supports writing to Hive tables created by Doris or existing Hive tables with supported format.

For partitioned tables, data will automatically be written to the corresponding partition or new partitions will be created.

Currently, writing to specific partitions is not supported.

### INSERT

The INSERT operation appends data to the target table. Currently, writing to a specific partition is not supported.

```
INSERT INTO hive_tbl values (val1, val2, val3, val4);
INSERT INTO hive.hive_db.hive_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO hive_tbl(col1, col2) values (val1, val2);
INSERT INTO hive_tbl(col1, col2, partition_col1, partition_col2) values (1, 2, "beijing", "2023-12-12");
```

### INSERT OVERWRITE

The INSERT OVERWRITE operation completely overwrites the existing data in the table with new data. Currently, writing to a specific partition is not supported.

```
INSERT OVERWRITE TABLE VALUES(val1, val2, val3, val4)
INSERT OVERWRITE TABLE hive.hive_db.hive_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;
```

The semantics of INSERT OVERWRITE is consistent with Hive, and has the following behaviors:

- When the target table is a partitioned table and the source table is empty, the operation will not have any effect. The target table data will not change.
- When the target table is a non-partitioned table and the source table is empty, the target table will be cleared.
- Currently, writing to a specified partition is not supported, so INSERT OVERWRITE automatically processes the corresponding target table partition according to the value in the source table. If the target table is a partitioned table, only the partitions involved will be overwritten, and the data of the partitions not involved will not change.

### CTAS (CREATE TABLE AS SELECT)

A Hive table can be created and populated with data using the `CTAS (CREATE TABLE AS SELECT)` statement:

```
CREATE TABLE hive_ctas ENGINE=hive AS SELECT * FROM other_table;
```

CTAS supports specifying file formats, partitioning methods, and other information, such as:

```
CREATE TABLE hive_ctas ENGINE=hive
PARTITION BY LIST (pt1, pt2) ()
AS SELECT col1,pt1,pt2 FROM part_ctas_src WHERE col1>0;

CREATE TABLE hive.hive_db.hive_ctas (col1,col2,pt1) ENGINE=hive
PARTITION BY LIST (pt1) ()
PROPERTIES (
"file_format"="parquet",
"compression"="zstd"
)
AS SELECT col1,pt1 as col2,pt2 as pt1 FROM test_ctas.part_ctas_src WHERE col1>0;
```

## Transaction Mechanism

Write operations to Hive are placed in a separate transaction. Until the transaction is committed, the data is not visible externally. Only after committing the transaction do the table's related operations become visible to others.

Transactions ensure the atomicity of operations—all operations within a transaction either succeed completely or fail altogether.

Transactions do not fully guarantee isolation of operations; they strive to minimize the inconsistency window by separating file system operations from metadata operations on the Hive Metastore.

For example, in a transaction involving multiple partition modifications of a Hive table, if the task is divided into two batches, and the first batch is completed but the second batch has not yet started, the partitions from the first batch are already visible externally, and can be read, but the second batch partitions cannot.

If any anomalies occur during the transaction commit process, the transaction will be directly rolled back, including modifications to HDFS files and metadata in the Hive Metastore, without requiring further action from the user.

### Concurrent Writing Mechanism

Currently, Doris supports concurrent writing using multiple insert statements. However, it is important to note that users need to control concurrent writing to avoid potential conflicts.

As ordinary non-transactional Hive tables lack a complete transaction mechanism. From the Doris transaction mechanism described earlier, we know that the current implementation in Doris can only make efforts to minimize the possible inconsistency time window and cannot guarantee true ACID properties. Therefore, concurrent writing to Hive in Doris may lead to data consistency issues.

1. `INSERT` Concurrent Operations

    `INSERT` is a data append operation. When `INSERT` is executed concurrently, it will not cause conflicts, and the operations will produce the expected results.

2. `INSERT OVERWRITE` Concurrent Operations

    If `INSERT OVERWRITE` is used for concurrent writing to the same table or partition, it may lead to data loss or corruption, and the result may be uncertain.

    There are generally the following solutions:

    - For partitioned tables, data can be written into different partitions, and concurrent operations on different partitions will not cause conflicts.
    - For non-partitioned tables, `INSERT` can be executed simultaneously without using `INSERT OVERWRITE`, thus avoiding conflicts.
    - For potentially conflicting operations, users need to control on the business side to ensure that only one write operation is being performed at the same time.

### HDFS File Operations

Data in Hive tables on HDFS is usually written first to a temporary directory, then operations like `rename` are used to commit the files finally. Here, we detail the specific operations on files in HDFS during different data operations.

The format of the temporary directory is: `/tmp/.doris_staging/<username>/<uuid>`

The format of the written data file names is: `<query-id>_<uuid>-<index>.<compress-type>.<file-type>`

Below, we describe the file operations in various cases.

1. Non-partitioned table

    - Append

        - Target table directory: `hdfs://ns/usr/hive/warehouse/example.db/table1`
        - Temporary file: `hdfs://ns/tmp/.doris_staging/root/f02247cb662846038baae272af5eeb05/b35fdbcea3a4e39-86d1f36987ef1492_7e3985bf-9de9-4fc7-b84e-adf11aa08756-0.orc`

        During the commit phase, all temporary files are moved to the target table directory.

    - Overwrite

        - Target table directory: `hdfs://ns/usr/hive/warehouse/example.db/table1`
        - Temporary file: `hdfs://ns/tmp/.doris_staging/root/f02247cb662846038baae272af5eeb05/b35fdbcea3a4e39-86d1f36987ef1492_7e3985bf-9de9-4fc7-b84e-adf11aa08756-0.orc`

        Commit phase:

        1. The target table directory is renamed to a temporary target table directory: `hdfs://ns/usr/hive/warehouse/example.db/_temp_b35fdbcea3a4e39-86d1f36987ef1492_table1`
        2. The temporary directory is renamed to the target table directory.
        3. The temporary target table directory is deleted.

2. Partitioned table

    - Add (Add to a new partition)

        - Target table directory: `hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`
        - Temporary file: `hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

        During the commit phase, the temporary directory is renamed to the target table directory.

    - Append (Write data to an existing partition)

        - Target table directory: `hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`
        - Temporary file: `hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

        During the commit phase, files from the temporary directory are moved to the target table directory.

    - Overwrite (Overwrite an existing partition)

        - Target table directory: `hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`
        - Temporary file: `hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

        Commit phase:

        1. The target table partition directory is renamed to a temporary partition directory: `hdfs://ns/usr/hive/warehouse/example.db/table2/_temp_d678a74d232345e0-b659e2fb58e86ffd_part_col=2024-01-01`
        2. The temporary partition directory is renamed to the target table partition directory.
        3. The temporary partition directory is deleted.

## Relevant Parameters

### BE

| Parameter Name | Default Value | Description |
| --- | --- | --- |
| `hive_sink_max_file_size` | Maximum file size for data files. When the volume of written data exceeds this size, the current file is closed, and a new file is opened for continued writing. | 1GB |
| `table_sink_partition_write_max_partition_nums_per_writer` | Maximum number of partitions that can be written by each Instance on a BE node. |  128 |
| `table_sink_non_partition_write_scaling_data_processed_threshold` | Threshold of data volume for starting scaling-write in non-partitioned tables. For every increase of `table_sink_non_partition_write_scaling_data_processed_threshold` in data volume, a new writer (instance) will be engaged for writing. The scaling-write mechanism aims to use a different number of writers (instances) based on the volume of data to increase the throughput of concurrent writing. When the volume of data is small, it also saves resources and reduces the number of files produced as much as possible. | 25MB |
| `table_sink_partition_write_min_data_processed_rebalance_threshold` | Minimum data volume threshold for triggering rebalance in partitioned tables. If `current accumulated data volume` - `data volume accumulated since the last rebalance or from the start` >= `table_sink_partition_write_min_data_processed_rebalance_threshold`, rebalancing is triggered. If there is a significant difference in the final file sizes, you can reduce this threshold to increase balance. However, too small a threshold may increase the cost of rebalancing and potentially affect performance. | 25MB |
| `table_sink_partition_write_min_partition_data_processed_rebalance_threshold` | Minimum data volume threshold per partition for rebalancing in partitioned tables. If `current partition's data volume` >= `threshold` * `number of tasks allocated to the current partition`, rebalancing for that partition begins. If there is a significant difference in the final file sizes, you can reduce this threshold to increase balance. However, too small a threshold may increase the cost of rebalancing and potentially affect performance. | 15MB |

