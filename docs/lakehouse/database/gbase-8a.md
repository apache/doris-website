---
{
  "title": "GBase 8a",
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

Doris JDBC Catalog supports connecting to GBase 8a databases through the standard JDBC interface. This document describes how to configure a GBase 8a database connection.

:::tip remarks
This is an experimental feature.
:::

## Instructions for use

To connect to a GBase 8a database you need

- GBase 8a database.

- JDBC driver for GBase 8a database, you can download the latest or specified version of the GBase JDBC driver from the GBase official website.

- Doris Network connection between each FE and BE node and the GBase 8a server, default port is 5258.

:::warning Notice
When this Catalog is tested against GBase 8a, the versions used are as follows:
- GBase 8a: GBase8a_MPP_Cluster-NoLicense-FREE-9.5.3.28.12-redhat7-x86_64
- JDBC driver: gbase-connector-java-9.5.0.7-build1-bin.jar
Other versions have not been tested and may have compatibility issues.
:::

## Connect to GBase 8a

```sql
CREATE CATALOG `gbase` PROPERTIES (
   "user" = "root",
   "type" = "jdbc",
   "password" = "secret",
   "jdbc_url" = "jdbc:gbase://127.0.0.1:5258/doris_test",
   "driver_url" = "gbase-connector-java-9.5.0.7-build1-bin.jar",
   "driver_class" = "com.gbase.jdbc.Driver"
); """
```

:::info remarks
`jdbc_url` defines the connection information and parameters to be passed to the GBase 8a JDBC driver. You can check the supported URL parameters from the GBase official website.
:::

## Hierarchical mapping

When mapping GBase 8a, a Database in Doris corresponds to a Database in GBase 8a. The Table under Doris' Database corresponds to the Tables under the Database in GBase 8a. That is, the mapping relationship is as follows:

|  Doris   |    GBase 8a     |
|:--------:|:---------------:|
| Catalog  | GBase 8a Server |
| Database |    Database     |
|  Table   |      Table      |

## Type mapping

### GBase 8a to Doris type mapping

| GBase 8a Type | Doris Type  | Comment |
|---------------|-------------|---------|
| TINYINT       | TINYINT     |         |
| SMALLINT      | SMALLINT    |         |
| INT           | INT         |         |
| BIGINT        | BIGINT      |         |
| real          | FLOAT       |         |
| FLOAT         | DOUBLE      |         |
| DECIMAL       | DECIMAL     |         |
| NUMERIC       | DECIMAL     |         |
| CHAR          | CHAR        |         |
| VARCHAR       | STRING      |         |
| TEXT          | STRING      |         |
| DATE          | DATE        |         |
| DATETIME      | DATETIME    |         |
| TIME          | STRING      |         |
| TIMESTAMP     | DATETIME    |         |
| Other         | UNSUPPORTED |         |

## Query optimization

### Predicate pushdown

When executing a query like `where dt = '2022-01-01'`, Doris can push these filtering conditions down to the external data source, thereby directly excluding data that does not meet the conditions at the data source level, reducing inaccuracies. Necessary data acquisition and transmission. This greatly improves query performance while also reducing load on external data sources.

### Row limit

If you have the limit keyword in the query, Doris will push the limit down to GBase 8a to reduce the amount of data transfer.

### Escape characters

Doris will automatically add the escape character (``) to the field names and table names in the query statements sent to GBase 8a to avoid conflicts between the field names and table names and GBase 8a internal keywords.
