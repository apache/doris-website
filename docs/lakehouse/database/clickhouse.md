---
{
  "title": "ClickHouse",
  "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

Doris JDBC Catalog supports connection to the ClickHouse database through the standard JDBC interface. This document describes how to configure a ClickHouse database connection.

## Terms and Conditions

To connect to the ClickHouse database you need

- ClickHouse 23.x or higher (versions below this are not fully tested).

- JDBC driver for ClickHouse database, you can download the latest or specified version of ClickHouse JDBC driver from [Maven repository](https://mvnrepository.com/artifact/com.clickhouse/clickhouse-jdbc). **ClickHouse JDBC Driver version 0.4.6 is recommended. **

- Doris Network connection between each FE and BE node and the ClickHouse server, default port is 8123.

## Connect to ClickHouse

```sql
CREATE CATALOG clickhouse PROPERTIES (
    "type"="jdbc",
    "user"="default",
    "password"="password",
    "jdbc_url" = "jdbc:clickhouse://example.net:8123/",
    "driver_url" = "clickhouse-jdbc-0.4.6-all.jar",
    "driver_class" = "com.clickhouse.jdbc.ClickHouseDriver"
)
```

:::info remarks
`jdbc_url` defines the connection information and parameters to be passed to the ClickHouse JDBC driver.
Parameters for supported URLs can be found in [ClickHouse JDBC Driver Configuration](https://clickhouse.com/docs/en/integrations/java#configuration).
:::


### Connection security

If you configured TLS with a global trust certificate installed on the data source, you can enable TLS between the cluster and the data source by appending parameters to the JDBC connection string set in the jdbc_url property.

For example, enable TLS by adding the ssl=true parameter to the jdbc_url configuration property:

```sql
"jdbc_url"="jdbc:clickhouse://example.net:8123/db?ssl=true"
```

For more information about TLS configuration options, see [Clickhouse JDBC Driver Documentation SSL Configuration Section](https://clickhouse.com/docs/en/integrations/java#connect-to-clickhouse-with-ssl)

## Hierarchical mapping

When mapping ClickHouse, a Database in Doris corresponds to a Database in ClickHouse. The Table under Doris' Database corresponds to the Tables under the Database in ClickHouse. That is, the mapping relationship is as follows:

|  Doris   |    ClickHouse     |
|:--------:|:-----------------:|
| Catalog  | ClickHouse Server |
| Database |     Database      |
|  Table   |       Table       |

## Type mapping

### ClickHouse to Doris type mapping

| ClickHouse Type        | Doris Type       | Comment                                                                            |
|------------------------|------------------|------------------------------------------------------------------------------------|
| Bool                   | BOOLEAN          |                                                                                    |
| String                 | STRING           |                                                                                    |
| Date/Date32            | DATE             |                                                                                    |
| DateTime/DateTime64    | DATETIME         |                                                                                    |
| Float32                | FLOAT            |                                                                                    |
| Float64                | DOUBLE           |                                                                                    |
| Int8                   | TINYINT          |                                                                                    |
| Int16/UInt8            | SMALLINT         | Doris does not have UNSIGNED data type, so expand by an order of magnitude         |
| Int32/UInt16           | INT              | Doris does not have UNSIGNED data type, so expand by an order of magnitude         |
| Int64/Uint32           | BIGINT           | Doris does not have UNSIGNED data type, so it is expanded by an order of magnitude |
| Int128/UInt64          | LARGEINT         | Doris does not have UNSIGNED data type, so expand it by an order of magnitude      |
| Int256/UInt128/UInt256 | STRING           | Doris does not have a data type of this magnitude and uses STRING for processing   |
| DECIMAL                | DECIMALV3/STRING | Which type will be selected based on the (precision, scale) of the DECIMAL field   |
| Enum/IPv4/IPv6/UUID    | STRING           |                                                                                    |
| Array                  | ARRAY            | Array's internal type adaptation logic refers to the above types                   |
| Other                  | UNSUPPORTED      |                                                                                    |

## Query optimization

### Predicate pushdown

1. When executing a query like `where dt = '2022-01-01'`, Doris can push these filtering conditions down to the external data source, thereby directly excluding data that does not meet the conditions at the data source level, reducing unnecessary data acquisition and transmission. This greatly improves query performance while also reducing the load on external data sources.

2. When the variable `enable_ext_func_pred_pushdown` is set to true, the function conditions after where will also be pushed down to the external data source.

   The functions that currently support push down to ClickHouse are:

   |   Function     |
   |:--------------:|
   | FROM_UNIXTIME  |
   | UNIX_TIMESTAMP |

### Row limit

If you have the limit keyword in the query, Doris will push the limit down to ClickHouse to reduce the amount of data transfer.

### Escape characters

Doris will automatically add the escape character ("") to the field names and table names in the query statements sent to ClickHouse to avoid conflicts between the field names and table names and ClickHouse internal keywords.

## FAQ

1. `NoClassDefFoundError: net/jpountz/lz4/LZ4Factory` error message appears when reading Clickhouse data through ClickHouse Catalog

   You can first download the [lz4-1.3.0.jar](https://repo1.maven.org/maven2/net/jpountz/lz4/lz4/1.3.0/lz4-1.3.0.jar) package and put it in every `custom_lib/` directory under the FE and BE directories (if it does not exist, just create it manually).