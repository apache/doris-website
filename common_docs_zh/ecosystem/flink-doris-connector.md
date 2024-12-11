---
{

    "title": "Flink Doris Connector",
    "language": "zh-CN"

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

# Flink Doris Connector



[Flink Doris Connector](https://github.com/apache/doris-flink-connector) 可以支持通过 Flink 操作（读取、插入、修改、删除）Doris 中存储的数据。本文档介绍 Flink 如何通过 Datastream 和 SQL 操作 Doris。

>**注意：**
>
>1. 修改和删除只支持在 Unique Key 模型上
>2. 目前的删除是支持 Flink CDC 的方式接入数据实现自动删除，如果是其他数据接入的方式删除需要自己实现。Flink CDC 的数据删除使用方式参照本文档最后一节

## 版本兼容

| Connector Version | Flink Version       | Doris Version | Java Version | Scala Version |
|-------------------|---------------------| ------ | ---- | ----- |
| 1.0.3             | 1.11,1.12,1.13,1.14 | 0.15+  | 8    | 2.11,2.12 |
| 1.1.1             | 1.14                | 1.0+   | 8    | 2.11,2.12 |
| 1.2.1             | 1.15                | 1.0+   | 8    | -         |
| 1.3.0             | 1.16                | 1.0+   | 8    | -         |
| 1.4.0             | 1.15,1.16,1.17      | 1.0+   | 8   |- |
| 1.5.2             | 1.15,1.16,1.17,1.18 | 1.0+ | 8 |- |
| 1.6.2             | 1.15,1.16,1.17,1.18,1.19 | 1.0+ | 8 |- |
| 24.0.1            | 1.15,1.16,1.17,1.18,1.19,1.20 | 1.0+ | 8 |- |

## 使用

### Maven

添加 flink-doris-connector

```
<!-- flink-doris-connector -->
<dependency>
  <groupId>org.apache.doris</groupId>
  <artifactId>flink-doris-connector-1.16</artifactId>
  <version>24.0.1</version>
</dependency>  
```

**备注**

1.请根据不同的 Flink 版本替换对应的 Connector 和 Flink 依赖版本。

2.也可从[这里](https://repo.maven.apache.org/maven2/org/apache/doris/)下载相关版本 jar 包。 

### 编译

编译时，可直接运行`sh build.sh`，具体可参考[这里](https://github.com/apache/doris-flink-connector/blob/master/README.md)。

编译成功后，会在 `dist` 目录生成目标 jar 包，如：`flink-doris-connector-24.0.0-SNAPSHOT.jar`。
将此文件复制到 `Flink` 的 `classpath` 中即可使用 `Flink-Doris-Connector` 。例如， `Local` 模式运行的 `Flink` ，将此文件放入 `lib/` 文件夹下。 `Yarn` 集群模式运行的 `Flink` ，则将此文件放入预部署包中。

## 使用方法

### 读取

#### SQL

```sql
-- doris source
CREATE TABLE flink_doris_source (
    name STRING,
    age INT,
    price DECIMAL(5,2),
    sale DOUBLE
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = 'FE_IP:HTTP_PORT',
      'table.identifier' = 'database.table',
      'username' = 'root',
      'password' = 'password'
);
```
:::info 备注
Flink Connector 24.0.0 版本之后支持使用[Arrow Flight SQL](https://doris.apache.org/zh-CN/docs/dev/db-connect/arrow-flight-sql-connect/) 读取数据
:::
```sql
CREATE TABLE doris_source (
name STRING,
age int
) 
WITH (
  'connector' = 'doris',
  'fenodes' = 'FE_IP:HTTP_PORT',
  'table.identifier' = 'database.table',
  'source.use-flight-sql' = 'true',
  'source.flight-sql-port' = '{fe.conf:arrow_flight_sql_port}',
  'username' = 'root',
  'password' = ''
)
```


#### DataStream

```java
DorisOptions.Builder builder = DorisOptions.builder()
        .setFenodes("FE_IP:HTTP_PORT")
        .setTableIdentifier("db.table")
        .setUsername("root")
        .setPassword("password");

DorisSource<List<?>> dorisSource = DorisSource.<List<?>>builder()
        .setDorisOptions(builder.build())
        .setDorisReadOptions(DorisReadOptions.builder().build())
        .setDeserializer(new SimpleListDeserializationSchema())
        .build();

env.fromSource(dorisSource, WatermarkStrategy.noWatermarks(), "doris source").print();
```

### 写入

#### SQL

```sql
-- enable checkpoint
SET 'execution.checkpointing.interval' = '10s';

-- doris sink
CREATE TABLE flink_doris_sink (
    name STRING,
    age INT,
    price DECIMAL(5,2),
    sale DOUBLE
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = 'FE_IP:HTTP_PORT',
      'table.identifier' = 'db.table',
      'username' = 'root',
      'password' = 'password',
      'sink.label-prefix' = 'doris_label'
);

-- submit insert job
INSERT INTO flink_doris_sink select name,age,price,sale from flink_doris_source
```

#### DataStream

DorisSink 是通过 StreamLoad 向 Doris 写入数据，DataStream 写入时，支持不同的序列化方法

**String 数据流 (SimpleStringSerializer)**

```java
// enable checkpoint
env.enableCheckpointing(10000);
// using batch mode for bounded data
env.setRuntimeMode(RuntimeExecutionMode.BATCH);

DorisSink.Builder<String> builder = DorisSink.builder();
DorisOptions.Builder dorisBuilder = DorisOptions.builder();
dorisBuilder.setFenodes("FE_IP:HTTP_PORT")
        .setTableIdentifier("db.table")
        .setUsername("root")
        .setPassword("password");


Properties properties = new Properties();
// 上游是 json 写入时，需要开启配置
//properties.setProperty("format", "json");
//properties.setProperty("read_json_by_line", "true");
DorisExecutionOptions.Builder  executionBuilder = DorisExecutionOptions.builder();
executionBuilder.setLabelPrefix("label-doris") //streamload label prefix
                .setDeletable(false)
                .setStreamLoadProp(properties); 

builder.setDorisReadOptions(DorisReadOptions.builder().build())
        .setDorisExecutionOptions(executionBuilder.build())
        .setSerializer(new SimpleStringSerializer()) //serialize according to string 
        .setDorisOptions(dorisBuilder.build());

//mock csv string source
List<Tuple2<String, Integer>> data = new ArrayList<>();
data.add(new Tuple2<>("doris",1));
DataStreamSource<Tuple2<String, Integer>> source = env.fromCollection(data);
source.map((MapFunction<Tuple2<String, Integer>, String>) t -> t.f0 + "\t" + t.f1)
      .sinkTo(builder.build());

//mock json string source
//env.fromElements("{\"name\":\"zhangsan\",\"age\":1}").sinkTo(builder.build());

```

**RowData 数据流 (RowDataSerializer)**

```java
// enable checkpoint
env.enableCheckpointing(10000);
// using batch mode for bounded data
env.setRuntimeMode(RuntimeExecutionMode.BATCH);

//doris sink option
DorisSink.Builder<RowData> builder = DorisSink.builder();
DorisOptions.Builder dorisBuilder = DorisOptions.builder();
dorisBuilder.setFenodes("FE_IP:HTTP_PORT")
        .setTableIdentifier("db.table")
        .setUsername("root")
        .setPassword("password");

// json format to streamload
Properties properties = new Properties();
properties.setProperty("format", "json");
properties.setProperty("read_json_by_line", "true");
DorisExecutionOptions.Builder  executionBuilder = DorisExecutionOptions.builder();
executionBuilder.setLabelPrefix("label-doris") //streamload label prefix
                .setDeletable(false)
                .setStreamLoadProp(properties); //streamload params

//flink rowdata‘s schema
String[] fields = {"city", "longitude", "latitude", "destroy_date"};
DataType[] types = {DataTypes.VARCHAR(256), DataTypes.DOUBLE(), DataTypes.DOUBLE(), DataTypes.DATE()};

builder.setDorisReadOptions(DorisReadOptions.builder().build())
        .setDorisExecutionOptions(executionBuilder.build())
        .setSerializer(RowDataSerializer.builder()    //serialize according to rowdata 
                           .setFieldNames(fields)
                           .setType("json")           //json format
                           .setFieldType(types).build())
        .setDorisOptions(dorisBuilder.build());

//mock rowdata source
DataStream<RowData> source = env.fromElements("")
    .map(new MapFunction<String, RowData>() {
        @Override
        public RowData map(String value) throws Exception {
            GenericRowData genericRowData = new GenericRowData(4);
            genericRowData.setField(0, StringData.fromString("beijing"));
            genericRowData.setField(1, 116.405419);
            genericRowData.setField(2, 39.916927);
            genericRowData.setField(3, LocalDate.now().toEpochDay());
            return genericRowData;
        }
    });

source.sinkTo(builder.build());
```

**CDC 数据流 (JsonDebeziumSchemaSerializer)**

:::info 备注
上游数据必须符合Debezium数据格式。
:::

```java
// enable checkpoint
env.enableCheckpointing(10000);

Properties props = new Properties();
props.setProperty("format", "json");
props.setProperty("read_json_by_line", "true");
DorisOptions dorisOptions = DorisOptions.builder()
        .setFenodes("127.0.0.1:8030")
        .setTableIdentifier("test.t1")
        .setUsername("root")
        .setPassword("").build();

DorisExecutionOptions.Builder  executionBuilder = DorisExecutionOptions.builder();
executionBuilder.setLabelPrefix("label-prefix")
        .setStreamLoadProp(props).setDeletable(true);

DorisSink.Builder<String> builder = DorisSink.builder();
builder.setDorisReadOptions(DorisReadOptions.builder().build())
        .setDorisExecutionOptions(executionBuilder.build())
        .setDorisOptions(dorisOptions)
        .setSerializer(JsonDebeziumSchemaSerializer.builder().setDorisOptions(dorisOptions).build());

env.fromSource(mySqlSource, WatermarkStrategy.noWatermarks(), "MySQL Source")
        .sinkTo(builder.build());
```
完整代码参考： [CDCSchemaChangeExample](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/CDCSchemaChangeExample.java)

### Lookup Join

```sql
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


## 配置

### 通用配置项

| Key                              | Default Value | Required | Comment                                                      |
| -------------------------------- |---------------| -------- | ------------------------------------------------------------ |
| fenodes                          | --            | Y        | Doris FE http 地址，支持多个地址，使用逗号分隔              |
| benodes                          | --            | N        | Doris BE http 地址，支持多个地址，使用逗号分隔，参考[#187](https://github.com/apache/doris-flink-connector/pull/187) |
| jdbc-url                         | --            | N        | jdbc 连接信息，如：jdbc:mysql://127.0.0.1:9030                |
| table.identifier                 | --            | Y        | Doris 表名，如：db.tbl                                       |
| username                         | --            | Y        | 访问 Doris 的用户名                                          |
| password                         | --            | Y        | 访问 Doris 的密码                                            |
| auto-redirect                    | true          | N        | 是否重定向 StreamLoad 请求。开启后 StreamLoad 将通过 FE 写入，不再显示获取 BE 信息 |
| doris.request.retries            | 3             | N        | 向 Doris 发送请求的重试次数                                  |
| doris.request.connect.timeout | 30s         | N        | 向 Doris 发送请求的连接超时时间                              |
| doris.request.read.timeout    | 30s         | N        | 向 Doris 发送请求的读取超时时间                              |

### Source 配置项

| Key                           | Default Value      | Required | Comment                                                      |
| ----------------------------- | ------------------ | -------- | ------------------------------------------------------------ |
| doris.request.query.timeout   | 21600s               | N        | 查询 Doris 的超时时间，默认值为 6 小时      |
| doris.request.tablet.size     | 1 | N        | 一个 Partition 对应的 Doris Tablet 个数。此数值设置越小，则会生成越多的 Partition。从而提升 Flink 侧的并行度，但同时会对 Doris 造成更大的压力。 |
| doris.batch.size              | 1024               | N        | 一次从 BE 读取数据的最大行数。增大此数值可减少 Flink 与 Doris 之间建立连接的次数。从而减轻网络延迟所带来的额外时间开销。 |
| doris.exec.mem.limit          | 8192mb         | N        | 单个查询的内存限制。默认为 8GB，单位为字节                   |
| doris.deserialize.arrow.async | FALSE              | N        | 是否支持异步转换 Arrow 格式到 flink-doris-connector 迭代所需的 RowBatch |
| doris.deserialize.queue.size  | 64                 | N        | 异步转换 Arrow 格式的内部处理队列，当 doris.deserialize.arrow.async 为 true 时生效 |
| source.use-flight-sql | FALSE              | N        | 是否使用 Arrow Flight SQL 读取 |
| source.flight-sql-port  | -                 | N        | 使用 Arrow Flight SQL 读取时，FE 的 arrow_flight_sql_port |

#### DataStream 专有配置项
| Key                           | Default Value      | Required | Comment                                                      |
| ----------------------------- | ------------------ | -------- | ------------------------------------------------------------ |
| doris.read.field              | --                 | N        | 读取 Doris 表的列名列表，多列之间使用逗号分隔                |
| doris.filter.query            | --                 | N        | 过滤读取数据的表达式，此表达式透传给 Doris。Doris 使用此表达式完成源端数据过滤。比如 age=18。 |


### Sink 配置项

| Key                         | Default Value | Required | Comment                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | ------------- | -------- |---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| sink.label-prefix           | --            | Y        | Stream load 导入使用的 label 前缀。2pc 场景下要求全局唯一，用来保证 Flink 的 EOS 语义。                                                                                                                                                                                                                                                                   |
| sink.properties.*           | --            | N        | Stream Load 的导入参数。<br />例如： 'sink.properties.column_separator' = ', ' 定义列分隔符，  'sink.properties.escape_delimiters' = 'true' 特殊字符作为分隔符，`\x01`会被转换为二进制的 0x01 。  <br /><br />JSON 格式导入<br />'sink.properties.format' = 'json' 'sink.properties.read_json_by_line' = 'true'<br />详细参数参考[这里](../data-operate/import/stream-load-manual.md)。<br /><br />Group Commit 模式 <br /> 例如：'sink.properties.group_commit' = 'sync_mode' 设置 group commit 为同步模式。flink connector 从 1.6.2 开始支持导入配置 group commit ，详细使用和限制参考 [group commit](https://doris.apache.org/zh-CN/docs/data-operate/import/import-way/group-commit-manual/) 。 
| sink.enable-delete          | TRUE          | N        | 是否启用删除。此选项需要 Doris 表开启批量删除功能 (Doris0.15+ 版本默认开启)，只支持 Unique 模型。                                                                                                                                                                                                                                                                 |
| sink.enable-2pc             | TRUE          | N        | 是否开启两阶段提交 (2pc)，默认为 true，保证 Exactly-Once 语义。关于两阶段提交可参考[这里](../data-operate/import/stream-load-manual.md)。                                                                                                                                                                                                                       |
| sink.buffer-size            | 1MB           | N        | 写数据缓存 buffer 大小，单位字节。不建议修改，默认配置即可                                                                                                                                                                                                                                                                                               |
| sink.buffer-count           | 3             | N        | 写数据缓存 buffer 个数。不建议修改，默认配置即可                                                                                                                                                                                                                                                                                                    |
| sink.max-retries            | 3             | N        | Commit 失败后的最大重试次数，默认 3 次                                                                                                                                                                                                                                                                                                        |
| sink.use-cache              | false         | N        | 异常时，是否使用内存缓存进行恢复，开启后缓存中会保留 Checkpoint 期间的数据                                                                                                                                                                                                                                                                                     |
| sink.enable.batch-mode      | false         | N        | 是否使用攒批模式写入 Doris，开启后写入时机不依赖 Checkpoint，通过 sink.buffer-flush.max-rows/sink.buffer-flush.max-bytes/sink.buffer-flush.interval 参数来控制写入时机。<br />同时开启后将不保证 Exactly-once 语义，可借助 Uniq 模型做到幂等                                                                                                                                           |
| sink.flush.queue-size       | 2             | N        | 攒批模式下，缓存的队列大小。                                                                                                                                                                                                                                                                                                                  |
| sink.buffer-flush.max-rows  | 500000         | N        | 攒批模式下，单个批次最多写入的数据行数。                                                                                                                                                                                                                                                                                                            |
| sink.buffer-flush.max-bytes | 100MB          | N        | 攒批模式下，单个批次最多写入的字节数。                                                                                                                                                                                                                                                                                                             |
| sink.buffer-flush.interval  | 10s           | N        | 攒批模式下，异步刷新缓存的间隔                                                                                                                                                                                                                                                                                                                 |
| sink.ignore.update-before   | true          | N        | 是否忽略 update-before 事件，默认忽略。                                                                                                                                                                                                                                                                                                     |

### Lookup Join 配置项

| Key                               | Default Value | Required | Comment                                    |
| --------------------------------- | ------------- | -------- | ------------------------------------------ |
| lookup.cache.max-rows             | -1            | N        | lookup 缓存的最大行数，默认值 -1，不开启缓存 |
| lookup.cache.ttl                  | 10s           | N        | lookup 缓存的最大时间，默认 10s              |
| lookup.max-retries                | 1             | N        | lookup 查询失败后的重试次数                 |
| lookup.jdbc.async                 | false         | N        | 是否开启异步的 lookup，默认 false            |
| lookup.jdbc.read.batch.size       | 128           | N        | 异步 lookup 下，每次查询的最大批次大小       |
| lookup.jdbc.read.batch.queue-size | 256           | N        | 异步 lookup 时，中间缓冲队列的大小           |
| lookup.jdbc.read.thread-size      | 3             | N        | 每个 task 中 lookup 的 jdbc 线程数               |

## Doris 和 Flink 列类型映射关系

| Doris Type | Flink Type                       |
| ---------- | -------------------------------- |
| NULL_TYPE  | NULL              |
| BOOLEAN    | BOOLEAN       |
| TINYINT    | TINYINT              |
| SMALLINT   | SMALLINT              |
| INT        | INT            |
| BIGINT     | BIGINT               |
| FLOAT      | FLOAT              |
| DOUBLE     | DOUBLE            |
| DATE       | DATE |
| DATETIME   | TIMESTAMP |
| DECIMAL    | DECIMAL                      |
| CHAR       | STRING             |
| LARGEINT   | STRING             |
| VARCHAR    | STRING            |
| STRING     | STRING            |
| DECIMALV2  | DECIMAL                      |
| ARRAY      | ARRAY             |
| MAP        | MAP             |
| JSON       | STRING             |
| VARIANT    | STRING |
| IPV4       | STRING |
| IPV6       | STRING |

> 自 connector-1.6.1 开始支持读取 Variant,IPV6,IPV4 三种数据类型，其中读取 IPV6，Variant 需 Doris 版本 2.1.1 及以上。


## Flink 写入指标
其中 Counter 类型的指标值为导入任务从开始到当前的累加值，可以在 Flink Webui metrics 中观察各表的各项指标。

| Name                      | Metric Type | Description                                |
| ------------------------- | ----------- | ------------------------------------------ |
| totalFlushLoadBytes       | Counter     | 已经刷新导入的总字节数                     |
| flushTotalNumberRows      | Counter     | 已经导入处理的总行数                       |
| totalFlushLoadedRows      | Counter     | 已经成功导入的总行数                       |
| totalFlushTimeMs          | Counter     | 已经成功导入完成的总时间                   |
| totalFlushSucceededNumber | Counter     | 已经成功导入的次数                         |
| totalFlushFailedNumber    | Counter     | 失败导入 的次数                            |
| totalFlushFilteredRows    | Counter     | 数据质量不合格的总行数                     |
| totalFlushUnselectedRows  | Counter     | 被 where 条件过滤的总行数                  |
| beginTxnTimeMs            | Histogram   | 向 Fe 请求开始一个事务所花费的时间，单位毫秒 |
| putDataTimeMs             | Histogram   | 向 Fe 请求获取导入数据执行计划所花费的时间   |
| readDataTimeMs            | Histogram   | 读取数据所花费的时间                       |
| writeDataTimeMs           | Histogram   | 执行写入数据操作所花费的时间               |
| commitAndPublishTimeMs    | Histogram   | 向 Fe 请求提交并且发布事务所花费的时间       |
| loadTimeMs                | Histogram   | 导入完成的时间                             |

## 使用 FlinkSQL 通过 CDC 接入 Doris 示例
```sql
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
## 使用 FlinkSQL 通过 CDC 接入并实现部分列更新示例

```sql
-- enable checkpoint
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE cdc_mysql_source (
   id int
  ,name STRING
  ,bank STRING
  ,age int
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
  'sink.properties.columns' = 'id,name,bank,age',
  'sink.properties.partial_columns' = 'true' -- 开启部分列更新
);


insert into doris_sink select id,name,bank,age from cdc_mysql_source;

```

## 使用 Flink CDC 接入多表或整库 (支持 MySQL,Oracle,PostgreSQL,SQLServer,MongoDB)
### 语法
```shell
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


| Key                     | Comment                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|-------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| --job-name              | Flink 任务名称，非必需                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --database              | 同步到 Doris 的数据库名                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --table-prefix          | Doris 表前缀名，例如 --table-prefix ods_。                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --table-suffix          | 同上，Doris 表的后缀名。                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --including-tables      | 需要同步的 MySQL 表，可以使用 `\|` 分隔多个表，并支持正则表达式。比如--including-tables table1                                                                                                                                                                                                                                                                                                                                                                                   |
| --excluding-tables      | 不需要同步的表，用法同上。                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --mysql-conf            | MySQL CDCSource 配置，例如--mysql-conf hostname=127.0.0.1，您可以在[这里](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.0/docs/connectors/legacy-flink-cdc-sources/mysql-cdc/)查看所有配置 MySQL-CDC，其中 hostname/username/password/database-name 是必需的。同步的库表中含有非主键表时，必须设置 `scan.incremental.snapshot.chunk.key-column`，且只能选择非空类型的一个字段。<br/>例如：`scan.incremental.snapshot.chunk.key-column=database.table:column,database.table1:column...`，不同的库表列之间用`,`隔开。 |
| --oracle-conf           | Oracle CDCSource 配置，例如--oracle-conf hostname=127.0.0.1，您可以在[这里](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.0/docs/connectors/legacy-flink-cdc-sources/oracle-cdc/)查看所有配置 Oracle-CDC，其中 hostname/username/password/database-name/schema-name 是必需的。                                                                                                                                                                                  |
| --postgres-conf         | Postgres CDCSource 配置，例如--postgres-conf hostname=127.0.0.1，您可以在[这里](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.0/docs/connectors/legacy-flink-cdc-sources/postgres-cdc/)查看所有配置 Postgres-CDC，其中 hostname/username/password/database-name/schema-name/slot.name 是必需的。                                                                                                                                                                |
| --sqlserver-conf        | SQLServer CDCSource 配置，例如--sqlserver-conf hostname=127.0.0.1，您可以在[这里](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.0/docs/connectors/legacy-flink-cdc-sources/sqlserver-cdc/)查看所有配置 SQLServer-CDC，其中 hostname/username/password/database-name/schema-name 是必需的。                                                                                                                                                                      |
| --db2-conf        | SQLServer CDCSource 配置，例如--db2-conf hostname=127.0.0.1，您可以在[这里](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.1/docs/connectors/flink-sources/db2-cdc/)查看所有配置 DB2-CDC，其中 hostname/username/password/database-name/schema-name 是必需的。｜
| --sink-conf             | Doris Sink 的所有配置，可以在[这里](https://doris.apache.org/zh-CN/docs/dev/ecosystem/flink-doris-connector/#%E9%80%9A%E7%94%A8%E9%85%8D%E7%BD%AE%E9%A1%B9)查看完整的配置项。                                                                                                                                                                                                                                                                                           |
| --mongodb-conf          | MongoDB CDCSource 配置，例如 --mongodb-conf hosts=127.0.0.1:27017，您可以在[这里](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.0/docs/connectors/flink-sources/mongodb-cdc/)查看所有配置 Mongo-CDC，其中 hosts/username/password/database 是必须的。其中 --mongodb-conf schema.sample-percent 为自动采样 mongodb 数据为 Doris 建表的配置，默认为 0.2|
| --table-conf            | Doris 表的配置项，即 properties 中包含的内容（其中 table-buckets 例外，非 properties 属性）。例如 `--table-conf replication_num=1`，而 `--table-conf table-buckets="tbl1:10,tbl2:20,a.*:30,b.*:40,.*:50"`表示按照正则表达式顺序指定不同表的 buckets 数量，如果没有匹配到则采用 BUCKETS AUTO 建表。                                                                                                                                                                                                               |
| --ignore-default-value  | 关闭同步 MySQL 表结构的默认值。适用于同步 MySQL 数据到 Doris 时，字段有默认值，但实际插入数据为 null 情况。参考[#152](https://github.com/apache/doris-flink-connector/pull/152)                                                                                                                                                                                                                                                                                                               |
| --use-new-schema-change | 是否使用新的 schema change，支持同步 MySQL 多列变更、默认值，1.6.0 开始该参数默认为 true。参考[#167](https://github.com/apache/doris-flink-connector/pull/167)                                                                                                                                                                                                                                                                                                                      |
| --schema-change-mode    | 解析 schema change 的模式，支持 `debezium_structure`、`sql_parser` 两种解析模式，默认采用 `debezium_structure` 模式。<br/><br/> `debezium_structure` 解析上游 CDC 同步数据时所使用的数据结构，通过解析该结构判断 DDL 变更操作。 <br/> `sql_parser` 通过解析上游 CDC 同步数据时的 DDL 语句，从而判断 DDL 变更操作，因此该解析模式更加准确。<br/> 使用例子：`--schema-change-mode debezium_structure`<br/> 本功能将在 1.6.2.1 后的版本中提供                                                                                                                       |
| --single-sink           | 是否使用单个 Sink 同步所有表，开启后也可自动识别上游新创建的表，自动创建表。                                                                                                                                                                                                                                                                                                                                                                                                           |
| --multi-to-one-origin   | 将上游多张表写入同一张表时，源表的配置，比如：`--multi-to-one-origin "a\_.\*\|b_.\*"`，具体参考[#208](https://github.com/apache/doris-flink-connector/pull/208)                                                                                                                                                                                                                                                                                                                   |
| --multi-to-one-target   | 与 multi-to-one-origin 搭配使用，目标表的配置，比如：`--multi-to-one-target "a\`|b"                                                                                                                                                                                                                                                                                                                                                                                   |
| --create-table-only     | 是否只仅仅同步表的结构                                                                                                                                                                                                                                                                                                                                                                                                                                         |

:::info 备注
1. 同步时需要在 `$FLINK_HOME/lib` 目录下添加对应的 Flink CDC 依赖，比如 flink-sql-connector-mysql-cdc-${version}.jar，flink-sql-connector-oracle-cdc-${version}.jar ，flink-sql-connector-mongodb-cdc-${version}.jar
2. Connector 24.0.0 之后依赖的 Flink CDC 版本需要在 3.1 以上，如果需使用 Flink CDC 同步 MySQL 和 Oracle，还需要在 `$FLINK_HOME/lib` 下增加相关的 JDBC 驱动。
:::

### MySQL 多表同步示例
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

### Oracle 多表同步示例

```shell
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

### PostgreSQL 多表同步示例

```shell
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

### SQLServer 多表同步示例

```shell
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

### DB2 多表同步示例

```shell
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

### MongoDB 多表同步示例

```shell
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

## 使用 Flink CDC 更新 Key 列

一般在业务数据库中，会使用编号来作为表的主键，比如 Student 表，会使用编号 (id) 来作为主键，但是随着业务的发展，数据对应的编号有可能是会发生变化的。
在这种场景下，使用 Flink CDC + Doris Connector 同步数据，便可以自动更新 Doris 主键列的数据。
### 原理
Flink CDC 底层的采集工具是 Debezium，Debezium 内部使用 op 字段来标识对应的操作：op 字段的取值分别为 c、u、d、r，分别对应 create、update、delete 和 read。
而对于主键列的更新，Flink CDC 会向下游发送 DELETE 和 INSERT 事件，同时数据同步到 Doris 中后，就会自动更新主键列的数据。

### 使用
Flink 程序可参考上面 CDC 同步的示例，成功提交任务后，在 MySQL 侧执行 Update 主键列的语句 (`update  student set id = '1002' where id = '1001'`)，即可修改 Doris 中的数据。

## 使用 Flink 根据指定列删除数据

一般 Kafka 中的消息会使用特定字段来标记操作类型，比如{"op_type":"delete",data:{...}}。针对这类数据，希望将 op_type=delete 的数据删除掉。

DorisSink 默认会根据 RowKind 来区分事件的类型，通常这种在 cdc 情况下可以直接获取到事件类型，对隐藏列`__DORIS_DELETE_SIGN__`进行赋值达到删除的目的，而 Kafka 则需要根据业务逻辑判断，显示的传入隐藏列的值。

### 使用

```sql
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

## Java 示例

`samples/doris-demo/` 下提供了 Java 版本的示例，可供参考，查看点击[这里](https://github.com/apache/doris/tree/master/samples/doris-demo/)

## 最佳实践

### 应用场景

使用 Flink Doris Connector 最适合的场景就是实时/批次同步源数据（MySQL，Oracle，PostgreSQL 等）到 Doris，使用 Flink 对 Doris 中的数据和其他数据源进行联合分析，也可以使用 Flink Doris Connector。

### 其他

1. Flink Doris Connector 主要是依赖 Checkpoint 进行流式写入，所以 Checkpoint 的间隔即为数据的可见延迟时间。
2. 为了保证 Flink 的 Exactly Once 语义，Flink Doris Connector 默认开启两阶段提交，Doris 在 1.1 版本后默认开启两阶段提交。1.0 可通过修改 BE 参数开启，可参考[two_phase_commit](../data-operate/import/stream-load-manual.md)。

## 常见问题

1. **Doris Source 在数据读取完成后，流为什么就结束了？**

目前 Doris Source 是有界流，不支持 CDC 方式读取。

2. **Flink 读取 Doris 可以进行条件下推吗？**

通过配置 doris.filter.query 参数，详情参考配置小节。

3. **如何写入 Bitmap 类型？**

```sql
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
4. **errCode = 2, detailMessage = Label [label_0_1] has already been used, relate to txn [19650]**

Exactly-Once 场景下，Flink Job 重启时必须从最新的 Checkpoint/Savepoint 启动，否则会报如上错误。
不要求 Exactly-Once 时，也可通过关闭 2PC 提交（sink.enable-2pc=false）或更换不同的 sink.label-prefix 解决。

5. **errCode = 2, detailMessage = transaction [19650] not found**

发生在 Commit 阶段，checkpoint 里面记录的事务 ID，在 FE 侧已经过期，此时再次 commit 就会出现上述错误。
此时无法从 checkpoint 启动，后续可通过修改 fe.conf 的 streaming_label_keep_max_second 配置来延长过期时间，默认 12 小时。

6. **errCode = 2, detailMessage = current running txns on db 10006 is 100, larger than limit 100**

这是因为同一个库并发导入超过了 100，可通过调整 fe.conf 的参数 `max_running_txn_num_per_db` 来解决，具体可参考 [max_running_txn_num_per_db](https://doris.apache.org/zh-CN/docs/dev/admin-manual/config/fe-config/#max_running_txn_num_per_db)。

同时，一个任务频繁修改 label 重启，也可能会导致这个错误。2pc 场景下 (Duplicate/Aggregate 模型)，每个任务的 label 需要唯一，并且从 checkpoint 重启时，flink 任务才会主动 abort 掉之前已经 precommit 成功，没有 commit 的 txn，频繁修改 label 重启，会导致大量 precommit 成功的 txn 无法被 abort，占用事务。在 Unique 模型下也可关闭 2pc，可以实现幂等写入。

7. **Flink 写入 Uniq 模型时，如何保证一批数据的有序性？**

可以添加 sequence 列配置来保证，具体可参考 [sequence](https://doris.apache.org/zh-CN/docs/dev/data-operate/update/update-of-unique-model/)

8. **Flink 任务没报错，但是无法同步数据？**

Connector1.1.0 版本以前，是攒批写入的，写入均是由数据驱动，需要判断上游是否有数据写入。1.1.0 之后，依赖 Checkpoint，必须开启 Checkpoint 才能写入。

9. **tablet writer write failed, tablet_id=190958, txn_id=3505530, err=-235**

通常发生在 Connector1.1.0 之前，是由于写入频率过快，导致版本过多。可以通过设置 sink.batch.size 和 sink.batch.interval 参数来降低 Streamload 的频率。在Connector1.1.0之后，默认写入时机是由Checkpoint控制，可以通过增加Checkpoint间隔来降低写入频率。

10. **Flink 导入有脏数据，如何跳过？**

Flink 在数据导入时，如果有脏数据，比如字段格式、长度等问题，会导致 StreamLoad 报错，此时 Flink 会不断的重试。如果需要跳过，可以通过禁用 StreamLoad 的严格模式 (strict_mode=false,max_filter_ratio=1) 或者在 Sink 算子之前对数据做过滤。

11. **源表和 Doris 表应如何对应？**
使用 Flink Connector 导入数据时，要注意两个方面，第一是源表的列和类型跟 flink sql 中的列和类型要对应上；第二个是 flink sql 中的列和类型要跟 Doris 表的列和类型对应上，具体可以参考上面的"Doris 和 Flink 列类型映射关系"

12. **TApplicationException: get_next failed: out of sequence response: expected 4 but got 3**

这是由于 Thrift 框架存在并发 bug 导致的，建议你使用尽可能新的 connector 以及与之兼容的 flink 版本。

13. **DorisRuntimeException: Fail to abort transaction 26153 with url http://192.168.0.1:8040/api/table_name/_stream_load_2pc**

你可以在 TaskManager 中搜索日志 `abort transaction response`，根据 http 返回码确定是 client 的问题还是 server 的问题。

14. **使用 doris.filter.query 出现 org.apache.flink.table.api.SqlParserException: SQL parse failed. Encountered "xx" at line x, column xx**

出现这个问题主要是条件 varchar/string 类型，需要加引号导致的，正确写法是 xxx = ''xxx'',这样 Flink SQL 解析器会将两个连续的单引号解释为一个单引号字符，而不是字符串的结束，并将拼接后的字符串作为属性的值。比如说：`t1 >= '2024-01-01'`，可以写成`'doris.filter.query' = 't1 >=''2024-01-01'''`。Connector1.6.0 之后 FlinkSQL 可以实现自动谓词和投影下推。

15. **如果出现 Failed to connect to backend: `http://host:webserver_port`, 并且 Be 还是活着的**

可能是因为你配置的 be 的 ip，外部的 Flink 集群无法访问。这主要是因为当连接 fe 时，会通过 fe 解析出 be 的地址。例如，当你添加的 be 地址为`127.0.0.1`，那么 Flink 通过 fe 获取的 be 地址就为`127.0.0.1:webserver_port`，此时 Flink 就会去访问这个地址。当出现这个问题时，可以通过在 with 属性中增加实际对应的 be 外部 ip 地`'benodes' = "be_ip:webserver_port, be_ip:webserver_port..."`，整库同步则可增加`--sink-conf benodes=be_ip:webserver,be_ip:webserver...`。

16. **如果使用整库同步 MySQL 数据到 Doris，出现 timestamp 类型与源数据相差多个小时**

整库同步默认 timezone="UTC+8"，如果你同步的数据不是该时区，可以尝试如下设置相对应的时区，例如：`--mysql-conf debezium.date.format.timestamp.zone="UTC+3"` 来解决。

17. **攒批写入和流式写入有什么区别**

Connector1.5.0 之后支持攒批写入，攒批写入不依赖 Checkpoint，将数据缓存在内存中，根据 sink.buffer-flush.max-rows/sink.buffer-flush.max-bytes/sink.buffer-flush.interval 参数来控制写入时机。流式写入必须开启 Checkpoint，在整个 Checkpoint 期间持续的将上游数据写入到 Doris 中，不会一直将数据缓存在内存中。

