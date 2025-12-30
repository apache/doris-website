---
{
    "title": "常见导入问题",
    "language": "zh-CN",
    "description": "问题描述：导入报数据质量错误。"
}
---

## 导入通用问题

### 报错"[DATA_QUALITY_ERROR] Encountered unqualified data"
**问题描述**：导入报数据质量错误。

**解决方案**：
- Stream Load 和 Insert Into 结果中会返回错误 URL，Broker Load 可通过 `Show Load` 命令查看对应错误 URL。
- 通过浏览器或 curl 命令访问错误 URL 查看具体的数量质量错误原因。
- 通过 strict_mode 和 max_filter_ratio 参数项来控制能容忍的错误率。

### 报错"[E-235] Failed to init rowset builder"
**问题描述**：-235 错误是因为导入频率过高，数据未能及时 compaction，超过版本限制。

**解决方案**：
- 增加每批次导入数据量，降低导入频率。
- 在 `be.conf` 中调大 `max_tablet_version_num` 参数, 建议不超过5000。

### 报错"[E-238] Too many segments in rowset"
**问题描述**：-238 错误是因为单个 rowset 下的 segment 数量超限。

**常见原因**：
- 建表时 bucket 数配置过小。
- 数据出现倾斜，建议使用更均衡的分桶键。

### 报错"Transaction commit successfully, BUT data will be visible later"
**问题描述**：数据导入成功但暂时不可见。

**原因**：通常是由于系统资源压力导致事务 publish 延迟。

### 报错"Failed to commit kv txn [...] Transaction exceeds byte limit"
**问题描述**：存算分离模式下，单次导入涉及的 partition 和 tablet 过多, 超过事务大小的限制。

**解决方案**：
- 分批按 partition 导入数据, 减小单次导入涉及到的 partition 数量。
- 优化表结构减少 partition 和 tablet 数量。

### CSV 文件最后一列出现额外的 "\r"
**问题描述**：通常是 windows 换行符导致。

**解决方案**：
指定正确的换行符：`-H "line_delimiter:\r\n"`

### CSV 带引号数据导入为 null
**问题描述**：带引号的 CSV 数据导入后值变为 null。

**解决方案**：
使用 `trim_double_quotes` 参数去除字段外层双引号。

## Stream Load

### 导入慢的原因
- CPU、IO、内存、网卡资源有瓶颈。
- 客户端机器到 BE 机器网络慢, 通过客户端机器到 BE 机器的 Ping 时延可以做初步的判断。
- Webserver 线程数瓶颈，单 BE 上 Stream Load 并发数太高(超过be.conf webserver_num_workers 配置)可能导致线程数据瓶颈。
- Memtable Flush 线程数瓶颈，通过 BE metrics 查看 doris_be_flush_thread_pool_queue_size 看排队是否比较严重。可以适当调大 be.conf flush_thread_num_per_store 参数来解决。

### 特殊字符列名处理
列名中含有特殊字符时需要使用单引号配合反引号方式指定 columns 参数：
```shell
curl --location-trusted -u root:"" \
    -H 'columns:`@coltime`,colint,colvar' \
    -T a.csv \
    -H "column_separator:," \
    http://127.0.0.1:8030/api/db/loadtest/_stream_load
```

## Routine Load 

### 较严重的 Bug 修复

