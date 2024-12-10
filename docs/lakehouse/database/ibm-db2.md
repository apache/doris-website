---
{
  "title": "IBM Db2",
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

Doris JDBC Catalog supports connecting to IBM Db2 databases through the standard JDBC interface. This document describes how to configure an IBM Db2 database connection.

## Terms and Conditions

To connect to an IBM Db2 database, you need

- IBM Db2 11.5.x or higher

- JDBC driver for IBM Db2 database, you can download the latest or specified version of IBM Db2 driver from [Maven repository](https://mvnrepository.com/artifact/com.ibm.db2/jcc). **It is recommended to use IBM db2 jcc version 11.5.8.0**.

- Doris Network connection between each FE and BE node and the IBM Db2 server, default port is 51000.

## Connect to IBM Db2

```sql
CREATE CATALOG db2 PROPERTIES (
    "type"="jdbc",
    "user"="USERNAME",
    "password"="PASSWORD",
    "jdbc_url" = "jdbc:db2://host:port/database",
    "driver_url" = "jcc-11.5.8.0.jar",
    "driver_class" = "com.ibm.db2.jcc.DB2Driver"
)
```

:::info remarks
`jdbc_url` defines the connection information and parameters to be passed to the IBM Db2 driver.
The parameters for the supported URLs can be found in the [Db2 JDBC Driver Documentation](https://www.ibm.com/docs/en/db2-big-sql/5.0?topic=drivers-jdbc-driver).
:::

## Hierarchical mapping

When mapping IBM Db2, Doris' Database corresponds to a Schema under the specified DataBase ("database" in the `jdbc_url` parameter) in DB2. The Table under Doris' Database corresponds to the Tables under Schema in DB2. That is, the mapping relationship is as follows:

| Doris    | IBM Db2  |
|:--------:|:--------:|
| Catalog  | DataBase |
| Database |  Schema  |
|  Table   |  Table   |

## Type mapping

### IBM Db2 to Doris type mapping

| IBM Db2 Type     | Doris Type  | Comment  |
|------------------|-------------|----------|
| SMALLINT         | SMALLINT    |          |
| INT              | INT         |          |
| BIGINT           | BIGINT      |          |
| DOUBLE           | DOUBLE      |          |
| DOUBLE PRECISION | DOUBLE      |          |
| FLOAT            | DOUBLE      |          |
| REAL             | FLOAT       |          |
| NUMERIC          | DECIMAL     |          |
| DECIMAL          | DECIMAL     |          |
| DECFLOAT         | DECIMAL     |          |
| DATE             | DATE        |          |
| TIMESTAMP        | DATETIME    |          |
| CHAR             | CHAR        |          |
| CHAR VARYING     | VARCHAR     |          |
| VARCHAR          | VARCHAR     |          |
| LONG VARCHAR     | VARCHAR     |          |
| VARGRAPHIC       | STRING      |          |
| LONG VARGRAPHIC  | STRING      |          |
| TIME             | STRING      |          |
| CLOB             | STRING      |          |
| XML              | STRING      |          |
| OTHER            | UNSUPPORTED |          |

## Query optimization

### Predicate pushdown

When executing a query like `where dt = '2022-01-01'`, Doris can push these filtering conditions down to the external data source, thereby directly excluding data that does not meet the conditions at the data source level, reducing inaccuracies. Necessary data acquisition and transmission. This greatly improves query performance while also reducing the load on external data sources.

### Row limit

If you include the limit keyword in the query, Doris will push the limit down to the IBM Db2 database to reduce the amount of data transfer.

### Escape characters

Doris will automatically add the escape character ("") to the field names and table names in the query statements sent to IBM Db2 to prevent field names and table names from conflicting with IBM Db2 internal keywords.

## FAQ

1. `Invalid operation: result set is closed. ERRORCODE=-4470` exception occurs when reading IBM Db2 data through JDBC Catalog

   Add connection parameters in the jdbc_url connection string when creating the IBM Db2 Catalog: `allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`. like:
   `jdbc:db2://host:port/database:allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`.
