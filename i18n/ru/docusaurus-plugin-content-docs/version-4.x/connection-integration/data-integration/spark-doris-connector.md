---
{
    "title": "Spark Doris Connector",
    "language": "ru",
    "description": "Используйте Spark Doris Connector для пакетного чтения данных из Doris, пакетной и потоковой записи данных в Doris через Apache Spark с поддержкой DataFrame, Spark SQL, Catalog и Arrow Flight SQL.",
    "keywords": [
        "Spark Doris Connector",
        "Чтение и запись данных Doris через Apache Spark",
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

Spark Doris Connector связывает Apache Doris и Apache Spark. Он позволяет читать через Spark данные, хранящиеся в Doris, а также записывать данные в Doris через Spark. Репозиторий: [apache/doris-spark-connector](https://github.com/apache/doris-spark-connector).

Основные возможности:

| Сценарий использования | Рекомендуемый подход | Описание |
| --- | --- | --- |
| Пакетное чтение данных из Doris | DataFrame, Spark SQL | Также поддерживается RDD. Рекомендуется использовать DataFrame или Spark SQL. |
| Пакетная запись данных в Doris | DataFrame, Spark SQL | Поддерживается указание столбцов для записи, а начиная с версии 1.3.0 также доступен режим Overwrite. |
| Потоковая запись данных в Doris | Structured Streaming | Поддерживается запись стандартных структурированных данных, а также прямая передача первого столбца DataFrame. |
| Высокоскоростное чтение данных из Doris | Arrow Flight SQL | Поддерживается начиная с версии 24.0.0. Требуется Doris версии >= 2.1.0. |
| Доступ к Doris через Catalog | Spark Doris Catalog | Поддерживается начиная с версии 24.0.0. Позволяет управлять базами данных и таблицами Doris через Spark Catalog. |

## Перед началом работы {#before-you-start}

<!-- Knowledge type: Version compatibility + Installation -->
<!-- Applicable scenarios: Pre-integration preparation / Dependency selection -->

### Совместимость версий {#version-compatibility}

Сначала выберите подходящую версию коннектора в зависимости от используемых версий Spark, Doris, Java и Scala.

| Коннектор | Spark | Doris | Java | Scala |
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

### Добавление зависимости через Maven {#add-the-dependency-through-maven}

Добавьте зависимость Spark Doris Connector в файл `pom.xml` вашего проекта и замените `artifactId` и `version` в соответствии с используемыми версиями Spark и коннектора:

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>spark-doris-connector-spark-3.5</artifactId>
    <version>25.2.0</version>
</dependency>
```

:::tip

Начиная с версии 24.0.0 изменены правила именования пакетов Doris Connector:

1. Информация о версии Scala больше не включается в имя пакета.
2. Для Spark 2.x используется единый пакет с именем `spark-doris-connector-spark-2`, который по умолчанию компилируется только для Scala 2.11. Если вам нужна версия для Scala 2.12, скомпилируйте её самостоятельно.
3. Для Spark 3.x используйте пакет с именем `spark-doris-connector-spark-3.x`, соответствующий вашей версии Spark. Для Spark 3.0 можно использовать пакет `spark-doris-connector-spark-3.1`.

:::

Вы также можете скачать Jar-файл нужной версии из [репозитория Maven](https://repo.maven.apache.org/maven2/org/apache/doris/).

### Сборка из исходного кода {#compile-from-source}

Если вам нужно самостоятельно скомпилировать исходный код, выполните `sh build.sh` в каталоге исходного кода и введите нужные версии Scala и Spark при появлении запроса.

После успешной компиляции итоговый Jar-файл создаётся в каталоге `dist`, например `spark-doris-connector-spark-3.5-25.2.0.jar`. Скопируйте этот файл в `classpath` Spark, чтобы начать использовать Spark Doris Connector:

| Режим запуска Spark | Размещение Jar-файла |
| --- | --- |
| Локальный режим | Поместите Jar-файл в каталог `jars/`. |
| Кластерный режим Yarn | Поместите Jar-файл в предварительно развёрнутый пакет. |

Например, загрузите `spark-doris-connector-spark-3.5-25.2.0.jar` в HDFS и добавьте зависимость через `spark.yarn.jars`:

```shell
# 1. Upload spark-doris-connector-spark-3.5-25.2.0.jar to HDFS
hdfs dfs -mkdir /spark-jars/
hdfs dfs -put /your_local_path/spark-doris-connector-spark-3.5-25.2.0.jar /spark-jars/

# 2. Add the spark-doris-connector-spark-3.5-25.2.0.jar dependency in the cluster
spark.yarn.jars=hdfs:///spark-jars/spark-doris-connector-spark-3.5-25.2.0.jar
```

## Сценарий 1: Пакетное чтение данных из Doris {#scenario-1-batch-read-doris-data}

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

Начиная с версии 24.0.0 Spark Doris Connector поддерживает чтение данных через Arrow Flight SQL. Для этого требуется Doris версии >= 2.1.0.

Необходимо задать следующие параметры:

| Параметр | Описание |
| --- | --- |
| `doris.read.mode` | Установите значение `arrow`, чтобы читать данные через Arrow Flight SQL. |
| `doris.read.arrow-flight-sql.port` | Укажите порт Arrow Flight SQL, настроенный на FE. |

О настройке на стороне сервера см. [Высокоскоростной канал передачи данных на базе Arrow Flight SQL](../arrow-flight-sql.md).

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

## Сценарий 2: Пакетная запись данных в Doris {#scenario-2-batch-write-doris-data}

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

## Сценарий 3: Потоковая запись данных в Doris {#scenario-3-stream-write-doris-data}

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

Если первый столбец потока данных соответствует схеме таблицы Doris, например содержит данные CSV с тем же порядком столбцов или данные JSON с совпадающими именами полей, можно установить `doris.sink.streaming.passthrough` в `true`, чтобы записывать первый столбец напрямую, без разворачивания его содержимого в несколько столбцов DataFrame.

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

Поле `value` сообщения Kafka содержит данные JSON вида `{"c0":1,"c1":"a","c2":"2024-01-01"}`.

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

После установки `doris.sink.properties.format` в `json` коннектор записывает данные в Doris в формате JSON.

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

## Сценарий 4: Доступ к Doris через Spark Doris Catalog {#scenario-4-access-doris-through-the-spark-doris-catalog}

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Spark Catalog managing Doris databases and tables -->

Начиная с версии 24.0.0 Spark Doris Connector поддерживает доступ к Doris через Spark Catalog.

### Параметры конфигурации Catalog {#catalog-configuration-options}

| Имя параметра | Обязательный | Описание |
| --- | --- | --- |
| `spark.sql.catalog.your_catalog_name` | Да | Задаёт имя класса провайдера Catalog. Для Doris единственное допустимое значение: `org.apache.doris.spark.catalog.DorisTableCatalog`. |
| `spark.sql.catalog.your_catalog_name.doris.fenodes` | Да | Задаёт узел Doris FE в формате `fe_ip:fe_http_port`. |
| `spark.sql.catalog.your_catalog_name.doris.query.port` | Нет | Задаёт порт запросов Doris FE. Если `spark.sql.catalog.your_catalog_name.doris.fe.auto.fetch` установлен в `true`, этот параметр можно не указывать. |
| `spark.sql.catalog.your_catalog_name.doris.user` | Да | Задаёт пользователя Doris. |
| `spark.sql.catalog.your_catalog_name.doris.password` | Да | Задаёт пароль Doris. |
| `spark.sql.defaultCatalog` | Нет | Задаёт Catalog по умолчанию для Spark SQL. |

:::tip

Все параметры коннектора, применимые к DataFrame и Spark SQL, можно также задать для Catalog. Например, для записи данных в формате JSON установите `spark.sql.catalog.your_catalog_name.doris.sink.properties.format` в `json`.

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

Версия примера на Java доступна в каталоге `samples/doris-demo/spark-demo/`. См. [каталог примеров apache/doris](https://github.com/apache/doris/tree/master/samples/doris-demo/spark-demo).

## Справочник по конфигурации {#configuration-reference}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Parameter lookup / Performance tuning / Write behavior tuning -->

### Общие параметры конфигурации {#common-configuration-options}

| Ключ | Значение по умолчанию | Описание |
| --- | --- | --- |
| `doris.fenodes` | -- | HTTP-адрес Doris FE. Поддерживается несколько адресов, разделённых запятыми. |
| `doris.table.identifier` | -- | Имя таблицы Doris, например `db1.tbl1`. |
| `doris.user` | -- | Имя пользователя для доступа к Doris. |
| `doris.password` | Пустая строка | Пароль для доступа к Doris. |
| `doris.request.retries` | 3 | Количество повторных попыток отправки запросов в Doris. |
| `doris.request.connect.timeout.ms` | 30000 | Время ожидания подключения при отправке запросов в Doris. |
| `doris.request.read.timeout.ms` | 30000 | Время ожидания чтения при отправке запросов в Doris. |
| `doris.request.query.timeout.s` | 21600 | Время ожидания выполнения запросов Doris. Значение по умолчанию составляет 6 часов. `-1` означает отсутствие ограничения времени ожидания. |
| `doris.request.tablet.size` | 1 | Количество Tablet Doris, соответствующих одному разделу RDD. Чем меньше это значение, тем больше разделов создаётся, что повышает параллелизм на стороне Spark, но также увеличивает нагрузку на Doris. |
| `doris.read.field` | -- | Список имён столбцов для чтения из таблицы Doris, разделённых запятыми. |
| `doris.batch.size` | 4064 | Максимальное количество строк, считываемых из BE за один пакет. Увеличение этого значения сокращает количество соединений, устанавливаемых между Spark и Doris, и тем самым уменьшает дополнительные затраты времени, вызванные сетевой задержкой. |
| `doris.exec.mem.limit` | 8589934592 | Ограничение памяти для одного запроса. Значение по умолчанию соответствует 8 GB и задаётся в байтах. |
| `doris.write.fields` | -- | Задаёт поля или порядок полей для записи в таблицу Doris через запятую. По умолчанию записываются все поля в порядке полей таблицы Doris. |
| `doris.sink.batch.size` | 500000 | Максимальное количество строк, записываемых в BE одним пакетом. |
| `doris.sink.max-retries` | 0 | Количество повторных попыток после сбоя записи в BE. Начиная с версии 1.3.0 значение по умолчанию равно 0, то есть по умолчанию повторные попытки не выполняются. Если этот параметр больше 0, повторные попытки выполняются на уровне пакета, а в памяти Spark Executor кэшируется объём данных, определяемый параметром `doris.sink.batch.size`, поэтому может потребоваться соответствующее увеличение выделяемой памяти. |
| `doris.sink.retry.interval.ms` | 10000 | Интервал между повторными попытками после настройки их количества, в мс. |
| `doris.sink.properties.format` | csv | Формат данных для Stream Load. Поддерживаются три формата: `csv`, `json` и `arrow`. Дополнительные параметры см. в [руководстве по Stream Load](../../data-operate/import/import-way/stream-load-manual.md). |
| `doris.sink.properties.*` | -- | Параметры загрузки данных для Stream Load. Например, разделитель столбцов задаётся с помощью `'doris.sink.properties.column_separator' = ','`. Дополнительные параметры см. в [руководстве по Stream Load](../../data-operate/import/import-way/stream-load-manual.md). |
| `doris.sink.task.partition.size` | -- | Количество разделов, соответствующих задаче записи в Doris. После операций Spark RDD, таких как фильтрация, итоговое количество разделов для записи может быть большим, а количество записей в каждом разделе может быть небольшим, что приводит к повышенной частоте записи и неэффективному расходованию вычислительных ресурсов. Чем меньше это значение, тем ниже частота записи в Doris и нагрузка на Doris, связанная с compaction. Этот параметр используется совместно с `doris.sink.task.use.repartition`. |
| `doris.sink.task.use.repartition` | false | Определяет, следует ли использовать repartition для управления количеством разделов, записываемых в Doris. Значение по умолчанию `false` означает, что используется coalesce. Учтите, что при отсутствии оператора action Spark перед записью общий параллелизм вычислений может снизиться. Если установлено значение `true`, используется repartition. При этом можно задать итоговое количество разделов, но возникают дополнительные затраты на shuffle. |
| `doris.sink.batch.interval.ms` | 0 | Интервал между пакетами записи, в мс. |
| `doris.sink.enable-2pc` | false | Определяет, следует ли включить двухфазную фиксацию. Если она включена, транзакции фиксируются в конце задания, а при сбое некоторых задач все транзакции в состоянии предварительной фиксации откатываются. |
| `doris.sink.auto-redirect` | true | Определяет, следует ли перенаправлять запросы Stream Load. Если включено, запись Stream Load выполняется через FE, а информация о BE больше не запрашивается явно. |
| `doris.enable.https` | false | Определяет, следует ли включить HTTPS-запросы к FE. |
| `doris.https.key-store-path` | - | Путь к хранилищу ключей HTTPS. |
| `doris.https.key-store-type` | JKS | Тип хранилища ключей HTTPS. |
| `doris.https.key-store-password` | - | Пароль хранилища ключей HTTPS. |
| `doris.read.mode` | thrift | Режим чтения данных из Doris. Доступные варианты: `thrift` и `arrow`. |
| `doris.read.arrow-flight-sql.port` | - | Порт Arrow Flight SQL узла Doris FE. Если `doris.read.mode` установлен в `arrow`, этот порт используется для чтения данных через Arrow Flight SQL. О настройке на стороне сервера см. [Высокоскоростной канал передачи данных на базе Arrow Flight SQL](../arrow-flight-sql.md). |
| `doris.sink.label.prefix` | spark-doris | Префикс метки загрузки при записи через Stream Load. |
| `doris.thrift.max.message.size` | 2147483647 | Максимальный размер сообщения при чтении данных через Thrift. |
| `doris.fe.auto.fetch` | false | Определяет, следует ли автоматически получать информацию о FE. Если установлено значение `true`, информация обо всех узлах FE получается на основе узлов, указанных в `doris.fenodes`, поэтому нет необходимости настраивать несколько узлов или отдельно задавать `doris.read.arrow-flight-sql.port` и `doris.query.port`. |
| `doris.read.bitmap-to-string` | false | Определяет, следует ли при чтении преобразовывать тип Bitmap в строку, состоящую из индексов массива. Формат результата см. в описании функции [BITMAP_TO_STRING](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-string.md). |
| `doris.read.bitmap-to-base64` | false | Определяет, следует ли при чтении преобразовывать тип Bitmap в строку в кодировке Base64. Формат результата см. в описании функции [BITMAP_TO_BASE64](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-base64.md). |
| `doris.query.port` | - | Порт запросов Doris FE, используемый для записи в режиме Overwrite и получения метаданных Catalog. |

### Параметры конфигурации для SQL и DataFrame {#sql--and-dataframe-specific-configuration}

| Ключ | Значение по умолчанию | Описание |
| --- | --- | --- |
| `doris.filter.query.in.max.count` | 10000 | Максимальное количество элементов списка значений для выражения `in` при проталкивании предикатов. Если количество превышает это значение, фильтрация по выражению `in` выполняется на стороне Spark. |

### Параметры конфигурации для Structured Streaming {#structured-streaming-specific-configuration}

| Ключ | Значение по умолчанию | Описание |
| --- | --- | --- |
| `doris.sink.streaming.passthrough` | false | Записывает значение первого столбца напрямую, без обработки. |

### Параметры конфигурации для RDD {#rdd-specific-configuration}

| Ключ | Значение по умолчанию | Описание |
| --- | --- | --- |
| `doris.request.auth.user` | -- | Имя пользователя для доступа к Doris. |
| `doris.request.auth.password` | -- | Пароль для доступа к Doris. |
| `doris.filter.query` | -- | Выражение для фильтрации считываемых данных. Это выражение передаётся напрямую в Doris, где используется для фильтрации исходных данных. |

## Сопоставление типов {#type-mapping}

<!-- Knowledge type: Type mapping reference -->
<!-- Applicable scenarios: Schema design / Read-write type compatibility check -->

### Сопоставление типов столбцов Doris с типами Spark {#doris-to-spark-column-type-mapping}

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

### Сопоставление типов данных Spark с типами Doris {#spark-to-doris-data-type-mapping}

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

Начиная с версии 24.0.0 при чтении данных типа Bitmap возвращается значение типа string, а возвращаемая по умолчанию строка имеет значение `Read unsupported`.

:::

## Часто задаваемые вопросы и устранение неполадок {#faq-and-troubleshooting}

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

Начиная с версии 24.0.0 параметр `doris.ignore-type` считается устаревшим. При записи добавлять его не требуется.

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

Начиная с версии 24.0.0 коннектор поддерживает чтение преобразованных данных Bitmap через Arrow Flight SQL. Для этой возможности требуется Doris версии >= 2.1.0.

**Bitmap в String**

На примере DataFrame: установите `doris.read.bitmap-to-string` в `true`. Формат результата см. в описании параметра.

```scala
spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.read.bitmap-to-string", "true")
    .load()
```

**Bitmap в Base64**

На примере DataFrame: установите `doris.read.bitmap-to-base64` в `true`. Формат результата см. в описании параметра.

```scala
spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.read.bitmap-to-base64", "true")
    .load()
```

### Как устранить ошибку ErrorIfExists при записи DataFrame? {#how-to-handle-the-errorifexists-error-during-dataframe-writing}

Если запись DataFrame завершается с ошибкой `org.apache.spark.sql.AnalysisException: TableProvider implementation doris cannot be written with ErrorIfExists mode, please use Append or Overwrite modes instead.`, установите режим сохранения `Append`:

```scala
resultDf.write.format("doris")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    // your own options
    .mode(SaveMode.Append)
    .save()
```
