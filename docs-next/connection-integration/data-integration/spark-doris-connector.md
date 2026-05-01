---
{
    "title": "Spark Doris Connector",
    "language": "en",
    "description": "Use the Spark Doris Connector to batch read, batch write, and stream write Doris in Apache Spark, with support for DataFrame, Spark SQL, Catalog, and Arrow Flight SQL.",
    "keywords": [
        "Spark Doris Connector",
        "Apache Spark read and write Doris",
        "Doris DataFrame",
        "Doris Spark SQL",
        "Spark Doris Catalog",
        "Arrow Flight SQL"
    ]
}
---

# Spark Doris Connector

<!-- Knowledge type: Operation guide + Configuration parameters + FAQ -->
<!-- Applicable scenarios: Spark reading Doris / Spark writing Doris / Spark SQL integration / Streaming write / Arrow Flight SQL high-speed read -->

The Spark Doris Connector is the connector between Apache Doris and Apache Spark. It supports reading data stored in Doris through Spark, and also supports writing data to Doris through Spark. Repository: [apache/doris-spark-connector](https://github.com/apache/doris-spark-connector).

The main capabilities are as follows:

| Use case | Recommended approach | Description |
| --- | --- | --- |
| Batch read Doris data | DataFrame, Spark SQL | RDD is also supported. DataFrame or Spark SQL is recommended. |
| Batch write Doris data | DataFrame, Spark SQL | Supports specifying the columns to write, and supports the Overwrite mode starting from version 1.3.0. |
| Stream write Doris data | Structured Streaming | Supports writing standard structured data, and also supports passing through the first column of the DataFrame directly. |
| High-speed read Doris data | Arrow Flight SQL | Supported starting from version 24.0.0. Requires Doris version >= 2.1.0. |
| Access Doris through Catalog | Spark Doris Catalog | Supported starting from version 24.0.0. You can manage Doris databases and tables through Spark Catalog. |

## Before you start

<!-- Knowledge type: Version compatibility + Installation -->
<!-- Applicable scenarios: Pre-integration preparation / Dependency selection -->

### Version compatibility

First select the corresponding Connector version based on your Spark, Doris, Java, and Scala versions.

| Connector | Spark | Doris | Java | Scala |
| --- | --- | --- | --- | --- |
| 26.0.0 | 3.5 - 3.1, 2.4 | 1.0 + | 8 | 2.12, 2.11 |
| 25.2.0 | 3.5 - 3.1, 2.4 | 1.0 + | 8 | 2.12, 2.11 |
| 25.1.0 | 3.5 - 3.1, 2.4 | 1.0 + | 8 | 2.12, 2.11 |
| 25.0.1 | 3.5 - 3.1, 2.4 | 1.0 + | 8 | 2.12, 2.11 |
| 25.0.0 | 3.5 - 3.1, 2.4 | 1.0 + | 8 | 2.12, 2.11 |
| 1.3.2 | 3.4 - 3.1, 2.4, 2.3 | 1.0 - 2.1.6 | 8 | 2.12, 2.11 |
| 1.3.1 | 3.4 - 3.1, 2.4, 2.3 | 1.0 - 2.1.0 | 8 | 2.12, 2.11 |
| 1.3.0 | 3.4 - 3.1, 2.4, 2.3 | 1.0 - 2.1.0 | 8 | 2.12, 2.11 |
| 1.2.0 | 3.2, 3.1, 2.3 | 1.0 - 2.0.2 | 8 | 2.12, 2.11 |
| 1.1.0 | 3.2, 3.1, 2.3 | 1.0 - 1.2.8 | 8 | 2.12, 2.11 |
| 1.0.1 | 3.1, 2.3 | 0.12 - 0.15 | 8 | 2.12, 2.11 |

### Add the dependency through Maven

Add the Spark Doris Connector dependency in your project `pom.xml`, and replace `artifactId` and `version` according to your actual Spark and Connector versions:

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>spark-doris-connector-spark-3.5</artifactId>
    <version>25.2.0</version>
</dependency>
```

:::tip

Starting from version 24.0.0, the Doris Connector package naming convention has been adjusted:

1. The Scala version information is no longer included.
2. For Spark 2.x, a unified package named `spark-doris-connector-spark-2` is used, and it is compiled only against Scala 2.11 by default. If you need the Scala 2.12 version, please compile it yourself.
3. For Spark 3.x, use the package named `spark-doris-connector-spark-3.x` corresponding to your Spark version. For Spark 3.0, the `spark-doris-connector-spark-3.1` package can be used.

:::

You can also download the Jar file of the corresponding version from the [Maven repository](https://repo.maven.apache.org/maven2/org/apache/doris/).

### Compile from source

If you need to compile the source code yourself, run `sh build.sh` in the source directory and enter the required Scala and Spark versions when prompted.

After successful compilation, the target Jar file is generated in the `dist` directory, for example `spark-doris-connector-spark-3.5-25.2.0.jar`. Copy this file into the Spark `classpath` to start using the Spark Doris Connector:

| Spark run mode | How to place the Jar file |
| --- | --- |
| Local mode | Place the Jar file in the `jars/` directory. |
| Yarn cluster mode | Place the Jar file in the pre-deployed package. |

For example, upload `spark-doris-connector-spark-3.5-25.2.0.jar` to HDFS and add the dependency through `spark.yarn.jars`:

```shell
# 1. Upload spark-doris-connector-spark-3.5-25.2.0.jar to HDFS
hdfs dfs -mkdir /spark-jars/
hdfs dfs -put /your_local_path/spark-doris-connector-spark-3.5-25.2.0.jar /spark-jars/

# 2. Add the spark-doris-connector-spark-3.5-25.2.0.jar dependency in the cluster
spark.yarn.jars=hdfs:///spark-jars/spark-doris-connector-spark-3.5-25.2.0.jar
```

## Scenario 1: Batch read Doris data

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Spark batch reading Doris data -->

The Spark Doris Connector supports reading Doris data through DataFrame, Spark SQL, RDD, and PySpark. When reading Doris data, DataFrame or Spark SQL is recommended.

### Read through DataFrame

```scala
val dorisSparkDF = spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .load()

dorisSparkDF.show(5)
```

### Read through Spark SQL

```sparksql
CREATE TEMPORARY VIEW spark_doris
USING doris
OPTIONS(
    "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
    "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT",
    "user"="$YOUR_DORIS_USERNAME",
    "password"="$YOUR_DORIS_PASSWORD"
);

SELECT * FROM spark_doris;
```

### Read through RDD

```scala
import org.apache.doris.spark._

val dorisSparkRDD = sc.dorisRDD(
    tableIdentifier = Some("$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME"),
    cfg = Some(Map(
        "doris.fenodes" -> "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT",
        "doris.request.auth.user" -> "$YOUR_DORIS_USERNAME",
        "doris.request.auth.password" -> "$YOUR_DORIS_PASSWORD"
    ))
)

dorisSparkRDD.collect()
```

### Read through PySpark

```python
dorisSparkDF = spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .load()

# Show 5 rows of data
dorisSparkDF.show(5)
```

### High-speed read through Arrow Flight SQL

Starting from version 24.0.0, the Spark Doris Connector supports reading data through Arrow Flight SQL. This approach requires Doris version >= 2.1.0.

The following parameters need to be set:

| Parameter | Description |
| --- | --- |
| `doris.read.mode` | Set to `arrow`, indicating that data is read through Arrow Flight SQL. |
| `doris.read.arrow-flight-sql.port` | Set to the Arrow Flight SQL port configured on the FE. |

For server-side configuration, refer to [High-speed data transmission link based on Arrow Flight SQL](../arrow-flight-sql.md).

```scala
val df = spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("doris.user", "$YOUR_DORIS_USERNAME")
    .option("doris.password", "$YOUR_DORIS_PASSWORD")
    .option("doris.read.mode", "arrow")
    .option("doris.read.arrow-flight-sql.port", "12345")
    .load()

df.show()
```

## Scenario 2: Batch write Doris data

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Spark batch writing Doris data -->

The Spark Doris Connector supports batch writing Doris data through DataFrame and Spark SQL.

### Write through DataFrame

```scala
val mockDataDF = List(
    (3, "440403001005", "21.cn"),
    (1, "4404030013005", "22.cn"),
    (33, null, "23.cn")
).toDF("id", "mi_code", "mi_name")

mockDataDF.show(5)

mockDataDF.write.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    // Specify the columns to write
    .option("doris.write.fields", "$YOUR_FIELDS_TO_WRITE")
    // Overwrite is supported starting from version 1.3.0
    // .mode(SaveMode.Overwrite)
    .save()
```

### Write through Spark SQL

```sparksql
CREATE TEMPORARY VIEW spark_doris
USING doris
OPTIONS(
    "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
    "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT",
    "user"="$YOUR_DORIS_USERNAME",
    "password"="$YOUR_DORIS_PASSWORD"
);

INSERT INTO spark_doris VALUES ("VALUE1", "VALUE2", ...);

-- insert into select
INSERT INTO spark_doris SELECT * FROM YOUR_TABLE;

-- insert overwrite
INSERT OVERWRITE spark_doris SELECT * FROM YOUR_TABLE;
```

## Scenario 3: Stream write Doris data

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Spark Structured Streaming writing Doris data -->

The Spark Doris Connector supports writing to Doris through Structured Streaming. Depending on whether the data already conforms to the Doris table schema, you can choose either structured-data write or pass-through write of the first column.

### Structured-data write

```scala
val df = spark.readStream.format("your_own_stream_source").load()

df.writeStream
    .format("doris")
    .option("checkpointLocation", "$YOUR_CHECKPOINT_LOCATION")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .start()
    .awaitTermination()
```

### Write the first column of the data stream directly

If the first column of the data stream conforms to the Doris table schema, for example CSV data with the same column order, or JSON data with matching field names, you can set `doris.sink.streaming.passthrough` to `true` to write the first column directly, without expanding the content into multiple DataFrame columns.

The following example uses Kafka as the source. Assume that the target Doris table has the following schema:

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

The Kafka message `value` is JSON data in the form `{"c0":1,"c1":"a","c2":"2024-01-01"}`.

```scala
val kafkaSource = spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "$YOUR_KAFKA_SERVERS")
    .option("startingOffsets", "latest")
    .option("subscribe", "$YOUR_KAFKA_TOPICS")
    .load()

