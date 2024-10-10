---
{
  "title": "SQL Server",
  "language": "en"
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

Doris JDBC Catalog supports connecting to SQL Server databases through the standard JDBC interface. This document describes how to configure a SQL Server database connection.

## Terms and Conditions

To connect to a SQL Server database you need

- SQL Server 2012 or later, or Azure SQL Database.

- JDBC driver for SQL Server database, you can download the latest or specified version of SQL Server JDBC driver from [Maven repository](https://mvnrepository.com/artifact/com.microsoft.sqlserver/mssql-jdbc). **It is recommended to use SQL Server JDBC Driver 11.2.x and above. **

- Doris Network connection between each FE and BE node and the SQL Server server, default port is 1433.

## Connect to SQL Server

```sql
CREATE CATALOG sqlserver PROPERTIES (
    "type"="jdbc",
    "user"="root",
    "password"="secret",
    "jdbc_url" = "jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false",
    "driver_url" = "mssql-jdbc-11.2.3.jre8.jar",
    "driver_class" = "com.microsoft.sqlserver.jdbc.SQLServerDriver"
)
```

:::info remarks
`jdbc_url` defines the connection information and parameters to be passed to the SQL Server JDBC driver. URL support is provided in [SQL Server JDBC Driver Documentation](https://learn.microsoft.com/en/sql/connect/jdbc/building-the-connection-url?view=sql-server-ver16) parameters.
:::

### Connection security

The JDBC driver and connector automatically use Transport Layer Security (TLS) encryption and certificate verification. This requires configuring the appropriate TLS certificate on the SQL Server database host.

If you have not set up the necessary configuration, you can disable encryption in the connection string using the encrypt attribute:

```sql
"jdbc_url"="jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false"
```

[The TLS section of the SQL Server JDBC driver documentation](https://learn.microsoft.com/en/sql/connect/jdbc/using-ssl-encryption?view=sql-server-ver16) describes trustServerCertificate in detail , hostNameInCertificate, trustStore and trustStorePassword and other parameters.

## Hierarchical mapping

When mapping SQLServer, a Database in Doris corresponds to a Schema under the specified Database (`<databaseName>` in the `jdbc_url` parameter) in SQL Server. The Table under Doris' Database corresponds to the Tables under Schema in SQL Server. That is, the mapping relationship is as follows:

| Doris    | SQLServer   |
|:--------:|:-----------:|
| Catalog  |  Database   |
| Database |   Schema    |
|  Table   |    Table    |

## Type mapping

### SQL Server to Doris type mapping

| SQL Server Type                        | Doris Type    | Comment                                                                        |
|----------------------------------------|---------------|--------------------------------------------------------------------------------|
| bit                                    | BOOLEAN       |                                                                                |
| tinyint                                | SMALLINT      | SQLServer's tinyint is an unsigned number, so it is mapped to Doris's SMALLINT |
| smallint                               | SMALLINT      |                                                                                |
| int                                    | INT           |                                                                                |
| bigint                                 | BIGINT        |                                                                                |
| real                                   | FLOAT         |                                                                                |
| float                                  | DOUBLE        |                                                                                |
| money                                  | DECIMAL(19,4) |                                                                                |
| smallmoney                             | DECIMAL(10,4) |                                                                                |
| decimal/numeric                        | DECIMAL       |                                                                                |
| date                                   | DATE          |                                                                                |
| datetime/datetime2/smalldatetime       | DATETIMEV2    |                                                                                |
| char/varchar/text/nchar/nvarchar/ntext | STRING        |                                                                                |
| time/datetimeoffset                    | STRING        |                                                                                |
| timestamp                              | STRING        | Read the hexadecimal display of binary data, no practical significance         |
| Other                                  | UNSUPPORTED   |                                                                                |

## Query optimization

### Predicate pushdown

When executing a query like `where dt = '2022-01-01'`, Doris can push these filtering conditions down to the external data source, thereby directly excluding data that does not meet the conditions at the data source level, reducing inaccuracies. Necessary data acquisition and transmission. This greatly improves query performance while also reducing the load on external data sources.

### Row limit

If you have the limit keyword in the query, Doris will escape the limit into SQL Server's `TOP` syntax to reduce the amount of data transfer.

### Escape characters

Doris will automatically add the escape character ([]) to the field names and table names in the query statements sent to SQL Server to avoid conflicts between field names, table names and SQL Server internal keywords.

## FAQ

1. Certificate authentication exception occurs when connecting to SQL Server

    ```
    SQLServerException: The driver could not establish a secure connection to SQL Server by using Secure Sockets Layer (SSL) encryption.
    Error: "sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException:
    unable to find valid certification path to requested target". ClientConnectionId:a92f3817-e8e6-4311-bc21-7c66
    ```

   You can add `encrypt=false` to the end of the JDBC connection string when creating the Catalog, such as `"jdbc_url" = "jdbc:sqlserver://127.0.0.1:1433;DataBaseName=doris_test;encrypt=false"`

2. TLS exception occurs when connecting to SQL Server

   ```
   The server selected protocol version TLS10 is not accepted by client preferences [TLS13, TLS12]
   ```

   This is due to a TLS protocol version mismatch between SQL Server and the JDBC client. The connected SQL Server only supports TLS 1.0, and the JAVA environment where the JDBC client is located has TLS 1.0 disabled by default.

   The solution is as follows:
   1. Enable TLS 1.2 on SQL Server.
      Reference: [SQL Server TLS 1.2 support](https://learn.microsoft.com/en-us/troubleshoot/sql/database-engine/connect/tls-1-2-support-microsoft-sql-server)
   2. Enable TLS 1.0 for the JDK.
      ```shell
      vim ${JAVA_HOME}/lib/security/java.security
      #find this paragraph
      jdk.tls.disabledAlgorithms=SSLv3, TLSv1, TLSv1.1, RC4, DES, MD5withRSA, \
      DH keySize < 1024, EC keySize < 224, 3DES_EDE_CBC, anon, NULL, \
      include jdk.disabled.namedCurves
      
      #Delete TLSv1, TLSv1.1 and change it to the following
      jdk.tls.disabledAlgorithms=SSLv3, RC4, DES, MD5withRSA, \
      DH keySize < 1024, EC keySize < 224, anon, NULL, \
      include jdk.disabled.namedCurves
      ```
