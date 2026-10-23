---
{
    "title": "增量读取 Doris Changelog",
    "language": "zh-CN",
    "description": "使用 Flink Doris Connector 持续读取开启 Changelog 的 Doris 表的行级变更：启动模式、变更类型、交付语义、消费进度表和相关配置项。"
}
---

# 增量读取 Doris Changelog

对于开启了 Changelog（`"changelog.enable" = "true"`）的 Doris 表，Flink Doris Connector 可以持续读取行级数据变更。首次消费时，`initial` 模式会先读取当前表快照，再切换到增量变更读取。切换所需的变更必须仍处于源表的 Changelog 保留窗口内。

:::info 版本要求
该功能需要 Flink Doris Connector 26.4.0 及以上、Doris 5.0.0 及以上版本。Doris Changelog 是 Doris 5.0.0 的实验性功能，需要在 FE 配置中开启 `enable_feature_changelog = true`；表上如何开启、支持的表模型和限制见 [Changelog](../../../data-operate/incremental/changelog.md)。
:::

## 使用示例 {#example}

首先，在创建 Doris 源表时开启 Changelog。如果消费端需要更新前的行数据，还需要开启 `changelog.need_historical_value`：

```sql
CREATE DATABASE IF NOT EXISTS test;

CREATE TABLE test.student_changelog_source (
    id INT,
    name VARCHAR(50),
    age INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true",
    "changelog.ttl_seconds" = "86400"
);

INSERT INTO test.student_changelog_source VALUES (1, 'Alice', 18);
```

然后启用 Flink Checkpoint 并创建 Doris Source 表：

```sql
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE student_changelog (
    id INT,
    name STRING,
    age INT,
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student_changelog_source',
    'username' = 'root',
    'password' = '',
    'source.scan.mode' = 'initial'
);

SELECT * FROM student_changelog;
```

## 启动模式 {#scan-mode}

任务启动后，对 `test.student_changelog_source` 的修改会以 Flink Changelog 形式持续输出。通过 `source.scan.mode` 选择首次消费的启动模式：

| 模式 | 行为 |
| ---- | ---- |
| `snapshot` | 读取当前快照后结束，为默认模式。 |
| `initial` | 先读取当前快照，快照读取完成后切换到持续读取 Doris Changelog。 |
| `latest` | 跳过快照，只读取任务启动后产生的变更。 |
| `from-timestamp` | 跳过快照，从 `source.scan.timestamp` 指定的时间点开始读取变更（包含该时间点），时间格式为 `yyyy-MM-dd HH:mm:ss`。 |