// Select value as the first column of the DataFrame
kafkaSource.selectExpr("CAST(value as STRING)")
    .writeStream
    .format("doris")
    .option("checkpointLocation", "$YOUR_CHECKPOINT_LOCATION")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    // Setting this option to true writes the first column of the DataFrame directly
    .option("doris.sink.streaming.passthrough", "true")
    .option("doris.sink.properties.format", "json")
    .start()
    .awaitTermination()
```

### Write in JSON format

After setting `doris.sink.properties.format` to `json`, the Connector writes data to Doris in JSON format.

```scala
val df = spark.readStream.format("your_own_stream_source").load()

df.writeStream
    .format("doris")
    .option("checkpointLocation", "$YOUR_CHECKPOINT_LOCATION")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.sink.properties.format", "json")
    .start()
    .awaitTermination()
```

## Scenario 4: Access Doris through the Spark Doris Catalog

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Spark Catalog managing Doris databases and tables -->

Starting from version 24.0.0, the Spark Doris Connector supports accessing Doris through the Spark Catalog.

### Catalog configuration options

| Option name | Required | Description |
| --- | --- | --- |
| `spark.sql.catalog.your_catalog_name` | Yes | Sets the class name of the Catalog provider. For Doris, the only valid value is `org.apache.doris.spark.catalog.DorisTableCatalog`. |
| `spark.sql.catalog.your_catalog_name.doris.fenodes` | Yes | Sets the Doris FE node, in the format `fe_ip:fe_http_port`. |
| `spark.sql.catalog.your_catalog_name.doris.query.port` | No | Sets the Doris FE query port. When `spark.sql.catalog.your_catalog_name.doris.fe.auto.fetch` is `true`, this option can be omitted. |
| `spark.sql.catalog.your_catalog_name.doris.user` | Yes | Sets the Doris user. |
| `spark.sql.catalog.your_catalog_name.doris.password` | Yes | Sets the Doris password. |
| `spark.sql.defaultCatalog` | No | Sets the default Catalog for Spark SQL. |

:::tip

All connector parameters that apply to DataFrame and Spark SQL can also be set on the Catalog. For example, to write data in JSON format, set `spark.sql.catalog.your_catalog_name.doris.sink.properties.format` to `json`.

:::

### Use the Catalog in a DataFrame program

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

### Use the Catalog in the Spark SQL CLI

Set the required parameters and start the Spark SQL CLI:

```shell
spark-sql \
--conf "spark.sql.catalog.your_catalog_name=org.apache.doris.spark.catalog.DorisTableCatalog" \
--conf "spark.sql.catalog.your_catalog_name.doris.fenodes=192.168.0.1:8030" \
--conf "spark.sql.catalog.your_catalog_name.doris.query.port=9030" \
--conf "spark.sql.catalog.your_catalog_name.doris.user=root" \
--conf "spark.sql.catalog.your_catalog_name.doris.password=" \
--conf "spark.sql.defaultCatalog=your_catalog_name"
```

Run queries in the Spark SQL CLI:

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

## Java example

A Java version of the example is available under `samples/doris-demo/spark-demo/`. Refer to the [apache/doris example directory](https://github.com/apache/doris/tree/master/samples/doris-demo/spark-demo).

## Configuration reference

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Parameter lookup / Performance tuning / Write behavior tuning -->

### Common configuration options

| Key | Default Value | Comment |
| --- | --- | --- |
| `doris.fenodes` | -- | Doris FE HTTP address. Multiple addresses are supported, separated by commas. |
| `doris.table.identifier` | -- | Doris table name, for example `db1.tbl1`. |
| `doris.user` | -- | Username for accessing Doris. |
| `doris.password` | Empty string | Password for accessing Doris. |
| `doris.request.retries` | 3 | Number of retries when sending requests to Doris. |
| `doris.request.connect.timeout.ms` | 30000 | Connect timeout when sending requests to Doris. |
| `doris.request.read.timeout.ms` | 30000 | Read timeout when sending requests to Doris. |
| `doris.request.query.timeout.s` | 21600 | Query timeout for Doris queries. The default value is 6 hours. `-1` means no timeout limit. |
| `doris.request.tablet.size` | 1 | Number of Doris Tablets corresponding to one RDD Partition. The smaller this value, the more Partitions are generated, increasing parallelism on the Spark side, but also putting more pressure on Doris. |
| `doris.read.field` | -- | List of column names to read from the Doris table, separated by commas. |
| `doris.batch.size` | 4064 | Maximum number of rows read from a BE in one batch. Increasing this value reduces the number of connections established between Spark and Doris, thus reducing the extra time overhead caused by network latency. |
| `doris.exec.mem.limit` | 8589934592 | Memory limit for a single query. The default is 8 GB, in bytes. |
| `doris.write.fields` | -- | Specifies the fields or field order to write to the Doris table, separated by commas. By default, all fields are written in the order of the Doris table fields. |
| `doris.sink.batch.size` | 500000 | Maximum number of rows written to BE in a single batch. |
| `doris.sink.max-retries` | 0 | Number of retries after a write to BE fails. Starting from version 1.3.0, the default value is 0, meaning no retries by default. When this parameter is greater than 0, batch-level retries are performed and `doris.sink.batch.size` worth of data is cached in Spark Executor memory, so memory allocation may need to be increased accordingly. |
| `doris.sink.retry.interval.ms` | 10000 | Interval between retries after the retry count is configured, in ms. |
| `doris.sink.properties.format` | csv | Data format for Stream Load. Three formats are supported: `csv`, `json`, and `arrow`. For more parameters, refer to the [Stream Load manual](../../data-operate/import/import-way/stream-load-manual.md). |
| `doris.sink.properties.*` | -- | Import parameters for Stream Load. For example, specify the column separator with `'doris.sink.properties.column_separator' = ','`. For more parameters, refer to the [Stream Load manual](../../data-operate/import/import-way/stream-load-manual.md). |
| `doris.sink.task.partition.size` | -- | Number of Partitions corresponding to the Doris write task. After Spark RDD operations such as filtering, the final number of Partitions to write may be large, but the number of records per Partition may be small, leading to increased write frequency and wasted compute resources. The smaller this value, the lower the Doris write frequency and the less compaction pressure on Doris. This parameter is used together with `doris.sink.task.use.repartition`. |
| `doris.sink.task.use.repartition` | false | Whether to use repartition to control the number of Partitions written to Doris. The default value is `false`, meaning coalesce is used. Note that if there is no Spark action operator before the write, the overall computation parallelism may be reduced. If set to `true`, repartition is used. Note that the final Partition count can be set, but extra shuffle overhead is added. |
| `doris.sink.batch.interval.ms` | 0 | Interval between sink batches, in ms. |
| `doris.sink.enable-2pc` | false | Whether to enable two-phase commit. When enabled, transactions are committed at the end of the job, and if some tasks fail, all transactions in pre-commit state are rolled back. |
| `doris.sink.auto-redirect` | true | Whether to redirect Stream Load requests. When enabled, Stream Load is written through the FE, and BE information is no longer fetched explicitly. |
| `doris.enable.https` | false | Whether to enable FE HTTPS requests. |
| `doris.https.key-store-path` | - | HTTPS key store path. |
| `doris.https.key-store-type` | JKS | HTTPS key store type. |
| `doris.https.key-store-password` | - | HTTPS key store password. |
| `doris.read.mode` | thrift | Doris read mode. Available options are `thrift` and `arrow`. |
| `doris.read.arrow-flight-sql.port` | - | Arrow Flight SQL port of the Doris FE. When `doris.read.mode` is `arrow`, this is used to read data through Arrow Flight SQL. For server-side configuration, refer to [High-speed data transmission link based on Arrow Flight SQL](../arrow-flight-sql.md). |
| `doris.sink.label.prefix` | spark-doris | Import label prefix when writing through Stream Load. |
| `doris.thrift.max.message.size` | 2147483647 | Maximum message size when reading data through Thrift. |
| `doris.fe.auto.fetch` | false | Whether to automatically fetch FE information. When set to `true`, all FE node information is fetched based on the nodes configured in `doris.fenodes`, so there is no need to configure multiple nodes or to configure `doris.read.arrow-flight-sql.port` and `doris.query.port` separately. |
| `doris.read.bitmap-to-string` | false | Whether to convert the Bitmap type to a string composed of array indexes when reading. For the result format, refer to the function definition [BITMAP_TO_STRING](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-string.md). |
| `doris.read.bitmap-to-base64` | false | Whether to convert the Bitmap type to a Base64-encoded string when reading. For the result format, refer to the function definition [BITMAP_TO_BASE64](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-base64.md). |
| `doris.query.port` | - | Doris FE query port, used for overwrite writing and Catalog metadata fetching. |

### SQL- and DataFrame-specific configuration

| Key | Default Value | Comment |
| --- | --- | --- |
| `doris.filter.query.in.max.count` | 10000 | In predicate pushdown, the maximum number of value-list elements for the `in` expression. When the count exceeds this value, the `in` expression filter is processed on the Spark side. |

### Structured Streaming-specific configuration

| Key | Default Value | Comment |
| --- | --- | --- |
| `doris.sink.streaming.passthrough` | false | Writes the first column value directly without processing. |

### RDD-specific configuration

| Key | Default Value | Comment |
| --- | --- | --- |
| `doris.request.auth.user` | -- | Username for accessing Doris. |
| `doris.request.auth.password` | -- | Password for accessing Doris. |
| `doris.filter.query` | -- | Expression for filtering the data being read. This expression is passed through to Doris, and Doris uses it to filter the source data. |

## Type mapping

<!-- Knowledge type: Type mapping reference -->
<!-- Applicable scenarios: Schema design / Read-write type compatibility check -->

### Doris-to-Spark column type mapping

| Doris Type | Spark Type |
| --- | --- |
| NULL_TYPE | DataTypes.NullType |
| BOOLEAN | DataTypes.BooleanType |
| TINYINT | DataTypes.ByteType |
| SMALLINT | DataTypes.ShortType |
| INT | DataTypes.IntegerType |
| BIGINT | DataTypes.LongType |
| FLOAT | DataTypes.FloatType |
| DOUBLE | DataTypes.DoubleType |
| DATE | DataTypes.DateType |
| DATETIME | DataTypes.TimestampType |
| DECIMAL | DecimalType |
| CHAR | DataTypes.StringType |
| LARGEINT | DecimalType |
| VARCHAR | DataTypes.StringType |
| STRING | DataTypes.StringType |
| JSON | DataTypes.StringType |
| VARIANT | DataTypes.StringType |
| TIME | DataTypes.DoubleType |
| HLL | DataTypes.StringType |
| Bitmap | DataTypes.StringType |

### Spark-to-Doris data type mapping

| Spark Type | Doris Type |
| --- | --- |
| BooleanType | BOOLEAN |
| ShortType | SMALLINT |
| IntegerType | INT |
| LongType | BIGINT |
| FloatType | FLOAT |
| DoubleType | DOUBLE |
| DecimalType | DECIMAL |
| StringType | VARCHAR/STRING |
| DateType | DATE |
| TimestampType | DATETIME |
| ArrayType | ARRAY |
| MapType | MAP/JSON |
| StructType | STRUCT/JSON |

:::tip

Starting from version 24.0.0, the read return type for the Bitmap type is string, and the default returned string value is `Read unsupported`.

:::

## FAQ and troubleshooting

<!-- Knowledge type: FAQ + Troubleshooting -->
<!-- Applicable scenarios: Bitmap/HLL writing / Overwrite writing / ErrorIfExists error handling -->

### How to write the Bitmap type?

In Spark SQL, when writing data through `INSERT INTO`, if the Doris target table contains data of type `BITMAP` or `HLL`, set the parameter `doris.ignore-type` to the corresponding type, and use `doris.write.fields` to map and convert the columns.

**BITMAP**

```sparksql
CREATE TEMPORARY VIEW spark_doris
USING doris
OPTIONS(
    "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
    "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT",
    "user"="$YOUR_DORIS_USERNAME",
    "password"="$YOUR_DORIS_PASSWORD",
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
    "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT",
    "user"="$YOUR_DORIS_USERNAME",
    "password"="$YOUR_DORIS_PASSWORD",
    "doris.ignore-type"="hll",
    "doris.write.fields"="col1,hll_col1=hll_hash(col1)"
);
```

:::tip

Starting from version 24.0.0, `doris.ignore-type` is deprecated. There is no need to add this parameter when writing.

:::

### How to use Overwrite writing?

Starting from version 1.3.0, the Connector supports the Overwrite mode for writing. Overwrite only supports full-table data replacement. The usage is as follows.

**DataFrame**

```scala
resultDf.write.format("doris")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    // your own options
    .mode(SaveMode.Overwrite)
    .save()
```

**SQL**

```sparksql
INSERT OVERWRITE your_target_table SELECT * FROM your_source_table;
```

### How to read the Bitmap type?

Starting from version 24.0.0, the Connector supports reading converted Bitmap data through Arrow Flight SQL. This capability requires Doris version >= 2.1.0.

**Bitmap to String**

Using DataFrame as an example, set `doris.read.bitmap-to-string` to `true`. For the result format, see the option definition.

```scala
spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.read.bitmap-to-string", "true")
    .load()
```

**Bitmap to Base64**

Using DataFrame as an example, set `doris.read.bitmap-to-base64` to `true`. For the result format, see the option definition.

```scala
spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.read.bitmap-to-base64", "true")
    .load()
```

### How to handle the ErrorIfExists error during DataFrame writing?

If a DataFrame write fails with `org.apache.spark.sql.AnalysisException: TableProvider implementation doris cannot be written with ErrorIfExists mode, please use Append or Overwrite modes instead.`, set the save mode to `Append`:

```scala
resultDf.write.format("doris")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    // your own options
    .mode(SaveMode.Append)
    .save()
```
