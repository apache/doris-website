---
{
    "title": "写入 Doris 数据",
    "language": "zh-CN",
    "description": "使用 Flink Doris Connector 通过 Stream Load 写入 Doris：流式写入与攒批写入、S3 TVF 写入、部分列更新、Bitmap 导入、按指定列删除、Sink 配置项和监控指标。"
}
---

# 写入 Doris 数据

Flink Doris Connector 把 Flink 中的数据攒批后通过 Stream Load 写入 Doris。本页介绍写入模式、FlinkSQL 写入方法、常见写入场景以及 Sink 配置项；DataStream API 的写入方式见 [DataStream API 读写](./datastream-api.md#sink)。

## 写入模式 {#write-modes}

写入数据时，Flink Doris Connector 会在 Flink 内存中攒批，再通过 Stream Load 批量导入 Doris。Connector 提供两种攒批模式，默认使用基于 Flink Checkpoint 的流式写入：

| 对比项     | 流式写入                                                | 批量写入                                          |
| ---------- | ------------------------------------------------------- | ------------------------------------------------- |
| 触发条件   | 依赖 Flink Checkpoint，跟随 Checkpoint 周期写入到 Doris | 基于 Connector 内的时间阈值、数据量阈值周期性提交 |
| 一致性     | Exactly-Once                                            | At-Least-Once，基于主键模型可保证 Exactly-Once    |
| 延迟       | 受 Checkpoint 时间间隔限制，通常较高                    | 独立的批处理机制，灵活调整                        |
| 容错与恢复 | 与 Flink 状态恢复完全一致                               | 依赖外部去重逻辑（如 Doris 主键去重）             |

- **流式写入**（默认）：必须开启 Checkpoint，在整个 Checkpoint 期间持续将上游数据写入 Doris，不会一直将数据缓存在内存中；通过两阶段提交保证 Exactly-Once。任务重启时需要从最新的 Checkpoint/Savepoint 恢复，否则会因 label 重复而报错（见 [常见问题](./faq.md)）。
- **攒批写入**：Connector 1.5.0 起支持。不依赖 Checkpoint，将数据缓存在内存中，由 `sink.buffer-flush.max-rows`、`sink.buffer-flush.max-bytes` 和 `sink.buffer-flush.interval` 控制写入时机，通过 `'sink.enable.batch-mode' = 'true'` 开启。不保证 Exactly-Once，可借助 Unique 模型做到幂等写入。

除通过 Stream Load 写入外，还可以设置 `'sink.write-mode' = 'TVF'`，先将数据暂存到 S3 对象存储，再通过 S3 表值函数导入 Doris，见 [使用 S3 TVF 写入](#tvf)。

## FlinkSQL 写入 {#flink-sql}

通过 Flink 的 [Datagen](https://nightlies.apache.org/flink/flink-docs-master/docs/connectors/table/datagen/) 模拟上游持续产生的数据：

```sql
-- 启用 checkpoint
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
    -- 'sink.enable.batch-mode' = 'true'  增加该配置可以走攒批写入
);

INSERT INTO student_sink SELECT * FROM student_source;
```

## 使用 S3 TVF 写入 {#tvf}

TVF 写入模式先将数据以 JSON 格式暂存至 S3 对象存储，再通过 S3 表值函数导入 Doris。适合优先使用对象存储作为数据传输通道，或无法使用 Stream Load 网络链路的场景。

使用前，确保 Flink 和 Doris 均可访问 S3，且 Doris 中已创建目标表。

```sql
SET 'execution.checkpointing.interval' = '30s';

CREATE TABLE student_tvf_sink (
    id INT,
    name STRING,
    age INT
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
    'table.identifier' = 'test.student_tvf',
    'username' = 'root',
    'password' = '',
    'sink.write-mode' = 'TVF',
    'sink.label-prefix' = 'student_tvf',
    'sink.s3.endpoint' = 'https://s3.example.com',
    'sink.s3.region' = 'us-east-1',
    'sink.s3.bucket' = 'staging-bucket',
    'sink.s3.prefix' = 'doris/student',
    'sink.s3.access-key' = 'access-key',
    'sink.s3.secret-key' = 'secret-key'
);

INSERT INTO student_tvf_sink VALUES (1, 'Alice', 18);
```

Connector 不会自动删除 S3 中的暂存对象，请按需配置对象存储生命周期策略。

## 常见写入场景

### 部分列更新 {#partial-column-update}

通过 Stream Load 参数 `partial_columns` 开启部分列更新，并在 `columns` 中指定需要更新的列。表侧的要求见 [部分列更新](../../../data-operate/update/partial-column-update.md)。

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
    'sink.properties.columns' = 'id,name,bank,age', -- 需要更新的列
    'sink.properties.partial_columns' = 'true' -- 开启部分列更新
);
```

### 导入 Bitmap 数据 {#bitmap}

在 `sink.properties.columns` 中通过 `to_bitmap` 函数将整型列转换为 Bitmap：

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

### 根据指定列删除数据 {#delete-by-column}

Kafka 中的消息通常会使用特定字段来标记操作类型，例如 `{"op_type":"delete",data:{...}}`。针对这类数据，希望将 `op_type=delete` 的数据删除。

DorisSink 默认会根据 RowKind 来区分事件的类型，CDC 情况下可直接获取到事件类型，对隐藏列 `__DORIS_DELETE_SIGN__` 进行赋值达到删除的目的。Kafka 则需要根据业务逻辑判断，显式地传入隐藏列的值。

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
    'sink.properties.columns' = 'id, name, __DORIS_DELETE_SIGN__'  -- 显式指定 Stream Load 的导入列
);

INSERT INTO DORIS_SINK
SELECT json_value(data, '$.id') as id,
    json_value(data, '$.name') as name,
    if(op_type = 'delete', 1, 0) as __DORIS_DELETE_SIGN__
from KAFKA_SOURCE;
```

### 写入 CDC 变更数据 {#cdc-changelog}

上游是 Flink CDC 或 Debezium 格式的变更数据时，DorisSink 会根据 RowKind 区分 insert、update、delete 事件，删除事件通过 `sink.enable-delete` 同步到 Doris（需要 Unique 模型）。完整示例见 [整库同步（Flink CDC）](./cdc-sync.md#single-table-sync)；DataStream API 使用 `JsonDebeziumSchemaSerializer`，见 [Debezium 格式](./datastream-api.md#debezium)。

## 配置项 {#options}

以下为 Sink 配置项。连接相关的通用配置项见 [连接配置与 TLS](./connection.md#common-options)。

| Key                         | Default Value | Required | Comment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| sink.label-prefix           | --            | Y        | 导入使用的 label 前缀。2PC 场景下要求全局唯一，用来保证 Flink 的 EOS 语义。                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| sink.properties.*           | --            | N        | Stream Load 的导入参数。例如：`'sink.properties.column_separator' = ', '` 定义列分隔符；`'sink.properties.escape_delimiters' = 'true'` 表示特殊字符作为分隔符，`\x01` 会被转换为二进制的 `0x01`；JSON 格式导入：`'sink.properties.format' = 'json'`、`'sink.properties.read_json_by_line' = 'true'`，详细参数参考 [Stream Load](../../../data-operate/import/import-way/stream-load-manual.md#导入配置参数)。Group Commit 模式：`'sink.properties.group_commit' = 'sync_mode'` 设置 group commit 为同步模式。Flink Connector 从 1.6.2 开始支持导入配置 group commit，详细使用与限制参考 [Group Commit](../../../data-operate/import/load-best-practices/group-commit-manual.md)。从 26.1.0 开始 Stream Load 默认启用 gz 压缩，可通过设置 `'sink.properties.compress_type' = ''` 关闭压缩。 |
| sink.enable-delete          | TRUE          | N        | 是否启用删除。此选项需要 Doris 表开启批量删除功能（Doris 0.15+ 版本默认开启），只支持 Unique 模型。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| sink.enable-2pc             | TRUE          | N        | 是否开启两阶段提交（2pc），默认为 true，保证 Exactly-Once 语义。关于两阶段提交可参考 [Stream Load 2PC](../../../data-operate/transaction.md#streamload-2pc)。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| sink.write-mode             | STREAM_LOAD   | N        | 写入模式，支持 `STREAM_LOAD`、`STREAM_LOAD_BATCH` 和 `TVF`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| sink.s3.endpoint            | --            | 仅 TVF 写入模式 | 兼容 S3 的对象存储 endpoint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| sink.s3.region              | --            | 仅 TVF 写入模式 | 对象存储 region                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| sink.s3.bucket              | --            | 仅 TVF 写入模式 | 暂存文件使用的 bucket                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| sink.s3.prefix              | --            | 仅 TVF 写入模式 | 暂存文件的对象 key 前缀，不能包含 glob 字符                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| sink.s3.access-key          | --            | 仅 TVF 写入模式 | 对象存储 access key                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| sink.s3.secret-key          | --            | 仅 TVF 写入模式 | 对象存储 secret key                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| sink.s3.path-style-access   | FALSE         | N        | TVF 模式是否使用 path-style 对象存储访问方式                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| sink.buffer-size            | 1MB           | N        | 写数据缓存 buffer 大小，单位字节。不建议修改，默认配置即可                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| sink.buffer-count           | 3             | N        | 写数据缓存 buffer 个数。不建议修改，默认配置即可                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| sink.max-retries            | 3             | N        | Commit 失败后的最大重试次数，默认 3 次                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| sink.enable.batch-mode      | FALSE         | N        | 是否使用攒批模式写入 Doris。开启后写入时机不依赖 Checkpoint，通过 `sink.buffer-flush.max-rows`、`sink.buffer-flush.max-bytes`、`sink.buffer-flush.interval` 参数来控制写入时机。同时开启后将不保证 Exactly-Once 语义，可借助 Unique 模型做到幂等                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| sink.flush.queue-size       | 2             | N        | 攒批模式下，缓存的队列大小                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| sink.buffer-flush.max-rows  | 500000        | N        | 攒批模式下，单个批次最多写入的数据行数                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| sink.buffer-flush.max-bytes | 100MB         | N        | 攒批模式下，单个批次最多写入的字节数                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| sink.buffer-flush.interval  | 10s           | N        | 攒批模式下，异步刷新缓存的间隔                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| sink.ignore.update-before   | TRUE          | N        | 是否忽略 update-before 事件，默认忽略                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

## 监控指标 {#metrics}

Flink 提供了多种 [Metrics](https://nightlies.apache.org/flink/flink-docs-master/docs/ops/metrics/#metrics) 用于监测 Flink 集群的指标。以下为 Flink Doris Connector 新增的监控指标：

| Name                      | Metric Type | Description                                  |
| ------------------------- | ----------- | -------------------------------------------- |
| totalFlushLoadBytes       | Counter     | 已经刷新导入的总字节数                       |
| flushTotalNumberRows      | Counter     | 已经导入处理的总行数                         |
| totalFlushLoadedRows      | Counter     | 已经成功导入的总行数                         |
| totalFlushTimeMs          | Counter     | 已经成功导入完成的总时间                     |
| totalFlushSucceededNumber | Counter     | 已经成功导入的次数                           |
| totalFlushFailedNumber    | Counter     | 失败导入的次数                               |
| totalFlushFilteredRows    | Counter     | 数据质量不合格的总行数                       |
| totalFlushUnselectedRows  | Counter     | 被 where 条件过滤的总行数                    |
| beginTxnTimeMs            | Histogram   | 向 FE 请求开始一个事务所花费的时间，单位毫秒 |
| putDataTimeMs             | Histogram   | 向 FE 请求获取导入数据执行计划所花费的时间   |
| readDataTimeMs            | Histogram   | 读取数据所花费的时间                         |
| writeDataTimeMs           | Histogram   | 执行写入数据操作所花费的时间                 |
| commitAndPublishTimeMs    | Histogram   | 向 FE 请求提交并且发布事务所花费的时间       |
| loadTimeMs                | Histogram   | 导入完成的时间                               |
