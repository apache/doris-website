---
{
    "title": "Hive Catalog",
    "language": "en"
}
---

By connecting to Hive Metastore or metadata services compatible with Hive Metastore, Doris can automatically retrieve Hive database and table information for data querying.

In addition to Hive, many other systems use Hive Metastore to store metadata. Therefore, through the Hive Catalog, we can access not only Hive tables but also other table formats that use Hive Metastore for metadata storage, such as Iceberg and Hudi.

## Applicable Scenarios

| Scenario     | Description                                                  |
|--------------|--------------------------------------------------------------|
| Query Acceleration | Use Doris's distributed computing engine to directly access Hive data for query acceleration. |
| Data Integration   | Read Hive data and write it to Doris internal tables, or perform ZeroETL operations using the Doris computing engine. |
| Data Write-back   | Process data from any source supported by Doris and write it back to Hive tables. |

## Configuring Catalog

### Syntax

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type'='hms', -- required
    'hive.metastore.type' = '<hive_metastore_type>', -- optional
    'hive.version' = '<hive_version>', -- optional
    'fs.defaultFS' = '<fs_defaultfs>', -- optional
    {MetaStoreProperties},
    {StorageProperties},
    {CommonProperties},
    {OtherProperties}
);
```

* `<hive_metastore_type>`

  Specify the type of Hive Metastore.

  * `hms`: Standard Hive Metastore service.
  * `glue`: Access AWS Glue metadata service using Hive Metastore compatible interface.
  * `dlf`: Access Alibaba Cloud DLF metadata service using Hive Metastore compatible interface.

* `<fs_defaultfs>`

  This parameter is required when writing data from Doris to tables in this Hive Catalog. Example:

  `'fs.defaultFS' = 'hdfs://namenode:port'`

* `{MetaStoreProperties}`

  The MetaStoreProperties section is for entering connection and authentication information for the Metastore metadata service. Refer to the "Supported Metadata Services" section for details.

* `{StorageProperties}`

  The StorageProperties section is for entering connection and authentication information related to the storage system. Refer to the "Supported Storage Systems" section for details.

* `{CommonProperties}`

  The CommonProperties section is for entering common attributes. Please see the "Common Properties" section in the [Catalog Overview](../catalog-overview.md).

* `{OtherProperties}`

  OtherProperties section is for entering properties related to Hive Catalog.

  * `get_schema_from_table`：The default value is false. By default, Doris will obtain the table schema information from the Hive Metastore. However, in some cases, compatibility issues may occur, such as the error `Storage schema reading not supported`. In this case, you can set this parameter to true, and the table schema will be obtained directly from the Table object. But please note that this method will cause the default value information of the column to be ignored. This property is supported since version 2.1.10 and 3.0.6.

### Supported Hive Versions

Supports Hive 1.x, 2.x, 3.x, and 4.x.

Hive transactional tables are supported from version 3.x onwards. For details, refer to the "Hive Transactional Tables" section.

### Supported Metadata Services

* [Hive Metastore](../metastores/hive-metastore.md)
* [AWS Glue](../metastores/aws-glue.md)
* [Aliyun DLF](../metastores/aliyun-dlf.md)

### Supported Storage Systems

* [HDFS](../storages/hdfs.md)
* [AWS S3](../storages/s3.md)
* [Google Cloud Storage](../storages/gcs.md)
* [Alibaba Cloud OSS](../storages/aliyun-oss.md)
* [Tencent Cloud COS](../storages/tencent-cos.md)
* [Huawei Cloud OBS](../storages/huawei-obs.md)
* [MINIO](../storages/minio.md)

> To create Hive tables and write data through Doris, you need to explicitly add the `fs.defaultFS` property in the Catalog attributes. If the Catalog is created only for querying, this parameter can be omitted.

### Supported Data Formats

* Hive

  * [ Parquet](../file-formats/parquet.md)

  * [ ORC](../file-formats/orc.md)

  * [ Text/CSV/JSON](../file-formats/text.md)

* Hudi

  * [ Parquet](../file-formats/parquet.md)

  * [ ORC](../file-formats/orc.md)

* Iceberg

  * [ Parquet](../file-formats/parquet.md)

  * [ ORC](../file-formats/orc.md)

## Column Type Mapping

| Hive Type     | Doris Type    | Comment                                        |
| ------------- | ------------- | ---------------------------------------------- |
| boolean       | boolean       |                                                |
| tinyint       | tinyint       |                                                |
| smallint      | smallint      |                                                |
| int           | int           |                                                |
| bigint        | bigint        |                                                |
| date          | date          |                                                |
| timestamp     | datetime(6)   | Mapped to datetime with precision 6            |
| float         | float         |                                                |
| double        | double        |                                                |
| decimal(P, S) | decimal(P, S) | Defaults to decimal(9, 0) if precision not specified |
| char(N)       | char(N)       |                                                |
| varchar(N)    | varchar(N)    |                                                |
| string        | string        |                                                |
| binary        | string        |                                                |
| array         | array         |                                                |
| map           | map           |                                                |
| struct        | struct        |                                                |
| other         | unsupported   |                                                |


## Examples

### Hive on HDFS

```sql
CREATE CATALOG hive_hdfs PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083'
);
```

### Hive on HDFS with HA

```sql
CREATE CATALOG hive_hdfs_ha PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'dfs.nameservices' = 'your-nameservice',
    'dfs.ha.namenodes.your-nameservice' = 'nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1' = '172.21.0.2:8088',
    'dfs.namenode.rpc-address.your-nameservice.nn2' = '172.21.0.3:8088',
    'dfs.client.failover.proxy.provider.your-nameservice' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

