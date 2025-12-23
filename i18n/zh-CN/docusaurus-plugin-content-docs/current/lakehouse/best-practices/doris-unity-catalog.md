---
{
    "title": "集成 Databricks Unity Catalog",
    "language": "zh-CN",
    "description": "随着企业在 Lakehouse 架构下统一管理不断增长的数据资产，对跨平台、高性能、受治理的数据访问能力的需求愈加迫切。Apache Doris 作为新一代实时分析型数据库，现已实现与 Databricks Unity Catalog 的深度集成，使企业能够在统一的治理体系下，"
}
---

随着企业在 Lakehouse 架构下统一管理不断增长的数据资产，对跨平台、高性能、受治理的数据访问能力的需求愈加迫切。Apache Doris 作为新一代实时分析型数据库，现已实现与 [Databricks Unity Catalog](https://www.databricks.com/product/unity-catalog) 的深度集成，使企业能够在统一的治理体系下，通过 Doris 直接访问并高效查询 Databricks 管理的数据湖，实现数据的无缝衔接。

**通过本文档，您将深入了解：**

- Databricks 环境准备：如何在 Databricks 中创建 External Location、Catalog 和 Iceberg 表，以及相关的权限配置

- Doris 连接 Unity Catalog：如何通过 Doris 连接 Databricks Unity Catalog 并访问 Iceberg 表

> 注意：本功能需要 Doris 3.1.3 及以上版本。

## Databricks 环境准备

### 创建 External Location

在 Unity Catalog 中，[External Location](https://docs.databricks.com/aws/en/sql/language-manual/sql-ref-external-locations) 是一个用于将云对象存储中的路径与存储凭据（Storage Credential）关联的安全对象。External Location 支持外部访问，Unity Catalog 可以通过 Credential Vending 功能为外部系统发放短期凭证，允许外部系统访问这些路径。

![unity1](/images/integrations/lakehouse/unity/unity-1.png)

本文使用 AWS Quickstart 在 AWS S3 中创建 External Location。

![unity2](/images/integrations/lakehouse/unity/unity-2.png)

创建完成后，可以看到 External Catalog，以及对应的 Credential：

![unity3](/images/integrations/lakehouse/unity/unity-3.png)

### 创建 Catalog

点击界面中的创建 Catalog 选项。

![unity4](/images/integrations/lakehouse/unity/unity-4.png)

填写 Catalog 的名称。取消 `Use default storage` 的勾选，并选择刚才创建的 External Location。

![unity5](/images/integrations/lakehouse/unity/unity-5.png)

### 开启 External Use Schema 权限

点击刚才创建的 `Catalog` → `Permissions` → `Grant`：

![unity6](/images/integrations/lakehouse/unity/unity-6.png)

选择 `All account users`，并勾选 `EXTERNAL USE SCHEMA` 选项。

![unity7](/images/integrations/lakehouse/unity/unity-7.png)

### 创建 Iceberg 表并写入数据

在 Databricks 的 SQL Editor 中执行以下 SQL 创建 Iceberg 表并写入数据：

```sql
CREATE TABLE `my-unity-catalog`.default.iceberg_table (
  id int,
  name string
) USING iceberg;

INSERT INTO `my-unity-catalog`.default.iceberg_table VALUES(1, "jack");
```

### 获取 Access Token

点击右上角用户头像，进入 `Settings` 页面，在 `User` → `Developer` 中选择 `Access tokens`。创建一个新的 Token，供后续 Doris 连接 Unity Catalog 时使用。Token 是一个字符串，形如：`dapi4f...`

## Doris 连接 Unity Catalog

### 创建 Catalog

```sql
-- Use oath2 credential and vended credentials
CREATE CATALOG dbx_unity_catalog PROPERTIES (
  "uri" = "https://dbc-xx.cloud.databricks.com:443/api/2.1/unity-catalog/iceberg-rest/",
  "type" = "iceberg",
  "warehouse" = "my-unity-catalog",
  "iceberg.catalog.type" = "rest",
  "iceberg.rest.security.type" = "oauth2",
  "iceberg.rest.oauth2.credential" = "clientid:clientsecret",
  "iceberg.rest.oauth2.server-uri" = "https://dbc-xx.cloud.databricks.com:443/oidc/v1/token",
  "iceberg.rest.oauth2.scope" = "all-apis",
  "iceberg.rest.vended-credentials-enabled" = "true"
);

-- Use PAT and vended credentials
CREATE CATALOG dbx_unity_catalog PROPERTIES (
  "uri" = "https://<dbc-account>.cloud.databricks.com/api/2.1/unity-catalog/iceberg-rest/",
  "type" = "iceberg",
  "warehouse" = "my-unity-catalog",
  "iceberg.catalog.type" = "rest",
  "iceberg.rest.security.type" = "oauth2",
  "iceberg.rest.oauth2.token" = "<token>",
  "iceberg.rest.vended-credentials-enabled" = "true"
);

-- Use oath2 credential and static ak/sk for accessing aws s3
CREATE CATALOG dbx_unity_catalog PROPERTIES (
  "uri" = "https://dbc-xx.cloud.databricks.com:443/api/2.1/unity-catalog/iceberg-rest/",
  "type" = "iceberg",
  "warehouse" = "my-unity-catalog",
  "iceberg.catalog.type" = "rest",
  "iceberg.rest.security.type" = "oauth2",
  "iceberg.rest.oauth2.credential" = "clientid:clientsecret",
  "iceberg.rest.oauth2.server-uri" = "https://dbc-xx.cloud.databricks.com:443/oidc/v1/token",
  "iceberg.rest.oauth2.scope" = "all-apis",
  "s3.endpoint" = "https://s3.<region>.amazonaws.com",
  "s3.access_key" = "<ak>",
  "s3.secret_key" = "<sk>",
  "s3.region" = "<region>"
);
```

### 访问 Catalog

创建完成后，即可开始访问 Unity Catalog 中存储的 Iceberg 表：

```sql
mysql> USE dbx_unity_catalog.`default`;
Database changed

mysql> SELECT * FROM iceberg_table;
+------+------+
| id   | name |
+------+------+
|    1 | jack |
+------+------+
1 row in set (3.32 sec)
```

### 管理 Iceberg 表

同时，也可以直接通过 Doris 在 Unity Catalog 中创建、管理和写入 Iceberg 表：

```sql
-- 写入 Unity Catalog 已存在的表
INSERT INTO iceberg_table VALUES(2, "mary");

-- 创建一张分区表
CREATE TABLE partition_table (
  `ts` DATETIME COMMENT 'ts',
  `col1` BOOLEAN COMMENT 'col1',
  `pt1` STRING COMMENT 'pt1',
  `pt2` STRING COMMENT 'pt2'
)
PARTITION BY LIST (day(ts), pt1, pt2) ();

-- 插入数据
INSERT INTO partition_table VALUES("2025-11-12", true, "foo", "bar");

-- 查看表分区信息
SELECT * FROM partition_table$partitions\G
*************************** 1. row ***************************
                    partition: {"ts_day":"2025-11-12", "pt1":"foo", "pt2":"bar"}
                      spec_id: 0
                 record_count: 1
                   file_count: 1
total_data_file_size_in_bytes: 2552
 position_delete_record_count: 0
   position_delete_file_count: 0
 equality_delete_record_count: 0
   equality_delete_file_count: 0
              last_updated_at: 2025-11-18 15:20:45.964000
     last_updated_snapshot_id: 9024874735105617773
```

## 总结

通过与 Databricks Unity Catalog 的深度集成，Apache Doris 使企业能够在统一治理框架下，以更高性能、更低成本的方式访问和分析数据湖中的核心资产。这一能力不仅增强了 Lakehouse 架构的整体一致性，也为实时分析、交互式查询以及 AI 场景带来了新的可能性。无论是数据团队、分析工程师还是平台架构师，都可以借助 Doris 在现有数据湖基础上构建更敏捷、更智能的数据应用。
