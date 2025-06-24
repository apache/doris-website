---
{
  "title": "OceanBase",
  "language": "en"
}
---

Doris JDBC Catalog supports connecting to the OceanBase database through the standard JDBC interface. This document describes how to configure OceanBase database connection.

## Terms and Conditions

To connect to the OceanBase database you need

- OceanBase 3.1.0 or higher

- JDBC driver for OceanBase database, you can download the latest or specified version of OceanBase JDBC driver from [Maven repository](https://mvnrepository.com/artifact/com.oceanbase/oceanbase-client). **It is recommended to use OceanBase Connector/J 2.4.8 or above. **

- Doris Network connection between each FE and BE node and OceanBase server.

## Connect to OceanBase

```sql
CREATE CATALOG oceanbase PROPERTIES (
    "type"="jdbc",
    "user"="root",
    "password"="password",
    "jdbc_url" = "jdbc:oceanbase://host:port/db",
    "driver_url" = "oceanbase-client-2.4.8.jar",
    "driver_class" = "com.oceanbase.jdbc.Driver"
)
```

:::info remarks
`jdbc_url` defines the connection information and parameters to be passed to the OceanBase JDBC driver.
Parameters for supported URLs can be found in [OceanBase JDBC Driver Configuration](https://www.oceanbase.com/docs/common-oceanbase-connector-j-cn-1000000000517111).
:::

## Mode compatible

Doris will automatically recognize that OceanBase is in MySQL or Oracle mode when creating the OceanBase Catalog so that metadata can be parsed correctly.

Hierarchical mapping, type mapping, and query optimization in different modes are the same as the Catalog processing methods of MySQL or Oracle databases. Please refer to the documentation.

- [MySQL Catalog](./mysql.md)
- [Oracle Catalog](./oracle.md)
