---
{
    "title": "Flink Doris Connector",
    "language": "en"
}
---

The [Flink Doris Connector](https://github.com/apache/doris-flink-connector) is used to read from and write data to a Doris cluster through Flink. It also integrates [FlinkCDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/), which allows for more convenient full database synchronization with upstream databases such as MySQL.

Using the Flink Connector, you can perform the following operations:

- **Read data from Doris**: Flink Connector supports parallel reading from BE, improving data retrieval efficiency.

- **Write data to Doris**: After batching in Flink, data is imported into Doris in bulk using Stream Load.

- **Perform dimension table joins with Lookup Join**: Batching and asynchronous queries accelerate dimension table joins.

- **Full database synchronization**: Using Flink CDC, you can synchronize entire databases such as MySQL, Oracle, and PostgreSQL, including automatic table creation and DDL operations.

## Version Description

| Connector Version | Flink Version                 | Doris Version | Java Version | Scala Version |
| ----------------- | ----------------------------- | ------------- | ------------ | ------------- |
| 1.0.3             | 1.11,1.12,1.13,1.14           | 0.15+         | 8            | 2.11,2.12     |
| 1.1.1             | 1.14                          | 1.0+          | 8            | 2.11,2.12     |
| 1.2.1             | 1.15                          | 1.0+          | 8            | -             |
| 1.3.0             | 1.16                          | 1.0+          | 8            | -             |
| 1.4.0             | 1.15,1.16,1.17                | 1.0+          | 8            | -             |
| 1.5.2             | 1.15,1.16,1.17,1.18           | 1.0+          | 8            | -             |
| 1.6.1             | 1.15,1.16,1.17,1.18,1.19      | 1.0+          | 8            | -             |
| 24.0.1            | 1.15,1.16,1.17,1.18,1.19,1.20 | 1.0+          | 8            | -             |
| 24.1.0            | 1.15,1.16,1.17,1.18,1.19,1.20 | 1.0+          | 8            | -             |
| 25.0.0            | 1.15,1.16,1.17,1.18,1.19,1.20 | 1.0+          | 8            | -             |
| 25.1.0            | 1.15,1.16,1.17,1.18,1.19,1.20 | 1.0+ | 8 |- |

## Usage

The Flink Doris Connector can be used in two ways: via Jar or Maven.

#### Jar

You can download the corresponding version of the Flink Doris Connector Jar file [here](https://doris.apache.org/download#doris-ecosystem), then copy this file to the `classpath` of your `Flink` setup to use the `Flink-Doris-Connector`. For a `Standalone` mode Flink deployment, place this file under the `lib/` folder. For a Flink cluster running in `Yarn` mode, place the file into the pre-deployment package.

#### Maven

To use it with Maven, simply add the following dependency to your Pom file:

```xml
<dependency>
  <groupId>org.apache.doris</groupId>
  <artifactId>flink-doris-connector-${flink.version}</artifactId>
  <version>${connector.version}</version>
</dependency> 
```

For example:

```xml
<dependency>
  <groupId>org.apache.doris</groupId>
  <artifactId>flink-doris-connector-1.16</artifactId>
  <version>25.1.0</version>
</dependency> 
```

## Working Principles

### Reading Data from Doris

![Flink Connector Principles JDBC Doris](/images/ecomsystem/flink-connector/FlinkConnectorPrinciples-JDBC-Doris.png)

When reading data, Flink Doris Connector offers higher performance compared to Flink JDBC Connector and is recommended for use:

- **Flink JDBC Connector**: Although Doris is compatible with the MySQL protocol, using Flink JDBC Connector for reading and writing to a Doris cluster is not recommended. This approach results in serial read/write operations on a single FE node, creating a bottleneck and affecting performance.

- **Flink Doris Connector**: Starting from Doris 2.1, ADBC is the default protocol for Flink Doris Connector. The reading process follows these steps:

  a. Flink Doris Connector first retrieves Tablet ID information from FE based on the query plan.  

  b. It generates the query statement: `SELECT * FROM tbs TABLET(id1, id2, id3)`.  

  c. The query is then executed through the ADBC port of FE.  

  d. Data is returned directly from BE, bypassing FE to eliminate the single-point bottleneck.  

### Writing Data to Doris

When using Flink Doris Connector for data writing, batch processing is performed in Flink's memory before bulk import via Stream Load. Doris Flink Connector provides two batching modes, with Flink Checkpoint-based streaming writes as the default:

|          | Streaming Write | Batch Write |
|----------|----------------|-------------|
| **Trigger Condition** | Relies on Flink Checkpoints and follows Flink's checkpoint cycle to write to Doris | Periodic submission based on connector-defined time or data volume thresholds |
| **Consistency** | Exactly-Once | At-Least-Once; Exactly-Once can be ensured with the primary key model |
| **Latency** | Limited by the Flink checkpoint interval, generally higher | Independent batch mechanism with flexible adjustment |
| **Fault Tolerance & Recovery** | Fully consistent with Flink state recovery | Relies on external deduplication logic (e.g., Doris primary key deduplication) |


## Quick Start

#### Preparation

#### Flink Cluster Deployment

Taking a Standalone cluster as an example:

1. Download the Flink installation package, e.g., [Flink 1.18.1](https://archive.apache.org/dist/flink/flink-1.18.1/flink-1.18.1-bin-scala_2.12.tgz);
2. After extraction, place the Flink Doris Connector package in `<FLINK_HOME>/lib`;
3. Navigate to the `<FLINK_HOME>` directory and run `bin/start-cluster.sh` to start the Flink cluster;
4. You can verify if the Flink cluster started successfully using the `jps` command.

#### Initialize Doris Tables

Run the following statements to create Doris tables:

```sql
CREATE DATABASE test;

CREATE TABLE test.student (
  `id` INT,
  `name` VARCHAR(256),
  `age` INT
)
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 3"
);

INSERT INTO test.student values(1,"James",18);
INSERT INTO test.student values(2,"Emily",28);

CREATE TABLE test.student_trans (
  `id` INT,
  `name` VARCHAR(256),
  `age` INT
)
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 3"
);
```

#### Run FlinkSQL Task

**Start FlinkSQL Client**

```bash
bin/sql-client.sh
```

**Run FlinkSQL**

```sql
CREATE TABLE Student (
    id STRING,
    name STRING,
    age INT
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '127.0.0.1:8030',
      'table.identifier' = 'test.student',
      'username' = 'root',
      'password' = ''
);

CREATE TABLE StudentTrans (
    id STRING,
    name STRING,
    age INT
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '127.0.0.1:8030',
      'table.identifier' = 'test.student_trans',
      'username' = 'root',
      'password' = '',
      'sink.label-prefix' = 'doris_label'
);

INSERT INTO StudentTrans SELECT id, concat('prefix_',name), age+1 FROM Student;
```

#### Query Data

```sql
mysql> select * from test.student_trans;
+------+--------------+------+
| id   | name         | age  |
+------+--------------+------+
|    1 | prefix_James |   19 |
|    2 | prefix_Emily |   29 |
+------+--------------+------+
2 rows in set (0.02 sec)
```



## Scenarios and Operations

### Reading Data from Doris

When Flink reads data from Doris, the Doris Source is currently a bounded stream and does not support continuous reading in a CDC manner. Data can be read from Doris using Thrift or ArrowFlightSQL (supported from version 24.0.0 onward). Starting from version 2.1, ArrowFlightSQL is the recommended approach.

- **Thrift**: Data is read by calling the BE's Thrift interface. For detailed steps, refer to [Reading Data via Thrift Interface](https://github.com/apache/doris/blob/master/samples/doris-demo/doris-source-demo/README.md).
- **ArrowFlightSQL**: Based on Doris 2.1, this method allows high-speed reading of large volumes of data using the Arrow Flight SQL protocol. For more information, refer to [High-speed Data Transfer via Arrow Flight SQL](https://doris.apache.org/docs/dev/db-connect/arrow-flight-sql-connect/).

#### Using FlinkSQL to Read Data

##### Thrift Method

```SQL
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '127.0.0.1:8030',  -- Fe的host:HttpPort
      'table.identifier' = 'test.student',
      'username' = 'root',
      'password' = ''
);

SELECT * FROM student;
```

##### ArrowFlightSQL

```SQL
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '{fe.conf:http_port}', 
      'table.identifier' = 'test.student',
      'source.use-flight-sql' = 'true',
      'source.flight-sql-port' = '{fe.conf:arrow_flight_sql_port}',
      'username' = 'root',
      'password' = ''
);

SELECT * FROM student;
```

#### Using DataStream API to Read Data

When using the DataStream API to read data, you need to include the dependencies in your program's POM file in advance, as described in the "Usage" section.

```Java
final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
DorisOptions option = DorisOptions.builder()
        .setFenodes("127.0.0.1:8030")
        .setTableIdentifier("test.student")
        .setUsername("root")
        .setPassword("")
        .build();

DorisReadOptions readOptions = DorisReadOptions.builder().build();
DorisSource<List<?>> dorisSource = DorisSource.<List<?>>builder()
        .setDorisOptions(option)
        .setDorisReadOptions(readOptions)
        .setDeserializer(new SimpleListDeserializationSchema())
        .build();

env.fromSource(dorisSource, WatermarkStrategy.noWatermarks(), "doris source").print();
env.execute("Doris Source Test");
```

For the complete code, refer to:[DorisSourceDataStream.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/DorisSourceDataStream.java)

### Writing Data to Doris

Flink writes data to Doris using the Stream Load method, supporting both streaming and batch-insertion modes.

:::info Difference Between Streaming and Batch-insertion

Starting from Connector 1.5.0, batch-insertion is supported. Batch-insertion does not rely on Checkpoints; it buffers data in memory and controls the writing timing based on batch parameters. Streaming insertion requires Checkpoints to be enabled, continuously writing upstream data to Doris during the entire Checkpoint period, without keeping data in memory continuously.

:::

#### Using FlinkSQL to Write Data

For testing, Flink's [Datagen](https://nightlies.apache.org/flink/flink-docs-master/docs/connectors/table/datagen/) is used to simulate the continuously generated upstream data.

```SQL
-- enable checkpoint
SET 'execution.checkpointing.interval' = '30s';

CREATE TABLE student_source (
    id INT,
    name STRING,
    age INT
) WITH (
  'connector' = 'datagen',
  'rows-per-second' = '1',
  'fields.name.length' = '20',
  'fields.id.min' = '1',
  'fields.id.max' = '100000',
  'fields.age.min' = '3',
  'fields.age.max' = '30'
);

-- doris sink
CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '10.16.10.6:28737',
      'table.identifier' = 'test.student',
      'username' = 'root',
      'password' = 'password',
      'sink.label-prefix' = 'doris_label'
      --'sink.enable.batch-mode' = 'true'  Adding this configuration enables batch writing
);

INSERT INTO student_sink SELECT * FROM student_source;
```

#### Using DataStream API to Write Data

When using the DataStream API to write data, different serialization methods can be used to serialize the upstream data before writing it to the Doris table.

:::info

The Connector already contains the HttpClient4.5.13 version. If you reference HttpClient separately in your project, you need to ensure that the versions are consistent.

:::

##### Standard String Format

When the upstream data is in CSV or JSON format, you can directly use the `SimpleStringSerializer` to serialize the data.

```Java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(30000);
DorisSink.Builder<String> builder = DorisSink.builder();

DorisOptions dorisOptions = DorisOptions.builder()
        .setFenodes("10.16.10.6:28737")
        .setTableIdentifier("test.student")
        .setUsername("root")
        .setPassword("")
        .build();

Properties properties = new Properties();
// When the upstream data is in json format, the following configuration needs to be enabled
properties.setProperty("read_json_by_line", "true");
properties.setProperty("format", "json");
    
// When writing csv data from the upstream, the following configurations need to be enabled
//properties.setProperty("format", "csv");
//properties.setProperty("column_separator", ",");
    
DorisExecutionOptions executionOptions = DorisExecutionOptions.builder()
       .setLabelPrefix("label-doris")
       .setDeletable(false)
       //.setBatchMode(true)  Enable batch writing
       .setStreamLoadProp(properties)
       .build();

builder.setDorisReadOptions(DorisReadOptions.builder().build())
       .setDorisExecutionOptions(executionOptions)
       .setSerializer(new SimpleStringSerializer())
       .setDorisOptions(dorisOptions);

List<String> data = new ArrayList<>();
data.add("{\"id\":3,\"name\":\"Michael\",\"age\":28}");
data.add("{\"id\":4,\"name\":\"David\",\"age\":38}");

env.fromCollection(data).sinkTo(builder.build());
env.execute("doris test");
```

For the complete code, refer to:[DorisSinkExample.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/DorisSinkExample.java)

##### RowData Format

RowData is the internal format of Flink. If the upstream data is in RowData format, you need to use the `RowDataSerializer` to serialize the data.

```Java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(10000);
env.setParallelism(1);

DorisSink.Builder<RowData> builder = DorisSink.builder();

Properties properties = new Properties();
properties.setProperty("column_separator", ",");
properties.setProperty("line_delimiter", "\n");
properties.setProperty("format", "csv");
// When writing json data from the upstream, the following configuration needs to be enabled
// properties.setProperty("read_json_by_line", "true");
// properties.setProperty("format", "json");
DorisOptions.Builder dorisBuilder = DorisOptions.builder();
dorisBuilder
        .setFenodes("10.16.10.6:28737")
        .setTableIdentifier("test.student")
        .setUsername("root")
        .setPassword("");
DorisExecutionOptions.Builder executionBuilder = DorisExecutionOptions.builder();
executionBuilder.setLabelPrefix(UUID.randomUUID().toString()).setDeletable(false).setStreamLoadProp(properties);

// flink rowdata‘s schema
String[] fields = {"id","name", "age"};
DataType[] types = {DataTypes.INT(), DataTypes.VARCHAR(256), DataTypes.INT()};

builder.setDorisExecutionOptions(executionBuilder.build())
        .setSerializer(
                RowDataSerializer.builder() // serialize according to rowdata
                        .setType(LoadConstants.CSV)
                        .setFieldDelimiter(",")
                        .setFieldNames(fields)
                        .setFieldType(types)
                        .build())
        .setDorisOptions(dorisBuilder.build());

// mock rowdata source
DataStream<RowData> source =
        env.fromElements("")
                .flatMap(
                        new FlatMapFunction<String, RowData>() {
                            @Override
                            public void flatMap(String s, Collector<RowData> out)
                                    throws Exception {
                                GenericRowData genericRowData = new GenericRowData(3);
                                genericRowData.setField(0, 1);
                                genericRowData.setField(1, StringData.fromString("Michael"));
                                genericRowData.setField(2, 18);
                                out.collect(genericRowData);

                                GenericRowData genericRowData2 = new GenericRowData(3);
                                genericRowData2.setField(0, 2);
                                genericRowData2.setField(1, StringData.fromString("David"));
                                genericRowData2.setField(2, 38);
                                out.collect(genericRowData2);
                            }
                        });

source.sinkTo(builder.build());
env.execute("doris test");
```

For the complete code, refer to:[DorisSinkExampleRowData.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/DorisSinkExampleRowData.java) 

##### Debezium Format

For upstream data in Debezium format, such as data from FlinkCDC or Debezium format in Kafka, you can use the `JsonDebeziumSchemaSerializer` to serialize the data.

```Java
// enable checkpoint
env.enableCheckpointing(10000);

Properties props = new Properties();
props.setProperty("format", "json");
props.setProperty("read_json_by_line", "true");
DorisOptions dorisOptions = DorisOptions.builder()
        .setFenodes("127.0.0.1:8030")
        .setTableIdentifier("test.student")
        .setUsername("root")
        .setPassword("").build();

DorisExecutionOptions.Builder  executionBuilder = DorisExecutionOptions.builder();
executionBuilder.setLabelPrefix("label-prefix")
        .setStreamLoadProp(props)
        .setDeletable(true);

DorisSink.Builder<String> builder = DorisSink.builder();
builder.setDorisReadOptions(DorisReadOptions.builder().build())
        .setDorisExecutionOptions(executionBuilder.build())
        .setDorisOptions(dorisOptions)
        .setSerializer(JsonDebeziumSchemaSerializer.builder().setDorisOptions(dorisOptions).build());

env.fromSource(mySqlSource, WatermarkStrategy.noWatermarks(), "MySQL Source")
        .sinkTo(builder.build());
```

For the complete code, refer to:[CDCSchemaChangeExample.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/CDCSchemaChangeExample.java)

##### Multi-table Write Format

Currently, DorisSink supports synchronizing multiple tables with a single Sink. You need to pass both the data and the database/table information to the Sink, and serialize it using the `RecordWithMetaSerializer`.

```Java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.setParallelism(1);
DorisSink.Builder<RecordWithMeta> builder = DorisSink.builder();
Properties properties = new Properties();
properties.setProperty("column_separator", ",");
properties.setProperty("line_delimiter", "\n");
properties.setProperty("format", "csv");
DorisOptions.Builder dorisBuilder = DorisOptions.builder();
dorisBuilder
        .setFenodes("10.16.10.6:28737")
        .setTableIdentifier("")
        .setUsername("root")
        .setPassword("");

DorisExecutionOptions.Builder executionBuilder = DorisExecutionOptions.builder();

executionBuilder
        .setLabelPrefix("label-doris")
        .setStreamLoadProp(properties)
        .setDeletable(false)
        .setBatchMode(true);

builder.setDorisReadOptions(DorisReadOptions.builder().build())
        .setDorisExecutionOptions(executionBuilder.build())
        .setDorisOptions(dorisBuilder.build())
        .setSerializer(new RecordWithMetaSerializer());

RecordWithMeta record = new RecordWithMeta("test", "student_1", "1,David,18");
RecordWithMeta record1 = new RecordWithMeta("test", "student_2", "1,Jack,28");
env.fromCollection(Arrays.asList(record, record1)).sinkTo(builder.build());
```

For the complete code, refer to:[DorisSinkMultiTableExample.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/DorisSinkMultiTableExample.java)

### Lookup Join

Using Lookup Join can optimize dimension table joins in Flink. When using Flink JDBC Connector for dimension table joins, the following issues may arise:

- Flink JDBC Connector uses a synchronous query mode, meaning that after upstream data (e.g., from Kafka) sends a record, it immediately queries the Doris dimension table. This results in high query latency under high-concurrency scenarios.  

- Queries executed via JDBC are typically point lookups per record, whereas Doris recommends batch queries for better efficiency.  

Using [Lookup Join](https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/dev/table/sql/queries/joins/#lookup-join) for dimension table joins in Flink Doris Connector provides the following advantages:  

- **Batch caching of upstream data**, avoiding the high latency and database load caused by per-record queries.  

- **Asynchronous execution of join queries**, improving data throughput and reducing the query load on Doris.  

```SQL
CREATE TABLE fact_table (
  `id` BIGINT,
  `name` STRING,
  `city` STRING,
  `process_time` as proctime()
) WITH (
  'connector' = 'kafka',
  ...
);

create table dim_city(
  `city` STRING,
  `level` INT ,
  `province` STRING,
  `country` STRING
) WITH (
  'connector' = 'doris',
  'fenodes' = '127.0.0.1:8030',
  'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
  'table.identifier' = 'dim.dim_city',
  'username' = 'root',
  'password' = ''
);

SELECT a.id, a.name, a.city, c.province, c.country,c.level 
FROM fact_table a
LEFT JOIN dim_city FOR SYSTEM_TIME AS OF a.process_time AS c
ON a.city = c.city
```

### Full Database Synchronization

The Flink Doris Connector integrates **Flink CDC** ([Flink CDC Documentation](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/)), making it easier to synchronize relational databases like MySQL to Doris. This integration also includes automatic table creation, schema changes, etc. Supported databases for synchronization include: MySQL, Oracle, PostgreSQL, SQLServer, MongoDB, and DB2.

:::info Note

1. When using full database synchronization, you need to add the corresponding Flink CDC dependencies in the `$FLINK_HOME/lib` directory (Fat Jar), such as **flink-sql-connector-mysql-cdc-${version}.jar**, **flink-sql-connector-oracle-cdc-${version}.jar**. FlinkCDC version 3.1 and later is not compatible with previous versions. You can download the dependencies from the following links: [FlinkCDC 3.x](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/), [FlinkCDC 2.x](https://repo.maven.apache.org/maven2/com/ververica/flink-sql-connector-mysql-cdc/).
2. For versions after Connector 24.0.0, the required Flink CDC version must be 3.1 or higher. You can download it [here](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/). If Flink CDC is used to synchronize MySQL and Oracle, you must also add the relevant JDBC drivers under `$FLINK_HOME/lib`.

#### MySQL Whole Database Synchronization

After starting the Flink cluster, you can directly run the following command:

```Shell
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

#### Oracle Whole Database Synchronization

```Shell
<FLINK_HOME>bin/flink run \
     -Dexecution.checkpointing.interval=10s \
     -Dparallelism.default=1 \
     -c org.apache.doris.flink.tools.cdc.CdcTools \
     ./lib/flink-doris-connector-1.16-24.0.1.jar \
     oracle-sync-database \
     --database test_db \
     --oracle-conf hostname=127.0.0.1 \
     --oracle-conf port=1521 \
     --oracle-conf username=admin \
     --oracle-conf password="password" \
     --oracle-conf database-name=XE \
     --oracle-conf schema-name=ADMIN \
     --including-tables "tbl1|tbl2" \
     --sink-conf fenodes=127.0.0.1:8030 \
     --sink-conf username=root \
     --sink-conf password=\
     --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
     --sink-conf sink.label-prefix=label \
     --table-conf replication_num=1
```

#### PostgreSQL Whole Database Synchronization

```Shell
<FLINK_HOME>/bin/flink run \
     -Dexecution.checkpointing.interval=10s \
     -Dparallelism.default=1\
     -c org.apache.doris.flink.tools.cdc.CdcTools \
     ./lib/flink-doris-connector-1.16-24.0.1.jar \
     postgres-sync-database \
     --database db1\
     --postgres-conf hostname=127.0.0.1 \
     --postgres-conf port=5432 \
     --postgres-conf username=postgres \
     --postgres-conf password="123456" \
     --postgres-conf database-name=postgres \
     --postgres-conf schema-name=public \
     --postgres-conf slot.name=test \
     --postgres-conf decoding.plugin.name=pgoutput \
     --including-tables "tbl1|tbl2" \
     --sink-conf fenodes=127.0.0.1:8030 \
     --sink-conf username=root \
     --sink-conf password=\
     --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
     --sink-conf sink.label-prefix=label \
     --table-conf replication_num=1
```

#### SQLServer Whole Database Synchronization

```Shell
<FLINK_HOME>/bin/flink run \
     -Dexecution.checkpointing.interval=10s \
     -Dparallelism.default=1 \
     -c org.apache.doris.flink.tools.cdc.CdcTools \
     ./lib/flink-doris-connector-1.16-24.0.1.jar \
     sqlserver-sync-database \
     --database db1\
     --sqlserver-conf hostname=127.0.0.1 \
     --sqlserver-conf port=1433 \
     --sqlserver-conf username=sa \
     --sqlserver-conf password="123456" \
     --sqlserver-conf database-name=CDC_DB \
     --sqlserver-conf schema-name=dbo \
     --including-tables "tbl1|tbl2" \
     --sink-conf fenodes=127.0.0.1:8030 \
     --sink-conf username=root \
     --sink-conf password=\
     --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
     --sink-conf sink.label-prefix=label \
     --table-conf replication_num=1
```

#### DB2 Whole Database Synchronization

```Shell
<FLINK_HOME>bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.16-24.0.1.jar \
    db2-sync-database \
    --database db2_test \
    --db2-conf hostname=127.0.0.1 \
    --db2-conf port=50000 \
    --db2-conf username=db2inst1 \
    --db2-conf password=doris123456 \
    --db2-conf database-name=testdb \
    --db2-conf schema-name=DB2INST1 \
    --including-tables "FULL_TYPES|CUSTOMERS" \
    --single-sink true \
    --use-new-schema-change true \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=123456 \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1 
```

#### MongoDB Whole Database Synchronization

```Shell
<FLINK_HOME>/bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    ./lib/flink-doris-connector-1.18-24.0.1.jar \
    mongodb-sync-database \
    --database doris_db \
    --schema-change-mode debezium_structure \
    --mongodb-conf hosts=127.0.0.1:27017 \
    --mongodb-conf username=flinkuser \
    --mongodb-conf password=flinkpwd \
    --mongodb-conf database=test \
    --mongodb-conf scan.startup.mode=initial \
    --mongodb-conf schema.sample-percent=0.2 \
    --including-tables "tbl1|tbl2" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password= \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --sink-conf sink.enable-2pc=false \
    --table-conf replication_num=1
```

#### AWS Aurora MySQL Whole Database Synchronization

```Shell
<FLINK_HOME>bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.18-25.0.0.jar \
    mysql-sync-database \
    --database testwd \
    --mysql-conf hostname=xxx.us-east-1.rds.amazonaws.com \
    --mysql-conf port=3306 \
    --mysql-conf username=admin \
    --mysql-conf password=123456 \
    --mysql-conf database-name=test \
    --mysql-conf server-time-zone=UTC \
    --including-tables "student" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password= \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1 
```

#### AWS RDS MySQL Whole Database Synchronization

```Shell
<FLINK_HOME>bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.18-25.0.0.jar \
    mysql-sync-database \
    --database testwd \
    --mysql-conf hostname=xxx.ap-southeast-1.rds.amazonaws.com \
    --mysql-conf port=3306 \
    --mysql-conf username=admin \
    --mysql-conf password=123456 \
    --mysql-conf database-name=test \
    --mysql-conf server-time-zone=UTC \
    --including-tables "student" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password= \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1 
```


## Usage Instructions

### Parameter Configuration

#### General Configuration Items

| Key                           | Default Value | Required | Comment                                                      |
| ----------------------------- | ------------- | -------- | ------------------------------------------------------------ |
| fenodes                       | --            | Y        | Doris FE http addresses. Multiple addresses are supported and should be separated by commas. |
| benodes                       | --            | N        | Doris BE http addresses. Multiple addresses are supported and should be separated by commas. |
| jdbc-url                      | --            | N        | JDBC connection information, such as jdbc:mysql://127.0.0.1:9030. |
| table.identifier              | --            | Y        | Doris table name, such as db.tbl.                            |
| username                      | --            | Y        | Username for accessing Doris.                                |
| password                      | --            | Y        | Password for accessing Doris.                                |
| auto-redirect                 | TRUE          | N        | Whether to redirect StreamLoad requests. After enabling, StreamLoad will write through FE and will no longer explicitly obtain BE information. |
| doris.request.retries         | 3             | N        | The number of retries for sending requests to Doris.         |
| doris.request.connect.timeout | 30s           | N        | The connection timeout for sending requests to Doris.        |
| doris.request.read.timeout    | 30s           | N        | The read timeout for sending requests to Doris.              |

#### Source Configuration

| Key                           | Default Value | Required | Comment                                                      |
| ----------------------------- | ------------- | -------- | ------------------------------------------------------------ |
| doris.request.query.timeout   | 21600s        | N        | The timeout for querying Doris. The default value is 6 hours. |
| doris.request.tablet.size     | 1             | N        | The number of Doris Tablets corresponding to one Partition. The smaller this value is set, the more Partitions will be generated, which can increase the parallelism on the Flink side. However, it will also put more pressure on Doris. |
| doris.batch.size              | 4064          | N        | The maximum number of rows read from BE at one time. Increasing this value can reduce the number of connections established between Flink and Doris, thereby reducing the additional time overhead caused by network latency. |
| doris.exec.mem.limit          | 8192mb        | N        | The memory limit for a single query. The default is 8GB, in bytes. |
| source.use-flight-sql         | FALSE         | N        | Whether to use Arrow Flight SQL for reading.                 |
| source.flight-sql-port        | -             | N        | The arrow_flight_sql_port of FE when using Arrow Flight SQL for reading. |

**DataStream-Specific Configuration**

| Key                | Default Value | Required | Comment                                                      |
| ------------------ | ------------- | -------- | ------------------------------------------------------------ |
| doris.read.field   | --            | N        | The list of column names for reading Doris tables. Multiple columns should be separated by commas. |
| doris.filter.query | --            | N        | The expression for filtering read data. This expression is passed to Doris. Doris uses this expression to complete source data filtering. For example, age=18. |

#### Sink Configuration

| Key                         | Default Value | Required | Comment                                                      |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------ |
| sink.label-prefix           | --            | Y        | The label prefix used for Stream load import. In the 2pc scenario, it is required to be globally unique to ensure the EOS semantics of Flink. |
| sink.properties.*           | --            | N        | Import parameters for Stream Load. For example, 'sink.properties.column_separator' = ', ' defines the column separator, and 'sink.properties.escape_delimiters' = 'true' means that special characters as delimiters, like \x01, will be converted to binary 0x01. For JSON format import, 'sink.properties.format' = 'json', 'sink.properties.read_json_by_line' = 'true'. For detailed parameters, refer to [here](https://doris.apache.org/zh-CN/docs/dev/data-operate/import/stream-load-manual.md). For Group Commit mode, for example, 'sink.properties.group_commit' = 'sync_mode' sets the group commit to synchronous mode. The Flink connector has supported import configuration group commit since version 1.6.2. For detailed usage and limitations, refer to [group commit](https://doris.apache.org/zh-CN/docs/data-operate/import/import-way/group-commit-manual/). |
| sink.enable-delete          | TRUE          | N        | Whether to enable deletion. This option requires the Doris table to have the batch deletion feature enabled (enabled by default in Doris 0.15+ versions), and only supports the Unique model. |
| sink.enable-2pc             | TRUE          | N        | Whether to enable two-phase commit (2pc). The default is true, ensuring Exactly-Once semantics. For details about two-phase commit, refer to [here](https://doris.apache.org/zh-CN/docs/dev/data-operate/import/stream-load-manual.md). |
| sink.buffer-size            | 1MB           | N        | The size of the write data cache buffer, in bytes. It is not recommended to modify it, and the default configuration can be used. |
| sink.buffer-count           | 3             | N        | The number of write data cache buffers. It is not recommended to modify it, and the default configuration can be used. |
| sink.max-retries            | 3             | N        | The maximum number of retries after a Commit failure. The default is 3 times. |
| sink.enable.batch-mode      | FALSE         | N        | Whether to use the batch mode to write to Doris. After enabling, the writing timing does not rely on Checkpoint, and it is controlled by parameters such as sink.buffer-flush.max-rows, sink.buffer-flush.max-bytes, and sink.buffer-flush.interval. Meanwhile, after enabling, Exactly-once semantics will not be guaranteed, but idempotency can be achieved with the help of the Uniq model. |
| sink.flush.queue-size       | 2             | N        | The size of the cache queue in batch mode.                   |
| sink.buffer-flush.max-rows  | 500000        | N        | The maximum number of rows written in a single batch in batch mode. |
| sink.buffer-flush.max-bytes | 100MB         | N        | The maximum number of bytes written in a single batch in batch mode. |
| sink.buffer-flush.interval  | 10s           | N        | The interval for asynchronously flushing the cache in batch mode. |
| sink.ignore.update-before   | TRUE          | N        | Whether to ignore the update-before event. The default is to ignore it. |

#### Lookup Join Configuration

| Key                               | Default Value | Required | Comment                                                      |
| --------------------------------- | ------------- | -------- | ------------------------------------------------------------ |
| lookup.cache.max-rows             | -1            | N        | The maximum number of rows in the lookup cache. The default value is -1, which means the cache is not enabled. |
| lookup.cache.ttl                  | 10s           | N        | The maximum time for the lookup cache. The default is 10 seconds. |
| lookup.max-retries                | 1             | N        | The number of retries after a lookup query fails.            |
| lookup.jdbc.async                 | FALSE         | N        | Whether to enable asynchronous lookup. The default is false. |
| lookup.jdbc.read.batch.size       | 128           | N        | The maximum batch size for each query in asynchronous lookup. |
| lookup.jdbc.read.batch.queue-size | 256           | N        | The size of the intermediate buffer queue during asynchronous lookup. |
| lookup.jdbc.read.thread-size      | 3             | N        | The number of jdbc threads for lookup in each task.          |

#### Full Database Synchronization Configuration

**Syntax**

```Shell
<FLINK_HOME>bin/flink run \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.16-1.6.1.jar \
    <mysql-sync-database|oracle-sync-database|postgres-sync-database|sqlserver-sync-database|mongodb-sync-database> \
    --database <doris-database-name> \
    [--job-name <flink-job-name>] \
    [--table-prefix <doris-table-prefix>] \
    [--table-suffix <doris-table-suffix>] \
    [--including-tables <mysql-table-name|name-regular-expr>] \
    [--excluding-tables <mysql-table-name|name-regular-expr>] \
    --mysql-conf <mysql-cdc-source-conf> [--mysql-conf <mysql-cdc-source-conf> ...] \
    --oracle-conf <oracle-cdc-source-conf> [--oracle-conf <oracle-cdc-source-conf> ...] \
    --postgres-conf <postgres-cdc-source-conf> [--postgres-conf <postgres-cdc-source-conf> ...] \
    --sqlserver-conf <sqlserver-cdc-source-conf> [--sqlserver-conf <sqlserver-cdc-source-conf> ...] \
    --sink-conf <doris-sink-conf> [--table-conf <doris-sink-conf> ...] \
    [--table-conf <doris-table-conf> [--table-conf <doris-table-conf> ...]]
```

**Configuration**

| Key                     | Comment                                                      |
| ----------------------- | ------------------------------------------------------------ |
| --job-name              | The name of the Flink task, which is optional.               |
| --database              | The name of the database synchronized to Doris.              |
| --table-prefix          | The prefix name of the Doris table, for example, --table-prefix ods_. |
| --table-suffix          | The suffix name of the Doris table, similar to the prefix.   |
| --including-tables      | The MySQL tables that need to be synchronized. Multiple tables can be separated by \|, and regular expressions are supported. For example, --including-tables table1. |
| --excluding-tables      | The tables that do not need to be synchronized. The usage is the same as that of --including-tables. |
| --mysql-conf            | The configuration of the MySQL CDCSource, for example, --mysql-conf hostname=127.0.0.1. You can view all the configurations of MySQL-CDC [here](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mysql-cdc/). Among them, hostname, username, password, and database-name are required. When the synchronized database and table contain non-primary key tables, scan.incremental.snapshot.chunk.key-column must be set, and only one non-null type field can be selected. For example: scan.incremental.snapshot.chunk.key-column=database.table:column,database.table1:column..., and columns of different databases and tables are separated by commas. |
| --oracle-conf           | The configuration of the Oracle CDCSource, for example, --oracle-conf hostname=127.0.0.1. You can view all the configurations of Oracle-CDC [here](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/oracle-cdc/). Among them, hostname, username, password, database-name, and schema-name are required. |
| --postgres-conf         | The configuration of the Postgres CDCSource, for example, --postgres-conf hostname=127.0.0.1. You can view all the configurations of Postgres-CDC [here](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/postgres-cdc/). Among them, hostname, username, password, database-name, schema-name, and slot.name are required. |
| --sqlserver-conf        | The configuration of the SQLServer CDCSource, for example, --sqlserver-conf hostname=127.0.0.1. You can view all the configurations of SQLServer-CDC [here](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/sqlserver-cdc/). Among them, hostname, username, password, database-name, and schema-name are required. |
| --db2-conf              | The configuration of the SQLServer CDCSource, for example, --db2-conf hostname=127.0.0.1. You can view all the configurations of DB2-CDC [here](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/db2-cdc/). Among them, hostname, username, password, database-name, and schema-name are required. |
| --sink-conf             | All the configurations of the Doris Sink can be viewed [here](https://doris.apache.org/zh-CN/docs/dev/ecosystem/flink-doris-connector/#General Configuration Items). |
| --mongodb-conf          | The configuration of the MongoDB CDCSource, for example, --mongodb-conf hosts=127.0.0.1:27017. You can view all the configurations of Mongo-CDC [here](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.0/docs/connectors/flink-sources/mongodb-cdc/). Among them, hosts, username, password, and database are required. --mongodb-conf schema.sample-percent is the configuration for automatically sampling MongoDB data to create tables in Doris, and the default value is 0.2. |
| --table-conf            | The configuration items of the Doris table, that is, the content included in properties (except for table-buckets, which is not a properties attribute). For example, --table-conf replication_num=1, and --table-conf table-buckets="tbl1:10,tbl2:20,a.*:30,b.*:40,.*:50" means specifying the number of buckets for different tables in the order of regular expressions. If there is no match, the BUCKETS AUTO method will be used to create tables. |
| --schema-change-mode    | The modes for parsing schema change, including debezium_structure and sql_parser. The debezium_structure mode is used by default. The debezium_structure mode parses the data structure used when the upstream CDC synchronizes data and judges DDL change operations by parsing this structure. The sql_parser mode parses the DDL statements when the upstream CDC synchronizes data to judge DDL change operations, so this parsing mode is more accurate. Usage example: --schema-change-mode debezium_structure. This function will be available in versions after 24.0.0. |
| --single-sink           | Whether to use a single Sink to synchronize all tables. After enabling, it can also automatically identify newly created tables upstream and create tables automatically. |
| --multi-to-one-origin   | The configuration of the source tables when multiple upstream tables are written to the same table, for example: --multi-to-one-origin "a\_.\*\|b_.\*", refer to [#208](https://github.com/apache/doris-flink-connector/pull/208) |
| --multi-to-one-target   | Used in combination with multi-to-one-origin, the configuration of the target table, for example: --multi-to-one-target "a\|b" |
| --create-table-only     | Whether to only synchronize the structure of the table.      |

### Type Mapping

| Doris Type | Flink Type |
| ---------- | ---------- |
| NULL_TYPE  | NULL       |
| BOOLEAN    | BOOLEAN    |
| TINYINT    | TINYINT    |
| SMALLINT   | SMALLINT   |
| INT        | INT        |
| BIGINT     | BIGINT     |
| FLOAT      | FLOAT      |
| DOUBLE     | DOUBLE     |
| DATE       | DATE       |
| DATETIME   | TIMESTAMP  |
| DECIMAL    | DECIMAL    |
| CHAR       | STRING     |
| LARGEINT   | STRING     |
| VARCHAR    | STRING     |
| STRING     | STRING     |
| DECIMALV2  | DECIMAL    |
| ARRAY      | ARRAY      |
| MAP        | STRING     |
| JSON       | STRING     |
| VARIANT    | STRING     |
| IPV4       | STRING     |
| IPV6       | STRING     |

### Monitoring Metrics

Flink provides multiple [Metrics](https://nightlies.apache.org/flink/flink-docs-master/docs/ops/metrics/#metrics) for monitoring the indicators of the Flink cluster. The following are the newly added monitoring metrics for the Flink Doris Connector.

| Name                      | Metric Type | Description                                                  |
| ------------------------- | ----------- | ------------------------------------------------------------ |
| totalFlushLoadBytes       | Counter     | The total number of bytes that have been flushed and imported. |
| flushTotalNumberRows      | Counter     | The total number of rows that have been imported and processed. |
| totalFlushLoadedRows      | Counter     | The total number of rows that have been successfully imported. |
| totalFlushTimeMs          | Counter     | The total time taken for successful imports to complete.     |
| totalFlushSucceededNumber | Counter     | The number of times that imports have been successfully completed. |
| totalFlushFailedNumber    | Counter     | The number of times that imports have failed.                |
| totalFlushFilteredRows    | Counter     | The total number of rows with unqualified data quality.      |
| totalFlushUnselectedRows  | Counter     | The total number of rows filtered by the where condition.    |
| beginTxnTimeMs            | Histogram   | The time taken to request the Fe to start a transaction, in milliseconds. |
| putDataTimeMs             | Histogram   | The time taken to request the Fe to obtain the import data execution plan. |
| readDataTimeMs            | Histogram   | The time taken to read data.                                 |
| writeDataTimeMs           | Histogram   | The time taken to execute the write data operation.          |
| commitAndPublishTimeMs    | Histogram   | The time taken to request the Fe to commit and publish the transaction. |
| loadTimeMs                | Histogram   | The time taken for the import to complete.                   |

 

## Best Practices

### FlinkSQL Quickly Connects to MySQL Data via CDC

```SQL
-- enable checkpoint
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

-- Supports synchronizing insert/update/delete events
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
  'sink.enable-delete' = 'true',  -- Synchronize delete events
  'sink.label-prefix' = 'doris_label'
);

insert into doris_sink select id,name from cdc_mysql_source;
```

### Flink Performs Partial Column Updates

```SQL
CREATE TABLE doris_sink (
    id INT,
    name STRING,
    bank STRING,
    age int
) 
WITH (
  'connector' = 'doris',
  'fenodes' = '127.0.0.1:8030',
  'table.identifier' = 'database.table',
  'username' = 'root',
  'password' = '',
  'sink.properties.format' = 'json',
  'sink.properties.read_json_by_line' = 'true',
  'sink.properties.columns' = 'id,name,bank,age', -- Columns that need to be updated
  'sink.properties.partial_columns' = 'true' -- Enable partial column updates
);
```

### Flink Imports Bitmap Data

```SQL
CREATE TABLE bitmap_sink (
dt int,
page string,
user_id int 
)
WITH (
  'connector' = 'doris',
  'fenodes' = '127.0.0.1:8030',
  'table.identifier' = 'test.bitmap_test',
  'username' = 'root',
  'password' = '',
  'sink.label-prefix' = 'doris_label',
  'sink.properties.columns' = 'dt,page,user_id,user_id=to_bitmap(user_id)'
)
```

### FlinkCDC Updates Key Columns

Generally, in a business database, a number is often used as the primary key of a table. For example, for the Student table, the number (id) is used as the primary key. However, as the business develops, the number corresponding to the data may change. In this scenario, when using Flink CDC + Doris Connector to synchronize data, the data of the primary key column in Doris can be automatically updated.

**Principle**

The underlying collection tool of Flink CDC is Debezium. Debezium internally uses the op field to identify corresponding operations. The values of the op field are c, u, d, and r, corresponding to create, update, delete, and read respectively. For the update of the primary key column, Flink CDC will send DELETE and INSERT events downstream, and the data of the primary key column in Doris will be automatically updated after the data is synchronized to Doris.

**Usage**

The Flink program can refer to the above CDC synchronization examples. After successfully submitting the task, execute the statement to update the primary key column on the MySQL side (for example, update student set id = '1002' where id = '1001'), and then the data in Doris can be modified.

### Flink Deletes Data According to Specified Columns

Generally, messages in Kafka use specific fields to mark the operation type, such as {"op_type":"delete",data:{...}}. For this kind of data, it is hoped to delete the data with op_type=delete.



The DorisSink will, by default, distinguish the types of events according to RowKind. Usually, in the case of CDC, the event type can be directly obtained, and the hidden column `__DORIS_DELETE_SIGN__` can be assigned a value to achieve the purpose of deletion. However, for Kafka, it is necessary to judge according to the business logic and explicitly pass in the value of the hidden column.

```SQL
-- For example, the upstream data:{"op_type":"delete",data:{"id":1,"name":"zhangsan"}}
CREATE TABLE KAFKA_SOURCE(
  data STRING,
  op_type STRING
) WITH (
  'connector' = 'kafka',
  ...
);

CREATE TABLE DORIS_SINK(
  id INT,
  name STRING,
  __DORIS_DELETE_SIGN__ INT
) WITH (
  'connector' = 'doris',
  'fenodes' = '127.0.0.1:8030',
  'table.identifier' = 'db.table',
  'username' = 'root',
  'password' = '',
  'sink.enable-delete' = 'false',        -- false means not to obtain the event type from RowKind
  'sink.properties.columns' = 'id, name, __DORIS_DELETE_SIGN__'  -- Explicitly specify the import columns of streamload
);

INSERT INTO DORIS_SINK
SELECT json_value(data,'$.id') as id,
json_value(data,'$.name') as name, 
if(op_type='delete',1,0) as __DORIS_DELETE_SIGN__ 
from KAFKA_SOURCE;
```

### Flink CDC Synchronize DDL Statements
Generally, when synchronizing upstream data sources such as MySQL, when adding or deleting fields in the upstream, you need to synchronize the Schema Change operation in Doris.

For this scenario, you usually need to write a program for the DataStream API and use the JsonDebeziumSchemaSerializer serializer provided by DorisSink to automatically perform SchemaChange. For details, please refer to [CDCSchemaChangeExample.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/CDCSchemaChangeExample.java)

In the whole database synchronization tool provided by the Connector, no additional configuration is required, and the upstream DDL will be automatically synchronized and the SchemaChange operation will be performed in Doris.

## Frequently Asked Questions (FAQ)

1. **errCode = 2, detailMessage = Label [label_0_1] has already been used, relate to txn [19650]**

   In the Exactly-Once scenario, the Flink Job must be restarted from the latest Checkpoint/Savepoint, otherwise the above error will be reported. When Exactly-Once is not required, this problem can also be solved by disabling 2PC submission (sink.enable-2pc=false) or changing to a different sink.label-prefix.

2. **errCode = 2, detailMessage = transaction [19650] not found**

   This occurs during the Commit stage. The transaction ID recorded in the checkpoint has expired on the FE side. When committing again at this time, the above error will occur. At this point, it's impossible to start from the checkpoint. Subsequently, you can extend the expiration time by modifying the `streaming_label_keep_max_second` configuration in `fe.conf`. The default expiration time is 12 hours. After doris version 2.0, it will also be limited by the `label_num_threshold` configuration in `fe.conf` (default 2000), which can be increased or changed to -1 (-1 means only limited by time).


3. **errCode = 2, detailMessage = current running txns on db 10006 is 100, larger than limit 100**

   This is because the concurrent imports into the same database exceed 100. It can be solved by adjusting the parameter `max_running_txn_num_per_db` in `fe.conf`. For specific details, please refer to [max_running_txn_num_per_db](https://doris.apache.org/zh-CN/docs/dev/admin-manual/config/fe-config/#max_running_txn_num_per_db).

   Meanwhile, frequently modifying the label and restarting a task may also lead to this error. In the 2pc scenario (for Duplicate/Aggregate models), the label of each task needs to be unique. And when restarting from a checkpoint, the Flink task will actively abort the transactions that have been pre-committed successfully but not yet committed. Frequent label modifications and restarts will result in a large number of pre-committed successful transactions that cannot be aborted and thus occupy transactions. In the Unique model, 2pc can also be disabled to achieve idempotent writes.

4. **tablet writer write failed, tablet_id=190958, txn_id=3505530, err=-235**

   This usually occurs before Connector version 1.1.0 and is caused by too high a writing frequency, which leads to an excessive number of versions. You can reduce the frequency of Streamload by setting the `sink.batch.size` and `sink.batch.interval` parameters. After Connector version 1.1.0, the default writing timing is controlled by Checkpoint, and you can reduce the writing frequency by increasing the Checkpoint interval.

5. **How to skip dirty data when Flink is importing?**

   When Flink imports data, if there is dirty data, such as issues with field formats or lengths, it will cause StreamLoad to report errors. At this time, Flink will keep retrying. If you need to skip such data, you can disable the strict mode of StreamLoad (by setting `strict_mode=false` and `max_filter_ratio=1`) or filter the data before the Sink operator.

6. **How to configure when the network between Flink machines and BE machines is not connected?**

   When Flink initiates writing to Doris, Doris will redirect the write operation to BE. At this time, the returned address is the internal network IP of BE, which is the IP seen through the `show backends` command. If Flink and Doris have no network connectivity at this time, an error will be reported. In this case, you can configure the external network IP of BE in `benodes`.

7. **stream load error: HTTP/1.1 307 Temporary Redirect**

   Flink will first request FE, and after receiving 307, it will request BE after redirection. When FE is in FullGC/high pressure/network delay, HttpClient will send data without waiting for a response within a certain period of time (3 seconds) by default. Since the request body is InputStream by default, when a 307 response is received, the data cannot be replayed and an error will be reported directly. There are three ways to solve this problem: 1. Upgrade to Connector25.1.0 or above to increase the default time; 2. Modify auto-redirect=false to directly initiate a request to BE (not applicable to some cloud scenarios); 3. The unique key model can enable batch mode.