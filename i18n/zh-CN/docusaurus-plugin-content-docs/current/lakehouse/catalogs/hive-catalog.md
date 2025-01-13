---
{
    "title": "Hive Catalog",
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

通过连接 Hive Metastore，或者兼容 Hive Metatore 的元数据服务，Doris 可以自动获取 Hive 的库表信息，并进行数据查询。

除了 Hive 外，很多其他系统也会使用 Hive Metastore 存储元数据。所以通过 Hive Catalog，我们不仅能访问 Hive 表，也能访问使用 Hive Metastore 作为元数据存储的其他表格式，如 Iceberg、Hudi 等。

## 适用场景

| 场景 | 说明                 |
| ---- | ---------------------------------------------------- |
| 查询加速 | 利用 Doris 分布式计算引擎，直接访问 Hive 数据进行查询加速。                 |
| 数据集成 | 读取 Hive 数据并写入到 Doris 内表。或通过 Doris 计算引擎进行 ZeroETL 操作。 |
| 数据写回 | 将任意 Doris 支持读取的数据源数据进行加工后，写回到 Hive 表存储。              |

## 配置 Catalog

### 语法

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type'='hms', -- required
    'hive.metastore.type' = '<hive_metastore_type>', -- optional
    'hive.version' = '<hive_version>', -- optional
    'fs.defaultFS' = '<fs_defaultfs>', -- optional
    {MetaStoreProperties},
    {StorageProperties},
    {CommonProperties}
);
```

* `<hive_metastore_type>`

  指定 Hive Metastore 的类型。

  * `hms`：标准的 Hive Metastore 服务。

  * `glue`：使用 Hive Metastore 兼容接口访问 AWS Glue 元数据服务。

  * `dlf`：使用 Hive Metastore 兼容接口访问阿里云 DLF 元数据服务。

* `<fs_defaultfs>`

  当需要通过 Doris 写入数据到这个 Hive Catalog 中表时，此参数为必选项。示例：

  `'fs.defaultFS' = 'hdfs://namenode:port'`

* `{MetaStoreProperties}`

  MetaStoreProperties 部分用于填写 Metastore 元数据服务连接和认证信息。具体可参阅【支持的元数据服务】部分。

* `{StorageProperties}`

  StorageProperties 部分用于填写存储系统相关的连接和认证信息。具体可参阅【支持的存储系统】部分。

* `{CommonProperties}`

  CommonProperties 部分用于填写通用属性。请参阅[ 数据目录概述 ](../catalog-overview.md)中【通用属性】部分。

### 支持的 Hive 版本

支持 Hive 1.x，2.x，3.x，4.x。

其中 Hive 事务表支持 3.x 之后的版本，详情参阅【Hive 事务表】章节。

### 支持的元数据服务

* [ Hive Metastore](../metastores/hive-metastore.md)

* [ AWS Glue](../metastores/aws-glue.md)

* [ Aliyun DLF ](../metastores/aliyun-dlf.md)

### 支持的存储系统

* [ HDFS](../storages/hdfs.md)

* [ AWS S3](../storages/s3.md)

* [ Google Cloud Storage](../storages/google-cloud-storage.md)

* [ 阿里云 OSS](../storages/aliyun-oss.md)

* [ 腾讯云 COS](../storages/tencent-cos.md)

* [ 华为云 OBS](../storages/huawei-obs.md)

* [ MINIO](../storages/minio.md)

> 如果需要通过 Doris 创建 Hive 表或写入数据，需要在 Catalog 属性中显式增加 `fs.defaultFS` 属性。如果创建 Catalog 仅用于查询，则该参数可以省略。

### 支持的数据格式

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

## 列类型映射

| Hive Type     | Doris Type    | Comment                   |
| ------------- | ------------- | ------------------------- |
| boolean       | boolean       |                           |
| tinyint       | tinyint       |                           |
| smallint      | smallint      |                           |
| int           | int           |                           |
| bigint        | bigint        |                           |
| date          | date          |                           |
| timestamp     | datetime(6)   | 固定映射到精度为 6 的 datetime     |
| float         | float         |                           |
| double        | double        |                           |
| decimal(P, S) | decimal(P, S) | 如果未指定精度，默认为 decimal(9, 0) |
| char(N)       | char(N)       |                           |
| varchar(N)    | varchar(N)    |                           |
| string        | string        |                           |
| binary        | string        |                           |
| array         | array         |                           |
| map           | map           |                           |
| struct        | struct        |                           |
| other         | unsupported   |                           |

## 基础示例

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

## 查询操作

### 基础查询

配置好 Catalog 后，可以通过以下方式查询 Catalog 中的表数据：

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

### 查询 Hive 分区

可以通过下面两种方式查询 Hive 分区信息。

* `SHOW PARTITIONS FROM [catalog.][db.]hive_table`

  该语句可以列出指定 Hive 表的所有分区以及分区值信息。

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

* 使用 `table$partitions` 元数据表

  自 2.1.7 和 3.0.3 版本开始，用户可以通过 `table$partitions` 元数据表查询 Hive 分区信息。`table$partitions` 本质上是一个关系表，每个分区列为一列，所以可以使用在任意 SELECT 语句中。

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

### 查询 Hive 事务表

Hive Transactional 表是 Hive 中支持 ACID 语义的表。详情可见 [Hive Transactions](https://cwiki.apache.org/confluence/display/Hive/Hive+Transactions)。

* Hive Transactional 表支持情况

  | 表类型                             | 在 Hive 中支持的操作                | Hive 表属性                                                          | 支持的 Hive 版本                                              |
  | ------------------------------- | ---------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
  | Full-ACID Transactional Table   | 支持 Insert, Update, Delete 操作 | `'transactional'='true'`                                            | 4.x，3.x，2.x，其中 2.x 需要在 Hive 中执行完 Major Compaction 才可以读取。 |
  | Insert-Only Transactional Table | 只支持 Insert 操作                | `'transactional'='true'`,`'transactional_properties'='insert_only'` | 4.x，3.x，2.x 在创建 catalog 的时候需要指定 `hive.version`。               |

* 当前限制

  目前不支持 Original Files 的场景。当一个表转换成 Transactional 表之后，后续新写的数据文件会使用 Hive Transactional 表的 Schema，但是已经存在的数据文件是不会转化成 Transactional 表的 Schema，这样的文件称为 Original Files。

### 查询 Hive View

支持查询 Hive View。但注意有以下限制：

* Hive View 的定义语句（HiveQL）必须是 Doris 支持的 SQL 语句。否则会出现解析错误。

* 部分 HiveQL 支持的函数可能和 Doris 支持的函数同名，但行为不一致，这可能导致最终结果和使用 Hive 查询的结果不一致。如果用户遇到此类问题，可以向社区反馈。

## 写入操作

可以通过 INSERT 语句将数据写入到 Hive 表中。支持写入到由 Doris 创建的 Hive 表，或者 Hive 中已存在的且格式支持的表。

对于分区表，会根据数据，自动写入到对应分区，或者创建新的分区。目前不支持指定分区写入。

### INSERT INTO

INSERT 操作会将数据以追加的方式写入到目标表中。当前不支持指定分区写入。

```sql
INSERT INTO hive_tbl values (val1, val2, val3, val4);
INSERT INTO hive_ctl.hive_db.hive_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO hive_tbl(col1, col2) values (val1, val2);
INSERT INTO hive_tbl(col1, col2, partition_col1, partition_col2) values (1, 2, "beijing", "2023-12-12");
```

### INSERT OVERWRITE

INSERT OVERWRITE 会使用新的数据完全覆盖原有表中的数据。当前不支持指定分区写入。

```sql
INSERT OVERWRITE TABLE VALUES(val1, val2, val3, val4)
INSERT OVERWRITE TABLE hive_ctl.hive_db.hive_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;
```

INSERT OVERWRITE 的语义与 Hive 一致，有如下行为：

* 当目的表是分区表，而源表为空表时，操作不会产生任何影响。目的表数据无变化。

* 当目的表是非分区表，而源表是空表是，目的表会被清空。

* 当前不支持指定分区写入，因此 INSERT OVERWRITE 为根据源表中的数值，自动处理对应的目的表分区。如果目的表是分区表，则只会覆盖涉及到的分区，不涉及的分区，数据无变化。

### CTAS

可以通过 `CTAS(CREATE TABLE AS SELECT)` 语句创建 Hive 表并写入数据：

```sql
CREATE TABLE hive_ctas ENGINE=hive AS SELECT * FROM other_table;
```

CTAS 支持指定文件格式、分区方式等信息，如：

```sql
CREATE TABLE hive_ctas ENGINE=hive
PARTITION BY LIST (pt1, pt2) ()
AS SELECT col1,pt1,pt2 FROM part_ctas_src WHERE col1>0;
    
