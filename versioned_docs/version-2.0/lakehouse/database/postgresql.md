---
{
  "title": "PostgreSQL",
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

Doris JDBC Catalog supports connecting to PostgreSQL databases through the standard JDBC interface. This document describes how to configure a PostgreSQL database connection.

## Terms and Conditions

To connect to a PostgreSQL database, you need

- PostgreSQL 11.x or higher

- JDBC driver for PostgreSQL database, which you can download from the [Maven repository](https://mvnrepository.com/artifact/org.postgresql/postgresql)
  Download the latest or specified version of the PostgreSQL JDBC driver. **It is recommended to use PostgreSQL JDBC Driver 42.5.x and above. **

- Doris Network connection between each FE and BE node and the PostgreSQL server, default port is 5432.

## Connect to PostgreSQL

```sql
CREATE CATALOG postgresql PROPERTIES (
    "type"="jdbc",
    "user"="root",
    "password"="secret",
    "jdbc_url" = "jdbc:postgresql://example.net:5432/postgres",
    "driver_url" = "postgresql-42.5.6.jar",
    "driver_class" = "org.postgresql.Driver"
)
```

:::info remarks
`jdbc_url` defines the connection information and parameters to be passed to the PostgreSQL JDBC driver.
Parameters for supported URLs can be found in the [PostgreSQL JDBC Driver Documentation](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database).
:::

### Connection security

If you configured TLS with a globally trusted certificate installed on the data source, you can enable TLS between the cluster and the data source by appending the parameter to the JDBC connection string set in the jdbc_url property.

For example, for version 42 of the PostgreSQL JDBC driver, enable TLS by adding the ssl=true parameter to the jdbc_url configuration property:

```sql
"jdbc_url"="jdbc:postgresql://example.net:5432/database?ssl=true"
```

For more information about TLS configuration options, see the [PostgreSQL JDBC Driver documentation](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database).

## Hierarchical mapping

When mapping PostgreSQL, a Database in Doris corresponds to a Schema under the specified database in PostgreSQL (such as the schemas under `postgres` in the `jdbc_url` parameter in the example). The Table under Doris' Database corresponds to the Tables under the Schema in PostgreSQL. That is, the mapping relationship is as follows:

| Doris    | PostgreSQL   |
|:--------:|:------------:|
| Catalog  |   Database   |
| Database |    Schema    |
|  Table   |    Table     |

## Type mapping

### PostgreSQL to Doris type mapping

| PostgreSQL Type                         | Doris Type     | Comment                              |
|-----------------------------------------|----------------|--------------------------------------|
| boolean                                 | BOOLEAN        |                                      |
| smallint/int2                           | SMALLINT       |                                      |
| integer/int4                            | INT            |                                      |
| bigint/int8                             | BIGINT         |                                      |
| decimal/numeric                         | DECIMAL        |                                      |
| real/float4                             | FLOAT          |                                      |
| double precision                        | DOUBLE         |                                      |
| smallserial                             | SMALLINT       |                                      |
| serial                                  | INT            |                                      |
| bigserial                               | BIGINT         |                                      |
| char                                    | CHAR           |                                      |
| varchar/text                            | STRING         |                                      |
| timestamp/timestampz                    | DATETIME       |                                      |
| date                                    | DATE           |                                      |
| json/jsonb                              | STRING         |                                      |
| time                                    | STRING         |                                      |
| interval                                | STRING         |                                      |
| point/line/lseg/box/path/polygon/circle | STRING         |                                      |
| cidr/inet/macaddr                       | STRING         |                                      |
| bit                                     | BOOLEAN/STRING |                                      |
| uuid                                    | STRING         |                                      |
| Other                                   | UNSUPPORTED    |                                      |


:::tip
- No-precision numeric will be mapped to the String type. When performing numerical calculations, it needs to be converted to the DECIMAL type first, and write-back is not supported.
- In order to better balance reading and computing performance, Doris will map the JSON type to the STRING type.
- Doris does not support the BIT type. The BIT type will be mapped to BOOLEAN when BIT(1) is used, and to STRING in other cases.
- Doris does not support the time type, and the TIME type will be mapped to STRING.
:::

### Timestamp type processing

Since Doris does not support timestamp types with time zones, when reading the timestampz type of PostgreSQL, Doris will map it to the DATETIME type and convert it to the time in the local time zone when reading.

And since the Java part of BE uses the JVM time zone when reading data from the JDBC type Catalog. The JVM time zone defaults to the time zone of the BE deployment machine, which affects the time zone conversion when JDBC reads data.

In order to ensure time zone consistency, it is recommended to set the JVM time zone in JAVA_OPTS of be.conf to be consistent with the `time_zone` of the Doris session.

## Query optimization

### Predicate pushdown

When executing a query like `where dt = '2022-01-01'`, Doris can push these filtering conditions down to the external data source, thereby directly excluding data that does not meet the conditions at the data source level, reducing inaccuracies. Necessary data acquisition and transmission. This greatly improves query performance while also reducing the load on external data sources.

### Row limit

If you have the limit keyword in the query, Doris will push the limit down to PostgreSQL to reduce the amount of data transfer.

### Escape characters

Doris will automatically add the escape character ("") to the field names and table names in the query statements sent to PostgreSQL to avoid conflicts between the field names and table names and PostgreSQL internal keywords.
