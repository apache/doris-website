---
{
   "title": "MySQL",
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

Doris JDBC Catalog supports connecting to MySQL database through the standard JDBC interface. This document describes how to configure a MySQL database connection.

## Terms and Conditions

To connect to a MySQL database you need

- MySQL 5.7, 8.0 or higher

- JDBC driver for MySQL database, you can download it from [Maven repository](https://mvnrepository.com/artifact/com.mysql/mysql-connector-j)
  Download the latest or specified version of the MySQL JDBC driver. **It is recommended to use MySQL Connector/J 8.0.31 and above. **

- Doris Network connection between each FE and BE node and the MySQL server, the default port is 3306.

## Connect to MySQL

```sql
CREATE CATALOG mysql PROPERTIES (
    "type"="jdbc",
    "user"="root",
    "password"="secret",
    "jdbc_url" = "jdbc:mysql://example.net:3306",
    "driver_url" = "mysql-connector-j-8.3.0.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver"
)
```

:::info remarks
`jdbc_url` defines the connection information and parameters to be passed to the MySQL JDBC driver.
The parameters for supported URLs can be found in the [MySQL Development Guide](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html).
:::

### Connection security

If you configured TLS with a globally trusted certificate installed on the data source, you can enable TLS between the cluster and the data source by appending the parameter to the JDBC connection string set in the jdbc_url property.

For example, with MySQL Connector/J version 8.0, use the sslMode parameter to secure the connection over TLS. By default, this parameter is set to PREFERRED, which protects the connection if the server is enabled. You can also set this parameter to REQUIRED, which will cause the connection to fail if TLS is not established.

You can configure this by adding the sslMode parameter to `jdbc_url`:

```sql
"jdbc_url" = "jdbc:mysql://example.net:3306/?sslMode=REQUIRED"
```

For more information about TLS configuration options, see the [MySQL JDBC security documentation](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html#cj-conn-prop_sslMode).

## Hierarchical mapping

When mapping MySQL, a Database in Doris corresponds to a Database in MySQL. The Table under Doris' Database corresponds to the Tables under the Database in MySQL. That is, the mapping relationship is as follows:

| Doris    |    MySQL     |
|:--------:|:------------:|
| Catalog  | MySQL Server |
| Database |   Database   |
|  Table   |    Table     |

## Type mapping

### MySQL to Doris type mapping

| MYSQL Type                        | Doris Type              | Comment |
|-----------------------------------|-------------------------|---------|
| BOOLEAN                           | TINYINT                 |         |
| TINYINT                           | TINYINT                 |         |
| SMALLINT                          | SMALLINT                |         |
| MEDIUMINT                         | INT                     |         |
| INT                               | INT                     |         |
| BIGINT                            | BIGINT                  |         |
| UNSIGNED TINYINT                  | SMALLINT                |         |
| UNSIGNED MEDIUMINT                | INT                     |         |
| UNSIGNED INT                      | BIGINT                  |         |
| UNSIGNED BIGINT                   | LARGEINT                |         |
| FLOAT                             | FLOAT                   |         |
| DOUBLE                            | DOUBLE                  |         |
| DECIMAL                           | DECIMAL                 |         |
| UNSIGNED DECIMAL(p,s)             | DECIMAL(p+1,s) / STRING |         |
| DATE                              | DATE                    |         |
| TIMESTAMP                         | DATETIME                |         |
| DATETIME                          | DATETIME                |         |
| YEAR                              | SMALLINT                |         |
| TIME                              | STRING                  |         |
| CHAR                              | CHAR                    |         |
| VARCHAR                           | VARCHAR                 |         |
| JSON                              | STRING                  |         |
| SET                               | STRING                  |         |
| ENUM                              | STRING                  |         |
| BIT                               | BOOLEAN/STRING          |         |
| TINYTEXT,TEXT,MEDIUMTEXT,LONGTEXT | STRING                  |         |
| BLOB,MEDIUMBLOB,LONGBLOB,TINYBLOB | STRING                  |         |
| BINARY,VARBINARY                  | STRING                  |         |
| Other                             | UNSUPPORTED             |         |

:::tip
- Doris does not support UNSIGNED data types, so UNSIGNED data types will be mapped to Doris corresponding data types that are an order of magnitude larger.
- UNSIGNED DECIMAL(p,s) will be mapped to DECIMAL(p+1,s) or STRING. Note that when this type is mapped to String, it can only support queries and cannot write to MySQL.
- In order to better balance reading and computing performance, Doris will map the JSON type to the STRING type.
- Doris does not support the BIT type. The BIT type will be mapped to BOOLEAN when BIT(1) is used, and to STRING in other cases.
- Doris does not support YEAR type, YEAR type will be mapped to SMALLINT.
- Doris does not support the TIME type, and the TIME type will be mapped to STRING.
:::

### Timestamp type processing

The Java part of BE uses the JVM time zone when reading data from the JDBC type catalog. The JVM time zone defaults to the time zone of the BE deployment machine, which affects the time zone conversion when JDBC reads data.

In order to ensure time zone consistency, it is recommended to set the JVM time zone in JAVA_OPTS of be.conf to be consistent with the `time_zone` of the Doris session.

When reading MySQL's TIMESTAMP type, add parameters to the JDBC URL: `connectionTimeZone=LOCAL` and `forceConnectionTimeZoneToSession=true`. These parameters are applicable to MySQL Connector/J 8 and above and ensure that the time read is the Doris BE JVM time zone, not the MySQL session time zone.

## Query optimization

### Predicate pushdown

1. When executing a query like `where dt = '2022-01-01'`, Doris can push these filtering conditions down to the external data source, thereby directly excluding data that does not meet the conditions at the data source level, reducing unnecessary data acquisition and transmission. This greatly improves query performance while also reducing the load on external data sources.

2. When the variable `enable_ext_func_pred_pushdown` is set to true, the function conditions after where will also be pushed down to the external data source. Doris will automatically identify some functions that are not supported by MySQL, which can be viewed through explain sql.

   Currently, the functions that Doris will not push down to MySQL by default are as follows:

   |   Function   |
   |:------------:|
   |  DATE_TRUNC  |
   | MONEY_FORMAT |
   |   NEGATIVE   |

   When you find that there are other functions that do not support pushdown, you can configure `jdbc_mysql_unsupported_pushdown_functions` through `fe.conf` to specify the functions that do not support pushdown. Such as: `jdbc_mysql_unsupported_pushdown_functions=func1,func2`

### Row limit

If you have the limit keyword in the query, Doris will push the limit down to MySQL to reduce the amount of data transfer.

### Escape characters

Doris will automatically add the escape character (``) to the field names and table names in the query statements sent to MySQL to avoid conflicts between field names, table names and MySQL internal keywords.

## Troubleshoot connection exceptions

* Communications link failure The last packet successfully received from the server was 7 milliseconds ago.
   * reason:
      * Internet problem:
         * The network is unstable or the connection is interrupted.
         * Network latency between client and server is too high.
      * MySQL server settings
         * The MySQL server may be configured with connection timeout parameters, such as wait_timeout or interactive_timeout, causing the connection to timeout and be closed.
      * Firewall settings
         * Firewall rules may be blocking communication between the client and the server.
      * Connection pool settings
         * The configuration connection_pool_max_life_time in the connection pool may cause the connection to be closed or recycled, or the connection may not be detected in time.
      * Server resource issues
         * The MySQL server may have insufficient resources to handle new connection requests.
      * Client configuration
         * Client JDBC driver configuration error, for example, the autoReconnect parameter is not set or set improperly.
   * solve
      * Check network connection:
         * Confirm that the network connection between the client and the server is stable to avoid excessive network latency.
      * Check MySQL server configuration:
         * Review and adjust the MySQL server's wait_timeout and interactive_timeout parameters to ensure they are set appropriately.
      * Check firewall configuration:
         * Verify that firewall rules allow communication between client and server.
      * Adjust connection pool settings:
         * Check and adjust the connection pool configuration parameter connection_pool_max_life_time to ensure it is smaller than MySQL's wait_timeout and interactive_timeout parameters and larger than the SQL with the longest execution time
      * Monitor server resources:
         * Monitor the resource usage of the MySQL server to ensure that there are sufficient resources to handle connection requests.
      * Optimize client configuration:
         * Confirm that the configuration parameters of the JDBC driver are correct, such as autoReconnect=true, to ensure that the connection can automatically reconnect after being interrupted.

* java.io.EOFException MESSAGE: Can not read response from server. Expected to read 819 bytes, read 686 bytes before connection was unexpectedly lost.
   * Reason: The connection was killed by MySQL or MySQL crashed
   * Solution: Check whether MySQL has a mechanism to actively kill connections, or whether MySQL crashes because of too large a query.

## FAQ

1. The emoji expressions read and written in MySQL are garbled.

   When Doris performs MySQL Catalog query, because the default utf8 encoding in MySQL is utf8mb3, it cannot express emoji expressions that require 4-byte encoding. Here you need to modify the encoding of MySQL to utf8mb4 to support 4-byte encoding.

   Configuration items can be modified globally

    ```
    Modify the my.ini file in the mysql directory (for Linux systems, it is the my.cnf file in the etc directory)
    [client]
    default-character-set=utf8mb4
    
    [mysql]
    Set mysql default character set
    default-character-set=utf8mb4
    
    [mysqld]
    Set mysql character set server
    character-set-server=utf8mb4
    collation-server=utf8mb4_unicode_ci
    init_connect='SET NAMES utf8mb4
    
    Modify the types of corresponding tables and columns
    ALTER TABLE table_name MODIFY colum_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ALTER TABLE table_name CHARSET=utf8mb4;
    SET NAMES utf8mb4
    ```

2. An exception occurred while reading the MySQL DATE/DATETIME type.

    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INTERNAL_ERROR]UdfRuntimeException: get next block failed:
    CAUSED BY: SQLException: Zero date value prohibited
    CAUSED BY: DataReadException: Zero date value prohibited
    ```

   This is because the default handling of illegal DATE/DATETIME in JDBC is to throw an exception, and this behavior can be controlled through the parameter `zeroDateTimeBehavior`.

   Optional parameters are: `exception`, `convertToNull`, `round`, respectively: exception error report, converted to NULL value, converted to "0001-01-01 00:00:00";

   You need to add `zeroDateTimeBehavior=convertToNull` to the end of the JDBC connection string when creating the Catalog `jdbc_url`, such as `"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?zeroDateTimeBehavior=convertToNull"`
   In this case, JDBC will convert 0000-00-00 or 0000-00-00 00:00:00 into null, and then Doris will process all Date/DateTime type columns in the current Catalog as nullable types, so that It can be read normally.

3. When reading MySQL Catalog or other JDBC Catalog, a class loading failure occurs

   Such as the following exception:

    ```
    failed to load driver class com.mysql.cj.jdbc.driver in either of hikariconfig class loader
    ```

   This is because when creating the Catalog, the driver_class filled in is incorrect and needs to be filled in correctly. For example, the above example has a case problem and should be filled in as `"driver_class" = "com.mysql.cj.jdbc.Driver"`

4. Communication link abnormality occurs when reading MySQL

   If the following error occurs:

    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = PoolInitializationException: Failed to initialize pool: Communications link failure
    
    The last packet successfully received from the server was 7 milliseconds ago. The last packet sent successfully to the server was 4 milliseconds ago.
    CAUSED BY: CommunicationsException: Communications link failure
        
    The last packet successfully received from the server was 7 milliseconds ago. The last packet sent successfully to the server was 4 milliseconds ago.
    CAUSED BY: SSLHandshakeExcepti
    ```

   You can view the be.out log of be

   If the following information is included:

    ```
    WARN: Establishing SSL connection without server's identity verification is not recommended.
    According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set.
    For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'.
    You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
    ```

   You can add `?useSSL=false` to the end of the JDBC connection string when creating the Catalog, such as `"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?useSSL=false"`

5. When querying a large amount of MySQL data, if the query is occasionally successful, the following error will occasionally be reported. When this error occurs, all MySQL connections are disconnected and cannot be connected to the MySQL Server. After a while, MySQL returns to normal, but All previous connections are gone:

    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INTERNAL_ERROR]UdfRuntimeException: JDBC executor sql has error:
    CAUSED BY: CommunicationsException: Communications link failure
    The last packet successfully received from the server was 4,446 milliseconds ago. The last packet sent successfully to the server was 4,446 milliseconds ago.
    ```

   When the above phenomenon occurs, it may be that MySQL Server's own memory or CPU resources are exhausted, causing the MySQL service to be unavailable. You can try to increase the memory or CPU configuration of MySQL Server.

6. During the process of querying MySQL, if it is found that the query results are inconsistent with the query results in the MySQL library

   First, check whether the string in the query field is case-sensitive. For example, there is a field c_1 in Table that contains two pieces of data: "aaa" and "AAA". If case-sensitivity of strings is not specified when initializing the MySQL database, then MySQL does not case-sensitive strings by default, but in Doris is strictly case-sensitive, so the following situations may occur:

    ```
    MySQL behavior:
    select count(c_1) from table where c_1 = "aaa"; The string size is not distinguished, so the result is: 2

    Doris behavior:
    select count(c_1) from table where c_1 = "aaa"; strictly distinguishes the string size, so the result is: 1
    ```

   If the above phenomenon occurs, it needs to be adjusted according to needs, as follows:

   Add the "BINARY" keyword to force case sensitivity when querying in MySQL: `select count(c_1) from table where BINARY c_1 = "aaa";`

   Or specify when creating a table in MySQL: `CREATE TABLE table (c_1 VARCHAR(255) CHARACTER SET binary);`

   Or specify collation rules to make case sensitive when initializing the MySQL database:
    ```
    [mysqld]
    character-set-server=utf8
    collation-server=utf8_bin
    [client]
    default-character-set=utf8
    [mysql]
    default-character-set=utf8
    ```

7. When querying MySQL, if you are stuck for a long time and no results are returned, or if you are stuck for a long time and a large number of write lock logs appear in fe.warn.log, you can try adding socketTimeout to the URL, for example: `jdbc:mysql ://host:port/database?socketTimeout=30000`, prevents the JDBC client from waiting indefinitely after the connection is closed by MySQL.

8. In the process of using MySQL Catalog, it is found that the JVM memory or the number of Threads in FE continues to grow and does not decrease, and a Forward to master connection timed out error may appear at the same time.

   Print the FE thread stack `jstack fe_pid > fe.js`. If a large number of `mysql-cj-abandoned-connection-cleanup` threads appear, it means there is a problem with the MySQL JDBC driver.

   Proceed as follows:

   1. Upgrade the MySQL JDBC driver to version 8.0.31 and above
   2. Add the `-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true` parameter to JAVA_OPTS in the FE and BE conf files, disable the connection cleanup function of the MySQL JDBC driver, and restart the cluster

   **Note:** If the version of Doris is 2.0.13 and above (2.0 Release), or 2.1.5 and above (2.1 Release), there is no need to increase this parameter, because Doris has disabled the connection cleaning function of the MySQL JDBC driver by default. . Just change the MySQL JDBC driver version. However, the Doris cluster needs to be restarted to clean up the previous Threads.
