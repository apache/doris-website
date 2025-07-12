---
{
    "title": "Clickhouse JDBC Catalog",
    "language": "en"
}
---

The Doris JDBC Catalog supports connecting to the ClickHouse database via the standard JDBC interface. This document describes how to configure the ClickHouse database connection.

For an overview of the JDBC Catalog, please refer to: [JDBC Catalog Overview](./jdbc-catalog-overview.md)

## Usage Notes

To connect to the ClickHouse database, you need

* ClickHouse version 23.x or higher (versions below this have not been fully tested).

* The JDBC driver for the ClickHouse database, which you can download from the [Maven Repository](https://mvnrepository.com/artifact/com.clickhouse/clickhouse-jdbc) for the latest or specified version of the ClickHouse JDBC driver. It is recommended to use version 0.4.6 of the ClickHouse JDBC Driver.

* Network connection between each FE and BE node of Doris and the ClickHouse server, with the default port being 8123.

## Connecting to ClickHouse

```sql
CREATE CATALOG clickhouse PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:clickhouse://example.net:8123/',
    'driver_url' = 'clickhouse-jdbc-0.4.6-all.jar',
    'driver_class' = 'com.clickhouse.jdbc.ClickHouseDriver'
)
```

The `jdbc_url` defines the connection information and parameters to be passed to the ClickHouse JDBC driver. Supported URL parameters can be found in the [ClickHouse JDBC Driver Configuration](https://clickhouse.com/docs/en/integrations/java#configuration).

### Connection Security

If you have configured TLS with a globally trusted certificate installed on the data source, you can enable TLS between the cluster and the data source by appending parameters to the JDBC connection string set in the jdbc\_url property.

For example, enable TLS by adding the ssl=true parameter to the jdbc\_url configuration property:

```sql
'jdbc_url' = 'jdbc:clickhouse://example.net:8123/db?ssl=true'
```

For more information on TLS configuration options, please refer to the [Clickhouse JDBC Driver Documentation SSL Configuration Section](https://clickhouse.com/docs/en/integrations/java#connect-to-clickhouse-with-ssl)

## Hierarchical Mapping

When mapping ClickHouse, a Database in Doris corresponds to a Database in ClickHouse. And a Table under a Database in Doris corresponds to Tables under that Database in ClickHouse. The mapping relationship is as follows:

| Doris    | ClickHouse        |
| -------- | ----------------- |
| Catalog  | ClickHouse Server |
| Database | Database          |
| Table    | Table             |

## Column Type Mapping

| ClickHouse Type           | Doris Type              | Comment                          |
| ------------------------- | ----------------------- | -------------------------------- |
| bool                      | boolean                 |                                  |
| string                    | string                  |                                  |
| date/date32               | date                    |                                  |
| datetime(S)/datetime64(S) | datetime(S)             |                                  |
| float32                   | float                   |                                  |
| float64                   | double                  |                                  |
| int8                      | tinyint                 |                                  |
| int16/uint8               | smallint                | Doris does not have UNSIGNED data types, so it is scaled up by one magnitude |
| int32/uInt16              | int                     | Same as above                    |
| int64/uint32              | bigint                  | Same as above                    |
| int128/uint64             | largeint                | Same as above                    |
| int256/uint128/uint256    | string                  | Doris does not have data types of this magnitude, so it is handled with STRING |
| decimal(P, S)             | decimal(P, S) or string | If it exceeds the maximum precision supported by Doris, use string to handle it |
| enum/ipv4/ipv6/uuid       | string                  |                                  |
| array                     | array                   |                                  |
| other                     | UNSUPPORTED             |                                  |

## Related Parameters

- `jdbc_clickhouse_query_final`

  Session variable, default is false. When set to true, `SETTINGS final = 1` will be appended to the SQL statements sent to Clickhouse.

## Common Issues

1. Encountering `NoClassDefFoundError: net/jpountz/lz4/LZ4Factory` error message when reading Clickhouse data

   You can first download the [lz4-1.3.0.jar](https://repo1.maven.org/maven2/net/jpountz/lz4/lz4/1.3.0/lz4-1.3.0.jar) package and place it in the `custom_lib/` directory under each FE and BE directory (if it does not exist, create it manually).