---
{
  "title": "SAP HANA",
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

Doris JDBC Catalog supports connection to the SAP HANA database through the standard JDBC interface. This document describes how to configure a SAP HANA database connection.

## Terms and Conditions

To connect to the SAP HANA database you need

- SAP HANA 2.0 or higher.

- JDBC driver for SAP HANA database, you can download the latest or specified version of SAP HANA JDBC driver from [Maven repository](https://mvnrepository.com/artifact/com.sap.cloud.db.jdbc/ngdbc) . **It is recommended to use ngdbc version 2.4.51 or above. **

- Doris Network connection between each FE and BE node and the SAP HANA server, default port is 30015.

## Connect to SAP HANA

```sql
CREATE CATALOG saphana PROPERTIES (
    "type"="jdbc",
    "user"="USERNAME",
    "password"="PASSWORD",
    "jdbc_url" = "jdbc:sap://Hostname:Port/?optionalparameters",
    "driver_url" = "ngdbc-2.4.51.jar",
    "driver_class" = "com.sap.db.jdbc.Driver"
)
```

:::info remarks
For more information about the JDBC URL formats and parameters supported by the SAP HANA JDBC driver, see [SAP HANA](https://help.sap.com/docs/).
:::

## Hierarchical mapping

When mapping SAP HANA, Doris' Database corresponds to a Schema under the specified DataBase ("DATABASE" in the `jdbc_url` parameter) in SAP HANA. The Table under Doris' Database corresponds to the Tables under Schema in SAP HANA. That is, the mapping relationship is as follows:

|  Doris   | SAP HANA |
|:--------:|:--------:|
| Catalog  | Database |
| Database |  Schema  |
|  Table   |  Table   |

## Type mapping

### SAP HANA to Doris type mapping

| SAP HANA Type   | Doris Type     | Comment                                                                                |
|-----------------|----------------|----------------------------------------------------------------------------------------|
| BOOLEAN         | BOOLEAN        |                                                                                        |
| TINYINT         | TINYINT        |                                                                                        |
| SMALLINT        | SMALLINT       |                                                                                        |
| INTERGER        | INT            |                                                                                        |
| BIGINT          | BIGINT         |                                                                                        |
| SMALLDECIMAL    | DECIMAL        |                                                                                        |
| DECIMAL         | DECIMAL/STRING | Which type will be selected based on the (precision, scale) of the Doris DECIMAL field |
| REAL            | FLOAT          |                                                                                        |
| DOUBLE          | DOUBLE         |                                                                                        |
| DATE            | DATE           |                                                                                        |
| TIME            | STRING         |                                                                                        |
| TIMESTAMP       | DATETIME       |                                                                                        |
| SECONDDATE      | DATETIME       |                                                                                        |
| VARCHAR         | STRING         |                                                                                        |
| NVARCHAR        | STRING         |                                                                                        |
| ALPHANUM        | STRING         |                                                                                        |
| SHORTTEXT       | STRING         |                                                                                        |
| CHAR            | CHAR           |                                                                                        |
| NCHAR           | CHAR           |                                                                                        |

## Query optimization

### Predicate pushdown

When executing a query like `where dt = '2022-01-01'`, Doris can push these filtering conditions down to the external data source, thereby directly excluding data that does not meet the conditions at the data source level, reducing inaccuracies. Necessary data acquisition and transmission. This greatly improves query performance while also reducing the load on external data sources.

### Row limit

If you have the limit keyword in the query, Doris will push the limit down to the SAP HANA database to reduce the amount of data transfer.

### Escape characters

Doris will automatically add the escape character ("") to the field names and table names in the query statements sent to SAP HANA to avoid conflicts between the field names and table names and SAP HANA internal keywords.
