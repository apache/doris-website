---
{
    "title": "Hive",
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

自 2.1.3 版本开始，Apache Doris 支持对 Hive 的 DDL 和 DML 操作。用户可以直接通过 Apache Doris 在 Hive 中创建库表，并将数据写入到 Hive 表中。通过该功能，用户可以通过 Apache Doris 对 Hive 进行完整的数据查询和写入操作，进一步帮助用户简化湖仓一体架构。

本文介绍在 Apache Doris 中支持的 Hive 操作，语法和使用须知。

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
    CREATE CATALOG [IF NOT EXISTS] hive PROPERTIES (
        "type"="hms",
        "hive.metastore.uris" = "thrift://172.21.16.47:7004",
        "hadoop.username" = "hadoop",
        "fs.defaultFS" = "hdfs://172.21.16.47:4007"
    );
    ```
        
    注意，如果需要通过 Apache Doris 创建 Hive 表或写入数据，需要在 Catalog 属性中显式增加 `fs.defaultFS` 属性。如果创建 Catalog 仅用于查询，则该参数可以省略。
    
    更多参数，请参阅 [Hive Catalog](../datalake-analytics/hive.md)

- 删除

    ```
    DROP CATALOG [IF EXISTS] hive;
    ```
    
    删除 Catalog 并不会删除 hive 中的任何库表信息。仅仅是在 Apache Doris 中移除了对这个 Hive 集群的映射。
    
### Database

- 创建

    可以通过 `SWITCH` 语句切换到对应的 Catalog 下，执行 `CREATE DATABASE` 语句：
        
    ```
    SWITCH hive;
    CREATE DATABASE [IF NOT EXISTS] hive_db;
    ```
        
    也可以使用全限定名创建，或指定 location，如：
        
    ```
    CREATE DATABASE [IF NOT EXISTS] hive.hive_db;
        
    CREATE DATABASE [IF NOT EXISTS] hive.hive_db
    PROPERTIES ('location'='hdfs://172.21.16.47:4007/path/to/db/');
    ```
        
    之后可以通过 `SHOW CREATE DATABASE` 命令可以查看 Database 的 Location 信息：
        
    ```
    mysql> SHOW CREATE DATABASE hive_db;
    +----------+---------------------------------------------------------------------------------------------+
    | Database | Create Database                                                                             |
    +----------+---------------------------------------------------------------------------------------------+
    | hive_db  | CREATE DATABASE `hive_db` LOCATION 'hdfs://172.21.16.47:4007/usr/hive/warehouse/hive_db.db' |
    +----------+---------------------------------------------------------------------------------------------+
    ```

- 删除

    ```
    DROP DATABASE [IF EXISTS] hive.hive_db;
    ```
        
    :::caution 注意
    对于 Hive Database，必须先删除这个 Database 下的所有表后，才能删除 Database，否则会报错。这个操作会同步删除 Hive 中对应的 Database。
    :::
    
### Table

- 创建

    Apache Doris 支持在 Hive 中创建分区或非分区表。
    
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

    创建后，可以通过 `SHOW CREATE TABLE` 命令查看 Hive 的建表语句。
    
    注意，不同于 Hive 中的建表语句。在 Apache Doris 中创建 Hive 分区表时，分区列也必须写到 Table 的 Schema 中。同时，分区列必须在所有 Schema 的最后，且顺序保持一致。

    :::tip

    对于某些默认开启 ACID 事务特性的 Hive 集群，使用 Apache Doris 建表后，表属性 `transactional` 会为 `true`。而 Apache Doris 只支持部分 Hive 事务表的特性，因此可能会导致 Apache Doris 创建的 Hive，Apache Doris 本身无法读取的问题。因此，需要在建表的属性中，显式增加：`"transactional" = "false"`，来创建非事务的 Hive 表：

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

- 删除

    可以通过 `DROP TABLE` 语句删除一个 Hive 表。当前删除表后，会同时删除数据，包括分区数据。
    
- 列类型

    在 Apache Doris 中创建 Hive 表所使用的列类型，和 Hive 中的列类型对应关系如下
    
    | Apache Doris | Hive |
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
    
    - 列类型只能为默认的 Nullable，不支持  NOT NULL。
    - Hive 3.0 支持设置默认值。如果需要设置默认值，则需要再 Catalog 属性中显示的添加 `"hive.version" = "3.0.0"`
    - 插入数据后，如果类型不能够兼容，例如 `'abc'` 插入到数值类型，则会转为 null 值后插入。

- 分区

    Hive 中的分区类型对应 Apache Doris 中的 List 分区。因此，在 Apache Doris 中 创建 Hive 分区表，需使用 List 分区的建表语句，但无需显式的枚举各个分区。在写入数据时，Apache Doris 会根据数据的值，自动创建对应的 Hive 分区。

    支持创建单列或多列分区表。
    
- 文件格式

    - ORC（默认）
    - Parquet
    - Text （自 2.1.7 和 3.0.3 版本开始支持）

        Text 格式还支持以下表属性：

        - `field.delim`：列分隔符。默认 `\1`。
        - `line.delim`：行分隔符。默认 `\n`。
        - `collection.delim`：复杂类型中各元素之间的分隔符。默认 `\2`。
        - `mapkey.delim`：Map 类型的键值分割符。默认 `\3`
        - `serialization.null.format`：NULL 值的存储格式。默认 `\N`。
        - `escape.delim`：转移字符。默认 `\`。

- 压缩格式

    - Parquet：snappy（默认）、zstd、plain。（Plain 就是不采用压缩）
    - ORC：snappy、zlib（默认）、zstd、plain。（Plain 就是不采用压缩）
    - Text：gzipm、defalte、bzip2、zstd、lz4、lzo、snappy、plain（默认）。（Plain 就是不采用压缩）

- 存储介质

    - HDFS
    - 对象存储

## 数据操作

可以通过 INSERT 语句将数据写入到 Hive 表中。

支持写入到由 Apache Doris 创建的 Hive 表，或者 Hive 中已存在的且格式支持的表。

对于分区表，会根据数据，自动写入到对应分区，或者创建新的分区。

目前不支持指定分区写入。

### INSERT

INSERT 操作会数据以追加的方式写入到目标表中。当前不支持指定分区写入。

```
INSERT INTO hive_tbl values (val1, val2, val3, val4);
INSERT INTO hive.hive_db.hive_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO hive_tbl(col1, col2) values (val1, val2);
INSERT INTO hive_tbl(col1, col2, partition_col1, partition_col2) values (1, 2, "beijing", "2023-12-12");
```

### INSERT OVERWRITE

INSERT OVERWRITE 会使用新的数据完全覆盖原有表中的数据。当前不支持指定分区写入。

```
INSERT OVERWRITE TABLE VALUES(val1, val2, val3, val4)
INSERT OVERWRITE TABLE hive.hive_db.hive_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;
```

INSERT OVERWRITE 的语义与 Hive 一致，有如下行为：

- 当目的表是分区表，而源表为空表时，操作不会产生任何影响。目的表数据无变化。
- 当目的表是非分区表，而源表是空表是，目的表会被清空。
- 当前不支持指定分区写入，因此 INSERT OVERWRITE 为根据源表中的数值，自动处理对应的目的表分区。如果目的表是分区表，则只会覆盖涉及到的分区，不涉及的分区，数据无变化。

### CTAS(CREATE TABLE AS SELECT)
    
可以通过 `CTAS(CREATE TABLE AS SELECT)` 语句创建 Hive 表并写入数据：
    
```
CREATE TABLE hive_ctas ENGINE=hive AS SELECT * FROM other_table;
```
    
CTAS 支持指定文件格式、分区方式等信息，如：
    
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

## 事务机制

对 Hive 的写入操作会被放在一个单独的事务里，在事务提交前，数据对外不可见。只有当提交该事务后，表的相关操作才对其他人可见。

事务能保证操作的原子性，事务内的所有操作，要么全部成功，要么全部失败。

事务不能完全保证操作的隔离性，只能尽力而为，通过分离文件系统操作和 对 Hive Metastore 的元数据操作来尽量减少不一致的时间窗口。

比如在一个事务中，需要修改 Hive 表的多个分区。假设这个任务分成两批进行操作，在第一批操作已经完成、第二批操作还未完成时，第一批分区已经对外可见，外部可以读取到第一批分区，但读不到第二批分区。

在事务提交过程中出现任何异常，都会直接回退该事务，包括对 HDFS 文件的修改、以及对 Hive Metastore 元数据的修改，不需要用户做其他处理。

### 并发写入机制

当前 Apache Doris 支持使用多个插入语句进行并发写入。不过需要注意的是，用户需要控制并发写入不产生可能冲突的情况。

因为普通非事务 Hive 表缺少完备的事务机制。通过上文介绍的 Apache Doris 事务机制我们知道目前 Apache Doris 中的实现只能是尽力而为地减少可能不一致的时间窗口，而无法保证真正的 ACID。因此在 Apache Doris 中进行并发写入Hive 表可能会导致数据一致性问题。

1. `INSERT` 并发操作

    `INSERT` 为数据追加操作，在并发执行 `INSERT` 时，不会产生冲突，操作会产生预期的结果。

2. `INSERT OVERWRITE` 并发操作

    如果使用 `INSERT OVERWRITE` 对同一表或分区并发写入，可能会导致数据丢失或损坏，结果可能是不确定的。

    一般有以下几种解决方案：

    - 对于分区表，可以将数据写入不同的分区，并发操作不同分区不会产生冲突。
    - 对于非分区表，可以同时执行 INSERT，而不使用 INSERT OVERWRITE，这样不会产生冲突的问题。
    - 对于可能产生冲突的操作，需要用户在业务侧控制同一时间只有一个写入在进行。

### HDFS 文件操作

在 HDFS 上的 Hive 表数据通常会先写入到临时目录，然后通过 `rename` 等文件系统操作进行最终的文件提交。这里我们详细介绍不同数据操作中，HDFS 上文件的具体操作。

数据的临时目录格式为：`/tmp/.doris_staging/<username>/<uuid>`

写入的数据文件名称格式为：`<query-id>_<uuid>-<index>.<compress-type>.<file-type>`

下面举例说明各种情况下的文件操作。

1. 非分区表

    - Append（追加写入）

        - 目标表目录：`hdfs://ns/usr/hive/warehouse/example.db/table1`
        - 临时文件：`hdfs://ns/tmp/.doris_staging/root/f02247cb662846038baae272af5eeb05/b35fdbcea3a4e39-86d1f36987ef1492_7e3985bf-9de9-4fc7-b84e-adf11aa08756-0.orc`
        
        提交阶段会把所有临时文件移动到目标表目录下。

    - Overwrite（覆盖写）

        - 目标表目录：`hdfs://ns/usr/hive/warehouse/example.db/table1`
        - 临时文件：`hdfs://ns/tmp/.doris_staging/root/f02247cb662846038baae272af5eeb05/b35fdbcea3a4e39-86d1f36987ef1492_7e3985bf-9de9-4fc7-b84e-adf11aa08756-0.orc`

        提交阶段：

        1. 目标表目录重命名为目标表临时目录：`hdfs://ns/usr/hive/warehouse/example.db/_temp_b35fdbcea3a4e39-86d1f36987ef1492_table1`
        2. 临时目录重命名为目标表目录。
        3. 删除目标表临时目录。

2. 分区表

    - Add（添加到新分区）

        - 目标表目录：`hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`
        - 临时文件：`hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

        提交阶段，会将临时目录重命名为目标表目录

    - Append（写入数据到已存在的分区）

        - 目标表目录：`hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`
        - 临时文件：`hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

        提交阶段，会将临时目录下的文件，移动到目标表目录下。
        
    - Overwrite（覆盖已有分区）

        - 目标表目录：`hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`
        - 临时文件：`hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

        提交阶段：

        1. 目标表分区目录重命名为目标表临时分区目录：`hdfs://ns/usr/hive/warehouse/example.db/table2/_temp_d678a74d232345e0-b659e2fb58e86ffd_part_col=2024-01-01`
        2. 临时分区目录重命名为目标表分区目录。
        3. 删除目标表临时分区目。
    
## 相关参数

### BE

| 参数名称 | 默认值 | 描述 |
| --- | --- | --- |
| `hive_sink_max_file_size` | 最大的数据文件大小。当写入数据量超过该大小后会关闭当前文件，滚动产生一个新文件继续写入。| 1GB |
| `table_sink_partition_write_max_partition_nums_per_writer` | BE 节点上每个 Instance 最大写入的分区数目。 |  128 |
| `table_sink_non_partition_write_scaling_data_processed_threshold` | 非分区表开始 scaling-write 的数据量阈值。每增加 `table_sink_non_partition_write_scaling_data_processed_threshold` 数据就会发送给一个新的 writer(instance) 进行写入。scaling-write 机制主要是为了根据数据量来使用不同数目的 writer(instance) 来进行写入，会随着数据量的增加而增大写入的 writer(instance) 数目，从而提高并发写入的吞吐。当数据量比较少的时候也会节省资源，并且尽可能地减少产生的文件数目。 | 25MB |
| `table_sink_partition_write_min_data_processed_rebalance_threshold` | 分区表开始触发重平衡的最少数据量阈值。如果 `当前累积的数据量` - `自从上次触发重平衡或者最开始累积的数据量` >= `table_sink_partition_write_min_data_processed_rebalance_threshold`，就开始触发重平衡机制。如果发现最终生成的文件大小差异过大，可以调小改阈值来增加均衡度。当然过小的阈值会导致重平衡的成本增加，可能会影响性能。 | 25MB |
| `table_sink_partition_write_min_partition_data_processed_rebalance_threshold` | 分区表开始进行重平衡时的最少的分区数据量阈值。如果 `当前分区的数据量` >= `阈值` * `当前分区已经分配的 task 数目`，就开始对该分区进行重平衡。如果发现最终生成的文件大小差异过大，可以调小改阈值来增加均衡度。当然过小的阈值会导致重平衡的成本增加，可能会影响性能。 | 15MB |

