---
{
    "title": "Doris and MaxCompute Data Integration",
    "language": "en",
    "description": "Achieve bidirectional data integration between Apache Doris and Alibaba Cloud MaxCompute through MaxCompute Catalog, supporting data import, write-back, and database/table management to help enterprises build an efficient lakehouse architecture."
}
---

This document describes how to achieve data integration between Apache Doris and Alibaba Cloud MaxCompute through [MaxCompute Catalog](../catalogs/maxcompute-catalog.md):

- **Data Import**: Quickly import data from MaxCompute into Doris for analysis.
- **Data Write-back** (4.1.0+): Write analysis results or data from other sources in Doris back to MaxCompute.
- **Database/Table Management** (4.1.0+): Create and manage MaxCompute databases and tables directly in Doris.

This document is based on Apache Doris version 2.1.9. Some features require version 4.1.0 or later.

## Environment Preparation

### 01 Enable MaxCompute Open Storage API

In the [MaxCompute Console](https://maxcompute.console.aliyun.com/), navigate to the left sidebar -> `Tenant Management` -> `Tenant Properties` -> Enable the `Open Storage (Storage API) Switch`

### 02 Grant MaxCompute Permissions

Doris uses AK/SK to access MaxCompute services. Ensure that the IAM user corresponding to the AK/SK has the following roles or permissions for the MaxCompute service:

```json
{
    "Statement": [
        {
            "Action": [
                "odps:List",
                "odps:Usage"
            ],
            "Effect": "Allow",
            "Resource": ["acs:odps:*:regions/*/quotas/pay-as-you-go"]
        }
    ],
    "Version": "1"
}
```

### 03 Verify Doris and MaxCompute Network Environment

It is strongly recommended that the Doris cluster and MaxCompute service are in the same VPC, with proper security groups configured.

The examples in this document are tested under the same VPC network conditions.

## Importing MaxCompute Data

### 01 Create Catalog

```sql
CREATE CATALOG mc PROPERTIES (
    "type" = "max_compute",
    "mc.default.project" = "xxx",
    "mc.access_key" = "AKxxxxx",
    "mc.secret_key" = "SKxxxxx",
    "mc.endpoint" = "xxxxx"
);
```

To support Schema hierarchy (3.1.3+):

```sql
CREATE CATALOG mc PROPERTIES (
    "type" = "max_compute",
    "mc.default.project" = "xxx",
    "mc.access_key" = "AKxxxxx",
    "mc.secret_key" = "SKxxxxx",
    "mc.endpoint" = "xxxxx",
    "mc.enable.namespace.schema" = "true"
);
```

For more details, please refer to the [MaxCompute Catalog](../catalogs/maxcompute-catalog.md) documentation.

### 02 Import TPCH Dataset

We use the TPCH 100 dataset from MaxCompute public datasets as an example (data has already been imported into MaxCompute), and use the `CREATE TABLE AS SELECT` statement to import MaxCompute data into Doris.

This dataset contains 7 tables. The largest table `lineitem` has 16 columns, 600,037,902 rows, and occupies approximately 30GB of disk space.

```sql
-- switch catalog
SWITCH internal;
-- create database
CREATE DATABASE tpch_100g;
-- ingest data
CREATE TABLE tpch_100g.lineitem AS SELECT * FROM mc.selectdb_test.lineitem;
CREATE TABLE tpch_100g.nation AS SELECT * FROM mc.selectdb_test.nation;
CREATE TABLE tpch_100g.orders AS SELECT * FROM mc.selectdb_test.orders;
CREATE TABLE tpch_100g.part AS SELECT * FROM mc.selectdb_test.part;
CREATE TABLE tpch_100g.partsupp AS SELECT * FROM mc.selectdb_test.partsupp;
CREATE TABLE tpch_100g.region AS SELECT * FROM mc.selectdb_test.region;
CREATE TABLE tpch_100g.supplier AS SELECT * FROM mc.selectdb_test.supplier;
```

On a Doris cluster with a single BE (16C 64G), the above operations executed serially take approximately 6-7 minutes.

### 03 Import GitHub Event Dataset

We use the GitHub Event dataset from MaxCompute public datasets as an example (data has already been imported into MaxCompute), and use the `CREATE TABLE AS SELECT` statement to import MaxCompute data into Doris.

Here we select data from 365 partitions of the `dwd_github_events_odps` table, from `2015-01-01` to `2016-01-01`. The data contains 32 columns, 212,786,803 rows, and occupies approximately 10GB of disk space.

```sql
-- switch catalog
SWITCH internal;
-- create database
CREATE DATABASE github_events;
-- ingest data
CREATE TABLE github_events.dwd_github_events_odps
AS SELECT * FROM mc.github_events.dwd_github_events_odps
WHERE ds BETWEEN '2015-01-01' AND '2016-01-01';
```

On a Doris cluster with a single BE (16C 64G), the above operation takes approximately 2 minutes.

## Writing Data Back to MaxCompute (4.1.0+)

Starting from version 4.1.0, Doris supports writing data back to MaxCompute. This feature is applicable to the following scenarios:

- **Analysis Result Write-back**: After completing data analysis in Doris, write the results back to MaxCompute for use by other systems.
- **Data Processing**: Leverage Doris's powerful computing capabilities to perform ETL processing on data, and store the processed data in MaxCompute.
- **Cross-source Data Integration**: Consolidate data from multiple sources in Doris and write it to MaxCompute for unified management.

:::note
- This is an experimental feature, supported starting from version 4.1.0.
- Supports writing to partitioned and non-partitioned tables.
- Does not support writing to clustered tables, transactional tables, Delta Tables, and external tables.
:::

### 01 INSERT INTO Append Write

The INSERT operation appends data to the MaxCompute target table.

```sql
-- Switch to MaxCompute Catalog
SWITCH mc;

-- Insert a single row of data
INSERT INTO mc_db.mc_tbl VALUES (val1, val2, val3, val4);

-- Import data from Doris internal table to MaxCompute
INSERT INTO mc_db.mc_tbl SELECT col1, col2 FROM internal.db1.tbl1;

-- Write to specific columns
INSERT INTO mc_db.mc_tbl(col1, col2) VALUES (val1, val2);

-- Write to specific partition (you can specify only some partition columns, with the rest written dynamically)
INSERT INTO mc_db.mc_tbl PARTITION(ds='20250201') SELECT id, name FROM internal.db1.source_tbl;
```

### 02 INSERT OVERWRITE Overwrite Write

INSERT OVERWRITE completely replaces the existing data in the table with new data.

```sql
-- Full table overwrite
INSERT OVERWRITE TABLE mc_db.mc_tbl VALUES (val1, val2, val3, val4);

-- Overwrite from another table
INSERT OVERWRITE TABLE mc_db.mc_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;

-- Overwrite specific partition
INSERT OVERWRITE TABLE mc_db.mc_tbl PARTITION(ds='20250101') VALUES (10, 'new1');
```

### 03 CTAS Create Table and Write

You can use the `CREATE TABLE AS SELECT` statement to create a new table in MaxCompute and write data to it.

```sql
-- Create table in MaxCompute and import data
CREATE TABLE mc_db.mc_new_tbl AS SELECT * FROM internal.db1.source_tbl;
```

## Database/Table Management (4.1.0+)

Starting from version 4.1.0, Doris supports creating and deleting databases and tables directly in MaxCompute. This feature is applicable to the following scenarios:

- **Unified Data Management**: Manage metadata from multiple data sources centrally in Doris, without switching to the MaxCompute console.
- **Automated Data Pipelines**: Dynamically create target tables in ETL workflows to achieve end-to-end automation.

:::note
- This is an experimental feature, supported starting from version 4.1.0.
- This feature is only available when the `mc.enable.namespace.schema` property is set to `true`.
- Supports creating and deleting partitioned and non-partitioned tables.
- Does not support creating clustered tables, transactional tables, Delta Tables, and external tables.
:::

### 01 Create and Drop Database

```sql
-- Switch to MaxCompute Catalog
SWITCH mc;

-- Create Schema
CREATE DATABASE IF NOT EXISTS mc_schema;

-- Create using fully qualified name
CREATE DATABASE IF NOT EXISTS mc.mc_schema;

-- Drop Schema (will also delete all tables within it)
DROP DATABASE IF EXISTS mc.mc_schema;
```

:::caution
For MaxCompute Database, dropping it will also delete all tables within it. Please proceed with caution.
:::

### 02 Create and Drop Table

```sql
-- Create non-partitioned table
CREATE TABLE mc_schema.mc_tbl1 (
    id INT,
    name STRING,
    amount DECIMAL(18, 6),
    create_time DATETIME
);

-- Create partitioned table
CREATE TABLE mc_schema.mc_tbl2 (
    id INT,
    val STRING,
    ds STRING,
    region STRING
)
PARTITION BY (ds, region)();

-- Drop table (will also delete data, including partition data)
DROP TABLE IF EXISTS mc_schema.mc_tbl1;
```

For more details, please refer to the [MaxCompute Catalog](../catalogs/maxcompute-catalog.md) documentation.
