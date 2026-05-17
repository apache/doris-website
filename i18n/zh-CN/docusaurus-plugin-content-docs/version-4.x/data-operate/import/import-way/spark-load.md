---
{
    "title": "Spark Load",
    "language": "zh-CN",
    "description": "Spark Load 通过外部的 Spark 资源实现对导入数据的预处理，提高 Doris 大数据量的导入性能并且节省 Doris 集群的计算资源。主要用于初次迁移，大数据量导入 Doris 的场景。"
}
---

# Spark Load

Spark Load 通过外部的 Spark 资源实现对导入数据的预处理，提高 Doris 大数据量的导入性能并且节省 Doris
集群的计算资源。主要用于初次迁移，大数据量导入 Doris 的场景。

Spark Load 是利用了 Spark 集群的资源对要导入的数据的进行了排序，Doris BE 直接写文件，这样能大大降低 Doris
集群的资源使用，对于历史海量数据迁移降低 Doris 集群资源使用及负载有很好的效果。

用户需要通过 Spark Load 客户端创建并执行导入任务，任务的执行情况会输出至控制台，也可以通过 SHOW LOAD 查看导入结果。

:::caution 注意

此功能为实验性功能，目前仅 master 分支可用。
当前版本仅支持存算一体集群。
您在使用过程中如遇到任何问题，欢迎通过邮件组、[GitHub Issue](https://github.com/apache/doris/issues) 等方式进行反馈。

:::

## 使用场景

- 源数据在 Spark 可以访问的存储系统中，如 HDFS。
- 数据量在 几十 GB 到 TB 级别。

:::caution 注意
对于主键模型，目前只支持读时合并 (merge-on-read) 模式的表。  
:::

## 基本原理

### 基本流程

Spark Load 任务的执行主要分为以下 5 个阶段：

1. 用户编写配置文件，配置读取的源文件/表，以及目标表等信息
2. Spark Load 客户端向 FE 创建导入作业并开启事务，FE 向客户端返回目标表元数据
3. Spark Load 客户端提交 ETL 任务到 Spark 集群执行。
4. Spark 集群执行 ETL 完成对导入数据的预处理，包括全局字典构建（Bitmap 类型）、分区、排序、聚合等。
5. ETL 任务完成后，Spark Load 客户端向 FE 同步预处理过的每个分片的数据路径，并调度相关的 BE 执行 Push 任务。
6. BE 读取数据，转化为 Doris 底层存储格式。
7. FE 调度生效版本，完成导入任务。

### 全局字典

#### 适用场景

目前 Doris 中 Bitmap 列是使用类库 Roaringbitmap 实现的，而 Roaringbitmap 的输入数据类型只能是整型，因此如果要在导入流程中实现对于
Bitmap 列的预计算，那么就需要将输入数据的类型转换成整型。

在 Doris 现有的导入流程中，全局字典的数据结构是基于 Hive 表实现的，保存了原始值到编码值的映射。

#### 构建流程

1. 读取上游数据源的数据，生成一张 Hive 临时表，记为 hive_table。
2. 从 hive_table 中抽取待去重字段的去重值，生成一张新的 Hive 表，记为 distinct_value_table。
3. 新建一张全局字典表，记为 dict_table，一列为原始值，一列为编码后的值。
4. 将 distinct_value_table 与 dict_table 做 Left Join，计算出新增的去重值集合，然后对这个集合使用窗口函数进行编码，此时去重列原始值就多了一列编码后的值，最后将这两列的数据写回
   dict_table。
5. 将 dict_table 与 hive_table 进行 Join，完成 hive_table 中原始值替换成整型编码值的工作。
6. hive_table 会被下一步数据预处理的流程所读取，经过计算后导入到 Doris 中。
   数据预处理 (DPP)
   基本流程
7. 从数据源读取数据，上游数据源可以是 HDFS 文件，也可以是 Hive 表。
8. 对读取到的数据进行字段映射，表达式计算以及根据分区信息生成分桶字段 bucket_id。
9. 根据 Doris 表的 Rollup 元数据生成 RollupTree。
10. 遍历 RollupTree，进行分层的聚合操作，下一个层级的 Rollup 可以由上一个层的 Rollup 计算得来。
11. 每次完成聚合计算后，会对数据根据 bucket_id 进行分桶然后写入 HDFS 中。
12. 后续 Broker 会拉取 HDFS 中的文件然后导入 Doris Be 中。

#### Hive Bitmap UDF

Spark 支持将 Hive 生成的 Bitmap 数据直接导入到 Doris。详见 hive-bitmap-udf 文档

## 快速上手

- 从文件读取数据

  - 目标表结构

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

  - 编写配置文件

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

  - 启动 Spark Load 作业

      ```shell
      $ cd spark-load-dir
      $ sh ./bin/spark-load.sh -c config.json
      ```

  - 查看作业执行结果

      ```sql
      mysql> show load;
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | JobId | Label                 | State    | Progress      | Type      | EtlInfo | TaskInfo                                            | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL                 | JobDetails                                                                                                                              | TransactionId | ErrorTablets | User | Comment |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | 38104 | spark-load-test-file | FINISHED | 100.00% (0/0) | INGESTION | NULL    | cluster:N/A; timeout(s):86400; max_filter_ratio:0.0 | NULL     | 2024-08-16 14:47:22 | 2024-08-16 14:47:22 | 2024-08-16 14:47:58 | 2024-08-16 14:47:58 | 2024-08-16 14:48:01 | app-1723790846300 | {"Unfinished backends":{"0-0":[]},"ScannedRows":0,"TaskNumber":1,"LoadBytes":0,"All backends":{"0-0":[-1]},"FileNumber":0,"FileSize":0} | 27024         | {}           | root |         |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      ```

- 从 Hive 表读取数据

    - Hive 表结构

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

    - 目标表结构

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

    - 编写配置文件

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

    - 启动 Spark Load 作业

      ```shell
      $ cd spark-load-dir
      $ sh ./bin/spark-load.sh -c config.json
      ```

    - 查看作业执行结果

      ```sql
      mysql> show load;
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | JobId | Label                 | State    | Progress      | Type      | EtlInfo | TaskInfo                                            | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL                 | JobDetails                                                                                                                              | TransactionId | ErrorTablets | User | Comment |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | 38104 | spark-load-test-hvie | FINISHED | 100.00% (0/0) | INGESTION | NULL    | cluster:N/A; timeout(s):86400; max_filter_ratio:0.0 | NULL     | 2024-08-16 14:47:22 | 2024-08-16 14:47:22 | 2024-08-16 14:47:58 | 2024-08-16 14:47:58 | 2024-08-16 14:48:01 | app-1723790846300 | {"Unfinished backends":{"0-0":[]},"ScannedRows":0,"TaskNumber":1,"LoadBytes":0,"All backends":{"0-0":[-1]},"FileNumber":0,"FileSize":0} | 27024         | {}           | root |         |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      ```

## 参考手册

### Spark Load 客户端

#### 目录结构

```text
├── app
│   └── spark-load-dpp-1.0-SNAPSHOT.jar
├── bin
│   └── spark-load.sh
└── lib
```

- **app**: spark dpp 的应用程序包
- **bin**: spark load 启动脚本
- **lib**: 其他依赖包

#### 启动脚本参数

- `--config`|`-c`: 指定配置文件地址
- `--recovery`|`-r`: 是否使用恢复模式启动

### 取消导入

当 Spark Load 作业状态不为 `CANCELLED` 或 `FINISHED` 时，可以被用户手动取消。

用户可以通过结束 Spark Load 启动脚本的进程来取消导入任务，或者通过在 Doris 执行 `CANCEL LOAD` 命令。

通过 `CANCEL LOAD` 取消时需要指定待取消导入任务的 `Label` 。取消导入命令语法可执行 `HELP CANCEL LOAD` 查看。

### 配置参数

#### 通用配置

| 参数名称        | 是否必须 | 默认值 | 参数说明                                                   |
|-------------|------|-----|--------------------------------------------------------|
| feAddresses | 是    | -   | Doris FE HTTP 地址，格式：fe_ip:http_port, [fe_ip:http_port] |
| label       | 是    | -   | 导入作业标签                                                 |
| user        | 是    | -   | Doris 用户名                                              |
| password    | 是    | -   | Doris 密码                                               |
| database    | 是    | -   | Doris 数据库名                                             |
| workingDir  | 是    | -   | Spark Load 工作路径                                        |

#### 任务配置

| 参数名称      | 子参数 -1 | 子参数 -2             | 是否必须 | 默认值   | 参数说明                                             |
|-----------|-------|-------------------|------|-------|--------------------------------------------------|
| loadTasks |       |                   | 是    | -     | 导入任务作业                                           |
|           | 目标表名称 |                   | 是    | -     | 导入的 Doris 表名称                                    |
|           |       | type              | 是    | -     | 任务类型：file - 读取文件任务，hive - 读取 Hive 表任务            |
|           |       | paths             | 是    | -     | 文件路径数组，仅读取文件任务有效（type=file）                      |
|           |       | format            | 是    | -     | 文件类型，支持的类型有：csv、parquet、orc，仅读取文件任务有效（type=file） |
|           |       | fieldSep          | 否    | `\t`  | 列分隔符，仅读取文件任务有效（type=file）且文件类型为 csv（format=csv） |
|           |       | lineDelim         | 否    | `\n`  | 行分隔符，仅读取文件任务有效（type=file）且文件类型为 csv（format=csv） |
|           |       | hiveMetastoreUris | 是    | -     | Hive 元数据服务地址                                     |
|           |       | hiveDatabase      | 是    | -     | Hive 数据库名称                                       |
|           |       | hiveTable         | 是    | -     | Hive 数据表名称                                       |
|           |       | columns           | 否    | 目标表列  | 源数据列名，仅读取文件任务有效（type=file）                       |
|           |       | columnMappings    | 否    | -     | 列映射                                              |
|           |       | where             | 否    | -     | 过滤条件                                             |
|           |       | targetPartitions  | 否    | -     | 目标导入分区                                           |

#### Spark 参数配置

| 参数名称   | 子参数 -1      | 是否必须 | 默认值    | 参数说明                                      |
|--------|------------|------|--------|-------------------------------------------|
| spark  |            | 是    | -      | 导入任务作业                                    |
|        | sparkHome  | 是    | -      | Spark 部署路径                                |
|        | master     | 是    | -      | Spark Master，支持的类型有：yarn、standalone、local |
|        | deployMode | 否    | client | Spark 部署模式，支持的类型有：cluster、client          |
|        | properties | 是    | -      | Spark 作业属性                                |

#### Hadoop 参数配置

| 参数名称 | 是否必须    | 默认值 | 参数说明                                       |
|--------- |---------| ------ | ----------------------------------------- |
| hadoop   | 是       | -      | Hadoop 配置，包括 HDFS 相关以及 Yarn 配置 |

#### 环境参数配置

| 参数名称 | 是否必须   | 默认值 | 参数说明 |
| -------- |--------| ------ | -------- |
| env      | 否      | -      | 环境变量 |

## 导入示例

### 导入 Bitmap 类型数据

- 通过构建全局字典导入

    - Hive 表

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

    - Doris 表

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

    - 配置文件

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


- 通过 Bitmap UDF 处理后导入 Hive Binary 类型数据

    - Hive 表

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

    - Doris 表
    
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
    
    - 配置文件
    
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