CREATE TABLE hive_ctl.hive_db.hive_ctas (col1,col2,pt1) ENGINE=hive
PARTITION BY LIST (pt1) ()
PROPERTIES (
    "file_format"="parquet",
    "compression"="zstd"
)
AS SELECT col1,pt1 as col2,pt2 as pt1 FROM test_ctas.part_ctas_src WHERE col1>0;
```

### 相关参数（Configurations）

* BE

  | 参数名称                                                                          | 默认值                                                                                                                                                                                                                                                                             | 描述   |
  | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
  | `hive_sink_max_file_size`                                                     | 最大的数据文件大小。当写入数据量超过该大小后会关闭当前文件，滚动产生一个新文件继续写入。                                                                                                                                                                                                                                    | 1GB  |
  | `table_sink_partition_write_max_partition_nums_per_writer`                    | BE 节点上每个 Instance 最大写入的分区数目。                                                                                                                                                                                                                                                    | 128  |
  | `table_sink_non_partition_write_scaling_data_processed_threshold`             | 非分区表开始 scaling-write 的数据量阈值。每增加 `table_sink_non_partition_write_scaling_data_processed_threshold` 数据就会发送给一个新的 writer(instance) 进行写入。scaling-write 机制主要是为了根据数据量来使用不同数目的 writer(instance) 来进行写入，会随着数据量的增加而增大写入的 writer(instance) 数目，从而提高并发写入的吞吐。当数据量比较少的时候也会节省资源，并且尽可能地减少产生的文件数目。 | 25MB |
  | `table_sink_partition_write_min_data_processed_rebalance_threshold`           | 分区表开始触发重平衡的最少数据量阈值。如果 `当前累积的数据量` - `自从上次触发重平衡或者最开始累积的数据量` >= `table_sink_partition_write_min_data_processed_rebalance_threshold`，就开始触发重平衡机制。如果发现最终生成的文件大小差异过大，可以调小改阈值来增加均衡度。当然过小的阈值会导致重平衡的成本增加，可能会影响性能。                                                                         | 25MB |
  | `table_sink_partition_write_min_partition_data_processed_rebalance_threshold` | 分区表开始进行重平衡时的最少的分区数据量阈值。如果 `当前分区的数据量` >= `阈值` \* `当前分区已经分配的 task 数目`，就开始对该分区进行重平衡。如果发现最终生成的文件大小差异过大，可以调小改阈值来增加均衡度。当然过小的阈值会导致重平衡的成本增加，可能会影响性能。                                                                                                                                    | 15MB |

## 库表管理

用户可以通过 Doris 在 Hive Metastore 中创建、删除库表。注意，Doris 只是调用 Hive Metastore 的 API 进行相应操作，Doris 本身的元数据并不存储和持久化任何 Hive 的元数据。

### 创建和删除库

可以通过 `SWITCH` 语句切换到对应的 Catalog 下，执行 `CREATE DATABASE` 语句：

```sql
SWITCH hive_ctl;
CREATE DATABASE [IF NOT EXISTS] hive_db;
```

也可以使用全限定名创建，或指定 location，如：

```sql
CREATE DATABASE [IF NOT EXISTS] hive_ctl.hive_db;
    
