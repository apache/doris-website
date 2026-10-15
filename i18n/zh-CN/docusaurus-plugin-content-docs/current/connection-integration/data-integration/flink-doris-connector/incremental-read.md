---
{
    "title": "增量读取 Doris Binlog",
    "language": "zh-CN",
    "description": "使用 Flink Doris Connector 持续读取开启 ROW 格式 Binlog 的 Doris 表的行级变更：启动模式、变更类型、交付语义、消费进度表和相关配置项。"
}
---

# 增量读取 Doris Binlog

对于使用 Doris 开启 ROW 格式 Binlog 的表，Flink Doris Connector 可以持续读取行级数据变更。使用 `initial` 模式时，Connector 会先读取当前表快照，再切换到增量变更读取。切换所需的变更必须仍处于源表的 Binlog 保留窗口内。

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

从 Flink Checkpoint 或 Savepoint 恢复时，Connector 会继续使用保存的消费状态。修改 `source.scan.mode` 或 `source.scan.timestamp` 不会重置该状态。恢复的位点和 `from-timestamp` 起点均受源表 `binlog.ttl_seconds` 限制，过期后的行为见下文。

## 变更类型 {#increment-type}

默认以 `detail` 类型输出完整的行变更。也可以通过 `source.binlog.increment-type` 设置为 `min_delta`（最小变更集）或 `append_only`（仅追加事件）。

Connector 通过 Doris `@incr` 查询读取变更。如果请求的起点已因 `binlog.ttl_seconds` 过期，不同变更类型的行为如下：

| 变更类型 | 起点已过期时的行为 |
| ---- | ---- |
| `detail`（默认）、`append_only` | Doris 将实际起点推进到第一个仍保留的 TSO，跳过过期变更。任务可能不报过期错误并继续运行，但输出中会缺失这些变更。 |
| `min_delta` | 读取报 `Row binlog offset has expired according to binlog.ttl_seconds`，避免返回不完整的净变化。 |

这些规则适用于正常消费、首次快照后的增量读取，以及从保存状态恢复的读取。任务持续运行或 Checkpoint 成功，并不能证明没有变更过期。`source.binlog.visible-wait-timeout` 不会对过期错误进行重试。

## 注意事项

