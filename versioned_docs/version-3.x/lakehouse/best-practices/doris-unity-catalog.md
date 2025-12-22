---
{
    "title": "Integrating with Databricks Unity Catalog",
    "language": "en",
    "description": "As enterprises increasingly manage growing data assets under the Lakehouse architecture, the demand for cross-platform, high-performance,"
}
---

As enterprises increasingly manage growing data assets under the Lakehouse architecture, the demand for cross-platform, high-performance, and governed data access capabilities becomes more urgent. Apache Doris, as a next-generation real-time analytical database, has now achieved deep integration with [Databricks Unity Catalog](https://www.databricks.com/product/unity-catalog), enabling enterprises to directly access and efficiently query data lakes managed by Databricks under a unified governance framework, achieving seamless data connectivity.

**Through this documentation, you will gain in-depth understanding of:**

- Databricks Environment Setup: How to create External Locations, Catalogs, and Iceberg tables in Databricks, along with related permission configurations

- Doris Connection to Unity Catalog: How to connect Doris to Databricks Unity Catalog and access Iceberg tables

> Note: This functionality requires Doris version 3.1.3 or higher.

## Databricks Environment Setup

### Creating an External Location

In Unity Catalog, an [External Location](https://docs.databricks.com/aws/en/sql/language-manual/sql-ref-external-locations) is a secure object that associates paths in cloud object storage with Storage Credentials. External Locations support external access, and Unity Catalog can issue short-term credentials to external systems through the Credential Vending feature, allowing external systems to access these paths.

![unity1](/images/integrations/lakehouse/unity/unity-1.png)

This document uses AWS Quickstart to create an External Location in AWS S3.

![unity2](/images/integrations/lakehouse/unity/unity-2.png)

After creation, you can see the External Catalog and its corresponding Credential:

![unity3](/images/integrations/lakehouse/unity/unity-3.png)

### Creating a Catalog

Click the Create Catalog option in the interface.

![unity4](/images/integrations/lakehouse/unity/unity-4.png)

Fill in the Catalog name. Uncheck `Use default storage` and select the External Location created earlier.

![unity5](/images/integrations/lakehouse/unity/unity-5.png)

### Enabling External Use Schema Permissions

Click on the newly created `Catalog` → `Permissions` → `Grant`:

![unity6](/images/integrations/lakehouse/unity/unity-6.png)

Select `All account users` and check the `EXTERNAL USE SCHEMA` option.

![unity7](/images/integrations/lakehouse/unity/unity-7.png)

### Creating Iceberg Tables and Inserting Data

Execute the following SQL in Databricks SQL Editor to create an Iceberg table and insert data:

```sql
CREATE TABLE `my-unity-catalog`.default.iceberg_table (
  id int,
  name string
) USING iceberg;

INSERT INTO `my-unity-catalog`.default.iceberg_table VALUES(1, "jack");
```

### Obtaining Access Token

Click the user avatar in the top right corner, go to the `Settings` page, and select `Access tokens` under `User` → `Developer`. Create a new Token for subsequent use when connecting Doris to Unity Catalog. The Token is a string in the format: `dapi4f...`

## Doris Connection to Unity Catalog

### Creating a Catalog

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

### Accessing the Catalog

Once created, you can start accessing Iceberg tables stored in Unity Catalog:

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

### Managing Iceberg Tables

You can also directly create, manage, and write to Iceberg tables in Unity Catalog through Doris:

```sql
-- Write to existing table in Unity Catalog
INSERT INTO iceberg_table VALUES(2, "mary");

-- Create a partitioned table
CREATE TABLE partition_table (
  `ts` DATETIME COMMENT 'ts',
  `col1` BOOLEAN COMMENT 'col1',
  `pt1` STRING COMMENT 'pt1',
  `pt2` STRING COMMENT 'pt2'
)
PARTITION BY LIST (day(ts), pt1, pt2) ();

-- Insert data
INSERT INTO partition_table VALUES("2025-11-12", true, "foo", "bar");

-- View table partition information
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

## Summary

Through deep integration with Databricks Unity Catalog, Apache Doris enables enterprises to access and analyze core assets in data lakes with higher performance and lower costs under a unified governance framework. This capability not only enhances the overall consistency of the Lakehouse architecture but also brings new possibilities for real-time analytics, interactive queries, and AI scenarios. Whether data teams, analytics engineers, or platform architects, they can all leverage Doris to build more agile and intelligent data applications on top of existing data lake foundations.