CREATE DATABASE [IF NOT EXISTS] hive_ctl.hive_db
PROPERTIES ('location'='hdfs://172.21.16.47:4007/path/to/db/');
```

之后可以通过 `SHOW CREATE DATABASE` 命令可以查看 Database 的 Location 信息：

```sql
mysql> SHOW CREATE DATABASE hive_db;
+----------+---------------------------------------------------------------------------------------------+
| Database | Create Database                                                                             |
+----------+---------------------------------------------------------------------------------------------+
| hive_db  | CREATE DATABASE hive_db LOCATION 'hdfs://172.21.16.47:4007/usr/hive/warehouse/hive_db.db'   |
+----------+---------------------------------------------------------------------------------------------+
```

删除

```sql
DROP DATABASE [IF EXISTS] hive_ctl.hive_db;
```

:::caution
对于 Hive Database，必须先删除这个 Database 下的所有表后，才能删除 Database，否则会报错。这个操作会同步删除 Hive 中对应的 Database。
:::

### 创建和删除表

* 创建

  Doris 支持在 Hive 中创建分区或非分区表。

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

  创建后，可以通过 `SHOW CREATE TABLE` 命令查看 Hive 的建表语句。

  注意，不同于 Hive 中的建表语句。在 Doris 中创建 Hive 分区表时，分区列也必须写到 Table 的 Schema 中。同时，分区列必须在所有 Schema 的最后，且顺序保持一致。

  :::tip
  对于某些默认开启 ACID 事务特性的 Hive 集群，使用 Doris 建表后，表属性 `transactional` 会为 `true`。而 Doris 只支持部分 Hive 事务表的特性，因此可能会导致 Doris 创建的 Hive，Doris 本身无法读取的问题。因此，需要在建表的属性中，显式增加：`"transactional" = "false"`，来创建非事务的 Hive 表：

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

* 删除

  可以通过 `DROP TABLE` 语句删除一个 Hive 表。当前删除表后，会同时删除数据，包括分区数据。

* 列类型映射

  参考【列类型映射】部分。需要额外注意一下限制：

  - 列类型只能为默认的 Nullable，不支持 `NOT NULL`。
  - Hive 3.0 支持设置默认值。如果需要设置默认值，则需要在 Catalog 属性中显示的添加 `"hive.version" = "3.0.0"`。
  - 插入数据后，如果类型不能够兼容，例如 `'abc'` 插入到数值类型，则会转为 `null` 值插入。

* 分区

  Hive 中的分区类型对应 Doris 中的 List 分区。因此，在 Doris 中 创建 Hive 分区表，需使用 List 分区的建表语句，但无需显式的枚举各个分区。在写入数据时，Doris 会根据数据的值，自动创建对应的 Hive 分区。支持创建单列或多列分区表。

* 文件格式

  * ORC（默认）

  * Parquet

  * Text（自 2.1.7 和 3.0.3 版本开始支持）

  * Text 格式还支持以下表属性：

      * `field.delim`：列分隔符。默认 `\1`。

      * `line.delim`：行分隔符。默认 `\n`。

      * `collection.delim`：复杂类型中各元素之间的分隔符。默认 `\2`。

      * `mapkey.delim`：Map 类型的键值分割符。默认 `\3`

      * `serialization.null.format`：NULL 值的存储格式。默认 `\N`。

      * `escape.delim`：转移字符。默认 `\`。

* 压缩格式

  * Parquet：snappy（默认）、zstd、plain。（Plain 就是不采用压缩）

  * ORC：snappy、zlib（默认）、zstd、plain。（Plain 就是不采用压缩）

  * Text：gzipm、defalte、bzip2、zstd、lz4、lzo、snappy、plain（默认）。（Plain 就是不采用压缩）

* 存储介质

  * HDFS

  * 对象存储

## 订阅 Hive Metastore 事件

通过让 FE 节点定时读取 HMS 的 Notification Event 来感知 Hive 表元数据的实时变更情况，以提高元数据的时效性。目前支持处理如下 Event：

| 事件              | 事件行为和对应的动作                                                                |
| --------------- | ------------------------------------------------------------------------- |
| CREATE DATABASE | 在对应数据目录下创建数据库。                                                            |
| DROP DATABASE   | 在对应数据目录下删除数据库。                                                            |
| ALTER DATABASE  | 此事件的影响主要有更改数据库的属性信息，注释及默认存储位置等，这些改变不影响 Doris 对外部数据目录的查询操作，因此目前会忽略此 Event。 |
| CREATE TABLE    | 在对应数据库下创建表。                                                               |
| DROP TABLE      | 在对应数据库下删除表，并失效表的缓存。                                                       |
| ALTER TABLE     | 如果是重命名，先删除旧名字的表，再用新名字创建表，否则失效该表的缓存。                                       |
| ADD PARTITION   | 在对应表缓存的分区列表里添加分区。                                                         |
| DROP PARTITION  | 在对应表缓存的分区列表里删除分区，并失效该分区的缓存。                                               |
| ALTER PARTITION | 如果是重命名，先删除旧名字的分区，再用新名字创建分区，否则失效该分区的缓存。                                    |

:::tip
1. 当导入数据导致文件变更，分区表会触发 `ALTER PARTITION` 时间，非分区表会触发 `ALTER TABLE` 事件。

2. 如果绕过 HMS 直接操作文件系统的话，HMS 不会生成对应事件，因此 Doris 也无法感知元数据变化。
:::

该特性在 `fe.conf` 中有如下相关参数：

1. `enable_hms_events_incremental_sync`: 是否开启元数据自动增量同步功能，默认关闭。

2. `hms_events_polling_interval_ms`: 读取 event 的间隔时间，默认值为 10000，单位：毫秒。

3. `hms_events_batch_size_per_rpc`: 每次读取 event 的最大数量，默认值为 500。

如果想使用该特性 (华为云 MRS 除外)，需要更改 HMS 的 `hive-site.xml` 并重启 HMS 和 HiveServer2：

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

华为云 MRS 需要更改 `hivemetastore-site.xml` 并重启 HMS 和 HiveServer2：

```xml
<property>
    <name>metastore.transactional.event.listeners</name>
    <value>org.apache.hive.hcatalog.listener.DbNotificationListener</value>
