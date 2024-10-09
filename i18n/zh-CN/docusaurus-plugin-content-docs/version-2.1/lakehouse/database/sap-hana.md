---
{
  "title": "SAP HANA",
  "language": "zh-CN"
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

Doris JDBC Catalog 支持通过标准 JDBC 接口连接 SAP HANA 数据库。本文档介绍如何配置 SAP HANA 数据库连接。

## 使用须知

要连接到 SAP HANA 数据库，您需要

- SAP HANA 2.0 或更高版本。

- SAP HANA 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/com.sap.cloud.db.jdbc/ngdbc)下载最新或指定版本的 SAP HANA JDBC 驱动程序。**推荐使用 ngdbc 2.4.51 以上的版本。**

- Doris 每个 FE 和 BE 节点和 SAP HANA 服务器之间的网络连接，默认端口为 30015。

## 连接 SAP HANA

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

:::info 备注
有关 SAP HANA JDBC 驱动程序支持的 JDBC URL 格式和参数的更多信息，请参阅 [SAP HANA](https://help.sap.com/docs/)。
:::

## 层级映射

映射 SAP HANA 时，Doris 的 Database 对应于 SAP HANA 中指定 DataBase（`jdbc_url` 参数中的 "DATABASE"）下的一个 Schema。而 Doris 的 Database 下的 Table 则对应于 SAP HANA 中 Schema 下的 Tables。即映射关系如下：

|  Doris   | SAP HANA |
|:--------:|:--------:|
| Catalog  | Database |
| Database |  Schema  |
|  Table   |  Table   |

## 类型映射

### SAP HANA 到 Doris 类型映射

| SAP HANA Type | Doris Type     | Comment                                       |
|---------------|----------------|-----------------------------------------------|
| BOOLEAN       | BOOLEAN        |                                               |
| TINYINT       | TINYINT        |                                               |
| SMALLINT      | SMALLINT       |                                               |
| INTERGER      | INT            |                                               |
| BIGINT        | BIGINT         |                                               |
| SMALLDECIMAL  | DECIMAL        |                                               |
| DECIMAL       | DECIMAL/STRING | 将根据Doris DECIMAL字段的（precision, scale）选择用何种类型  |
| REAL          | FLOAT          |                                               |
| DOUBLE        | DOUBLE         |                                               |
| DATE          | DATE           |                                               |
| TIME          | STRING         |                                               |
| TIMESTAMP     | DATETIME       |                                               |
| SECONDDATE    | DATETIME       |                                               |
| VARCHAR       | STRING         |                                               |
| NVARCHAR      | STRING         |                                               |
| ALPHANUM      | STRING         |                                               |
| SHORTTEXT     | STRING         |                                               |
| CHAR          | CHAR           |                                               |
| NCHAR         | CHAR           |                                               |

## 查询优化

### 谓词下推

当执行类似于 `where dt = '2022-01-01'` 这样的查询时，Doris 能够将这些过滤条件下推到外部数据源，从而直接在数据源层面排除不符合条件的数据，减少了不必要的数据获取和传输。这大大提高了查询性能，同时也降低了对外部数据源的负载。

### 行数限制

如果在查询中带有 limit 关键字，Doris 会将 limit 下推到 SAP HANA 数据库，以减少数据传输量。

### 转义字符

Doris 会在下发到 SAP HANA 的查询语句中，自动在字段名与表名上加上转义符：("")，以避免字段名与表名与 SAP HANA 内部关键字冲突。
