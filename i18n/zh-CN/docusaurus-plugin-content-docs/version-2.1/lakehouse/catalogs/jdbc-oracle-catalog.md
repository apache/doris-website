---
{
    "title": "Oracle JDBC Catalog",
    "language": "zh-CN",
    "description": "Apache Doris JDBC Catalog 支持通过标准 JDBC 接口连接 Oracle 数据库。本文档介绍如何配置 Oracle 数据库连接。"
}
---

Apache Doris JDBC Catalog 支持通过标准 JDBC 接口连接 Oracle 数据库。本文档介绍如何配置 Oracle 数据库连接。

关于 JDBC Catalog 概述，请参阅：[ JDBC Catalog 概述](./jdbc-catalog-overview.md)

## 使用须知

要连接到 Oracle 数据库，您需要

* Oracle 19c, 18c, 12c, 11g 或 10g。

* Oracle 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/com.oracle.database.jdbc)下载 Ojdbc8 及以上版本的 Oracle JDBC 驱动程序。

* Apache Doris 每个 FE 和 BE 节点和 Oracle 服务器之间的网络连接，默认端口为 1521；如果 Oracle RAC 启用 ONS，还需开通 6200 端口。

## 连接 Oracle

```sql
CREATE CATALOG oracle_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password'='pwd',
    'jdbc_url' = 'jdbc:oracle:thin:@example.net:1521:orcl',
    'driver_url' = 'ojdbc8.jar',
    'driver_class' = 'oracle.jdbc.driver.OracleDriver'
)
```

`jdbc_url` 定义要传递给 JDBC 驱动程序的连接信息和参数。使用 Oracle JDBC Thin 驱动程序时，URL 的语法可能会有所不同，具体取决于您的 Oracle 配置。例如，如果您要连接到 Oracle SID 或 Oracle 服务名称，则连接 URL 会有所不同。有关更多信息，请参阅 [Oracle 数据库 JDBC 驱动程序文档](https://docs.oracle.com/en/database/oracle/oracle-database/19/jjdbc/data-sources-and-URLs.html)。以上示例 URL 连接到名为`orcl`的 Oracle SID。

## 层级映射

映射 Oracle 时，Apache Doris 的一个 Database 对应于 Oracle 中的一个 User。而 Apache Doris 的 Database 下的 Table 则对应于 Oracle 中，该 User 下的有权限访问的 Table。即映射关系如下：

| Doris    | Oracle   |
| -------- | -------- |
| Catalog  | Database |
| Database | User     |
| Table    | Table    |

## 列类型映射

| Oracle Type                           | Doris Type                           | Comment                                                                                                         |
| ------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| number(P) / number(P, 0)              | tinyint/smallint/int/bigint/largeint | Doris 会根据 P 的大小来选择对应的类型：P < 3：TINYINT; P < 5：SMALLINT; P < 10：INT; P < 19：BIGINT; P > 19：LARGEINT |
| number(P, S), 如果 (S > 0 && P > S) | decimal(P, S)                        |                                                                                                                 |
| number(P, S), 如果 (S > 0 && P < S) | decimal(S, S)                        |                                                                                                                 |
| number(P, S), 如果 (S < 0)          | tinyint/smallint/int/bigint/largeint | S < 0 的情况下，Doris 会将 P 设置为 `P + |S|`，并进行和 `number(P) / number(P, 0)` 一样的映射                                         |
| number                                |                                      | Doris 目前不支持未指定 P 和 S 的 number 类型                                                                                       |
| decimal(P, S)                         | decimal(P, S)                        |                                                                                                                 |
| float/real                            | double                               |                                                                                                                 |
| date                                  | date                                 |                                                                                                                 |
| timestamp                             | datetime(S)                          |                                                                                                                 |
| char/nchar                            | string                               |                                                                                                                 |
| varchar2/nvarchar2                    | string                               |                                                                                                                 |
| long/raw/long raw/internal            | string                               |                                                                                                                 |
| BLOB | varbinary | 由 properties 中 `enable.mapping.varbinary` (4.0.2 后开始支持) 属性控制。默认为 `false`, 则映射到 `string`; 为 `true` 时，则映射到 `varbinary` 类型。|
| other                                 | UNSUPPORTED                          |                                                                                                                 |

## 常见问题

1. 创建或查询 Oracle Catalog 时出现 `ONS configuration failed`

   在 be.conf 的 JAVA\_OPTS 增加 -Doracle.jdbc.fanEnabled=false 并且升级 driver 到 <https://repo1.maven.org/maven2/com/oracle/database/jdbc/ojdbc8/19.23.0.0/ojdbc8-19.23.0.0.jar>

2. 创建或查询 Oracle Catalog 时出现 `Non supported character set (add orai18n.jar in your classpath): ZHS16GBK` 异常

   下载 [orai18n.jar](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html) 并放到 每个 FE 和 BE 的目录下的 `custom_lib/` 目录下（如不存在，手动创建即可）并重启每个 FE 和 BE。
