---
{
  "title": "JDBC Catalog",
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

Doris JDBC Catalog 支持通过标准 JDBC 接口连接不同支持 JDBC 协议的数据库。本文档介绍 JDBC Catalog 的通用配置和使用方法。

## 支持的数据库

Doris JDBC Catalog 支持连接以下数据库：

| 数据库                           | 说明  |
|-------------------------------|-----|
| [MySQL](./mysql.md)           |     |
| [PostgreSQL](./postgresql.md) |     |
| [Oracle](./oracle.md)         |     |
| [SQL Server](./sqlserver.md)  |     |
| [ClickHouse](./clickhouse.md) |     |
| [SAP HANA](./sap-hana.md)     |     |
| [OceanBase](./oceanbase.md)   |     |

## 配置

### 基本属性

| 参数             | 说明                |
|----------------|-------------------|
| `type`         | 固定为 `jdbc`        |
| `user`         | 数据源用户名            |
| `password`     | 数据源密码             |
| `jdbc_url`     | 数据源连接 URL         |
| `driver_url`   | 数据源 JDBC 驱动程序的路径  |
| `driver_class` | 数据源 JDBC 驱动程序的类名  |

### 可选属性

| 参数                        | 默认值     | 说明                                               |
|---------------------------|---------|-------------------------------------------------------|
| `lower_case_table_names`  | "false" | 是否以小写的形式同步 jdbc 外部数据源的库名和表名     |
| `only_specified_database` | "false" | 是否只同步 JDBC URL 中指定的数据源的 Database（此处的 Database 为映射到 Doris 的 Database 层级）           |
| `include_database_list`   | ""      | 当 `only_specified_database=true` 时，指定同步多个 Database，以','分隔。Database 名称是大小写敏感的。     |
| `exclude_database_list`   | ""      | 当 `only_specified_database=true` 时，指定不需要同步的多个 Database，以','分割。Database 名称是大小写敏感的。 |

### 连接池属性

| 参数                              | 默认值     | 说明                       |
|---------------------------------|---------|-------------------------------|
| `connection_pool_min_size`      | 1       | 定义连接池的最小连接数，用于初始化连接池并保证在启用保活机制时至少有该数量的连接处于活跃状态。   |
| `connection_pool_max_size`      | 30      | 定义连接池的最大连接数，每个 Catalog 对应的每个 FE 或 BE 节点最多可持有此数量的连接。       |
| `connection_pool_max_wait_time` | 5000    | 如果连接池中没有可用连接，定义客户端等待连接的最大毫秒数。                                |
| `connection_pool_max_life_time` | 1800000 | 设置连接在连接池中保持活跃的最大时长（毫秒）。超时的连接将被回收。同时，此值的一半将作为连接池的最小逐出空闲时间，达到该时间的连接将成为逐出候选对象。 |
| `connection_pool_keep_alive`    | false   | 仅在 BE 节点上有效，用于决定是否保持达到最小逐出空闲时间但未到最大生命周期的连接活跃。默认关闭，以减少不必要的资源使用。  |

## 属性须知

### 驱动包路径与安全性

`driver_url` 可以通过以下三种方式指定：

1. 文件名。如 `mysql-connector-j-8.3.0.jar`。需将 Jar 包预先存放在 FE 和 BE 部署目录下的 `jdbc_drivers/`
   目录下。系统会自动在这个目录下寻找。该目录的位置，也可以由 fe.conf 和 be.conf 中的 `jdbc_drivers_dir` 配置修改。

2. 本地绝对路径。如 `file:///path/to/mysql-connector-j-8.3.0.jar`。需将 Jar 包预先存放在所有 FE/BE 节点指定的路径下。

3. Http 地址。如：http://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar 系统会从这个 Http 地址下载 Driver 文件。仅支持无认证的 Http 服务。

**驱动包安全性**

为了防止在创建 Catalog 时使用了未允许路径的 Driver Jar 包，Doris 会对 Jar 包进行路径管理和校验和检查。

1. 针对上述方式 1，Doris 默认用户配置的 `jdbc_drivers_dir` 和其目录下的所有 Jar 包都是安全的，不会对其进行路径检查。

2. 针对上述方式 2、3，Doris 会对 Jar 包的来源进行检查，检查规则如下：

    * 通过 FE 配置项 `jdbc_driver_secure_path` 来控制允许的驱动包路径，该配置项可配置多个路径，以分号分隔。当配置了该项时，Doris
      会检查 Catalog properties 中 driver_url 的路径是的部分前缀是否在 `jdbc_driver_secure_path` 中，如果不在其中，则会拒绝创建
      Catalog。
    * 此参数默认为 `*` ，表示允许所有路径的 Jar 包。
    * 如果配置 `jdbc_driver_secure_path` 为空，也表示允许所有路径的 Jar 包。

   :::info 备注
   如配置 `jdbc_driver_secure_path = "file:///path/to/jdbc_drivers;http://path/to/jdbc_drivers"` ：

   则只允许以 `file:///path/to/jdbc_drivers` 或 `http://path/to/jdbc_drivers` 开头的驱动包路径。
   :::

3. 在创建 Catalog 时，可以通过 `checksum` 参数来指定驱动包的校验和，Doris 会在加载驱动包后，对驱动包进行校验，如果校验失败，则会拒绝创建
   Catalog。

:::info 备注
上述的校验只会在创建 Catalog 时进行，对于已经创建的 Catalog，不会再次进行校验。
:::

### 小写名称同步

当 `lower_case_table_names` 设置为 `true` 时，Doris 通过维护小写名称到远程系统中实际名称的映射，能够查询非小写的数据库和表

**注意：**

1. 在 Doris 2.0.3 之前的版本，仅对 Oracle 数据库有效，在查询时，会将所有的库名和表名转换为大写，再去查询 Oracle，例如：

   Oracle 在 TEST 空间下有 TEST 表，Doris 创建 Catalog 时设置 `lower_case_table_names` 为 `true`，则 Doris 可以通过 `select * from oracle_catalog.test.test` 查询到 TEST 表，Doris 会自动将 test.test 格式化成 TEST.TEST 下发到 Oracle，需要注意的是这是个默认行为，也意味着不能查询 Oracle 中小写的表名。

   对于其他数据库，仍需要在查询时指定真实的库名和表名。

2. 在 Doris 2.0.3 及之后的 2.0.x 版本，对所有的数据库都有效，在查询时，会将所有的库名和表名转换为真实的名称，再去查询，如果是从老版本升级到 2.0.3，需要 `Refresh <catalog_name>` 才能生效。

   但是，如果数据库或者表名只有大小写不同，例如 `Doris` 和 `doris`，则 Doris 由于歧义而无法查询它们。

3. 当 FE 参数的 `lower_case_table_names` 设置为 `1` 或 `2` 时，JDBC Catalog 的 `lower_case_table_names` 参数必须设置为 `true`。如果 FE 参数的 `lower_case_table_names` 设置为 `0`，则 JDBC Catalog 的参数可以为 `true` 或 `false`，默认为 `false`。这确保了 Doris 在处理内部和外部表配置时的一致性和可预测性。

### 指定同步数据库

`only_specified_database`:
是否只同步 JDBC URL 中指定的数据源的 Database。默认值为 `false`，表示同步 JDBC URL 中所有的 Database。

`include_database_list`:
仅在`only_specified_database=true`时生效，指定需要同步的 PostgreSQL 的 Schema，以','分隔。Schema 名称是大小写敏感的。

`exclude_database_list`:
仅在`only_specified_database=true`时生效，指定不需要同步的 PostgreSQL 的 Schema，以','分隔。Schema 名称是大小写敏感的。

:::info 备注
- 上述三个参数中提到的 Database 是指 Doris 中的 Database 层级，而不是外部数据源的 Database 层级，具体的映射关系可以参考各个数据源文档。
- 当 `include_database_list` 和 `exclude_database_list` 有重合的 database 配置时，`exclude_database_list`会优先生效。
:::

### 连接池配置

在 Doris 中，每个 FE 和 BE 节点都会维护一个连接池，这样可以避免频繁地打开和关闭单独的数据源连接。连接池中的每个连接都可以用来与数据源建立连接并执行查询。任务完成后，这些连接会被归还到池中以便重复使用，这不仅提高了性能，还减少了建立连接时的系统开销，并帮助防止达到数据源的连接数上限。

可以根据实际情况调整连接池的大小，以便更好地适应您的工作负载。通常情况下，连接池的最小连接数应该设置为 1，以确保在启用保活机制时至少有一个连接处于活跃状态。连接池的最大连接数应该设置为一个合理的值，以避免过多的连接占用资源。

同时为了避免在 BE 上累积过多的未使用的连接池缓存，可以通过设置 BE 的 `jdbc_connection_pool_cache_clear_time_sec` 参数来指定清理缓存的时间间隔。默认值为 28800 秒（8 小时），此间隔过后，BE 将强制清理所有超过该时间未使用的连接池缓存。

:::warning
使用 Doris JDBC Catalog 连接外部数据源时，需谨慎更新数据库凭证。
Doris 通过连接池维持活跃连接以快速响应查询。但凭证变更后，连接池可能会继续使用旧凭证尝试建立新连接并失败。由于系统试图保持一定数量的活跃连接，这种错误尝试会重复执行，且在某些数据库系统中，频繁的失败可能导致账户被锁定。
建议在必须更改凭证时，同步更新 Doris JDBC Catalog 配置，并重启 Doris 集群，以确保所有节点使用最新凭证，防止连接失败和潜在的账户锁定。

可能遇到的账户锁定如下：

MySQL: account is locked

Oracle: ORA-28000: the account is locked

SQL Server: Login is locked out
:::

### Insert 事务

Doris 的数据是由一组 batch 的方式写入 JDBC Catalog 的，如果中途导入中断，之前写入数据可能需要回滚。所以 JDBC Catalog 支持数据写入时的事务，事务的支持需要通过设置 session variable: `enable_odbc_transcation `。

```sql
set enable_odbc_transcation = true; 
```

事务保证了 JDBC Catalog 数据写入的原子性，但是一定程度上会降低数据写入的性能，可以考虑酌情开启该功能。

## 示例

此处以 MySQL 为例，展示如何创建一个 MySQL Catalog 并查询其中的数据。

创建一个名为 `mysql` 的 Catalog：

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

通过运行 SHOW DATABASES 查看此 Catalog 所有数据库：

```sql
SHOW DATABASES FROM mysql;
```

如果您有一个名为 test 的 MySQL 数据库，您可以通过运行 SHOW TABLES 查看该数据库中的表：

```sql
SHOW TABLES FROM mysql.test;
```

最后，您可以访问 MySQL 数据库中的表：

```sql
SELECT * FROM mysql.test.table;
```

## 连接池问题排查

1. 在小于 2.0.5 的版本，连接池相关配置只能在 BE conf 的 JAVA_OPTS 中配置，参考 2.0.4 版本的 [be.conf](https://github.com/apache/doris/blob/2.0.4-rc06/conf/be.conf#L22)。
2. 在 2.0.5 及之后的版本，连接池相关配置可以在 Catalog 属性中配置，参考 [连接池属性](#连接池属性)。
3. Doris 使用的连接池在 2.0.10（2.0 Release）和 2.1.3（2.1 Release）开始从 Druid 换为 HikariCP，故连接池相关报错以及原因排查方式有所不同，参考如下

### Druid 连接池版本
**Initialize datasource failed:  CAUSED BY: GetConnectionTimeoutException: wait millis 5006, active 10, maxActive 10, creating 1**
* 原因 1：查询太多导致连接个数超出配置
* 原因 2：连接池计数异常导致活跃计数未下降
* 解决方法
    * alter catalog <catalog_name> set properties ('connection_pool_max_size' = '100'); 暂时通过调整连接数来增大连接池容量，且可以通过这种方式刷新连接池缓存
    * 升级到更换连接池到 Hikari 版本

**Initialize datasource failed:  CAUSED BY: GetConnectionTimeoutException: wait millis 5006, active 10, maxActive 0, creating 1**
* 原因 1：网络不通
* 原因 2：网络延迟高，导致创建连接超过 5s
* 解决方法
    * 检查网络
    * alter catalog <catalog_name> set properties ('connection_pool_max_wait' = '10000'); 调大超时时间

### HikariCP 连接池版本

`Connection is not available, request timed out after 5000ms`

#### 可能的原因：
- **原因 1**：网络问题（例如，服务器不可达）
- **原因 2**：身份认证问题，例如无效的用户名或密码
- **原因 3**：网络延迟过高，导致创建连接超过 5 秒超时时间
- **原因 4**：并发查询过多，超过了连接池配置的最大连接数

#### 解决方案：
- **如果只有 "Connection is not available, request timed out after 5000ms" 这一类错误**，请检查 **原因 3** 和 **原因 4**：
    - 检查是否存在网络延迟过高或资源耗尽的情况。
    - 调大连接池的最大连接数：
      ```sql
      ALTER CATALOG <catalog_name> SET PROPERTIES ('connection_pool_max_size' = '100');
      ```
    - 调大连接超时时间：
      ```sql
      ALTER CATALOG <catalog_name> SET PROPERTIES ('connection_pool_max_wait_time' = '10000');
      ```

- **如果除了 "Connection is not available, request timed out after 5000ms" 之外还有其他错误信息**，请检查这些附加错误：
    - **网络问题**（例如，服务器不可达）可能导致连接失败。请检查网络连接是否正常。
    - **身份认证问题**（例如，用户名或密码无效）也可能导致连接失败。请检查配置中使用的数据库凭据，确保用户名和密码正确无误。
    - 根据具体错误信息，调查与网络、数据库或身份认证相关的问题，找出根本原因。
