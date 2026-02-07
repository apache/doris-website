---
{
    "title": "Delta Lake Catalog",
    "language": "zh-CN",
    "description": "Apache Doris Delta Lake Catalog 使用指南：通过 Trino Connector 框架连接 Delta Lake 数据湖，实现 Delta Lake 表数据的查询和集成。支持 Hive Metastore、多种数据类型映射，快速完成 Delta Lake 与 Doris 的数据集成。"
}
---

## 概述

Delta Lake Catalog 通过 [Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/) 兼容框架，使用 Trino Delta Lake Connector 来访问 Delta Lake 表。

:::note
- 该功能为实验功能，自 3.0.1 版本开始支持。
- 该功能不依赖 Trino 集群环境，仅使用 Trino 兼容插件。
:::

### 适用场景

| 场景     | 支持情况                               |
| -------- | -------------------------------------- |
| 数据集成 | 读取 Delta Lake 数据并写入到 Doris 内表 |
| 数据写回 | 不支持                                 |

### 版本兼容性

- **Doris 版本**：3.0.1 及以上
- **Trino Connector 版本**：435
- **Delta Lake 版本**：具体支持的版本请参考 [Trino 文档](https://trino.io/docs/435/connector/delta-lake.html)

## 快速开始

### 步骤 1：准备 Connector 插件

你可以选择以下两种方式之一来获取 Delta Lake Connector 插件：

**方式一：使用预编译包（推荐）**

直接下载预编译的 [trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz) 及 [hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz) 并解压。

**方式二：手动编译**

如果需要自定义编译，按照以下步骤操作（需要 JDK 17）：

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-delta-lake
mvn clean install -DskipTests
cd ../../lib/trino-hdfs
mvn clean install -DskipTests
```

完成编译后，会在 `trino/plugin/trino-delta-lake/target/` 下得到 `trino-delta-lake-435` 目录，在 `trino/lib/trino-hdfs/target/` 下得到 `hdfs` 目录。

### 步骤 2：部署插件

1. 将 `trino-delta-lake-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下（如果没有该目录，请手动创建）：

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-delta-lake-435
   │           ├── hdfs
   ...
   ```

   > 也可以通过修改 `fe.conf` 的 `trino_connector_plugin_dir` 配置自定义插件路径。如：`trino_connector_plugin_dir=/path/to/connectors/`

2. 重启所有 FE 和 BE 节点，以确保 Connector 被正确加载。

### 步骤 3：创建 Catalog

**基础配置**

```sql
CREATE CATALOG delta_lake_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'delta_lake',
    'trino.hive.metastore' = 'thrift',
    'trino.hive.metastore.uri' = 'thrift://ip:port',
    'trino.hive.config.resources' = '/path/to/core-site.xml,/path/to/hdfs-site.xml'
);
```

**配置说明**

- `trino.hive.metastore`：元数据服务类型，支持 `thrift`（Hive Metastore）等
- `trino.hive.metastore.uri`：Hive Metastore 服务地址
- `trino.hive.config.resources`：Hadoop 配置文件路径，多个文件用逗号分隔

更多配置选项请参考下方「配置说明」部分或 [Trino 官方文档](https://trino.io/docs/435/connector/delta-lake.html)。

### 步骤 4：查询数据

创建 Catalog 后，可以通过以下三种方式查询 Delta Lake 表数据：

```sql
-- 方式 1：切换到 Catalog 后查询
SWITCH delta_lake_catalog;
USE delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- 方式 2：使用两级路径
USE delta_lake_catalog.delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- 方式 3：使用全限定名
SELECT * FROM delta_lake_catalog.delta_lake_db.delta_lake_tbl LIMIT 10;
```

## 配置说明

### Catalog 配置参数

创建 Delta Lake Catalog 的基本语法如下：

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',            -- 必填，固定值
    'trino.connector.name' = 'delta_lake', -- 必填，固定值
    {TrinoProperties},                     -- Trino Connector 相关属性
    {CommonProperties}                     -- 通用属性
);
```

#### TrinoProperties 参数

TrinoProperties 用于配置 Trino Delta Lake Connector 的专有属性，这些属性以 `trino.` 为前缀。常用参数包括：

| 参数名称                          | 必填 | 默认值 | 说明                                          |
| --------------------------------- | ---- | ------ | --------------------------------------------- |
| `trino.hive.metastore`            | 是   | -      | 元数据服务类型，如 `thrift`                   |
| `trino.hive.metastore.uri`        | 是   | -      | Hive Metastore 服务地址                       |
| `trino.hive.config.resources`     | 否   | -      | Hadoop 配置文件路径，多个文件用逗号分隔       |
| `trino.delta.hide-non-delta-tables` | 否   | false  | 是否隐藏非 Delta Lake 表                      |

更多 Delta Lake Connector 配置参数请参考 [Trino 官方文档](https://trino.io/docs/435/connector/delta-lake.html)。

#### CommonProperties 参数

CommonProperties 用于配置 Catalog 的通用属性，例如元数据刷新策略、权限控制等。详细说明请参阅[数据目录概述](../catalog-overview.md)中「通用属性」部分。

## 数据类型映射

在使用 Delta Lake Catalog 时，数据类型会按照以下规则进行映射：

| Delta Lake Type | Trino Type                  | Doris Type    | 说明 |
| --------------- | --------------------------- | ------------- | ---- |
| boolean         | boolean                     | boolean       |      |
| int             | int                         | int           |      |
| byte            | tinyint                     | tinyint       |      |
| short           | smallint                    | smallint      |      |
| long            | bigint                      | bigint        |      |
| float           | real                        | float         |      |
| double          | double                      | double        |      |
| decimal(P, S)   | decimal(P, S)               | decimal(P, S) |      |
| string          | varchar                     | string        |      |
| binary          | varbinary                   | string        |      |
| date            | date                        | date          |      |
| timestamp\_ntz  | timestamp(N)                | datetime(N)   |      |
| timestamp       | timestamp with time zone(N) | datetime(N)   |      |
| array           | array                       | array         |      |
| map             | map                         | map           |      |
| struct          | row                         | struct        |      |

