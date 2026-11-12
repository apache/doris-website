---
{
    "title": "DataStream API",
    "language": "ru",
    "description": "Чтение данных из Doris и запись в Doris через Flink DataStream API: DorisSource, DorisSink и сериализаторы String, RowData, Debezium и для нескольких таблиц."
}
---

# DataStream API {#datastream-api}

Помимо FlinkSQL, Flink Doris Connector предоставляет DataStream API: для чтения таблицы Doris используйте `DorisSource`, а для записи в Doris используйте `DorisSink`. Параметры такие же, как во FlinkSQL; см. [Чтение данных из Doris](./read.md#options) и [Запись данных в Doris](./write.md#options).

## Зависимости {#dependencies}

Добавьте в проект зависимость Maven для коннектора, как описано в разделе [Установка](./overview.md#installation).

:::info

Коннектор включает HttpClient версии 4.5.13. Если ваш проект отдельно подключает HttpClient, убедитесь, что версии совпадают.

:::

## Чтение с помощью DorisSource {#source}

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

## Запись с помощью DorisSink {#sink}

При записи через DataStream API можно использовать разные способы сериализации для записи входных данных в таблицы Doris.

Выберите сериализатор в зависимости от формата входных данных:

| Входные данные | Сериализатор |
| --- | --- |
| Строки CSV или JSON | [`SimpleStringSerializer`](#string) |
| Внутренний формат Flink `RowData` | [`RowDataSerializer`](#rowdata) |
| JSON в формате Debezium, например данные Flink CDC или данные в формате Debezium из Kafka | [`JsonDebeziumSchemaSerializer`](#debezium), который также синхронизирует изменения схемы источника |
| Записи `RecordWithMeta`, содержащие имена базы данных и таблицы | [`RecordWithMetaSerializer`](#multi-table), для записи в несколько таблиц через один Sink |

[Режимы записи](./write.md#write-modes) также применимы к DataStream API; для включения пакетной записи используйте `DorisExecutionOptions.Builder.setBatchMode(true)`.

### Строковый формат {#string}

Если входные данные представлены в формате CSV или JSON, для их сериализации можно напрямую использовать `SimpleStringSerializer`.

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

### Формат RowData {#rowdata}

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

### Формат Debezium {#debezium}

Для сериализации входных данных в формате Debezium (например, данных Flink CDC или данных в формате Debezium из Kafka) используйте `JsonDebeziumSchemaSerializer`.

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

### Запись в несколько таблиц {#multi-table}

DorisSink поддерживает синхронизацию нескольких таблиц через один Sink. Для этого необходимо передавать в Sink данные вместе со сведениями о базе данных и таблице и использовать `RecordWithMetaSerializer` для сериализации.

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
