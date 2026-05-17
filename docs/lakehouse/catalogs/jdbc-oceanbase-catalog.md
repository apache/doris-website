---
{
    "title": "Oceanbase JDBC Catalog",
    "language": "en",
    "description": "Doris JDBC Catalog supports connecting to OceanBase database through the standard JDBC interface."
}
---

Doris JDBC Catalog supports connecting to OceanBase database through the standard JDBC interface. This document describes how to configure the OceanBase database connection.

For an overview of JDBC Catalog, please refer to: [JDBC Catalog Overview](./jdbc-catalog-overview.md)

## Usage Notes

To connect to the OceanBase database, you need

* OceanBase 3.1.0 or higher

* JDBC driver for OceanBase database, which you can download the latest or specified version of OceanBase JDBC driver from [Maven Repository](https://mvnrepository.com/artifact/com.oceanbase/oceanbase-client). It is recommended to use OceanBase Connector/J 2.4.8 or above.

* Network connection between each FE and BE node of Doris and the OceanBase server.

## Connect to OceanBase

```sql
CREATE CATALOG oceanbase_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:oceanbase://host:port/db',
    'driver_url' = 'oceanbase-client-2.4.8.jar',
    'driver_class' = 'com.oceanbase.jdbc.Driver'
)
```

`jdbc_url` defines the connection information and parameters to be passed to the OceanBase JDBC driver. Supported URL parameters can be found in [OceanBase JDBC Driver Configuration](https://www.oceanbase.com/docs/common-oceanbase-connector-j-cn-1000000000517111).

## Schema Compatibility

When creating an OceanBase Catalog, Doris will automatically recognize whether OceanBase is in MySQL or Oracle mode to correctly parse metadata.

The hierarchy mapping, type mapping, and query optimization in different modes are handled in the same way as the Catalog of MySQL or Oracle databases, and you can refer to the documentation

* [MySQL Catalog](./jdbc-mysql-catalog.md)

* [Oracle Catalog](./jdbc-oracle-catalog.md)