---
{
    "title": "JDBC Catalog",
    "language": "zh-CN",
    "description": "JDBC Catalog 支持通过标准 JDBC 接口连接支持 JDBC 协议的数据库。"
}
---

JDBC Catalog 支持通过标准 JDBC 接口连接支持 JDBC 协议的数据库。

本文档介绍 JDBC Catalog 的通用配置和使用方法。不同的 JDBC 源请参阅对应的文档。

:::info 备注
Doris 的 JDBC Catalog 功能依赖 Java 层读取和处理数据，整体性能在一定程度上会受到 JDK 版本的影响，比如一些内部库的实现在老版本 JDK（如 JDK 8）中效率较低，可能会导致资源消耗偏高。如果对性能有更高要求，推荐使用 Doris 3.0 版本，由于默认使用 JDK 17 编译，整体性能更优。
:::

## 适用场景

JDBC Catalog 仅适用于数据集成，如将少量数据从数据源导入到 Doris 中，或对 JDBC 数据源中的小表进行关联查询。JDBC Catalog 无法对数据源进行查询加速，或一次性访问大量数据。

## 支持的数据库

Doris JDBC Catalog 支持连接以下数据库：

| 支持的数据源                                      |
|---------------------------------------------|
| [ MySQL](./jdbc-mysql-catalog.md)           |
| [ PostgreSQL](./jdbc-mysql-catalog.md)      |
| [ Oracle](./jdbc-mysql-catalog.md)          |
| [ SQL Server](./jdbc-mysql-catalog.md)      |
| [ IBM DB2](./jdbc-mysql-catalog.md)         |
| [ ClickHouse](./jdbc-clickhouse-catalog.md) |
| [ SAP HANA](./jdbc-saphana-catalog)         |
| [ Oceanbase](./jdbc-oceanbase-catalog.md)   |

可参考 [开发者手册](https://doris.apache.org/zh-CN/community/how-to-contribute/jdbc-catalog-developer-guide) 开发新的未支持的 JDBC 数据源。

## 配置 Catalog

### 语法

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' =='jdbc', -- required
    {JdbcProperties},
    {CommonProperties}
);
```

* {JdbcProperties}

  * 必须属性

      | 参数名称          | 说明                                | 示例                     |
      | ------------- | --------------------------------- | ---------------------- |
      | `user`          | 数据源用户名                            |                        |
      | `password`      | 数据源密码                             |                        |
      | `jdbc_url`     | 数据源连接 URL                         | `jdbc:mysql://host:3306` |
      | `driver_url`   | 数据源 JDBC 驱动程序文件的路径。关于驱动包安全性，详见附录。 | 驱动程序支持三种方式，详见下面说明。           |
      | `driver_class` | 数据源 JDBC 驱动程序的类名                  |                        |

      `driver_url` 支持以下三种指定方式：
      
      1. 文件名。如 `mysql-connector-j-8.3.0.jar`。需将 Jar 包预先存放在 FE 和 BE 部署目录下的 `jdbc_drivers/` 目录下。系统会自动在这个目录下寻找。该目录的位置，也可以由 `fe.conf` 和 `be.conf` 中的 `jdbc_drivers_dir` 配置修改。
      
      2. 本地绝对路径。如 `file:///path/to/mysql-connector-j-8.3.0.jar`。需将 Jar 包预先存放在所有 FE/BE 节点指定的路径下。
      
      3. Http 地址。如：`http://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar` 系统会从这个 Http 地址下载 Driver 文件。仅支持无认证的 Http 服务。  


  * 可选属性

      | 参数名称                              | 默认值     | 说明                                                                                                                |
      | --------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
      | `lower_case_meta_names`          | false   | 是否以小写的形式同步外部数据源的库名和表名以及列名                                                                                         |
      | `meta_names_mapping`              |         | 当外部数据源存在名称相同只有大小写不同的情况，例如 `MY_TABLE` 和 `my_table`，Doris 由于歧义而在查询 Catalog 时报错，此时需要配置 `meta_names_mapping` 参数来解决冲突。 |
      | `only_specified_database`         | false   | 是否只同步 `jdbc_url` 中指定的数据源的 Database（此处的 Database 为映射到 Doris 的 Database 层级）                                         |
      | `connection_pool_min_size`       | 1       | 定义连接池的最小连接数，用于初始化连接池并保证在启用保活机制时至少有该数量的连接处于活跃状态。                                                                   |
      | `connection_pool_max_size`       | 30      | 定义连接池的最大连接数，每个 Catalog 对应的每个 FE 或 BE 节点最多可持有此数量的连接。                                                               |
      | `connection_pool_max_wait_time` | 5000    | 如果连接池中没有可用连接，定义客户端等待连接的最大毫秒数。                                                                                     |
      | `connection_pool_max_life_time` | 1800000 | 设置连接在连接池中保持活跃的最大时长（毫秒）。超时的连接将被回收。同时，此值的一半将作为连接池的最小逐出空闲时间，达到该时间的连接将成为逐出候选对象。                    |
      | `connection_pool_keep_alive`     | false   | 仅在 BE 节点上有效，用于决定是否保持达到最小逐出空闲时间但未到最大生命周期的连接活跃。默认关闭，以减少不必要的资源使用。                                                    |
    
