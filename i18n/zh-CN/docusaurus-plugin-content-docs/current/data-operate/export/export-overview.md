---
{
    "title": "数据导出概述",
    "language": "zh-CN",
    "description": "Apache Doris 数据导出概述：如何将查询结果集或表数据导出为 Parquet、ORC、CSV 等格式，到 HDFS、S3 或本地文件系统。"
}
---

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 数据导出方案选型 / 跨系统数据交换 -->

数据导出（Export）功能用于将 **查询结果集** 或 **Apache Doris 表数据** 以指定文件格式写入指定的存储系统，常用于结果集下载和跨系统数据交换场景。

## 数据导出 vs 数据备份

数据导出和数据备份均可将 Apache Doris 中的数据输出到外部存储，但二者面向的场景不同。下表对比两者的核心差异：

| 对比维度       | 数据导出                                                    | 数据备份                                                  |
| -------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| 最终存储位置   | HDFS、对象存储、本地文件系统                                | HDFS、对象存储                                            |
| 数据格式       | Parquet、ORC、CSV 等开放格式                                | Apache Doris 内部存储格式                                 |
| 执行速度       | 中等（需读取数据并转换为目标格式）                          | 快速（直接上传 Doris 数据文件，无需解析转换）             |
| 灵活度         | 可通过 SQL 灵活定义导出范围                                 | 仅支持表级别全量备份                                      |
| 典型使用场景   | 结果集下载、不同系统间的数据交换                            | 数据备份、Apache Doris 集群间的数据迁移                   |

## 选择导出方式

<!-- 知识类型: 架构选型决策 -->

Apache Doris 提供以下三种数据导出方式，分别适用于不同的导出诉求：

- **[SELECT INTO OUTFILE](./outfile.md)**：支持任意 SQL 结果集的导出。
- **[EXPORT](./export-manual.md)**：支持表级别的部分或全部数据导出。
- **[MySQL DUMP](./export-with-mysql-dump.md)**：兼容 MySQL Dump 指令的数据导出。

### 三种方式能力对比

下表对比三种导出方式在执行模式、SQL 能力、并发度和支持格式等方面的差异，帮助你快速选型：

| 对比维度          | SELECT INTO OUTFILE                                                          | EXPORT                                                | MySQL DUMP             |
| ----------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------- |
| 同步 / 异步       | 同步                                                                         | 异步（提交后通过 `SHOW EXPORT` 查看进度）             | 同步                   |
| 支持任意 SQL      | 支持                                                                         | 不支持                                                | 不支持                 |
| 导出指定分区      | 支持                                                                         | 支持                                                  | 不支持                 |
| 导出指定 Tablets  | 支持                                                                         | 不支持                                                | 不支持                 |
| 并发导出          | 支持，并发高（受 `ORDER BY` 等单机算子限制）                                 | 支持，并发高（支持 Tablet 粒度并发）                  | 不支持，单线程导出     |
| 支持的导出格式    | Parquet、ORC、CSV                                                            | Parquet、ORC、CSV                                     | MySQL Dump 专有格式    |
| 是否支持外表      | 支持                                                                         | 部分支持                                              | 不支持                 |
| 是否支持 View     | 支持                                                                         | 支持                                                  | 支持                   |
| 支持的导出位置    | S3、HDFS                                                                     | S3、HDFS                                              | LOCAL                  |

### 适用场景说明

#### SELECT INTO OUTFILE

适用于以下场景：

- 导出数据需经过复杂计算逻辑，如过滤、聚合、关联等。
- 适合执行同步任务的场景。

详细使用方法请参考 [SELECT INTO OUTFILE](./outfile.md)。

#### EXPORT

适用于以下场景：

- 大数据量的单表导出，仅需简单过滤条件。
- 需要异步提交任务的场景。

详细使用方法请参考 [Export 异步导出](./export-manual.md)。

#### MySQL Dump

适用于以下场景：

- 兼容 MySQL 生态，需要同时导出表结构和数据。
- 仅用于开发测试或者数据量很小的情况。

详细使用方法请参考 [MySQL Dump](./export-with-mysql-dump.md)。

