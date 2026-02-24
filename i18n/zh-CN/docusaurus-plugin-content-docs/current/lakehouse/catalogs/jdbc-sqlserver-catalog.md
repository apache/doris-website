---
{
    "title": "SQL Server JDBC Catalog",
    "language": "zh-CN",
    "description": "Doris JDBC Catalog 支持通过标准 JDBC 接口连接 SQL Server 数据库。本文档介绍如何配置 SQL Server 数据库连接。"
}
---

Doris JDBC Catalog 支持通过标准 JDBC 接口连接 SQL Server 数据库。本文档介绍如何配置 SQL Server 数据库连接。

关于 JDBC Catalog 概述，请参阅：[ JDBC Catalog 概述](./jdbc-catalog-overview.md)

## 使用须知

要连接到 SQL Server 数据库，您需要

* SQL Server 2012 或更高版本，或 Azure SQL 数据库。

* SQL Server 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/com.microsoft.sqlserver/mssql-jdbc)下载最新或指定版本的 SQL Server JDBC 驱动程序。推荐使用 SQL Server JDBC Driver 11.2.x 及以上版本。

* Doris 每个 FE 和 BE 节点和 SQL Server 服务器之间的网络连接，默认端口为 1433。

## 连接 SQL Server

```sql
CREATE CATALOG sqlserver_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwddd',
    'jdbc_url' = 'jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false',
    'driver_url' = 'mssql-jdbc-11.2.3.jre8.jar',
    'driver_class' = 'com.microsoft.sqlserver.jdbc.SQLServerDriver'
)
```

`jdbc_url` 定义要传递给 SQL Server JDBC 驱动程序的连接信息和参数。 [SQL Server JDBC 驱动程序文档](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/building-the-connection-url?view=sql-server-ver16)中提供了 URL 支持的参数。

### 连接安全

JDBC 驱动程序以及连接器自动使用传输层安全性 (TLS) 加密和证书验证。这需要在 SQL Server 数据库主机上配置合适的 TLS 证书。

如果您没有建立必要的配置，您可以使用 encrypt 属性禁用连接字符串中的加密：

```sql
'jdbc_url' = 'jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false'
```

[SQL Server JDBC 驱动程序文档的 TLS 部分](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/using-ssl-encryption?view=sql-server-ver16)详细介绍了 `trustServerCertificate`、`hostNameInCertificate`、`trustStore` 和 `trustStorePassword` 等其他参数。

## 层级映射

映射 SQLServer 时，Doris 的一个 Database 对应于 SQL Server 中指定 Database（`jdbc_url` 参数中的 `<databaseName>`）下的一个 Schema。而 Doris 的 Database 下的 Table 则对应于 SQLServer 中，Schema 下的 Tables。即映射关系如下：

| Doris    | SQL Server |
| -------- | ---------- |
| Catalog  | Database   |
| Database | Schema     |
| Table    | Table      |

## 列类型映射

| SQL Server Type                        | Doris Type    | Comment                                          |
| -------------------------------------- | ------------- | ------------------------------------------------ |
| bit                                    | boolean       |                                                  |
| tinyint                                | smallint      | SQLServer 的 tinyint 是无符号数，所以映射为 Doris 的 smallint |
| smallint                               | smallint      |                                                  |
| int                                    | int           |                                                  |
| bigint                                 | bigint        |                                                  |
| real                                   | float         |                                                  |
| float                                  | double        |                                                  |
| money                                  | decimal(19,4) |                                                  |
| smallmoney                             | decimal(10,4) |                                                  |
| decimal(P, S)/numeric(P, S)            | decimal(P, S) |                                                  |
| date                                   | date          |                                                  |
| datetime/datetime2/smalldatetime       | datetime(S)   |                                                  |
| char/varchar/text/nchar/nvarchar/ntext | string        |                                                  |
| time/datetimeoffset                    | string        |                                                  |
| timestamp                              | string        | 读取二进制数据的十六进制显示，无实际意义                             |
| image/binary/varbinary                 | varbinary     | 由 properties 中 `enable.mapping.varbinary` (4.0.2 后开始支持) 属性控制。默认为 `false`, 则映射到 `string`; 为 `true` 时，则映射到 `varbinary` 类型。|
| other                                  | UNSUPPORTED   |                                                  |

## 常见问题

1. 连接 SQL Server 出现证书认证异常

   ```text
   SQLServerException: The driver could not establish a secure connection to SQL Server by using Secure Sockets Layer (SSL) encryption.
   Error: "sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException:
   unable to find valid certification path to requested target". ClientConnectionId:a92f3817-e8e6-4311-bc21-7c66
   ```

   可在创建 Catalog 的 `jdbc_url` 把 JDBC 连接串最后增加 `encrypt=false` ，如 `"jdbc_url" = "jdbc:sqlserver://127.0.0.1:1433;DataBaseName=doris_test;encrypt=false"`

2. 连接 SQL Server 出现 TLS 异常

   ```text
   The server selected protocol version TLS10 is not accepted by client preferences [TLS13, TLS12]
   ```

   这是因为 SQL Server 与 JDBC 客户端之间的 TLS 协议版本不匹配。连接的 SQL Server 仅支持 TLS 1.0，而 JDBC 客户端所在 JAVA 环境默认禁用了 TLS 1.0。

   解决方式如下：

   1. 在 SQL Server 上启用 TLS 1.2。参考：[SQL Server TLS 1.2 支持](https://learn.microsoft.com/zh-cn/troubleshoot/sql/database-engine/connect/tls-1-2-support-microsoft-sql-server)

   2. 启用 JDK 的 TLS 1.0。

   ```shell
   vim ${JAVA_HOME}/lib/security/java.security
   #找到这段
   jdk.tls.disabledAlgorithms=SSLv3, TLSv1, TLSv1.1, RC4, DES, MD5withRSA, \
   DH keySize < 1024, EC keySize < 224, 3DES_EDE_CBC, anon, NULL, \
   include jdk.disabled.namedCurves

   #删掉其中的 TLSv1, TLSv1.1 , 改成下面这样即可
   jdk.tls.disabledAlgorithms=SSLv3, RC4, DES, MD5withRSA, \
   DH keySize < 1024, EC keySize < 224, anon, NULL, \
   include jdk.disabled.namedCurves
   ```