* `[CommonProperties]`

  CommonProperties 部分用于填写通用属性。请参阅[ 数据目录概述 ](../catalog-overview.md)中【通用属性】部分。

## 查询操作

### 基础查询

```sql
-- 1. switch to catalog, use database and query
SWITCH mysql_ctl;
USE mysql_db;
SELECT * FROM mysql_tbl LIMIT 10;

-- 2. use mysql database directly
USE mysql_ctl.mysql_db;
SELECT * FROM mysql_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM mysql_ctl.mysql_db.mysql_tbl LIMIT 10;
```

### 查询优化

#### 谓词下推

JDBC Catalog 访问数据源，本质上是选择一台 BE 节点，通过 JDBC Client 将生成好的 SQL 发送给源端并获取数据，因此性能仅取决于生成的 SQL 在源端的执行效率。Doris 会尽量将谓词条件下推并拼接到生成的 SQL 中。可以通过 `EXPLAIN SQL`查看到生成的 SQL 语句。

```sql
EXPLAIN SELECT smallint_u, sum(int_u)
FROM all_types WHERE smallint_u > 10 GROUP BY smallint_u;

...
|   0:VJdbcScanNode(206)                                                                             |
|      TABLE: `doris_test`.`all_types`                                                               |
|      QUERY: SELECT `smallint_u`, `int_u` FROM `doris_test`.`all_types` WHERE ((`smallint_u` > 10)) |
|      PREDICATES: (smallint_u[#1] > 10)                                                             |
|      final projections: smallint_u[#1], int_u[#3]                                                  |
|      final project output tuple id: 1   
...                                                           |
```

#### 函数下推

对于谓词条件，Doris 和外部数据源中的语义或行为可能是不一致的。所以 Doris 通过以下参数变量对 JDBC 外表查询中的谓词条件下推进行限制和控制：

> 注：目前 Doris 只支持对 MySQL、Clickhouse、Oracle 三个数据源进行谓词下推。后续将开放更多数据源。

- `enable_jdbc_oracle_null_predicate_push_down`

    会话变量。默认为 `false`。即当谓词条件中包含 `NULL` 值时，该谓词条件不会下推给 Oracle 数据源。因为在 Oracle 21 版本之前，Oracle 不支持 `NULL` 作为操作符。

    该参数自 2.1.7 和 3.0.3 支持。

- `enable_jdbc_cast_predicate_push_down`

    会话变量。默认为 `false`。即当谓词条件中存在显式或隐式 CAST 时，该谓词条件不会下推给 JDBC 数据源。因为 CAST 的行为在不同数据库中不一致，为确保结果正确性，默认不下推 CAST。但用户可以手动验证 CAST 的行为是否一致，如果一致，可以将此参数设置为 `true`，让更多的谓词下推已获得更好的性能。

    该参数自 2.1.7 和 3.0.3 支持。

