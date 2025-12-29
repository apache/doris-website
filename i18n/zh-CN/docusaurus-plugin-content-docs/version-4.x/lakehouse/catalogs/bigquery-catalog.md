---
{
    "title": "BigQuery Catalog",
    "language": "zh-CN",
    "description": "BigQuery Catalog 通过 Trino Connector 兼容框架，使用 BigQuery Connector 来访问 BigQuery 表。"
}
---

BigQuery Catalog 通过 [Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/) 兼容框架，使用 BigQuery Connector 来访问 BigQuery 表。

:::note
该功能为实验功能，自 3.0.1 版本开始支持。
:::

## 适用场景

| 场景 | 说明 |
| ---- | ---------------------------- |
| 数据集成 | 读取 BigQuery 数据并写入到 Doris 内表。 |
| 数据写回 | 不支持。                         |

## 环境准备

### 编译 BigQuery Connector 插件

> 需要 JDK 17 版本。

```shell
$ git clone https://github.com/apache/doris-thirdparty.git
$ cd doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-bigquery
$ mvn clean install -DskipTest
```

完成编译后，会在 `trino/plugin/trino-bigquery/target/` 下得到 `trino-bigquery-435/` 目录。

也可以直接下载我们预编译的 [trino-bigquery-435-20240724.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-bigquery-435-20240724.tar.gz) 并解压。

### 部署 BigQuery Connector

将 `trino-bigquery-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下。（如果没有，可以手动创建）。

```plain&#x20;text
├── bin
├── conf
├── connectors
│   ├── trino-bigquery-435
...
```

部署完成后，建议重启 FE、BE 节点以确保 Connector 可以被正确加载。

### 准备 Google Cloud ADC 认证

1. 安装 gcloud CLI：<https://cloud.google.com/sdk/docs/install>

2. 执行 `gcloud init --console-only --skip-diagnostics`

3. 执行 `gcloud auth login`

4. 执行 `gcloud auth application-default login`

这一步是生成 ADC 认证文件，生成后的 json 默认放在 `～/.config/gcloud/application_default_credentials.json`

## 配置 Catalog

### 语法

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name
PROPERTIES (
    'type' = 'trino-connector', -- required
    'trino.connector.name' = 'bigquery', -- required
    {TrinoProperties},
    {CommonProperties}
);
```

* `{TrinoProperties}`

  TrinoProperties 部分用于填写将传递给 Trino Connector 的属性，这些属性以`trino.`为前缀。理论上，Trino 支持的属性这里都支持，更多有关 BigQuery 的属性可以参考 [Trino 文档](https://trino.io/docs/current/connector/bigquery.html)。

* `[CommonProperties]`

  CommonProperties 部分用于填写通用属性。请参阅[ 数据目录概述 ](../catalog-overview.md)中【通用属性】部分。

### 支持的 BigQuery 版本

更多有关 BigQuery 的属性可以参考 [Trino 文档](https://trino.io/docs/current/connector/bigquery.html)。

## 列类型映射

| BigQuery Type | Trino Type                  | Doris Type    |
| ------------- | --------------------------- | ------------- |
| boolean       | boolean                     | boolean       |
| int64         | bigint                      | bigint        |
| float64       | double                      | double        |
| numeric       | decimal(P, S)               | decimal(P, S) |
| bignumric     | decimal(P, S)               | decimal(P, S) |
| string        | varchar                     | string        |
| bytes         | varbinary                   | string        |
| date          | date                        | date          |
| datetime      | timestamp(6)                | datetime(6)   |
| time          | time(6)                     | string        |
| timestamp     | timestamp with time zone(6) | datetime(6)   |
| geography     | varchar                     | string        |
| array         | array                       | array         |
| map           | map                         | map           |
| struct        | row                         | struct        |

## 基础示例

```sql
CREATE CATALOG bigquery_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'bigquery',
    'trino.bigquery.project-id' = 'your-bigquery-project-id',
    'trino.bigquery.credentials-file' = '/path/to/application_default_credentials.json',
);
```

## 查询操作

配置好 Catalog 后，可以通过以下方式查询 Catalog 中的表数据：

```sql
-- 1. switch to catalog, use database and query
SWITCH bigquery_ctl;
USE bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- 2. use bigquery database directly
USE bigquery_ctl.bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM bigquery_ctl.bigquery_db.bigquery_tbl LIMIT 10;
```