</property>
```

## 附录

### 事务机制

对 Hive 的写入操作会被放在一个单独的事务里，在事务提交前，数据对外不可见。只有当提交该事务后，表的相关操作才对其他人可见。

事务能保证操作的原子性，事务内的所有操作，要么全部成功，要么全部失败。

事务不能完全保证操作的隔离性，只能尽力而为，通过分离文件系统操作和 对 Hive Metastore 的元数据操作来尽量减少不一致的时间窗口。

比如在一个事务中，需要修改 Hive 表的多个分区。假设这个任务分成两批进行操作，在第一批操作已经完成、第二批操作还未完成时，第一批分区已经对外可见，外部可以读取到第一批分区，但读不到第二批分区。

在事务提交过程中出现任何异常，都会直接回退该事务，包括对 HDFS 文件的修改、以及对 Hive Metastore 元数据的修改，不需要用户做其他处理。

### 并发写入机制

当前 Apache Doris 支持使用多个插入语句进行并发写入。不过需要注意的是，用户需要控制并发写入不产生可能冲突的情况。

因为普通非事务 Hive 表缺少完备的事务机制。通过上文介绍的 Apache Doris 事务机制我们知道目前 Apache Doris 中的实现只能是尽力而为地减少可能不一致的时间窗口，而无法保证真正的 ACID。因此在 Apache Doris 中进行并发写入 Hive 表可能会导致数据一致性问题。

1. `INSERT` 并发操作

2. `INSERT` 为数据追加操作，在并发执行 `INSERT` 时，不会产生冲突，操作会产生预期的结果。

3. `INSERT OVERWRITE` 并发操作

4. 如果使用 `INSERT OVERWRITE` 对同一表或分区并发写入，可能会导致数据丢失或损坏，结果可能是不确定的。

5. 一般有以下几种解决方案：

   * 对于分区表，可以将数据写入不同的分区，并发操作不同分区不会产生冲突。

   * 对于非分区表，可以同时执行 INSERT，而不使用 INSERT OVERWRITE，这样不会产生冲突的问题。

   * 对于可能产生冲突的操作，需要用户在业务侧控制同一时间只有一个写入在进行。

### HDFS 文件操作

在 HDFS 上的 Hive 表数据通常会先写入到临时目录，然后通过 `rename` 等文件系统操作进行最终的文件提交。这里我们详细介绍不同数据操作中，HDFS 上文件的具体操作。

数据的临时目录格式为：`/tmp/.doris_staging/<username>/<uuid>`

写入的数据文件名称格式为：`<query-id>_<uuid>-<index>.<compress-type>.<file-type>`

下面举例说明各种情况下的文件操作。

1. 非分区表

   * Append（追加写入）

     * 目标表目录：`hdfs://ns/usr/hive/warehouse/example.db/table1`

     * 临时文件：`hdfs://ns/tmp/.doris_staging/root/f02247cb662846038baae272af5eeb05/b35fdbcea3a4e39-86d1f36987ef1492_7e3985bf-9de9-4fc7-b84e-adf11aa08756-0.orc`

     * 提交阶段会把所有临时文件移动到目标表目录下。

   * Overwrite（覆盖写）

     * 目标表目录：`hdfs://ns/usr/hive/warehouse/example.db/table1`

     * 临时文件：`hdfs://ns/tmp/.doris_staging/root/f02247cb662846038baae272af5eeb05/b35fdbcea3a4e39-86d1f36987ef1492_7e3985bf-9de9-4fc7-b84e-adf11aa08756-0.orc`

     * 提交阶段：

     1. 目标表目录重命名为目标表临时目录：`hdfs://ns/usr/hive/warehouse/example.db/_temp_b35fdbcea3a4e39-86d1f36987ef1492_table1`

     2. 临时目录重命名为目标表目录。

     3. 删除目标表临时目录。

2. 分区表

   * Add（添加到新分区）

     * 目标表目录：`hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`

     * 临时文件：`hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

     * 提交阶段，会将临时目录重命名为目标表目录

   * Append（写入数据到已存在的分区）

     * 目标表目录：`hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`

     * 临时文件：`hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

     * 提交阶段，会将临时目录下的文件，移动到目标表目录下。

   * Overwrite（覆盖已有分区）

     * 目标表目录：`hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`

     * 临时文件：`hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

     * 提交阶段：

     1. 目标表分区目录重命名为目标表临时分区目录：`hdfs://ns/usr/hive/warehouse/example.db/table2/_temp_d678a74d232345e0-b659e2fb58e86ffd_part_col=2024-01-01`

     2. 临时分区目录重命名为目标表分区目录。

     3. 删除目标表临时分区目。

### 版本更新记录

| Doris 版本 | 功能支持                                 |
| -------- | ------------------------------------ |
| 2.1.6    | 支持 Hive 表数据写回                        |
| 3.0.4    | 支持 JsonSerDe 格式的 Hive 表。支持 Hive4 的事务表。 |

