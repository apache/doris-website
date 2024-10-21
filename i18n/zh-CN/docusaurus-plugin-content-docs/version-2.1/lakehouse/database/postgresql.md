---
{
  "title": "PostgreSQL",
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

Doris JDBC Catalog 支持通过标准 JDBC 接口连接 PostgreSQL 数据库。本文档介绍如何配置 PostgreSQL 数据库连接。

## 使用须知

要连接到 PostgreSQL 数据库，您需要

- PostgreSQL 11.x 或更高版本

- PostgreSQL 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/org.postgresql/postgresql)下载最新或指定版本的 PostgreSQL JDBC 驱动程序。**推荐使用 PostgreSQL JDBC Driver 42.5.x 及以上版本。**

- Doris 每个 FE 和 BE 节点和 PostgreSQL 服务器之间的网络连接，默认端口为 5432。

## 连接 PostgreSQL

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

:::info 备注
`jdbc_url` 定义要传递给 PostgreSQL JDBC 驱动程序的连接信息和参数。
支持的 URL 的参数可在 [PostgreSQL JDBC 驱动程序文档](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database) 中找到。
:::

### 连接安全

如果您使用数据源上安装的全局信任证书配置了 TLS，则可以通过将参数附加到在 jdbc_url 属性中设置的 JDBC 连接字符串来启用集群和数据源之间的 TLS。

例如，对于版本 42 的 PostgreSQL JDBC 驱动程序，通过将 ssl=true 参数添加到 jdbc_url 配置属性中启用 TLS：

```sql
"jdbc_url"="jdbc:postgresql://example.net:5432/database?ssl=true"
```

有关 TLS 配置选项的更多信息，请参阅 [PostgreSQL JDBC 驱动程序文档](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)。

## 层级映射

映射 PostgreSQL 时，Doris 的一个 Database 对应于 PostgreSQL 中指定 database 下的一个 Schema（如示例中 `jdbc_url` 参数中 `postgres` 下的 schemas）。而 Doris 的 Database 下的 Table 则对应于 PostgreSQL 中，该 Schema 下的 Tables。即映射关系如下：

|  Doris   | PostgreSQL |
|:--------:|:----------:|
| Catalog  |  Database  |
| Database |   Schema   |
|  Table   |   Table    |

## 类型映射

### PostgreSQL 到 Doris 类型映射

| PostgreSQL Type                         | Doris Type      | Comment                                              |
|-----------------------------------------|-----------------|------------------------------------------------------|
| boolean                                 | BOOLEAN         |                                                      |
| smallint/int2                           | SMALLINT        |                                                      |
| integer/int4                            | INT             |                                                      |
| bigint/int8                             | BIGINT          |                                                      |
| decimal/numeric                         | DECIMAL         |                                                      |
| real/float4                             | FLOAT           |                                                      |
| double precision                        | DOUBLE          |                                                      |
| smallserial                             | SMALLINT        |                                                      |
| serial                                  | INT             |                                                      |
| bigserial                               | BIGINT          |                                                      |
| char                                    | CHAR            |                                                      |
| varchar/text                            | STRING          |                                                      |
| timestamp/timestampz                    | DATETIME        |                                                      |
| date                                    | DATE            |                                                      |
| json/jsonb                              | STRING          |                                                      |
| time                                    | STRING          |                                                      |
| interval                                | STRING          |                                                      |
| point/line/lseg/box/path/polygon/circle | STRING          |                                                      |
| cidr/inet/macaddr                       | STRING          |                                                      |
| bit                                     | BOOLEAN/STRING  |                                                      |
| uuid                                    | STRING          |                                                      |
| Other                                   | UNSUPPORTED     |                                                      |


:::tip
- 无精度 numeric 会被映射为 String 类型，进行数值计算时需要先转换为 DECIMAL 类型，且不支持回写。
- 为了更好的读取与计算性能均衡，Doris 会将 JSON 类型映射为 STRING 类型。
- Doris 不支持 BIT 类型，BIT 类型会在 BIT(1) 时被映射为 BOOLEAN，其他情况下映射为 STRING。
- Doris 不支持 time 类型，TIME 类型会被映射为 STRING。
:::

### 时间戳类型处理

由于 Doris 不支持带时区的时间戳类型，所以在读取 PostgreSQL 的 timestampz 类型时，Doris 会将其映射为 DATETIME 类型，且会在读取时转换成本地时区的时间。

且由于在 JDBC 类型 Catalog 读取数据时，BE 的 Java 部分使用 JVM 时区。JVM 时区默认为 BE 部署机器的时区，这会影响 JDBC 读取数据时的时区转换。

为了确保时区一致性，建议在 be.conf 的 JAVA_OPTS 中设置 JVM 时区与 Doris session 的 `time_zone` 一致。

## 查询优化

### 谓词下推

当执行类似于 `where dt = '2022-01-01'` 这样的查询时，Doris 能够将这些过滤条件下推到外部数据源，从而直接在数据源层面排除不符合条件的数据，减少了不必要的数据获取和传输。这大大提高了查询性能，同时也降低了对外部数据源的负载。

### 行数限制

如果在查询中带有 limit 关键字，Doris 会将 limit 下推到 PostgreSQL，以减少数据传输量。

### 转义字符

Doris 会在下发到 PostgreSQL 的查询语句中，自动在字段名与表名上加上转义符：("")，以避免字段名与表名与 PostgreSQL 内部关键字冲突。
