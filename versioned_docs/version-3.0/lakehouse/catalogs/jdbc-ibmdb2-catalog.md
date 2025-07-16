---
{
    "title": "IBM Db2 JDBC Catalog",
    "language": "zh-CN"
}
---

The Doris JDBC Catalog supports connecting to IBM Db2 databases through the standard JDBC interface. This document describes how to configure the IBM Db2 database connection.

For an overview of JDBC Catalog, please refer to: [JDBC Catalog Overview](./jdbc-catalog-overview.md)

## Usage Notes

To connect to an IBM Db2 database, you need:

* IBM Db2 11.5.x or higher

* The JDBC driver for the IBM Db2 database, which you can download from the [Maven Repository](https://mvnrepository.com/artifact/com.ibm.db2/jcc) for the latest or specified version of the IBM Db2 driver. It is recommended to use IBM db2 jcc version 11.5.8.0.

* Network connection between each Doris FE and BE node and the IBM Db2 server, with the default port being 51000.

## Connecting to IBM Db2

```sql
CREATE CATALOG db2_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'USERNAME',
    'password' = 'PASSWORD',
    'jdbc_url' = 'jdbc:db2://host:port/database',
    'driver_url' = 'jcc-11.5.8.0.jar',
    'driver_class' = 'com.ibm.db2.jcc.DB2Driver'
)
```

The `jdbc_url` defines the connection information and parameters to be passed to the IBM Db2 driver. Supported URL parameters can be found in the [Db2 JDBC Driver Documentation](https://www.ibm.com/docs/en/db2-big-sql/5.0?topic=drivers-jdbc-driver).

## Hierarchical Mapping

When mapping IBM Db2, Doris's Database corresponds to a Schema under the specified DataBase in DB2 (the "database" parameter in `jdbc_url`). And the Table under Doris's Database corresponds to the Tables under the Schema in DB2. The mapping relationship is as follows:

| Doris    | IBM Db2  |
| -------- | -------- |
| Catalog  | DataBase |
| Database | Schema   |
| Table    | Table    |

## Column Type Mapping

| IBM Db2 Type     | Doris Type    | Comment |
| ---------------- | ------------- | ------- |
| smallint         | smallint      |         |
| int              | int           |         |
| bigint           | bigint        |         |
| double           | double        |         |
| double precision | double        |         |
| float            | double        |         |
| real             | float         |         |
| decimal(P, S)    | decimal(P, S) |         |
| decfloat(P, S)   | decimal(P, S) |         |
| date             | date          |         |
| timestamp(S)     | datetime(S)   |         |
| char(N)          | char(N)       |         |
| varchar(N)       | varchar(N)    |         |
| long varchar(N)  | varchar(N)    |         |
| vargraphic       | string        |         |
| long vargraphic  | string        |         |
| time             | string        |         |
| clob             | string        |         |
| xml              | string        |         |
| other            | UNSUPPORTED   |         |

## Common Issues

1. When reading IBM Db2 data through JDBC Catalog, an `Invalid operation: result set is closed. ERRORCODE=-4470` exception occurs.

   Add connection parameters to the jdbc\_url connection string when creating the IBM Db2 Catalog: `allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`. For example: `jdbc:db2://host:port/database:allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`.