---
{
    "title": "PostgreSQL JDBC Catalog",
    "language": "zh-CN",
    "description": "Doris JDBC Catalog 支持通过标准 JDBC 接口连接 PostgreSQL 数据库。本文档介绍如何配置 PostgreSQL 数据库连接。"
}
---

Doris JDBC Catalog 支持通过标准 JDBC 接口连接 PostgreSQL 数据库。本文档介绍如何配置 PostgreSQL 数据库连接。

关于 JDBC Catalog 概述，请参阅：[ JDBC Catalog 概述](./jdbc-catalog-overview.md)

## 使用须知

要连接到 PostgreSQL 数据库，您需要

* PostgreSQL 11.x 或更高版本

* PostgreSQL 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/org.postgresql/postgresql)下载最新或指定版本的 PostgreSQL JDBC 驱动程序。推荐使用 PostgreSQL JDBC Driver 42.5.x 及以上版本。

* Doris 每个 FE 和 BE 节点和 PostgreSQL 服务器之间的网络连接，默认端口为 5432。

## 连接 PostgreSQL

```sql
CREATE CATALOG postgresql_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:postgresql://host:5432/postgres',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
```

`jdbc_url` 定义要传递给 PostgreSQL JDBC 驱动程序的连接信息和参数。支持的 URL 的参数可在 [PostgreSQL JDBC 驱动程序文档](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database) 中找到。

### 连接安全

如果您使用数据源上安装的全局信任证书配置了 TLS，则可以通过将参数附加到在 jdbc\_url 属性中设置的 JDBC 连接字符串来启用集群和数据源之间的 TLS。

例如，对于版本 42 的 PostgreSQL JDBC 驱动程序，通过将 ssl=true 参数添加到 jdbc\_url 配置属性中启用 TLS：

```sql
"jdbc_url"="jdbc:postgresql://example.net:5432/database?ssl=true"
```

有关 TLS 配置选项的更多信息，请参阅 [PostgreSQL JDBC 驱动程序文档](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)。

## 层级映射

映射 PostgreSQL 时，Doris 的一个 Database 对应于 PostgreSQL 中指定 database 下的一个 Schema（如示例中 `jdbc_url` 参数中 `postgres` 下的 schemas）。而 Doris 的 Database 下的 Table 则对应于 PostgreSQL 中，该 Schema 下的 Tables。即映射关系如下：

| Doris    | PostgreSQL |
| -------- | ---------- |
| Catalog  | Database   |
| Database | Schema     |
| Table    | Table      |

## 列类型映射

| PostgreSQL Type                         | Doris Type             |                                                                 |
| --------------------------------------- | ---------------------- | --------------------------------------------------------------- |
| boolean                                 | boolean                |                                                                 |
| smallint/int2                           | smallint               |                                                                 |
| integer/int4                            | int                    |                                                                 |
| bigint/int8                             | bigint                 |                                                                 |
| decimal/numeric                         | decimal(P, S) / string | 无精度 numeric 会被映射为 string 类型，进行数值计算时需要先转换为 decimal 类型，且不支持回写。    |
| real/float4                             | float                  |                                                                 |
| double                                  | double                 |                                                                 |
| smallserial                             | smallint               |                                                                 |
| serial                                  | int                    |                                                                 |
| bigserial                               | bigint                 |                                                                 |
| char(N)                                 | char(N)                |                                                                 |
| varchar/text                            | string                 |                                                                 |
| timestamp(S)/timestampz(S)              | datetime(S)            |                                                                 |
| date                                    | date                   |                                                                 |
| json/jsonb                              | string                 | 为了更好的读取与计算性能均衡，Doris 会将 JSON 类型映射为 STRING 类型。                   |
| time                                    | string                 | Doris 不支持 time 类型，time 类型会被映射为 string。                          |
| interval                                | string                 |                                                                 |
| point/line/lseg/box/path/polygon/circle | string                 |                                                                 |
| cidr/inet/macaddr                       | string                 |                                                                 |
| uuid                                    | string                 |                                                                 |
| bit                                     | boolean / string       | Doris 不支持 bit 类型，bit 类型会在 bit(1) 时被映射为 boolean，其他情况下映射为 string。 |
| bytea | varbinary | 由 properties 中 `enable.mapping.varbinary` (4.0.2 后开始支持) 属性控制。默认为 `false`, 则映射到 `string`; 为 `true` 时，则映射到 `varbinary` 类型。|
| array                                   | array                  | 关于数组类型的映射方式，请参与下面的说明。 |
| other                                   | UNSUPPORTED            |                                                                 |

- 数组类型

    PostgreSQL 中可以通过如下方式定义数组类型：

    ```
    col1 text[]
    col2 in4[][]
    ```

    但无法从 PostgreSQL 元数据中直接获取数组的维度，比如 `text[]` 有可能是一维数组，也有可能是二维数组。数组的维度，只有在写入数据后，才能确定。

    而 Doris 必须显式声明数组的维度。因此，只有 PostgreSQL 对应的数组列中有数据，Doris 才能正确映射，否则，数组列会被映射为 `UNSUPPORTED`。

## 附录

### 时区问题

由于 Doris 不支持带时区的时间戳类型，所以在读取 PostgreSQL 的 timestampz 类型时，Doris 会将其映射为 DATETIME 类型，且会在读取时转换成本地时区的时间。

且由于在 JDBC 类型 Catalog 读取数据时，BE 的 Java 部分使用 JVM 时区。JVM 时区默认为 BE 部署机器的时区，这会影响 JDBC 读取数据时的时区转换。

为了确保时区一致性，建议在 `be.conf` 的 `JAVA_OPTS` 中设置 JVM 时区与 Doris session 的 `time_zone` 一致。
