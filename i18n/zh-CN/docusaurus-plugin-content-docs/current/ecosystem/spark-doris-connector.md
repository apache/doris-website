---
{
    "title": "Spark Doris Connector",
    "language": "zh-CN",
    "description": "Spark Doris Connector 可以支持通过 Spark 读取 Doris 中存储的数据，也支持通过 Spark 写入数据到 Doris。"
}
---

# Spark Doris Connector

Spark Doris Connector 可以支持通过 Spark 读取 Doris 中存储的数据，也支持通过 Spark 写入数据到 Doris。

代码库地址：https://github.com/apache/doris-spark-connector

- 支持从 `Doris` 中通过 `RDD`、`DataFrame` 以及 `Spark SQL` 方式批量读取数据, 推荐使用 `DataFrame` 或 `Spark SQL`。
- 支持使用 `DataFrame` 和 `Spark SQL` 批量或流式地将数据写入 `Doris`。
- 支持在 `Doris` 端完成数据过滤，减少数据传输量。

## 版本兼容

| Connector | Spark               | Doris       | Java | Scala      |
|-----------|---------------------|-------------|------|------------|
| 25.1.0    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 25.0.1    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 25.0.0    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 1.3.2     | 3.4 - 3.1, 2.4, 2.3 | 1.0 - 2.1.6 | 8    | 2.12, 2.11 |
| 1.3.1     | 3.4 - 3.1, 2.4, 2.3 | 1.0 - 2.1.0 | 8    | 2.12, 2.11 |
| 1.3.0     | 3.4 - 3.1, 2.4, 2.3 | 1.0 - 2.1.0 | 8    | 2.12, 2.11 |
| 1.2.0     | 3.2, 3.1, 2.3       | 1.0 - 2.0.2 | 8    | 2.12, 2.11 |
| 1.1.0     | 3.2, 3.1, 2.3       | 1.0 - 1.2.8 | 8    | 2.12, 2.11 |
| 1.0.1     | 3.1, 2.3            | 0.12 - 0.15 | 8    | 2.12, 2.11 |

## 使用

### Maven
```
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>spark-doris-connector-spark-3.5</artifactId>
    <version>25.1.0</version>
</dependency>
```

:::tip

从 24.0.0 版本开始，Doris connector 包命名规则发生调整：
1. 不再包含 Scala 版本信息
2. 对于 Spark 2.x 版本，统一使用名称为 `spark-doris-connector-spark-2` 的包，并且默认只基于 Scala 2.11 版本编译，需要 Scala 2.12 版本的请自行编译。
3. 对于 Spark 3.x 版本，根据具体 Spark 版本使用使用名称为 `spark-doris-connector-spark-3.x` 的包，其中 Spark 3.0 版本可以使用 `spark-doris-connector-spark-3.1` 的包。

:::

**备注**

1. 请根据不同的 Spark 和 Scala 版本替换相应的 Connector 版本。

