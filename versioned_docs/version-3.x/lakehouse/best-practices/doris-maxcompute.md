---
{
    "title": "From MaxCompute to Doris",
    "language": "en",
    "description": "This document explains how to quickly import data from Alibaba Cloud MaxCompute into Apache Doris using the MaxCompute Catalog."
}
---

This document explains how to quickly import data from Alibaba Cloud MaxCompute into Apache Doris using the [MaxCompute Catalog](../catalogs/maxcompute-catalog.md).

This document is based on Apache Doris version 2.1.9.

## Environment Preparation

### 01 Enable MaxCompute Open Storage API

In the left navigation bar of the [MaxCompute Console](https://maxcompute.console.aliyun.com/) -> `Tenant Management` -> `Tenant Properties` -> Turn on the `Open Storage (Storage API) switch`.

### 02 Enable MaxCompute Permissions

Doris uses AK/SK to access MaxCompute services. Please ensure that the IAM user corresponding to the AK/SK has the following roles or permissions for the corresponding MaxCompute services:

```json
{
    "Statement": [{
            "Action": ["odps:List",
                "odps:Usage"],
            "Effect": "Allow",
            "Resource": ["acs:odps:*:regions/*/quotas/pay-as-you-go"]}],
    "Version": "1"
}
```

### 03 Confirm Doris and MaxCompute Network Environment

It is strongly recommended that the Doris cluster and MaxCompute service are in the same VPC and ensure that the correct security group is set.

The examples in this document are tested in the same VPC network environment.

## Import MaxCompute Data

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

Support Schema Level (3.1.3+):

```sql
CREATE CATALOG mc PROPERTIES (
  "type" = "max_compute",
  "mc.default.project" = "xxx",
  "mc.access_key" = "AKxxxxx",
  "mc.secret_key" = "SKxxxxx",
  "mc.endpoint" = "xxxxx",
  'mc.enable.namespace.schema' = 'true'
);
```

Please refer to the [MaxCompute Catalog](../catalogs/maxcompute-catalog.md) documentation for details.

### 02 Import TPCH Dataset

We use the TPCH 100 dataset from the public datasets in MaxCompute as an example (data has already been imported into MaxCompute), and use the `CREATE TABLE AS SELECT` statement to import MaxCompute data into Doris.

This dataset contains 7 tables. The largest table, `lineitem`, has 16 columns and 600,037,902 rows. It occupies about 30GB of disk space.

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

In a Doris cluster with a single BE of 16C 64G specification, the above operations take about 6-7 minutes to execute serially.

### 03 Import Github Event Dataset

We use the Github Event dataset from the public datasets in MaxCompute as an example (data has already been imported into MaxCompute), and use the `CREATE TABLE AS SELECT` statement to import MaxCompute data into Doris.

Here we select data from the `dwd_github_events_odps` table for the 365 partitions from '2015-01-01' to '2016-01-01'. The data has 32 columns and 212,786,803 rows. It occupies about 10GB of disk space.

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

In a Doris cluster with a single BE of 16C 64G specification, the above operation takes about 2 minutes.