- 函数下推黑白名单

    签名相同的函数，在 Doris 和外部数据源中的语义可能是不一致的。Doris 中预定义了一些函数下推的黑白名单：

    | 数据源        | 黑名单 | 白名单 | 说 明     |
    | ---------- | ----- | --- | --------- |
    | MySQL      | - `DATE_TRUNC`<br>- `MONEY_FORMAT`<br>- `NEGTIVE`  |  | MySQL 还可以通过 FE 配置项 `jdbc_mysql_unsupported_pushdown_functions` 来设置额外的黑名单，如：`jdbc_mysql_unsupported_pushdown_functions==func1,func2` |
    | Clickhouse | | - `FROM_UNIXTIME`<br>- `UNIX_TIMESTAMP` |       |
    | Oracle     |  | - `NVL`<br>- `IFNULL`   |          |

- 函数改写规则

    Doris 和外部数据源中存在一些行为一致但名称不一样函数。Doris 支持在函数下推时对这些函数进行改写。目前内置了以下改写规则：

    | 数据源        | Doris 函数 | 目的端函数 |
    | ---------- | ----- | --- |
    | MySQL | nvl | ifnull |
    | MySQL | to_date | date |
    | Clickhouse | from_unixtime | FROM_UNIXTIME |
    | Clickhouse | unix_timestamp | toUnixTimestamp |
    | Oracle | ifnull | nvl |

- 自定义函数下推和改写规则

   3.0.7 后续版本中，Doris 支持了更加灵活的函数下推和改写规则，用户可以在 Catalog 属性中设置针对某个 Catalog 的函数下推和改写规则：

    ```sql
    create catalog jdbc properties (
    ...
    'function_rules' = '{"pushdown" : {"supported": ["to_date"], "unsupported" : ["abs"]}, "rewrite" : {"to_date" : "date2"}}'
    )
    ```

    通过 `function_rules` 可以指定以下规则：

    - `pushdown`

        指定函数下推规则，其中 `supported` 和 `unsupported` 数组中分别指定可以下推和不能下推的函数名称。如果同时存在于两个数组中，以 `supported` 优先。

        Doris 会先应用上述系统中预定义的黑白名单，再应用用户指定的黑白名单。

    - `rewrite`

        定义函数改写规则，如上述示例中，会将 `to_date` 函数名称改写为 `date2` 并下推。

        注意，只会改写允许下推的函数。

#### 行数限制

如果在查询中带有 limit 关键字，Doris 会将 limit 下推到数据源，以减少数据传输量。可以通过 `EXPLAIN` 语句查看生成的 SQL 中是否包含 `LIMIT` 子句确认。

## 写入操作

Doris 支持将数据通过 JDBC 协议写回到对应的数据源。

```sql
INSERT INTO mysql_table SELECT * FROM internal.doris_db.doris_tbl;
```

## 语句透传

### 适用场景

Doris 支持通过透传的方式，直接在 JDBC 数据源中执行对应的 DDL、DML 语句和查询语句。该功能适用于以下场景：

* 提升复杂查询性能

  默认情况下，Doris 查询优化器会对原始 SQL 进行解析，根据一定规则生成需要发送给数据源的 SQL。这个 SQL 通常是单表简单查询，无法生成聚合、关联查询等算子。比如如下查询：

  ```sql
  SELECT smallint_u, sum(int_u)
  FROM all_types WHERE smallint_u > 10 GROUP BY smallint_u;
  ```

  最终生成的 SQL 为：

  ```sql
  SELECT smallint_u, int_u 
  FROM all_types
  WHERE smallint_u > 10;
  ```

  而聚合操作是在 Doris 中完成的。因此在某些情况下，可能需要从源端通过网络读取大量数据，导致查询效率低下。通过语句透传，可以将原始 SQL 直接透传给数据源，从而使用数据源本身的计算功能完成 SQL 执行，提升查询性能。

* 统一管理

  除了查询 SQL 外，语句透传功能也可以透传 DDL 和 DML 语句。因此，可以通过 Doris 直接对源端数据进行库表操作，如创建、删除表，修改表结构等。

