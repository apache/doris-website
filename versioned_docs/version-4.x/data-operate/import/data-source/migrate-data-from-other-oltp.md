---
{
    "title": "Migrating Data from Other OLTP",
    "language": "en",
    "description": "There are various ways to migrate data from other TP systems, such as MySQL/SqlServer/Oracle, to Doris."
}
---

There are various ways to migrate data from other TP systems, such as MySQL/SqlServer/Oracle, to Doris.

## Multi-Catalog

Use the Catalog to map as an external table, and then use the INSERT INTO or CREATE-TABLE-AS-SELECT statements to complete the data load.

For example, with MySQL:
```sql
CREATE CATALOG mysql_catalog properties(
    'type' = 'jdbc',
    'user' = 'root',
    'password' = '123456',
    'jdbc_url' = 'jdbc:mysql://host:3306/mysql_db',
    'driver_url' = 'mysql-connector-java-8.0.25.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);

-- Load via INSERT
INSERT INTO internal.doris_db.tbl1
SELECT * FROM iceberg_catalog.iceberg_db.table1;

-- Load via CTAS
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

For more details, refer to [Catalog Data Load](../../../lakehouse/catalog-overview.md#data-import)。

## Flink Doris Connector

You can leverage Flink to achieve offline and real-time synchronization for TP systems.

- Offline synchronization can be done using Flink's JDBC Source and Doris Sink to complete the data load. For example, using FlinkSQL:
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
  For more details, refer to [Flink JDBC](https://nightlies.apache.org/flink/flink-docs-master/zh/docs/connectors/table/jdbc/#%e5%a6%82%e4%bd%95%e5%88%9b%e5%bb%ba-jdbc-%e8%a1%a8)。

- Real-time synchronization can be achieved using FlinkCDC to read both full and incremental data. For example, using FlinkSQL:
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

  -- Supports synchronization of insert/update/delete events.
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
    'sink.enable-delete' = 'true',  -- Synchronize delete events.
    'sink.label-prefix' = 'doris_label'
  );

  insert into doris_sink select id,name from cdc_mysql_source;
  ```

  For synchronizing an entire database or multiple tables in a TP database, you can use the full-database synchronization feature provided by the Flink Doris Connector to complete the TP database write with a single click, as shown below:
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
  For more details, refer to [Full Database Synchronization](../../../ecosystem/flink-doris-connector.md#full-database-synchronization)

## Spark Connector
You can use the JDBC Source and Doris Sink of the Spark Connector to complete the data write.
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
For more details, refer to [JDBC To Other Databases](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html)，[Spark Doris Connector](../../../ecosystem//spark-doris-connector.md#batch-write)

## DataX / Seatunnel / CloudCanal and other third-party tools.

In addition, you can also use third-party synchronization tools for data synchronization. For more details, please refer to:
- [DataX](../../../ecosystem/datax)
- [Seatunnel](../../../ecosystem/seatunnel)
- [CloudCanal](../../../ecosystem/cloudcanal)