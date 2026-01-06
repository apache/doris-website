---
{
    "title": "从其他 TP 系统迁移数据",
    "language": "zh-CN",
    "description": "从其他 TP 系统，如 MySQL/SqlServer/Oracle 等，迁移数据到 Doris，可以有多种方式。"
}
---

从其他 TP 系统，如 MySQL/SqlServer/Oracle 等，迁移数据到 Doris，可以有多种方式。

## Multi-Catalog

使用 Catalog 映射为外表，然后使用 INSERT INTO 或者 CREATE-TABLE-AS-SELECT 语句，完成数据导入。

以 MySQL 为例：
```sql
CREATE CATALOG mysql_catalog properties(
    'type' = 'jdbc',
    'user' = 'root',
    'password' = '123456',
    'jdbc_url' = 'jdbc:mysql://host:3306/mysql_db',
    'driver_url' = 'mysql-connector-java-8.0.25.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);

-- 通过 insert 导入
INSERT INTO internal.doris_db.tbl1
SELECT * FROM iceberg_catalog.iceberg_db.table1;

-- 通过 ctas 导入
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

具体可参考 [Catalog 数据导入](../../../lakehouse/catalog-overview.md#数据导入)。

## Flink Doris Connector

可以借助于 Flink 完成 TP 系统的离线和实时同步。

- 离线同步可以使用 Flink 的 JDBC Source 和 Doris Sink 完成数据的导入，以 FlinkSQL 为例：
  ```sql
  CREATE TABLE student_source (
      id INT,
      name STRING,
      age INT
    PRIMARY KEY (id) NOT ENFORCED
  ) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:mysql://localhost:3306/mydatabase',
    'table-name' = 'students',
    'username' = 'username',
    'password' = 'password',
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
  具体可参考 [Flink JDBC](https://nightlies.apache.org/flink/flink-docs-master/zh/docs/connectors/table/jdbc/#%e5%a6%82%e4%bd%95%e5%88%9b%e5%bb%ba-jdbc-%e8%a1%a8)。

- 实时同步可以借助 FlinkCDC，完成全量和增量数据的读取，以 FlinkSQL 为例：
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

  -- 支持同步 insert/update/delete 事件
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

  同时对于 TP 数据库中 整库或者多表的同步操作，可以使用 Flink Doris Connector 提供的整库同步功能，一键完成 TP 数据库的写入，如：
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
  具体可参考：[整库同步](../../../ecosystem/flink-doris-connector.md#整库同步)

## Spark Connector
可以通过 Spark Connector 的 JDBC Source 和 Doris Sink 完成数据的写入。
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
具体可参考：[JDBC To Other Databases](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html)，[Spark Doris Connector](../../../ecosystem//spark-doris-connector.md#批量写入)

## DataX / Seatunnel / CloudCanal 等三方工具

除此之外，也可以使用第三方同步工具来进行数据同步，更多可参考：
- [DataX](../../../ecosystem/datax.md)
- [Seatunnel](../../../ecosystem/seatunnel.md)
- [CloudCanal](../../../ecosystem/cloudcanal.md)