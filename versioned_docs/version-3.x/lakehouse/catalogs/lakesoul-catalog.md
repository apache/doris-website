---
{
    "title": "LakeSoul Catalog",
    "language": "en"
}
---

:::warning Note!
This feature is deprecated since 3.1.0. For usage inquiries, please contact the developers.
:::

Doris supports accessing and reading LakeSoul table data using metadata stored in PostgreSQL.

[Quickly Experience Apache Doris & LakeSoul with Docker](../best-practices/doris-lakesoul.md)

## Applicable Scenarios

| Scenario   | Description                                               |
| ---------- | --------------------------------------------------------- |
| Data Integration | Read LakeSoul data and write it to Doris internal tables, or perform ZeroETL operations using the Doris computing engine. |
| Data Write-back | Not supported.                                       |

## Configuring Catalog

### Syntax

```sql
CREATE CATALOG lakesoul_catalog PROPERTIES (
    'type' = 'lakesoul',
    {LakeSoulProperties},
    {CommonProperties}
);
```

* `{LakeSoulProperties}`

  | Property                  | Description                           | Example |
  | ------------------------- | ------------------------------------- | ------- |
  | `lakesoul.pg.username`    | Username for the PG source database   |         |
  | `lakesoul.pg.password`    | Password for the PG source database   |         |
  | `lakesoul.pg.url`         | JDBC URL for the PG metadata database | `jdbc:postgresql://127.0.0.1:5432/lakesoul_test?stringtype=unspecified` |

* `[CommonProperties]`

  The CommonProperties section is for filling in general properties. Please refer to the [Data Catalog Overview](../catalog-overview.md) under the "Common Properties" section.

If LakeSoul data is stored on HDFS, place `core-site.xml`, `hdfs-site.xml`, and `hive-site.xml` in the `conf/` directory of both FE and BE. The Hadoop configuration files in the `conf/` directory are read first, followed by the configuration files specified by the `HADOOP_CONF_DIR` environment variable.

### Supported LakeSoul Versions

The currently supported LakeSoul version is 2.6.2.

### Supported LakeSoul Formats

- Supports LakeSoul primary key and non-primary key tables.
- Supports reading LakeSoul MOR (Merge-On-Read) tables.

## Column Type Mapping

| LakeSoul Type                        | Doris Type    | Comment                                |
| ---------------------------------- | ------------- | -------------------------------------- |
| boolean                            | boolean       |                                        |
| int8                            | tinyint       |                                        |
| int16                           | smallint      |                                        |
| int32                            | int           |                                        |
| int64                             | bigint        |                                        |
| float                              | float         |                                        |
| double                             | double        |                                        |
| decimal(P, S)                      | decimal(P, S) |                                        |
| string                            | string        |                                        |
| date                               | date          |                                        |
| timestamp(S)    						 | datetime(S)   | |
| list                              | array         |                                        |
| map                                | map           |                                        |
| row                                | struct        |                                        |
| other                              | UNSUPPORTED   |                                        |

## Examples

```sql
CREATE CATALOG lakesoul PROPERTIES (
    'type' = 'lakesoul',
    'lakesoul.pg.username' = 'lakesoul_test',
    'lakesoul.pg.password' = 'lakesoul_test',
    'lakesoul.pg.url' = 'jdbc:postgresql://127.0.0.1:5432/lakesoul_test?stringtype=unspecified'
);
```

## Query Operations

### Basic Query

Once the Catalog is configured, you can query the table data in the Catalog as follows:

```sql
-- 1. switch to catalog, use database and query
SWITCH ls_ctl;
USE ls_db;
SELECT * FROM ls_tbl LIMIT 10;

-- 2. use lakesoul database directly
USE ls_ctl.ls_db;
SELECT * FROM ls_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM ls_ctl.ls_db.ls_tbl LIMIT 10;
```
