---
{
    "title": "常见问题",
    "language": "zh-CN",
    "description": "使用 Flink Doris Connector 时的常见报错和问题：label 重复、事务过期、并发事务超限、脏数据、307 重定向等。"
}
---

# 常见问题

写入相关的报错大多与写入模式和两阶段提交有关，建议先阅读 [写入模式](./write.md#write-modes)。

**1. errCode = 2, detailMessage = Label [label_0_1] has already been used, relate to txn [19650]**

Exactly-Once 场景下，Flink Job 重启时必须从最新的 Checkpoint/Savepoint 启动，否则会报如上错误。不要求 Exactly-Once 时，也可通过关闭 2PC 提交（`sink.enable-2pc=false`）或更换不同的 `sink.label-prefix` 解决。

**2. errCode = 2, detailMessage = transaction [19650] not found**

发生在 Commit 阶段，Checkpoint 中记录的事务 ID 在 FE 侧已经过期，此时再次 commit 就会出现上述错误。此时无法从 Checkpoint 启动，可通过修改 `fe.conf` 的 `streaming_label_keep_max_second` 配置来延长过期时间，默认 12 小时。Doris 2.0 版本后还会受到 `fe.conf` 中 `label_num_threshold` 配置的限制（默认 2000），可以调大或者改为 -1（-1 表示只受时间限制）。

**3. errCode = 2, detailMessage = current running txns on db 10006 is 100, larger than limit 100**

这是因为同一个库并发导入超过了 100，可通过调整 `fe.conf` 的参数 `max_running_txn_num_per_db` 来解决，具体可参考 [max_running_txn_num_per_db](../../../admin-manual/config/fe-config.md#max_running_txn_num_per_db)。同时，一个任务频繁修改 label 重启也可能会导致这个错误。2pc 场景下（Duplicate/Aggregate 模型），每个任务的 label 需要唯一，并且从 Checkpoint 重启时，Flink 任务才会主动 abort 掉之前已经 precommit 成功、没有 commit 的 txn。频繁修改 label 重启会导致大量 precommit 成功的 txn 无法被 abort，占用事务。在 Unique 模型下也可关闭 2pc，可以实现幂等写入。

**4. tablet writer write failed, tablet_id=190958, txn_id=3505530, err=-235**

通常发生在 Connector 1.1.0 之前，是由于写入频率过快，导致版本过多。可以通过设置 `sink.batch.size` 和 `sink.batch.interval` 参数来降低 Stream Load 的频率。在 Connector 1.1.0 之后，默认写入时机由 Checkpoint 控制，可以通过增加 Checkpoint 间隔来降低写入频率。

**5. Flink 导入有脏数据，如何跳过？**

Flink 在数据导入时，如果有脏数据（如字段格式、长度等问题），会导致 Stream Load 报错，此时 Flink 会不断地重试。如果需要跳过，可以通过禁用 Stream Load 的严格模式（`strict_mode=false`、`max_filter_ratio=1`）或者在 Sink 算子之前对数据做过滤。

**6. Flink 机器与 BE 机器的网络不通，如何配置？**

Flink 向 Doris 发起写入时，Doris 会重定向到 BE 进行写入，此时返回的地址是 BE 的内网 IP（即通过 `show backends` 看到的 IP），此时 Flink 与 Doris 网络不通会报错。这时可以在 `benodes` 中配置 BE 的外网 IP 即可。

**7. stream load error: HTTP/1.1 307 Temporary Redirect**

Flink 会先向 FE 请求，收到 307 后会向重定向后的 BE 请求。当 FE 在 FullGC、压力大或网络延迟时，HttpClient 默认会在一定时间（3 秒）没有等到响应会发送数据，由于默认情况下请求体是 InputStream，当收到 307 响应时，数据无法重放，会直接报错。有三种方式可以解决：

1. 升级到 Connector 25.1.0 以上，调长了默认时间。
2. 修改 `auto-redirect=false`，直接向 BE 发起请求（不适用部分云上场景）。
3. 主键模型可以开启攒批模式。
