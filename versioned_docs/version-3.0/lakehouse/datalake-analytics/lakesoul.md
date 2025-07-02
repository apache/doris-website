---
{
    "title": "LakeSoul Catalog",
    "language": "en"
}
---

:::tip
This is an experimental feature.
:::

## Instructions for use

1. Currently, LakeSoul is supported as a source for read operations. LakeSoul's primary key table, non-primary key table, and MOR reading are all supported.
2. When LakeSoul's data is stored on HDFS, core-site.xml, hdfs-site.xml, and hive-site.xml need to be placed in the conf directory of FE and BE. The hadoop configuration file in the conf directory is read first, and then the relevant configuration files of the environment variable `HADOOP_CONF_DIR` are read.

## Create Catalog

When creating a LakeSoul Catalog, you need to specify the connection information of the LakeSoul's metadata DB. For more information about setting up the LakeSoul environment, please refer to the [LakeSoul Documentation](https://lakesoul-io.github.io/docs/Getting%20Started/setup-local-env).

### Example of Creating LakeSoul Catalog

```sql
create catalog lakesoul properties (
'type'='lakesoul',
'lakesoul.pg.username'='lakesoul_test',
'lakesoul.pg.password'='lakesoul_test',
'lakesoul.pg.url'='jdbc:postgresql://127.0.0.1:5432/lakesoul_test?stringtype=unspecified'
);
```

## Supported Data Types
| Doris Data Type           | Comment               |
| ------------------------- | --------------------- |
| Boolean                   | Supported             |
| TinyInt                   | Supported             |
| SmallInt                  | Supported             |
| Int                       | Supported             |
| Float                     | Supported             |
| BigInt                    | Supported             |
| Double                    | Supported             |
| VarChar                   | Supported             |
| Char                      | Supported             |
| String                    | Supported             |
| Decimal(precision, scale) | Supported             |
| DateTime                  | Supported             |
| Date                      | Supported             |
| Array                     | Support Nested Array  |
| Map                       | Support Nested Map    |
| Struct                    | Support Nested Struct |