### Hive on ViewFS

```sql
CREATE CATALOG hive_viewfs PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'dfs.nameservices' = 'your-nameservice',
    'dfs.ha.namenodes.your-nameservice' = 'nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1' = '172.21.0.2:8088',
    'dfs.namenode.rpc-address.your-nameservice.nn2' = '172.21.0.3:8088',
    'dfs.client.failover.proxy.provider.your-nameservice' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'fs.defaultFS' = 'viewfs://your-cluster',
    'fs.viewfs.mounttable.your-cluster.link./ns1' = 'hdfs://your-nameservice/',
    'fs.viewfs.mounttable.your-cluster.homedir' = '/ns1'
);
```

### Hive on S3

```sql
CREATE CATALOG hive_s3 PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    's3.endpoint' = 's3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk',
    'use_path_style' = 'true'
);
```

## Query Operations

### Basic Query

After configuring the Catalog, you can query the table data within the Catalog using the following method:

```sql
-- 1. switch to catalog, use database and query
SWITCH hive_ctl;
USE hive_db;
SELECT * FROM hive_tbl LIMIT 10;

-- 2. use hive database directly
USE hive_ctl.hive_db;
SELECT * FROM hive_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM hive_ctl.hive_db.hive_tbl LIMIT 10;
```

### Querying Hive Partitions

You can query Hive partition information using the following two methods:

* `SHOW PARTITIONS FROM [catalog.][db.]hive_table`

  This statement lists all partitions and their values for the specified Hive table.

  ```sql
  SHOW PARTITIONS FROM hive_table;

  +--------------------------------+
  | Partition                      |
  +--------------------------------+
  | pt1=2024-10-10/pt2=beijing     |
  | pt1=2024-10-10/pt2=shanghai    |
  | pt1=2024-10-11/pt2=beijing     |
  | pt1=2024-10-11/pt2=shanghai    |
  | pt1=2024-10-12/pt2=nanjing     |
  +--------------------------------+
  ```

* Using the `table$partitions` Metadata Table

  Starting from versions 2.1.7 and 3.0.3, you can query Hive partition information through the `table$partitions` metadata table. This table is essentially relational, with each partition column represented as a column, allowing it to be used in any SELECT statement.

  ```sql
  SELECT * FROM hive_table$partitions;

  +------------+-------------+
  | pt1        | pt2         |
  +------------+-------------+
  | 2024-10-10 | beijing     |
  | 2024-10-10 | shanghai    |
  | 2024-10-12 | nanjing     |
  | 2024-10-11 | beijing     |
  | 2024-10-11 | shanghai    |
  +------------+-------------+
  ```

### Querying Hive Transactional Tables