| 问题描述                                                   | 发生条件                                   | 影响范围         | 临时解决方案                                               | 受影响版本      | 修复版本    | 修复 PR                                                     |
| ---------------------------------------------------------- | ------------------------------------------ | ---------------- | ---------------------------------------------------------- | ------------- | ----------- | ---------------------------------------------------------- |
| 当至少一个 Job 连接 Kafka 时发生超时，会影响其他 Job 的导入速度，导致全局 Routine Load 导入变慢 | 存在至少一个 Job 连接 Kafka 时发生超时     | 存算分离存算一体 | 通过停止或手动暂停该 Job 来解决。                          | <2.1.9 <3.0.5 | 2.1.9 3.0.5 | [#47530](https://github.com/apache/doris/pull/47530)       |
| 重启 FE Master 后，用户数据可能丢失                       | Job 设置的 Offset 为 OFFSET_END，重启 FE   | 存算分离         | 将消费模式更改为 OFFSET_BEGINNING。                        | 3.0.2-3.0.4   | 3.0.5       | [#46149](https://github.com/apache/doris/pull/46149)       |
| 导入过程中产生大量小事务，导致 Compaction 无法及时完成，并持续报 -235 错误。 | Doris 消费速度过快，或 Kafka 数据流量呈小批量趋势 | 存算分离存算一体 | 暂停 Routine Load Job，并执行以下命令：`ALTER ROUTINE LOAD FOR jobname FROM kafka ("property.enable.partition.eof" = "false");` | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#45528](https://github.com/apache/doris/pull/45528), [#44949](https://github.com/apache/doris/pull/44949), [#39975](https://github.com/apache/doris/pull/39975) |
| Kafka 第三方库析构卡住，导致无法正常消费数据。             | Kafka 删除 Topic（可能不止此条件）         | 存算分离存算一体 | 重启所有 BE 节点。                                         | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#44913](https://github.com/apache/doris/pull/44913)       |
| Routine Load 调度卡住                                      | 当 FE 向 Meta Service 中止事务时发生超时   | 存算分离         | 重启 FE 节点。                                             | <3.0.2        | 3.0.2       | [#41267](https://github.com/apache/doris/pull/41267)       |
| Routine Load 重启问题                                      | 重启 BE 节点                               | 存算分离存算一体 | 手动恢复 Job。                                             | <2.1.7 <3.0.2 | 2.1.7 3.0.2 | [#3727](https://github.com/apache/doris/pull/40728) |

### 默认配置优化

| 优化内容                                 | 合入版本   | 对应 PR                                                     |
| ---------------------------------------- | ---------- | ---------------------------------------------------------- |
| 增加了 Routine Load 的超时时间           | 2.1.7 3.0.3 | [#42042](https://github.com/apache/doris/pull/42042), [#40818](https://github.com/apache/doris/pull/40818) |
| 调整了 max_batch_interval 的默认值       | 2.1.8 3.0.3 | [#42491](https://github.com/apache/doris/pull/42491)       |
| 移除了 max_batch_interval 的限制         | 2.1.5 3.0.0 | [#29071](https://github.com/apache/doris/pull/29071)       |
| 调整了 max_batch_rows 和 max_batch_size 的默认值 | 2.1.5 3.0.0 | [#36632](https://github.com/apache/doris/pull/36632)       |

### 可观测优化

| 优化内容                | 合入版本 | 对应 PR                                                     |
| ----------------------- | -------- | ---------------------------------------------------------- |
| 增加了可观测性相关的 Metrics 指标 | 3.0.5    | [#48209](https://github.com/apache/doris/pull/48209), [#48171](https://github.com/apache/doris/pull/48171), [#48963](https://github.com/apache/doris/pull/48963) |

### 报错"failed to get latest offset"
**问题描述**：Routine Load 无法获取 Kafka 最新的 Offset。

**常见原因**：
- 一般都是到kafka的网络不通, ping或者telnet kafka的域名确认下
- 三方库的bug导致的获取超时，错误为:java.util.concurrent.TimeoutException: Waited X seconds

### 报错"failed to get partition meta: Local:'Broker transport failure" 
**问题描述**：Routine Load 无法获取 Kafka Topic 的 Partition Meta。

**常见原因**：
- 一般都是到kafka的网络不通, ping或者telnet kafka的域名确认下
- 如果使用的是域名的方式，可以在/etc/hosts 配置域名映射

### 报错"Broker: Offset out of range"
**问题描述**：消费的 offset 在 kafka 中不存在，可能是因为该 offset 已经被 kafka 清理掉了。

**解决方案**:
- 需要重新指定 offset 进行消费，例如可以指定 offset 为 OFFSET_BEGINNING。
- 需要根据导入速度设置合理的 kafka log清理参数：log.retention.hours、log.retention.bytes等。
