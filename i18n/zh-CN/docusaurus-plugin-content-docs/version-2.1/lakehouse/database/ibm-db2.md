---
{
  "title": "IBM Db2",
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

Doris JDBC Catalog 支持通过标准 JDBC 接口连接 IBM Db2 数据库。本文档介绍如何配置 IBM Db2 数据库连接。

## 使用须知

要连接到 IBM Db2 数据库，您需要

- IBM Db2 11.5.x 或更高版本

- IBM Db2 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/com.ibm.db2/jcc)下载最新或指定版本的 IBM Db2 驱动程序。**推荐使用 IBM db2 jcc 11.5.8.0 版本**。

- Doris 每个 FE 和 BE 节点和 IBM Db2 服务器之间的网络连接，默认端口为 51000。

## 连接 IBM Db2

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

:::info 备注
`jdbc_url` 定义要传递给 IBM Db2 驱动程序的连接信息和参数。
支持的 URL 的参数可在 [Db2 JDBC 驱动程序文档](https://www.ibm.com/docs/en/db2-big-sql/5.0?topic=drivers-jdbc-driver) 中找到。
:::

## 层级映射

映射 IBM Db2 时，Doris 的 Database 对应于 DB2 中指定 DataBase（`jdbc_url` 参数中的 "database"）下的一个 Schema。而 Doris 的 Database 下的 Table 则对应于 DB2 中 Schema 下的 Tables。即映射关系如下：

|  Doris   | IBM Db2  |
|:--------:|:--------:|
| Catalog  | DataBase |
| Database |  Schema  |
|  Table   |  Table   |

## 类型映射

### IBM Db2 到 Doris 类型映射

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

## 查询优化

### 谓词下推

当执行类似于 `where dt = '2022-01-01'` 这样的查询时，Doris 能够将这些过滤条件下推到外部数据源，从而直接在数据源层面排除不符合条件的数据，减少了不必要的数据获取和传输。这大大提高了查询性能，同时也降低了对外部数据源的负载。

### 行数限制

如果在查询中带有 limit 关键字，Doris 会将 limit 下推到 IBM Db2 数据库，以减少数据传输量。

### 转义字符

Doris 会在下发到 IBM Db2 的查询语句中，自动在字段名与表名上加上转义符：("")，以避免字段名与表名与 IBM Db2 内部关键字冲突。

## 常见问题

1. 通过 JDBC Catalog 读取 IBM Db2 数据时出现 `Invalid operation: result set is closed. ERRORCODE=-4470` 异常

   在创建 IBM Db2 Catalog 的 jdbc_url 连接串中添加连接参数：`allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`。如：
   `jdbc:db2://host:port/database:allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`。
