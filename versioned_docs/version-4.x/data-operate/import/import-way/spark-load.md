---
{
    "title": "Spark Load",
    "language": "en",
    "description": "Spark Load uses external Spark resources to preprocess imported data, improving the import performance for large data volumes in Doris and saving the computing resources of the Doris cluster. It is mainly used for initial migration and large-scale data import scenarios into Doris."
}
---

# Spark Load

Spark Load uses external Spark resources to preprocess imported data, improving the import performance for large data volumes in Doris and saving the computing resources of the Doris cluster. It is mainly used for initial migration and large-scale data import scenarios into Doris.

Spark Load leverages the resources of the Spark cluster to sort the data to be imported, and Doris BE writes the files directly. This significantly reduces the resource usage of the Doris cluster, which is very effective at lowering Doris cluster resource usage and load when migrating massive historical data.

You need to create and execute import jobs through the Spark Load client. The execution status of the job is output to the console, and you can also view the import results through SHOW LOAD.

:::caution Note

This feature is experimental and is currently only available on the master branch.
The current version only supports the integrated storage and compute cluster.
If you encounter any issues during use, please provide feedback through the mailing list, [GitHub Issue](https://github.com/apache/doris/issues), or other channels.

:::

## Use Cases

- The source data is in a storage system accessible to Spark, such as HDFS.
- The data volume ranges from tens of GB to TB.

:::caution Note
For the primary key model, only tables in merge-on-read mode are currently supported.  
:::

## Basic Principles

### Basic Process

The execution of a Spark Load task is mainly divided into the following 7 stages:

1. You write a configuration file to configure the source files/tables to be read and the target table information.
2. The Spark Load client creates an import job with the FE and starts a transaction. The FE returns the target table metadata to the client.
3. The Spark Load client submits the ETL task to the Spark cluster for execution.
4. The Spark cluster executes the ETL to complete the preprocessing of the imported data, including global dictionary construction (Bitmap type), partitioning, sorting, aggregation, and so on.
5. After the ETL task is completed, the Spark Load client synchronizes the data path of each preprocessed shard to the FE and schedules the relevant BE to execute the Push task.
6. The BE reads the data and converts it to the Doris underlying storage format.
7. The FE schedules the effective version to complete the import task.

### Global Dictionary

#### Applicable Scenarios

Currently, the Bitmap column in Doris is implemented using the Roaringbitmap library. The input data type of Roaringbitmap can only be integer, so if you want to perform precomputation on the Bitmap column during the import process, you need to convert the input data type to integer.

In the existing import process of Doris, the data structure of the global dictionary is implemented based on Hive tables, which stores the mapping from original values to encoded values.

#### Construction Process

1. Read data from the upstream data source and generate a Hive temporary table, denoted as hive_table.
2. Extract the deduplicated values of the columns to be deduplicated from hive_table and generate a new Hive table, denoted as distinct_value_table.
3. Create a new global dictionary table, denoted as dict_table, with one column for the original values and one column for the encoded values.
4. Perform a Left Join between distinct_value_table and dict_table to compute the newly added set of deduplicated values, then encode this set using a window function. At this point, the original values of the deduplicated columns have an additional column of encoded values, and finally write the data of these two columns back to dict_table.
5. Join dict_table with hive_table to complete the work of replacing the original values in hive_table with integer encoded values.
6. hive_table is read by the next data preprocessing process and imported into Doris after computation.
   Data Preprocessing (DPP)
   Basic Process
7. Read data from the data source. The upstream data source can be HDFS files or Hive tables.
8. Perform field mapping, expression evaluation, and generate the bucket field bucket_id based on partition information for the read data.
9. Generate a RollupTree based on the Rollup metadata of the Doris table.
10. Traverse the RollupTree and perform hierarchical aggregation operations. The Rollup at the next level can be computed from the Rollup at the previous level.
11. After each aggregation calculation is completed, the data is bucketed according to bucket_id and written to HDFS.
12. Subsequently, the Broker pulls the files from HDFS and imports them into Doris BE.

#### Hive Bitmap UDF

Spark supports importing the Bitmap data generated by Hive directly into Doris. For details, see the hive-bitmap-udf document.

## Quick Start

- Read data from a file

  - Target table schema

    ```sql
    CREATE TABLE IF NOT EXISTS tbl_test_spark_load (
      c_int int(11) NULL,
      c_char char(15) NULL,
      c_varchar varchar(100) NULL,
      c_bool boolean NULL,
      c_tinyint tinyint(4) NULL,
      c_smallint smallint(6) NULL,
      c_bigint bigint(20) NULL,
      c_largeint largeint(40) NULL,
      c_float float NULL,
      c_double double NULL,
      c_decimal decimal(6, 3) NULL,
      c_decimalv3 decimal(6, 3) NULL,
      c_date date NULL,
      c_datev2 date NULL,
      c_datetime datetime NULL,
      c_datetimev2 datetime NULL
    )
    DISTRIBUTED BY HASH(c_int) BUCKETS 1
    PROPERTIES (
    "replication_num" = "1"
    )
    ```

  - Write the configuration file

    ```json
    {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-file",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "tbl_test_spark_load": {
          "type": "file",
          "paths": ["hdfs://hadoop:8020/data/data.txt"],
          "format": "csv",
          "fieldSep": ",", "columns":"c_int,c_char,c_varchar,c_bool,c_tinyint,c_smallint,c_bigint,c_largeint,c_float,c_double,c_decimal,c_decimalv3,c_date,c_datev2,c_datetime,c_datetimev2"
          }
        },
        "spark": {
          "sparkHome": "/opt/spark",
          "master": "yarn",
          "deployMode": "cluster",
          "properties": {
            "spark.executor.memory": "2G",
            "spark.executor.cores": 1,
            "spark.num.executor": 4
          }
        },
        "hadoopProperties": {
          "fs.defaultFS": "hdfs://hadoop:8020",
          "hadoop.username": "hadoop"
        }
    }
    ```

  - Start the Spark Load job

      ```shell
      $ cd spark-load-dir
      $ sh ./bin/spark-load.sh -c config.json
      ```

  - View the job execution result

      ```sql
      mysql> show load;
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | JobId | Label                 | State    | Progress      | Type      | EtlInfo | TaskInfo                                            | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL                 | JobDetails                                                                                                                              | TransactionId | ErrorTablets | User | Comment |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | 38104 | spark-load-test-file | FINISHED | 100.00% (0/0) | INGESTION | NULL    | cluster:N/A; timeout(s):86400; max_filter_ratio:0.0 | NULL     | 2024-08-16 14:47:22 | 2024-08-16 14:47:22 | 2024-08-16 14:47:58 | 2024-08-16 14:47:58 | 2024-08-16 14:48:01 | app-1723790846300 | {"Unfinished backends":{"0-0":[]},"ScannedRows":0,"TaskNumber":1,"LoadBytes":0,"All backends":{"0-0":[-1]},"FileNumber":0,"FileSize":0} | 27024         | {}           | root |         |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      ```

- Read data from a Hive table

    - Hive table schema

      ```hive
      CREATE TABLE IF NOT EXISTS tbl_test_spark_load (
        c_int int,
        c_char char,
        c_varchar varchar,
        c_bool boolean,
        c_tinyint tinyint,
        c_smallint smallint,
        c_bigint bigint,
        c_largeint largeint,
        c_float float,
        c_double double,
        c_decimal decimal(6, 3),
        c_decimalv3 decimal(6, 3),
        c_date date,
        c_datev2 date,
        c_datetime datetime,
        c_datetimev2 datetime
      )
      STORED AS TEXTFILE
      ```

    - Target table schema

      ```sql
      CREATE TABLE IF NOT EXISTS tbl_test_spark_load (
        c_int int(11) NULL,
        c_char char(15) NULL,
        c_varchar varchar(100) NULL,
        c_bool boolean NULL,
        c_tinyint tinyint(4) NULL,
        c_smallint smallint(6) NULL,
        c_bigint bigint(20) NULL,
        c_largeint largeint(40) NULL,
        c_float float NULL,
        c_double double NULL,
        c_decimal decimal(6, 3) NULL,
        c_decimalv3 decimal(6, 3) NULL,
        c_date date NULL,
        c_datev2 date NULL,
        c_datetime datetime NULL,
        c_datetimev2 datetime NULL
      )
      DISTRIBUTED BY HASH(c_int) BUCKETS 1
      PROPERTIES (
      "replication_num" = "1"
      )
      ```

    - Write the configuration file

      ```json
      {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-hive",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "tbl_test_spark_load": {
            "type": "hive",
            "hiveMetastoreUris": "thrift://hadoop:9083",
            "hiveDatabase": "test",
            "hiveTable": "tbl_test_spark_load"
            }
          },
          "spark": {
          "sparkHome": "/opt/spark",
          "master": "yarn",
          "deployMode": "cluster",
          "properties": {
            "spark.executor.cores": "1",
            "spark.executor.memory": "2GB",
            "spark.executor.instances": "1"
          }
        },
        "hadoopProperties": {
          "fs.defaultFS": "hdfs://hadoop:8020",
          "hadoop.username": "hadoop"
        }
      }
      ```

    - Start the Spark Load job

      ```shell
      $ cd spark-load-dir
      $ sh ./bin/spark-load.sh -c config.json
      ```

    - View the job execution result

      ```sql
      mysql> show load;
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | JobId | Label                 | State    | Progress      | Type      | EtlInfo | TaskInfo                                            | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL                 | JobDetails                                                                                                                              | TransactionId | ErrorTablets | User | Comment |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | 38104 | spark-load-test-hive | FINISHED | 100.00% (0/0) | INGESTION | NULL    | cluster:N/A; timeout(s):86400; max_filter_ratio:0.0 | NULL     | 2024-08-16 14:47:22 | 2024-08-16 14:47:22 | 2024-08-16 14:47:58 | 2024-08-16 14:47:58 | 2024-08-16 14:48:01 | app-1723790846300 | {"Unfinished backends":{"0-0":[]},"ScannedRows":0,"TaskNumber":1,"LoadBytes":0,"All backends":{"0-0":[-1]},"FileNumber":0,"FileSize":0} | 27024         | {}           | root |         |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      ```

## Reference Manual

### Spark Load Client

#### Directory Structure

```text
├── app
│   └── spark-load-dpp-1.0-SNAPSHOT.jar
├── bin
│   └── spark-load.sh
└── lib
```

- **app**: The application package of spark dpp
- **bin**: The startup script of spark load
- **lib**: Other dependency packages

#### Startup Script Parameters

- `--config`|`-c`: Specifies the configuration file path
- `--recovery`|`-r`: Whether to start in recovery mode

### Cancel Import

When the Spark Load job status is not `CANCELLED` or `FINISHED`, you can manually cancel it.

You can cancel an import task by terminating the process of the Spark Load startup script, or by executing the `CANCEL LOAD` command in Doris.

When canceling through `CANCEL LOAD`, you need to specify the `Label` of the import task to be canceled. Run `HELP CANCEL LOAD` to view the syntax of the cancel import command.

### Configuration Parameters

#### General Configuration

| Parameter Name | Required | Default | Description                                                |
|-------------|------|-----|--------------------------------------------------------|
| feAddresses | Yes  | -   | Doris FE HTTP address, format: fe_ip:http_port, [fe_ip:http_port] |
| label       | Yes  | -   | Import job label                                       |
| user        | Yes  | -   | Doris username                                         |
| password    | Yes  | -   | Doris password                                         |
| database    | Yes  | -   | Doris database name                                    |
| workingDir  | Yes  | -   | Spark Load working path                                |

#### Task Configuration

| Parameter Name | Sub-parameter -1 | Sub-parameter -2 | Required | Default | Description                                       |
|-----------|-------|-------------------|------|-------|--------------------------------------------------|
| loadTasks |       |                   | Yes  | -     | Import task job                                  |
|           | Target table name |       | Yes  | -     | Name of the Doris table to be imported           |
|           |       | type              | Yes  | -     | Task type: file - read file task, hive - read Hive table task |
|           |       | paths             | Yes  | -     | Array of file paths, only valid for read file tasks (type=file) |
|           |       | format            | Yes  | -     | File type, supported types: csv, parquet, orc, only valid for read file tasks (type=file) |
|           |       | fieldSep          | No   | `\t`  | Column separator, only valid for read file tasks (type=file) when the file type is csv (format=csv) |
|           |       | lineDelim         | No   | `\n`  | Line separator, only valid for read file tasks (type=file) when the file type is csv (format=csv) |
|           |       | hiveMetastoreUris | Yes  | -     | Hive metastore service address                   |
|           |       | hiveDatabase      | Yes  | -     | Hive database name                               |
|           |       | hiveTable         | Yes  | -     | Hive table name                                  |
|           |       | columns           | No   | Target table columns | Source data column names, only valid for read file tasks (type=file) |
|           |       | columnMappings    | No   | -     | Column mappings                                  |
|           |       | where             | No   | -     | Filter condition                                 |
|           |       | targetPartitions  | No   | -     | Target import partitions                         |

#### Spark Parameter Configuration

| Parameter Name | Sub-parameter -1 | Required | Default | Description                                     |
|--------|------------|------|--------|-------------------------------------------|
| spark  |            | Yes  | -      | Import task job                           |
|        | sparkHome  | Yes  | -      | Spark deployment path                     |
|        | master     | Yes  | -      | Spark Master, supported types: yarn, standalone, local |
|        | deployMode | No   | client | Spark deployment mode, supported types: cluster, client |
|        | properties | Yes  | -      | Spark job properties                      |

#### Hadoop Parameter Configuration

| Parameter Name | Required | Default | Description                                 |
|--------- |---------| ------ | ----------------------------------------- |
| hadoop   | Yes     | -      | Hadoop configuration, including HDFS-related and Yarn configuration |

#### Environment Parameter Configuration

| Parameter Name | Required | Default | Description |
| -------- |--------| ------ | -------- |
| env      | No     | -      | Environment variables |

## Import Examples

### Import Bitmap Type Data

- Import by building a global dictionary

    - Hive table

      ```hive
      CREATE TABLE IF NOT EXISTS hive_t1
      (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid VARCHAR(100)
      )
      STORED AS TEXTFILE
      ```

    - Doris table

      ```sql
      CREATE TABLE IF NOT EXISTS doris_t1 (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid BITMAP
      ) ENGINE=OLAP
      DUPLICATE KEY (k1)
      DISTRIBUTED BY HASH(k1) BUCKETS 1
      PROPERTIES (
      "replication_num" = "1"
      )
      ```

    - Configuration file

      ```json
      {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-bitmap-dict",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "doris_t1": {
            "type": "hive",
            "hiveMetastoreUris": "thrift://hadoop:9083",
            "hiveDatabase": "test",
            "hiveTable": "hive_t1",
            "columnMappings": ["uuid=bitmap_dict(uuid)"]
          }
        },
        "spark": {
          "sparkHome": "/opt/spark",
          "master": "yarn",
          "deployMode": "cluster",
          "properties": {
            "spark.executor.cores": "1",
            "spark.executor.memory": "2GB",
            "spark.executor.instances": "1"
            }
        },
        "hadoopProperties": {
          "fs.defaultFS": "hdfs://hadoop:8020",
          "hadoop.username": "hadoop"
        }
      }
      ```


- Import Hive Binary type data after processing with Bitmap UDF

    - Hive table

      ```hive
      CREATE TABLE IF NOT EXISTS hive_t1
      (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid VARCHAR(100)
      )
      STORED AS TEXTFILE
      ```

    - Doris table
    
      ```sql
      CREATE TABLE IF NOT EXISTS doris_t1 (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid BITMAP
      ) ENGINE=OLAP
      DUPLICATE KEY (k1)
      DISTRIBUTED BY HASH(k1) BUCKETS 1
      PROPERTIES (
      "replication_num" = "1"
      )
      ```
    
    - Configuration file
    
      ```json
      {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-bitmap-binary",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "doris_tb1": {
            "type": "hive",
            "hiveMetastoreUris": "thrift://hadoop:9083",
            "hiveDatabase": "test",
            "hiveTable": "hive_t1",
            "columnMappings": ["uuid=binary_bitmap(uuid)"]
          }
        },
        "spark": {
          "sparkHome": "/opt/spark",
          "master": "yarn",
          "deployMode": "cluster",
          "properties": {
            "spark.executor.cores": "1",
            "spark.executor.memory": "2GB",
            "spark.executor.instances": "1"
          }
        },
        "hadoopProperties": {
          "fs.defaultFS": "hdfs://hadoop:8020",
          "hadoop.username": "hadoop"
        }
      }
      ```
