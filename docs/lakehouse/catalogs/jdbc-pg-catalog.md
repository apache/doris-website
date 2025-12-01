---
{
    "title": "PostgreSQL JDBC Catalog",
    "language": "en"
}
---

Doris JDBC Catalog supports connecting to PostgreSQL databases via the standard JDBC interface. This document describes how to configure a PostgreSQL database connection.

For an overview of JDBC Catalog, please refer to: [JDBC Catalog Overview](./jdbc-catalog-overview.md)

## Usage Notes

To connect to a PostgreSQL database, you need

* PostgreSQL 11.x or higher

* JDBC driver for PostgreSQL database, which you can download the latest or specified version from [Maven Repository](https://mvnrepository.com/artifact/org.postgresql/postgresql). It is recommended to use PostgreSQL JDBC Driver version 42.5.x or above.

* Network connection between each FE and BE node of Doris and the PostgreSQL server, with the default port being 5432.

## Connecting to PostgreSQL

```sql
CREATE CATALOG postgresql_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:postgresql://host:5432/postgres',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
```

`jdbc_url` defines the connection information and parameters to be passed to the PostgreSQL JDBC driver. Supported URL parameters can be found in the [PostgreSQL JDBC Driver Documentation](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database).

### Connection Security

If you have configured TLS with a globally trusted certificate installed on the data source, you can enable TLS between the cluster and the data source by appending parameters to the JDBC connection string set in the jdbc\_url property.

For example, for version 42 of the PostgreSQL JDBC driver, enable TLS by adding the ssl=true parameter to the jdbc\_url configuration property:

```sql
"jdbc_url"="jdbc:postgresql://example.net:5432/database?ssl=true"
```

For more information on TLS configuration options, please refer to the [PostgreSQL JDBC Driver Documentation](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database).

## Hierarchical Mapping

When mapping PostgreSQL, a Database in Doris corresponds to a Schema under a specified database in PostgreSQL (as in the example `jdbc_url` parameter under `postgres`). A Table under a Database in Doris corresponds to Tables under that Schema in PostgreSQL. The mapping relationship is as follows:

| Doris    | PostgreSQL |
| -------- | ---------- |
| Catalog  | Database   |
| Database | Schema     |
| Table    | Table      |

## Column Type Mapping

| PostgreSQL Type                         | Doris Type             |                                                                 |
| --------------------------------------- | ---------------------- | --------------------------------------------------------------- |
| boolean                                 | boolean                |                                                                 |
| smallint/int2                           | smallint               |                                                                 |
| integer/int4                            | int                    |                                                                 |
| bigint/int8                             | bigint                 |                                                                 |
| decimal/numeric                         | decimal(P, S) / string | Numeric without precision will be mapped to string type, and needs to be converted to decimal type for numerical calculations, and does not support write-back.    |
| real/float4                             | float                  |                                                                 |
| double                                  | double                 |                                                                 |
| smallserial                             | smallint               |                                                                 |
| serial                                  | int                    |                                                                 |
| bigserial                               | bigint                 |                                                                 |
| char(N)                                 | char(N)                |                                                                 |
| varchar/text                            | string                 |                                                                 |
| timestamp(S)/timestampz(S)              | datetime(S)            |                                                                 |
| date                                    | date                   |                                                                 |
| json/jsonb                              | string                 | For better reading and computing performance balance, Doris maps JSON type to STRING type.                   |
| time                                    | string                 | Doris does not support time type, time type will be mapped to string.                          |
| interval                                | string                 |                                                                 |
| point/line/lseg/box/path/polygon/circle | string                 |                                                                 |
| cidr/inet/macaddr                       | string                 |                                                                 |
| uuid                                    | string                 |                                                                 |
| bit                                     | boolean / string       | Doris does not support bit type, bit type will be mapped to boolean when bit(1), otherwise mapped to string. |
| bytea             | varbinary     |Controlled by the `enable.mapping.varbinary` property of Catalog (supported since 4.0.3). The default is `false`, which maps to `string`; when `true`, it maps to `varbinary` type.|
| other                                   | UNSUPPORTED            |                                                                 |

## Appendix

### Time Zone Issues

Since Doris does not support timestamp types with time zones, when reading the timestampz type from PostgreSQL, Doris will map it to DATETIME type and convert it to local time zone time when reading.

And because when reading data from JDBC type Catalog, the Java part of BE uses the JVM time zone. The JVM time zone defaults to the time zone of the BE deployment machine, which affects the time zone conversion when JDBC reads data.

To ensure time zone consistency, it is recommended to set the JVM time zone in `JAVA_OPTS` of `be.conf` to be consistent with the `time_zone` of Doris session.