恢复任务时，已保存的消费进度优先于启动模式，具体规则见 [将消费进度写入 Doris](#offset-table)。恢复的位点和 `from-timestamp` 起点均受源表 `changelog.ttl_seconds` 限制，过期后的行为见下文。

## 变更类型 {#increment-type}

默认以 `detail` 类型输出完整的行变更。也可以通过 `source.changelog.increment-type` 设置为 `min_delta`（最小变更集）或 `append_only`（仅追加事件）。

Connector 通过 Doris `@incr` 查询读取变更。如果请求的起点已因 `changelog.ttl_seconds` 过期，不同变更类型的行为如下：

| 变更类型 | 起点已过期时的行为 |
| ---- | ---- |
| `detail`（默认）、`append_only` | Doris 将实际起点推进到第一个仍保留的 TSO，跳过过期变更。任务可能不报过期错误并继续运行，但输出中会缺失这些变更。 |
| `min_delta` | 读取报 `Changelog offset has expired according to changelog.ttl_seconds`，避免返回不完整的净变化。 |

这些规则适用于正常消费、首次快照后的增量读取，以及从保存状态恢复的读取。任务持续运行或 Checkpoint 成功，并不能证明没有变更过期。`source.changelog.visible-wait-timeout` 不会对过期错误进行重试。

## 注意事项

- 增量读取使用 Arrow Flight SQL，Connector 默认启用并自动获取端口。
- 需要启用 Flink Checkpoint。
- Doris `changelog.ttl_seconds` 默认值为 `86400` 秒（一天），必须大于 `0`。过期机制不会等待 Flink 任务或其 Checkpoint；延长 TTL 无法恢复已被物理清理的记录。
- TTL 应覆盖首次快照耗时、消费积压，以及故障恢复和追赶进度所需的时间，并预留余量。请监控任务仍需读取的最早变更的年龄，从较早的 Checkpoint 或 Savepoint 恢复时也需考虑这一点。
- 如需自动物理清理，BE 也需开启 `enable_feature_changelog = true`，且自动 compaction 未被关闭。物理清理完成前，增量查询也会过滤过期记录，见 [Changelog 保留与清理](../../../data-operate/incremental/changelog.md#保留与清理)。
- 执行增量读取时，如果读取区间内存在影响源表的未完成事务，Doris 会等待这些事务完成。若等待超时，本次读取会报错。Connector 仅针对该错误重试同一读取区间，重试时长由 `source.changelog.visible-wait-timeout` 控制（默认 `5m`）；设置为 `0s` 可关闭 Connector 重试，其他错误会立即失败。

### Changelog 过期后的恢复 {#changelog-expiration-recovery}

如果所需变更已过期，原位点无法提供完整的增量恢复。对于需要保证下游数据与源表当前状态一致的任务，应以 `source.scan.mode = 'initial'` 重新执行初始化，不恢复已过期的 Checkpoint 或 Savepoint，并通过新快照重建下游数据。如果配置了 Offset 表，还需使用一个没有历史记录的新 `source.changelog.consumer-id`，或同时移除 `source.changelog.offset-table` 和 `source.changelog.consumer-id`。否则，旧 Flink 状态或外部位点仍会优先于 `initial`，不会重新读取全量快照。

新快照可以重建表的当前状态，但无法重现已过期的历史事件。使用 `latest` 或较新的 `from-timestamp` 启动也会跳过缺失区间；仅在允许跳过该区间，或已通过其他方式补齐缺失数据时使用。

## 交付语义与去重 {#delivery}

在所需变更记录仍完整保留于 Doris 的前提下，Doris Source 的增量读取提供至少一次交付。任务故障恢复后可能重放变更事件，影响 Flink 查询结果。Flink 的 CDC 事件去重配置默认关闭；如需启用，可在提交查询前设置：

```sql
SET 'table.exec.source.cdc-events-duplicate' = 'true';
```

启用该配置时，源表必须像上面的示例一样声明主键。Flink 会增加一个有状态算子来规范化变更流。详情参见 [Flink 配置文档](https://nightlies.apache.org/flink/flink-docs-release-2.3/zh/docs/dev/table/config/#table-exec-source-cdc-events-duplicate)。

Checkpoint 保存消费状态，CDC 去重处理重放的事件；两者都不会阻止 Doris Changelog 过期，也无法恢复因过期而丢失的事件。

## 将消费进度写入 Doris（可选） {#offset-table}

可通过 Offset 表在 Doris 中保存、查询消费进度，并在未从 Checkpoint 或 Savepoint 恢复任务时自动续读。

提交任务前，先创建以下 Offset 表。通过 `username` 和 `password` 配置的 Doris 账号需要对该表具有 `SELECT` 和 `INSERT` 权限：

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

保持 Flink Checkpoint 开启，并在上方示例的 Source 表 `WITH` 子句中添加以下配置：

```sql
'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
'source.changelog.offset-table' = 'ops.flink_source_offsets',
'source.changelog.consumer-id' = 'student-sync'
```

同一任务重启时保持 Offset 表和 `source.changelog.consumer-id` 不变；不同任务或源表使用不同 ID，避免覆盖消费进度。

`offset_timestamp` 是下次增量读取的起点（包含该时间点）。Connector 在 Checkpoint 成功后异步保存该 Checkpoint 所覆盖的消费进度，写入失败会重试。保存的进度可能滞后，恢复后可能重复读取部分数据。

进度写入后，可以在 Doris 中查询：

```sql
SELECT consumer_id, offset_timestamp
FROM ops.flink_source_offsets
WHERE consumer_id = 'student-sync';
```

示例结果：

```text
+--------------+---------------------+
| consumer_id  | offset_timestamp    |
+--------------+---------------------+
| student-sync | 2026-10-09 10:00:00 |
+--------------+---------------------+
```

按以下顺序确定消费起点，使用首个满足条件的规则：

| 条件 | 行为 |
| ---- | ---- |
| 从 Checkpoint 或 Savepoint 恢复任务 | 使用其中保存的消费状态。 |
| Offset 表中有当前 `consumer-id` 的记录 | 从 `offset_timestamp` 续读，忽略启动模式指定的起点，`initial` 也会跳过快照。 |
| 未配置 Offset 表，或没有当前消费者的记录 | 按 `source.scan.mode` 启动。 |

已配置的 Offset 表不存在、无法读取，或消费者记录重复、时间戳非法时，任务启动失败，不会回退到启动模式。

Offset 表只保存消费起点，不包含 Flink 下游算子或 Sink 的状态；如需恢复这些状态，应使用 Checkpoint 或 Savepoint。位点过期后的处理见 [Changelog 过期后的恢复](#changelog-expiration-recovery)。

## 配置项 {#options}

以下配置项控制增量读取。其余 Source 配置项见 [读取 Doris 数据](./read.md#options)。

| Key                         | Default Value | Required | Comment                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| source.scan.mode            | snapshot      | N        | Source 启动模式，支持 `snapshot`、`initial`、`latest` 和 `from-timestamp`                                                                               |
| source.scan.timestamp       | --            | N        | `from-timestamp` 模式必填，格式为 `yyyy-MM-dd HH:mm:ss`，包含该时间点。已有消费进度优先于该配置，见 [恢复规则](#offset-table)。 |
| source.changelog.increment-type | detail    | N        | 变更类型，支持 `detail`、`min_delta` 和 `append_only`。起点过期时，`detail` / `append_only` 跳过过期变更，`min_delta` 报错。 |
| source.changelog.poll-interval | 10s        | N        | 轮询新变更的时间间隔，最小值为 1 秒                                                                                                                   |
| source.changelog.visible-wait-timeout | 5m         | N        | Doris 返回事务可见性等待超时错误后，Connector 重试同一读取区间的最长时间。设置为 `0s` 可关闭重试；不能为负值。 |
| source.changelog.offset-table  | --         | N        | 保存消费进度并用于续读的 Doris 表，需提前创建，格式为 `database.table`。需同时配置 `source.changelog.consumer-id` 和 `jdbc-url`，仅支持增量模式。 |
| source.changelog.consumer-id   | --         | N        | Offset 表中消费任务的唯一标识，同一任务重启时保持不变。 |