### 透传 SQL

```sql
SELECT * FROM
QUERY(
  'catalog' = 'mysql_catalog', 
  'query' = 'SELECT smallint_u, sum(int_u) FROM db.all_types WHERE smallint_u > 10 GROUP BY smallint_u;'
);
```

`QUERY` 表函数有两个参数：

* `catalog`：Catalog 名称，需要按照 Catalog 的名称填写。

* `query`：需要执行的查询语句，并且需要直接使用数据源对应的语法。

### 透传 DDL 和 DML

```sql
CALL EXECUTE_STMT("jdbc_catalog", "insert into db1.tbl1 values(1,2), (3, 4)");

CALL EXECUTE_STMT("jdbc_catalog", "delete from db1.tbl1 where k1 = 2");

CALL EXECUTE_STMT("jdbc_catalog", "create table dbl1.tbl2 (k1 int)");
```

`EXECUTE_STMT()` 函数有两个参数：

* 第一个参数：Catalog 名称，目前仅支持 JDBC 类型 Catalog。

* 第二个参数：执行语句，目前仅支持 DDL 和 DML 语句，并且需要直接使用数据源对应的语法。

### 使用限制

通过 `CALL EXECUTE_STMT()` 命令，Doris 会直接将用户编写的 SQL 语句发送给 Catalog 对应的 JDBC 数据源进行执行。因此，这个操作有如下限制：

* SQL 语句必须是数据源对应的语法，Doris 不会做语法和语义检查。

* SQL 语句中引用的表名建议是全限定名，即 `db.tbl` 这种格式。如果未指定 db，则会使用 JDBC Catalog 的 JDBC URL 中指定的 db 名称。

* SQL 语句中不可引用 JDBC 数据源之外的库表，也不可以引用 Doris 的库表。但可以引用在 JDBC 数据源内的，但是没有同步到 Doris JDBC Catalog 的库表。

* 执行 DML 语句，无法获取插入、更新或删除的行数，只能获取命令是否执行成功。

* 只有对 Catalog 有 LOAD 权限的用户，才能执行`CALL EXECUTE_STMT()`命令。

* 只有对 Catalog 有 SELECT 权限的用户，才能执行 `query()` 表函数。

* 创建 Catalog 时使用的 JDBC 用户，需要在源端，对所执行的语句有相应的权限。

* `query()` 表函数读取到的的数据，数据类型的支持与所查询的 catalog 类型支持的数据类型一致。

## 附录

### 大小写敏感设置

默认情况下，Doris 的库名和表名是大小写敏感的，而列名是大小写不敏感的，并且可以通过参数配置就行修改。同时，一些 JDBC 数据源的库名、表名、列名的大小写敏感规则和 Doris 的规则不一致，这会导致在通过 JDBC Catalog 进行名称映射时，可能会出现名称冲突等问题。这里介绍下如何解决此类问题。

#### 显示名称与查询名称

在 Doris 中，一个对象名称（下面我们以表名称指代）可以分为【显示名称】和【使用名称】。比如对于表名，【显示名称】是指通过 `SHOW TABLES` 看到的名称。而【查询名称】是指通过可以在 `SELECT` 语句总使用的名称。

比如，一个表的真实名称是 `MyTable`。通过修改 FE 的配置项 `lower_case_table_names`，这个表名的【显示名称】和【查询名称】会有所区别：

| 配置项 | 说明 | 真实名称 | 显示名称 | 查询名称 |
| --- | --- | --- | --- | ---|
| `lower_case_table_names=0` | 默认配置。使用原始名称存储和显示，查询时大小写敏感 |  `MyTable` | `MyTable` | 查询时大小写敏感，必须使用：`MyTable` |
| `lower_case_table_names=1` | 使用小写名称存储和显示，查询时大小写不敏感 | `MyTable` | `mytable` | 查询时大小写不敏感，比如可以使用 `MyTable` 或 `mytable` |
| `lower_case_table_names=2`| 使用原始名称存储和显示，查询时大小写不敏感 | `MyTable` | `MyTable` | 查询时大小写不敏感，比如可以使用 `MyTable` 或 `mytable` |

