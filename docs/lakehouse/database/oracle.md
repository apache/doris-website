---
{
  "title": "Oracle",
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

Doris JDBC Catalog supports connecting to Oracle databases through the standard JDBC interface. This document describes how to configure an Oracle database connection.

## Terms and Conditions

To connect to an Oracle database, you need

- Oracle 19c, 18c, 12c, 11g or 10g.

- JDBC driver for Oracle database, you can download the Oracle JDBC driver for Ojdbc8 and above versions from [Maven repository](https://mvnrepository.com/artifact/com.oracle.database.jdbc).

- Doris Network connection between each FE and BE node and Oracle server, default port is 1521.

## Connect to Oracle

```sql
CREATE CATALOG oracle PROPERTIES (
    "type"="jdbc",
    "user"="root",
    "password"="secret",
    "jdbc_url" = "jdbc:oracle:thin:@example.net:1521:orcl",
    "driver_url" = "ojdbc8.jar",
    "driver_class" = "oracle.jdbc.driver.OracleDriver"
)
```

:::info Note
`jdbc_url` defines the connection information and parameters to be passed to the JDBC driver.
When using the Oracle JDBC Thin driver, the syntax of the URL may vary depending on your Oracle configuration.
For example, if you are connecting to an Oracle SID or Oracle service name, the connection URL will be different.
For more information, see [Oracle Database JDBC Driver Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/19/jjdbc/data-sources-and-URLs.html) .
The above example URL connects to an Oracle SID named `orcl`.
:::

## Hierarchical mapping

When mapping Oracle, a Database in Doris corresponds to a User in Oracle. The Table under Doris's Database corresponds to the Table that the User has permission to access in Oracle. That is, the mapping relationship is as follows:

|  Doris   |  Oracle  |
|:--------:|:--------:|
| Catalog  | Database |
| Database |   User   |
|  Table   |  Table   |

## Type mapping

### Oracle to Doris type mapping

| Oracle Type                       | Doris Type                           | Comment                                                                                                                                                                            |
|-----------------------------------|--------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| number(p) / number(p,0)           | TINYINT/SMALLINT/INT/BIGINT/LARGEINT | Doris will select the corresponding type according to the size of p: `p < 3` -> `TINYINT`; `p < 5 ` -> `SMALLINT`; `p < 10` -> `INT`; `p < 19` -> `BIGINT`; `p > 19` -> `LARGEINT` |
| number(p,s), [ if(s>0 && p>s) ]   | DECIMAL(p,s)                         |                                                                                                                                                                                    |
| number(p,s), [ if(s>0 && p < s) ] | DECIMAL(s,s)                         |                                                                                                                                                                                    |
| number(p,s), [ if(s<0) ]          | TINYINT/SMALLINT/INT/BIGINT/LARGEINT | If s<0, Doris will set p to p+\|s\|, and perform the sum The same mapping as number(p) / number(p,0)                                                                               |
| number                            |                                      | Doris currently does not support oracle types that do not specify p and s                                                                                                          |
| decimal                           | DECIMAL                              |                                                                                                                                                                                    |
| float/real                        | DOUBLE                               |                                                                                                                                                                                    |
| DATE                              | DATETIME                             |                                                                                                                                                                                    |
| TIMESTAMP                         | DATETIME                             |                                                                                                                                                                                    |
| CHAR/NCHAR                        | STRING                               |                                                                                                                                                                                    |
| VARCHAR2/NVARCHAR2                | STRING                               |                                                                                                                                                                                    |
| LONG/ RAW/ LONG RAW/ INTERVAL     | STRING                               |                                                                                                                                                                                    |
| Other                             | UNSUPPORTED                          |                                                                                                                                                                                    |


## Query optimization

### Predicate pushdown

1. When executing a query like `where dt = '2022-01-01'`, Doris can push these filtering conditions down to the external data source, thereby directly excluding data that does not meet the conditions at the data source level, reducing unnecessary data acquisition and transmission. This greatly improves query performance while also reducing the load on external data sources.

2. When the variable `enable_ext_func_pred_pushdown` is set to true, the function conditions after where will also be pushed down to the external data source.

   The functions that currently support push down to Oracle include:

   | Function |
   |:--------:|
   |   NVL    |

### Row limit

If you have the limit keyword in the query, Doris will escape the limit to Oracle's `rownum` syntax to reduce the amount of data transfer.

### Escape characters

Doris will automatically add the escape character ("") to the field names and table names in the query statements sent to Oracle to avoid conflicts between the field names and table names and Oracle's internal keywords.

## FAQ

1. `ONS configuration failed` occurs when creating or querying Oracle Catalog

   Add -Doracle.jdbc.fanEnabled=false to JAVA_OPTS in be.conf and upgrade the driver to https://repo1.maven.org/maven2/com/oracle/database/jdbc/ojdbc8/19.23.0.0/ojdbc8-19.23.0.0.jar

2. `Non supported character set (add orai18n.jar in your classpath): ZHS16GBK` exception occurs when creating or querying Oracle Catalog

   Download [orai18n.jar](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html) and put it in the `custom_lib/` directory under each FE and BE directory (if not exists, just create it manually) and restart each FE and BE.