---
{
  "title": "他のOLTPからのデータ移行",
  "description": "他のTPシステム（MySQL/SqlServer/Oracle など）からDorisにデータを移行する方法は様々あります。",
  "language": "ja"
}
---
他のTPシステム（MySQL/SqlServer/Oracle等）からDorisへデータを移行する方法は様々あります。

## Multi-カタログ

カタログを使用して外部tableとしてマッピングし、INSERT INTOまたはCREATE-TABLE-AS-SELECT文を使ってデータロードを完了します。

例えば、MySQLの場合：

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
詳細については、[カタログ Data Load](../../../data-operate/import/import-way/insert-into-manual)を参照してください。

## Flink Doris Connector

FlinkをTPシステムのオフライン同期とリアルタイム同期に活用できます。

- オフライン同期は、FlinkのJDBC SourceとDoris Sinkを使用してデータロードを完了できます。例えば、FlinkSQLを使用する場合：

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
詳細については、[Flink JDBC](https://nightlies.apache.org/flink/flink-docs-master/zh/docs/connectors/table/jdbc/#%e5%a6%82%e4%bd%95%e5%88%9b%e5%bb%ba-jdbc-%e8%a1%a8)を参照してください。

- FlinkCDCを使用して全量データと増分データの両方を読み取ることで、リアルタイム同期を実現できます。例えば、FlinkSQLを使用する場合：

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
TP データベースでデータベース全体または複数のTableを同期する場合、Flink Doris Connector が提供するフルデータベース同期機能を使用して、以下に示すようにワンクリックで TP データベース書き込みを完了できます。

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
詳細については、Full Database Synchronizationを参照してください。

## Spark Connector
Spark ConnectorのJDBC SourceとDoris Sinkを使用してデータ書き込みを完了できます。

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
詳細については、[JDBC To Other Databases](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html)、Spark Doris Connectorを参照してください。

## DataX / Seatunnel / CloudCanalおよびその他のサードパーティツール

さらに、データ同期にはサードパーティの同期ツールを使用することもできます。詳細については、以下を参照してください：
- DataX
- Seatunnel
- CloudCanal