#### JDBC Catalog 名称大小写规则

Doris 本身只可以配置【表名】大小写的规则。而 JDBC Catalog 需要额外处理【库名】和【列名】。因此，我们使用额外的 Catalog 属性 `lower_case_meta_names` 来配合 `lower_case_table_names` 一起使用。

| 配置项 | 说明 | 
| --- | --- | 
| `lower_case_meta_names` | 创建 Catalog 时通过 `properties` 指定，作用于该 Catalog。默认为 `false`。当设置为 `true` 时，Doris 会将库、表、列名全部转换为小写存储并显示，查询时需使用 Doris 中的小写名称。|
| `lower_case_table_names` | FE 配置项，在 fe.conf 中配置，作用范围为整个集群。默认为 `0`。|

> 注：若 `lower_case_meta_names = true`，则此时不会参考 `lower_case_table_names`，一律将库名、表名、列名都转换为小写。

根据 `lower_case_meta_names`（true/false）和 `lower_case_table_names`（0/1/2）的不同组合，库名、表名、列名在 **存储时** 和 **查询时** 的表现方式如下表所示（“原始”表示保持外部数据源的大小写，“小写”表示自动转换为小写，“任意大小写”表示查询时可随意使用大小写）：

| `lower_case_table_names` & `lower_case_meta_names` |  Database 显示名称 | Table 显示名称 | Column 显示名称 | Database 查询名称 | Table 查询名称 | Column 查询名称 |
| -------------------------------------------------- | --------------- | ------------ | ------------- | --------------- | ------------ | ------------- |
| `0 & false`     | 原始              | 原始           | 原始            | 原始              | 原始           | 任意大小写         |
| `0 & true`      | 小写              | 小写           | 小写            | 小写              | 小写           | 任意大小写         |
| `1 & false`      | 原始              | 小写           | 原始            | 原始              | 任意大小写        | 任意大小写         |
| `1 & true`      | 小写              | 小写           | 小写            | 小写              | 任意大小写        | 任意大小写         |
| `2 & false`     | 原始              | 原始           | 原始            | 原始              | 任意大小写        | 任意大小写         |
| `2 & true`      | 小写              | 小写           | 小写            | 小写              | 任意大小写        | 任意大小写         |

#### 大小写冲突检查

在通过 JDBC Catalog 进行名称映射时，可能会出现名称冲突。比如源端列名称大小写敏感，存在 `ID` 和 `id` 两列。如果设置了   `lower_case_meta_names = true`，则这两个列在映射成小写后会产生冲突。Doris 会根据以下规则进行冲突检查：

* 任意场景下，Doris 都会检查【列名】的大小写冲突（如 `id` 与 `ID` 是否同时存在）。

* 当 `lower_case_meta_names = true` 时，Doris 会检查库名、表名、列名是否存在大小写冲突（如 `DORIS` 与 `doris` 同时存在）。

* 当 `lower_case_meta_names = false` 且 `lower_case_table_names` 为 `1` 或 `2` 时，Doris 会检查【表名】是否冲突（如 `orders` 与 `ORDERS`）。

* 当 `lower_case_table_names = 0` 时，库名、表名均大小写敏感，无需额外转换。

#### 大小写冲突的解决方案

当出现冲突时，Doris 会报错，须通过以下方式解决冲突。

对于存在仅大小写不同而重复的库、表、列（例如 `DORIS` 与 `doris`）导致 Doris 无法正常区分的情况，可通过为 Catalog 设置 `meta_names_mapping` 来指定手动映射，从而解决冲突。

**配置示例：**

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

### 驱动包安全性

驱动包由用户上传到 Doris 集群，因此存在一定安全隐患。用户可以通过以下方式进行安全加固。

1. Doris 认为 `jdbc_drivers_dir` 目录下的所有驱动包都是安全的，不会对其进行路径检查。管理员需自行管理这个目录下的文件以确保其安全性。