- 增量读取使用 Arrow Flight SQL，Connector 默认启用并自动获取端口。
- 需要启用 Flink Checkpoint。
- Doris `binlog.ttl_seconds` 默认值为 `86400` 秒（一天），必须大于 `0`。过期机制不会等待 Flink 任务或其 Checkpoint；延长 TTL 无法恢复已被物理清理的记录。
- TTL 应覆盖首次快照耗时、消费积压，以及故障恢复和追赶进度所需的时间，并预留余量。请监控任务仍需读取的最早变更的年龄，从较早的 Checkpoint 或 Savepoint 恢复时也需考虑这一点。
- 如需自动物理清理，BE 也需开启 `enable_feature_binlog = true`，且自动 compaction 未被关闭。物理清理完成前，增量查询也会过滤过期记录，见 [Row Binlog 保留与清理](../../../data-operate/incremental/row-binlog.md#保留与清理)。
- 执行 Binlog 增量读取时，如果读取区间内存在影响源表的未完成事务，Doris 会等待这些事务完成。若等待超时，本次读取会报错。Connector 仅针对该错误重试同一读取区间，重试时长由 `source.binlog.visible-wait-timeout` 控制（默认 `5m`）；设置为 `0s` 可关闭 Connector 重试，其他错误会立即失败。

### Binlog 过期后的恢复 {#binlog-expiration-recovery}

如果所需变更已过期，原位点无法提供完整的增量恢复。对于需要保证下游数据与源表当前状态一致的任务，应以 `source.scan.mode = 'initial'` 重新执行初始化，不恢复已过期的 Checkpoint 或 Savepoint，并通过新快照重建下游数据。恢复旧状态时，即使设置了 `initial`，仍会继续使用保存的状态，而不会重新读取全量快照。

新快照可以重建表的当前状态，但无法重现已过期的历史事件。使用 `latest` 或较新的 `from-timestamp` 启动也会跳过缺失区间；仅在允许跳过该区间，或已通过其他方式补齐缺失数据时使用。

## 交付语义与去重 {#delivery}

在所需变更记录仍完整保留于 Doris 的前提下，Doris Binlog Source 提供至少一次交付。任务故障恢复后可能重放变更事件，影响 Flink 查询结果。Flink 的 CDC 事件去重配置默认关闭；如需启用，可在提交查询前设置：

```sql
SET 'table.exec.source.cdc-events-duplicate' = 'true';
```

启用该配置时，源表必须像上面的示例一样声明主键。Flink 会增加一个有状态算子来规范化变更流。详情参见 [Flink 配置文档](https://nightlies.apache.org/flink/flink-docs-release-2.3/zh/docs/dev/table/config/#table-exec-source-cdc-events-duplicate)。

Checkpoint 保存消费状态，CDC 去重处理重放的事件；两者都不会阻止 Doris Binlog 过期，也无法恢复因过期而丢失的事件。

## 将消费进度写入 Doris（可选） {#offset-table}

消费进度保存在 Flink Checkpoint 状态中。可选的 Offset 表仅用于观测已完成 Checkpoint 所覆盖的消费进度。Connector 不会在任务启动或重启时读取该表来自动恢复消费位点。

如果需要在 Doris 中查询消费进度，可以创建以下 Offset 表：

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

`source.binlog.consumer-id` 用于在 Offset 表中标识当前消费任务，同一任务重启时应保持不变，便于观测消费进度。

如果无法从 Flink Checkpoint 或 Savepoint 恢复，且从保存的 `offset_timestamp` 开始所需的变更仍完整保留，可以取出该值，填入 `source.scan.timestamp`，并将 `source.scan.mode` 设置为 `from-timestamp`，手动从该位点恢复消费。如果该时间戳已过期，请按 [Binlog 过期后的恢复](#binlog-expiration-recovery) 处理；填入已过期的时间戳无法恢复缺失变更。例如，以下时间戳仍处于保留窗口内时：

```sql
'source.scan.mode' = 'from-timestamp',
'source.scan.timestamp' = '2026-10-09 10:00:00'
```

## 配置项 {#options}

以下配置项控制增量读取。其余 Source 配置项见 [读取 Doris 数据](./read.md#options)。

| Key                         | Default Value | Required | Comment                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| source.scan.mode            | snapshot      | N        | Source 启动模式，支持 `snapshot`、`initial`、`latest` 和 `from-timestamp`                                                                               |
| source.scan.timestamp       | --            | N        | `from-timestamp` 模式的起始时间（含该时间点），格式为 `yyyy-MM-dd HH:mm:ss`。起点已过期时遵循 [变更类型](#increment-type) 中的行为，无法恢复过期变更。 |
| source.binlog.increment-type | detail       | N        | Binlog 变更类型，支持 `detail`、`min_delta` 和 `append_only`。起点过期时，`detail` / `append_only` 跳过过期变更，`min_delta` 报错。 |
| source.binlog.poll-interval | 10s           | N        | 轮询新 Binlog 数据的时间间隔，最小值为 1 秒                                                                                                           |
| source.binlog.visible-wait-timeout | 5m            | N        | Doris 返回事务可见性等待超时错误后，Connector 重试同一读取区间的最长时间。设置为 `0s` 可关闭重试；不能为负值。 |
| source.binlog.offset-table  | --            | N        | 用于发布已完成 Checkpoint 所覆盖 offset 的 Doris 表，仅供观测，不用于自动恢复。格式为 `database.table`，需要同时配置 `source.binlog.consumer-id` 和 `jdbc-url`。 |
| source.binlog.consumer-id   | --            | N        | 写入 `source.binlog.offset-table` 的稳定消费者标识                                                                                                    |
