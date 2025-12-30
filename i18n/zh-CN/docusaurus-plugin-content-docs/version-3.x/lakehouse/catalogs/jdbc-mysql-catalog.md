---
{
    "title": "MySQL JDBC Catalog",
    "language": "zh-CN",
    "description": "Doris JDBC Catalog 支持通过标准 JDBC 接口连接 MySQL 数据库。本文档介绍如何配置 MySQL 数据库连接。"
}
---

Doris JDBC Catalog 支持通过标准 JDBC 接口连接 MySQL 数据库。本文档介绍如何配置 MySQL 数据库连接。

关于 JDBC Catalog 概述，请参阅：[ JDBC Catalog 概述](./jdbc-catalog-overview.md)

## 使用须知

要连接到 MySQL 数据库，您需要

* MySQL 5.7, 8.0 或更高版本。

* MySQL 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/com.mysql/mysql-connector-j)下载最新或指定版本的 MySQL JDBC 驱动程序。推荐使用 MySQL Connector/J 8.0.31 及以上版本。

* Doris 每个 FE 和 BE 节点和 MySQL 服务器之间的网络连接，默认端口为 3306。

## 连接 MySQL

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

`jdbc_url` 定义要传递给 MySQL JDBC 驱动程序的连接信息和参数。支持的 URL 的参数可在 [MySQL 开发指南](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html) 中找到。

### 连接安全

如果用户使用数据源上安装的全局信任证书配置了 TLS，则可以通过将参数附加到在 `jdbc_url` 属性中设置的 JDBC 连接字符串来启用集群和数据源之间的 TLS。

例如，对于 `MySQL Connector/J 8.0` 版，使用 `sslMode` 参数通过 TLS 保护连接。默认情况下，该参数设置为 PREFERRED，如果服务器启用，它可以保护连接。还可以将此参数设置为 REQUIRED，如果未建立 TLS，则会导致连接失败。

可以在通过在 `jdbc_url` 中添加 sslMode 参数来配置它：

```sql
'jdbc_url' = 'jdbc:mysql://host:3306/?sslMode=REQUIRED'
```