## 导出文件列类型映射

<!-- 知识类型: 配置参数 / 类型映射参考 -->

Parquet 和 ORC 文件格式拥有自己的数据类型定义，Apache Doris 在导出时会自动将内部数据类型转换为对应的 Parquet/ORC 类型。CSV 格式没有类型定义，所有数据均以文本形式输出。

下面分别给出 Apache Doris 数据类型与 ORC、Parquet 格式的映射关系。

### ORC 类型映射

| Doris 类型              | ORC 类型  |
| ----------------------- | --------- |
| boolean                 | boolean   |
| tinyint                 | tinyint   |
| smallint                | smallint  |
| int                     | int       |
| bigint                  | bigint    |
| largeInt                | string    |
| date                    | string    |
| datev2                  | string    |
| datetime                | string    |
| datetimev2              | timestamp |
| float                   | float     |
| double                  | double    |
| char / varchar / string | string    |
| decimal                 | decimal   |
| struct                  | struct    |
| map                     | map       |
| array                   | array     |
| json                    | string    |
| variant                 | string    |
| bitmap                  | binary    |
| quantile_state          | binary    |
| hll                     | binary    |

### Parquet 类型映射

Apache Doris 导出到 Parquet 文件格式时，会先将 Doris 内存数据转换为 Arrow 内存格式，再由 Arrow 写出到 Parquet 文件。映射关系如下：

| Doris 类型              | Arrow 类型  | Parquet Physical Type | Parquet Logical Type             |
| ----------------------- | ----------- | --------------------- | -------------------------------- |
| boolean                 | boolean     | BOOLEAN               |                                  |
| tinyint                 | int8        | INT32                 | INT_8                            |
| smallint                | int16       | INT32                 | INT_16                           |
| int                     | int32       | INT32                 | INT_32                           |
| bigint                  | int64       | INT64                 | INT_64                           |
| largeInt                | utf8        | BYTE_ARRAY            | UTF8                             |
| date                    | utf8        | BYTE_ARRAY            | UTF8                             |
| datev2                  | date32      | INT32                 | DATE                             |
| datetime                | utf8        | BYTE_ARRAY            | UTF8                             |
| datetimev2              | timestamp   | INT96 / INT64         | TIMESTAMP(MICROS/MILLIS/SECONDS) |
| float                   | float32     | FLOAT                 |                                  |
| double                  | float64     | DOUBLE                |                                  |
| char / varchar / string | utf8        | BYTE_ARRAY            | UTF8                             |
| decimal                 | decimal128  | FIXED_LEN_BYTE_ARRAY  | DECIMAL(scale, precision)        |
| struct                  | struct      |                       | Parquet Group                    |
| map                     | map         |                       | Parquet Map                      |
| array                   | list        |                       | Parquet List                     |
| json                    | utf8        | BYTE_ARRAY            | UTF8                             |
| variant                 | utf8        | BYTE_ARRAY            | UTF8                             |
| bitmap                  | binary      | BYTE_ARRAY            |                                  |
| quantile_state          | binary      | BYTE_ARRAY            |                                  |
| hll                     | binary      | BYTE_ARRAY            |                                  |

:::note
在 2.1.11 和 3.0.7 版本中，支持通过 `parquet.enable_int96_timestamps` 属性指定 Doris 的 `datetimev2` 类型在 Parquet 中是使用 `INT96` 还是 `INT64` 存储，默认为 `INT96`。`INT96` 在 Parquet 标准中已被废弃，仅用于兼容旧系统（如 Hive 4.0 之前的版本）。
:::

## 相关文档

- [Export 异步导出](./export-manual.md)：使用 `EXPORT` 命令异步导出表或分区数据。
- [SELECT INTO OUTFILE](./outfile.md)：使用 `SELECT INTO OUTFILE` 同步导出查询结果。
- [MySQL Dump](./export-with-mysql-dump.md)：使用 `mysqldump` 工具导出表结构与数据。
- [数据导出最佳实践](./export-best-practice.md)：导出并发调优与导出速度评估方法。
