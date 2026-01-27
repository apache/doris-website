---
{
    "title": "Clickhouse JDBC Catalog",
    "language": "zh-CN",
    "description": "Doris JDBC Catalog 支持通过标准 JDBC 接口连接 ClickHouse 数据库。本文档介绍如何配置 ClickHouse 数据库连接。"
}
---

Doris JDBC Catalog 支持通过标准 JDBC 接口连接 ClickHouse 数据库。本文档介绍如何配置 ClickHouse 数据库连接。

关于 JDBC Catalog 概述，请参阅：[ JDBC Catalog 概述](./jdbc-catalog-overview.md)

## 使用须知

要连接到 ClickHouse 数据库，您需要

* ClickHouse 23.x 或更高版本（低于此版本未经充分测试）。

* ClickHouse 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/com.clickhouse/clickhouse-jdbc)下载最新或指定版本的 ClickHouse JDBC 驱动程序。推荐使用 ClickHouse JDBC Driver 0.4.6 版本。

* Doris 每个 FE 和 BE 节点和 ClickHouse 服务器之间的网络连接，默认端口为 8123。

## 连接 ClickHouse

```sql
CREATE CATALOG clickhouse PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:clickhouse://example.net:8123/',
    'driver_url' = 'clickhouse-jdbc-0.4.6-all.jar',
    'driver_class' = 'com.clickhouse.jdbc.ClickHouseDriver'
)
```

`jdbc_url` 定义要传递给 ClickHouse JDBC 驱动程序的连接信息和参数。支持的 URL 的参数可在 [ClickHouse JDBC 驱动配置](https://clickhouse.com/docs/en/integrations/java#configuration) 中找到。

### 连接安全

如果您使用数据源上安装的全局信任证书配置了 TLS，则可以通过将参数附加到在 jdbc\_url 属性中设置的 JDBC 连接字符串来启用集群和数据源之间的 TLS。

例如，通过将 ssl=true 参数添加到 jdbc\_url 配置属性来启用 TLS：

```sql
'jdbc_url' = 'jdbc:clickhouse://example.net:8123/db?ssl=true'
```

有关 TLS 配置选项的更多信息，请参阅 [Clickhouse JDBC 驱动程序文档 SSL 配置部分](https://clickhouse.com/docs/en/integrations/java#connect-to-clickhouse-with-ssl)

## 层级映射

映射 ClickHouse 时，Doris 的一个 Database 对应于 ClickHouse 中的一个 Database。而 Doris 的 Database 下的 Table 则对应于 ClickHouse 中，该 Database 下的 Tables。即映射关系如下：

| Doris    | ClickHouse        |
| -------- | ----------------- |
| Catalog  | ClickHouse Server |
| Database | Database          |
| Table    | Table             |

## 类型映射

| ClickHouse Type           | Doris Type              | Comment                          |
| ------------------------- | ----------------------- | -------------------------------- |
| bool                      | boolean                 |                                  |
| string                    | string                  |                                  |
| date/date32               | date                    |                                  |
| datetime(S)/datetime64(S) | datetime(S)             |                                  |
| float32                   | float                   |                                  |
| float64                   | double                  |                                  |
| int8                      | tinyint                 |                                  |
| int16/uint8               | smallint                | Doris 没有 UNSIGNED 数据类型，所以扩大一个数量级 |
| int32/uInt16              | int                     | 同上                               |
| int64/uint32              | bigint                  | 同上                               |
| int128/uint64             | largeint                | 同上                               |
| int256/uint128/uint256    | string                  | Doris 没有这个数量级的数据类型，采用 STRING 处理  |
| decimal(P, S)             | decimal(P, S) or string | 如果超过 Doris 支持的最大精度，使用 string 承接  |
| enum/ipv4/ipv6/uuid       | string                  |                                  |
| array                     | array                   |                                  |
| other                     | UNSUPPORTED             |                                  |

## 相关参数

- `jdbc_clickhouse_query_final`

  会话变量，默认为 false。当设置为 true 时，发送给 Clickhouse 的 SQL 语句后会添加 `SETTINGS final = 1`。

## 常见问题

1. 读取 Clickhouse 数据出现 `NoClassDefFoundError: net/jpountz/lz4/LZ4Factory` 错误信息

   可以先下载[lz4-1.3.0.jar](https://repo1.maven.org/maven2/net/jpountz/lz4/lz4/1.3.0/lz4-1.3.0.jar)包并放到每个 FE 和 BE 的目录下的 `custom_lib/` 目录下（如不存在，手动创建即可）。