2. 如使用本地路径或 HTTP 路径指定的驱动包，Doris 会做如下检查：

   * 通过 FE 配置项 `jdbc_driver_secure_path` 来控制允许的驱动包路径。该配置项可配置多个路径，以分号分隔。当配置了该项时，Doris 会检查 `driver_url` 的路径前缀是否在 `jdbc_driver_secure_path` 中，如果不在其中，则会拒绝创建。

     示例：

     如配置 `jdbc_driver_secure_path = "file:///path/to/jdbc_drivers;http://path/to/jdbc_drivers"` ，则只允许以 `file:///path/to/jdbc_drivers` 或 `http://path/to/jdbc_drivers` 开头的驱动包路径。

   * 此参数默认为 `*` 。如果为空或者 `*`，表示允许所有路径的 Jar 包。

3. 在创建数据目录时，可以通过 `checksum` 参数来指定驱动包的校验和。Doris 会在加载驱动包后，对驱动包进行校验，如果校验失败，则会拒绝创建。

### 连接池清理

在 Doris 中，每个 FE 和 BE 节点都会维护一个连接池，这样可以避免频繁地打开和关闭单独的数据源连接。连接池中的每个连接都可以用来与数据源建立连接并执行查询。任务完成后，这些连接会被归还到池中以便重复使用，这不仅提高了性能，还减少了建立连接时的系统开销，并帮助防止达到数据源的连接数上限。

可以根据实际情况调整连接池的大小，以便更好地适应不同工作负载。通常情况下，连接池的最小连接数应该设置为 1，以确保在启用保活机制时至少有一个连接处于活跃状态。连接池的最大连接数应该设置为一个合理的值，以避免过多的连接占用资源。

同时为了避免在 BE 上累积过多的未使用的连接池缓存，可以通过设置 BE 的 `jdbc_connection_pool_cache_clear_time_sec` 参数来指定清理缓存的时间间隔。默认值为 28800 秒（8 小时），此间隔过后，BE 将强制清理所有超过该时间未使用的连接池缓存。

### 凭证更新

使用 JDBC Catalog 连接外部数据源时，需谨慎更新数据库凭证。

Doris 通过连接池维持活跃连接以快速响应查询。但凭证变更后，连接池可能会继续使用旧凭证尝试建立新连接并失败。由于系统试图保持一定数量的活跃连接，这种错误尝试会重复执行，且在某些数据库系统中，频繁的失败可能导致账户被锁定。

建议在必须更改凭证时，同步更新 Doris JDBC Catalog 配置，并重启 Doris 集群，以确保所有节点使用最新凭证，防止连接失败和潜在的账户锁定。

可能遇到的账户锁定如下：

```text
MySQL: account is locked
Oracle: ORA-28000: the account is locked
SQL Server: Login is locked out
```

### 连接池问题排查

1. HikariPool 获取连接超时错误 `Connection is not available, request timed out after 5000ms`

   * 可能的原因

     * 原因 1：网络问题（例如，服务器不可达）

     * 原因 2：身份认证问题，例如无效的用户名或密码

     * 原因 3：网络延迟过高，导致创建连接超过 5 秒超时时间

     * 原因 4：并发查询过多，超过了连接池配置的最大连接数

   * 解决方案

     * 如果只有 `Connection is not available, request timed out after 5000ms` 这一类错误，请检查 `原因 3` 和 `原因 4`：

       * 检查是否存在网络延迟过高或资源耗尽的情况。

       * 调大连接池的最大连接数：

       ```sql
       ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_size' = '100');
       ```

       * 调大连接超时时间：

       ```sql
       ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_wait_time' = '10000');
       ```

     * 如果除了 `Connection is not available, request timed out after 5000ms` 之外还有其他错误信息，请检查这些附加错误：

       * 网络问题（例如，服务器不可达）可能导致连接失败。请检查网络连接是否正常。

       * 身份认证问题（例如，用户名或密码无效）也可能导致连接失败。请检查配置中使用的数据库凭据，确保用户名和密码正确无误。

       * 根据具体错误信息，调查与网络、数据库或身份认证相关的问题，找出根本原因。
