---
{
  "title": "ClickHouse",
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

Doris JDBC Catalog 支持通过标准 JDBC 接口连接 ClickHouse 数据库。本文档介绍如何配置 ClickHouse 数据库连接。

## 使用须知

要连接到 ClickHouse 数据库，您需要

- ClickHouse 23.x 或更高版本(低于此版本未经充分测试)。

- ClickHouse 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/com.clickhouse/clickhouse-jdbc)下载最新或指定版本的 ClickHouse JDBC 驱动程序。**推荐使用 ClickHouse JDBC Driver 0.4.6 版本。**

- Doris 每个 FE 和 BE 节点和 ClickHouse 服务器之间的网络连接，默认端口为 8123。

## 连接 ClickHouse

```sql
CREATE CATALOG clickhouse PROPERTIES (
    "type"="jdbc",
    "user"="default",
    "password"="password",
    "jdbc_url" = "jdbc:clickhouse://example.net:8123/",
    "driver_url" = "clickhouse-jdbc-0.4.6-all.jar",
    "driver_class" = "com.clickhouse.jdbc.ClickHouseDriver"
)
```

:::info 备注
`jdbc_url` 定义要传递给 ClickHouse JDBC 驱动程序的连接信息和参数。
支持的 URL 的参数可在 [ClickHouse JDBC 驱动配置](https://clickhouse.com/docs/en/integrations/java#configuration) 中找到。
:::

### 连接安全

如果您使用数据源上安装的全局信任证书配置了 TLS，则可以通过将参数附加到在 jdbc_url 属性中设置的 JDBC 连接字符串来启用集群和数据源之间的 TLS。

例如，通过将 ssl=true 参数添加到 jdbc_url 配置属性来启用 TLS：

```sql
"jdbc_url"="jdbc:clickhouse://example.net:8123/db?ssl=true"
```

有关 TLS 配置选项的更多信息，请参阅 [Clickhouse JDBC 驱动程序文档 SSL 配置部分](https://clickhouse.com/docs/en/integrations/java#connect-to-clickhouse-with-ssl)

## 层级映射

映射 ClickHouse 时，Doris 的一个 Database 对应于 ClickHouse 中的一个 Database。而 Doris 的 Database 下的 Table 则对应于 ClickHouse 中，该 Database 下的 Tables。即映射关系如下：

|  Doris   |    ClickHouse     |
|:--------:|:-----------------:|
| Catalog  | ClickHouse Server |
| Database |     Database      |
|  Table   |       Table       |

## 类型映射

### ClickHouse 到 Doris 类型映射

| ClickHouse Type        | Doris Type       | Comment                                   |
|------------------------|------------------|-------------------------------------------|
| Bool                   | BOOLEAN          |                                           |
| String                 | STRING           |                                           |
| Date/Date32            | DATE             |                                           |
| DateTime/DateTime64    | DATETIME         |                                           |
| Float32                | FLOAT            |                                           |
| Float64                | DOUBLE           |                                           |
| Int8                   | TINYINT          |                                           |
| Int16/UInt8            | SMALLINT         | Doris 没有 UNSIGNED 数据类型，所以扩大一个数量级          |
| Int32/UInt16           | INT              | Doris 没有 UNSIGNED 数据类型，所以扩大一个数量级          |
| Int64/Uint32           | BIGINT           | Doris 没有 UNSIGNED 数据类型，所以扩大一个数量级          |
| Int128/UInt64          | LARGEINT         | Doris 没有 UNSIGNED 数据类型，所以扩大一个数量级          |
| Int256/UInt128/UInt256 | STRING           | Doris 没有这个数量级的数据类型，采用 STRING 处理           |
| DECIMAL                | DECIMALV3/STRING | 将根据 DECIMAL 字段的（precision, scale) 选择用何种类型 |
| Enum/IPv4/IPv6/UUID    | STRING           |                                           |
| Array                  | ARRAY            | Array 内部类型适配逻辑参考上述类型，不支持嵌套 Array          |
| Other                  | UNSUPPORTED      |                                           |

## 查询优化

### 谓词下推

1. 当执行类似于 `where dt = '2022-01-01'` 这样的查询时，Doris 能够将这些过滤条件下推到外部数据源，从而直接在数据源层面排除不符合条件的数据，减少了不必要的数据获取和传输。这大大提高了查询性能，同时也降低了对外部数据源的负载。

2. 当 FE conf `enable_func_pushdown` 设置为 true，会将 where 之后的函数条件也下推到外部数据源。

   目前支持下推到 ClickHouse 的函数有：

   |   Function     |
   |:--------------:|
   | FROM_UNIXTIME  |
   | UNIX_TIMESTAMP |

### 行数限制

如果在查询中带有 limit 关键字，Doris 会将 limit 下推到 ClickHouse，以减少数据传输量。

### 转义字符

Doris 会在下发到 ClickHouse 的查询语句中，自动在字段名与表名上加上转义符：("")，以避免字段名与表名与 ClickHouse 内部关键字冲突。

## 常见问题

1. 通过 ClickHouse Catalog 读取 Clickhouse 数据出现`NoClassDefFoundError: net/jpountz/lz4/LZ4Factory` 错误信息

   可以先下载[lz4-1.3.0.jar](https://repo1.maven.org/maven2/net/jpountz/lz4/lz4/1.3.0/lz4-1.3.0.jar)包并放到每个 FE 和 BE 的目录下的 `custom_lib/` 目录下（如不存在，手动创建即可）。

