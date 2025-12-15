---
{
    "title": "MySQL JDBC Catalog",
    "language": "en"
}
---

Doris JDBC Catalog supports connecting to MySQL databases via the standard JDBC interface. This document describes how to configure MySQL database connections.

For an overview of JDBC Catalog, please refer to: [JDBC Catalog Overview](./jdbc-catalog-overview.md)

## Usage Notes

To connect to a MySQL database, you need:

* MySQL 5.7, 8.0, or higher.

* The JDBC driver for MySQL, which you can download from the [Maven Repository](https://mvnrepository.com/artifact/com.mysql/mysql-connector-j). It is recommended to use MySQL Connector/J version 8.0.31 or above.

* Network connection between each Doris FE and BE node and the MySQL server, with the default port being 3306.

## Connecting to MySQL

```sql
CREATE CATALOG mysql_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:mysql://host:3306',
    'driver_url' = 'mysql-connector-j-8.3.0.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);
```

The `jdbc_url` defines the connection information and parameters to be passed to the MySQL JDBC driver. Supported URL parameters can be found in the [MySQL Developer Guide](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html).

### Connection Security

If the user has configured TLS with a globally trusted certificate installed on the data source, TLS can be enabled between the cluster and the data source by appending parameters to the JDBC connection string set in the `jdbc_url` property.

For example, for `MySQL Connector/J 8.0`, use the `sslMode` parameter to secure the connection via TLS. By default, this parameter is set to PREFERRED, which can secure the connection if the server is enabled. This parameter can also be set to REQUIRED, which will cause the connection to fail if TLS is not established.

It can be configured by adding the sslMode parameter in the `jdbc_url`:

```sql
'jdbc_url' = 'jdbc:mysql://host:3306/?sslMode=REQUIRED'
```

For more information on TLS configuration options, please refer to the [MySQL JDBC Security Documentation](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html#cj-conn-prop_sslMode).

## Hierarchical Mapping

When mapping MySQL, a Database in Doris corresponds to a Database in MySQL. A Table under a Database in Doris corresponds to Tables under that Database in MySQL. The mapping relationship is as follows:

| Doris    | MySQL        |
| -------- | ------------ |
| Catalog  | MySQL Server |
| Database | Database     |
| Table    | Table        |

## Column Type Mapping

| MySQL Type                           | Doris Type                 | Comment                                                                        |
| ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------ |
| boolean                              | tinyint                    |                                                                                |
| tinyint                              | tinyint                    |                                                                                |
| smallint                             | smallint                   |                                                                                |
| mediumint                            | int                        |                                                                                |
| int                                  | int                        |                                                                                |
| bigint                               | bigint                     |                                                                                |
| unsigned tinyint                     | smallint                   | Doris does not support unsigned data types, so unsigned data types are mapped to the corresponding larger data type in Doris.             |
| unsigned mediumint                   | int                        | Same as above.                                                                            |
| unsigned int                         | bigint                     | Same as above.                                                                            |
| unsigned bigint                      | largeint                   | Same as above.                                                                            |
| float                                | float                      |                                                                                |
| double                               | double                     |                                                                                |
| decimal(P, S)                        | decimal(P, S)              |                                                                                |
| unsigned decimal(P, S)               | decimal(P + 1, S) / string | If it exceeds the maximum precision supported by Doris, it will be handled by String. Note that when this type is mapped to String, it only supports queries and cannot write to MySQL. |
| date                                 | date                       |                                                                                |
| timestamp(S)                         | datetime(S)                |                                                                                |
| datetime(S)                          | datetime(S)                |                                                                                |
| year                                 | smallint                   | Doris does not support the year type, so the year type is mapped to smallint.                                       |
| time                                 | string                     | Doris does not support the time type, so the time type is mapped to string.                                         |
| char                                 | char                       |                                                                                |
| varchar                              | varchar                    |                                                                                |
| json                                 | string                     | For better balance between reading and computing performance, Doris maps the json type to the string type.                                  |
| set                                  | string                     |                                                                                |
| enum                                 | string                     |                                                                                |
| bit                                  | boolean / string           | Doris does not support the bit type, so the bit type is mapped to boolean when bit(1), and to string in other cases.                |
| tinytext, text, mediumtext, longtext | string                     |                                                                                |
| blob, mediumblob, longblob, tinyblob, binary, varbinary | string/varbinary                     |  Controlled by the `enable.mapping.varbinary` property of Catalog (supported since 4.0.2). The default is `false`, which maps to `string`; when `true`, it maps to `varbinary` type.                                                                              |
| other                                | UNSUPPORTED                |                                                                                |

## Appendix

### Time Zone Issues

When accessing data through JDBC Catalog, the JNI part of BE uses the JVM time zone. The JVM time zone defaults to the time zone of the BE deployment machine, which affects time zone conversion when JDBC reads data. To ensure time zone consistency, it is recommended to set the JVM time zone in `be.conf`'s `JAVA_OPTS` to be consistent with the Doris session variable `time_zone`.

When reading MySQL's timestamp type, add the parameters `connectionTimeZone=LOCAL` and `forceConnectionTimeZoneToSession=true` in the JDBC URL. These parameters are applicable to MySQL Connector/J version 8 and above, ensuring that the read time is the Doris BE JVM time zone, not the MySQL server's time zone.

## Common Issues

### Connection Exception Troubleshooting

* Communications link failure The last packet successfully received from the server was 7 milliseconds ago.

  * Cause:

      * Network issues:

          * Unstable network or connection interruption.

          * High network latency between the client and server.

      * MySQL server settings

          * The MySQL server may have configured connection timeout parameters, such as `wait_timeout` or `interactive_timeout`, causing the connection to be closed due to timeout.

      * Firewall settings

          * Firewall rules may block communication between the client and server.

      * Connection pool settings

          * The configuration `connection_pool_max_life_time` in the connection pool may cause the connection to be closed or recycled, or not kept alive in time.

      * Server resource issues

          * The MySQL server may lack resources to handle new connection requests.

      * Client configuration

          * Incorrect client JDBC driver configuration, such as the `autoReconnect` parameter not set or set improperly.

  * Solution

      * Check network connection:

          * Ensure stable network connection between the client and server, avoiding high network latency.

      * Check MySQL server configuration:

          * Review and adjust the MySQL server's `wait_timeout` and `interactive_timeout` parameters to ensure they are set reasonably.

      * Check firewall configuration:

          * Ensure firewall rules allow communication between the client and server.

      * Adjust connection pool settings:

          * Review and adjust the connection pool's configuration parameters `connection_pool_max_life_time`, ensuring it is less than MySQL's `wait_timeout` and `interactive_timeout` parameters and greater than the longest execution time of SQL.

      * Monitor server resources:

          * Monitor the MySQL server's resource usage to ensure there are enough resources to handle connection requests.

      * Optimize client configuration:

          * Ensure the JDBC driver's configuration parameters are correct, such as `autoReconnect=true`, to ensure the connection can automatically reconnect after interruption.

* java.io.EOFException MESSAGE: Can not read response from server. Expected to read 819 bytes, read 686 bytes before connection was unexpectedly lost.

  * Cause: Connection was killed by MySQL or MySQL crashed

  * Solution: Check if MySQL has a mechanism to actively kill connections, or if a large query crashed MySQL

### Other Issues

1. Garbled characters when reading and writing MySQL emoji

   When Doris queries MySQL, the default utf8 encoding in MySQL is utf8mb3, which cannot represent emoji that require 4-byte encoding. Here, you need to change MySQL's encoding to utf8mb4 to support 4-byte encoding.

   You can globally modify the configuration item

   ```text
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

   Modify the type of the corresponding table and column
   ALTER TABLE table_name MODIFY colum_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ALTER TABLE table_name CHARSET=utf8mb4;
   SET NAMES utf8mb4
   ```

2. Exception when reading MySQL DATE/DATETIME type

   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INTERNAL_ERROR]UdfRuntimeException: get next block failed: 
   CAUSED BY: SQLException: Zero date value prohibited
   CAUSED BY: DataReadException: Zero date value prohibited
   ```

   In JDBC, illegal DATE/DATETIME is handled by default by throwing an exception. The behavior can be controlled by the URL parameter `zeroDateTimeBehavior`. The optional parameters are: `exception`, `convertToNull`, `round`, which are: exception error; convert to `NULL` value; convert to `"0001-01-01 00:00:00"`

   You need to add `zeroDateTimeBehavior=convertToNull` to the JDBC connection string at the end of the `jdbc_url` when creating the Catalog, such as `"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?zeroDateTimeBehavior=convertToNull"`. In this case, JDBC will convert 0000-00-00 or 0000-00-00 00:00:00 to null, and then Doris will handle all Date/DateTime type columns of the current Catalog as nullable types, so they can be read normally.

3. When reading MySQL Catalog or other JDBC Catalog, class loading failure occurs, such as `failed to load driver class com.mysql.cj.jdbc.driver in either of hikariconfig class loader`

   This is because the `driver_class` filled in when creating the Catalog is incorrect and needs to be filled in correctly, such as the example above is a case issue, it should be filled in as `'driver_class' = 'com.mysql.cj.jdbc.Driver'`

4. Communication link exception when reading MySQL

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = PoolInitializationException: Failed to initialize pool: Communications link failure

  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: CommunicationsException: Communications link failure
      
  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: SSLHandshakeException
  ```

  You can check the be.out log of be, if it contains the following information:

  ```
  WARN: Establishing SSL connection without server's identity verification is not recommended. 
  According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. 
  For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. 
  You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
  ```

  You can add `useSSL=false` in the `jdbc_url`, such as `'jdbc_url' = 'jdbc:mysql://127.0.0.1:3306/test?useSSL=false'`.

* When querying large amounts of data from MySQL, if the query occasionally succeeds and occasionally reports the following error, and when this error occurs, all connections to MySQL are disconnected and cannot connect to the MySQL Server, but after a while, MySQL returns to normal, but the previous connections are gone:

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = [INTERNAL_ERROR]UdfRuntimeException: JDBC executor sql has error:
  CAUSED BY: CommunicationsException: Communications link failure
  The last packet successfully received from the server was 4,446 milliseconds ago. The last packet sent successfully to the server was 4,446 milliseconds ago.
  ```

  When the above phenomenon occurs, it may be that the MySQL Server's own memory or CPU resources are exhausted, causing the MySQL service to be unavailable. You can try to increase the memory or CPU configuration of the MySQL Server.

* During the process of querying MySQL, if you find that the query results are inconsistent with those in the MySQL database

  First, check whether there are case-sensitive situations in the query fields. For example, if there are two pieces of data `"aaa"` and `"AAA"` in a field `c_1` in the Table, if the MySQL database is not specified to distinguish case when initialized, MySQL does not distinguish case by default, but Doris strictly distinguishes case, so the following situation will occur:

  ```text
  MySQL behavior:
  select count(c_1) from table where c_1 = "aaa"; Does not distinguish case, so the result is: 2

  Doris behavior:
  select count(c_1) from table where c_1 = "aaa"; Strictly distinguishes case, so the result is: 1
  ```

  If the above phenomenon occurs, you need to adjust according to the requirements, as follows:

  * Add the "BINARY" keyword in MySQL queries to force case sensitivity: `select count(c_1) from table where BINARY c_1 = "aaa";`

  * Or specify when creating a table in MySQL: `CREATE TABLE table (c_1 VARCHAR(255) CHARACTER SET binary);`

  * Or specify collation rules to distinguish case when initializing the MySQL database:

		```text
		[mysqld]
		character-set-server=utf8
		collation-server=utf8_bin
		[client]
		default-character-set=utf8
		[mysql]
		default-character-set=utf8
		```

* When querying MySQL, if it gets stuck for a long time without returning results, or gets stuck for a long time and a large number of write lock logs appear in fe.warn.log.

  You can try adding socketTimeout to the URL, for example: `jdbc:mysql://host:port/database?socketTimeout=30000`, to prevent the JDBC client from waiting indefinitely after being closed by MySQL.

* During the use of MySQL Catalog, if you find that the JVM memory or Threads number of FE continues to grow without decreasing, and may simultaneously report Forward to master connection timed out error

  Print the FE thread stack `jstack fe_pid > fe.js`, if a large number of `mysql-cj-abandoned-connection-cleanup` threads appear, it indicates a problem with the MySQL JDBC driver.

  Handle it as follows:

  * Upgrade the MySQL JDBC driver to version 8.0.31 or above

  * Add the parameter `-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true` in the `JAVA_OPTS` of the FE and BE conf files to disable the connection cleanup function of the MySQL JDBC driver, and restart the cluster

	Note: If the version of Doris is 2.0.13 or above, or 2.1.5 or above, there is no need to add this parameter, because Doris has already disabled the connection cleanup function of the MySQL JDBC driver by default. Just replace the MySQL JDBC driver version. However, you need to restart the Doris cluster to clean up the previously leaked threads.