有关 TLS 配置选项的更多信息，请参阅 [MySQL JDBC 安全文档](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html#cj-conn-prop_sslMode)。

## 层级映射

映射 MySQL 时，Doris 的一个 Database 对应于 MySQL 中的一个 Database。而 Doris 的 Database 下的 Table 则对应于 MySQL 中，该 Database 下的 Tables。即映射关系如下：

| Doris    | MySQL        |
| -------- | ------------ |
| Catalog  | MySQL Server |
| Database | Database     |
| Table    | Table        |

## 列类型映射

| MySQL Type                           | Doris Type                 | Comment                                                                        |
| ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------ |
| boolean                              | tinyint                    |                                                                                |
| tinyint                              | tinyint                    |                                                                                |
| smallint                             | smallint                   |                                                                                |
| mediumint                            | int                        |                                                                                |
| int                                  | int                        |                                                                                |
| bigint                               | bigint                     |                                                                                |
| unsigned tinyint                     | smallint                   | Doris 不支持 unsigned 数据类型，所以 unsigned 数据类型会被映射为 Doris 对应大一个数量级的数据类型。             |
| unsigned mediumint                   | int                        | 同上。                                                                            |
| unsigned int                         | bigint                     | 同上。                                                                            |
| unsigned bigint                      | largeint                   | 同上。                                                                            |
| float                                | float                      |                                                                                |
| double                               | double                     |                                                                                |
| decimal(P, S)                        | decimal(P, S)              |                                                                                |
| unsigned decimal(P, S)               | decimal(P + 1, S) / string | 如果超过 Doris 支持的最大精度，则会使用 String 承接。注意在此类型被映射为 String 时，只能支持查询，不能对 MySQL 进行写入操作。 |
| date                                 | date                       |                                                                                |
| timestamp(S)                         | datetime(S)                |                                                                                |
| datetime(S)                          | datetime(S)                |                                                                                |
| year                                 | smallint                   | Doris 不支持 year 类型，year 类型会被映射为 smallint。                                       |
| time                                 | string                     | Doris 不支持 time 类型，time 类型会被映射为 string。                                         |
| char                                 | char                       |                                                                                |
| varchar                              | varchar                    |                                                                                |
| json                                 | string                     | 为了更好的读取与计算性能均衡，Doris 会将 json 类型映射为 string 类型。                                  |
| set                                  | string                     |                                                                                |
| enum                                 | string                     |                                                                                |
| bit                                  | boolean / string           | Doris 不支持 bit 类型，bit 类型会在 bit(1) 时被映射为 boolean，其他情况下映射为 string。                |
| tinytext, text, mediumtext, longtext | string                     |                                                                                |
| blob, mediumblob, longblob, tinyblob, binary, varbinary | string /varbinary | 由 properties 中 `enable.mapping.varbinary` (4.0.2 后开始支持) 属性控制。默认为 `false`, 则映射到 `string`; 为 `true` 时，则映射到 `varbinary` 类型。|
| other                                | UNSUPPORTED                |                                                                                |

## 附录

### 时区问题

通过 JDBC Catalog 访问数据时，BE 的 JNI 部分使用 JVM 时区。JVM 时区默认为 BE 部署机器的时区，这会影响 JDBC 读取数据时的时区转换。为了确保时区一致性，建议在 `be.conf` 的 `JAVA_OPTS` 中设置 JVM 时区与 Doris 会话变量的 `time_zone` 一致。

读取 MySQL 的 timestamp 类型时，请在 JDBC URL 中添加参数：`connectionTimeZone=LOCAL` 和 `forceConnectionTimeZoneToSession=true`。这些参数适用于 MySQL Connector/J 8 以上版本，可确保读取的时间为 Doris BE JVM 时区，而非 MySQL 服务端的时区。

## 常见问题

### 连接异常排查

* Communications link failure The last packet successfully received from the server was 7 milliseconds ago.

  * 原因：

      * 网络问题：

          * 网络不稳定或连接中断。

          * 客户端和服务器之间的网络延迟过高。

      * MySQL 服务器设置

          * MySQL 服务器可能配置了连接超时参数，例如 `wait_timeout` 或 `interactive_timeout`，导致连接超时被关闭。

      * 防火墙设置

          * 防火墙规则可能阻止了客户端与服务器之间的通信。

      * 连接池设置

          * 连接池中的配置 `connection_pool_max_life_time` 可能导致连接被关闭或回收，或者未及时探活

      * 服务器资源问题

          * MySQL 服务器可能资源不足，无法处理新的连接请求。

      * 客户端配置

          * 客户端 JDBC 驱动配置错误，例如 `autoReconnect` 参数未设置或设置不当。

  * 解决方案

      * 检查网络连接：

          * 确认客户端和服务器之间的网络连接稳定，避免网络延迟过高。

      * 检查 MySQL 服务器配置：

          * 查看并调整 MySQL 服务器的 `wait_timeout` 和 `interactive_timeout` 参数，确保它们设置合理。

      * 检查防火墙配置：

          * 确认防火墙规则允许客户端与服务器之间的通信。

      * 调整连接池设置：

          * 检查并调整连接池的配置参数 `connection_pool_max_life_time`，确保小于 MySQL 的 `wait_timeout` 和 `interactive_timeout` 参数并大于执行时间最长的 SQL

      * 监控服务器资源：

          * 监控 MySQL 服务器的资源使用情况，确保有足够的资源处理连接请求。

      * 优化客户端配置：

          * 确认 JDBC 驱动的配置参数正确，例如 `autoReconnect=true`，确保连接能在中断后自动重连。

* java.io.EOFException MESSAGE: Can not read response from server. Expected to read 819 bytes, read 686 bytes before connection was unexpectedly lost.

  * 原因：连接被 MySQL Kill 或者 MySQL 宕机

  * 解决：检查 MySQL 是否有主动 kill 连接的机制，或者是否因为查询过大查崩 MySQL

### 其他问题

1. 读写 MySQL 的 emoji 表情出现乱码

   Doris 查询 MySQL 时，由于 MySQL 之中默认的 utf8 编码为 utf8mb3，无法表示需要 4 字节编码的 emoji 表情。这里需要将 MySQL 的编码修改为 utf8mb4，以支持 4 字节编码。

   可全局修改配置项

   ```text
   修改 mysql 目录下的 my.ini 文件（linux 系统为 etc 目录下的 my.cnf 文件）
   [client]
   default-character-set=utf8mb4

   [mysql]
   设置 mysql 默认字符集
   default-character-set=utf8mb4

   [mysqld]
   设置 mysql 字符集服务器
   character-set-server=utf8mb4
   collation-server=utf8mb4_unicode_ci
   init_connect='SET NAMES utf8mb4

   修改对应表与列的类型
   ALTER TABLE table_name MODIFY colum_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ALTER TABLE table_name CHARSET=utf8mb4;
   SET NAMES utf8mb4
   ```

2. 读取 MySQL DATE/DATETIME 类型出现异常

   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INTERNAL_ERROR]UdfRuntimeException: get next block failed: 
   CAUSED BY: SQLException: Zero date value prohibited
   CAUSED BY: DataReadException: Zero date value prohibited
   ```

   因为 JDBC 中对于非法的 DATE/DATETIME 默认处理为抛出异常。可以通过 URL 参数 `zeroDateTimeBehavior` 控制该行为。可选参数为：`exception`,`convertToNull`,`round`, 分别为：异常报错；转为 `NULL` 值；转为 `"0001-01-01 00:00:00"`

   需要在创建 Catalog 的 `jdbc_url` 把 JDBC 连接串最后增加 `zeroDateTimeBehavior=convertToNull` ,如 `"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?zeroDateTimeBehavior=convertToNull"` 这种情况下，JDBC 会把 0000-00-00 或者 0000-00-00 00:00:00 转换成 null，然后 Doris 会把当前 Catalog 的所有 Date/DateTime 类型的列按照可空类型处理，这样就可以正常读取了。

3. 读取 MySQL Catalog 或其他 JDBC Catalog 时，出现加载类失败，如 `failed to load driver class com.mysql.cj.jdbc.driver in either of hikariconfig class loader`

   这是因为在创建 Catalog 时，填写的 `driver_class` 不正确，需要正确填写，如上方例子为大小写问题，应填写为 `'driver_class' = 'com.mysql.cj.jdbc.Driver'`

4. 读取 MySQL 出现通信链路异常

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = PoolInitializationException: Failed to initialize pool: Communications link failure

  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: CommunicationsException: Communications link failure
      
  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: SSLHandshakeException
  ```

  可查看 be 的 be.out 日志，如果包含以下信息：

  ```
  WARN: Establishing SSL connection without server's identity verification is not recommended. 
  According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. 
  For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. 
  You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
  ```

  可在 `jdbc_url` 中增加 `useSSL=false`，如 `'jdbc_url' = 'jdbc:mysql://127.0.0.1:3306/test?useSSL=false'`。

