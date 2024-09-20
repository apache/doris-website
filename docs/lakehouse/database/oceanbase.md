---
{
  "title": "OceanBase",
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

Doris JDBC Catalog supports connecting to the OceanBase database through the standard JDBC interface. This document describes how to configure OceanBase database connection.

## Terms and Conditions

To connect to the OceanBase database you need

- OceanBase 3.1.0 or higher

- JDBC driver for OceanBase database, you can download the latest or specified version of OceanBase JDBC driver from [Maven repository](https://mvnrepository.com/artifact/com.oceanbase/oceanbase-client). **It is recommended to use OceanBase Connector/J 2.4.8 or above. **

- Doris Network connection between each FE and BE node and OceanBase server.

## Connect to OceanBase

```sql
CREATE CATALOG oceanbase PROPERTIES (
    "type"="jdbc",
    "user"="root",
    "password"="password",
    "jdbc_url" = "jdbc:oceanbase://host:port/db",
    "driver_url" = "oceanbase-client-2.4.8.jar",
    "driver_class" = "com.oceanbase.jdbc.Driver"
)
```

:::info remarks
`jdbc_url` defines the connection information and parameters to be passed to the OceanBase JDBC driver.
Parameters for supported URLs can be found in [OceanBase JDBC Driver Configuration](https://www.oceanbase.com/docs/common-oceanbase-connector-j-cn-1000000000517111).
:::

## Mode compatible

Doris will automatically recognize that OceanBase is in MySQL or Oracle mode when creating the OceanBase Catalog so that metadata can be parsed correctly.

Hierarchical mapping, type mapping, and query optimization in different modes are the same as the Catalog processing methods of MySQL or Oracle databases. Please refer to the documentation.

- [MySQL Catalog](./mysql.md)
- [Oracle Catalog](./oracle.md)