Hive Transactional tables support ACID semantics. For more details, see [Hive Transactions](https://cwiki.apache.org/confluence/display/Hive/Hive+Transactions).

* Support for Hive Transactional Tables

  | Table Type                      | Supported Operations in Hive        | Hive Table Properties                                                | Supported Hive Versions                                          |
  | ------------------------------- | ----------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
  | Full-ACID Transactional Table   | Supports Insert, Update, Delete     | `'transactional'='true'`                                            | 4.x, 3.x, 2.x (2.x requires Major Compaction in Hive to read)    |
  | Insert-Only Transactional Table | Supports Insert only                | `'transactional'='true'`, `'transactional_properties'='insert_only'` | 4.x, 3.x, 2.x (specify `hive.version` when creating the catalog) |

* Current Limitations

  Original Files scenarios are not supported. When a table is converted to a Transactional table, new data files will use the Hive Transactional table schema, but existing data files will not be converted. These files are referred to as Original Files.
  
### Querying Hive Views

You can query Hive Views, but there are some limitations:

* The Hive View definition (HiveQL) must be compatible with SQL statements supported by Doris. Otherwise, a parsing error will occur.

* Some functions supported by HiveQL may have the same name as those in Doris but behave differently. This could lead to discrepancies between the results obtained from Hive and Doris. If you encounter such issues, please report them to the community.

## Write Operations

Data can be written to Hive tables using the INSERT statement. This is supported for Hive tables created by Doris or existing Hive tables with compatible formats.

For partitioned tables, data will automatically be written to the corresponding partition or a new partition will be created based on the data. Currently, specifying a partition for writing is not supported.

### INSERT INTO

The INSERT operation appends data to the target table. Specifying a partition for writing is currently not supported.

```sql
INSERT INTO hive_tbl VALUES (val1, val2, val3, val4);
INSERT INTO hive_ctl.hive_db.hive_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO hive_tbl(col1, col2) VALUES (val1, val2);
INSERT INTO hive_tbl(col1, col2, partition_col1, partition_col2) VALUES (1, 2, "beijing", "2023-12-12");
```

### INSERT OVERWRITE

INSERT OVERWRITE completely replaces the existing data in the table with new data. Specifying a partition for writing is currently not supported.

```sql
INSERT OVERWRITE TABLE hive_tbl VALUES (val1, val2, val3, val4);
INSERT OVERWRITE TABLE hive_ctl.hive_db.hive_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;
```

The semantics of INSERT OVERWRITE are consistent with Hive, with the following behaviors:

* If the target table is partitioned and the source table is empty, the operation has no effect. The target table remains unchanged.

* If the target table is non-partitioned and the source table is empty, the target table will be cleared.

* Since specifying a partition for writing is not supported, INSERT OVERWRITE automatically handles the relevant partitions in the target table based on the source table values. If the target table is partitioned, only the affected partitions will be overwritten; unaffected partitions remain unchanged.

### CTAS

You can create a Hive table and insert data using the `CTAS (CREATE TABLE AS SELECT)` statement:

```sql
CREATE TABLE hive_ctas ENGINE=hive AS SELECT * FROM other_table;
```

CTAS supports specifying file formats, partitioning methods, and more, as shown below:

```sql
CREATE TABLE hive_ctas ENGINE=hive
PARTITION BY LIST (pt1, pt2) ()
AS SELECT col1, pt1, pt2 FROM part_ctas_src WHERE col1 > 0;
    
CREATE TABLE hive_ctl.hive_db.hive_ctas (col1, col2, pt1) ENGINE=hive
PARTITION BY LIST (pt1) ()
PROPERTIES (
    "file_format"="parquet",
    "compression"="zstd"
)
AS SELECT col1, pt1 AS col2, pt2 AS pt1 FROM test_ctas.part_ctas_src WHERE col1 > 0;
```

### Related Parameters

* Session variables

| Parameter name | Default value | Desciption | Since version |
| ----------| ---- | ---- | --- |
| `hive_parquet_use_column_names` | `true` | When Doris reads the Parquet data type of the Hive table, it will find the column with the same name from the Parquet file to read the data according to the column name of the Hive table by default. When this variable is `false`, Doris will read data from the Parquet file according to the column order in the Hive table, regardless of the column name. Similar to the `parquet.column.index.access` variable in Hive. This parameter only applies to the top-level column name and is invalid inside the Struct. | 2.1.6+, 3.0.3+ |
| `hive_orc_use_column_names` | `true` | Similar to `hive_parquet_use_column_names`, it is for the Hive table ORC data type. Similar to the `orc.force.positional.evolution` variable in Hive. | 2.1.6+, 3.0.3+ |

* BE

  | Parameter Name                                                                | Default Value                                                                                                     | Description |
  | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------- |
  | `hive_sink_max_file_size`                                                     | 1GB                                                                                                               | Maximum data file size. When the data size exceeds this limit, the current file will be closed, and a new file will be created for further writing. |
  | `table_sink_partition_write_max_partition_nums_per_writer`                    | 128                                                                                                               | Maximum number of partitions that each instance can write to on a BE node. |
  | `table_sink_non_partition_write_scaling_data_processed_threshold`             | 25MB                                                                                                              | Data volume threshold for starting scaling-write for non-partitioned tables. A new writer (instance) will be used for every additional `table_sink_non_partition_write_scaling_data_processed_threshold` of data. This mechanism adjusts the number of writers (instances) based on data volume to enhance concurrent write throughput, saving resources and minimizing file numbers for smaller data volumes. |
  | `table_sink_partition_write_min_data_processed_rebalance_threshold`           | 25MB                                                                                                              | Minimum data volume threshold to trigger rebalancing for partitioned tables. Rebalancing is triggered if `current accumulated data volume` - `data volume since last rebalancing or initial accumulation` >= `table_sink_partition_write_min_data_processed_rebalance_threshold`. If the final file size varies significantly, reduce this threshold to improve balance. However, a lower threshold may increase rebalancing costs, potentially affecting performance. |
  | `table_sink_partition_write_min_partition_data_processed_rebalance_threshold` | 15MB                                                                                                              | Minimum partition data volume threshold to trigger rebalancing. Rebalancing occurs if `current partition data volume` >= `threshold` \* `number of tasks already allocated to the partition`. If the final file size varies significantly, reduce this threshold to improve balance. However, a lower threshold may increase rebalancing costs, potentially affecting performance. |
  

## Database and Table Management

Users can create and delete databases and tables in the Hive Metastore through Doris. Note that Doris only calls the Hive Metastore API for these operations and does not store or persist any Hive metadata itself.

### Creating and Dropping Databases

You can switch to the appropriate Catalog using the `SWITCH` statement and execute the `CREATE DATABASE` statement:

```sql
SWITCH hive_ctl;
CREATE DATABASE [IF NOT EXISTS] hive_db;
```

You can also create a database using a fully qualified name or specify a location, such as:

```sql
CREATE DATABASE [IF NOT EXISTS] hive_ctl.hive_db;

CREATE DATABASE [IF NOT EXISTS] hive_ctl.hive_db
PROPERTIES ('location'='hdfs://172.21.16.47:4007/path/to/db/');
```

You can view the location information of the Database using the `SHOW CREATE DATABASE` command:

```sql
mysql> SHOW CREATE DATABASE hive_db;
+----------+---------------------------------------------------------------------------------------------+
| Database | Create Database                                                                             |
+----------+---------------------------------------------------------------------------------------------+
| hive_db  | CREATE DATABASE hive_db LOCATION 'hdfs://172.21.16.47:4007/usr/hive/warehouse/hive_db.db'   |
+----------+---------------------------------------------------------------------------------------------+
```

To drop a database:

```sql
DROP DATABASE [IF EXISTS] hive_ctl.hive_db;
```

:::caution
For a Hive Database, you must first delete all tables under that Database before you can delete the Database itself; otherwise, an error will occur. This operation will also delete the corresponding Database in Hive.
:::

### Creating and Dropping Tables

- **Creating Tables**

  Doris supports creating both partitioned and non-partitioned tables in Hive.

  ```sql
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
  
  After creating a table, you can view the Hive table creation statement using the `SHOW CREATE TABLE` command.

  Note that unlike Hive's table creation syntax, when creating a partitioned table in Doris, partition columns must be included in the table schema. Additionally, partition columns must be placed at the end of the schema and maintain the same order.

  :::tip
  For Hive clusters where ACID transaction features are enabled by default, tables created by Doris will have the `transactional` property set to `true`. Since Doris only supports certain features of Hive transactional tables, this may lead to issues where Doris cannot read the Hive tables it creates. To avoid this, explicitly set `"transactional" = "false"` in the table properties to create non-transactional Hive tables:

  ```sql
  CREATE TABLE non_acid_table(
    `col1` BOOLEAN COMMENT 'col1',
    `col2` INT COMMENT 'col2',
    `col3` BIGINT COMMENT 'col3'
  ) ENGINE=hive
  PROPERTIES (
    'transactional'='false'
  );
  ```
  :::

- **Dropping Tables**

  You can delete a Hive table using the `DROP TABLE` statement. When a table is deleted, all data, including partition data, is also removed.

- **Column Type Mapping**

  Refer to the [Column Type Mapping] section for details. Note the following restrictions:

  - Columns must be of the default nullable type; `NOT NULL` is not supported.
  - Hive 3.0 supports setting default values. To set default values, explicitly add `"hive.version" = "3.0.0"` in the catalog properties.
  - If inserted data types are incompatible (e.g., inserting `'abc'` into a numeric type), the value will be converted to `null`.

- **Partitioning**

  In Hive, partition types correspond to List partitions in Doris. Therefore, when creating a Hive partitioned table in Doris, use the List partition syntax, but there is no need to explicitly enumerate each partition. Doris will automatically create the corresponding Hive partition based on data values during data insertion. Single-column or multi-column partitioned tables are supported.

- **File Formats**

  - ORC (default)
  - Parquet

    Note that when the DATETIME type is written to a Parquet file, the physical type used is INT96 instead of INT64. This is to be compatible with the logic of Hive versions prior to 4.0.

  - Text (supported from versions 2.1.7 and 3.0.3)

      Text format supports the following table properties:

		  - `field.delim`: Column delimiter. Default is `\1`.
		  - `line.delim`: Line delimiter. Default is `\n`.
		  - `collection.delim`: Delimiter for elements in complex types. Default is `\2`.
		  - `mapkey.delim`: Delimiter for map key-value pairs. Default is `\3`.
		  - `serialization.null.format`: Format for storing `NULL` values. Default is `\N`.
		  - `escape.delim`: Escape character. Default is `\`.

- **Compression Formats**

  - Parquet: snappy (default), zstd, plain (no compression)
  - ORC: snappy, zlib (default), zstd, plain (no compression)
  - Text: gzip, deflate, bzip2, zstd, lz4, lzo, snappy, plain (default, no compression)

- **Storage Medium**

  - HDFS
  - Object Storage

## Subscribing to Hive Metastore Events

By having the FE nodes periodically read Notification Events from the HMS, Doris can detect real-time changes in Hive table metadata, improving metadata timeliness. Currently, the following events are supported:

| Event            | Action and Corresponding Behavior                                         |
| ---------------- | ------------------------------------------------------------------------- |
| CREATE DATABASE  | Creates a database in the corresponding data directory.                   |
| DROP DATABASE    | Deletes a database in the corresponding data directory.                   |
| ALTER DATABASE   | Mainly affects changes to database properties, comments, and default storage locations. These changes do not affect Doris's ability to query external data directories, so this event is currently ignored. |
| CREATE TABLE     | Creates a table in the corresponding database.                            |
| DROP TABLE       | Deletes a table in the corresponding database and invalidates the table cache. |
| ALTER TABLE      | If renamed, deletes the old table and creates a new one with the new name; otherwise, invalidates the table cache. |
| ADD PARTITION    | Adds a partition to the cached partition list of the corresponding table. |
| DROP PARTITION   | Removes a partition from the cached partition list and invalidates the partition cache. |
| ALTER PARTITION  | If renamed, deletes the old partition and creates a new one with the new name; otherwise, invalidates the partition cache. |

:::tip
1. When data import causes file changes, partitioned tables trigger an `ALTER PARTITION` event, while non-partitioned tables trigger an `ALTER TABLE` event.

2. If you bypass HMS and directly manipulate the file system, HMS will not generate corresponding events, and Doris will not detect metadata changes.
:::

The following parameters in `fe.conf` are related to this feature:

1. `enable_hms_events_incremental_sync`: Enables automatic incremental metadata synchronization. Disabled by default.

2. `hms_events_polling_interval_ms`: Interval for reading events, default is 10000 milliseconds.

3. `hms_events_batch_size_per_rpc`: Maximum number of events to read per RPC, default is 500.

To use this feature (excluding Huawei Cloud MRS), you need to modify the `hive-site.xml` of HMS and restart both HMS and HiveServer2.

```xml
<property>
    <name>hive.metastore.event.db.notification.api.auth</name>
    <value>false</value>
</property>
<property>
    <name>hive.metastore.dml.events</name>
    <value>true</value>
</property>
<property>
    <name>hive.metastore.transactional.event.listeners</name>
    <value>org.apache.hive.hcatalog.listener.DbNotificationListener</value>
</property>
```

For Huawei Cloud MRS, you need to modify the `hivemetastore-site.xml` and restart both HMS and HiveServer2.

```xml
<property>
    <name>metastore.transactional.event.listeners</name>
    <value>org.apache.hive.hcatalog.listener.DbNotificationListener</value>
</property>
```

## Appendix

### Transaction Mechanism

Write operations to Hive are placed in a separate transaction. Before the transaction is committed, the data is not visible externally. Only after the transaction is committed do the related table operations become visible to others.

Transactions ensure the atomicity of operations, meaning all operations within a transaction either succeed together or fail together.

Transactions cannot fully guarantee isolation of operations, but they strive to minimize inconsistencies by separating file system operations from Hive Metastore metadata operations.

For example, in a transaction that requires modifying multiple partitions of a Hive table, if the task is divided into two batches, the first batch might be visible externally before the second batch is completed. This means the first batch of partitions can be read, but the second batch cannot.

If any exceptions occur during the transaction commit process, the transaction will be rolled back completely, including modifications to HDFS files and Hive Metastore metadata, without requiring any additional user intervention.

### Concurrent Writing Mechanism

Apache Doris currently supports concurrent writing using multiple insert statements. However, users need to ensure that concurrent writes do not result in potential conflicts.

Since regular non-transactional Hive tables lack a complete transaction mechanism, the Apache Doris transaction mechanism aims to minimize inconsistency windows but cannot guarantee true ACID properties. Therefore, concurrent writes to Hive tables in Apache Doris may lead to data consistency issues.

1. **Concurrent `INSERT` Operations**

2. `INSERT` operations append data and do not conflict when executed concurrently, producing the expected results.

3. **Concurrent `INSERT OVERWRITE` Operations**

4. Concurrent `INSERT OVERWRITE` operations on the same table or partition may lead to data loss or corruption, resulting in unpredictable outcomes.

5. Common solutions include:

   * For partitioned tables, write data to different partitions. Concurrent operations on different partitions do not conflict.

   * For non-partitioned tables, use `INSERT` instead of `INSERT OVERWRITE` to avoid conflicts.

   * For operations that may conflict, ensure that only one write operation occurs at a time on the business side.

### HDFS File Operations

For Hive table data on HDFS, data is typically first written to a temporary directory, then finalized using file system operations like `rename`. Below is a detailed explanation of the specific file operations on HDFS for different data operations.

The temporary directory format for data is: `/tmp/.doris_staging/<username>/<uuid>`

The format for the written data file names is: `<query-id>_<uuid>-<index>.<compress-type>.<file-type>`

Here are examples of file operations under various scenarios:

1. **Non-Partitioned Table**

   * **Append (Add Data)**

     * Target table directory: `hdfs://ns/usr/hive/warehouse/example.db/table1`

     * Temporary file: `hdfs://ns/tmp/.doris_staging/root/f02247cb662846038baae272af5eeb05/b35fdbcea3a4e39-86d1f36987ef1492_7e3985bf-9de9-4fc7-b84e-adf11aa08756-0.orc`

     * During the commit phase, all temporary files are moved to the target table directory.

   * **Overwrite (Replace Data)**

     * Target table directory: `hdfs://ns/usr/hive/warehouse/example.db/table1`

     * Temporary file: `hdfs://ns/tmp/.doris_staging/root/f02247cb662846038baae272af5eeb05/b35fdbcea3a4e39-86d1f36987ef1492_7e3985bf-9de9-4fc7-b84e-adf11aa08756-0.orc`

     * Commit phase steps:

       1. Rename the target table directory to a temporary directory: `hdfs://ns/usr/hive/warehouse/example.db/_temp_b35fdbcea3a4e39-86d1f36987ef1492_table1`

       2. Rename the temporary directory to the target table directory.

       3. Delete the temporary target table directory.

2. **Partitioned Table**

   * **Add (Add to New Partition)**

     * Target table directory: `hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`

     * Temporary file: `hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

     * During the commit phase, the temporary directory is renamed to the target table directory.

   * **Append (Add Data to Existing Partition)**

     * Target table directory: `hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`

     * Temporary file: `hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

     * During the commit phase, files from the temporary directory are moved to the target table directory.

   * **Overwrite (Replace Existing Partition)**

     * Target table directory: `hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`

     * Temporary file: `hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

     * Commit phase steps:

       1. Rename the target partition directory to a temporary partition directory: `hdfs://ns/usr/hive/warehouse/example.db/table2/_temp_d678a74d232345e0-b659e2fb58e86ffd_part_col=2024-01-01`

       2. Rename the temporary partition directory to the target partition directory.

       3. Delete the temporary target partition directory.

### Change Log

| Doris Version | Feature Support                              |
| ------------- | --------------------------------------------- |
| 2.1.6         | Support for writing back to Hive tables       |
| 3.0.4         | Support for Hive tables in JsonSerDe format. Support for transactional tables in Hive4. |
