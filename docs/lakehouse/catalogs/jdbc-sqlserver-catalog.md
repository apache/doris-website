---
{
    "title": "SQL Server JDBC Catalog",
    "language": "en"
}
---

Doris JDBC Catalog supports connecting to SQL Server databases through the standard JDBC interface. This document describes how to configure the SQL Server database connection.

For an overview of JDBC Catalog, please refer to: [JDBC Catalog Overview](./jdbc-catalog-overview.md)

## Usage Notes

To connect to a SQL Server database, you need

* SQL Server 2012 or later, or Azure SQL Database.

* JDBC driver for SQL Server database, which you can download the latest or specified version from [Maven Repository](https://mvnrepository.com/artifact/com.microsoft.sqlserver/mssql-jdbc). It is recommended to use SQL Server JDBC Driver 11.2.x and above.

* Network connection between each FE and BE node of Doris and the SQL Server server, with the default port being 1433.

## Connecting to SQL Server

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

`jdbc_url` defines the connection information and parameters to be passed to the SQL Server JDBC driver. The parameters supported by the URL are provided in the [SQL Server JDBC Driver Documentation](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/building-the-connection-url?view=sql-server-ver16).

### Connection Security

The JDBC driver and connector automatically use Transport Layer Security (TLS) encryption and certificate verification. This requires configuring appropriate TLS certificates on the SQL Server database host.

If you have not established the necessary configuration, you can disable encryption in the connection string using the encrypt property:

```sql
'jdbc_url' = 'jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false'
```

The TLS section of the [SQL Server JDBC Driver Documentation](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/using-ssl-encryption?view=sql-server-ver16) details other parameters such as `trustServerCertificate`, `hostNameInCertificate`, `trustStore`, and `trustStorePassword`.

## Hierarchical Mapping

When mapping SQLServer, a Database in Doris corresponds to a Schema under the specified Database in SQL Server (`<databaseName>` parameter in `jdbc_url`). A Table under a Database in Doris corresponds to Tables under a Schema in SQLServer. The mapping relationship is as follows:

| Doris    | SQL Server |
| -------- | ---------- |
| Catalog  | Database   |
| Database | Schema     |
| Table    | Table      |

## Column Type Mapping

| SQL Server Type                        | Doris Type    | Comment                                          |
| -------------------------------------- | ------------- | ------------------------------------------------ |
| bit                                    | boolean       |                                                  |
| tinyint                                | smallint      | SQLServer's tinyint is unsigned, so it is mapped to Doris's smallint |
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
| timestamp                              | string        | Displays hexadecimal representation of binary data, no actual meaning |
| other                                  | UNSUPPORTED   |                                                  |

## Common Issues

1. Certificate authentication exception when connecting to SQL Server

   ```text
   SQLServerException: The driver could not establish a secure connection to SQL Server by using Secure Sockets Layer (SSL) encryption.
   Error: "sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException:
   unable to find valid certification path to requested target". ClientConnectionId:a92f3817-e8e6-4311-bc21-7c66
   ```

   You can add `encrypt=false` to the end of the JDBC connection string when creating the Catalog, such as `"jdbc_url" = "jdbc:sqlserver://127.0.0.1:1433;DataBaseName=doris_test;encrypt=false"`

2. TLS exception when connecting to SQL Server

   ```text
   The server selected protocol version TLS10 is not accepted by client preferences [TLS13, TLS12]
   ```

   This is because the TLS protocol version between SQL Server and the JDBC client does not match. The connected SQL Server only supports TLS 1.0, while the JAVA environment where the JDBC client is located has TLS 1.0 disabled by default.

   The solution is as follows:

   1. Enable TLS 1.2 on SQL Server. Refer to: [SQL Server TLS 1.2 Support](https://learn.microsoft.com/zh-cn/troubleshoot/sql/database-engine/connect/tls-1-2-support-microsoft-sql-server)

   2. Enable TLS 1.0 for JDK.

   ```shell
   vim ${JAVA_HOME}/lib/security/java.security
   # Find this section
   jdk.tls.disabledAlgorithms=SSLv3, TLSv1, TLSv1.1, RC4, DES, MD5withRSA, \
   DH keySize < 1024, EC keySize < 224, 3DES_EDE_CBC, anon, NULL, \
   include jdk.disabled.namedCurves

   # Remove TLSv1, TLSv1.1, change it to the following
   jdk.tls.disabledAlgorithms=SSLv3, RC4, DES, MD5withRSA, \
   DH keySize < 1024, EC keySize < 224, anon, NULL, \
   include jdk.disabled.namedCurves
   ```