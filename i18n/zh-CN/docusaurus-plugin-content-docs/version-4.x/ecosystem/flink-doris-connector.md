---
{
    "title": "Flink Doris Connector",
    "language": "zh-CN",
    "description": "Flink Doris Connector是通过 Flink 来读取和写入数据到 Doris 集群，同时集成了FlinkCDC，可以更便捷的对上游 MySQL 等数据库进行整库同步。"
}
---

[Flink Doris Connector](https://github.com/apache/doris-flink-connector)是通过 Flink 来读取和写入数据到 Doris 集群，同时集成了[FlinkCDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/)，可以更便捷的对上游 MySQL 等数据库进行整库同步。

使用 FlinkConnector 可以完成以下操作：

- 读取 Doris 中的数据：Flink Connector 支持从 BE 中并行读取数据，提高了数据读取的效率；
  
- 向 Doris 中写入数据：在 Flink 中进行攒批后，通过 Stream Load 批量导入到 Doris 中；
  
- 使用 Lookup Join 方式进行维表关联：通过攒批与异步查询加速维表关联的性能；
  
- 整库同步：通过 FlinkCDC 完成 MySQL、Oracle、PostgreSQL 等数据库的整库同步，包含自动建表与 DDL 操作。


## 版本说明

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
| 25.0.0            | 1.15,1.16,1.17,1.18,1.19,1.20 | 1.0+ | 8 |- |
| 25.1.0            | 1.15,1.16,1.17,1.18,1.19,1.20 | 1.0+ | 8 |- |

## 使用方式

可以分别使用 Jar 方式和 Maven 方式使用 Flink Doris Connector。

#### Jar

可在[这里](https://doris.apache.org/download#doris-ecosystem)下载 Flink Doris Connector 对应版本的 Jar 包，将此文件复制到 `Flink` 的 `classpath` 中即可使用 `Flink-Doris-Connector` 。 `Standalone` 模式运行的 `Flink` ，将此文件放入 `lib/` 文件夹下。 `Yarn` 集群模式运行的 `Flink` ，则将此文件放入预部署包中。

#### Maven

Maven 中使用的时候，可以直接在 Pom 文件中加入如下依赖

```xml
<dependency>
  <groupId>org.apache.doris</groupId>
  <artifactId>flink-doris-connector-${flink.version}</artifactId>
  <version>${connector.version}</version>
</dependency> 
```

例如：

```xml
<dependency>
  <groupId>org.apache.doris</groupId>
  <artifactId>flink-doris-connector-1.16</artifactId>
  <version>25.1.0</version>
</dependency> 
```

## 使用原理

### 从 Doris 中读取数据

![FlinkConnectorPrinciples-JDBC-Doris](/images/ecomsystem/flink-connector/FlinkConnectorPrinciples-JDBC-Doris.png)

在读取数据时，相较于 Flink JDBC Connector，Flink Doris Connector 具备更高的性能，推荐优先使用：

- Flink JDBC Connector：虽然 Doris 兼容 MySQL 协议，但不建议通过 Flink JDBC Connector 读写 Doris 集群。此方式会导致数据在单个 FE 节点上串行读写，形成瓶颈，影响性能。
  
- Flink Doris Connector：自 Doris 2.1 版本后，默认使用 ADBC 协议作为 Flink Doris Connector 读取协议，读取时经过以下步骤：
  
  a. Flink Doris Connector 首先从 FE 获取查询计划中的 Tablet ID 信息
     
  b. 生成查询语句 SELECT * FROM tbs TABLET(id1, id2, id3)
     
  c. 然后通过 FE 的 ADBC 端口执行查询
     
  d. 由 BE 直接返回数据，避免数据流经 FE，从而消除 FE 单点瓶颈
 
     
### 向 Doris 中写入数据

在使用 Flink Doris Connector 写入数据时，会在 Flink 内存中进行攒批操作，在通过 Stream Load 批量导入。Doris Flink Connector 提供了两种攒批模式，默认使用基于 Flink Checkpoint 的流式写入方式：

|          | 流式写入 | 批量写入 |
|----------|----------|----------|
| **触发条件** | 依赖 Flink 的 Checkpoint，跟随 Flink 的 Checkpoint 周期写入到 Doris 中 | 基于 Connector 内的时间阈值、数据量阈值进行周期性提交，写入到 Doris 中 |
| **一致性** | Exactly-Once | At-Least-Once，基于主键模型可以保证 Exactly-Once |
| **延迟** | 受 Checkpoint 时间间隔限制，通常较高 | 独立的批处理机制，灵活调整 |
| **容错与恢复** | 与 Flink 状态恢复完全一致 | 依赖外部去重逻辑（如 Doris 主键去重） |


## 快速上手

#### 准备工作

#### Flink 集群部署

以 Standalone 集群为例：

1. 下载 Flink 的安装包，[Flink 1.18.1](https://archive.apache.org/dist/flink/flink-1.18.1/flink-1.18.1-bin-scala_2.12.tgz);
2. 解压后，将 Flink Doris Connector 包放到 <FLINK_HOME>/lib 下;
3. 进入 <FLINK_HOME>目录，运行 bin/start-cluster.sh 启动 Flink 集群;
4. 可通过 jps 命令验证 Flink 集群是否成功启动。

#### 初始化 Doris 表

运行以下语句创建 Doris 表

```SQL
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

#### 运行 FlinkSQL 任务

**启动 FlinkSQL Client**

```sql
bin/sql-client.sh
```

**运行 FlinkSQL**

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

#### 查询数据

```
mysql> select * from test.student_trans;
+------+--------------+------+
| id   | name         | age  |
+------+--------------+------+
|    1 | prefix_James |   19 |
|    2 | prefix_Emily |   29 |
+------+--------------+------+
2 rows in set (0.02 sec)
```

## 场景与操作

### 读取 Doris 中的数据

Flink 读取 Doris 中数据时，目前 Doris Source 是有界流，不支持以 CDC 的方式持续读取。可以通过 Thrift 和 ArrowFlightSQL 方式 (24.0.0 版本之后支持) 读取 Doris 中数据，2.1 版本后推荐使用 ArrowFlightSQL 方式：

- Thrift：通过调用 BE 的 thrift 接口读取数据，具体流程可参考 [通过 Thrift 接口读取数据](https://github.com/apache/doris/blob/master/samples/doris-demo/doris-source-demo/README.md)

- ArrowFlightSQL：基于 Doris2.1，通过 Arrow Flight SQL 协议高速读取大批量数据，具体可参考 [基于 Arrow Flight SQL 的高速数据传输链路](https://doris.apache.org/docs/dev/db-connect/arrow-flight-sql-connect/)。

#### 使用 FlinkSQL 读取数据

##### Thrift 方式

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

##### ArrowFlightSQL 方式

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

#### 使用 DataStream API 读取数据

使用 DataStream API 读取时，需要提前在程序 POM 文件中引入依赖，参考使用方式章节

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

完整代码参考：[DorisSourceDataStream.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/DorisSourceDataStream.java)

### 向 Doris 中写入数据

Flink 写入使用 Stream Load 的方式进行写入，支持流式写入和攒批写入模式。

:::info 流式写入和攒批写入区别

Connector1.5.0 之后支持攒批写入，攒批写入不依赖 Checkpoint，将数据缓存在内存中，根据攒批参数来控制写入时机。流式写入必须开启 Checkpoint，在整个 Checkpoint 期间持续的将上游数据写入到 Doris 中，不会一直将数据缓存在内存中。

:::

#### 使用 FlinkSQL 写入数据

写入测试使用 Flink 的 [Datagen](https://nightlies.apache.org/flink/flink-docs-master/docs/connectors/table/datagen/) 来模拟上游持续产生的数据

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
      --'sink.enable.batch-mode' = 'true'  增加该配置可以走攒批写入
);

INSERT INTO student_sink SELECT * FROM student_source;
```

#### 使用 DataStream API 写入数据

通过 DataStream api 写入的时候，可以使用不同的序列化方式对上游数据序列化后写入 Doris 表。

:::info

Connector 内部已经包含 HttpClient4.5.13 版本，如果项目中有单独引用 HttpClient，需要确保版本一致。

:::

##### 普通 String 格式

当上游是 csv 或 json 数据格式时，可以直接使用 SimpleStringSerializer 序列化数据。

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
// 上游是json数据的时候，需要开启以下配置
properties.setProperty("read_json_by_line", "true");
properties.setProperty("format", "json");
    
// 上游是 csv 写入时，需要开启配置
//properties.setProperty("format", "csv");
//properties.setProperty("column_separator", ",");
    
DorisExecutionOptions executionOptions = DorisExecutionOptions.builder()
       .setLabelPrefix("label-doris")
       .setDeletable(false)
       //.setBatchMode(true)  开启攒批写入
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

完整代码参考：[DorisSinkExample.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/DorisSinkExample.java)

##### RowData 格式

RowData 是 Flink 内部的格式，如果上游传入的是 RowData 格式，则需要使用 RowDataSerializer 序列化数据。

```Java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(10000);
env.setParallelism(1);

DorisSink.Builder<RowData> builder = DorisSink.builder();

Properties properties = new Properties();
properties.setProperty("column_separator", ",");
properties.setProperty("line_delimiter", "\n");
properties.setProperty("format", "csv");
// 上游是 json 写入时，需要开启配置
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

完整代码参考：[DorisSinkExampleRowData.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/DorisSinkExampleRowData.java) 

##### Debezium 格式

对于上游是 Debezium 数据格式的数据，如 FlinkCDC 或 Kafka 中 Debezium 格式数据，可以使用 JsonDebeziumSchemaSerializer 序列化。

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

完整代码参考：[CDCSchemaChangeExample.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/CDCSchemaChangeExample.java)

##### 多表写入格式

目前 DorisSink 支持单个 Sink 同步多张表，需要将数据以及库表一起传递给 Sink，使用 RecordWithMetaSerializer 序列化即可。

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

完整代码参考：[DorisSinkMultiTableExample.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/DorisSinkMultiTableExample.java)

### Lookup Join

使用 Lookup Join 的能力可以优化 Flink 中维表关联的性能。当使用 Flink JDBC Connector 进行维表关联时，会遇到以下问题：

- Flink JDBC Connector 采用同步查询模式，即上游数据（如 Kafka）发送一条数据后，会立即查询 Doris 维表，导致高并发场景下查询延迟较高。
  
- JDBC 方式执行的查询通常是 逐条点查，Doris 更推荐批量查询以提升查询效率。

使用 [Lookup Join](https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/dev/table/sql/queries/joins/#lookup-join) 的方式进行维表关联，在 Flink Doris Connector 中具有以下优势：

- 批量缓存上游数据，避免逐条查询带来的高延迟和数据库压力。

- 异步执行关联查询，提升数据吞吐量并减少 Doris 查询负载。

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

### 整库同步

Flink Doris Connector 中集成了[Flink CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/)，可以更便捷的将 MySQL 等关系型数据库同步到 Doris 中，同时包含自动创建表，Schema Change 等。目前支持同步的数据库包括：MySQL、Oracle、PostgreSQL、SQLServer、MongoDB、DB2。

:::info 注意

1. 使用整库同步时需要在 `$FLINK_HOME/lib` 目录下添加对应的 Flink CDC 依赖 (**Fat Jar**)，比如 **`flink-sql-connector-mysql-cdc-${version}.jar`**，**`flink-sql-connector-oracle-cdc-${version}.jar`**，FlinkCDC 从 3.1 版本与之前版本不兼容，下载地址分别为为[FlinkCDC3.x](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/)，[FlinkCDC 2.x](https://repo.maven.apache.org/maven2/com/ververica/flink-sql-connector-mysql-cdc/)。
2. Connector 24.0.0 之后依赖的 Flink CDC 版本需要在 3.1 以上，下载地址见[这里](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/)，FlinkCDC 如果需使用 Flink CDC 同步 MySQL 和 Oracle，还需要在 `$FLINK_HOME/lib` 下增加相关的 JDBC 驱动。

:::

#### MySQL 整库同步

启动 Flink 集群后，可直接运行一下命令。

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

#### Oracle 整库同步

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

#### PostgreSQL 整库同步

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

#### SQLServer 整库同步

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

#### DB2 整库同步

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

#### MongoDB 整库同步

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

#### AWS Aurora MySQL 整库同步

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

#### AWS RDS MySQL 整库同步

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

## 使用说明

### 参数配置

#### 通用配置项

| Key                           | Default Value | Required | Comment                                                      |
| ----------------------------- | ------------- | -------- | ------------------------------------------------------------ |
| fenodes                       | --            | Y        | Doris FE http 地址，支持多个地址，使用逗号分隔               |
| benodes                       | --            | N        | Doris BE http 地址，支持多个地址，使用逗号分隔 |
| jdbc-url                      | --            | N        | jdbc 连接信息，如：jdbc:mysql://127.0.0.1:9030               |
| table.identifier              | --            | Y        | Doris 表名，如：db.tbl                                       |
| username                      | --            | Y        | 访问 Doris 的用户名                                          |
| password                      | --            | Y        | 访问 Doris 的密码                                            |
| auto-redirect                 | TRUE          | N        | 是否重定向 StreamLoad 请求。开启后 StreamLoad 将通过 FE 写入，不再显示获取 BE 信息 |
| doris.request.retries         | 3             | N        | 向 Doris 发送请求的重试次数                                  |
| doris.request.connect.timeout | 30s           | N        | 向 Doris 发送请求的连接超时时间                              |
| doris.request.read.timeout    | 30s           | N        | 向 Doris 发送请求的读取超时时间                              |

#### Source 配置项

| Key                           | Default Value | Required | Comment                                                      |
| ----------------------------- | ------------- | -------- | ------------------------------------------------------------ |
| doris.request.query.timeout   | 21600s        | N        | 查询 Doris 的超时时间，默认值为 6 小时                       |
| doris.request.tablet.size     | 1             | N        | 一个 Partition 对应的 Doris Tablet 个数。此数值设置越小，则会生成越多的 Partition。从而提升 Flink 侧的并行度，但同时会对 Doris 造成更大的压力。 |
| doris.batch.size              | 4064          | N        | 一次从 BE 读取数据的最大行数。增大此数值可减少 Flink 与 Doris 之间建立连接的次数。从而减轻网络延迟所带来的额外时间开销。 |
| doris.exec.mem.limit          | 8192mb        | N        | 单个查询的内存限制。默认为 8GB，单位为字节                   |
| source.use-flight-sql         | FALSE         | N        | 是否使用 Arrow Flight SQL 读取                               |
| source.flight-sql-port        | -             | N        | 使用 Arrow Flight SQL 读取时，FE 的 arrow_flight_sql_port    |

**DataStream 专有配置项**

| Key                | Default Value | Required | Comment                                                      |
| ------------------ | ------------- | -------- | ------------------------------------------------------------ |
| doris.read.field   | --            | N        | 读取 Doris 表的列名列表，多列之间使用逗号分隔                |
| doris.filter.query | --            | N        | 过滤读取数据的表达式，此表达式透传给 Doris。Doris 使用此表达式完成源端数据过滤。比如 age=18。 |

#### Sink 配置项

| Key                         | Default Value | Required | Comment                                                      |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------ |
| sink.label-prefix           | --            | Y        | Stream load 导入使用的 label 前缀。2pc 场景下要求全局唯一，用来保证 Flink 的 EOS 语义。 |
| sink.properties.*           | --            | N        | Stream Load 的导入参数。例如： 'sink.properties.column_separator' = ', ' 定义列分隔符， 'sink.properties.escape_delimiters' = 'true' 特殊字符作为分隔符，\x01 会被转换为二进制的 0x01。JSON 格式导入 'sink.properties.format' = 'json' , 'sink.properties.read_json_by_line' = 'true' 详细参数参考[这里](../data-operate/import/import-way/stream-load-manual.md#导入配置参数)。Group Commit 模式 例如：'sink.properties.group_commit' = 'sync_mode' 设置 group commit 为同步模式。flink connector 从 1.6.2 开始支持导入配置 group commit，详细使用和限制参考 [group commit](../data-operate/import/group-commit-manual.md) 。 |
| sink.enable-delete          | TRUE          | N        | 是否启用删除。此选项需要 Doris 表开启批量删除功能 (Doris0.15+ 版本默认开启)，只支持 Unique 模型。 |
| sink.enable-2pc             | TRUE          | N        | 是否开启两阶段提交 (2pc)，默认为 true，保证 Exactly-Once 语义。关于两阶段提交可参考[这里](../data-operate/transaction.md#streamload-2pc)。 |
| sink.buffer-size            | 1MB           | N        | 写数据缓存 buffer 大小，单位字节。不建议修改，默认配置即可   |
| sink.buffer-count           | 3             | N        | 写数据缓存 buffer 个数。不建议修改，默认配置即可             |
| sink.max-retries            | 3             | N        | Commit 失败后的最大重试次数，默认 3 次                       |
| sink.enable.batch-mode      | FALSE         | N        | 是否使用攒批模式写入 Doris，开启后写入时机不依赖 Checkpoint，通过 sink.buffer-flush.max-rows/sink.buffer-flush.max-bytes/sink.buffer-flush.interval 参数来控制写入时机。同时开启后将不保证 Exactly-once 语义，可借助 Uniq 模型做到幂等 |
| sink.flush.queue-size       | 2             | N        | 攒批模式下，缓存的队列大小。                                 |
| sink.buffer-flush.max-rows  | 500000        | N        | 攒批模式下，单个批次最多写入的数据行数。                     |
| sink.buffer-flush.max-bytes | 100MB         | N        | 攒批模式下，单个批次最多写入的字节数。                       |
| sink.buffer-flush.interval  | 10s           | N        | 攒批模式下，异步刷新缓存的间隔                               |
| sink.ignore.update-before   | TRUE          | N        | 是否忽略 update-before 事件，默认忽略。                      |

#### Lookup Join 配置项

| Key                               | Default Value | Required | Comment                                      |
| --------------------------------- | ------------- | -------- | -------------------------------------------- |
| lookup.cache.max-rows             | -1            | N        | lookup 缓存的最大行数，默认值 -1，不开启缓存 |
| lookup.cache.ttl                  | 10s           | N        | lookup 缓存的最大时间，默认 10s              |
| lookup.max-retries                | 1             | N        | lookup 查询失败后的重试次数                  |
| lookup.jdbc.async                 | FALSE         | N        | 是否开启异步的 lookup，默认 false            |
| lookup.jdbc.read.batch.size       | 128           | N        | 异步 lookup 下，每次查询的最大批次大小       |
| lookup.jdbc.read.batch.queue-size | 256           | N        | 异步 lookup 时，中间缓冲队列的大小           |
| lookup.jdbc.read.thread-size      | 3             | N        | 每个 task 中 lookup 的 jdbc 线程数           |

#### 整库同步配置项

**语法**

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

**配置**

| Key                     | Comment                                                      |
| ----------------------- | ------------------------------------------------------------ |
| --job-name              | Flink 任务名称，非必需                                       |
| --database              | 同步到 Doris 的数据库名                                      |
| --table-prefix          | Doris 表前缀名，例如 --table-prefix ods_。                   |
| --table-suffix          | 同上，Doris 表的后缀名。                                     |
| --including-tables      | 需要同步的 MySQL 表，可以使用 \| 分隔多个表，并支持正则表达式。比如--including-tables table1 |
| --excluding-tables      | 不需要同步的表，用法同上。                                   |
| --mysql-conf            | MySQL CDCSource 配置，例如--mysql-conf hostname=127.0.0.1，您可以在[这里](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mysql-cdc/)查看所有配置 MySQL-CDC，其中 hostname/username/password/database-name 是必需的。同步的库表中含有非主键表时，必须设置 scan.incremental.snapshot.chunk.key-column，且只能选择非空类型的一个字段。例如：scan.incremental.snapshot.chunk.key-column=database.table:column,database.table1:column...，不同的库表列之间用，隔开。 |
| --oracle-conf           | Oracle CDCSource 配置，例如--oracle-conf hostname=127.0.0.1，您可以在[这里](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/oracle-cdc/)查看所有配置 Oracle-CDC，其中 hostname/username/password/database-name/schema-name 是必需的。 |
| --postgres-conf         | Postgres CDCSource 配置，例如--postgres-conf hostname=127.0.0.1，您可以在[这里](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/postgres-cdc/)查看所有配置 Postgres-CDC，其中 hostname/username/password/database-name/schema-name/slot.name 是必需的。 |
| --sqlserver-conf        | SQLServer CDCSource 配置，例如--sqlserver-conf hostname=127.0.0.1，您可以在[这里](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/sqlserver-cdc/)查看所有配置 SQLServer-CDC，其中 hostname/username/password/database-name/schema-name 是必需的。 |
| --db2-conf              | SQLServer CDCSource 配置，例如--db2-conf hostname=127.0.0.1，您可以在[这里](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/db2-cdc/)查看所有配置 DB2-CDC，其中 hostname/username/password/database-name/schema-name 是必需的。｜ |
| --sink-conf             | Doris Sink 的所有配置，可以在[这里](./flink-doris-connector.md#sink-配置项)查看完整的配置项。 |
| --mongodb-conf          | MongoDB CDCSource 配置，例如 --mongodb-conf hosts=127.0.0.1:27017，您可以在[这里](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mongodb-cdc/)查看所有配置 Mongo-CDC，其中 hosts/username/password/database 是必须的。其中 --mongodb-conf schema.sample-percent 为自动采样 mongodb 数据为 Doris 建表的配置，默认为 0.2 |
| --table-conf            | Doris 表的配置项，即 properties 中包含的内容（其中 table-buckets 例外，非 properties 属性）。例如 --table-conf replication_num=1，而 --table-conf table-buckets="tbl1:10,tbl2:20,a.*:30,b.*:40,.*:50"表示按照正则表达式顺序指定不同表的 buckets 数量，如果没有匹配到则采用 BUCKETS AUTO 建表。 |
| --schema-change-mode    | 解析 schema change 的模式，支持 debezium_structure、sql_parser 两种解析模式，默认采用 debezium_structure 模式。debezium_structure 解析上游 CDC 同步数据时所使用的数据结构，通过解析该结构判断 DDL 变更操作。sql_parser 通过解析上游 CDC 同步数据时的 DDL 语句，从而判断 DDL 变更操作，因此该解析模式更加准确。使用例子：--schema-change-mode debezium_structure。24.0.0 后支持 |
| --single-sink           | 是否使用单个 Sink 同步所有表，开启后也可自动识别上游新创建的表，自动创建表。 |
| --multi-to-one-origin   | 将上游多张表写入同一张表时，源表的配置，比如：--multi-to-one-origin "a\_.\*\|b_.\*"，具体参考[#208](https://github.com/apache/doris-flink-connector/pull/208) |
| --multi-to-one-target   | 与 multi-to-one-origin 搭配使用，目标表的配置，比如：--multi-to-one-target "a\|b" |
| --create-table-only     | 是否只仅仅同步表的结构                                       |

### 类型映射

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

### 监控指标

Flink 提供了多种[Metrics](https://nightlies.apache.org/flink/flink-docs-master/docs/ops/metrics/#metrics)用于监测 Flink 集群的指标，以下为 Flink Doris Connector 新增的监控指标。

| Name                      | Metric Type | Description                                  |
| ------------------------- | ----------- | -------------------------------------------- |
| totalFlushLoadBytes       | Counter     | 已经刷新导入的总字节数                       |
| flushTotalNumberRows      | Counter     | 已经导入处理的总行数                         |
| totalFlushLoadedRows      | Counter     | 已经成功导入的总行数                         |
| totalFlushTimeMs          | Counter     | 已经成功导入完成的总时间                     |
| totalFlushSucceededNumber | Counter     | 已经成功导入的次数                           |
| totalFlushFailedNumber    | Counter     | 失败导入 的次数                              |
| totalFlushFilteredRows    | Counter     | 数据质量不合格的总行数                       |
| totalFlushUnselectedRows  | Counter     | 被 where 条件过滤的总行数                    |
| beginTxnTimeMs            | Histogram   | 向 Fe 请求开始一个事务所花费的时间，单位毫秒 |
| putDataTimeMs             | Histogram   | 向 Fe 请求获取导入数据执行计划所花费的时间   |
| readDataTimeMs            | Histogram   | 读取数据所花费的时间                         |
| writeDataTimeMs           | Histogram   | 执行写入数据操作所花费的时间                 |
| commitAndPublishTimeMs    | Histogram   | 向 Fe 请求提交并且发布事务所花费的时间       |
| loadTimeMs                | Histogram   | 导入完成的时间                               |

 

## 最佳实践

### FlinkSQL 通过 CDC 快速接入 MySQL 数据

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

### Flink 进行部分列更新

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
  'sink.properties.columns' = 'id,name,bank,age', -- 需要更新的列
  'sink.properties.partial_columns' = 'true' -- 开启部分列更新
);
```

### Flink 导入 Bitmap 数据

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

### FlinkCDC 更新 key 列

一般在业务数据库中，会使用编号来作为表的主键，比如 Student 表，会使用编号 (id) 来作为主键，但是随着业务的发展，数据对应的编号有可能是会发生变化的。在这种场景下，使用 Flink CDC + Doris Connector 同步数据，便可以自动更新 Doris 主键列的数据。

**原理**

Flink CDC 底层的采集工具是 Debezium，Debezium 内部使用 op 字段来标识对应的操作：op 字段的取值分别为 c、u、d、r，分别对应 create、update、delete 和 read。而对于主键列的更新，Flink CDC 会向下游发送 DELETE 和 INSERT 事件，同时数据同步到 Doris 中后，就会自动更新主键列的数据。

**使用**

Flink 程序可参考上面 CDC 同步的示例，成功提交任务后，在 MySQL 侧执行 Update 主键列的语句 (update student set id = '1002' where id = '1001')，即可修改 Doris 中的数据。

### Flink 根据根据指定列删除数据

一般 Kafka 中的消息会使用特定字段来标记操作类型，比如{"op_type":"delete",data:{...}}。针对这类数据，希望将 op_type=delete 的数据删除掉。

DorisSink 默认会根据 RowKind 来区分事件的类型，通常这种在 cdc 情况下可以直接获取到事件类型，对隐藏列`DORIS_DELETE_SIGN`进行赋值达到删除的目的，而 Kafka 则需要根据业务逻辑判断，显示的传入隐藏列的值。

```SQL
-- 比如上游数据：{"op_type":"delete",data:{"id":1,"name":"zhangsan"}}
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
  'sink.enable-delete' = 'false',        -- false 表示不从 RowKind 获取事件类型
  'sink.properties.columns' = 'id, name, __DORIS_DELETE_SIGN__'  -- 显示指定 streamload 的导入列
);

INSERT INTO DORIS_SINK
SELECT json_value(data,'$.id') as id,
json_value(data,'$.name') as name, 
if(op_type='delete',1,0) as __DORIS_DELETE_SIGN__ 
from KAFKA_SOURCE;
```

### Flink CDC 同步 DDL 语句
一般同步 MySQL 等上游数据源的时候，上游增加或删除字段的时候需要同步在 Doris 中进行 Schema Change 操作。

对于这种场景，通常需要编写 DataStream API 的程序，同时使用 DorisSink 提供的 JsonDebeziumSchemaSerializer 序列化，便可以自动做到 SchemaChange，具体可参考[CDCSchemaChangeExample.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/CDCSchemaChangeExample.java)

在 Connector 提供的整库同步工具中，无需额外配置，自动会同步上游 DDL，并在 Doris 进行 SchemaChange 操作。


## FAQ

1. **errCode = 2, detailMessage = Label [label_0_1] has already been used, relate to txn [19650]**

   Exactly-Once 场景下，Flink Job 重启时必须从最新的 Checkpoint/Savepoint 启动，否则会报如上错误。不要求 Exactly-Once 时，也可通过关闭 2PC 提交（sink.enable-2pc=false）或更换不同的 sink.label-prefix 解决。

2. **errCode = 2, detailMessage = transaction [19650] not found**

    发生在 Commit 阶段，checkpoint 里面记录的事务 ID，在 FE 侧已经过期，此时再次 commit 就会出现上述错误。此时无法从 checkpoint 启动，后续可通过修改 fe.conf 的 `streaming_label_keep_max_second` 配置来延长过期时间，默认 12 小时。Doris2.0 版本后还会受到 fe.conf 中 `label_num_threshold` 配置的限制 (默认 2000) ，可以调大或者改为 -1（-1 表示只受时间限制）。


3. **errCode = 2, detailMessage = current running txns on db 10006 is 100, larger than limit 100**

   这是因为同一个库并发导入超过了 100，可通过调整 fe.conf 的参数 `max_running_txn_num_per_db` 来解决，具体可参考 [max_running_txn_num_per_db](../admin-manual/config/fe-config#max_running_txn_num_per_db)。
   同时，一个任务频繁修改 label 重启，也可能会导致这个错误。2pc 场景下 (Duplicate/Aggregate 模型)，每个任务的 label 需要唯一，并且从 checkpoint 重启时，flink 任务才会主动 abort 掉之前已经 precommit 成功，没有 commit 的 txn，频繁修改 label 重启，会导致大量 precommit 成功的 txn 无法被 abort，占用事务。在 Unique 模型下也可关闭 2pc，可以实现幂等写入。

4. **tablet writer write failed, tablet_id=190958, txn_id=3505530, err=-235**

   通常发生在 Connector1.1.0 之前，是由于写入频率过快，导致版本过多。可以通过设置 sink.batch.size 和 sink.batch.interval 参数来降低 Streamload 的频率。在 Connector1.1.0 之后，默认写入时机是由 Checkpoint 控制，可以通过增加 Checkpoint 间隔来降低写入频率。频率。

5. **Flink 导入有脏数据，如何跳过？**

   Flink 在数据导入时，如果有脏数据，比如字段格式、长度等问题，会导致 StreamLoad 报错，此时 Flink 会不断的重试。如果需要跳过，可以通过禁用 StreamLoad 的严格模式 (strict_mode=false,max_filter_ratio=1) 或者在 Sink 算子之前对数据做过滤。

6. **Flink 机器与 BE 机器的网络不通，如何配置？**

   Flink 向 Doris 发起写入时，Doris 会重定向到 BE 进行写入，此时返回的地址是 BE 的内网 IP，即通过即通过`show backends`看到的 IP，此时 Flink 与 Doris 网络不通的，会报错。这时可以在 benodes 中配置 BE 的外网 IP 即可。

7. **stream load error: HTTP/1.1 307 Temporary Redirect**
   
   Flink 会先向 FE 请求，收到 307 后会向重定向后的 BE 请求。当 FE 在 FullGC/压力大/网络延迟的时候，HttpClient 默认会在一定时间 (3 秒) 没有等到响应会发送数据，由于默认情况下请求体是 InputStream，当收到 307 响应时，数据无法重放，会直接报错。有三种方式可以解决：1.升级到 Connector25.1.0 以上，调长了默认时间；2.修改 auto-redirect=false，直接向 BE 发起请求（不适用部分云上场景）；3.主键模型可以开启攒批模式。
