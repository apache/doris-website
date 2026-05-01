---
{
    "title": "Oracle JDBC Catalog",
    "language": "en",
    "description": "Apache Doris JDBC Catalog supports connecting to Oracle databases via the standard JDBC interface."
}
---

Apache Doris JDBC Catalog supports connecting to Oracle databases via the standard JDBC interface. This document describes how to configure Oracle database connections.

For an overview of JDBC Catalog, please refer to: [JDBC Catalog Overview](./jdbc-catalog-overview.md)

## Usage Notes

To connect to an Oracle database, you need

* Oracle 19c, 18c, 12c, 11g, or 10g.

* The JDBC driver for Oracle databases, which you can download from the [Maven Repository](https://mvnrepository.com/artifact/com.oracle.database.jdbc) for Ojdbc8 and above versions of the Oracle JDBC driver.

* Network connection between each FE and BE node of Apache Doris and the Oracle server, with the default port being 1521; if Oracle RAC is ONS-enabled, port 6200 is also required.

## Connecting to Oracle

```sql
CREATE CATALOG oracle_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password'='pwd',
    'jdbc_url' = 'jdbc:oracle:thin:@example.net:1521:orcl',
    'driver_url' = 'ojdbc8.jar',
    'driver_class' = 'oracle.jdbc.driver.OracleDriver'
)
```

`jdbc_url` defines the connection information and parameters to be passed to the JDBC driver. When using the Oracle JDBC Thin driver, the syntax of the URL may vary depending on your Oracle configuration. For example, if you are connecting to an Oracle SID or Oracle service name, the connection URL will differ. For more information, please refer to the [Oracle Database JDBC Driver Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/19/jjdbc/data-sources-and-URLs.html). The above example URL connects to an Oracle SID named `orcl`.

## Hierarchical Mapping

When mapping Oracle, a Database in Apache Doris corresponds to a User in Oracle. And a Table under a Database in Apache Doris corresponds to a Table accessible by that User in Oracle. The mapping relationship is as follows:

| Doris    | Oracle   |
| -------- | -------- |
| Catalog  | Database |
| Database | User     |
| Table    | Table    |

## Column Type Mapping

| Oracle Type                           | Doris Type                           | Comment                                                                                                         |
| ------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| number(P) / number(P, 0)              | tinyint/smallint/int/bigint/largeint | Doris will choose the corresponding type based on the size of P: P < 3: TINYINT; P < 5: SMALLINT; P < 10: INT; P < 19: BIGINT; P > 19: LARGEINT |
| number(P, S), if (S > 0 && P > S) | decimal(P, S)                        |                                                                                                                 |
| number(P, S), if (S > 0 && P < S) | decimal(S, S)                        |                                                                                                                 |
| number(P, S), if (S < 0)          | tinyint/smallint/int/bigint/largeint | In the case of S < 0, Doris will set P to `P + |S|`, and perform the same mapping as `number(P) / number(P, 0)`                                         |
| number                                |                                      | Doris currently does not support the number type without specified P and S                                                                                       |
| decimal(P, S)                         | decimal(P, S)                        |                                                                                                                 |
| float/real                            | double                               |                                                                                                                 |
| date                                  | date                                 |                                                                                                                 |
| timestamp                             | datetime(S)                          |                                                                                                                 |
| timestamp(s) with local time zone | datetime / timestamptz | Controlled by the `enable.mapping.timestamp_tz` property (supported since version 4.0.3). By default, it is `false`, in which case it is mapped to `datetime`; when set to `true`, it is mapped to the `timestamptz` type. |
| char/nchar                            | string                               |                                                                                                                 |
| varchar2/nvarchar2                    | string                               |                                                                                                                 |
| long/raw/long raw/internal            | string                               |                                                                                                                 |
| BLOB             | varbinary     |Controlled by the `enable.mapping.varbinary` property of Catalog (supported since 4.0.2). The default is `false`, which maps to `string`; when `true`, it maps to `varbinary` type.|
| other                                 | UNSUPPORTED                          |                                                                                                                 |

## Common Issues

1. `ONS configuration failed` occurs when creating or querying Oracle Catalog

   Add -Doracle.jdbc.fanEnabled=false to JAVA\_OPTS in be.conf and upgrade the driver to <https://repo1.maven.org/maven2/com/oracle/database/jdbc/ojdbc8/19.23.0.0/ojdbc8-19.23.0.0.jar>

2. `Non supported character set (add orai18n.jar in your classpath): ZHS16GBK` exception occurs when creating or querying Oracle Catalog

   Download [orai18n.jar](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html) and place it in the `custom_lib/` directory under each FE and BE (create manually if it does not exist) and restart each FE and BE.
