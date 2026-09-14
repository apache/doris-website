---
{
    "title": "Writing Data to Doris",
    "language": "en",
    "description": "Write to Doris through Stream Load with Flink Doris Connector: streaming and batch write modes, S3 TVF write, partial column updates, Bitmap import, deleting by a specified column, Sink options, and monitoring metrics."
}
---

# Writing Data to Doris

Flink Doris Connector batches data in Flink and writes it to Doris through Stream Load. This page covers the write modes, writing with FlinkSQL, common write scenarios, and the Sink options. For writing with the DataStream API, see [DataStream API](./datastream-api.md#sink).

## Write Modes {#write-modes}

When writing data, Flink Doris Connector batches data in Flink memory and then bulk imports it into Doris via Stream Load. The Connector provides two batching modes, with streaming writes based on Flink Checkpoint as the default:

| Comparison Item       | Streaming Write                                                  | Batch Write                                                  |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| Trigger condition     | Depends on Flink Checkpoint, writes to Doris with each Checkpoint cycle | Periodically commits based on time and data-volume thresholds within the Connector |
| Consistency           | Exactly-Once                                                     | At-Least-Once; Exactly-Once can be guaranteed with the primary key model |
| Latency               | Limited by Checkpoint interval, usually higher                   | Independent batch processing mechanism, flexible to adjust   |
| Fault tolerance and recovery | Fully consistent with Flink state recovery                | Relies on external deduplication logic (such as Doris primary key deduplication) |

- **Streaming write** (default): Checkpoint must be enabled. Upstream data is continuously written to Doris throughout the Checkpoint period instead of being kept in memory, and two-phase commit guarantees Exactly-Once. When the job restarts, it must recover from the latest Checkpoint/Savepoint; otherwise the write fails with a duplicate label error (see [FAQ](./faq.md)).
- **Batch write**: Supported since Connector 1.5.0. It does not depend on Checkpoint: data is cached in memory and flushed according to `sink.buffer-flush.max-rows`, `sink.buffer-flush.max-bytes`, and `sink.buffer-flush.interval`. Enable it with `'sink.enable.batch-mode' = 'true'`. Exactly-Once is not guaranteed; idempotent writes can be achieved with the Unique model.

Besides Stream Load, you can set `'sink.write-mode' = 'TVF'` to stage data in S3-compatible object storage first and then load it into Doris through the S3 table-valued function. See [Writing with S3 TVF](#tvf).

## FlinkSQL Write {#flink-sql}

Use Flink's [Datagen](https://nightlies.apache.org/flink/flink-docs-master/docs/connectors/table/datagen/) to simulate data continuously produced by upstream:

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

## Writing with S3 TVF {#tvf}

TVF write mode first stages data in JSON format in S3 object storage and then imports it into Doris through the S3 table-valued function. Use this mode when object storage is the preferred data transfer path or when the Stream Load network path is unavailable.

Before use, ensure that both Flink and Doris can access S3 and that the target table already exists in Doris.

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

The Connector does not automatically delete staged objects from S3. Configure an object-storage lifecycle policy as needed.

## Common Write Scenarios

### Partial Column Updates {#partial-column-update}

Set the Stream Load parameter `partial_columns` to enable partial column updates and list the columns to update in `columns`. For the table-side requirements, see [Partial Column Update](../../../data-operate/update/partial-column-update.md).

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

### Importing Bitmap Data {#bitmap}

Convert an integer column to Bitmap with the `to_bitmap` function in `sink.properties.columns`:

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

### Deleting Data Based on a Specified Column {#delete-by-column}

Messages in Kafka often use a specific field to mark the operation type, for example `{"op_type":"delete",data:{...}}`. For this kind of data, you may want to delete records where `op_type=delete`.

By default, DorisSink distinguishes event types based on RowKind. In the CDC case, the event type can be obtained directly, and the hidden column `__DORIS_DELETE_SIGN__` is assigned a value to achieve deletion. For Kafka, the application logic must determine the value, which is then explicitly passed in for the hidden column.

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

### Writing CDC Changelog Data {#cdc-changelog}

When the upstream is Flink CDC or Debezium-format change data, DorisSink distinguishes insert, update, and delete events by RowKind, and delete events are synchronized to Doris through `sink.enable-delete` (Unique model required). For a complete example, see [Full-Database Sync (Flink CDC)](./cdc-sync.md#single-table-sync); with the DataStream API, use `JsonDebeziumSchemaSerializer` as described in [Debezium Format](./datastream-api.md#debezium).

## Options {#options}

The following are the Sink options. The general connection options are listed in [Connection Options and TLS](./connection.md#common-options).

| Key                         | Default Value | Required | Comment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| sink.label-prefix           | --            | Y        | The label prefix used for imports. In 2PC scenarios, it must be globally unique to guarantee Flink EOS semantics.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| sink.properties.*           | --            | N        | Stream Load import parameters. For example: `'sink.properties.column_separator' = ', '` defines the column separator; `'sink.properties.escape_delimiters' = 'true'` indicates that special characters are used as separators, and `\x01` will be converted to the binary `0x01`; for JSON-format imports: `'sink.properties.format' = 'json'`, `'sink.properties.read_json_by_line' = 'true'`. For detailed parameters, see [Stream Load](../../../data-operate/import/import-way/stream-load-manual.md#import-configuration-parameters). Group Commit mode: `'sink.properties.group_commit' = 'sync_mode'` sets group commit to synchronous mode. Flink Connector supports configuring group commit for imports starting from 1.6.2. For detailed usage and limitations, see [Group Commit](../../../data-operate/import/load-best-practices/group-commit-manual.md). Since 26.1.0, gz compression is enabled by default for Stream Load; it can be disabled by setting `'sink.properties.compress_type' = ''`. |
| sink.enable-delete          | TRUE          | N        | Whether to enable deletion. This option requires the Doris table to have batch deletion enabled (enabled by default in Doris 0.15+) and only supports the Unique model.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| sink.enable-2pc             | TRUE          | N        | Whether to enable two-phase commit (2pc). The default is true, which guarantees Exactly-Once semantics. For information on two-phase commit, see [Stream Load 2PC](../../../data-operate/transaction.md#streamload-2pc).                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| sink.write-mode             | STREAM_LOAD   | N        | Write mode. Supported values: `STREAM_LOAD`, `STREAM_LOAD_BATCH`, and `TVF`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| sink.s3.endpoint            | --            | TVF write mode only | S3-compatible object-storage endpoint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| sink.s3.region              | --            | TVF write mode only | Object-storage region.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| sink.s3.bucket              | --            | TVF write mode only | Bucket used to stage files.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| sink.s3.prefix              | --            | TVF write mode only | Object key prefix for staged files. The prefix cannot contain glob characters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| sink.s3.access-key          | --            | TVF write mode only | Object-storage access key.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| sink.s3.secret-key          | --            | TVF write mode only | Object-storage secret key.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| sink.s3.path-style-access   | FALSE         | N        | Whether TVF mode uses path-style object-storage access.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| sink.buffer-size            | 1MB           | N        | Buffer size for the write data cache, in bytes. Modifying this is not recommended; the default configuration is sufficient.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| sink.buffer-count           | 3             | N        | Number of write data cache buffers. Modifying this is not recommended; the default configuration is sufficient.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| sink.max-retries            | 3             | N        | The maximum number of retries after a Commit failure. The default is 3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| sink.enable.batch-mode      | FALSE         | N        | Whether to use batch mode to write to Doris. When enabled, the write timing does not depend on Checkpoint and is controlled by the `sink.buffer-flush.max-rows`, `sink.buffer-flush.max-bytes`, and `sink.buffer-flush.interval` parameters. Once enabled, Exactly-Once semantics is no longer guaranteed. The Unique model can be used to achieve idempotency.                                                                                                                                                                                                                                                                                                                |
| sink.flush.queue-size       | 2             | N        | In batch mode, the size of the cache queue.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| sink.buffer-flush.max-rows  | 500000        | N        | In batch mode, the maximum number of rows written in a single batch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| sink.buffer-flush.max-bytes | 100MB         | N        | In batch mode, the maximum number of bytes written in a single batch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| sink.buffer-flush.interval  | 10s           | N        | In batch mode, the interval for asynchronous cache flushing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| sink.ignore.update-before   | TRUE          | N        | Whether to ignore update-before events. The default is to ignore them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## Monitoring Metrics {#metrics}

Flink provides various [Metrics](https://nightlies.apache.org/flink/flink-docs-master/docs/ops/metrics/#metrics) for monitoring Flink cluster metrics. The following are the new monitoring metrics added by Flink Doris Connector:

| Name                      | Metric Type | Description                                          |
| ------------------------- | ----------- | ---------------------------------------------------- |
| totalFlushLoadBytes       | Counter     | The total number of bytes that have been flushed and imported. |
| flushTotalNumberRows      | Counter     | The total number of rows that have been imported and processed. |
| totalFlushLoadedRows      | Counter     | The total number of rows that have been successfully imported. |
| totalFlushTimeMs          | Counter     | The total time elapsed for successfully completing the imports. |
| totalFlushSucceededNumber | Counter     | The number of successful imports.                    |
| totalFlushFailedNumber    | Counter     | The number of failed imports.                        |
| totalFlushFilteredRows    | Counter     | The total number of rows whose data quality is unqualified. |
| totalFlushUnselectedRows  | Counter     | The total number of rows filtered out by the where condition. |
| beginTxnTimeMs            | Histogram   | The time taken to request FE to begin a transaction, in milliseconds. |
| putDataTimeMs             | Histogram   | The time taken to request FE to obtain the import data execution plan. |
| readDataTimeMs            | Histogram   | The time taken to read data.                         |
| writeDataTimeMs           | Histogram   | The time taken to perform the data write operation.  |
| commitAndPublishTimeMs    | Histogram   | The time taken to request FE to commit and publish the transaction. |
| loadTimeMs                | Histogram   | The time taken to complete the import.               |
