---
{
    "title": "Iceberg",
    "language": "zh-CN"
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

自 2.1.3 版本开始，Apache Doris 支持对 Iceberg 的 DDL 和 DML 操作。用户可以直接通过 Apache Doris 在 Iceberg 中创建库表，并将数据写入到 Iceberg 表中。通过该功能，用户可以通过 Apache Doris 对 Iceberg 进行完整的数据查询和写入操作，进一步帮助用户简化湖仓一体架构。

本文介绍在 Apache Doris 中支持的 Iceberg 操作，语法和使用须知。

:::tip
这是一个实验功能。
:::

:::tip
使用前，请先设置：
<br />
set global enable_nereids_planner = true;
set global enable_fallback_to_original_planner = false;
<br />
从老版本升级上来的集群，这些参数可能有变化。
:::

## 元数据创建与删除

### Catalog

- 创建

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
        
    上面主要演示了如何在 Apache Doris 中创建 HMS Iceberg Catalog。Apache Doris 目前支持多种类型的 Iceberg Catalog。更多配置，请参阅 [Iceberg Catalog](../datalake-analytics/iceberg.md)

    注意，如果需要通过 Apache Doris 通过 HMS Catalog 创建 Iceberg 表或写入数据，需要在 Catalog 属性中显式增加 `fs.defaultFS` 属性以及 `warehouse` 属性。如果创建 Catalog 仅用于查询，则该参数可以省略。

- 删除

    ```
    DROP CATALOG [IF EXISTS] iceberg;
    ```
    
    删除 Catalog 并不会删除 Iceberg 中的任何库表信息。仅仅是在 Apache Doris 中移除了对这个 Iceberg Catalog 的映射。
    
### Database

- 创建

    可以通过 `SWITCH` 语句切换到对应的 Catalog 下，执行 `CREATE DATABASE` 语句：
        
    ```
    SWITCH iceberg;
    CREATE DATABASE [IF NOT EXISTS] iceberg_db;
    ```
        
    也可以使用全限定名创建，或指定 location，如：
        
    ```
    CREATE DATABASE [IF NOT EXISTS] iceberg.iceberg_db;
    ```
        
    之后可以通过 `SHOW CREATE DATABASE` 命令可以查看 Database 的相关信息：
        
    ```
    mysql> SHOW CREATE DATABASE iceberg_db;
    +------------+------------------------------+
    | Database   | Create Database              |
    +------------+------------------------------+
    | iceberg_db | CREATE DATABASE `iceberg_db` |
    +------------+------------------------------+
    ```

- 删除

    ```
    DROP DATABASE [IF EXISTS] iceberg.iceberg_db;
    ```
        
    :::caution 注意
    对于 Iceberg Database，必须先删除这个 Database 下的所有表后，才能删除 Database，否则会报错。这个操作会同步删除 Iceberg 中对应的 Database。
    :::
    
### Table

- 创建

    Apache Doris 支持在 Iceberg 中创建分区或非分区表。
    
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
    
    创建后，可以通过 `SHOW CREATE TABLE` 命令查看 Iceberg 的建表语句。

- 列类型

    在 Apache Doris 中创建 Iceberg 表所使用的列类型，和 Iceberg 中的列类型对应关系如下
    
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
    
    - 注意：目前只支持这些数据类型，其它数据类型会报错。
    - 列类型暂时只能为默认的 Nullable，不支持 NOT NULL。
    - 插入数据后，如果类型不能够兼容，例如 `'abc'` 插入到数值类型，则会转为 null 值后插入。

- 删除

    可以通过 `DROP TABLE` 语句删除一个 Iceberg 表。当前删除表后，会同时删除数据，包括分区数据。

- 分区

    Iceberg 中的分区类型对应 Apache Doris 中的 List 分区。因此，在 Apache Doris 中 创建 Iceberg 分区表，需使用 List 分区的建表语句，但无需显式的枚举各个分区。在写入数据时，Apache Doris 会根据数据的值，自动创建对应的 Iceberg 分区。

    - 支持创建单列或多列分区表。
    - 支持分区转换函数来支持 Iceberg 隐式分区以及分区演进的功能。具体 Iceberg 分区转换函数可以查看 [Iceberg partition transforms](https://iceberg.apache.org/spec/#partition-transforms)
      - `year(ts)` 或者 `years(ts)`
      - `month(ts)` 或者 `months(ts)`
      - `day(ts)` 或者 `days(ts)` 或者 `date(ts)`
      - `hour(ts)` 或者 `hours(ts)` 或者 `date_hour(ts)`
      - `bucket(N, col)`
      - `truncate(L, col)`
    
- 文件格式

    - Parquet（默认）
    - ORC

- 压缩格式

    - Parquet：snappy，zstd（默认），plain。（Plain 就是不采用压缩）
    - ORC：snappy，zlib（默认），zstd，plain。（Plain 就是不采用压缩）

- 存储介质

    - HDFS
    - 对象存储

## 数据操作

可以通过 INSERT 语句将数据写入到 Iceberg 表中。

支持写入到由 Apache Doris 创建的 Iceberg 表，或者 Iceberg 中已存在的且格式支持的表。

对于分区表，会根据数据，自动写入到对应分区，或者创建新的分区。

目前不支持指定分区写入。

### INSERT

INSERT 操作会数据以追加的方式写入到目标表中。

```
INSERT INTO iceberg_tbl values (val1, val2, val3, val4);
INSERT INTO iceberg.iceberg_db.iceberg_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO iceberg_tbl(col1, col2) values (val1, val2);
INSERT INTO iceberg_tbl(col1, col2, partition_col1, partition_col2) values (1, 2, "beijing", "2023-12-12");
```

### INSERT OVERWRITE

INSERT OVERWRITE 会使用新的数据完全覆盖原有表中的数据。

```
INSERT OVERWRITE TABLE VALUES(val1, val2, val3, val4)
INSERT OVERWRITE TABLE iceberg.iceberg_db.iceberg_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;
```

### CTAS(CREATE TABLE AS SELECT)
    
可以通过 `CTAS(CREATE TABLE AS SELECT)` 语句创建 Iceberg 表并写入数据：
    
```
CREATE TABLE iceberg_ctas ENGINE=iceberg AS SELECT * FROM other_table;
```
    
CTAS 支持指定文件格式、分区方式等信息，如：
    
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

## 异常数据和数据转换

TODO

### HDFS 文件操作

在 HDFS 上的 Iceberg 表数据会写入到最终目录，提交 Iceberg 元数据进行管理。

写入的数据文件名称格式为：`<query-id>_<uuid>-<index>.<compress-type>.<file-type>`

### 对象存储文件操作

TODO

## 相关参数

### FE

TODO

### BE

| 参数名称 | 默认值 | 描述 |
| --- | --- | --- |
| `iceberg_sink_max_file_size` | 最大的数据文件大小。当写入数据量超过该大小后会关闭当前文件，滚动产生一个新文件继续写入。| 1GB |
| `table_sink_partition_write_max_partition_nums_per_writer` | BE 节点上每个 Instance 最大写入的分区数目。 |  128 |
| `table_sink_non_partition_write_scaling_data_processed_threshold` | 非分区表开始 scaling-write 的数据量阈值。每增加 `table_sink_non_partition_write_scaling_data_processed_threshold` 数据就会发送给一个新的 writer(instance) 进行写入。scaling-write 机制主要是为了根据数据量来使用不同数目的 writer(instance) 来进行写入，会随着数据量的增加而增大写入的 writer(instance) 数目，从而提高并发写入的吞吐。当数据量比较少的时候也会节省资源，并且尽可能地减少产生的文件数目。 | 25MB |
| `table_sink_partition_write_min_data_processed_rebalance_threshold` | 分区表开始触发重平衡的最少数据量阈值。如果 `当前累积的数据量` - `自从上次触发重平衡或者最开始累积的数据量` >= `table_sink_partition_write_min_data_processed_rebalance_threshold`，就开始触发重平衡机制。如果发现最终生成的文件大小差异过大，可以调小改阈值来增加均衡度。当然过小的阈值会导致重平衡的成本增加，可能会影响性能。 | 25MB |
| `table_sink_partition_write_min_partition_data_processed_rebalance_threshold` | 分区表开始进行重平衡时的最少的分区数据量阈值。如果 `当前分区的数据量` >= `阈值` * `当前分区已经分配的 task 数目`，就开始对该分区进行重平衡。如果发现最终生成的文件大小差异过大，可以调小改阈值来增加均衡度。当然过小的阈值会导致重平衡的成本增加，可能会影响性能。 | 15MB |

