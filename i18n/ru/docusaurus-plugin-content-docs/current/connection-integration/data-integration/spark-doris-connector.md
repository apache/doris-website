---
{
    "title": "Spark Doris Connector",
    "language": "ru",
    "description": "Используйте Spark Doris Connector для пакетного чтения данных из Doris, а также пакетной и потоковой записи данных в Doris из Apache Spark с поддержкой DataFrame, Spark SQL, Catalog и Arrow Flight SQL.",
    "keywords": [
        "Spark Doris Connector",
        "Чтение и запись Doris в Apache Spark",
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

Spark Doris Connector — коннектор между Apache Doris и Apache Spark. Он позволяет читать данные, хранящиеся в Doris, через Spark, а также записывать данные в Doris через Spark. Репозиторий: [apache/doris-spark-connector](https://github.com/apache/doris-spark-connector).

Основные возможности:

| Сценарий использования | Рекомендуемый способ | Описание |
| --- | --- | --- |
| Пакетное чтение данных из Doris | DataFrame, Spark SQL | Также поддерживается RDD. Рекомендуется использовать DataFrame или Spark SQL. |
| Пакетная запись данных в Doris | DataFrame, Spark SQL | Можно указать столбцы для записи. Начиная с версии 1.3.0 поддерживается режим Overwrite. |
| Потоковая запись данных в Doris | Structured Streaming | Поддерживается запись стандартных структурированных данных, а также прямая передача первого столбца DataFrame. |
| Высокоскоростное чтение данных из Doris | Arrow Flight SQL | Поддерживается начиная с версии 24.0.0. Требуется версия Doris >= 2.1.0. |
| Доступ к Doris через Catalog | Spark Doris Catalog | Поддерживается начиная с версии 24.0.0. Позволяет управлять базами данных и таблицами Doris через Spark Catalog. |

## Перед началом работы {#before-you-start}

<!-- Knowledge type: Version compatibility + Installation -->
<!-- Applicable scenarios: Pre-integration preparation / Dependency selection -->

### Совместимость версий {#version-compatibility}

Сначала выберите подходящую версию коннектора с учётом используемых версий Spark, Doris, Java и Scala.

| Коннектор | Spark | Doris | Java | Scala |
| --- | --- | --- | --- | --- |
| 26.1.0 | 4.1, 3.5 - 3.1, 2.4 | 1.0 + | 17 (4.1), 8 (3.x, 2.x) | 2.13 (4.1), 2.12 (3.x), 2.11 (2.x) |
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

### Добавление зависимости через Maven {#add-the-dependency-through-maven}

Добавьте зависимость Spark Doris Connector в файл `pom.xml` вашего проекта и замените `artifactId` и `version` в соответствии с используемыми версиями Spark и коннектора:

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>spark-doris-connector-spark-3.5</artifactId>
    <version>26.1.0</version>
</dependency>
```

:::tip

Начиная с версии 24.0.0 правила именования пакетов Doris Connector изменены:

1. Информация о версии Scala больше не включается в имя пакета.
2. Для Spark 2.x используется единый пакет `spark-doris-connector-spark-2`, который по умолчанию компилируется только для Scala 2.11. Если вам нужна версия для Scala 2.12, скомпилируйте её самостоятельно.
3. Для Spark 3.x используйте пакет `spark-doris-connector-spark-3.x`, соответствующий вашей версии Spark. Для Spark 3.0 можно использовать пакет `spark-doris-connector-spark-3.1`.

:::

Также можно скачать JAR-файл нужной версии из [репозитория Maven](https://repo.maven.apache.org/maven2/org/apache/doris/).

### Сборка из исходного кода {#compile-from-source}

Чтобы скомпилировать исходный код самостоятельно, выполните `sh build.sh` в каталоге исходного кода и укажите нужные версии Scala и Spark в ответ на запрос.

После успешной компиляции итоговый JAR-файл создаётся в каталоге `dist`, например `spark-doris-connector-spark-3.5-26.1.0.jar`. Чтобы начать использовать Spark Doris Connector, добавьте этот файл в `classpath` Spark:

| Режим запуска Spark | Размещение JAR-файла |
| --- | --- |
| Локальный режим | Поместите JAR-файл в каталог `jars/`. |
| Кластерный режим Yarn | Поместите JAR-файл в предварительно развёрнутый пакет. |

Например, загрузите `spark-doris-connector-spark-3.5-26.1.0.jar` в HDFS и добавьте зависимость через `spark.yarn.jars`:

```shell
# 1. Upload spark-doris-connector-spark-3.5-26.1.0.jar to HDFS
hdfs dfs -mkdir /spark-jars/
hdfs dfs -put /your_local_path/spark-doris-connector-spark-3.5-26.1.0.jar /spark-jars/

# 2. Add the spark-doris-connector-spark-3.5-26.1.0.jar dependency in the cluster
spark.yarn.jars=hdfs:///spark-jars/spark-doris-connector-spark-3.5-26.1.0.jar
```

## Сценарий 1: пакетное чтение данных из Doris {#scenario-1-batch-read-doris-data}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Spark batch reading Doris data -->

Spark Doris Connector поддерживает чтение данных из Doris через DataFrame, Spark SQL, RDD и PySpark. Для чтения данных из Doris рекомендуется использовать DataFrame или Spark SQL.

### Чтение через DataFrame {#read-through-dataframe}

```scala
val dorisSparkDF = spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .load()

dorisSparkDF.show(5)
```

### Чтение через Spark SQL {#read-through-spark-sql}

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

### Чтение через RDD {#read-through-rdd}

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

### Чтение через PySpark {#read-through-pyspark}

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

### Высокоскоростное чтение через Arrow Flight SQL {#high-speed-read-through-arrow-flight-sql}

Начиная с версии 24.0.0 Spark Doris Connector поддерживает чтение данных через Arrow Flight SQL. Для этого требуется версия Doris >= 2.1.0.

Необходимо задать следующие параметры:

| Параметр | Описание |
| --- | --- |
| `doris.read.mode` | Задайте значение `arrow`, чтобы читать данные через Arrow Flight SQL. |
| `doris.read.arrow-flight-sql.port` | Укажите порт Arrow Flight SQL, настроенный на FE. |

Настройка на стороне сервера описана в разделе [Высокоскоростная передача данных на основе Arrow Flight SQL](../arrow-flight-sql.md).

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

## Сценарий 2: пакетная запись данных в Doris {#scenario-2-batch-write-doris-data}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Spark batch writing Doris data -->

Spark Doris Connector поддерживает пакетную запись данных в Doris через DataFrame и Spark SQL.

### Запись через DataFrame {#write-through-dataframe}

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

### Запись через Spark SQL {#write-through-spark-sql}

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

## Сценарий 3: потоковая запись данных в Doris {#scenario-3-stream-write-doris-data}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Spark Structured Streaming writing Doris data -->

Spark Doris Connector поддерживает запись в Doris через Structured Streaming. В зависимости от того, соответствуют ли данные схеме таблицы Doris, можно выбрать запись структурированных данных или прямую передачу первого столбца.

### Запись структурированных данных {#structured-data-write}

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

### Прямая запись первого столбца потока данных {#write-the-first-column-of-the-data-stream-directly}

Если первый столбец потока данных соответствует схеме таблицы Doris, например содержит данные CSV с тем же порядком столбцов или данные JSON с совпадающими именами полей, можно задать для `doris.sink.streaming.passthrough` значение `true`. Тогда первый столбец будет записываться напрямую, без развёртывания его содержимого в несколько столбцов DataFrame.

В следующем примере в качестве источника используется Kafka. Предположим, что целевая таблица Doris имеет следующую схему:

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

Поле сообщения Kafka `value` содержит данные JSON вида `{"c0":1,"c1":"a","c2":"2024-01-01"}`.

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

### Запись в формате JSON {#write-in-json-format}

После установки для `doris.sink.properties.format` значения `json` коннектор записывает данные в Doris в формате JSON.

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

## Сценарий 4: доступ к Doris через Spark Doris Catalog {#scenario-4-access-doris-through-the-spark-doris-catalog}

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Spark Catalog managing Doris databases and tables -->

Начиная с версии 24.0.0 Spark Doris Connector поддерживает доступ к Doris через Spark Catalog.

### Параметры настройки Catalog {#catalog-configuration-options}

| Имя параметра | Обязательный | Описание |
| --- | --- | --- |
| `spark.sql.catalog.your_catalog_name` | Да | Задаёт имя класса провайдера Catalog. Для Doris единственное допустимое значение — `org.apache.doris.spark.catalog.DorisTableCatalog`. |
| `spark.sql.catalog.your_catalog_name.doris.fenodes` | Да | Задаёт узел Doris FE в формате `fe_ip:fe_http_port`. |
| `spark.sql.catalog.your_catalog_name.doris.query.port` | Нет | Задаёт порт запросов Doris FE. Если для `spark.sql.catalog.your_catalog_name.doris.fe.auto.fetch` установлено значение `true`, этот параметр можно не указывать. |
| `spark.sql.catalog.your_catalog_name.doris.user` | Да | Задаёт пользователя Doris. |
| `spark.sql.catalog.your_catalog_name.doris.password` | Да | Задаёт пароль Doris. |
| `spark.sql.defaultCatalog` | Нет | Задаёт Catalog по умолчанию для Spark SQL. |

:::tip

Все параметры коннектора, применимые к DataFrame и Spark SQL, также можно задать для Catalog. Например, чтобы записывать данные в формате JSON, задайте для `spark.sql.catalog.your_catalog_name.doris.sink.properties.format` значение `json`.

:::

### Использование Catalog в программе с DataFrame {#use-the-catalog-in-a-dataframe-program}

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

### Использование Catalog в Spark SQL CLI {#use-the-catalog-in-the-spark-sql-cli}

Задайте необходимые параметры и запустите Spark SQL CLI:

```shell
spark-sql \
--conf "spark.sql.catalog.your_catalog_name=org.apache.doris.spark.catalog.DorisTableCatalog" \
--conf "spark.sql.catalog.your_catalog_name.doris.fenodes=192.168.0.1:8030" \
--conf "spark.sql.catalog.your_catalog_name.doris.query.port=9030" \
--conf "spark.sql.catalog.your_catalog_name.doris.user=root" \
--conf "spark.sql.catalog.your_catalog_name.doris.password=" \
--conf "spark.sql.defaultCatalog=your_catalog_name"
```

Выполните запросы в Spark SQL CLI:

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

## Пример на Java {#java-example}

Версия примера на Java находится в `samples/doris-demo/spark-demo/`. См. [каталог примеров apache/doris](https://github.com/apache/doris/tree/master/samples/doris-demo/spark-demo).

## Справочник по настройкам {#configuration-reference}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Parameter lookup / Performance tuning / Write behavior tuning -->

### Общие параметры настройки {#common-configuration-options}

| Ключ | Значение по умолчанию | Описание |
| --- | --- | --- |
| `doris.fenodes` | -- | HTTP-адрес Doris FE. Можно указать несколько адресов через запятую. |
| `doris.table.identifier` | -- | Имя таблицы Doris, например `db1.tbl1`. |
| `doris.user` | -- | Имя пользователя для доступа к Doris. |
| `doris.password` | Пустая строка | Пароль для доступа к Doris. |
| `doris.request.retries` | 3 | Количество повторных попыток отправки запросов в Doris. |
| `doris.request.connect.timeout.ms` | 30000 | Тайм-аут установления соединения при отправке запросов в Doris. |
| `doris.request.read.timeout.ms` | 30000 | Тайм-аут чтения при отправке запросов в Doris. |
| `doris.request.query.timeout.s` | 21600 | Тайм-аут выполнения запросов в Doris. Значение по умолчанию — 6 часов. `-1` означает отсутствие ограничения по времени. |
| `doris.request.tablet.size` | 1 | Количество Tablet Doris, соответствующих одному разделу RDD. Чем меньше это значение, тем больше разделов создаётся: это повышает параллелизм на стороне Spark, но также увеличивает нагрузку на Doris. |
| `doris.read.field` | -- | Список имён столбцов таблицы Doris для чтения, разделённых запятыми. |
| `doris.batch.size` | 4064 | Максимальное количество строк, считываемых из BE за один пакет. Увеличение этого значения сокращает количество соединений между Spark и Doris, тем самым уменьшая дополнительные затраты времени из-за сетевых задержек. |
| `doris.exec.mem.limit` | 8589934592 | Ограничение памяти для одного запроса в байтах. Значение по умолчанию — 8 ГБ. |
| `doris.write.fields` | -- | Задаёт поля для записи в таблицу Doris или их порядок; поля разделяются запятыми. По умолчанию записываются все поля в порядке полей таблицы Doris. |
| `doris.sink.batch.size` | 500000 | Максимальное количество строк, записываемых в BE за один пакет. |
| `doris.sink.max-retries` | 0 | Количество повторных попыток после сбоя записи в BE. Начиная с версии 1.3.0 значение по умолчанию — 0, то есть повторные попытки по умолчанию не выполняются. Если значение параметра больше 0, повторные попытки выполняются на уровне пакетов, а объём данных, заданный параметром `doris.sink.batch.size`, кэшируется в памяти Spark Executor, поэтому может потребоваться увеличить выделенный объём памяти. |
| `doris.sink.retry.interval.ms` | 10000 | Интервал между повторными попытками после настройки их количества, в мс. |
| `doris.sink.properties.format` | csv | Формат данных для Stream Load. Поддерживаются три формата: `csv`, `json` и `arrow`. Другие параметры описаны в [руководстве по Stream Load](../../data-operate/import/import-way/stream-load-manual.md). |
| `doris.sink.properties.*` | -- | Параметры загрузки данных для Stream Load. Например, разделитель столбцов можно указать с помощью `'doris.sink.properties.column_separator' = ','`. Другие параметры описаны в [руководстве по Stream Load](../../data-operate/import/import-way/stream-load-manual.md). |
| `doris.sink.task.partition.size` | -- | Количество разделов для задачи записи в Doris. После операций с RDD в Spark, например фильтрации, итоговое количество разделов для записи может быть большим, а число записей в каждом разделе — небольшим. Это увеличивает частоту записи и приводит к нерациональному использованию вычислительных ресурсов. Чем меньше это значение, тем ниже частота записи в Doris и нагрузка на компактацию в Doris. Этот параметр используется вместе с `doris.sink.task.use.repartition`. |
| `doris.sink.task.use.repartition` | false | Определяет, использовать ли repartition для управления количеством разделов, записываемых в Doris. Значение по умолчанию — `false`, то есть используется coalesce. Учтите, что если перед записью нет оператора action в Spark, общий параллелизм вычислений может снизиться. Если задано значение `true`, используется repartition. В этом случае можно задать итоговое количество разделов, но появляются дополнительные затраты на shuffle. |
| `doris.sink.batch.interval.ms` | 0 | Интервал между пакетами записи, в мс. |
| `doris.sink.enable-2pc` | false | Определяет, включать ли двухфазную фиксацию. Если она включена, транзакции фиксируются в конце задания, а при сбое некоторых задач все транзакции в состоянии предварительной фиксации откатываются. |
| `doris.sink.auto-redirect` | true | Определяет, перенаправлять ли запросы Stream Load. Если включено, запись Stream Load выполняется через FE, а информация о BE больше не запрашивается явно. |
| `doris.enable.tls` | false | Определяет, включать ли TLS для соединений с Doris. |
| `doris.tls.ca-certificate-path` | Пустая строка | Путь к цепочке сертификатов CA в формате PEM. Если значение пустое, коннектор не загружает пользовательский CA и использует хранилище доверенных сертификатов по умолчанию соответствующего клиента. |
| `doris.tls.skip-hostname-verification` | false | Определяет, пропускать ли проверку имени хоста, сохраняя проверку CA. Arrow Flight SQL не поддерживает этот параметр. |
| `doris.tls.excluded-protocols` | Пустая строка | Разделённый запятыми список протоколов, для которых не используется TLS. Допустимые значения: `http`, `mysql`, `thrift` и `arrowflight`. |
| `doris.read.mode` | thrift | Режим чтения из Doris. Допустимые значения: `thrift` и `arrow`. |
| `doris.read.arrow-flight-sql.port` | - | Порт Arrow Flight SQL узла Doris FE. Если для `doris.read.mode` задано значение `arrow`, этот порт используется для чтения данных через Arrow Flight SQL. Настройка на стороне сервера описана в разделе [Высокоскоростная передача данных на основе Arrow Flight SQL](../arrow-flight-sql.md). |
| `doris.sink.mode` | stream_load | Режим записи в Doris. Поддерживаемые значения: `stream_load` и `tvf`. |
| `doris.sink.label.prefix` | spark-doris | Префикс метки для записи в Doris. |
| `doris.sink.s3.endpoint` | - | Конечная точка объектного хранилища, совместимого с S3. Обязательна в режиме записи TVF. |
| `doris.sink.s3.region` | - | Регион объектного хранилища. Обязателен в режиме записи TVF. |
| `doris.sink.s3.bucket` | - | Бакет для промежуточного хранения данных. Обязателен в режиме записи TVF. |
| `doris.sink.s3.prefix` | - | Префикс ключей объектов для промежуточного хранения данных. Обязателен в режиме записи TVF. |
| `doris.sink.s3.access-key` | - | Ключ доступа к объектному хранилищу. Обязателен в режиме записи TVF. |
| `doris.sink.s3.secret-key` | - | Секретный ключ объектного хранилища. Обязателен в режиме записи TVF. |
| `doris.sink.s3.path-style-access` | false | Определяет, использовать ли доступ к объектному хранилищу в стиле path-style в режиме записи TVF. |
| `doris.thrift.max.message.size` | 2147483647 | Максимальный размер сообщения при чтении данных через Thrift. |
| `doris.fe.auto.fetch` | false | Определяет, получать ли информацию о FE автоматически. Если задано значение `true`, информация обо всех узлах FE получается на основе узлов, указанных в `doris.fenodes`, поэтому не нужно настраивать несколько узлов или отдельно задавать `doris.read.arrow-flight-sql.port` и `doris.query.port`. |
| `doris.read.bitmap-to-string` | false | Определяет, преобразовывать ли тип Bitmap при чтении в строку из индексов массива. Формат результата описан в определении функции [BITMAP_TO_STRING](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-string.md). |
| `doris.read.bitmap-to-base64` | false | Определяет, преобразовывать ли тип Bitmap при чтении в строку, закодированную в Base64. Формат результата описан в определении функции [BITMAP_TO_BASE64](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-base64.md). |
| `doris.query.port` | - | Порт запросов Doris FE, используемый для записи в режиме Overwrite и получения метаданных Catalog. |

### Параметры для SQL и DataFrame {#sql--and-dataframe-specific-configuration}

| Ключ | Значение по умолчанию | Описание |
| --- | --- | --- |
| `doris.filter.query.in.max.count` | 10000 | Максимальное количество элементов списка значений в выражении `in` при проталкивании предикатов. Если количество превышает это значение, фильтр с выражением `in` обрабатывается на стороне Spark. |

### Параметры для Structured Streaming {#structured-streaming-specific-configuration}

| Ключ | Значение по умолчанию | Описание |
| --- | --- | --- |
| `doris.sink.streaming.passthrough` | false | Записывает значение первого столбца напрямую, без обработки. |

### Параметры для RDD {#rdd-specific-configuration}

| Ключ | Значение по умолчанию | Описание |
| --- | --- | --- |
| `doris.request.auth.user` | -- | Имя пользователя для доступа к Doris. |
| `doris.request.auth.password` | -- | Пароль для доступа к Doris. |
| `doris.filter.query` | -- | Выражение для фильтрации считываемых данных. Оно передаётся в Doris, где используется для фильтрации исходных данных. |

## Сопоставление типов {#type-mapping}

<!-- Knowledge type: Type mapping reference -->
<!-- Applicable scenarios: Schema design / Read-write type compatibility check -->

### Сопоставление типов столбцов Doris и Spark {#doris-to-spark-column-type-mapping}

| Тип Doris | Тип Spark |
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

### Сопоставление типов данных Spark и Doris {#spark-to-doris-data-type-mapping}

| Тип Spark | Тип Doris |
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

Начиная с версии 24.0.0 при чтении типа Bitmap возвращается строка, значение которой по умолчанию — `Read unsupported`.

:::

## Рекомендации {#best-practices}

### Доступ из Spark к среде Doris с включённым TLS {#access-a-tls-enabled-doris-environment-from-spark}

Задайте для `doris.enable.tls` значение `true`, если Spark читает данные из кластера Doris с включённым TLS или записывает данные в него:

```scala
mockDataDF.write.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTPS_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.enable.tls", "true")
    .option("doris.tls.ca-certificate-path", "/etc/doris-tls/ca.pem")
    .save()
```

Файл CA должен быть доступен драйверу Spark и каждому executor. Если параметр `doris.tls.ca-certificate-path` не задан, коннектор не загружает пользовательский CA и использует хранилище доверенных сертификатов по умолчанию соответствующего клиента.

Распространите файл CA в соответствии с режимом развёртывания Spark:

- **YARN**: добавьте `--files /local/path/ca.pem` в `spark-submit` и задайте для `doris.tls.ca-certificate-path` значение `ca.pem`.
- **Kubernetes**: подключите один и тот же Secret или том к Pod драйвера и Pod исполнителей. Например, добавьте `--conf spark.kubernetes.driver.secrets.doris-tls=/etc/doris-tls` и `--conf spark.kubernetes.executor.secrets.doris-tls=/etc/doris-tls` в `spark-submit` и задайте путь к CA `/etc/doris-tls/ca.pem`.

### Использование режима записи S3 TVF {#use-s3-tvf-write-mode}

В режиме записи TVF данные сохраняются в формате JSON в объектном хранилище, совместимом с S3, а затем записываются в Doris через S3 TVF. Поддерживается только пакетная запись. Убедитесь, что Spark и Doris имеют доступ к объектному хранилищу, а целевая таблица Doris уже существует.

```scala
mockDataDF.write.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("doris.query.port", "$YOUR_DORIS_FE_QUERY_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.sink.mode", "tvf")
    .option("doris.sink.s3.endpoint", "$YOUR_S3_ENDPOINT")
    .option("doris.sink.s3.region", "$YOUR_S3_REGION")
    .option("doris.sink.s3.bucket", "$YOUR_S3_BUCKET")
    .option("doris.sink.s3.prefix", "$YOUR_S3_PREFIX")
    .option("doris.sink.s3.access-key", "$YOUR_S3_ACCESS_KEY")
    .option("doris.sink.s3.secret-key", "$YOUR_S3_SECRET_KEY")
    .mode(SaveMode.Append)
    .save()
```

Коннектор не удаляет промежуточные объекты автоматически. При необходимости настройте политику жизненного цикла объектов в хранилище.

## Частые вопросы и устранение неполадок {#faq-and-troubleshooting}

<!-- Knowledge type: FAQ + Troubleshooting -->
<!-- Applicable scenarios: Bitmap/HLL writing / Overwrite writing / ErrorIfExists error handling -->

### Как записывать данные типа Bitmap? {#how-to-write-the-bitmap-type}

При записи данных в Spark SQL через `INSERT INTO`, если целевая таблица Doris содержит данные типа `BITMAP` или `HLL`, задайте для параметра `doris.ignore-type` соответствующий тип и используйте `doris.write.fields` для сопоставления и преобразования столбцов.

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

Начиная с версии 24.0.0 параметр `doris.ignore-type` устарел. Добавлять его при записи не требуется.

:::

### Как использовать запись в режиме Overwrite? {#how-to-use-overwrite-writing}

Начиная с версии 1.3.0 коннектор поддерживает запись в режиме Overwrite. Overwrite поддерживает только полную замену данных таблицы. Примеры использования приведены ниже.

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

### Как читать данные типа Bitmap? {#how-to-read-the-bitmap-type}

Начиная с версии 24.0.0 коннектор поддерживает чтение преобразованных данных Bitmap через Arrow Flight SQL. Для этого требуется версия Doris >= 2.1.0.

**Преобразование Bitmap в String**

На примере DataFrame: задайте для `doris.read.bitmap-to-string` значение `true`. Формат результата приведён в описании параметра.

```scala
spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.read.bitmap-to-string", "true")
    .load()
```

**Преобразование Bitmap в Base64**

На примере DataFrame: задайте для `doris.read.bitmap-to-base64` значение `true`. Формат результата приведён в описании параметра.

```scala
spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.read.bitmap-to-base64", "true")
    .load()
```

### Как устранить ошибку ErrorIfExists при записи через DataFrame? {#how-to-handle-the-errorifexists-error-during-dataframe-writing}

Если запись через DataFrame завершается ошибкой `org.apache.spark.sql.AnalysisException: TableProvider implementation doris cannot be written with ErrorIfExists mode, please use Append or Overwrite modes instead.`, задайте режим сохранения `Append`:

```scala
resultDf.write.format("doris")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    // your own options
    .mode(SaveMode.Append)
    .save()
```
