---
{
  "title": "Spark Load",
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

# Spark Load

Spark Load uses external Spark resources to pre-process the imported data, improve the import performance of Doris large
data volumes and save the computing resources of the Doris
cluster. It is mainly used for the initial migration and the scenario of importing large data volumes into Doris.

Spark Load uses the resources of the Spark cluster to sort the data to be imported. Doris BE directly writes files,
which can greatly reduce the resource usage of the Doris
cluster. It has a good effect on reducing the resource usage and load of the Doris cluster for the migration of
historical massive data.

Users need to create and execute import tasks through the Spark Load client. The execution status of the task will be
output to the console, and the import results can also be viewed through SHOW LOAD.

:::caution CAUTION

This feature is experimental and is currently only available in the master branch.
The current version only supports storage computing coupled clusters.
If you encounter any problems during use, please provide feedback through the mailing group, [GitHub Issue](https://github.com/apache/doris/issues), etc.

:::

## Applicable scenarios

- The source data is in a storage system accessible to Spark, such as HDFS.

- The data volume is at the level of tens of GB to TB.

:::caution CAUTION
For unique key models, only tables in merge-on-read mode are currently supported.  
:::

## Basic Principles

### Basic Process

The execution of the Spark Load task is mainly divided into the following 5 stages:

1. The user writes a configuration file to configure the source file/table to be read, as well as the target table and
   other information

2. The Spark Load client creates an import job to FE and starts a transaction, and FE returns the target table metadata
   to the client

3. The Spark Load client submits the ETL task to the Spark cluster for execution.

4. The Spark cluster executes ETL to complete the preprocessing of the imported data, including global dictionary
   construction (Bitmap type), partitioning, sorting, aggregation, etc.

5. After the ETL task is completed, the Spark Load client synchronizes the preprocessed data path of each shard to FE,
   and schedules the relevant BE to execute the Push task.

6. BE reads the data and converts it into the Doris underlying storage format.

7. FE schedules the effective version to complete the import task.

### Global dictionary

#### Applicable scenarios

Currently, the Bitmap column in Doris is implemented using the class library Roaringbitmap, and the input data type of
Roaringbitmap can only be integer. Therefore, if you want to implement pre-calculation of the Bitmap column in the
import process, you need to convert the input data type into an integer.

In Doris's existing import process, the data structure of the global dictionary is based on the Hive table, which saves
the mapping from the original value to the encoded value.

#### Construction process

1. Read the data from the upstream data source and generate a Hive temporary table, recorded as hive_table.

2. Extract the deduplication values of the fields to be deduplicated from hive_table and generate a new Hive table,
   recorded as distinct_value_table.

3. Create a new global dictionary table, recorded as dict_table, with one column for the original value and one column
   for the encoded value.
4. Do a Left Join of distinct_value_table and dict_table to calculate the newly added set of deduplicated values, and
   then use the window function to encode this set. At this time, the original value of the deduplicated column has an
   additional column of encoded values, and finally write the data of these two columns back to
   dict_table.
5. Join dict_table with hive_table to complete the work of replacing the original values ​​in hive_table with integer
   encoded values.
6. hive_table will be read by the next step of data preprocessing and imported into Doris after calculation.
   Data Preprocessing (DPP)
   Basic Process
7. Read data from the data source. The upstream data source can be an HDFS file or a Hive table.
8. Perform field mapping, expression calculation, and generate bucket field bucket_id based on partition information for
   the read data.
9. Generate RollupTree based on the Rollup metadata of the Doris table.
10. Traverse the RollupTree and perform hierarchical aggregation operations. The Rollup of the next level can be
    calculated from the Rollup of the previous level.
11. After each aggregation calculation, the data will be bucketed according to bucket_id and written to HDFS.
12. The subsequent Broker will pull the files in HDFS and import them into Doris Be.

#### Hive Bitmap UDF

Spark supports importing the Bitmap data generated by Hive directly into Doris. See hive-bitmap-udf document for details.

### Quick start


- Read data from file

    - Target table structure

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

    - Write configuration files

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
              "paths": [
                "hdfs://hadoop:8020/data/data.txt"
              ],
              "format": "csv",
              "fieldSep": ",",
              "columns": "c_int,c_char,c_varchar,c_bool,c_tinyint,c_smallint,c_bigint,c_largeint,c_float,c_double,c_decimal,c_decimalv3,c_date,c_datev2,c_datetime,c_datetimev2"
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

  - Start Spark Load job

    ``` shell
        $ cd spark-load-dir
        $ sh./bin/spark-load.sh - c config.json
    ```

  - View job execution results

    ```sql
    mysql
    > show load;
    +-------+-----------------------+-----------+---------------+---------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
    | JobId | Label | State | Progress | Type | EtlInfo | TaskInfo | ErrorMsg | CreateTime | EtlStartTime | EtlFinishTime | LoadStartTime | LoadFinishTime | URL | JobDetails | TransactionId | ErrorTablets | User | Comment |--+---------------------+---------------------+--- ------------------+---------------------------------- -------------------------------------------------- -------------------------------------------------- ------+---------------+--------------+------+----- ----+ | 38104 | spark-load-test-hvie | FINISHED | 100.00% (0/0) | INGESTION | NULL | cluster:N/A; timeout(s):86400; max_filter_ratio:0.0 | NULL | 2024-08-16 14 :47:22 | 2024-08-16 14:47:22 | 2024-08-16 14:47:58 | 2024-08-16 14:47:58 | 2024-08-16 14:48:01 | app-1723790846300 | {"Unfinished backends":{"0-0":[]},"ScannedRows":0,"TaskNumber":1,"LoadBytes":0,"All backends":{"0-0":[-1 ]},"FileNumber":0,"FileSize":0} | 27024 | {} | root | |
    +-------+----------------- ------+----------+---------------+-----------+---- -----+-------------------------------------------- ---------+----------+---------------------+------- ------------+---------------------+------------- --------+---------------------+------------------- --+----------------------------------------------- -------------------------------------------------- ----------------------------------------+--------- ------+--------------+------+---------+
    ```

## Reference manual

### Spark Load client

#### Directory structure

```text
├── app
│ └── spark-load-dpp-1.0-SNAPSHOT.jar
├── bin
│ └── spark-load.sh
└── lib
```

- **app**: application package of spark dpp
- **bin**: spark load startup script
- **lib**: other dependent packages

#### Startup script parameters

- `--config`|`-c`: specify the configuration file address
- `--recovery`|`-r`: whether to start in recovery mode

### Cancel load

When the Spark Load job status is not `CANCELLED` or `FINISHED`, it can be manually canceled by the user.

The user can cancel the load task by ending the process of the Spark Load startup script, or by executing the `CANCEL
LOAD` command in Doris.

Through CANCEL When canceling LOAD, you need to specify the Label of the import task to be canceled. To view the cancel
import command syntax, execute `HELP CANCEL LOAD`.

### Configuration parameters

#### General configuration

| Name        | Required | Default value| Parameter description                                             |
|-------------|----------|-----|-------------------------------------------------------------------|
| feAddresses | yes      | - | Doris FE HTTP address, format: fe_ip:http_port, [fe_ip:http_port] |
| label       | yes      | - | Load job label                                                    |
| user        | yes      | - | Doris Username                                                    |
| Password    | Yes      | - | Doris Password                                                    |
| Database    | Yes      | - | Doris Database Name                                               |
| WorkingDir  | Yes      | - | Spark Load Working Path                                           |


#### Task Configuration

| Name      | Suboption-1     | Suboption-2    | Required | Default value        | Description                                                                                   |
|-----------|-------------------|-------------------|----------|----------------------|-----------------------------------------------------------------------------------------------|
| loadTasks |                   |                   | Yes      | -                    | Import task job                                                                               |
|           | Target table name |                   | Yes      | -                    | Imported Doris table name                                                                     |
|           |                   | type              | Yes      | -                    | Task type: file - Read file task, hive - Read Hive table task                                 |
|           |                   | paths             | Yes      | -                    | File path array, only valid for read file task (type=file)                                    |
|           |                   | format            | Yes      | -                    | File type, supported types: csv, parquet, orc, only valid for read file task (type=file)      |
|           |                   | fieldSep          | No       | `\t`                 | Column delimiter, only valid for read file task (type=file) and file type is csv (format=csv) |
|           |                   | lineDelim         | No       | `\n`                 | Row delimiter, only valid for read file task (type=file) and file type is csv (format=csv)    |
|           |                   | hiveMetastoreUris | Yes      | -                    | Hive Metadata service address                                                                 |
|           |                   | hiveDatabase      | Yes      | -                    | Hive database name                                                                            |
|           |                   | hiveTable         | Yes      | -                    | Hive data table name                                                                          |
|           |                   | columns           | No       | Target table columns | Source data column names, valid only for reading file tasks (type=file)                       |
|           |                   | columnMappings    | No       | -                    | Column mapping                                                                                |
|           |                   | where             | No       | -                    | Filter conditions                                                                             |
|           |                   | targetPartitions  | No       | -                    | Target import partition                                                                       |

#### Spark parameter configuration

| Name  | Suboption | Required | Default value | Description                                                 |
|-------|--------------|----------|---------------|-------------------------------------------------------------|
| spark |              | Yes      | -             | Import task job                                             |
|       | sparkHome    | Yes      | -             | Spark deployment path                                       |
|       | master       | Yes      | -             | Spark Master, supported types are: yarn, standalone, local  |
|       | deployMode   | No       | client        | Spark deployment mode, supported types are: cluster, client |
|       | properties   | Yes      | -             | Spark job properties                                        |

#### Hadoop parameter configuration

| Name   | Required | Default value | Parameter description                                               |
|--------|----------|---------------|---------------------------------------------------------------------|
| hadoop | Yes      | -             | Hadoop configuration, including HDFS-related and Yarn configuration |

#### Environment parameter configuration

| Name  | Required | Default value | Parameter description |
|-------|----------|---------------|-----------------------|
| env   | No       | -             | Environment variables |

## Load example

### Load Bitmap type data 

- Load by building a global dictionary

  - Hive table

    ```hiveql
    CREATE TABLE IF NOT EXISTS hive_t1
    (
       k1INT,
       K2   SMALLINT,
       k3   VARCHAR(50),
       uuid VARCHAR(100)
    ) STORED AS TEXTFILE 
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
    PROPERTIES ( "replication_num" = "1" ) 
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
          "columnMappings": [
            "uuid=bitmap_dict(uuid)"
          ]
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

- Load Hive Binary data after processing with Bitmap UDF

  - Hive table

    ```hiveql 
    CREATE TABLE IF NOT EXISTS hive_t1 (
    k1 INT, 
    K2 SMALLINT, 
    k3 VARCHAR(50), 
    uuid VARCHAR(100) 
    ) STORED AS TEXTFILE 
    ```

  - Doris table

    ```sql 
    CREATE TABLE IF NOT EXISTS doris_t1
    (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid BITMAP
    ) ENGINE=OLAP DUPLICATE KEY(k1)
    DISTRIBUTED BY HASH(k1) BUCKETS 1
    PROPERTIES
    (
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
      "workingDir": "hdfs: //hadoop:8020/spark-load",
      "loadTasks": {
        "doris_tb1": {
          "type": "hive",
          "hiveMetastoreUris": "thrift://hadoop:9083",
          "hiveDatabase": "test",
          "hiveTable": "hive_t1",
          "columnMappings": [
            "uuid=binary_bitmap(uuid)"
          ]
        }
      },
      "spark": {
        "sparkHome": "/opt/spark",
        "master": "yarn",
        "deployMode": "cluster",
        "properties": {
          "spark.executor.cores": "1",
          "spark.executor.memory": "2GB ",
          "spark.executor.instances": "1"
        }
      },
      "hadoopProperties": {
        "fs.defaultFS": "hdfs://hadoop:8020",
        "hadoop.username": "hadoop"
      }
    }
    ```