---
{
    "title": "从其他 TP 系统迁移数据",
    "language": "zh-CN",
    "description": "如何从 MySQL/SQL Server/Oracle/PostgreSQL 等 OLTP 系统迁移数据到 Apache Doris，覆盖离线与实时同步多种方案。",
    "keywords": [
        "MySQL 迁移到 Doris",
        "Oracle 迁移到 Doris",
        "SQL Server 迁移 Doris",
        "PostgreSQL 同步 Doris",
        "OLTP 数据迁移",
        "Flink CDC Doris",
        "JDBC Catalog",
        "整库同步"
    ]
}
---

<!-- 知识类型: 架构选型决策 / 操作步骤 -->
<!-- 适用场景: 从 OLTP 数据库（MySQL / SQL Server / Oracle / PostgreSQL）迁移或同步数据到 Apache Doris -->

本文介绍如何将 MySQL、SQL Server、Oracle、PostgreSQL 等传统事务型（OLTP / TP）数据库中的数据迁移到 Apache Doris。Doris 提供了多种数据接入方案，可以覆盖一次性迁移、离线批量同步以及实时增量同步等不同场景。

## 迁移方式概览

下表汇总了 Doris 支持的几种主要迁移方案，可根据数据量、同步时效性以及是否需要 CDC（变更数据捕获）等需求选择。

| 方案 | 适用场景 | 同步模式 | 是否支持整库 | 是否支持增量 / CDC |
|------|----------|----------|--------------|--------------------|
| Multi-Catalog | 一次性迁移、即席查询、CTAS 建表 | 离线 / 按需 | 通过 SQL 自行实现 | 否 |
| Flink Doris Connector（JDBC） | Flink 体系下的离线批量同步 | 离线 | 否 | 否 |
| Flink Doris Connector（CDC） | 实时全量 + 增量同步 | 实时 | 支持 | 支持（INSERT / UPDATE / DELETE） |
| Spark Connector | Spark 体系下的批量数据写入 | 离线 | 否 | 否 |
| Streaming Job | Doris 内置的 MySQL / PostgreSQL 持续同步 | 流式（持续） | 支持 | 支持 |
| 第三方工具（DataX / SeaTunnel / CloudCanal） | 已有同步平台、可视化运维 | 离线 / 实时 | 支持 | 视工具而定 |

> 说明：如果需要在不引入外部计算引擎的情况下完成迁移，推荐使用 **Multi-Catalog** 或 **Streaming Job**；如果需要实时增量同步，推荐使用 **Flink Doris Connector + CDC** 或 **Streaming Job**。

---

## 方案一：Multi-Catalog（推荐用于一次性迁移）

通过 JDBC Catalog 将 TP 数据库中的表映射为 Doris 的外表，再使用 `INSERT INTO` 或 `CREATE TABLE AS SELECT (CTAS)` 完成数据导入。

### 操作步骤

1. 创建指向源 TP 数据库的 JDBC Catalog。
2. 使用 `INSERT INTO` 写入已有的 Doris 表，或使用 `CTAS` 直接建表并写入。
3. 验证数据条数与字段一致性。

### 示例：从 MySQL 迁移数据

```sql
CREATE CATALOG mysql_catalog properties(
    'type' = 'jdbc',
    'user' = 'root',
    'password' = '123456',
    'jdbc_url' = 'jdbc:mysql://host:3306/mysql_db',
    'driver_url' = 'mysql-connector-java-8.0.25.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);

-- 通过 INSERT INTO 导入已存在的表
INSERT INTO internal.doris_db.tbl1
SELECT * FROM mysql_catalog.mysql_db.table1;

-- 通过 CTAS 一步建表并导入
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM mysql_catalog.mysql_db.table1;
```

