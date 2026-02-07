---
{
    "title": "BigQuery Catalog",
    "language": "zh-CN",
    "description": "详细介绍如何在 Apache Doris 中配置和使用 BigQuery Catalog 连接 Google BigQuery 数据仓库。通过 Trino Connector 框架实现 BigQuery 表数据查询、数据集成和实时分析。支持 Google Cloud ADC 认证、多种数据类型映射（包括 ARRAY、MAP、STRUCT 等复杂类型），提供完整的安装部署、配置参数和使用示例，帮助用户快速实现 BigQuery 与 Doris 的数据互通。"
}
---

## 概述

BigQuery Catalog 通过 [Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/) 兼容框架，使用 Trino BigQuery Connector 来访问 BigQuery 表。

:::note
- 该功能为实验功能，自 3.0.1 版本开始支持。
:::

:::note
- 该功能不依赖 Trino 集群环境，仅使用 Trino 兼容插件。
:::

### 适用场景

| 场景     | 支持情况                               |
| -------- | -------------------------------------- |
| 数据集成 | 读取 BigQuery 数据并写入到 Doris 内表 |
| 数据写回 | 不支持                                 |

### 版本兼容性

- **Doris 版本**：3.0.1 及以上
- **Trino Connector 版本**：435
- **BigQuery 版本**：具体支持的版本请参考 [Trino 文档](https://trino.io/docs/435/connector/bigquery.html)

## 快速开始

### 步骤 1：准备 Connector 插件

你可以选择以下两种方式之一来获取 BigQuery Connector 插件：

**方式一：使用预编译包（推荐）**

直接在 [这里](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724) 找到对应的预编译的插件包并下载解压。

**方式二：手动编译**

如果需要自定义编译，按照以下步骤操作（需要 JDK 17）：

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-bigquery
mvn clean install -DskipTest
```

完成编译后，会在 `trino/plugin/trino-bigquery/target/` 下得到 `trino-bigquery-435/` 目录。

### 步骤 2：部署插件

1. 将 `trino-bigquery-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下（如果没有该目录，请手动创建）：

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-bigquery-435
   ...
   ```

   > 也可以通过修改 `fe.conf` 的 `trino_connector_plugin_dir` 配置自定义插件路径。如：`trino_connector_plugin_dir=/path/to/connectors/`

2. 重启所有 FE 和 BE 节点，以确保 Connector 被正确加载。

### 步骤 3：准备 Google Cloud 认证

在创建 Catalog 之前，需要先配置 Google Cloud 认证。推荐使用 Application Default Credentials (ADC) 方式：

1. 安装 gcloud CLI：<https://cloud.google.com/sdk/docs/install>

2. 执行以下命令进行初始化和认证：

    ```shell
    gcloud init --console-only --skip-diagnostics
    gcloud auth login
    gcloud auth application-default login
    ```

3. 认证成功后，会在 `~/.config/gcloud/application_default_credentials.json` 生成 ADC 认证文件。

### 步骤 4：创建 Catalog

**基础配置示例**

```sql
CREATE CATALOG bigquery_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'bigquery',
    'trino.bigquery.project-id' = 'your-bigquery-project-id',
    'trino.bigquery.credentials-file' = '/path/to/application_default_credentials.json'
);
```

### 步骤 5：查询数据

创建 Catalog 后，可以通过以下三种方式查询 BigQuery 表数据：

```sql
-- 方式 1：切换到 Catalog 后查询
SWITCH bigquery_catalog;
USE bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- 方式 2：使用两级路径
USE bigquery_catalog.bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- 方式 3：使用全限定名
SELECT * FROM bigquery_catalog.bigquery_db.bigquery_tbl LIMIT 10;
```

## 配置说明

### Catalog 配置参数

创建 BigQuery Catalog 的基本语法如下：

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',             -- 必填，固定值
    'trino.connector.name' = 'bigquery',    -- 必填，固定值
    {TrinoProperties},                      -- Trino Connector 相关属性
    {CommonProperties}                      -- 通用属性
);
```

#### TrinoProperties 参数

TrinoProperties 用于配置 Trino BigQuery Connector 的专有属性，这些属性以 `trino.` 为前缀。常用参数包括：

| 参数名称                              | 必填 | 默认值 | 说明                                          |
| ------------------------------------- | ---- | ------ | --------------------------------------------- |
| `trino.bigquery.project-id`           | 是   | -      | BigQuery 项目 ID                              |
| `trino.bigquery.credentials-file`     | 是   | -      | Google Cloud 认证文件路径                     |
| `trino.bigquery.views-enabled`        | 否   | false  | 是否启用视图支持                              |
| `trino.bigquery.arrow-serialization.enabled` | 否   | true   | 是否启用 Arrow 序列化以提高性能               |

更多 BigQuery Connector 配置参数请参考 [Trino 官方文档](https://trino.io/docs/435/connector/bigquery.html)。

#### CommonProperties 参数

CommonProperties 用于配置 Catalog 的通用属性，例如元数据刷新策略、权限控制等。详细说明请参阅[数据目录概述](../catalog-overview.md)中「通用属性」部分。

## 数据类型映射

在使用 BigQuery Catalog 时，数据类型会按照以下规则进行映射：

| BigQuery Type | Trino Type                      | Doris Type    |
| ------------- | ------------------------------- | ------------- |
| boolean       | boolean                         | boolean       |
| int64         | bigint                          | bigint        |
| float64       | double                          | double        |
| numeric       | decimal(P, S)                   | decimal(P, S) |
| bignumeric    | decimal(P, S)                   | decimal(P, S) |
| string        | varchar                         | string        |
| bytes         | varbinary                       | string        |
| date          | date                            | date          |
| datetime      | timestamp(6)                    | datetime(6)   |
| time          | time(6)                         | string        |
| timestamp     | timestamp with time zone(6)     | datetime(6)   |
| geography     | varchar                         | string        |
| array         | array                           | array         |
| map           | map                             | map           |
| struct        | row                             | struct        |