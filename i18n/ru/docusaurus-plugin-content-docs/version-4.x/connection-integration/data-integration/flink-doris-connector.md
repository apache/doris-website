---
{
    "title": "Flink Doris Connector",
    "language": "ru",
    "description": "Используйте Flink Doris Connector для чтения и записи данных Doris, соединения с таблицами измерений через Lookup Join и синхронизации целых баз данных, таких как MySQL, Oracle и PostgreSQL, с помощью CDC."
}
---

# Flink Doris Connector {#flink-doris-connector}

[Flink Doris Connector](https://github.com/apache/doris-flink-connector) читает данные из кластера Doris и записывает их в него через Flink, а благодаря интеграции с [Flink CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/) позволяет удобно синхронизировать целые базы данных из исходных систем, таких как MySQL.

Основные возможности:

- **Чтение данных Doris**: поддерживает параллельное чтение из BE, повышая эффективность чтения.
- **Запись данных Doris**: объединяет данные во Flink в пакеты, а затем загружает их через Stream Load.
- **Соединение с таблицами измерений через Lookup Join**: ускоряет соединения с таблицами измерений благодаря пакетной обработке и асинхронным запросам.
- **Синхронизация целых баз данных**: использует Flink CDC для синхронизации целых баз данных из MySQL, Oracle, PostgreSQL и других систем с поддержкой автоматического создания таблиц и синхронизации DDL.

## Совместимость версий {#version-notes}

| Версия Connector | Версия Flink          | Версия Doris | Версия Java    | Версия Scala |
| ----------------- | --------------------- | ------------- | -------------- | ------------- |
| 1.0.3             | 1.11,1.12,1.13,1.14   | 0.15+         | 8              | 2.11,2.12     |
| 1.1.1             | 1.14                  | 1.0+          | 8              | 2.11,2.12     |
| 1.2.1             | 1.15                  | 1.0+          | 8              | -             |
| 1.3.0             | 1.16                  | 1.0+          | 8              | -             |
| 1.4.0             | 1.15 - 1.17           | 1.0+          | 8              | -             |
| 1.5.2             | 1.15 - 1.18           | 1.0+          | 8              | -             |
| 1.6.1             | 1.15 - 1.19           | 1.0+          | 8              | -             |
| 24.0.1            | 1.15 - 1.20           | 1.0+          | 8              | -             |
| 24.1.0            | 1.15 - 1.20           | 1.0+          | 8              | -             |
| 25.0.0            | 1.15 - 1.20           | 1.0+          | 8              | -             |
| 25.1.0            | 1.15 - 1.20           | 1.0+          | 8              | -             |
| 26.0.0            | 1.15 - 1.20,2.0 - 2.2 | 1.0+          | 8(1.x),17(2.x) | -             |
| 26.1.1            | 1.15 - 1.20,2.0 - 2.2 | 1.0+          | 8(1.x),17(2.x) | -             |

## Установка {#installation}

Поддерживается установка как с помощью Jar-пакета, так и через зависимость Maven.

### Установка с помощью Jar-пакета {#jar-package-method}

Скачайте Jar-пакет Flink Doris Connector нужной версии со [страницы загрузок Doris](https://doris.apache.org/download#doris-ecosystem) и добавьте его в `classpath` Flink:

- **Режим Standalone**: поместите Jar-файл в каталог `lib/`.
- **Режим кластера Yarn**: поместите Jar-файл в пакет перед развёртыванием.

### Установка через зависимость Maven {#maven-dependency-method}

Добавьте следующую зависимость в файл `pom.xml` проекта:

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>flink-doris-connector-${flink.version}</artifactId>
    <version>${connector.version}</version>
</dependency>
```

Например:

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>flink-doris-connector-1.16</artifactId>
    <version>25.1.0</version>
</dependency>
```

## Как это работает {#how-it-works}

### Принцип чтения {#read-principle}

![FlinkConnectorPrinciples-JDBC-Doris](/images/next/connection-integration/data-integration/flink-doris-connector.jpg)

По сравнению с Flink JDBC Connector, Flink Doris Connector обеспечивает более высокую производительность чтения данных и рекомендуется к использованию:

- **Flink JDBC Connector**: хотя Doris совместим с протоколом MySQL, при чтении и записи через JDBC данные последовательно проходят через один узел FE. Это создаёт узкое место и снижает производительность. Этот способ не рекомендуется.
- **Flink Doris Connector**: начиная с Doris 2.1 протоколом чтения по умолчанию является ADBC. Чтение выполняется следующим образом:
    1. Flink Doris Connector получает от FE информацию об идентификаторах Tablet из плана запроса.
    2. Формирует запрос `SELECT * FROM tbs TABLET(id1, id2, id3)`.
    3. Выполняет запрос через порт ADBC узла FE.
    4. BE возвращает данные напрямую, минуя FE и устраняя узкое место на единственном узле FE.

### Принцип записи {#write-principle}

При записи Flink Doris Connector объединяет данные в пакеты в памяти Flink, а затем загружает их в Doris через Stream Load. Connector предоставляет два режима формирования пакетов. По умолчанию используется потоковая запись на основе Flink Checkpoint:

| Критерий сравнения | Потоковая запись | Пакетная запись |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| Условие запуска | Зависит от Flink Checkpoint: запись в Doris выполняется в каждом цикле Checkpoint | Периодическая фиксация по порогам времени и объёма данных, заданным в Connector |
| Согласованность | Exactly-Once | At-Least-Once; модель с первичным ключом позволяет гарантировать Exactly-Once |
| Задержка | Ограничена интервалом Checkpoint, обычно выше | Независимый механизм пакетной обработки с гибкой настройкой |
| Отказоустойчивость и восстановление | Полностью согласованы с восстановлением состояния Flink | Зависят от внешней логики дедупликации, например дедупликации по первичному ключу Doris |

## Быстрый старт {#quick-start}

В этом разделе приведён полный пример: от развёртывания кластера Flink до чтения и записи данных Doris с помощью FlinkSQL.

### 1. Разверните кластер Flink {#1-deploy-a-flink-cluster}

Рассмотрим кластер Standalone:

1. Скачайте установочный пакет [Flink 1.18.1](https://archive.apache.org/dist/flink/flink-1.18.1/flink-1.18.1-bin-scala_2.12.tgz).
2. После распаковки поместите Jar-пакет Flink Doris Connector в каталог `<FLINK_HOME>/lib`.
3. Перейдите в каталог `<FLINK_HOME>` и выполните `bin/start-cluster.sh`, чтобы запустить кластер Flink.
4. С помощью команды `jps` убедитесь, что кластер Flink успешно запущен.

### 2. Инициализируйте таблицу Doris {#2-initialize-the-doris-table}

Выполните следующий SQL, чтобы создать таблицы Doris и записать тестовые данные:

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

INSERT INTO test.student values(1, "James", 18);
INSERT INTO test.student values(2, "Emily", 28);

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

### 3. Запустите задание FlinkSQL {#3-run-a-flinksql-job}

Запустите клиент FlinkSQL:

```shell
bin/sql-client.sh
```

Выполните следующий FlinkSQL:

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

INSERT INTO StudentTrans SELECT id, concat('prefix_', name), age + 1 FROM Student;
```

### 4. Проверьте результат запросом {#4-query-the-result}

```text
mysql> select * from test.student_trans;
+------+--------------+------+
| id   | name         | age  |
+------+--------------+------+
|    1 | prefix_James |   19 |
|    2 | prefix_Emily |   29 |
+------+--------------+------+
2 rows in set (0.02 sec)
```

## Сценарии использования {#use-cases}

### Сценарий 1: чтение данных Doris {#case-1-reading-doris-data}

При чтении данных Doris через Flink источник Doris Source представляет собой ограниченный поток и не поддерживает непрерывное чтение через CDC. Поддерживаются следующие два протокола чтения:

| Протокол | Описание | Рекомендуемая версия |
| -------------- | ------------------------------------------------------------ | ------------------- |
| Thrift | Читает данные через интерфейс thrift узла BE | Совместим со всеми версиями |
| ArrowFlightSQL | Обеспечивает высокоскоростное чтение больших пакетов данных по протоколу Arrow Flight SQL на основе Doris 2.1 | Connector 24.0.0+ |

- Подробнее о чтении через Thrift см. в разделе [Чтение данных через интерфейс Thrift](https://github.com/apache/doris/blob/master/samples/doris-demo/doris-source-demo/README.md).
- Подробнее об использовании ArrowFlightSQL см. в разделе [Высокоскоростная передача данных на основе Arrow Flight SQL](https://doris.apache.org/docs/dev/db-connect/arrow-flight-sql-connect/). После Doris 2.1 рекомендуется использовать ArrowFlightSQL.

#### Чтение через FlinkSQL с использованием Thrift {#flinksql-read-thrift-method}

```sql
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',  -- FE host:HttpPort
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = ''
);

SELECT * FROM student;
```

#### Чтение через FlinkSQL с использованием ArrowFlightSQL {#flinksql-read-arrowflightsql-method}

```sql
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

#### Чтение через DataStream API {#reading-via-datastream-api}

Для чтения данных через DataStream API необходимо заранее добавить зависимость в POM-файл проекта. См. раздел [Установка](#installation).

```java
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

### Сценарий 2: запись данных Doris {#case-2-writing-doris-data}

Flink записывает данные в Doris через Stream Load и поддерживает два режима: потоковую и пакетную запись.

:::info Различия между потоковой и пакетной записью

Пакетная запись поддерживается после Connector 1.5.0. Она не зависит от Checkpoint: данные кэшируются в памяти, а момент записи определяется параметрами формирования пакетов. Для потоковой записи необходимо включить Checkpoint. В течение всего периода Checkpoint данные из источника непрерывно записываются в Doris без постоянного хранения в кэше памяти.

:::

#### Запись через FlinkSQL {#flinksql-write}

Используйте [Datagen](https://nightlies.apache.org/flink/flink-docs-master/docs/connectors/table/datagen/) из Flink, чтобы имитировать непрерывное поступление данных из источника:

```sql
-- Enable checkpoint
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
    -- 'sink.enable.batch-mode' = 'true'  Add this configuration to use batch write
);

INSERT INTO student_sink SELECT * FROM student_source;
```

#### Запись через DataStream API {#writing-via-datastream-api}

При записи через DataStream API можно использовать разные способы сериализации данных из источника для записи в таблицы Doris.

:::info

В состав Connector входит HttpClient версии 4.5.13. Если ваш проект отдельно подключает HttpClient, убедитесь, что версии совпадают.

:::

##### Формат обычной строки {#plain-string-format}

Если данные из источника имеют формат csv или json, для их сериализации можно напрямую использовать `SimpleStringSerializer`.

```java
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
// When upstream is json data, the following configuration is required
properties.setProperty("read_json_by_line", "true");
properties.setProperty("format", "json");

// When upstream is csv, the following configuration is required
// properties.setProperty("format", "csv");
// properties.setProperty("column_separator", ",");

DorisExecutionOptions executionOptions = DorisExecutionOptions.builder()
        .setLabelPrefix("label-doris")
        .setDeletable(false)
        // .setBatchMode(true)  Enable batch write
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

##### Формат RowData {#rowdata-format}

`RowData` является внутренним форматом Flink. Если источник передаёт данные в формате RowData, для их сериализации необходимо использовать `RowDataSerializer`.

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(10000);
env.setParallelism(1);

DorisSink.Builder<RowData> builder = DorisSink.builder();

Properties properties = new Properties();
properties.setProperty("column_separator", ",");
properties.setProperty("line_delimiter", "\n");
properties.setProperty("format", "csv");
// When upstream is json, the following configuration is required
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

// flink rowdata's schema
String[] fields = {"id", "name", "age"};
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

##### Формат Debezium {#debezium-format}

Для сериализации данных, поступающих из источника в формате Debezium, например из Flink CDC или Kafka с данными в формате Debezium, используйте `JsonDebeziumSchemaSerializer`.

```java
// Enable checkpoint
env.enableCheckpointing(10000);

Properties props = new Properties();
props.setProperty("format", "json");
props.setProperty("read_json_by_line", "true");
DorisOptions dorisOptions = DorisOptions.builder()
        .setFenodes("127.0.0.1:8030")
        .setTableIdentifier("test.student")
        .setUsername("root")
        .setPassword("").build();

DorisExecutionOptions.Builder executionBuilder = DorisExecutionOptions.builder();
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

##### Формат записи в несколько таблиц {#multi-table-write-format}

DorisSink поддерживает синхронизацию нескольких таблиц через один Sink. Для этого необходимо передавать в Sink данные вместе с информацией о базе данных и таблице, а для сериализации использовать `RecordWithMetaSerializer`.

```java
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

### Сценарий 3: соединение с таблицами измерений через Lookup Join {#case-3-lookup-join-dimension-table-association}

Lookup Join позволяет повысить производительность соединений с таблицами измерений во Flink. При использовании Flink JDBC Connector для таких соединений могут возникнуть следующие проблемы:

- Flink JDBC Connector использует синхронный режим запросов: при каждом поступлении записи из источника, например Kafka, сразу выполняется запрос к таблице измерений Doris. При большом числе одновременных обращений это приводит к высокой задержке запросов.
- Запросы через JDBC обычно представляют собой точечный поиск по одной записи, тогда как для повышения эффективности Doris рекомендует пакетные запросы.

Использование [Lookup Join](https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/dev/table/sql/queries/joins/#lookup-join) во Flink Doris Connector даёт следующие преимущества:

- Кэширование данных из источника пакетами позволяет избежать высокой задержки и нагрузки на базу данных, вызванных запросами для каждой записи.
- Асинхронное выполнение запросов соединения повышает пропускную способность обработки данных и снижает нагрузку запросов на Doris.

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
    `level` INT,
    `province` STRING,
    `country` STRING
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
    'table.identifier' = 'dim.dim_city',
    'username' = 'root',
    'password' = '',
    'lookup.cache.max-rows' = '100000',
    'lookup.cache.ttl' = '300s'
);

SELECT a.id, a.name, a.city, c.province, c.country, c.level
FROM fact_table a
LEFT JOIN dim_city FOR SYSTEM_TIME AS OF a.process_time AS c
ON a.city = c.city
```

### Сценарий 4: синхронизация целой базы данных через CDC {#case-4-full-database-cdc-synchronization}

Flink Doris Connector интегрирован с [Flink CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/) и позволяет легко синхронизировать реляционные базы данных, такие как MySQL, с Doris, поддерживая автоматическое создание таблиц, Schema Change и другие возможности. Сейчас поддерживаются следующие базы данных: MySQL, Oracle, PostgreSQL, SQLServer, MongoDB и DB2.

:::info Примечание

1. Для синхронизации целой базы данных необходимо добавить соответствующую зависимость Flink CDC (**Fat Jar**) в каталог `$FLINK_HOME/lib`, например `flink-sql-connector-mysql-cdc-${version}.jar` или `flink-sql-connector-oracle-cdc-${version}.jar`. Начиная с 3.1 Flink CDC несовместим с предыдущими версиями. Ссылки для скачивания: [Flink CDC 3.x](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/), [Flink CDC 2.x](https://repo.maven.apache.org/maven2/com/ververica/flink-sql-connector-mysql-cdc/).
2. После Connector 24.0.0 версия зависимости Flink CDC должна быть не ниже 3.1. [Ссылка для скачивания](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/). Если Flink CDC используется для синхронизации MySQL и Oracle, в каталог `$FLINK_HOME/lib` также необходимо добавить соответствующие драйверы JDBC.

:::

После запуска кластера Flink выполните команду, соответствующую типу источника данных.

#### Синхронизация целой базы данных MySQL {#mysql-full-database-synchronization}

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

#### Синхронизация целой базы данных Oracle {#oracle-full-database-synchronization}

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

#### Синхронизация целой базы данных PostgreSQL {#postgresql-full-database-synchronization}

```shell
<FLINK_HOME>/bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    ./lib/flink-doris-connector-1.16-24.0.1.jar \
    postgres-sync-database \
    --database db1 \
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

#### Синхронизация целой базы данных SQLServer {#sqlserver-full-database-synchronization}

```shell
<FLINK_HOME>/bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    ./lib/flink-doris-connector-1.16-24.0.1.jar \
    sqlserver-sync-database \
    --database db1 \
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

#### Синхронизация целой базы данных DB2 {#db2-full-database-synchronization}

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

#### Синхронизация целой базы данных MongoDB {#mongodb-full-database-synchronization}

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

#### Синхронизация целой базы данных AWS Aurora MySQL {#aws-aurora-mysql-full-database-synchronization}

```shell
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

#### Синхронизация целой базы данных AWS RDS MySQL {#aws-rds-mysql-full-database-synchronization}

```shell
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

## Справочник настроек {#configuration-reference}

### Общие настройки {#general-configuration}

| Ключ | Значение по умолчанию | Обязательный | Описание |
| ----------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------- |
| fenodes | -- | Y | HTTP-адрес Doris FE; поддерживается несколько адресов, разделённых запятыми |
| benodes | -- | N | HTTP-адрес Doris BE; поддерживается несколько адресов, разделённых запятыми |
| jdbc-url | -- | N | Параметры подключения JDBC, например: `jdbc:mysql://127.0.0.1:9030` |
| table.identifier | -- | Y | Имя таблицы Doris, например: `db.tbl` |
| username | -- | Y | Имя пользователя для доступа к Doris |
| password | -- | Y | Пароль для доступа к Doris |
| auto-redirect | TRUE | N | Определяет, перенаправлять ли запросы Stream Load. Если включено, Stream Load выполняет запись через FE без явного получения информации о BE |
| doris.request.retries | 3 | N | Количество повторных попыток отправки запросов в Doris |
| doris.request.connect.timeout | 30s | N | Тайм-аут подключения при отправке запросов в Doris |
| doris.request.read.timeout | 30s | N | Тайм-аут чтения при отправке запросов в Doris |

### Настройки Source {#source-configuration}

| Ключ | Значение по умолчанию | Обязательный | Описание |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| doris.request.query.timeout | 21600s | N | Тайм-аут выполнения запроса к Doris. Значение по умолчанию: 6 часов. |
| doris.request.tablet.size | 1 | N | Количество Tablet Doris, соответствующих одному Partition. Чем меньше это значение, тем больше создаётся Partition. Это повышает параллелизм на стороне Flink, но также увеличивает нагрузку на Doris. |
| doris.batch.size | 4064 | N | Максимальное количество строк, считываемых из BE за один раз. Увеличение этого значения позволяет сократить число соединений между Flink и Doris и тем самым уменьшить дополнительные затраты времени из-за сетевых задержек. |
| doris.exec.mem.limit | 8192mb | N | Ограничение памяти для одного запроса. По умолчанию: 8GB, задаётся в байтах. |
| source.use-flight-sql | TRUE | N | Определяет, использовать ли Arrow Flight SQL для чтения |
| source.flight-sql-port | - | N | При чтении через Arrow Flight SQL задаёт порт `arrow_flight_sql_port` узла FE |

**Настройки для DataStream**

| Ключ | Значение по умолчанию | Обязательный | Описание |
| ------------------ | ------------- | -------- | --------------------------------------------------------------------------------------------- |
| doris.read.field | -- | N | Список имён столбцов для чтения из таблицы Doris, разделённых запятыми |
| doris.filter.query | -- | N | Выражение для фильтрации считываемых данных. Оно передаётся в Doris, где применяется для фильтрации данных на стороне источника. Например, `age=18`. |

### Настройки Sink {#sink-configuration}

| Ключ | Значение по умолчанию | Обязательный | Описание |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| sink.label-prefix | -- | Y | Префикс метки для загрузок через Stream Load. В сценариях 2pc он должен быть глобально уникальным, чтобы гарантировать семантику EOS во Flink. |
| sink.properties.* | -- | N | Параметры загрузки через Stream Load. Например, `'sink.properties.column_separator' = ', '` задаёт разделитель столбцов; `'sink.properties.escape_delimiters' = 'true'` указывает, что в качестве разделителей используются специальные символы, а `\x01` будет преобразован в двоичное значение `0x01`; для загрузки в формате JSON: `'sink.properties.format' = 'json'`, `'sink.properties.read_json_by_line' = 'true'`. Подробное описание параметров см. в разделе [Stream Load](../../data-operate/import/import-way/stream-load-manual.md#import-configuration-parameters). Режим Group Commit: `'sink.properties.group_commit' = 'sync_mode'` включает синхронный режим групповой фиксации. Flink Connector поддерживает настройку групповой фиксации для загрузки начиная с 1.6.2. Подробнее об использовании и ограничениях см. в разделе [Group Commit](../../data-operate/import/load-best-practices/group-commit-manual.md). Начиная с 26.1.0 сжатие gz для Stream Load включено по умолчанию; его можно отключить, задав `'sink.properties.compress_type' = ''`. |
| sink.enable-delete | TRUE | N | Определяет, включать ли удаление. Для этого в таблице Doris должно быть включено пакетное удаление, которое включено по умолчанию в Doris 0.15+. Поддерживается только модель Unique. |
| sink.enable-2pc | TRUE | N | Определяет, включать ли двухфазную фиксацию (2pc). По умолчанию используется true, что гарантирует семантику Exactly-Once. Подробнее о двухфазной фиксации см. в разделе [Stream Load 2PC](../../data-operate/transaction.md#streamload-2pc). |
| sink.buffer-size | 1MB | N | Размер буфера кэширования записываемых данных в байтах. Изменять не рекомендуется: настройки по умолчанию достаточно. |
| sink.buffer-count | 3 | N | Количество буферов кэширования записываемых данных. Изменять не рекомендуется: настройки по умолчанию достаточно. |
| sink.max-retries | 3 | N | Максимальное количество повторных попыток после сбоя Commit. По умолчанию: 3. |
| sink.enable.batch-mode | FALSE | N | Определяет, использовать ли пакетный режим записи в Doris. Если включено, момент записи не зависит от Checkpoint и определяется параметрами `sink.buffer-flush.max-rows`, `sink.buffer-flush.max-bytes` и `sink.buffer-flush.interval`. При включении этого режима семантика Exactly-Once больше не гарантируется. Для обеспечения идемпотентности можно использовать модель Unique. |
| sink.flush.queue-size | 2 | N | Размер очереди кэша в пакетном режиме. |
| sink.buffer-flush.max-rows | 500000 | N | Максимальное количество строк, записываемых одним пакетом в пакетном режиме. |
| sink.buffer-flush.max-bytes | 100MB | N | Максимальное количество байтов, записываемых одним пакетом в пакетном режиме. |
| sink.buffer-flush.interval | 10s | N | Интервал асинхронного сброса кэша в пакетном режиме. |
| sink.ignore.update-before | TRUE | N | Определяет, игнорировать ли события update-before. По умолчанию они игнорируются. |

### Настройки Lookup Join {#lookup-join-configuration}

| Ключ | Значение по умолчанию | Обязательный | Описание |
| --------------------------------- | ------------- | -------- | --------------------------------------------- |
| lookup.cache.max-rows | -1 | N | Максимальное количество строк, кэшируемых при lookup. Значение по умолчанию: -1, что означает отключение кэширования. |
| lookup.cache.ttl | 10s | N | Максимальное время хранения в кэше lookup. По умолчанию: 10s. |
| lookup.max-retries | 1 | N | Количество повторных попыток после сбоя запроса lookup. |
| lookup.jdbc.async | FALSE | N | Определяет, включать ли асинхронный lookup. По умолчанию: false. |
| lookup.jdbc.read.batch.size | 128 | N | Максимальный размер пакета для одного запроса при асинхронном lookup. |
| lookup.jdbc.read.batch.queue-size | 256 | N | Размер промежуточной буферной очереди при асинхронном lookup. |
| lookup.jdbc.read.thread-size | 3 | N | Количество потоков JDBC для lookup в каждой задаче. |

### Настройки синхронизации целой базы данных {#full-database-synchronization-configuration}

**Синтаксис**

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

**Параметры настройки**

| Ключ | Описание |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --job-name | Имя задания Flink, необязательный параметр. |
| --database | Имя базы данных в Doris, в которую выполняется синхронизация. |
| --table-prefix | Префикс таблиц Doris, например `--table-prefix ods_`. |
| --table-suffix | Аналогично предыдущему параметру, задаёт суффикс таблиц Doris. |
| --including-tables | Таблицы MySQL для синхронизации. Несколько таблиц можно разделять с помощью `\|`; поддерживаются регулярные выражения. Например: `--including-tables table1`. |
| --excluding-tables | Таблицы, которые не нужно синхронизировать. Используется аналогично предыдущему параметру. |
| --mysql-conf | Настройки MySQL CDCSource, например `--mysql-conf hostname=127.0.0.1`. Полный список настроек см. в разделе [MySQL CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mysql-cdc/). Параметры hostname/username/password/database-name обязательны. Если среди синхронизируемых баз данных или таблиц есть таблицы без первичного ключа, необходимо задать `scan.incremental.snapshot.chunk.key-column`, выбрав только одно поле, не допускающее NULL. Например: `scan.incremental.snapshot.chunk.key-column=database.table:column,database.table1:column...`. Столбцы разных баз данных и таблиц разделяются запятыми. |
| --oracle-conf | Настройки Oracle CDCSource, например `--oracle-conf hostname=127.0.0.1`. Полный список настроек см. в разделе [Oracle CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/oracle-cdc/). Параметры hostname/username/password/database-name/schema-name обязательны. |
| --postgres-conf | Настройки Postgres CDCSource, например `--postgres-conf hostname=127.0.0.1`. Полный список настроек см. в разделе [Postgres CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/postgres-cdc/). Параметры hostname/username/password/database-name/schema-name/slot.name обязательны. |
| --sqlserver-conf | Настройки SQLServer CDCSource, например `--sqlserver-conf hostname=127.0.0.1`. Полный список настроек см. в разделе [SQLServer CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/sqlserver-cdc/). Параметры hostname/username/password/database-name/schema-name обязательны. |
| --db2-conf | Настройки DB2 CDCSource, например `--db2-conf hostname=127.0.0.1`. Полный список настроек см. в разделе [DB2 CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/db2-cdc/). Параметры hostname/username/password/database-name/schema-name обязательны. |
| --mongodb-conf | Настройки MongoDB CDCSource, например `--mongodb-conf hosts=127.0.0.1:27017`. Полный список настроек см. в разделе [Mongo CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mongodb-cdc/). Параметры hosts/username/password/database обязательны. `--mongodb-conf schema.sample-percent` задаёт долю автоматической выборки данных MongoDB для создания таблиц Doris; значение по умолчанию: 0.2. |
| --sink-conf | Все настройки Doris Sink. Полный список параметров см. в разделе [Настройки Sink](#sink-configuration). |
| --table-conf | Параметры таблицы Doris, то есть содержимое properties, за исключением table-buckets, который не является атрибутом properties. Например, `--table-conf replication_num=1`; `--table-conf table-buckets="tbl1:10,tbl2:20,a.*:30,b.*:40,.*:50"` задаёт количество бакетов для разных таблиц в порядке регулярных выражений. Если совпадение не найдено, таблица создаётся с `BUCKETS AUTO`. |
| --schema-change-mode | Режим разбора изменений схемы. Поддерживаются два режима: `debezium_structure` и `sql_parser`. По умолчанию используется `debezium_structure`. Режим `debezium_structure` разбирает структуру данных, используемую при синхронизации CDC-данных из источника, и определяет операции изменения DDL на основе этой структуры. Режим `sql_parser` определяет операции изменения DDL, разбирая DDL-инструкции при синхронизации CDC-данных из источника, поэтому он точнее. Пример использования: `--schema-change-mode debezium_structure`. Поддерживается после Connector 24.0.0. |
| --single-sink | Определяет, использовать ли один Sink для синхронизации всех таблиц. Если включено, новые таблицы в источнике также обнаруживаются автоматически, и соответствующие таблицы создаются автоматически. |
| --multi-to-one-origin | Настройки исходных таблиц при записи нескольких таблиц источника в одну таблицу. Например, `--multi-to-one-origin "a_.*\|b_.*"`. Подробнее см. в [#208](https://github.com/apache/doris-flink-connector/pull/208). |
| --multi-to-one-target | Используется вместе с `--multi-to-one-origin` и задаёт настройки целевых таблиц. Например, `--multi-to-one-target "a\|b"`. |
| --create-table-only | Определяет, синхронизировать ли только структуру таблиц. |

## Соответствие типов данных {#data-type-mapping}

### Из Doris во Flink {#doris-to-flink}

| Тип Doris | Тип Flink |
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

### Из Flink в Doris {#flink-to-doris}

| Тип Flink | Тип Doris |
| ------------- | -------------- |
| BOOLEAN       | BOOLEAN        |
| TINYINT       | TINYINT        |
| SMALLINT      | SMALLINT       |
| INTEGER       | INTEGER        |
| BIGINT        | BIGINT         |
| FLOAT         | FLOAT          |
| DOUBLE        | DOUBLE         |
| DECIMAL       | DECIMAL        |
| CHAR          | CHAR           |
| VARCHAR       | VARCHAR/STRING |
| STRING        | STRING         |
| DATE          | DATE           |
| TIMESTAMP     | DATETIME       |
| TIMESTAMP_LTZ | DATETIME       |
| ARRAY         | ARRAY          |
| MAP           | MAP/JSON       |
| ROW           | STRUCT/JSON    |

## Метрики мониторинга {#monitoring-metrics}

Flink предоставляет различные [метрики](https://nightlies.apache.org/flink/flink-docs-master/docs/ops/metrics/#metrics) для мониторинга кластера Flink. Flink Doris Connector добавляет следующие метрики мониторинга:

| Имя | Тип метрики | Описание |
| ------------------------- | ----------- | ---------------------------------------------------- |
| totalFlushLoadBytes | Counter | Общее количество байтов, сброшенных из буфера и загруженных. |
| flushTotalNumberRows | Counter | Общее количество загруженных и обработанных строк. |
| totalFlushLoadedRows | Counter | Общее количество успешно загруженных строк. |
| totalFlushTimeMs | Counter | Общее время, затраченное на успешное выполнение загрузок. |
| totalFlushSucceededNumber | Counter | Количество успешных загрузок. |
| totalFlushFailedNumber | Counter | Количество неудачных загрузок. |
| totalFlushFilteredRows | Counter | Общее количество строк, не отвечающих требованиям к качеству данных. |
| totalFlushUnselectedRows | Counter | Общее количество строк, отфильтрованных условием where. |
| beginTxnTimeMs | Histogram | Время, затраченное на запрос к FE для начала транзакции, в миллисекундах. |
| putDataTimeMs | Histogram | Время, затраченное на запрос к FE для получения плана выполнения загрузки данных. |
| readDataTimeMs | Histogram | Время, затраченное на чтение данных. |
| writeDataTimeMs | Histogram | Время, затраченное на выполнение операции записи данных. |
| commitAndPublishTimeMs | Histogram | Время, затраченное на запрос к FE для фиксации и публикации транзакции. |
| loadTimeMs | Histogram | Время, затраченное на выполнение загрузки. |

## Рекомендации по использованию {#best-practices}

### Быстрая загрузка данных MySQL через CDC во FlinkSQL {#quickly-ingesting-mysql-data-via-cdc-in-flinksql}

```sql
-- Enable checkpoint
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE cdc_mysql_source (
    id int,
    name VARCHAR,
    PRIMARY KEY (id) NOT ENFORCED
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

insert into doris_sink select id, name from cdc_mysql_source;
```

### Частичное обновление столбцов с помощью Flink {#performing-partial-column-updates-with-flink}

```sql
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
    'sink.properties.columns' = 'id,name,bank,age', -- Columns to update
    'sink.properties.partial_columns' = 'true' -- Enable partial column update
);
```

### Загрузка данных Bitmap с помощью Flink {#importing-bitmap-data-with-flink}

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

### Обновление ключевых столбцов с помощью Flink CDC {#updating-key-columns-with-flink-cdc}

В базах данных бизнес-приложений первичным ключом таблицы обычно служит ID. Например, в таблице Student первичным ключом является ID (id). Однако по мере развития приложения ID, соответствующий определённой записи, может измениться. В этом случае синхронизация данных с помощью Flink CDC + Doris Connector автоматически обновляет данные в столбце первичного ключа Doris.

**Принцип работы**

В основе сбора данных Flink CDC лежит Debezium. Для определения операции Debezium использует поле `op`: значения поля `op` могут быть `c`, `u`, `d` и `r`, что соответствует созданию, обновлению, удалению и чтению. При обновлении столбца первичного ключа Flink CDC отправляет события DELETE и INSERT далее по потоку. После синхронизации с Doris данные в столбце первичного ключа обновляются автоматически.

**Использование**

Программу Flink можно написать на основе приведённого выше примера синхронизации через CDC. После успешной отправки задания выполните в MySQL инструкцию Update для столбца первичного ключа, например `update student set id = '1002' where id = '1001'`, чтобы изменить данные в Doris.

### Удаление данных по указанному столбцу с помощью Flink {#deleting-data-based-on-a-specified-column-with-flink}

В сообщениях Kafka тип операции часто обозначается отдельным полем, например `{"op_type":"delete",data:{...}}`. Для таких данных может потребоваться удаление записей, у которых `op_type=delete`.

По умолчанию DorisSink определяет типы событий на основе RowKind. При использовании CDC тип события можно получить напрямую, а удаление выполняется путём присвоения значения скрытому столбцу `__DORIS_DELETE_SIGN__`. Для Kafka значение должна определить логика приложения, после чего его необходимо явно передать в скрытый столбец.

```sql
-- For example, upstream data: {"op_type":"delete",data:{"id":1,"name":"zhangsan"}}
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
    'sink.enable-delete' = 'false',        -- false means do not get the event type from RowKind
    'sink.properties.columns' = 'id, name, __DORIS_DELETE_SIGN__'  -- Explicitly specify the import columns of Stream Load
);

INSERT INTO DORIS_SINK
SELECT json_value(data, '$.id') as id,
    json_value(data, '$.name') as name,
    if(op_type = 'delete', 1, 0) as __DORIS_DELETE_SIGN__
from KAFKA_SOURCE;
```

### Синхронизация DDL-инструкций с помощью Flink CDC {#synchronizing-ddl-statements-with-flink-cdc}

При синхронизации источников данных, таких как MySQL, добавление или удаление полей в источнике должно сопровождаться соответствующими операциями Schema Change в Doris.

Для этого обычно необходимо написать программу с использованием DataStream API и применять `JsonDebeziumSchemaSerializer`, предоставляемый DorisSink, для сериализации. После этого Schema Change выполняется автоматически.

В инструменте синхронизации целой базы данных, предоставляемом Connector, дополнительные настройки не требуются: DDL из источника синхронизируется автоматически, и в Doris выполняются операции Schema Change.

## Часто задаваемые вопросы {#faq}

**1. errCode = 2, detailMessage = Label [label_0_1] has already been used, relate to txn [19650]**

В сценариях Exactly-Once при перезапуске задания Flink необходимо восстанавливаться из последнего Checkpoint/Savepoint, иначе возникает указанная ошибка. Если Exactly-Once не требуется, проблему также можно решить, отключив фиксацию 2PC (`sink.enable-2pc=false`) или задав другой `sink.label-prefix`.

**2. errCode = 2, detailMessage = transaction [19650] not found**

Эта ошибка возникает на этапе Commit. Срок действия идентификатора транзакции, записанного в Checkpoint, истёк на стороне FE. Повторная попытка фиксации приводит к указанной ошибке. В этом случае восстановление из Checkpoint невозможно. Срок действия можно увеличить, изменив параметр `streaming_label_keep_max_second` в `fe.conf` (по умолчанию 12 часов). После Doris 2.0 также действует ограничение, заданное параметром `label_num_threshold` в `fe.conf` (по умолчанию 2000). Его можно увеличить или установить в -1 (-1 означает, что применяется только ограничение по времени).

**3. errCode = 2, detailMessage = current running txns on db 10006 is 100, larger than limit 100**

Эта ошибка возникает, когда количество одновременных загрузок в одну базу данных превышает 100. Для решения измените параметр `max_running_txn_num_per_db` в `fe.conf`. Подробнее см. в разделе [max_running_txn_num_per_db](../../admin-manual/config/fe-config.md#max_running_txn_num_per_db). Кроме того, ошибка может возникать из-за частой смены метки и перезапуска задания. В сценариях 2pc с моделями Duplicate/Aggregate метка каждого задания должна быть уникальной. Только при восстановлении из Checkpoint задание Flink явно отменяет предыдущие транзакции, успешно прошедшие предварительную фиксацию, но ещё не зафиксированные окончательно. Частая смена метки и перезапуск приводят к тому, что множество успешно предварительно зафиксированных транзакций не удаётся отменить и они занимают доступные слоты транзакций. При использовании модели Unique можно также отключить 2pc, обеспечив идемпотентную запись.

**4. tablet writer write failed, tablet_id=190958, txn_id=3505530, err=-235**

Обычно эта ошибка возникает в версиях до Connector 1.1.0 из-за слишком частой записи, которая приводит к накоплению чрезмерного количества версий. Частоту Stream Load можно уменьшить с помощью параметров `sink.batch.size` и `sink.batch.interval`. После Connector 1.1.0 момент записи по умолчанию определяется Checkpoint, поэтому частоту записи можно уменьшить, увеличив интервал Checkpoint.

**5. Как пропустить некорректные данные при загрузке через Flink?**

Если при загрузке данных через Flink встречаются некорректные данные, например неверный формат или длина поля, Stream Load сообщает об ошибке, а Flink непрерывно повторяет попытки. Чтобы пропустить такие данные, можно отключить строгий режим Stream Load (`strict_mode=false`, `max_filter_ratio=1`) или отфильтровать данные перед оператором Sink.

**6. Как настроить подключение, если между машиной Flink и машиной BE нет сетевой связи?**

Когда Flink инициирует запись в Doris, Doris перенаправляет её на BE. При этом возвращается внутренний IP-адрес BE, то есть адрес, отображаемый командой `show backends`. Если Flink и Doris не могут связаться, возникает ошибка. В этом случае внешний IP-адрес BE можно задать в `benodes`.

**7. stream load error: HTTP/1.1 307 Temporary Redirect**

Сначала Flink отправляет запрос в FE. Получив ответ 307, он отправляет запрос на BE, указанный в перенаправлении. Если FE выполняет FullGC, находится под высокой нагрузкой или испытывает сетевые задержки, HttpClient по умолчанию отправляет данные по истечении определённого времени (3 секунды), не дождавшись ответа. Поскольку тело запроса по умолчанию является InputStream, при получении ответа 307 повторно передать данные невозможно, и сразу возникает ошибка. Есть три способа решения:

1. Обновитесь до Connector 25.1.0 или выше, где время ожидания по умолчанию увеличено.
2. Задайте `auto-redirect=false`, чтобы отправлять запросы напрямую в BE. Это неприменимо в некоторых облачных сценариях.
3. При использовании модели с первичным ключом можно включить пакетный режим.