* 查询 MySQL 大数据量时，如果查询偶尔能够成功，偶尔会报如下错误，且出现该错误时 MySQL 的连接被全部断开，无法连接到 MySQL Server，过段时间后 MySQL 又恢复正常，但是之前的连接都没了：

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = [INTERNAL_ERROR]UdfRuntimeException: JDBC executor sql has error:
  CAUSED BY: CommunicationsException: Communications link failure
  The last packet successfully received from the server was 4,446 milliseconds ago. The last packet sent successfully to the server was 4,446 milliseconds ago.
  ```

  出现上述现象时，可能是 MySQL Server 自身的内存或 CPU 资源被耗尽导致 MySQL 服务不可用，可以尝试增大 MySQL Server 的内存或 CPU 配置。

* 查询 MySQL 的过程中，如果发现和在 MySQL 库的查询结果不一致的情况

  首先要先排查下查询字段中是字符串否存在有大小写情况。比如，Table 中有一个字段 `c_1` 中有 `"aaa"` 和 `"AAA"` 两条数据，如果在初始化 MySQL 数据库时未指定区分字符串大小写，那么 MySQL 默认是不区分字符串大小写的，但是在 Doris 中是严格区分大小写的，所以会出现以下情况：

  ```text
  MySQL 行为：
  select count(c_1) from table where c_1 = "aaa"; 未区分字符串大小，所以结果为：2

  Doris 行为：
  select count(c_1) from table where c_1 = "aaa"; 严格区分字符串大小，所以结果为：1
  ```

  如果出现上述现象，那么需要按照需求来调整，方式如下：

  * 在 MySQL 中查询时添加“BINARY”关键字来强制区分大小写：`select count(c_1) from table where BINARY c_1 = "aaa";`

  * 或者在 MySQL 中建表时候指定：`CREATE TABLE table (c_1 VARCHAR(255) CHARACTER SET binary);`

  * 或者在初始化 MySQL 数据库时指定校对规则来区分大小写：

    ```plain&#x20;text
    [mysqld]
    character-set-server=utf8
    collation-server=utf8_bin
    [client]
    default-character-set=utf8
    [mysql]
    default-character-set=utf8
    ```

* 查询 MySQL 的时候，出现长时间卡住没有返回结果，或着卡住很长时间并且 fe.warn.log 中出现出现大量 write lock 日志。

  可以尝试在 URL 添加 socketTimeout，例如：`jdbc:mysql://host:port/database?socketTimeout=30000`，防止 JDBC 客户端 在被 MySQL 关闭连接后无限等待。

* 在使用 MySQL Catalog 的过程中发现 FE 的 JVM 内存或 Threads 数持续增长不减少，并可能同时出现 Forward to master connection timed out 报错

  打印 FE 线程堆栈 `jstack fe_pid > fe.js`，如果出现大量 `mysql-cj-abandoned-connection-cleanup` 线程，说明是 MySQL JDBC 驱动的问题。

  按照如下方式处理：

  * 升级 MySQL JDBC 驱动到 8.0.31 及以上版本

  * 在 FE 和 BE conf 文件的 `JAVA_OPTS` 中增加 `-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true` 参数，禁用 MySQL JDBC 驱动的连接清理功能，并重启集群

  注意：如果 Doris 的版本在 2.0.13 及以上，或 2.1.5 及以上，则无需增加该参数，因为 Doris 已经默认禁用了 MySQL JDBC 驱动的连接清理功能。只需更换 MySQL JDBC 驱动版本即可。但是需要重启 Doris 集群来清理掉之前的泄漏线程。
