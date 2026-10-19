---
{
    "title": "Spark Doris Connector",
    "language": "ko",
    "description": "Spark Doris Connector를 사용하여 Apache Spark에서 Doris 데이터를 배치로 읽고 쓰거나 스트리밍 방식으로 쓸 수 있습니다. DataFrame, Spark SQL, Catalog, Arrow Flight SQL을 지원합니다.",
    "keywords": [
        "Spark Doris Connector",
        "Apache Spark에서 Doris 읽기 및 쓰기",
        "Doris DataFrame",
        "Doris Spark SQL",
        "Spark Doris Catalog",
        "Arrow Flight SQL"
    ]
}
---

# Spark Doris Connector {#spark-doris-connector}

<!-- Knowledge type: Operation guide + Configuration parameters + FAQ -->
<!-- Applicable scenarios: Spark reading Doris / Spark writing Doris / Spark SQL integration / Streaming write / Arrow Flight SQL high-speed read -->

Spark Doris Connector는 Apache Doris와 Apache Spark를 연결하는 커넥터입니다. Spark를 통해 Doris에 저장된 데이터를 읽거나 Doris에 데이터를 쓸 수 있습니다. 저장소: [apache/doris-spark-connector](https://github.com/apache/doris-spark-connector).

주요 기능은 다음과 같습니다.

| 사용 사례 | 권장 방식 | 설명 |
| --- | --- | --- |
| Doris 데이터 배치 읽기 | DataFrame, Spark SQL | RDD도 지원합니다. DataFrame 또는 Spark SQL을 권장합니다. |
| Doris 데이터 배치 쓰기 | DataFrame, Spark SQL | 쓸 컬럼을 지정할 수 있으며, 1.3.0 버전부터 Overwrite 모드를 지원합니다. |
| Doris 데이터 스트리밍 쓰기 | Structured Streaming | 표준 구조화 데이터 쓰기와 DataFrame의 첫 번째 컬럼을 그대로 전달하는 쓰기를 지원합니다. |
| Doris 데이터 고속 읽기 | Arrow Flight SQL | 24.0.0 버전부터 지원합니다. Doris 버전 >= 2.1.0이 필요합니다. |
| Catalog를 통한 Doris 접근 | Spark Doris Catalog | 24.0.0 버전부터 지원합니다. Spark Catalog를 통해 Doris 데이터베이스와 테이블을 관리할 수 있습니다. |

## 시작하기 전에 {#before-you-start}

<!-- Knowledge type: Version compatibility + Installation -->
<!-- Applicable scenarios: Pre-integration preparation / Dependency selection -->

### 버전 호환성 {#version-compatibility}

먼저 Spark, Doris, Java, Scala 버전에 맞는 Connector 버전을 선택합니다.

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

### Maven으로 의존성 추가 {#add-the-dependency-through-maven}

프로젝트의 `pom.xml`에 Spark Doris Connector 의존성을 추가하고, 실제 Spark 및 Connector 버전에 맞게 `artifactId`와 `version`을 변경합니다.

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>spark-doris-connector-spark-3.5</artifactId>
    <version>25.2.0</version>
</dependency>
```

:::tip

24.0.0 버전부터 Doris Connector 패키지 명명 규칙이 변경되었습니다.

1. Scala 버전 정보를 더 이상 포함하지 않습니다.
2. Spark 2.x에서는 `spark-doris-connector-spark-2`라는 통합 패키지를 사용하며, 기본적으로 Scala 2.11만을 대상으로 컴파일됩니다. Scala 2.12 버전이 필요하면 직접 컴파일해야 합니다.
3. Spark 3.x에서는 Spark 버전에 맞는 `spark-doris-connector-spark-3.x` 패키지를 사용합니다. Spark 3.0에서는 `spark-doris-connector-spark-3.1` 패키지를 사용할 수 있습니다.

:::

[Maven 저장소](https://repo.maven.apache.org/maven2/org/apache/doris/)에서 해당 버전의 Jar 파일을 다운로드할 수도 있습니다.

### 소스에서 컴파일 {#compile-from-source}

소스 코드를 직접 컴파일해야 하는 경우 소스 디렉터리에서 `sh build.sh`를 실행하고, 프롬프트가 표시되면 필요한 Scala 및 Spark 버전을 입력합니다.

컴파일이 완료되면 `dist` 디렉터리에 대상 Jar 파일이 생성됩니다. 예를 들어 `spark-doris-connector-spark-3.5-25.2.0.jar`가 생성됩니다. 이 파일을 Spark의 `classpath`에 복사하면 Spark Doris Connector를 사용할 수 있습니다.

| Spark 실행 모드 | Jar 파일 배치 방법 |
| --- | --- |
| 로컬 모드 | Jar 파일을 `jars/` 디렉터리에 배치합니다. |
| Yarn 클러스터 모드 | Jar 파일을 미리 배포된 패키지에 배치합니다. |

예를 들어 `spark-doris-connector-spark-3.5-25.2.0.jar`를 HDFS에 업로드하고 `spark.yarn.jars`를 통해 의존성을 추가합니다.

```shell
# 1. Upload spark-doris-connector-spark-3.5-25.2.0.jar to HDFS
hdfs dfs -mkdir /spark-jars/
hdfs dfs -put /your_local_path/spark-doris-connector-spark-3.5-25.2.0.jar /spark-jars/

# 2. Add the spark-doris-connector-spark-3.5-25.2.0.jar dependency in the cluster
spark.yarn.jars=hdfs:///spark-jars/spark-doris-connector-spark-3.5-25.2.0.jar
```

## 시나리오 1: Doris 데이터 배치 읽기 {#scenario-1-batch-read-doris-data}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Spark batch reading Doris data -->

Spark Doris Connector는 DataFrame, Spark SQL, RDD, PySpark를 통한 Doris 데이터 읽기를 지원합니다. Doris 데이터를 읽을 때는 DataFrame 또는 Spark SQL을 권장합니다.

### DataFrame으로 읽기 {#read-through-dataframe}

```scala
val dorisSparkDF = spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .load()

dorisSparkDF.show(5)
```

### Spark SQL로 읽기 {#read-through-spark-sql}

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

### RDD로 읽기 {#read-through-rdd}

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

### PySpark로 읽기 {#read-through-pyspark}

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

### Arrow Flight SQL로 고속 읽기 {#high-speed-read-through-arrow-flight-sql}

24.0.0 버전부터 Spark Doris Connector는 Arrow Flight SQL을 통한 데이터 읽기를 지원합니다. 이 방식을 사용하려면 Doris 버전 >= 2.1.0이 필요합니다.

다음 매개변수를 설정해야 합니다.

| 매개변수 | 설명 |
| --- | --- |
| `doris.read.mode` | `arrow`로 설정하면 Arrow Flight SQL을 통해 데이터를 읽습니다. |
| `doris.read.arrow-flight-sql.port` | FE에 설정된 Arrow Flight SQL 포트로 설정합니다. |

서버 측 설정은 [Arrow Flight SQL 기반 고속 데이터 전송 링크](../arrow-flight-sql.md)를 참조하세요.

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

## 시나리오 2: Doris 데이터 배치 쓰기 {#scenario-2-batch-write-doris-data}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Spark batch writing Doris data -->

Spark Doris Connector는 DataFrame과 Spark SQL을 통한 Doris 데이터 배치 쓰기를 지원합니다.

### DataFrame으로 쓰기 {#write-through-dataframe}

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

### Spark SQL로 쓰기 {#write-through-spark-sql}

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

## 시나리오 3: Doris 데이터 스트리밍 쓰기 {#scenario-3-stream-write-doris-data}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Spark Structured Streaming writing Doris data -->

Spark Doris Connector는 Structured Streaming을 통한 Doris 쓰기를 지원합니다. 데이터가 이미 Doris 테이블 스키마에 부합하는지에 따라 구조화 데이터 쓰기 또는 첫 번째 컬럼을 그대로 전달하는 쓰기를 선택할 수 있습니다.

### 구조화 데이터 쓰기 {#structured-data-write}

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

### 데이터 스트림의 첫 번째 컬럼을 직접 쓰기 {#write-the-first-column-of-the-data-stream-directly}

데이터 스트림의 첫 번째 컬럼이 Doris 테이블 스키마에 부합하는 경우, 예를 들어 컬럼 순서가 동일한 CSV 데이터이거나 필드 이름이 일치하는 JSON 데이터라면 `doris.sink.streaming.passthrough`를 `true`로 설정하여 내용을 여러 DataFrame 컬럼으로 확장하지 않고 첫 번째 컬럼을 직접 쓸 수 있습니다.

다음 예제는 Kafka를 소스로 사용합니다. 대상 Doris 테이블의 스키마가 다음과 같다고 가정합니다.

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

Kafka 메시지의 `value`는 `{"c0":1,"c1":"a","c2":"2024-01-01"}` 형식의 JSON 데이터입니다.

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

### JSON 형식으로 쓰기 {#write-in-json-format}

`doris.sink.properties.format`을 `json`으로 설정하면 Connector가 Doris에 데이터를 JSON 형식으로 씁니다.

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

## 시나리오 4: Spark Doris Catalog를 통한 Doris 접근 {#scenario-4-access-doris-through-the-spark-doris-catalog}

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Spark Catalog managing Doris databases and tables -->

24.0.0 버전부터 Spark Doris Connector는 Spark Catalog를 통한 Doris 접근을 지원합니다.

### Catalog 설정 옵션 {#catalog-configuration-options}

| 옵션 이름 | 필수 여부 | 설명 |
| --- | --- | --- |
| `spark.sql.catalog.your_catalog_name` | 예 | Catalog 공급자의 클래스 이름을 설정합니다. Doris에서 유효한 값은 `org.apache.doris.spark.catalog.DorisTableCatalog`뿐입니다. |
| `spark.sql.catalog.your_catalog_name.doris.fenodes` | 예 | Doris FE 노드를 `fe_ip:fe_http_port` 형식으로 설정합니다. |
| `spark.sql.catalog.your_catalog_name.doris.query.port` | 아니요 | Doris FE 쿼리 포트를 설정합니다. `spark.sql.catalog.your_catalog_name.doris.fe.auto.fetch`가 `true`이면 이 옵션을 생략할 수 있습니다. |
| `spark.sql.catalog.your_catalog_name.doris.user` | 예 | Doris 사용자를 설정합니다. |
| `spark.sql.catalog.your_catalog_name.doris.password` | 예 | Doris 비밀번호를 설정합니다. |
| `spark.sql.defaultCatalog` | 아니요 | Spark SQL의 기본 Catalog를 설정합니다. |

:::tip

DataFrame과 Spark SQL에 적용되는 모든 커넥터 매개변수는 Catalog에도 설정할 수 있습니다. 예를 들어 데이터를 JSON 형식으로 쓰려면 `spark.sql.catalog.your_catalog_name.doris.sink.properties.format`을 `json`으로 설정합니다.

:::

### DataFrame 프로그램에서 Catalog 사용 {#use-the-catalog-in-a-dataframe-program}

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

### Spark SQL CLI에서 Catalog 사용 {#use-the-catalog-in-the-spark-sql-cli}

필요한 매개변수를 설정하고 Spark SQL CLI를 시작합니다.

```shell
spark-sql \
--conf "spark.sql.catalog.your_catalog_name=org.apache.doris.spark.catalog.DorisTableCatalog" \
--conf "spark.sql.catalog.your_catalog_name.doris.fenodes=192.168.0.1:8030" \
--conf "spark.sql.catalog.your_catalog_name.doris.query.port=9030" \
--conf "spark.sql.catalog.your_catalog_name.doris.user=root" \
--conf "spark.sql.catalog.your_catalog_name.doris.password=" \
--conf "spark.sql.defaultCatalog=your_catalog_name"
```

Spark SQL CLI에서 쿼리를 실행합니다.

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

## Java 예제 {#java-example}

Java 버전의 예제는 `samples/doris-demo/spark-demo/`에 있습니다. [apache/doris 예제 디렉터리](https://github.com/apache/doris/tree/master/samples/doris-demo/spark-demo)를 참조하세요.

## 설정 참조 {#configuration-reference}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Parameter lookup / Performance tuning / Write behavior tuning -->

### 공통 설정 옵션 {#common-configuration-options}

| 키 | 기본값 | 설명 |
| --- | --- | --- |
| `doris.fenodes` | -- | Doris FE HTTP 주소입니다. 여러 주소를 쉼표로 구분하여 지정할 수 있습니다. |
| `doris.table.identifier` | -- | Doris 테이블 이름입니다. 예: `db1.tbl1`. |
| `doris.user` | -- | Doris에 접근할 때 사용하는 사용자 이름입니다. |
| `doris.password` | 빈 문자열 | Doris에 접근할 때 사용하는 비밀번호입니다. |
| `doris.request.retries` | 3 | Doris에 요청을 보낼 때 재시도하는 횟수입니다. |
| `doris.request.connect.timeout.ms` | 30000 | Doris에 요청을 보낼 때의 연결 타임아웃입니다. |
| `doris.request.read.timeout.ms` | 30000 | Doris에 요청을 보낼 때의 읽기 타임아웃입니다. |
| `doris.request.query.timeout.s` | 21600 | Doris 쿼리의 타임아웃입니다. 기본값은 6시간입니다. `-1`은 타임아웃 제한이 없음을 의미합니다. |
| `doris.request.tablet.size` | 1 | 하나의 RDD Partition에 대응하는 Doris Tablet 수입니다. 이 값이 작을수록 더 많은 Partition이 생성되어 Spark 측 병렬성이 높아지지만, Doris에 가해지는 부하도 커집니다. |
| `doris.read.field` | -- | Doris 테이블에서 읽을 컬럼 이름 목록으로, 쉼표로 구분합니다. |
| `doris.batch.size` | 4064 | 한 배치에서 BE로부터 읽는 최대 행 수입니다. 이 값을 늘리면 Spark와 Doris 사이에 맺는 연결 수가 줄어들어 네트워크 지연으로 발생하는 추가 시간 오버헤드가 감소합니다. |
| `doris.exec.mem.limit` | 8589934592 | 단일 쿼리의 메모리 제한으로, 바이트 단위입니다. 기본값은 8 GB입니다. |
| `doris.write.fields` | -- | Doris 테이블에 쓸 필드 또는 필드 순서를 쉼표로 구분하여 지정합니다. 기본적으로 모든 필드를 Doris 테이블의 필드 순서대로 씁니다. |
| `doris.sink.batch.size` | 500000 | 단일 배치에서 BE에 쓰는 최대 행 수입니다. |
| `doris.sink.max-retries` | 0 | BE 쓰기 실패 후 재시도하는 횟수입니다. 1.3.0 버전부터 기본값은 0이며, 기본적으로 재시도하지 않음을 의미합니다. 이 매개변수가 0보다 크면 배치 단위로 재시도하며, `doris.sink.batch.size`에 해당하는 양의 데이터를 Spark Executor 메모리에 캐시하므로 메모리 할당량을 그에 맞게 늘려야 할 수 있습니다. |
| `doris.sink.retry.interval.ms` | 10000 | 재시도 횟수를 설정했을 때의 재시도 간격으로, ms 단위입니다. |
| `doris.sink.properties.format` | csv | Stream Load의 데이터 형식입니다. `csv`, `json`, `arrow`의 세 가지 형식을 지원합니다. 다른 매개변수는 [Stream Load 매뉴얼](../../data-operate/import/import-way/stream-load-manual.md)을 참조하세요. |
| `doris.sink.properties.*` | -- | Stream Load의 데이터 적재 매개변수입니다. 예를 들어 `'doris.sink.properties.column_separator' = ','`로 컬럼 구분자를 지정합니다. 다른 매개변수는 [Stream Load 매뉴얼](../../data-operate/import/import-way/stream-load-manual.md)을 참조하세요. |
| `doris.sink.task.partition.size` | -- | Doris 쓰기 작업에 대응하는 Partition 수입니다. 필터링과 같은 Spark RDD 연산 후에는 최종 쓰기 대상 Partition 수가 많지만 Partition별 레코드 수는 적을 수 있어, 쓰기 빈도가 증가하고 컴퓨팅 리소스가 낭비될 수 있습니다. 이 값이 작을수록 Doris 쓰기 빈도가 낮아지고 Doris의 compaction 부하도 줄어듭니다. 이 매개변수는 `doris.sink.task.use.repartition`과 함께 사용합니다. |
| `doris.sink.task.use.repartition` | false | repartition을 사용하여 Doris에 쓰는 Partition 수를 제어할지 여부입니다. 기본값은 `false`이며 coalesce를 사용함을 의미합니다. 쓰기 전에 Spark action 연산자가 없으면 전체 계산 병렬성이 낮아질 수 있습니다. `true`로 설정하면 repartition을 사용합니다. 이 경우 최종 Partition 수를 설정할 수 있지만 추가 shuffle 오버헤드가 발생합니다. |
| `doris.sink.batch.interval.ms` | 0 | sink 배치 사이의 간격으로, ms 단위입니다. |
| `doris.sink.enable-2pc` | false | 두 단계 커밋을 활성화할지 여부입니다. 활성화하면 작업이 끝날 때 트랜잭션을 커밋하며, 일부 태스크가 실패하면 사전 커밋 상태인 모든 트랜잭션을 롤백합니다. |
| `doris.sink.auto-redirect` | true | Stream Load 요청을 리디렉션할지 여부입니다. 활성화하면 FE를 통해 Stream Load 쓰기가 수행되며, BE 정보를 더 이상 명시적으로 가져오지 않습니다. |
| `doris.enable.https` | false | FE HTTPS 요청을 활성화할지 여부입니다. |
| `doris.https.key-store-path` | - | HTTPS 키 저장소 경로입니다. |
| `doris.https.key-store-type` | JKS | HTTPS 키 저장소 타입입니다. |
| `doris.https.key-store-password` | - | HTTPS 키 저장소 비밀번호입니다. |
| `doris.read.mode` | thrift | Doris 읽기 모드입니다. 사용 가능한 옵션은 `thrift`와 `arrow`입니다. |
| `doris.read.arrow-flight-sql.port` | - | Doris FE의 Arrow Flight SQL 포트입니다. `doris.read.mode`가 `arrow`일 때 Arrow Flight SQL을 통해 데이터를 읽는 데 사용합니다. 서버 측 설정은 [Arrow Flight SQL 기반 고속 데이터 전송 링크](../arrow-flight-sql.md)를 참조하세요. |
| `doris.sink.label.prefix` | spark-doris | Stream Load를 통해 쓸 때 사용하는 데이터 적재 레이블 접두사입니다. |
| `doris.thrift.max.message.size` | 2147483647 | Thrift를 통해 데이터를 읽을 때의 최대 메시지 크기입니다. |
| `doris.fe.auto.fetch` | false | FE 정보를 자동으로 가져올지 여부입니다. `true`로 설정하면 `doris.fenodes`에 설정된 노드를 기반으로 모든 FE 노드 정보를 가져오므로, 여러 노드를 설정하거나 `doris.read.arrow-flight-sql.port`와 `doris.query.port`를 별도로 설정할 필요가 없습니다. |
| `doris.read.bitmap-to-string` | false | 읽을 때 Bitmap 타입을 배열 인덱스로 구성된 문자열로 변환할지 여부입니다. 결과 형식은 [BITMAP_TO_STRING](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-string.md) 함수 정의를 참조하세요. |
| `doris.read.bitmap-to-base64` | false | 읽을 때 Bitmap 타입을 Base64로 인코딩된 문자열로 변환할지 여부입니다. 결과 형식은 [BITMAP_TO_BASE64](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-base64.md) 함수 정의를 참조하세요. |
| `doris.query.port` | - | Doris FE 쿼리 포트로, Overwrite 쓰기와 Catalog 메타데이터 가져오기에 사용합니다. |

### SQL 및 DataFrame 전용 설정 {#sql--and-dataframe-specific-configuration}

| 키 | 기본값 | 설명 |
| --- | --- | --- |
| `doris.filter.query.in.max.count` | 10000 | 조건절 푸시다운 시 `in` 표현식의 값 목록에 포함할 수 있는 최대 요소 수입니다. 개수가 이 값을 초과하면 `in` 표현식 필터를 Spark 측에서 처리합니다. |

### Structured Streaming 전용 설정 {#structured-streaming-specific-configuration}

| 키 | 기본값 | 설명 |
| --- | --- | --- |
| `doris.sink.streaming.passthrough` | false | 첫 번째 컬럼 값을 처리 없이 직접 씁니다. |

### RDD 전용 설정 {#rdd-specific-configuration}

| 키 | 기본값 | 설명 |
| --- | --- | --- |
| `doris.request.auth.user` | -- | Doris에 접근할 때 사용하는 사용자 이름입니다. |
| `doris.request.auth.password` | -- | Doris에 접근할 때 사용하는 비밀번호입니다. |
| `doris.filter.query` | -- | 읽을 데이터를 필터링하는 표현식입니다. 이 표현식은 Doris에 그대로 전달되며, Doris가 이를 사용하여 원본 데이터를 필터링합니다. |

## 타입 매핑 {#type-mapping}

<!-- Knowledge type: Type mapping reference -->
<!-- Applicable scenarios: Schema design / Read-write type compatibility check -->

### Doris에서 Spark로의 컬럼 타입 매핑 {#doris-to-spark-column-type-mapping}

| Doris 타입 | Spark 타입 |
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

### Spark에서 Doris로의 데이터 타입 매핑 {#spark-to-doris-data-type-mapping}

| Spark 타입 | Doris 타입 |
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

24.0.0 버전부터 Bitmap 타입을 읽을 때 반환 타입은 string이며, 기본 반환 문자열 값은 `Read unsupported`입니다.

:::

## 자주 묻는 질문 및 문제 해결 {#faq-and-troubleshooting}

<!-- Knowledge type: FAQ + Troubleshooting -->
<!-- Applicable scenarios: Bitmap/HLL writing / Overwrite writing / ErrorIfExists error handling -->

### Bitmap 타입은 어떻게 쓰나요? {#how-to-write-the-bitmap-type}

Spark SQL에서 `INSERT INTO`로 데이터를 쓸 때 Doris 대상 테이블에 `BITMAP` 또는 `HLL` 타입의 데이터가 포함되어 있으면, `doris.ignore-type` 매개변수를 해당 타입으로 설정하고 `doris.write.fields`를 사용하여 컬럼을 매핑하고 변환합니다.

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

24.0.0 버전부터 `doris.ignore-type`은 더 이상 사용되지 않습니다. 쓰기 시 이 매개변수를 추가할 필요가 없습니다.

:::

### Overwrite 쓰기는 어떻게 사용하나요? {#how-to-use-overwrite-writing}

1.3.0 버전부터 Connector는 Overwrite 쓰기 모드를 지원합니다. Overwrite는 테이블 전체 데이터 교체만 지원합니다. 사용 방법은 다음과 같습니다.

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

### Bitmap 타입은 어떻게 읽나요? {#how-to-read-the-bitmap-type}

24.0.0 버전부터 Connector는 Arrow Flight SQL을 통해 변환된 Bitmap 데이터를 읽는 기능을 지원합니다. 이 기능을 사용하려면 Doris 버전 >= 2.1.0이 필요합니다.

**Bitmap을 String으로 변환**

DataFrame을 예로 들면, `doris.read.bitmap-to-string`을 `true`로 설정합니다. 결과 형식은 옵션 정의를 참조하세요.

```scala
spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.read.bitmap-to-string", "true")
    .load()
```

**Bitmap을 Base64로 변환**

DataFrame을 예로 들면, `doris.read.bitmap-to-base64`를 `true`로 설정합니다. 결과 형식은 옵션 정의를 참조하세요.

```scala
spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.read.bitmap-to-base64", "true")
    .load()
```

### DataFrame 쓰기 중 발생하는 ErrorIfExists 오류는 어떻게 처리하나요? {#how-to-handle-the-errorifexists-error-during-dataframe-writing}

DataFrame 쓰기가 `org.apache.spark.sql.AnalysisException: TableProvider implementation doris cannot be written with ErrorIfExists mode, please use Append or Overwrite modes instead.` 오류로 실패하면 저장 모드를 `Append`로 설정합니다.

```scala
resultDf.write.format("doris")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    // your own options
    .mode(SaveMode.Append)
    .save()
```
