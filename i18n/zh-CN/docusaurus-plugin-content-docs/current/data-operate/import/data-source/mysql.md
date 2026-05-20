---
{
    "title": "MySQL",
    "language": "zh-CN",
    "description": "Doris 提供多种方式从 MySQL 导入数据，包括通过 JDBC Catalog 按需查询/导入、通过 Streaming Job 进行全量+增量持续同步，以及借助 Flink Doris Connector 完成 CDC 同步。"
}
---

Doris 提供以下方式从 MySQL 导入数据：

- **使用 JDBC Catalog 导入 MySQL 数据**

Doris 通过 JDBC Catalog 将 MySQL 映射为外部 Catalog，可以直接以 SQL 的方式查询 MySQL 中的数据，并通过 `INSERT INTO` 或 `CREATE TABLE AS SELECT` 完成数据导入，适用于一次性迁移或周期性批量导入场景。

- **使用 Streaming Job 持续同步 MySQL 数据**

Doris 通过 Streaming Job 将 MySQL 的全量与增量数据持续同步到 Doris 中。Streaming Job 集成了 [Flink CDC](https://github.com/apache/flink-cdc) 的读取能力，提交作业后 Doris 会持续运行任务，从 MySQL 读取 Binlog 并写入到 Doris 表中，支持 exactly-once 语义，分为 SQL 映射同步和自动建表同步两种模式。该方式自 Doris 4.1.0 起支持。

- **使用 Flink Doris Connector 导入 MySQL 数据**

可以通过 Flink Doris Connector 配合 Flink MySQL CDC 实现实时同步，适用于需要在 Flink 中对数据进行额外流式处理的场景。Connector 同时提供一键整库同步工具，更多信息请参考 [Flink Doris Connector](../../../connection-integration/data-integration/flink-doris-connector.md)。

- **使用第三方工具导入 MySQL 数据**

[DataX](../../../connection-integration/data-integration/datax.md)、[SeaTunnel](../../../connection-integration/data-integration/seatunnel.md)、[CloudCanal](../../../connection-integration/data-integration/cloudcanal.md) 等数据集成工具同样支持将 MySQL 数据同步到 Doris。

在大多数场景下，可以直接使用 JDBC Catalog 进行一次性的数据迁移；当需要持续同步全量+增量数据时，推荐使用 Streaming Job。

## 使用 JDBC Catalog 导入 MySQL 数据

通过 JDBC Catalog 把 MySQL 映射为 Doris 的外部 Catalog，再使用 `INSERT INTO` 或 `CREATE TABLE AS SELECT` 完成数据导入。详细语法请参考 [JDBC MySQL Catalog](../../../lakehouse/catalogs/jdbc-mysql-catalog.md)。

### 第 1 步：在 MySQL 中准备数据

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

### 第 2 步：在 Doris 中创建 Catalog

```sql
CREATE CATALOG mysql_catalog PROPERTIES (
    "type"         = "jdbc",
    "user"         = "root",
    "password"     = "123456",
    "jdbc_url"     = "jdbc:mysql://127.0.0.1:3306/test",
    "driver_url"   = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver"
);
```

### 第 3 步：在 Doris 中创建目标表

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id     INT,
    name   VARCHAR(64),
    age    INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### 第 4 步：通过 INSERT INTO 导入数据

```sql
INSERT INTO doris_db.students
SELECT id, name, age FROM mysql_catalog.test.students;
```

如果目标表尚未创建，也可以使用 `CREATE TABLE AS SELECT` 一步完成建表与导入：

```sql
CREATE TABLE doris_db.students
PROPERTIES ("replication_num" = "1")
AS
SELECT * FROM mysql_catalog.test.students;
```

### 第 5 步：检查导入数据

```sql
SELECT * FROM doris_db.students;
+----+-------+------+
| id | name  | age  |
+----+-------+------+
|  1 | Emily |   25 |
|  2 | Bob   |   30 |
+----+-------+------+
```

## 使用 Streaming Job 持续同步 MySQL 数据

Streaming Job 通过集成 Flink CDC 持续读取 MySQL 的 Binlog 并写入 Doris，支持以下两种模式：

- [MySQL CDC 自动建表同步](../import-way/streaming-job/continuous-load-mysql-database.md)：首次同步时由 Doris 自动建表（通过 `include_tables` 可控制同步一张、多张或全部表），提供 at-least-once 语义。
- [MySQL CDC SQL 映射同步](../import-way/streaming-job/continuous-load-mysql-table.md)：目标表需预先在 Doris 中创建，支持灵活的列映射和数据转换，提供 exactly-once 语义。

### 使用限制

1. 仅支持主键表（Unique Key）同步。
2. 需要 Load 权限，自动建表同步首次自动建表时还需 Create 权限。
3. 该功能自 Doris 4.1.0 起支持。

### 前置配置

提交 Streaming Job 之前，需要在 MySQL 端开启 Binlog 并授予用户相应的 REPLICATION 权限。不同部署环境的具体配置步骤请参考：

- [Amazon RDS MySQL 配置指南](../import-way/streaming-job/prerequisites/amazon-rds-mysql.md)
- [Amazon Aurora MySQL 配置指南](../import-way/streaming-job/prerequisites/amazon-aurora-mysql.md)
- 各模式的注意事项与权限要求详见 [持续导入概览](../import-way/streaming-job/continuous-load-overview.md)

### 操作示例：自动建表同步

自动建表同步使用 `FROM MYSQL ... TO DATABASE ...` 语法，目标是一个 Doris database，首次同步时由 Doris 自动创建下游表。

#### 第 1 步：在 MySQL 中准备数据

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### 第 2 步：在 Doris 中创建目标 database

自动建表同步**不需要预建表**，但需要先创建用于承接同步表的 database：

```sql
CREATE DATABASE IF NOT EXISTS doris_db;
```

#### 第 3 步：创建 Streaming Job

下面的示例通过 `include_tables` 仅同步 `students` 一张表（多张表用逗号分隔，留空则同步整库）：

```sql
CREATE JOB mysql_db_sync
ON STREAMING
FROM MYSQL (
    "jdbc_url"       = "jdbc:mysql://127.0.0.1:3306",
    "driver_url"     = "mysql-connector-java-8.0.25.jar",
    "driver_class"   = "com.mysql.cj.jdbc.Driver",
    "user"           = "root",
    "password"       = "123456",
    "database"       = "test",
    "include_tables" = "students",
    "offset"         = "initial"
)
TO DATABASE doris_db (
    "table.create.properties.replication_num" = "1"  -- 单 BE 部署时设置为 1
);
```

#### 第 4 步：查看导入状态

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### 第 5 步：检查自动创建的 Doris 表与导入数据

```sql
SHOW TABLES FROM doris_db;
SELECT * FROM doris_db.students;
```

更多通用操作和完整参数说明，请参考 [MySQL CDC 自动建表同步](../import-way/streaming-job/continuous-load-mysql-database.md)。

### 操作示例：SQL 映射同步

#### 第 1 步：在 MySQL 中准备数据

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### 第 2 步：在 Doris 中创建目标表

SQL 映射同步要求目标表预先存在：

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id     INT,
    name   VARCHAR(64),
    age    INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

#### 第 3 步：创建 Streaming Job

通过 [CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) 创建 SQL 映射同步作业，使用 `INSERT INTO ... SELECT * FROM cdc_stream(...)` 语法：

```sql
CREATE JOB mysql_students_sync
ON STREAMING
DO
INSERT INTO doris_db.students
SELECT * FROM cdc_stream(
    "type"         = "mysql",
    "jdbc_url"     = "jdbc:mysql://127.0.0.1:3306",
    "driver_url"   = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user"         = "root",
    "password"     = "123456",
    "database"     = "test",
    "table"        = "students",
    "offset"       = "initial"
);
```

#### 第 4 步：查看导入状态

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### 第 5 步：检查导入数据

```sql
SELECT * FROM doris_db.students;
```

更多通用操作（暂停、恢复、删除、查看 Task 等）以及完整参数说明，请参考 [MySQL CDC SQL 映射同步](../import-way/streaming-job/continuous-load-mysql-table.md)。
