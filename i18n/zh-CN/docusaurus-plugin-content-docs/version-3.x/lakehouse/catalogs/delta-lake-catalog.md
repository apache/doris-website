---
{
    "title": "Delta Lake Catalog",
    "language": "zh-CN",
    "description": "Delta Lake Catalog 通过 Trino Connector 兼容框架，使用 Delta Lake Connector 来访问 Delta Lake 表。"
}
---

Delta Lake Catalog 通过 [Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/) 兼容框架，使用 Delta Lake Connector 来访问 Delta Lake 表。

:::note
该功能为实验功能，自 3.0.1 版本开始支持。
:::

## 适用场景

| 场景 | 说明 |
| ---- | ------------------------------ |
| 数据集成 | 读取 Detla Lake 数据并写入到 Doris 内表。 |
| 数据写回 | 不支持。                           |

## 环境准备

### 编译 Delta Lake Connector 插件

> 需要 JDK 17 版本。

```shell
$ git clone https://github.com/apache/doris-thirdparty.git
$ cd doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-delta-lake
$ mvn clean install -DskipTest
$ cd ../../lib/trino-hdfs
$ mvn clean install -DskipTest
```

完成编译后，会在 `trino/plugin/trino-delta-lake/target/` 下得到 `trino-delta-lake-435` 目录，在 `trino/lib/trino-hdfs/target/` 下得到 `hdfs` 目录

也可以直接下载预编译的 [trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz) 及 [hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz) 并解压。

### 部署 Delta Lake Connector

将 `trino-delta-lake-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下（如果没有，可以手动创建），将 `hdfs.tar.gz` 解压到 `trino-delta-lake-435/` 目录下。

```text
├── bin
├── conf
├── connectors
│   ├── trino-delta-lake-435
│   │   ├── hdfs
...
```

部署完成后，建议重启 FE、BE 节点以确保 Connector 可以被正确加载。

## 配置 Catalog

### 语法

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name
PROPERTIES (
    'type' = 'trino-connector', -- required
    'trino.connector.name' = 'delta_lake', -- required
    {TrinoProperties},
    {CommonProperties}
);
```

* `{TrinoProperties}`

  TrinoProperties 部分用于填写将传递给 Trino Connector 的属性，这些属性以`trino.`为前缀。理论上，Trino 支持的属性这里都支持，更多有关 Delta Lake 的信息可以参考 [Trino 文档](https://trino.io/docs/435/connector/delta-lake.html)。

* `[CommonProperties]`

  CommonProperties 部分用于填写通用属性。请参阅[ 数据目录概述 ](../catalog-overview.md)中【通用属性】部分。

### 支持的 Delta Lake 版本

更多有关 Delta Lake 的信息可以参考 [Trino 文档](https://trino.io/docs/435/connector/delta-lake.html)。

### 支持的元数据服务

更多有关 Delta Lake 的信息可以参考 [Trino 文档](https://trino.io/docs/435/connector/delta-lake.html)。

### 支持的存储系统

更多有关 Delta Lake 的信息可以参考 [Trino 文档](https://trino.io/docs/435/connector/delta-lake.html)。

## 列类型映射

| Delta Lake Type | Trino Type                  | Doris Type    | Comment |
| --------------- | --------------------------- | ------------- | ------- |
| boolean         | boolean                     | boolean       |         |
| int             | int                         | int           |         |
| byte            | tinyint                     | tinyint       |         |
| short           | smallint                    | smallint      |         |
| long            | bigint                      | bigint        |         |
| float           | real                        | float         |         |
| double          | double                      | double        |         |
| decimal(P, S)   | decimal(P, S)               | decimal(P, S) |         |
| string          | varchar                     | string        |         |
| bianry          | varbinary                   | string        |         |
| date            | date                        | date          |         |
| timestamp\_ntz  | timestamp(N)                | datetime(N)   |         |
| timestamp       | timestamp with time zone(N) | datetime(N)   |         |
| array           | array                       | array         |         |
| map             | map                         | map           |         |
| struct          | row                         | struct        |         |

## 基础示例

```sql
CREATE CATALOG delta_lake_hms properties ( 
    'type' = 'trino-connector', 
    'trino.connector.name' = 'delta_lake',
    'trino.hive.metastore' = 'thrift',
    'trino.hive.metastore.uri'= 'thrift://ip:port',
    'trino.hive.config.resources'='/path/to/core-site.xml,/path/to/hdfs-site.xml'
);
```

## 查询操作

配置好 Catalog 后，可以通过以下方式查询 Catalog 中的表数据：

```sql
-- 1. switch to catalog, use database and query
SWITCH delta_lake_ctl;
USE delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- 2. use dalta lake database directly
USE delta_lake_ctl.delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM delta_lake_ctl.delta_lake_db.delta_lake_tbl LIMIT 10;
```

