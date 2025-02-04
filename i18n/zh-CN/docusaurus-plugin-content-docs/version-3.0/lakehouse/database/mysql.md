---
{
  "title": "MySQL",
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

Doris JDBC Catalog 支持通过标准 JDBC 接口连接 MySQL 数据库。本文档介绍如何配置 MySQL 数据库连接。

## 使用须知

要连接到 MySQL 数据库，您需要

- MySQL 5.7, 8.0 或更高版本

- MySQL 数据库的 JDBC 驱动程序，您可以从 [Maven 仓库](https://mvnrepository.com/artifact/com.mysql/mysql-connector-j)下载最新或指定版本的 MySQL JDBC 驱动程序。**推荐使用 MySQL Connector/J 8.0.31 及以上版本。**

- Doris 每个 FE 和 BE 节点和 MySQL 服务器之间的网络连接，默认端口为 3306。

## 连接 MySQL

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

:::info 备注
`jdbc_url` 定义要传递给 MySQL JDBC 驱动程序的连接信息和参数。
支持的 URL 的参数可在 [MySQL 开发指南](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html) 中找到。
:::

### 连接安全

如果您使用数据源上安装的全局信任证书配置了 TLS，则可以通过将参数附加到在 jdbc_url 属性中设置的 JDBC 连接字符串来启用集群和数据源之间的 TLS。

例如，对于 MySQL Connector/J 8.0 版，使用 sslMode 参数通过 TLS 保护连接。默认情况下，该参数设置为 PREFERRED，如果服务器启用，它可以保护连接。您还可以将此参数设置为 REQUIRED，如果未建立 TLS，则会导致连接失败。

您可以在通过在 `jdbc_url` 中添加 sslMode 参数来配置它：

```sql
“jdbc_url”=“jdbc:mysql://example.net:3306/?sslMode=REQUIRED”
```

有关 TLS 配置选项的更多信息，请参阅 [MySQL JDBC 安全文档](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html#cj-conn-prop_sslMode)。

## 层级映射

映射 MySQL 时，Doris 的一个 Database 对应于 MySQL 中的一个 Database。而 Doris 的 Database 下的 Table 则对应于 MySQL 中，该 Database 下的 Tables。即映射关系如下：

|  Doris   |    MySQL     |
|:--------:|:------------:|
| Catalog  | MySQL Server |
| Database |   Database   |
|  Table   |    Table     |

## 类型映射

### MySQL 到 Doris 类型映射

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
- Doris 不支持 UNSIGNED 数据类型，所以 UNSIGNED 数据类型会被映射为 Doris 对应大一个数量级的数据类型。
- UNSIGNED DECIMAL(p,s) 会被映射为 DECIMAL(p+1,s) 或 STRING。注意在此类型被映射为 String 时，只能支持查询，不能对 MySQL 进行写入操作。
- 为了更好的读取与计算性能均衡，Doris 会将 JSON 类型映射为 STRING 类型。
- Doris 不支持 BIT 类型，BIT 类型会在 BIT(1) 时被映射为 BOOLEAN，其他情况下映射为 STRING。
- Doris 不支持 YEAR 类型，YEAR 类型会被映射为 SMALLINT。
- Doris 不支持 TIME 类型，TIME 类型会被映射为 STRING。
:::

### 时间戳类型处理

在 JDBC 类型 Catalog 读取数据时，BE 的 Java 部分使用 JVM 时区。JVM 时区默认为 BE 部署机器的时区，这会影响 JDBC 读取数据时的时区转换。

为了确保时区一致性，建议在 be.conf 的 JAVA_OPTS 中设置 JVM 时区与 Doris session 的 `time_zone` 一致。

读取 MySQL 的 TIMESTAMP 类型时，请在 JDBC URL 中添加参数：`connectionTimeZone=LOCAL` 和 `forceConnectionTimeZoneToSession=true`。这些参数适用于 MySQL Connector/J 8 以上版本，可确保读取的时间为 Doris BE JVM 时区，而非 MySQL session 时区。

## 查询优化

### 谓词下推

1. 当执行类似于 `where dt = '2022-01-01'` 这样的查询时，Doris 能够将这些过滤条件下推到外部数据源，从而直接在数据源层面排除不符合条件的数据，减少了不必要的数据获取和传输。这大大提高了查询性能，同时也降低了对外部数据源的负载。

2. 当变量 `enable_ext_func_pred_pushdown` 设置为true，会将 where 之后的函数条件也下推到外部数据源，Doris 会自动识别部分 MySQL 不支持的函数，可通过 explain sql 查看。 

   当前 Doris 默认不会下推到 MySQL 的函数如下

   |   Function   |
   |:------------:|
   |  DATE_TRUNC  |
   | MONEY_FORMAT |
   |   NEGATIVE   |

   当您发现还有其他函数不支持下推时，可以通过 `fe.conf` 配置 `jdbc_mysql_unsupported_pushdown_functions` 来指定不支持下推的函数。如：`jdbc_mysql_unsupported_pushdown_functions=func1,func2`

### 行数限制

如果在查询中带有 limit 关键字，Doris 会将 limit 下推到 MySQL，以减少数据传输量。

### 转义字符

Doris 会在下发到 MySQL 的查询语句中，自动在字段名与表名上加上转义符：(``)，以避免字段名与表名与 MySQL 内部关键字冲突。

## 连接异常排查

* Communications link failure The last packet successfully received from the server was 7 milliseconds ago.
  * 原因：
    * 网络问题：
      * 网络不稳定或连接中断。
      * 客户端和服务器之间的网络延迟过高。
    * MySQL 服务器设置
      * MySQL 服务器可能配置了连接超时参数，例如 wait_timeout 或 interactive_timeout，导致连接超时被关闭。
    * 防火墙设置
      * 防火墙规则可能阻止了客户端与服务器之间的通信。
    * 连接池设置
      * 连接池中的配置 connection_pool_max_life_time 可能导致连接被关闭或回收，或者未及时探活
    * 服务器资源问题
      * MySQL 服务器可能资源不足，无法处理新的连接请求。
    * 客户端配置
        * 客户端 JDBC 驱动配置错误，例如 autoReconnect 参数未设置或设置不当。
  * 解决
    * 检查网络连接：
        * 确认客户端和服务器之间的网络连接稳定，避免网络延迟过高。
    * 检查 MySQL 服务器配置：
        * 查看并调整 MySQL 服务器的 wait_timeout 和 interactive_timeout 参数，确保它们设置合理。
    * 检查防火墙配置：
        * 确认防火墙规则允许客户端与服务器之间的通信。
    * 调整连接池设置：
        * 检查并调整连接池的配置参数 connection_pool_max_life_time,确保小于 MySQL 的wait_timeout 和 interactive_timeout 参数并大于执行时间最长的 SQL
    * 监控服务器资源：
        *  监控 MySQL 服务器的资源使用情况，确保有足够的资源处理连接请求。
    * 优化客户端配置：
        * 确认 JDBC 驱动的配置参数正确，例如 autoReconnect=true，确保连接能在中断后自动重连。

* java.io.EOFException MESSAGE: Can not read response from server. Expected to read 819 bytes, read 686 bytes before connection was unexpectedly lost.
  * 原因：连接被 MySQL Kill 或者 MySQL 宕机
  * 解决：检查 MySQL 是否有主动 kill 连接的机制，或者是否因为查询过大查崩 MySQL

## 常见问题

1. 读写 MySQL 的 emoji 表情出现乱码

    Doris 进行 MySQL Catalog 查询时，由于 MySQL 之中默认的 utf8 编码为 utf8mb3 ，无法表示需要 4 字节编码的 emoji 表情。这里需要将 MySQL 的编码修改为 utf8mb4 ，以支持 4 字节编码。

    可全局修改配置项

    ```
    修改mysql目录下的my.ini文件（linux系统为etc目录下的my.cnf文件）
    [client]
    default-character-set=utf8mb4
    
    [mysql]
    设置mysql默认字符集
    default-character-set=utf8mb4
    
    [mysqld]
    设置mysql字符集服务器
    character-set-server=utf8mb4
    collation-server=utf8mb4_unicode_ci
    init_connect='SET NAMES utf8mb4
    
    修改对应表与列的类型
    ALTER TABLE table_name MODIFY  colum_name  VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ALTER TABLE table_name CHARSET=utf8mb4;
    SET NAMES utf8mb4
    ```

2. 读取 MySQL DATE/DATETIME 类型出现异常

    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INTERNAL_ERROR]UdfRuntimeException: get next block failed: 
    CAUSED BY: SQLException: Zero date value prohibited
    CAUSED BY: DataReadException: Zero date value prohibited
    ```

    这是因为 JDBC 中对于该非法的 DATE/DATETIME 默认处理为抛出异常，可以通过参数 `zeroDateTimeBehavior`控制该行为。

    可选参数为: `exception`,`convertToNull`,`round`, 分别为：异常报错，转为NULL值，转为 "0001-01-01 00:00:00";

    需要在创建 Catalog 的 `jdbc_url` 把JDBC连接串最后增加 `zeroDateTimeBehavior=convertToNull` ,如 `"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?zeroDateTimeBehavior=convertToNull"`
    这种情况下，JDBC 会把 0000-00-00 或者 0000-00-00 00:00:00 转换成 null，然后 Doris 会把当前 Catalog 的所有 Date/DateTime 类型的列按照可空类型处理，这样就可以正常读取了。

3. 读取 MySQL Catalog 或其他 JDBC Catalog 时，出现加载类失败

    如以下异常：

    ```
    failed to load driver class com.mysql.cj.jdbc.driver in either of hikariconfig class loader
    ```

    这是因为在创建 Catalog 时，填写的 driver_class 不正确，需要正确填写，如上方例子为大小写问题，应填写为 `"driver_class" = "com.mysql.cj.jdbc.Driver"`

4. 读取 MySQL 出现通信链路异常

    如果出现如下报错：

    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = PoolInitializationException: Failed to initialize pool: Communications link failure
    
    The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
    CAUSED BY: CommunicationsException: Communications link failure
        
    The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
    CAUSED BY: SSLHandshakeExcepti
    ```

    可查看 be 的 be.out 日志

    如果包含以下信息：

    ```
    WARN: Establishing SSL connection without server's identity verification is not recommended. 
    According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. 
    For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. 
    You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
    ```

    可在创建 Catalog 的 `jdbc_url` 把 JDBC 连接串最后增加 `?useSSL=false` ,如 `"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?useSSL=false"`

5. 查询 MySQL 大数据量时，如果查询偶尔能够成功，偶尔会报如下错误，且出现该错误时 MySQL 的连接被全部断开，无法连接到 MySQL Server，过段时间后 MySQL 又恢复正常，但是之前的连接都没了：

    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INTERNAL_ERROR]UdfRuntimeException: JDBC executor sql has error:
    CAUSED BY: CommunicationsException: Communications link failure
    The last packet successfully received from the server was 4,446 milliseconds ago. The last packet sent successfully to the server was 4,446 milliseconds ago.
    ```

    出现上述现象时，可能是 MySQL Server 自身的内存或 CPU 资源被耗尽导致 MySQL 服务不可用，可以尝试增大 MySQL Server 的内存或 CPU 配置。

6. 查询 MySQL 的过程中，如果发现和在 MySQL 库的查询结果不一致的情况

    首先要先排查下查询字段中是字符串否存在有大小写情况。比如，Table 中有一个字段 c_1 中有 "aaa" 和 "AAA" 两条数据，如果在初始化 MySQL 数据库时未指定区分字符串大小写，那么 MySQL 默认是不区分字符串大小写的，但是在 Doris 中是严格区分大小写的，所以会出现以下情况：

    ```
    MySQL行为：
    select count(c_1) from table where c_1 = "aaa"; 未区分字符串大小，所以结果为：2

    Doris行为：
    select count(c_1) from table where c_1 = "aaa"; 严格区分字符串大小，所以结果为：1
    ```

    如果出现上述现象，那么需要按照需求来调整，方式如下：

    在 MySQL 中查询时添加 “BINARY” 关键字来强制区分大小写：`select count(c_1) from table where BINARY c_1 = "aaa";` 

    或者在 MySQL 中建表时候指定：`CREATE TABLE table (c_1 VARCHAR(255) CHARACTER SET binary);` 

    或者在初始化 MySQL 数据库时指定校对规则来区分大小写：
    ```
    [mysqld]
    character-set-server=utf8
    collation-server=utf8_bin
    [client]
    default-character-set=utf8
    [mysql]
    default-character-set=utf8
    ```

7. 查询 MySQL 的时候，出现长时间卡住没有返回结果，或着卡住很长时间并且 fe.warn.log 中出现出现大量 write lock 日志，可以尝试在 URL 添加 socketTimeout ，例如：`jdbc:mysql://host:port/database?socketTimeout=30000`，防止 JDBC 客户端 在被 MySQL 关闭连接后无限等待。

8. 在使用 MySQL Catalog 的过程中发现 FE 的 JVM 内存或 Threads 数持续增长不减少，并可能同时出现 Forward to master connection timed out 报错

   打印 FE 线程堆栈 `jstack fe_pid > fe.js`，如果出现大量 `mysql-cj-abandoned-connection-cleanup` 线程，说明是 MySQL JDBC 驱动的问题。

   按照如下方式处理：

   1. 升级 MySQL JDBC 驱动到 8.0.31 及以上版本
   2. 在 FE 和 BE conf 文件的 JAVA_OPTS 中增加 `-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true` 参数，禁用 MySQL JDBC 驱动的连接清理功能，并重启集群

   **注意：** 如果 Doris 的版本在 2.0.13 及以上（2.0 Release），或 2.1.5 及以上（2.1 Release）则无需增加该参数，因为 Doris 已经默认禁用了 MySQL JDBC 驱动的连接清理功能。只需更换 MySQL JDBC 驱动版本即可。但是需要重启 Doris 集群来清理掉之前的 Threads。
