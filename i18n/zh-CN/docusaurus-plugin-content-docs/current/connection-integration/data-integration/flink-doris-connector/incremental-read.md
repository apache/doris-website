---
{
    "title": "增量读取 Doris Binlog",
    "language": "zh-CN",
    "description": "使用 Flink Doris Connector 持续读取开启 ROW 格式 Binlog 的 Doris 表的行级变更：启动模式、变更类型、交付语义、消费进度表和相关配置项。"
}
---

# 增量读取 Doris Binlog

对于使用 Doris 开启 ROW 格式 Binlog 的表，Flink Doris Connector 可以持续读取行级数据变更。使用 `initial` 模式时，Connector 会先读取当前表快照，再无缝切换到增量变更读取。

:::info 版本要求
该功能需要 Flink Doris Connector 26.3.0 及以上、Doris 5.0.0 及以上版本。Row Binlog 是 Doris 5.0.0 的实验性功能，需要在 FE 配置中开启 `enable_feature_binlog = true`；表上如何开启、支持的表模型和限制见 [Row Binlog](../../../data-operate/incremental/row-binlog.md)。
:::

## 使用示例 {#example}

首先，在 Doris 源表上启用 ROW 格式的 Binlog。如果消费端需要更新前的行数据，还需要启用 `binlog.need_historical_value`：

```sql
CREATE DATABASE IF NOT EXISTS test;

CREATE TABLE test.student_binlog_source (
    id INT,
    name VARCHAR(50),
    age INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true",
    "binlog.ttl_seconds" = "86400"
);

INSERT INTO test.student_binlog_source VALUES (1, 'Alice', 18);
```

然后启用 Flink Checkpoint 并创建 Doris Source 表：

```sql
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE student_binlog (
    id INT,
    name STRING,
    age INT,
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student_binlog_source',
    'username' = 'root',
    'password' = '',
    'source.scan.mode' = 'initial'
);

SELECT * FROM student_binlog;
```

## 启动模式 {#scan-mode}

任务启动后，对 `test.student_binlog_source` 的修改会以 Flink Changelog 形式持续输出。通过 `source.scan.mode` 选择启动模式：

| 模式 | 行为 |
| ---- | ---- |
| `snapshot` | 读取当前快照后结束，为默认模式。 |
| `initial` | 先读取当前快照，快照读取完成后切换到持续 Binlog 读取。 |
| `latest` | 跳过快照，只读取任务启动后产生的变更。 |
| `from-timestamp` | 跳过快照，从 `source.scan.timestamp` 指定的时间点开始读取变更（包含该时间点），时间格式为 `yyyy-MM-dd HH:mm:ss`。 |

## 变更类型 {#increment-type}

默认以 `detail` 类型输出完整的行变更。也可以通过 `source.binlog.increment-type` 设置为 `min_delta`（最小变更集）或 `append_only`（仅追加事件）。

## 注意事项

- 增量读取使用 Arrow Flight SQL，Connector 默认启用并自动获取端口。
- 需要启用 Flink Checkpoint。
- Doris Binlog 的保留时间应覆盖任务可能停止的最长时间。如果恢复所需的 Binlog 已过期，需要重新读取快照或指定新的起始时间。
- 执行 Binlog 增量读取时，如果读取区间内存在影响源表的未完成事务，Doris 会等待这些事务完成。若等待超时，本次读取会报错。Connector 仅针对该错误重试同一读取区间，重试时长由 `source.binlog.visible-wait-timeout` 控制（默认 `5m`）；设置为 `0s` 可关闭 Connector 重试，其他错误会立即失败。

## 交付语义与去重 {#delivery}

当前 Doris Binlog Source 只保证至少一次交付，任务故障恢复后可能重放变更事件，影响 Flink 查询结果。Flink 的 CDC 事件去重配置默认关闭；如需启用，可在提交查询前设置：

```sql
SET 'table.exec.source.cdc-events-duplicate' = 'true';
```

启用该配置时，源表必须像上面的示例一样声明主键。Flink 会增加一个有状态算子来规范化变更流。详情参见 [Flink 配置文档](https://nightlies.apache.org/flink/flink-docs-release-2.3/zh/docs/dev/table/config/#table-exec-source-cdc-events-duplicate)。

## 将消费进度写入 Doris（可选） {#offset-table}

消费进度默认保存在 Flink Checkpoint 中。如果还需要在 Doris 中查询消费进度，可以创建以下 Offset 表：

```sql
CREATE DATABASE IF NOT EXISTS ops;

CREATE TABLE ops.flink_source_offsets (
    consumer_id VARCHAR(256) NOT NULL,
    offset_timestamp DATETIME NOT NULL,
    update_time DATETIMEV2(3) NOT NULL
)
UNIQUE KEY(consumer_id)
DISTRIBUTED BY HASH(consumer_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);
```

```sql
'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
'source.binlog.offset-table' = 'ops.flink_source_offsets',
'source.binlog.consumer-id' = 'student-sync'
```

`source.binlog.consumer-id` 用于标识当前消费任务，同一任务重启时应保持不变。

## 配置项 {#options}

以下配置项控制增量读取。其余 Source 配置项见 [读取 Doris 数据](./read.md#options)。

| Key                         | Default Value | Required | Comment                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| source.scan.mode            | snapshot      | N        | Source 启动模式，支持 `snapshot`、`initial`、`latest` 和 `from-timestamp`                                                                               |
| source.scan.timestamp       | --            | N        | `from-timestamp` 模式的起始时间（含该时间点），格式为 `yyyy-MM-dd HH:mm:ss`                                                                                    |
| source.binlog.increment-type | detail       | N        | Binlog 变更类型，支持 `detail`、`min_delta` 和 `append_only`                                                                                           |
| source.binlog.poll-interval | 10s           | N        | 轮询新 Binlog 数据的时间间隔，最小值为 1 秒                                                                                                           |
| source.binlog.visible-wait-timeout | 5m            | N        | Doris 返回事务可见性等待超时错误后，Connector 重试同一读取区间的最长时间。设置为 `0s` 可关闭重试；不能为负值。 |
| source.binlog.offset-table  | --            | N        | 用于发布成功 Checkpoint 所覆盖 offset 的 Doris 表，格式为 `database.table`。需要同时配置 `source.binlog.consumer-id` 和 `jdbc-url`                       |
| source.binlog.consumer-id   | --            | N        | 写入 `source.binlog.offset-table` 的稳定消费者标识                                                                                                    |
