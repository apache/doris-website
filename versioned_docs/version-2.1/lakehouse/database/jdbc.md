---
{
  "title": "JDBC Catalog",
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

Doris JDBC Catalog supports connecting to different databases that support the JDBC protocol through the standard JDBC interface. This document introduces the general configuration and usage of JDBC Catalog.

## Supported databases

Doris JDBC Catalog supports connecting to the following databases:

| Database                      | Description   |
|-------------------------------|---------------|
| [MySQL](./mysql.md)           |               |
| [PostgreSQL](./postgresql.md) |               |
| [Oracle](./oracle.md)         |               |
| [SQL Server](./sqlserver.md)  |               |
| [IBM Db2](./ibm-db2.md)       |               |
| [ClickHouse](./clickhouse.md) |               |
| [SAP HANA](./sap-hana.md)      |               |
| [OceanBase](./oceanbase.md)   |               |

## Configuration

### Basic properties

| Parameters      | Description                                   |
|-----------------|-----------------------------------------------|
| `type`          | Fixed to `jdbc`                               |
| `user`          | Data source user name                         |
| `password`      | Data source password                          |
| `jdbc_url`      | Data source connection URL                    |
| `driver_url`    | Path to the data source JDBC driver           |
| `driver_class`  | The class name of the data source JDBC driver |

### Optional properties

| Parameters                | Default value  | Description                                                                                                                                                                                                                                                      |
|---------------------------|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `lower_case_meta_names`   | "false"        | Whether to synchronize the library name, table name and column name of the external data source in lowercase                                                                                                                                                     |
| `meta_names_mapping`      | ""             | When the external data source has the same name but different case, such as DORIS and doris, Doris reports an error when querying the Catalog due to ambiguity. In this case, the `meta_names_mapping` parameter needs to be configured to resolve the conflict. |
| `only_specified_database` | "false"        | Whether to synchronize only the Database of the data source specified in the JDBC URL (Database here is the Database level mapped to Doris)                                                                                                                      |
| `include_database_list`   | ""             | When `only_specified_database=true`, specify to synchronize multiple Databases, separated by ','. Database names are case-sensitive.                                                                                                                             |
| `exclude_database_list`   | ""             | When `only_specified_database=true`, specify multiple Databases that do not need to be synchronized, separated by ','. Database names are case-sensitive.                                                                                                        |

### Connection pool properties

| Parameter                       | Default value  | Description                                                                                                                                                                                                                                                                                                             |
|---------------------------------|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `connection_pool_min_size`      | 1              | Defines the minimum number of connections in the connection pool, which is used to initialize the connection pool and ensure that at least this number of connections are active when the keep-alive mechanism is enabled.                                                                                              |
| `connection_pool_max_size`      | 30             | Defines the maximum number of connections in the connection pool. Each FE or BE node corresponding to each Catalog can hold up to this number of connections.                                                                                                                                                           |
| `connection_pool_max_wait_time` | 5000           | Defines the maximum number of milliseconds the client will wait for a connection if there is no available connection in the connection pool.                                                                                                                                                                            |
| `connection_pool_max_life_time` | 1800000        | Set the maximum time (in milliseconds) that a connection remains active in the connection pool. Timed out connections will be recycled. At the same time, half of this value will serve as the minimum eviction idle time of the connection pool, and connections that reach this time will become eviction candidates. |
| `connection_pool_keep_alive`    | false          | Only valid on BE nodes, used to decide whether to keep connections that have reached the minimum eviction idle time but have not reached the maximum lifetime active. Turned off by default to reduce unnecessary resource usage.                                                                                       |

## Property Notes

### Driver package path and security

`driver_url` can be specified in the following three ways:

1. File name. Such as `mysql-connector-j-8.3.0.jar`. The Jar package needs to be pre-stored in `jdbc_drivers/` under the FE and BE deployment directories.
   Under contents. The system will automatically search in this directory. The location of this directory can also be modified by the `jdbc_drivers_dir` configuration in fe.conf and be.conf.

2. Local absolute path. Such as `file:///path/to/mysql-connector-j-8.3.0.jar`. Jar packages need to be stored in the paths specified by all FE/BE nodes in advance.

3. HTTP address. For example: http://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar The system will download the Driver file from this Http address. Only HTTP services without authentication are supported.

**Driver package security**

In order to prevent the use of a Driver Jar package with an unallowed path when creating the Catalog, Doris will perform path management and checksum checking on the Jar package.

1. For the above method 1, the `jdbc_drivers_dir` configured by the Doris default user and all Jar packages in its directory are safe and will not be path checked.

2. For the above methods 2 and 3, Doris will check the source of the Jar package. The checking rules are as follows:

    * Control the allowed driver package paths through the FE configuration item `jdbc_driver_secure_path`. This configuration item can configure multiple paths, separated by semicolons. When this option is configured, Doris
      It will check whether the partial prefix of the path of driver_url in Catalog properties is in `jdbc_driver_secure_path`. If it is not in it, the creation will be refused.
      Catalog.
    * This parameter defaults to `*`, which means Jar packages of all paths are allowed.
    * If the configuration `jdbc_driver_secure_path` is empty, it also means that Jar packages of all paths are allowed.

   :::info remarks
   For example, configure `jdbc_driver_secure_path = "file:///path/to/jdbc_drivers;http://path/to/jdbc_drivers"`:

   Then only driver package paths starting with `file:///path/to/jdbc_drivers` or `http://path/to/jdbc_drivers` are allowed.
   :::

3. When creating a Catalog, you can specify the checksum of the driver package through the `checksum` parameter. Doris will verify the driver package after loading the driver package. If the verification fails, the creation will be rejected.
   Catalog.

:::info remarks
The above verification will only be performed when the catalog is created, and the already created catalog will not be verified again.
:::

### Lowercase name synchronization

When `lower_case_meta_names` is set to `true`, Doris maintains the mapping of lowercase names to actual names in the remote system, enabling queries to use lowercase to query non-lowercase databases, tables and columns of external data sources.

Since FE has the `lower_case_table_names` parameter, it will affect the table name case rules during query, so the rules are as follows

- **lower_case_meta_names = true**

  Library table column names will be converted to lowercase.

- **lower_case_meta_names = false**

  When the `lower_case_table_names` parameter of FE is `0` or `2`, the library names, table names and column names will not be converted.

  When the `lower_case_table_names` parameter of FE is `1`, table names will be converted to lowercase, and library names and column names will not be converted.

If the parameter configuration when creating the Catalog matches the lowercase conversion rule in the above rules, Doris will convert the corresponding name to lowercase and store it in Doris. You need to use
Doris displays the lowercase name to query.

If the external data source has the same name but different case, such as DORIS and doris, Doris will query the Catalog due to ambiguity.
An error is reported. At this time, the `meta_names_mapping` parameter needs to be configured to resolve the conflict.

The `meta_names_mapping` parameter accepts a Json format string with the following format:

```json
{
  "databases": [
    {
      "remoteDatabase": "DORIS",
      "mapping": "doris_1"
    },
    {
      "remoteDatabase": "doris",
      "mapping": "doris_2"
    }
  ],
  "tables": [
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "DORIS",
      "mapping": "doris_1"
    },
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "doris",
      "mapping": "doris_2"
    }
  ],
  "columns": [
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "DORIS",
      "remoteColumn": "DORIS",
      "mapping": "doris_1"
    },
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "DORIS",
      "remoteColumn": "doris",
      "mapping": "doris_2"
    }
  ]
}
```

When filling this configuration into the statement that creates the Catalog, there are double quotes in Json, so you need to escape the double quotes or directly use single quotes to wrap the Json string when filling in.

### Specify synchronization database

`only_specified_database`:
Whether to synchronize only the Database of the data source specified in the JDBC URL. The default value is `false`, which means synchronizing all Databases in the JDBC URL.

`include_database_list`:
Only effective when `only_specified_database=true`, specify the Schema of PostgreSQL that needs to be synchronized, separated by ','. Schema names are case-sensitive.

`exclude_database_list`:
Only effective when `only_specified_database=true`, specify the Schema of PostgreSQL that does not need to be synchronized, separated by ','. Schema names are case-sensitive.

:::info remarks
- The Database mentioned in the above three parameters refers to the Database level in Doris, not the Database level of external data sources. For specific mapping relationships, please refer to each data source document.
- When `include_database_list` and `exclude_database_list` have overlapping database configurations, `exclude_database_list` will take effect first.
:::

### Connection pool configuration

In Doris, each FE and BE node maintains a connection pool, which avoids frequently opening and closing separate data source connections. Each connection in the connection pool can be used to establish a connection with the data source and execute queries. When the task is completed, these connections are returned to the pool for reuse, which not only improves performance, but also reduces the overhead of establishing connections and helps prevent the data source's connection limit from being reached.

The connection pool size can be adjusted to better suit your workload. Typically, the minimum number of connections in a connection pool should be set to 1 to ensure that at least one connection is active when the keepalive mechanism is enabled. The maximum number of connections in the connection pool should be set to a reasonable value to avoid too many connections occupying resources.

At the same time, in order to avoid accumulating too many unused connection pool caches on BE, you can specify the time interval for clearing the cache by setting the `jdbc_connection_pool_cache_clear_time_sec` parameter of BE. The default value is 28800 seconds (8 hours). After this interval, BE will forcefully clear all connection pool caches that have not been used for more than this time.

:::warning
When using Doris JDBC Catalog to connect to external data sources, you need to be careful when updating database credentials.
Doris maintains active connections through a connection pool to respond to queries quickly. However, after the credentials are changed, the connection pool may continue to use the old credentials to try to establish new connections and fail. Such erroneous attempts are repeated as the system attempts to maintain a certain number of active connections, and in some database systems, frequent failures may result in account lockout.
It is recommended that when credentials must be changed, the Doris JDBC Catalog configuration is updated synchronously and the Doris cluster is restarted to ensure that all nodes use the latest credentials to prevent connection failures and potential account lockouts.

Account lockouts you may encounter are as follows:

MySQL: account is locked

Oracle: ORA-28000: the account is locked

SQL Server: Login is locked out
:::

### Insert transaction

Doris' data is written to the JDBC Catalog in a batch manner. If the import is interrupted midway, the previously written data may need to be rolled back. Therefore, JDBC Catalog supports transactions when data is written. Transaction support needs to be set by setting session variable: `enable_odbc_transcation`.

```sql
set enable_odbc_transcation = true;
```

Transactions ensure the atomicity of JDBC Catalog data writing, but will reduce the performance of data writing to a certain extent. You can consider turning on this function as appropriate.

## Example

Here, MySQL is used as an example to show how to create a MySQL Catalog and query the data in it.

Create a Catalog named `mysql`:

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

View all databases in this catalog by running SHOW DATABASES:

```sql
SHOW DATABASES FROM mysql;
```

If you have a MySQL database named test, you can view the tables in that database by running SHOW TABLES:

```sql
SHOW TABLES FROM mysql.test;
```

Finally, you can access the table in the MySQL database:

```sql
SELECT * FROM mysql.test.table;
```

## Statement transparent transmission

Doris supports direct execution of DDL, DML statements and query statements of JDBC data sources through transparent transmission.

### Transparent transmission of DDL and DML

```
CALL EXECUTE_STMT("catalog_name", "raw_stmt_string");
```

The `EXECUTE_STMT()` procedure takes two parameters:

- Catalog Name: Currently only JDBC type Catalog is supported.
- Execution statements: Currently only DDL and DML statements are supported, and the syntax corresponding to the data source needs to be used directly.

```
CALL EXECUTE_STMT("jdbc_catalog", "insert into db1.tbl1 values(1,2), (3, 4)");

CALL EXECUTE_STMT("jdbc_catalog", "delete from db1.tbl1 where k1 = 2");

CALL EXECUTE_STMT("jdbc_catalog", "create table dbl1.tbl2 (k1 int)");
```

### Transparent query

```sql
query(
  "catalog" = "catalog_name",
  "query" = "select * from db_name.table_name where condition"
  );
```

The `query` table function takes two parameters:

- `catalog`: Catalog name, which needs to be filled in according to the name of the Catalog.
- `query`: The query statement that needs to be executed, and the syntax corresponding to the data source needs to be used directly.

```sql
select * from query("catalog" = "jdbc_catalog", "query" = "select * from db_name.table_name where condition");
```

### Principles and Limitations

Through the `CALL EXECUTE_STMT()` command, Doris will directly send the SQL statement written by the user to the JDBC data source corresponding to the Catalog for execution. Therefore, this operation has the following limitations:

- The SQL statement must be the syntax corresponding to the data source. Doris will not perform syntax and semantic checks.
- It is recommended that the table name referenced in the SQL statement be a fully qualified name, that is, in the format of `db.tbl`. If db is not specified, the db name specified in the JDBC URL of the JDBC Catalog is used.
- SQL statements cannot reference library tables other than JDBC data sources, nor can they reference Doris library tables. However, you can reference library tables in the JDBC data source but not synchronized to the Doris JDBC Catalog.
- When executing a DML statement, the number of rows inserted, updated, or deleted cannot be obtained, but only whether the command was successfully executed.
- Only users with LOAD permissions on the Catalog can execute the `CALL EXECUTE_STMT()` command.
- Only users with SELECT permissions on Catalog can execute the `query()` table function.
- The supported data types of the data read by the `query` table function are consistent with the data types supported by the queried catalog type.

## Troubleshooting connection pool issues

1. In versions less than 2.0.5, the connection pool related configuration can only be configured in JAVA_OPTS of BE conf, refer to version 2.0.4 [be.conf](https://github.com/apache/doris/blob/ 2.0.4-rc06/conf/be.conf#L22).
2. In versions 2.0.5 and later, connection pool related configurations can be configured in the Catalog properties, refer to [Connection Pool Properties](#Connection Pool Properties).
3. The connection pool used by Doris was changed from Druid to HikariCP starting from 2.0.10 (2.0 Release) and 2.1.3 (2.1 Release), so the connection pool related errors and troubleshooting methods are different, refer to the following

### Druid connection pool version
**Initialize datasource failed: CAUSED BY: GetConnectionTimeoutException: wait millis 5006, active 10, maxActive 10, creating 1**
* Reason 1: Too many queries cause the number of connections to exceed the configuration
* Reason 2: The connection pool count is abnormal and the active count does not decrease.
* Solution
    * alter catalog <catalog_name> set properties ('connection_pool_max_size' = '100'); Temporarily increase the connection pool capacity by adjusting the number of connections, and the connection pool cache can be refreshed in this way
    * Upgrade to replace the connection pool to Hikari version

**Initialize datasource failed: CAUSED BY: GetConnectionTimeoutException: wait millis 5006, active 10, maxActive 0, creating 1**
* Reason 1: Network failure
* Reason 2: The network delay is high, causing the connection creation to take more than 5s
* Solution
    * Check network
    * alter catalog <catalog_name> set properties ('connection_pool_max_wait' = '10000'); Increase the timeout

### HikariCP connection pool version

`Connection is not available, request timed out after 5000ms`

#### Possible reasons:
- **Cause 1**: Network problem (e.g. server unreachable)
- **Cause 2**: Authentication issues, such as invalid username or password
- **Cause 3**: The network latency is too high, causing the connection creation to exceed the 5 second timeout
- **Cause 4**: Too many concurrent queries, exceeding the maximum number of connections configured in the connection pool

#### Solution:
- **If there are only "Connection is not available, request timed out after 5000ms" errors**, please check **Cause 3** and **Cause 4**:
    - Check for high network latency or resource exhaustion.
    - Increase the maximum number of connections in the connection pool:
      ```sql
      ALTER CATALOG <catalog_name> SET PROPERTIES ('connection_pool_max_size' = '100');
      ```
    - Increase the connection timeout:
      ```sql
      ALTER CATALOG <catalog_name> SET PROPERTIES ('connection_pool_max_wait_time' = '10000');
      ```

- **If there are other error messages besides "Connection is not available, request timed out after 5000ms"**, please check these additional errors:
    - **Network problems** (e.g. server unreachable) may cause connection failure. Please check whether the network connection is normal.
    - **Authentication issues** (e.g. invalid username or password) may also cause connection failure. Please check the database credentials used in the configuration to ensure that the username and password are correct.
    - Based on specific error messages, investigate network, database, or authentication-related issues to identify the root cause.
