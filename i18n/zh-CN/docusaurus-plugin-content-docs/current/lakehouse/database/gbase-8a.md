---
{
  "title": "GBase 8a",
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

Doris JDBC Catalog 支持通过标准 JDBC 接口连接 GBase 8a 数据库。本文档介绍如何配置 GBase 8a 数据库连接。

:::tip 备注
这是一个实验功能。
:::

## 使用须知

要连接到 GBase 8a 数据库，您需要

- GBase 8a 数据库。

- GBase 8a 数据库的 JDBC 驱动程序，您可以从 GBase 官方网站下载最新或指定版本的 GBase JDBC 驱动程序。

- Doris 每个 FE 和 BE 节点和 GBase 8a 服务器之间的网络连接，默认端口为 5258。

:::warning 注意
此 Catalog 对接测试 GBase 8a 时，使用的版本如下：

- GBase 8a: GBase8a_MPP_Cluster-NoLicense-FREE-9.5.3.28.12-redhat7-x86_64
- JDBC 驱动程序: gbase-connector-java-9.5.0.7-build1-bin.jar

其他版本未经测试，可能会有兼容性问题。
:::

## 连接 GBase 8a

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

:::info 备注
`jdbc_url` 定义要传递给 GBase 8a JDBC 驱动程序的连接信息和参数。您可以从 GBase 官方网站查看支持的 URL 参数。
:::

## 层级映射

映射 GBase 8a 时，Doris 的一个 Database 对应于 GBase 8a 中的一个 Database。而 Doris 的 Database 下的 Table 则对应于 GBase 8a 中，该 Database 下的 Tables。即映射关系如下：

|  Doris   |    GBase 8a     |
|:--------:|:---------------:|
| Catalog  | GBase 8a Server |
| Database |    Database     |
|  Table   |      Table      |

## 类型映射

### GBase 8a 到 Doris 类型映射

| GBase 8a Type | Doris Type  | Comment  |
|---------------|-------------|----------|
| TINYINT       | TINYINT     |          |
| SMALLINT      | SMALLINT    |          |
| INT           | INT         |          |
| BIGINT        | BIGINT      |          |
| real          | FLOAT       |          |
| FLOAT         | DOUBLE      |          |
| DECIMAL       | DECIMAL     |          |
| NUMERIC       | DECIMAL     |          |
| CHAR          | CHAR        |          |
| VARCHAR       | STRING      |          |
| TEXT          | STRING      |          |
| DATE          | DATE        |          |
| DATETIME      | DATETIME    |          |
| TIME          | STRING      |          |
| TIMESTAMP     | DATETIME    |          |
| Other         | UNSUPPORTED |          |

## 查询优化

### 谓词下推

当执行类似于 `where dt = '2022-01-01'` 这样的查询时，Doris 能够将这些过滤条件下推到外部数据源，从而直接在数据源层面排除不符合条件的数据，减少了不必要的数据获取和传输。这大大提高了查询性能，同时也降低了对外部数据源的负载。

### 行数限制

如果在查询中带有 limit 关键字，Doris 会将 limit 下推到 GBase 8a，以减少数据传输量。

### 转义字符

Doris 会在下发到 GBase 8a 的查询语句中，自动在字段名与表名上加上转义符：(``)，以避免字段名与表名与 GBase 8a 内部关键字冲突。
