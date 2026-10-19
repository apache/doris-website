---
{
    "title": "DataStream API",
    "language": "ko",
    "description": "Flink DataStream API를 통한 Doris 데이터 읽기 및 쓰기: DorisSource, DorisSink와 String, RowData, Debezium 및 다중 테이블 직렬화기."
}
---

# DataStream API {#datastream-api}

Flink Doris Connector는 FlinkSQL 외에도 DataStream API를 제공합니다. `DorisSource`로 Doris 테이블을 읽고 `DorisSink`로 Doris에 데이터를 쓸 수 있습니다. 옵션은 FlinkSQL과 동일합니다. [Doris에서 데이터 읽기](./read.md#options)와 [Doris에 데이터 쓰기](./write.md#options)를 참조하세요.

## 의존성 {#dependencies}

[설치](./overview.md#installation)에 설명된 대로 프로젝트에 Connector의 Maven 의존성을 추가하세요.

:::info

Connector에는 HttpClient 버전 4.5.13이 내부적으로 포함되어 있습니다. 프로젝트에서 HttpClient를 별도로 참조한다면 버전이 일치하는지 확인하세요.

:::

## DorisSource로 읽기 {#source}

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

## DorisSink로 쓰기 {#sink}

DataStream API로 데이터를 쓸 때는 다양한 직렬화 방식을 사용하여 업스트림 데이터를 Doris 테이블에 쓸 수 있습니다.

업스트림 데이터 형식에 따라 직렬화기를 선택하세요.

| 업스트림 데이터 | 직렬화기 |
| --- | --- |
| CSV 또는 JSON 문자열 | [`SimpleStringSerializer`](#string) |
| Flink 내부 형식인 `RowData` | [`RowDataSerializer`](#rowdata) |
| Debezium JSON(예: Flink CDC 또는 Kafka의 Debezium 형식 데이터) | [`JsonDebeziumSchemaSerializer`](#debezium), 업스트림의 Schema Changes도 동기화 |
| 데이터베이스 및 테이블 이름이 포함된 `RecordWithMeta` 레코드 | [`RecordWithMetaSerializer`](#multi-table), 하나의 Sink로 여러 테이블에 쓰기 |

[쓰기 모드](./write.md#write-modes)는 DataStream API에도 적용됩니다. `DorisExecutionOptions.Builder.setBatchMode(true)`로 배치 쓰기를 활성화하세요.

### 일반 String 형식 {#string}

업스트림 데이터가 CSV 또는 JSON 형식이면 `SimpleStringSerializer`를 직접 사용하여 데이터를 직렬화할 수 있습니다.

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

### RowData 형식 {#rowdata}

`RowData`는 Flink의 내부 형식입니다. 업스트림에서 RowData 형식으로 데이터를 전달하는 경우 `RowDataSerializer`를 사용하여 데이터를 직렬화해야 합니다.

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

### Debezium 형식 {#debezium}

업스트림의 Debezium 형식 데이터(예: Flink CDC 또는 Kafka의 Debezium 형식 데이터)는 `JsonDebeziumSchemaSerializer`를 사용하여 직렬화하세요.

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

### 다중 테이블 쓰기 {#multi-table}

DorisSink는 하나의 Sink로 여러 테이블을 동기화하는 기능을 지원합니다. 데이터베이스 및 테이블 정보를 데이터와 함께 Sink에 전달하고, `RecordWithMetaSerializer`를 사용하여 직렬화해야 합니다.

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