更多细节参见 [Catalog 数据导入](../../../lakehouse/catalog-overview.md#数据导入)。

---

## 方案二：Flink Doris Connector

借助 Flink，可以实现 TP 系统的离线批量同步与实时增量同步两种模式。

### 2.1 离线同步：Flink JDBC Source + Doris Sink

适用于 Flink 体系下的离线数据搬运。以 Flink SQL 为例：

```sql
CREATE TABLE student_source (
    id INT,
    name STRING,
    age INT,
  PRIMARY KEY (id) NOT ENFORCED
) WITH (
  'connector' = 'jdbc',
  'url' = 'jdbc:mysql://localhost:3306/mydatabase',
  'table-name' = 'students',
  'username' = 'username',
  'password' = 'password'
);

CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
    )
    WITH (
      'connector' = 'doris',
      'fenodes' = '127.0.0.1:8030',
      'table.identifier' = 'test.students',
      'username' = 'root',
      'password' = 'password',
      'sink.label-prefix' = 'doris_label'
);

INSERT into student_sink select * from student_source;
```

更多细节参见 [Flink JDBC](https://nightlies.apache.org/flink/flink-docs-master/zh/docs/connectors/table/jdbc/#%e5%a6%82%e4%bd%95%e5%88%9b%e5%bb%ba-jdbc-%e8%a1%a8)。

### 2.2 实时同步：Flink CDC

借助 Flink CDC，可以一次性完成全量数据读取 + 增量数据捕获，并支持 INSERT / UPDATE / DELETE 事件的同步。

#### 单表实时同步示例

```sql
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE cdc_mysql_source (
  id int
  ,name VARCHAR
  ,PRIMARY KEY (id) NOT ENFORCED
) WITH (
'connector' = 'mysql-cdc',
'hostname' = '127.0.0.1',
'port' = '3306',
'username' = 'root',
'password' = 'password',
'database-name' = 'database',
'table-name' = 'table'
);

-- 支持同步 INSERT / UPDATE / DELETE 事件
CREATE TABLE doris_sink (
id INT,
name STRING
)
WITH (
  'connector' = 'doris',
  'fenodes' = '127.0.0.1:8030',
  'table.identifier' = 'database.table',
  'username' = 'root',
  'password' = '',
  'sink.properties.format' = 'json',
  'sink.properties.read_json_by_line' = 'true',
  'sink.enable-delete' = 'true',  -- 同步删除事件
  'sink.label-prefix' = 'doris_label'
);

insert into doris_sink select id,name from cdc_mysql_source;
```

#### 整库 / 多表同步

对于 TP 数据库的整库或多表同步，Flink Doris Connector 提供了开箱即用的整库同步功能，可一键完成 schema 同步与数据写入：

```shell
<FLINK_HOME>bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.16-24.0.1.jar \
    mysql-sync-database \
    --database test_db \
    --mysql-conf hostname=127.0.0.1 \
    --mysql-conf port=3306 \
    --mysql-conf username=root \
    --mysql-conf password=123456 \
    --mysql-conf database-name=mysql_db \
    --including-tables "tbl1|test.*" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=123456 \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1
```

更多细节参见 [整库同步](../../../connection-integration/data-integration/flink-doris-connector.md#整库同步)。

---

## 方案三：Spark Connector

适合已经使用 Spark 进行批处理的场景。可以通过 Spark Connector 的 JDBC Source 读取 TP 数据库，并通过 Doris Sink 写入 Doris。

```java
val jdbcDF = spark.read
  .format("jdbc")
  .option("url", "jdbc:postgresql:dbserver")
  .option("dbtable", "schema.tablename")
  .option("user", "username")
  .option("password", "password")
  .load()

 jdbcDF.write.format("doris")
  .option("doris.table.identifier", "db.table")
  .option("doris.fenodes", "127.0.0.1:8030")
  .option("user", "root")
  .option("password", "")
  .save()
```

相关文档：

- [JDBC To Other Databases](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html)
- [Spark Doris Connector 批量写入](../../../connection-integration/data-integration/spark-doris-connector.md#批量写入)

---

## 方案四：Streaming Job（Doris 内置持续同步）

Doris 提供了内置的 Streaming Job 能力，支持以持续运行的方式从 MySQL 或 PostgreSQL 同步数据，无需依赖外部计算引擎。

### 多表同步示例

```sql
CREATE JOB multi_table_sync
ON STREAMING
FROM MYSQL (
        "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
        "driver_url" = "mysql-connector-j-8.0.31.jar",
        "driver_class" = "com.mysql.cj.jdbc.Driver",
        "user" = "root",
        "password" = "123456",
        "database" = "test",
        "include_tables" = "user_info,order_info",
        "offset" = "initial"
)
TO DATABASE target_test_db (
    "table.create.properties.replication_num" = "1"
)
```

更多细节参见 [Postgres / MySQL Continuous Load](../import-way/streaming-job/continuous-load-overview.md)。

---

## 方案五：第三方同步工具

除上述原生方案外，也可以使用社区生态中常用的第三方同步工具完成数据迁移，适合已有同步平台或希望通过可视化方式管理任务的场景：

- [DataX](../../../connection-integration/data-integration/datax.md)
- [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md)
- [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md)

---

## FAQ

**Q1：一次性把 MySQL 里的几张表迁到 Doris，应该选哪种方案？**

推荐使用 **Multi-Catalog**。创建 JDBC Catalog 后，直接使用 `INSERT INTO` 或 `CTAS` 即可完成迁移，无需额外组件。

**Q2：需要从 MySQL 实时同步增量数据（含 UPDATE / DELETE）到 Doris，怎么做？**

可以选择 **Flink Doris Connector + Flink CDC**，并在 Doris Sink 中开启 `sink.enable-delete = true`；或使用 Doris 内置的 **Streaming Job** 实现持续同步。

**Q3：如何一次性同步整个 MySQL 库到 Doris？**

使用 Flink Doris Connector 的 `mysql-sync-database` 整库同步功能，或使用 Streaming Job 的多表同步能力，均可一键完成 schema 与数据的同步。

**Q4：源端是 Oracle / SQL Server / PostgreSQL，是否同样支持？**

是的。Multi-Catalog 与 Flink / Spark Connector 均支持通过对应的 JDBC 驱动连接 Oracle、SQL Server、PostgreSQL 等 TP 数据库；Streaming Job 当前主要支持 MySQL 与 PostgreSQL。

**Q5：迁移过程中如何指定 Doris 表的副本数？**

在 `CTAS` 语句中通过 `PROPERTIES('replication_num' = 'N')` 指定，或在 Flink 整库同步命令中通过 `--table-conf replication_num=N` 指定。
