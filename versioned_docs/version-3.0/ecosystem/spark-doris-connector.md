---
{
   "title": "Spark Doris Connector",
   "language": "en"
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

# Spark Doris Connector

Spark Doris Connector can support reading data stored in Doris and writing data to Doris through Spark.

Github: https://github.com/apache/doris-spark-connector

- Support reading data in batch mode from `Doris` through `RDD`, `DataFrame` and `Spark SQL`. It is recommended to use `DataFrame` or `Spark SQL`
- Support writing data to `Doris` in batch or streaming mode with DataFrame API and Spark SQL.
- You can map the `Doris` table to` DataFrame` or `RDD`, it is recommended to use` DataFrame`.
- Support the completion of data filtering on the `Doris` side to reduce the amount of data transmission.

## Version Compatibility

| Connector | Spark               | Doris       | Java | Scala      |
|-----------|---------------------|-------------|------|------------|
| 25.0.1    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 25.0.0    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 24.0.0    | 3.5 ~ 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 1.3.2     | 3.4 ~ 3.1, 2.4, 2.3 | 1.0 ~ 2.1.6 | 8    | 2.12, 2.11 |
| 1.3.1     | 3.4 ~ 3.1, 2.4, 2.3 | 1.0 ~ 2.1.0 | 8    | 2.12, 2.11 |
| 1.3.0     | 3.4 ~ 3.1, 2.4, 2.3 | 1.0 ~ 2.1.0 | 8    | 2.12, 2.11 |
| 1.2.0     | 3.2, 3.1, 2.3       | 1.0 ~ 2.0.2 | 8    | 2.12, 2.11 |
| 1.1.0     | 3.2, 3.1, 2.3       | 1.0 ~ 1.2.8 | 8    | 2.12, 2.11 |
| 1.0.1     | 3.1, 2.3            | 0.12 - 0.15 | 8    | 2.12, 2.11 |

## How To Use

### Maven
```
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>spark-doris-connector-spark-3.5</artifactId>
    <version>25.0.1</version>
</dependency>
``` 

::: tip

Starting from version 24.0.0, the naming rules of the Doris connector package have been adjusted:
1. No longer contains Scala version information.
2. For Spark 2.x versions, use the package named `spark-doris-connector-spark-2` uniformly, and by default only compile based on Scala 2.11 version. If you need Scala 2.12 version, please compile it yourself.
3. For Spark 3.x versions, use the package named `spark-doris-connector-spark-3.x` according to the specific Spark version. Applications based on Spark 3.0 version can use the package `spark-doris-connector-spark-3.1`.

:::

**Note**

1. Please replace the corresponding Connector version according to different Spark and Scala versions.

2. You can also download the relevant version jar package from [here](https://repo.maven.apache.org/maven2/org/apache/doris/).

### Compile

When compiling, you can directly run `sh build.sh`, for details, please refer to here.

After successful compilation, the target jar package will be generated in the `dist` directory, such as: spark-doris-connector-spark-3.5-25.0.1.jar. Copy this file to the `ClassPath` of `Spark` to use `Spark-Doris-Connector`. For example, for `Spark` running in `Local` mode, put this file in the `jars/` folder. For `Spark` running in `Yarn` cluster mode, put this file in the pre-deployment package.
You can also

Execute in the source code directory:

`sh build.sh`

Enter the Scala and Spark versions you need to compile according to the prompts.

After successful compilation, the target jar package will be generated in the `dist` directory, such as: `spark-doris-connector-spark-3.5-25.0.1.jar`.
Copy this file to the `ClassPath` of `Spark` to use `Spark-Doris-Connector`.

For example, if `Spark` is running in `Local` mode, put this file in the `jars/` folder. If `Spark` is running in `Yarn` cluster mode, put this file in the pre-deployment package.

For example, upload `spark-doris-connector-spark-3.5-25.0.1.jar` to hdfs and add the Jar package path on hdfs to the `spark.yarn.jars` parameter
```shell

1. Upload `spark-doris-connector-spark-3.5-25.0.1.jar` to hdfs.

hdfs dfs -mkdir /spark-jars/
hdfs dfs -put /your_local_path/spark-doris-connector-spark-3.5-25.0.1.jar /spark-jars/

2. Add the `spark-doris-connector-spark-3.5-25.0.1.jar` dependency in the cluster.
spark.yarn.jars=hdfs:///spark-jars/spark-doris-connector-spark-3.5-25.0.1.jar

```

## Example

### Batch Read

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

#### Reading via Arrow Flight SQL

Starting from version 24.0.0, data can be read via Arrow Flight SQL (Doris version >= 2.1.0 is required).

Set `doris.read.mode` to arrow, set `doris.read.arrow-flight-sql.port` to the Arrow Flight SQL port configured by FE.

For server configuration, refer to [High-speed data transmission link based on Arrow Flight SQL](https://doris.apache.org/zh-CN/docs/dev/db-connect/arrow-flight-sql-connect).

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

### Batch Write

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
  //other options
  //specify the fields to write
  .option("doris.write.fields", "$YOUR_FIELDS_TO_WRITE")
  // Support setting Overwrite mode to overwrite data
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

### Streaming Write

#### DataFrame

##### Write structured data

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

##### Write directly

If the first column of data in the data stream is formatted data that conforms to the `Doris` table structure, such as CSV format data with the same column order, or JSON format data with the same field name, it can be written directly to `Doris` by setting the `doris.sink.streaming.passthrough` option to `true` without converting to `DataFrame`.

Taking kafka as an example.

And assuming the table structure to be written is:
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

The value of the message is `{"c0":1,"c1":"a","dt":"2024-01-01"}` in json format.

```scala
val kafkaSource = spark.readStream
  .format("kafka")
  .option("kafka.bootstrap.servers", "$YOUR_KAFKA_SERVERS")
  .option("startingOffsets", "latest")
  .option("subscribe", "$YOUR_KAFKA_TOPICS")
  .load()

// Select the value of the message as the first column of the DataFrame.
kafkaSource.selectExpr("CAST(value as STRING)")
  .writeStream
  .format("doris")
  .option("checkpointLocation", "$YOUR_CHECKPOINT_LOCATION")
  .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
  .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
  .option("user", "$YOUR_DORIS_USERNAME")
  .option("password", "$YOUR_DORIS_PASSWORD")
  // Set this option to true, and the first column will be written directly without processing.
  .option("doris.sink.streaming.passthrough", "true")
  .option("doris.sink.properties.format", "json")
  .start()
  .awaitTermination()
```

#### Write in JSON format

Set `doris.sink.properties.format` to json

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

Since version 24.0.0, support accessing doris through Spark Catalog.

#### Catalog Config

| Key                                                  | Required | Comment                                                                                                                         |
|------------------------------------------------------|----------|---------------------------------------------------------------------------------------------------------------------------------|
| spark.sql.catalog.your_catalog_name                  | true     | Set class name of catalog provider, the only valid value for Doris is `org.apache.doris.spark.catalog.DorisTableCatalog`        |
| spark.sql.catalog.your_catalog_name.doris.fenodes    | true     | Set Doris FE node in the format fe_ip:fe_http_port                                                                              |
| spark.sql.catalog.your_catalog_name.doris.query.port | false    | Set Doris FE query port, this option is unnecessary if `spark.sql.catalog.your_catalog_name.doris.fe.auto.fetch` is set to true |
| spark.sql.catalog.your_catalog_name.doris.user       | true     | Set Doris user                                                                                                                  |
| spark.sql.catalog.your_catalog_name.doris.password   | true     | Set Doris password                                                                                                              |
| spark.sql.defaultCatalog                             | false    | Set Spark SQL default catalog                                                                                                   |

:::tip

All connector parameters that apply to DataFrame and Spark SQL can be set for catalog.  
For example, if you want to write data in json format, you can set the option `spark.sql.catalog.your_catalog_name.doris.sink.properties.format` to `json`.

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

Start Spark SQL CLI with necessary config.

```shell
spark-sql \
--conf "spark.sql.catalog.your_catalog_name=org.apache.doris.spark.catalog.DorisTableCatalog" \
--conf "spark.sql.catalog.your_catalog_name.doris.fenodes=192.168.0.1:8030" \
--conf "spark.sql.catalog.your_catalog_name.doris.query.port=9030" \
--conf "spark.sql.catalog.your_catalog_name.doris.user=root" \
--conf "spark.sql.catalog.your_catalog_name.doris.password=" \
--conf "spark.sql.defaultCatalog=your_catalog_name"
```
Execute query in Spark SQL CLI.
```sparksql
-- show all databases
show databases;

-- use databases
use your_doris_db;

-- show tables in test
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

## Configuration

### General

| Key                              | Default Value | Comment                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
|----------------------------------|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| doris.fenodes                    | --            | Doris FE http address, support multiple addresses, separated by commas                                                                                                                                                                                                                                                                                                                                                                                                          |
| doris.table.identifier           | --            | Doris table identifier, eg, db1.tbl1                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| doris.user                       | --            | Doris username                                                                                                                                                                                 |
| doris.password                   | Empty string  | Doris password                                                                                                                                                                                 |
| doris.request.retries            | 3             | Number of retries to send requests to Doris                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| doris.request.connect.timeout.ms | 30000         | Connection timeout for sending requests to Doris                                                                                                                                                                                                                                                                                                                                                                                                                                |
| doris.request.read.timeout.ms    | 30000         | Read timeout for sending request to Doris                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| doris.request.query.timeout.s    | 3600          | Query the timeout time of doris, the default is 1 hour, -1 means no timeout limit                                                                                                                                                                                                                                                                                                                                                                                               |
| doris.request.tablet.size        | 1             | The number of Doris Tablets corresponding to an RDD Partition. The smaller this value is set, the more partitions will be generated. This will increase the parallelism on the Spark side, but at the same time will cause greater pressure on Doris.                                                                                                                                                                                                                           |
| doris.read.field                 | --            | List of column names in the Doris table, separated by commas                                                                                                                                                                                                                                                                                                                                                                                                                    |
| doris.batch.size                 | 4064          | The maximum number of rows to read data from BE at one time. Increasing this value can reduce the number of connections between Spark and Doris. Thereby reducing the extra time overhead caused by network delay.                                                                                                                                                                                                                                                              |
| doris.exec.mem.limit             | 8589934592    | Memory limit for a single query. The default is 8GB, in bytes.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| doris.write.fields               | --            | Specifies the fields (or the order of the fields) to write to the Doris table, fileds separated by commas.<br/>By default, all fields are written in the order of Doris table fields.                                                                                                                                                                                                                                                                                           |
| doris.sink.batch.size            | 100000        | Maximum number of lines in a single write BE                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| doris.sink.max-retries           | 0             | Number of retries after writing BE, Since version 1.3.0, the default value is 0, which means no retries are performed by default. When this parameter is set greater than 0, batch-level failure retries will be performed, and data of the configured size of `doris.sink.batch.size` will be cached in the Spark Executor memory. The memory allocation may need to be appropriately increased.                                                                               |
| doris.sink.properties.format     | --            | Data format of the stream load.<br/>Supported formats: csv, json, arrow <br/> [More Multi-parameter details](../data-operate/import/import-way/stream-load-manual)                                                                                                                                                                                                                                                                                                                      |
| doris.sink.properties.*          | --            | Import parameters for Stream Load. <br/>For example:<br/>Specify column separator: `'doris.sink.properties.column_separator' = ','`.<br/>[More parameter details](../data-operate/import/import-way/stream-load-manual)                                                                                                                                                                                                                                                                 |
| doris.sink.task.partition.size   | --            | The number of partitions corresponding to the Writing task. After filtering and other operations, the number of partitions written in Spark RDD may be large, but the number of records corresponding to each Partition is relatively small, resulting in increased writing frequency and waste of computing resources. The smaller this value is set, the less Doris write frequency and less Doris merge pressure. It is generally used with doris.sink.task.use.repartition. |
| doris.sink.task.use.repartition  | false         | Whether to use repartition mode to control the number of partitions written by Doris. The default value is false, and coalesce is used (note: if there is no Spark action before the write, the whole computation will be less parallel). If it is set to true, then repartition is used (note: you can set the final number of partitions at the cost of shuffle).                                                                                                             |
| doris.sink.batch.interval.ms     | 50            | The interval time of each batch sink, unit ms.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| doris.sink.enable-2pc            | false         | Whether to enable two-stage commit. When enabled, transactions will be committed at the end of the job, and all pre-commit transactions will be rolled back when some tasks fail.                                                                                                                                                                                                                                                                                               |
| doris.sink.auto-redirect         | true          | Whether to redirect StreamLoad requests. After being turned on, StreamLoad will write through FE and no longer obtain BE information explicitly.                                                                                                                                                                                                                                                                                                                                |
| doris.enable.https               | false         | Whether to enable FE Https request.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| doris.https.key-store-path       | -             | Https key store path.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| doris.https.key-store-type       | JKS           | Https key store type.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| doris.https.key-store-password   | -             | Https key store password.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| doris.read.mode                  | thrift        | Doris read mode, with optional `thrift` and `arrow`.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| doris.read.arrow-flight-sql.port | -             | Arrow Flight SQL port of Doris FE. When `doris.read.mode` is `arrow`, it is used to read data via Arrow Flight SQL. For server configuration, see [High-speed data transmission link based on Arrow Flight SQL](https://doris.apache.org/zh-CN/docs/dev/db-connect/arrow-flight-sql-connect)                                                                                                                                                                                    |
| doris.sink.label.prefix          | spark-doris   | The import label prefix when writing in Stream Load mode.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| doris.thrift.max.message.size    | 2147483647    | The maximum size of a message when reading data via Thrift.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| doris.fe.auto.fetch              | false         | Whether to automatically obtain FE information. When set to true, all FE node information will be requested according to the nodes configured by `doris.fenodes`. There is no need to configure multiple nodes and configure `doris.read.arrow-flight-sql.port` and `doris.query.port` separately.                                                                                                                                                                              |
| doris.read.bitmap-to-string      | false         | Whether to convert the Bitmap type to a string composed of array indexes for reading. For the specific result format, see the function definition [BITMAP_TO_STRING](https://doris.apache.org/zh-CN/docs/dev/sql-manual/sql-functions/bitmap-functions/bitmap-to-string).                                                                                                                                                                                                       |
| doris.read.bitmap-to-base64      | false         | Whether to convert the Bitmap type to a Base64-encoded string for reading. For the specific result format, see the function definition [BITMAP_TO_BASE64](https://doris.apache.org/zh-CN/docs/dev/sql-manual/sql-functions/bitmap-functions/bitmap-to-base64).                                                                                                                                                                                                                  |
| doris.query.port                 | -             | Doris FE query port, used for overwriting and obtaining metadata of the Catalog.                                                                                                                                                                                                                                                                                                                                                                                                |


### SQL & Dataframe Configuration

| Key                             | Default Value | Comment                                                                                                                                                                                        |
|---------------------------------|---------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| doris.filter.query.in.max.count | 100           | In the predicate pushdown, the maximum number of elements in the in expression value list. If this number is exceeded, the in-expression conditional filtering is processed on the Spark side. |

### Structured Streaming Configuration

| Key                              | Default Value | Comment                                                          |
| -------------------------------- | ------------- | ---------------------------------------------------------------- |
| doris.sink.streaming.passthrough | false         | Write the value of the first column directly without processing. |

### RDD Configuration

| Key                         | Default Value | Comment                                                                                                                                         |
|-----------------------------|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| doris.request.auth.user     | --            | Doris username                                                                                                                                  |
| doris.request.auth.password | --            | Doris password                                                                                                                                  |
| doris.filter.query          | --            | Filter expression of the query, which is transparently transmitted to Doris. Doris uses this expression to complete source-side data filtering. |


## Doris & Spark Column Type Mapping

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

Since version 24.0.0, the return type of the Bitmap type is string type, and the default return value is string value `Read unsupported`.

:::

## FAQ

1. How to write Bitmap type

   In Spark SQL, when writing data through insert into, if the target table of doris contains data of type `BITMAP` or `HLL`, you need to set the option `doris.ignore-type` to the corresponding type and map the columns through `doris.write.fields`. The usage is as follows:

   **BITMAP**
    ```sql
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
    ```sql
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

   Since version 24.0.0, `doris.ignore-type` has been deprecated and there is no need to add this parameter when writing.

   :::

2. **How to use overwrite to write?**

   Since version 1.3.0, overwrite mode writing is supported (only supports data overwriting at the full table level). The specific usage is as follows:

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
    INSERT OVERWRITE your_target_table SELECT * FROM your_source_table
    ```

3. **How to read Bitmap type**

   Starting from version 24.0.0, it supports reading converted Bitmap data through Arrow Flight SQL (Doris version >= 2.1.0 is required).

   **Bitmap to string**

   `DataFrame` example is as follows, set `doris.read.bitmap-to-string` to true. For the specific result format, see the option definition.
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

   `DataFrame` example is as follows, set `doris.read.bitmap-to-base64` to true. For the specific result format, see the option definition.
   ```scala
   spark.read.format("doris")
   .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
   .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
   .option("user", "$YOUR_DORIS_USERNAME")
   .option("password", "$YOUR_DORIS_PASSWORD")
   .option("doris.read.bitmap-to-base64","true")
   .load()
   ```

4. **An error occurs when writing in DataFrame mode: `org.apache.spark.sql.AnalysisException: TableProvider implementation doris cannot be written with ErrorIfExists mode, please use Append or Overwrite modes instead.`**

   Need to add save mode to append.
    ```scala 
    resultDf.format("doris")
      .option("doris.fenodes","$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT") 
      // your own options 
      .mode(SaveMode.Append)
      .save() 
   ```