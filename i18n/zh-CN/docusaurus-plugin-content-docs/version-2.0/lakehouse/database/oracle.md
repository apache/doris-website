---
{
  "title": "Oracle",
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

Apache Doris JDBC Catalog 支持通过标准 JDBC 接口连接 Oracle 数据库。本文档介绍如何配置 Oracle 数据库连接。

## 使用须知

要连接到 Oracle 数据库，您需要

- Oracle 19c, 18c, 12c, 11g 或 10g。

- Oracle 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/com.oracle.database.jdbc)下载最新或指定版本的 Oracle JDBC 驱动程序。

- Apache Doris 每个 FE 和 BE 节点和 Oracle 服务器之间的网络连接，默认端口为 1521。

## 连接 Oracle

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

:::info 备注
`jdbc_url` 定义要传递给 JDBC 驱动程序的连接信息和参数。
使用 Oracle JDBC Thin 驱动程序时，URL 的语法可能会有所不同，具体取决于您的 Oracle 配置。
例如，如果您要连接到 Oracle SID 或 Oracle 服务名称，则连接 URL 会有所不同。
有关更多信息，请参阅 [Oracle 数据库 JDBC 驱动程序文档](https://docs.oracle.com/en/database/oracle/oracle-database/19/jjdbc/data-sources-and-URLs.html)。
以上示例 URL 连接到名为`orcl`的 Oracle SID。
:::

## 层级映射

映射 Oracle 时，Apache Doris 的一个 Database 对应于 Oracle 中的一个 User。而 Apache Doris 的 Database 下的 Table 则对应于 Oracle 中，该 User 下的有权限访问的 Table。即映射关系如下：

|  Apache Doris   |  Oracle  |
|:--------:|:--------:|
| Catalog  | Database |
| Database |   User   |
|  Table   |  Table   |

## 类型映射

### Oracle 到 Apache Doris 类型映射

| Oracle Type                       | Apache Doris Type                           | Comment                                                                                                                                         |
|-----------------------------------|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| number(p) / number(p,0)           | TINYINT/SMALLINT/INT/BIGINT/LARGEINT | Doris会根据p的大小来选择对应的类型：`p < 3` -> `TINYINT`; `p < 5` -> `SMALLINT`; `p < 10` -> `INT`; `p < 19` -> `BIGINT`; `p > 19` -> `LARGEINT` |
| number(p,s), [ if(s>0 && p>s) ]   | DECIMAL(p,s)                         |                                                                                                                                                 |
| number(p,s), [ if(s>0 && p < s) ] | DECIMAL(s,s)                         |                                                                                                                                                 |
| number(p,s), [ if(s<0) ]          | TINYINT/SMALLINT/INT/BIGINT/LARGEINT | s<0的情况下, Doris会将p设置为 p+\|s\|, 并进行和number(p) / number(p,0)一样的映射                                                                |
| number                            |                                      | Doris目前不支持未指定p和s的oracle类型                                                                                                           |
| decimal                           | DECIMAL                              |                                                                                                                                                 |
| float/real                        | DOUBLE                               |                                                                                                                                                 |
| DATE                              | DATETIME                             |                                                                                                                                                 |
| TIMESTAMP                         | DATETIME                             |                                                                                                                                                 |
| CHAR/NCHAR                        | STRING                               |                                                                                                                                                 |
| VARCHAR2/NVARCHAR2                | STRING                               |                                                                                                                                                 |
| LONG/ RAW/ LONG RAW/ INTERVAL     | STRING                               |                                                                                                                                                 |
| Other                             | UNSUPPORTED                          |                                                                                                                                                 |

## 查询优化

### 谓词下推

1. 当执行类似于 `where dt = '2022-01-01'` 这样的查询时，Apache Doris 能够将这些过滤条件下推到外部数据源，从而直接在数据源层面排除不符合条件的数据，减少了不必要的数据获取和传输。这大大提高了查询性能，同时也降低了对外部数据源的负载。

2. 当变量 `enable_ext_func_pred_pushdown` 设置为true，会将 where 之后的函数条件也下推到外部数据源。

   目前支持下推到 Oracle 的函数有：

   | Function |
   |:--------:|
   |   NVL    |

### 行数限制

如果在查询中带有 limit 关键字，Apache Doris 会将 limit 转义为 Oracle 的 `rownum` 语法，以减少数据传输量。

### 转义字符

Apache Doris 会在下发到 Oracle 的查询语句中，自动在字段名与表名上加上转义符：("")，以避免字段名与表名与 Oracle 内部关键字冲突。

## 常见问题

1. 创建或查询 Oracle Catalog 时出现 `ONS configuration failed`

   在 be.conf 的 JAVA_OPTS 增加 -Doracle.jdbc.fanEnabled=false 并且升级driver到 https://repo1.maven.org/maven2/com/oracle/database/jdbc/ojdbc8/19.23.0.0/ojdbc8-19.23.0.0.jar

2. 创建或查询 Oracle Catalog 时出现 `Non supported character set (add orai18n.jar in your classpath): ZHS16GBK` 异常

   下载 [orai18n.jar](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html) 并放到 每个 FE 和 BE 的目录下的 `custom_lib/` 目录下（如不存在，手动创建即可）并重启每个 FE 和 BE。