2. 也可从[这里](https://repo.maven.apache.org/maven2/org/apache/doris/)下载相关版本 jar 包。

### 编译

编译时，可直接运行 `sh build.sh`，具体可参考这里。

编译成功后，会在 `dist` 目录生成目标 jar 包，如：spark-doris-connector-spark-3.5-25.1.0.jar。将此文件复制到 `Spark` 的 `ClassPath` 中即可使用 `Spark-Doris-Connector`。例如，`Local` 模式运行的 `Spark`，将此文件放入 `jars/` 文件夹下。`Yarn`集群模式运行的`Spark`，则将此文件放入预部署包中。
也可以


2. 在源码目录下执行：
   `sh build.sh`
   根据提示输入你需要的 Scala 与 Spark 版本进行编译。

编译成功后，会在 `dist` 目录生成目标 jar 包，如：`spark-doris-connector-spark-3.5-25.1.0.jar`。
将此文件复制到 `Spark` 的 `ClassPath` 中即可使用 `Spark-Doris-Connector`。

例如，`Local` 模式运行的 `Spark`，将此文件放入 `jars/` 文件夹下。`Yarn`集群模式运行的`Spark`，则将此文件放入预部署包中。

例如将 `spark-doris-connector-spark-3.5-25.1.0.jar` 上传到 hdfs 并在 `spark.yarn.jars` 参数上添加 hdfs 上的 Jar 包路径
```shell
1. 上传 `spark-doris-connector-spark-3.5-25.1.0.jar` 到 hdfs。

hdfs dfs -mkdir /spark-jars/
hdfs dfs -put /your_local_path/spark-doris-connector-spark-3.5-25.1.0.jar /spark-jars/

2. 在集群中添加 `spark-doris-connector-spark-3.5-25.1.0.jar` 依赖。
spark.yarn.jars=hdfs:///spark-jars/spark-doris-connector-spark-3.5-25.1.0.jar

```

## 使用示例

### 批量读取

#### RDD

```scala
import org.apache.doris.spark._

val dorisSparkRDD = sc.dorisRDD(
   tableIdentifier = Some("$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME"),
   cfg = Some(Map(
      "doris.fenodes" -> "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT",
      "doris.request.auth.user" -> "$YOUR_DORIS_USERNAME",
      "doris.request.auth.password" -> "$YOUR_DORIS_PASSWORD"
   ))
)

dorisSparkRDD.collect()
```

#### DataFrame

```scala
val dorisSparkDF = spark.read.format("doris")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        .load()

dorisSparkDF.show(5)
```

#### Spark SQL

```sparksql
CREATE TEMPORARY VIEW spark_doris
   USING doris
   OPTIONS(
   "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
   "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT",
   "user"="$YOUR_DORIS_USERNAME",
   "password"="$YOUR_DORIS_PASSWORD"
);

SELECT * FROM spark_doris;
```

#### pySpark

```scala
dorisSparkDF = spark.read.format("doris")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        .load()
// show 5 lines data 
dorisSparkDF.show(5)
```

#### 通过 Arrow Flight SQL 方式读取

从 24.0.0 版本开始，支持通过 Arrow Flight SQL 方式读取数据（需要 Doris 版本 >= 2.1.0）。

设置 `doris.read.mode` 为 arrow， 设置 `doris.read.arrow-flight-sql.port` 为 FE 配置的 Arrow Flight SQL 端口，服务端配置方式参考 [基于 Arrow Flight SQL 的高速数据传输链路](https://doris.apache.org/zh-CN/docs/dev/db-connect/arrow-flight-sql-connect)。

```scala
val df = spark.read.format("doris")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("doris.user", "$YOUR_DORIS_USERNAME")
        .option("doris.password", "$YOUR_DORIS_PASSWORD")
        .option("doris.read.mode", "arrow")
        .option("doris.read.arrow-flight-sql.port", "12345")
        .load()

df.show()
```

### 批量写入

#### DataFrame

```scala
val mockDataDF = List(
   (3, "440403001005", "21.cn"),
   (1, "4404030013005", "22.cn"),
   (33, null, "23.cn")
).toDF("id", "mi_code", "mi_name")
mockDataDF.show(5)

mockDataDF.write.format("doris")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        //其他选项
        //指定要写入的列
        .option("doris.write.fields", "$YOUR_FIELDS_TO_WRITE")
        // 从 1.3.0 版本开始，支持覆盖写入
        // .mode(SaveMode.Overwrite)
        .save()
```

#### Spark SQL

```sparksql
CREATE TEMPORARY VIEW spark_doris
   USING doris
   OPTIONS(
   "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
   "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT",
   "user"="$YOUR_DORIS_USERNAME",
   "password"="$YOUR_DORIS_PASSWORD"
);

INSERT INTO spark_doris VALUES ("VALUE1", "VALUE2", ...);
-- insert into select
INSERT INTO spark_doris SELECT * FROM YOUR_TABLE;
-- insert overwrite
INSERT OVERWRITE SELECT * FROM YOUR_TABLE;
```

### 流式写入

#### DataFrame

##### 结构化数据写入

```scala
val df = spark.readStream.format("your_own_stream_source").load()

df.writeStream
        .format("doris")
        .option("checkpointLocation", "$YOUR_CHECKPOINT_LOCATION")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        .start()
        .awaitTermination()
```

##### 直接写入

如果数据流的第一列数据符合 `Doris` 表结构，比如列顺序相同的 CSV 数据，或者字段名一致的 JSON 数据，可以通过设置 `doris.sink.streaming.passthrough` 选项为 `true` 来直接将这列数据写入，而不用再转换为 `DataFrame`

以 Kafka 源为例。

假设要写入的表结构如下：
```sql
CREATE TABLE `t2` (
                     `c0` int NULL,
                     `c1` varchar(10) NULL,
                     `c2` date NULL
) ENGINE=OLAP
DUPLICATE KEY(`c0`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`c0`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

消息的 value 为 `{"c0":1,"c1":"a","dt":"2024-01-01"}` 格式的 JSON 数据。

```scala
val kafkaSource = spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", "$YOUR_KAFKA_SERVERS")
        .option("startingOffsets", "latest")
        .option("subscribe", "$YOUR_KAFKA_TOPICS")
        .load()

// 选择 value 为 DataFrame 的第一列
kafkaSource.selectExpr("CAST(value as STRING)")
        .writeStream
        .format("doris")
        .option("checkpointLocation", "$YOUR_CHECKPOINT_LOCATION")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        // 设置此选项为 true，会将 DataFrame 的第一列直接写入
        .option("doris.sink.streaming.passthrough", "true")
        .option("doris.sink.properties.format", "json")
        .start()
        .awaitTermination()
```

#### 以 JSON 格式写入

设置 `doris.sink.properties.format` 为 json

```scala
val df = spark.readStream.format("your_own_stream_source").load()

df.write.format("doris")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        .option("doris.sink.properties.format", "json")
        .save()
```

### Spark Doris Catalog

从 24.0.0 版本开始, 支持通过 Spark Catalog 方式访问 Doris。

#### Catalog Config

| 选项名称                                                 | 是否必须 | 注释                                                                                               |
|------------------------------------------------------|------|--------------------------------------------------------------------------------------------------|
| spark.sql.catalog.your_catalog_name                  | 是    | 设置 Catalog 提供者的类名, 对于 Doris 来说唯一的有效值为 `org.apache.doris.spark.catalog.DorisTableCatalog`。        |
| spark.sql.catalog.your_catalog_name.doris.fenodes    | 是    | 设置 Doris FE 节点，格式为 fe_ip:fe_http_port。                                                           |
| spark.sql.catalog.your_catalog_name.doris.query.port | 否    | 设置 Doris FE 查询端口, 当 `spark.sql.catalog.your_catalog_name.doris.fe.auto.fetch` 为 true 时，此选项可以不设置。 |
| spark.sql.catalog.your_catalog_name.doris.user       | 是    | 设置 Doris 用户。                                                                                     |
| spark.sql.catalog.your_catalog_name.doris.password   | 是    | 设置 Doris 密码。                                                                                     |
| spark.sql.defaultCatalog                             | 否    | 设置 Spark SQL 默认 catalog。                                                                         |


:::tip

所有适用于 DataFrame 和 Spark SQL 的连接器参数都可以为 catalog 设置。  
例如，如果要以 json 格式写入数据，可以将选项 `spark.sql.catalog.your_catalog_name.doris.sink.properties.format` 设置为 `json`。

:::

#### DataFrame

```scala
val conf = new SparkConf()
conf.set("spark.sql.catalog.your_catalog_name", "org.apache.doris.spark.catalog.DorisTableCatalog")
conf.set("spark.sql.catalog.your_catalog_name.doris.fenodes", "192.168.0.1:8030")
conf.set("spark.sql.catalog.your_catalog_name.doris.query.port", "9030")
conf.set("spark.sql.catalog.your_catalog_name.doris.user", "root")
conf.set("spark.sql.catalog.your_catalog_name.doris.password", "")
val spark = builder.config(conf).getOrCreate()
spark.sessionState.catalogManager.setCurrentCatalog("your_catalog_name")

// show all databases
spark.sql("show databases")

// use databases
spark.sql("use your_doris_db")

// show tables in test
spark.sql("show tables")

// query table
spark.sql("select * from your_doris_table")

// write data
spark.sql("insert into your_doris_table values(xxx)")
```

#### Spark SQL

设置必要参数并启动 Spark SQL CLI.

```shell
spark-sql \
--conf "spark.sql.catalog.your_catalog_name=org.apache.doris.spark.catalog.DorisTableCatalog" \
--conf "spark.sql.catalog.your_catalog_name.doris.fenodes=192.168.0.1:8030" \
--conf "spark.sql.catalog.your_catalog_name.doris.query.port=9030" \
--conf "spark.sql.catalog.your_catalog_name.doris.user=root" \
--conf "spark.sql.catalog.your_catalog_name.doris.password=" \
--conf "spark.sql.defaultCatalog=your_catalog_name"
```
在 Spark SQL CLI 中执行查询.
```sparksql
-- show all databases
show databases;

-- use databases
use your_doris_db;

// show tables in test
show tables;

-- query table
select * from your_doris_table;

-- write data
insert into your_doris_table values(xxx);
insert into your_doris_table select * from your_source_table;

-- access table with full name
select * from your_catalog_name.your_doris_db.your_doris_table;
insert into your_catalog_name.your_doris_db.your_doris_table values(xxx);
insert into your_catalog_name.your_doris_db.your_doris_table select * from your_source_table;
```

### Java 示例

`samples/doris-demo/spark-demo/` 下提供了 Java
版本的示例，可供参考，[这里](https://github.com/apache/incubator-doris/tree/master/samples/doris-demo/spark-demo)

## 配置

### 通用配置项

| Key                              | Default Value  | Comment                                                                                                                                                                                                            |
|----------------------------------|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| doris.fenodes                    | --             | Doris FE http 地址，支持多个地址，使用逗号分隔                                                                                                                                                                                     |
| doris.table.identifier           | --             | Doris 表名，如：db1.tbl1                                                                                                                                                                                                |
| doris.user                       | --             | 访问 Doris 的用户名                                                                                                                                                                                                      |
| doris.password                   | 空字符串           | 访问 Doris 的密码                                                                                                                                                                                                       |
| doris.request.retries            | 3              | 向 Doris 发送请求的重试次数                                                                                                                                                                                                  |
| doris.request.connect.timeout.ms | 30000          | 向 Doris 发送请求的连接超时时间                                                                                                                                                                                                |
| doris.request.read.timeout.ms    | 30000          | 向 Doris 发送请求的读取超时时间                                                                                                                                                                                                |
| doris.request.query.timeout.s    | 21600           | 查询 doris 的超时时间，默认值为 6 小时，-1 表示无超时限制                                                                                                                                                                                |
| doris.request.tablet.size        | 1              | 一个 RDD Partition 对应的 Doris Tablet 个数。<br />此数值设置越小，则会生成越多的 Partition。从而提升 Spark 侧的并行度，但同时会对 Doris 造成更大的压力。                                                                                                         |
| doris.read.field                 | --             | 读取 Doris 表的列名列表，多列之间使用逗号分隔                                                                                                                                                                                         |
| doris.batch.size                 | 4064           | 一次从 BE 读取数据的最大行数。增大此数值可减少 Spark 与 Doris 之间建立连接的次数。<br />从而减轻网络延迟所带来的额外时间开销。                                                                                                                                        |
| doris.exec.mem.limit             | 8589934592     | 单个查询的内存限制。默认为 8GB，单位为字节                                                                                                                                                                                            |
| doris.write.fields               | --             | 指定写入 Doris 表的字段或者字段顺序，多列之间使用逗号分隔。<br />默认写入时要按照 Doris 表字段顺序写入全部字段。                                                                                                                                                 |
| doris.sink.batch.size            | 500000         | 单次写 BE 的最大行数                                                                                                                                                                                                       |
| doris.sink.max-retries           | 0              | 写 BE 失败之后的重试次数，从 1.3.0 版本开始，默认值为 0，即默认不进行重试。当设置该参数大于 0 时，会进行批次级别的失败重试，会在 Spark Executor 内存中缓存 `doris.sink.batch.size` 所配置大小的数据，可能需要适当增大内存分配。                                                                      |       
| doris.sink.retry.interval.ms           | 10000             | 配置重试次数之后，每次重试的间隔，单位 ms    |       
| doris.sink.properties.format     | csv            | Stream Load 的数据格式。<br/>共支持 3 种格式：csv，json，arrow <br/> [更多参数详情](https://doris.apache.org/zh-CN/docs/data-operate/import/stream-load-manual/)                                                                        |
| doris.sink.properties.*          | --             | Stream Load 的导入参数。<br/>例如:<br/>指定列分隔符：`'doris.sink.properties.column_separator' = ','`等<br/> [更多参数详情](https://doris.apache.org/zh-CN/docs/data-operate/import/stream-load-manual/)                                 |
| doris.sink.task.partition.size   | --             | Doris 写入任务对应的 Partition 个数。Spark RDD 经过过滤等操作，最后写入的 Partition 数可能会比较大，但每个 Partition 对应的记录数比较少，导致写入频率增加和计算资源浪费。<br/>此数值设置越小，可以降低 Doris 写入频率，减少 Doris 合并压力。该参数配合 doris.sink.task.use.repartition 使用。                  |
| doris.sink.task.use.repartition  | false          | 是否采用 repartition 方式控制 Doris 写入 Partition 数。默认值为 false，采用 coalesce 方式控制（注意：如果在写入之前没有 Spark action 算子，可能会导致整个计算并行度降低）。<br/>如果设置为 true，则采用 repartition 方式（注意：可设置最后 Partition 数，但会额外增加 shuffle 开销）。                    |
| doris.sink.batch.interval.ms     | 0             | 每个批次 sink 的间隔时间，单位 ms。                                                                                                                                                                                             |
| doris.sink.enable-2pc            | false          | 是否开启两阶段提交。开启后将会在作业结束时提交事务，而部分任务失败时会将所有预提交状态的事务会滚。                                                                                                                                                                  |
| doris.sink.auto-redirect         | true           | 是否重定向 StreamLoad 请求。开启后 StreamLoad 将通过 FE 写入，不再显式获取 BE 信息。                                                                                                                                                         |
| doris.enable.https               | false          | 是否开启 FE Https 请求。                                                                                                                                                                                                  |
| doris.https.key-store-path       | -              | Https key store 路径。                                                                                                                                                                                                |
| doris.https.key-store-type       | JKS            | Https key store 类型。                                                                                                                                                                                                |
| doris.https.key-store-password   | -              | Https key store 密码。                                                                                                                                                                                                |
| doris.read.mode                  | thrift         | Doris 读取模式，可选项 `thrift` 和 `arrow`。                                                                                                                                                                                 |
| doris.read.arrow-flight-sql.port | -              | Doris FE 的 Arrow Flight SQL 端口，当 `doris.read.mode` 为 `arrow` 时，用于通过 Arrow Flight SQL 方式读取数据。服务端配置方式参考 [基于 Arrow Flight SQL 的高速数据传输链路](https://doris.apache.org/zh-CN/docs/dev/db-connect/arrow-flight-sql-connect) |
| doris.sink.label.prefix          | spark-doris    | Stream Load 方式写入时的导入标签前缀。                                                                                                                                                                                          |
| doris.thrift.max.message.size    | 2147483647     | 通过 Thrift 方式读取数据时，消息的最大尺寸。                                                                                                                                                                                         |
| doris.fe.auto.fetch              | false          | 是否自动获取 FE 信息，当设置为 true 时，会根据 `doris.fenodes` 配置的节点请求所有 FE 节点信息，无需额外配置多个节点以及单独配置 `doris.read.arrow-flight-sql.port` 和 `doris.query.port`。                                                                           |
| doris.read.bitmap-to-string      | false          | 是否将 Bitmap 类型转换为数组索引组成的字符串读取。具体结果形式参考函数定义 [BITMAP_TO_STRING](https://doris.apache.org/zh-CN/docs/dev/sql-manual/sql-functions/bitmap-functions/bitmap-to-string)。                                                  |
| doris.read.bitmap-to-base64      | false          | 是否将 Bitmap 类型转换为 Base64 编码后的字符串读取。具体结果形式参考函数定义 [BITMAP_TO_BASE64](https://doris.apache.org/zh-CN/docs/dev/sql-manual/sql-functions/bitmap-functions/bitmap-to-base64)。                                             |
| doris.query.port                 | -              | Doris FE 查询端口，用于覆盖写入以及 Catalog 的元数据获取。                                                                                                                                                                             |

### SQL 和 Dataframe 专有配置

| Key                             | Default Value | Comment                                                                |
|---------------------------------|--------------|------------------------------------------------------------------------|
| doris.filter.query.in.max.count | 10000        | 谓词下推中，in 表达式 value 列表元素最大数量。超过此数量，则 in 表达式条件过滤在 Spark 侧处理。                    |

### Structured Streaming 专有配置

| Key                              | Default Value | Comment                                                          |
| -------------------------------- | ------------- | ---------------------------------------------------------------- |
| doris.sink.streaming.passthrough | false         | 将第一列的值不经过处理直接写入。                                      |

### RDD 专有配置

| Key                         | Default Value | Comment                                      |
|-----------------------------|---------------|----------------------------------------------|
| doris.request.auth.user     | --            | 访问 Doris 的用户名                                  |
| doris.request.auth.password | --            | 访问 Doris 的密码                                   |
| doris.filter.query          | --            | 过滤读取数据的表达式，此表达式透传给 Doris。Doris 使用此表达式完成源端数据过滤。 |


## Doris 和 Spark 列类型映射关系

| Doris Type | Spark Type              |
|------------|-------------------------|
| NULL_TYPE  | DataTypes.NullType      |
| BOOLEAN    | DataTypes.BooleanType   |
| TINYINT    | DataTypes.ByteType      |
| SMALLINT   | DataTypes.ShortType     |
| INT        | DataTypes.IntegerType   |
| BIGINT     | DataTypes.LongType      |
| FLOAT      | DataTypes.FloatType     |
| DOUBLE     | DataTypes.DoubleType    |
| DATE       | DataTypes.DateType      |
| DATETIME   | DataTypes.TimestampType |
| DECIMAL    | DecimalType             |
| CHAR       | DataTypes.StringType    |
| LARGEINT   | DecimalType             |
| VARCHAR    | DataTypes.StringType    |
| STRING     | DataTypes.StringType    |
| JSON       | DataTypes.StringType    |
| VARIANT    | DataTypes.StringType    |
| TIME       | DataTypes.DoubleType    |
| HLL        | DataTypes.StringType    |
| Bitmap     | DataTypes.StringType    |

:::tip

从 24.0.0 版本开始，Bitmap 类型读取返回类型为字符串，默认返回字符串值 Read unsupported。

:::

## 常见问题
1. **如何写入 Bitmap 类型？**

   在 Spark SQL 中，通过 insert into 方式写入数据时，如果 doris 的目标表中包含 `BITMAP` 或 `HLL` 类型的数据时，需要设置参数 `doris.ignore-type` 为对应类型，并通过 `doris.write.fields` 对列进行映射转换，使用方式如下：

   **BITMAP**
   ```sparksql
   CREATE TEMPORARY VIEW spark_doris
   USING doris
   OPTIONS(
   "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
   "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT",
   "user"="$YOUR_DORIS_USERNAME",
   "password"="$YOUR_DORIS_PASSWORD"
   "doris.ignore-type"="bitmap",
   "doris.write.fields"="col1,col2,col3,bitmap_col2=to_bitmap(col2),bitmap_col3=bitmap_hash(col3)"
   );
   ```
   **HLL**
   ```sparksql
   CREATE TEMPORARY VIEW spark_doris
   USING doris
   OPTIONS(
   "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
   "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT",
   "user"="$YOUR_DORIS_USERNAME",
   "password"="$YOUR_DORIS_PASSWORD"
   "doris.ignore-type"="hll",
   "doris.write.fields"="col1,hll_col1=hll_hash(col1)"
   );
   ```

   :::tip

   从 24.0.0 版本开始，`doris.ignore-type` 被废除，写入时无需添加该参数。  

   :::

2. **如何使用overwrite写入？**

   从 1.3.0 版本开始，支持 overwrite 模式写入（只支持全表级别的数据覆盖），具体使用方式如下
   **DataFrame**
   ```scala
   resultDf.format("doris")
     .option("doris.fenodes","$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
     // your own options
     .mode(SaveMode.Overwrite)
     .save()
   ```
   **SQL**
   ```sparksql
   INSERT OVERWRITE your_target_table SELECT * FROM your_source_table;
   ```

3. **如何读取 Bitmap 类型**

   从 24.0.0 版本开始，支持通过 Arrow Flight SQL 方式读取转换后的 Bitmap 数据（需要 Doris 版本 >= 2.1.0)。

   **Bitmap to string**

   以 `DataFrame` 方式为例，设置 `doris.read.bitmap-to-string` 为 true, 具体结果格式见选项定义。
   ```scala
   spark.read.format("doris")
   .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
   .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
   .option("user", "$YOUR_DORIS_USERNAME")
   .option("password", "$YOUR_DORIS_PASSWORD")
   .option("doris.read.bitmap-to-string","true")
   .load()
   ```

   **Bitmap to base64**

   以 `DataFrame` 方式为例，设置 `doris.read.bitmap-to-base64` 为 true, 具体结果格式见选项定义。
   ```scala
   spark.read.format("doris")
   .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
   .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
   .option("user", "$YOUR_DORIS_USERNAME")
   .option("password", "$YOUR_DORIS_PASSWORD")
   .option("doris.read.bitmap-to-base64","true")
   .load()
   ```

4. **DataFrame 方式写入时报错：`org.apache.spark.sql.AnalysisException: TableProvider implementation doris cannot be written with ErrorIfExists mode, please use Append or Overwrite modes instead.`**
  
   需要添加 save mode 为 append。
   ```scala
   resultDf.format("doris")
    .option("doris.fenodes","$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
    // your own options
    .mode(SaveMode.Append)
    .save()
   ```
   