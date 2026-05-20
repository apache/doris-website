---
{
    "title": "MySQL",
    "language": "en",
    "description": "Doris provides multiple ways to load data from MySQL, including ad-hoc loading via JDBC Catalog, continuous full + incremental synchronization via Streaming Job, and CDC sync via Flink Doris Connector."
}
---

Doris provides the following ways to load data from MySQL:

- **Loading MySQL data via JDBC Catalog**

Doris uses JDBC Catalog to map MySQL as an external catalog, allowing direct SQL queries against MySQL data. Combined with `INSERT INTO` or `CREATE TABLE AS SELECT`, this is suitable for one-time migration or periodic batch loading.

- **Continuously syncing MySQL data via Streaming Job**

Doris uses Streaming Job to continuously sync full and incremental data from MySQL to Doris. By integrating [Flink CDC](https://github.com/apache/flink-cdc) reading capability, Doris keeps the job running, reads Binlog from MySQL and writes it to Doris tables with exactly-once semantics. Two modes are supported: SQL Mapping Sync and Auto Table Creation Sync. Available since Doris 4.1.0.

- **Loading MySQL data via Flink Doris Connector**

Use Flink Doris Connector together with Flink MySQL CDC for real-time synchronization. This is suitable for scenarios that require additional Flink stream processing logic. The connector also provides a one-click full-database synchronization tool. For details, see [Flink Doris Connector](../../../ecosystem/flink-doris-connector/flink-doris-connector.md).

- **Loading MySQL data via third-party tools**

Data integration tools such as [DataX](../../../ecosystem/datax), [SeaTunnel](../../../ecosystem/seatunnel), and [CloudCanal](../../../ecosystem/cloudcanal) also support syncing data from MySQL to Doris.

In most cases, you can use JDBC Catalog directly for one-time data migration. When continuous full + incremental synchronization is required, Streaming Job is recommended.

## Loading MySQL data via JDBC Catalog

Use JDBC Catalog to map MySQL as an external catalog, then use `INSERT INTO` or `CREATE TABLE AS SELECT` to load data. For detailed syntax, see [JDBC MySQL Catalog](../../../lakehouse/catalogs/jdbc-mysql-catalog.md).

### Step 1: Prepare data in MySQL

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

### Step 2: Create a Catalog in Doris

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

### Step 3: Create the target table in Doris

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

### Step 4: Load data with INSERT INTO

```sql
INSERT INTO doris_db.students
SELECT id, name, age FROM mysql_catalog.test.students;
```

If the target table does not exist yet, you can also use `CREATE TABLE AS SELECT` to create the table and load data in one step:

```sql
CREATE TABLE doris_db.students
PROPERTIES ("replication_num" = "1")
AS
SELECT * FROM mysql_catalog.test.students;
```

### Step 5: Verify loaded data

```sql
SELECT * FROM doris_db.students;
+----+-------+------+
| id | name  | age  |
+----+-------+------+
|  1 | Emily |   25 |
|  2 | Bob   |   30 |
+----+-------+------+
```

## Continuously syncing MySQL data via Streaming Job

Streaming Job continuously reads MySQL Binlog via Flink CDC and writes it to Doris. Two modes are supported:

- [MySQL CDC with Auto Table Creation](../streaming-job/continuous-load-mysql-database.md): Doris creates downstream tables automatically on first sync (use `include_tables` to sync one, several, or all tables). Provides at-least-once semantics.
- [MySQL CDC with SQL Mapping](../streaming-job/continuous-load-mysql-table.md): target table must be pre-created in Doris. Supports flexible column mapping, data transformation, and exactly-once semantics.

### Limitations

1. Only primary key tables (Unique Key) are supported.
2. Load privilege is required. Auto Table Creation Sync also needs Create privilege when auto-creating downstream tables on first run.
3. Available since Doris 4.1.0.

### Prerequisites

Before submitting a Streaming Job, Binlog must be enabled on the MySQL side and the user must be granted the corresponding REPLICATION privileges. For environment-specific setup steps, see:

- [Amazon RDS MySQL Setup Guide](../streaming-job/prerequisites/amazon-rds-mysql.md)
- [Amazon Aurora MySQL Setup Guide](../streaming-job/prerequisites/amazon-aurora-mysql.md)
- See [Continuous Load Overview](../streaming-job/continuous-load-overview.md) for notes and required permissions of each mode.

### Operation Example: Auto Table Creation Sync

Auto Table Creation Sync uses the `FROM MYSQL ... TO DATABASE ...` syntax. The target is a Doris database, and the downstream tables are automatically created on first sync.

#### Step 1: Prepare data in MySQL

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### Step 2: Create the target database in Doris

Auto Table Creation Sync **does not require pre-creating tables**, but the target database that hosts them must exist:

```sql
CREATE DATABASE IF NOT EXISTS doris_db;
```

#### Step 3: Create a Streaming Job

The example below uses `include_tables` to sync only the `students` table (multiple tables can be comma-separated; leave empty to sync the whole database):

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
    "table.create.properties.replication_num" = "1"  -- set to 1 in single-BE deployments
);
```

#### Step 4: Check job status

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### Step 5: Inspect auto-created Doris tables and loaded data

```sql
SHOW TABLES FROM doris_db;
SELECT * FROM doris_db.students;
```

For more common operations and full parameter reference, see [MySQL CDC with Auto Table Creation](../streaming-job/continuous-load-mysql-database.md).

### Operation Example: SQL Mapping Sync

#### Step 1: Prepare data in MySQL

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### Step 2: Create the target table in Doris

SQL Mapping Sync requires the target table to exist beforehand:

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

#### Step 3: Create a Streaming Job

Use [CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) with the `INSERT INTO ... SELECT * FROM cdc_stream(...)` syntax:

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

#### Step 4: Check job status

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### Step 5: Verify loaded data

```sql
SELECT * FROM doris_db.students;
```

For more common operations (pause, resume, delete, check task, etc.) and full parameter reference, see [MySQL CDC with SQL Mapping](../streaming-job/continuous-load-mysql-table.md).
