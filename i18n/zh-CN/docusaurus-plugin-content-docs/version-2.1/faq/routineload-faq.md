---
{
    "title": "Routine Load 常见问题",
    "language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Routine Load 常见问题

本文档记录了 Doris 在使用过程中与 Routine Load 相关的常见问题、Bug 修复及优化改进，并将不定期更新。

## 较严重的 Bug 修复

| 问题描述                                                   | 发生条件                                   | 影响范围         | 临时解决方案                                               | 受影响版本      | 修复版本    | 修复 PR                                                     |
| ---------------------------------------------------------- | ------------------------------------------ | ---------------- | ---------------------------------------------------------- | ------------- | ----------- | ---------------------------------------------------------- |
| 当至少一个 Job 连接 Kafka 时发生超时，会影响其他 Job 的导入速度，导致全局 Routine Load 导入变慢 | 存在至少一个 Job 连接 Kafka 时发生超时     | 存算分离存算一体 | 通过停止或手动暂停该 Job 来解决。                          | <2.1.9 <3.0.5 | 2.1.9 3.0.5 | [#47530](https://github.com/apache/doris/pull/47530)       |
| 重启 FE Master 后，用户数据可能丢失                       | Job 设置的 Offset 为 OFFSET_END，重启 FE   | 存算分离         | 将消费模式更改为 OFFSET_BEGINNING。                        | 3.0.2-3.0.4   | 3.0.5       | [#46149](https://github.com/apache/doris/pull/46149)       |
| 导入过程中产生大量小事务，导致 Compaction 无法及时完成，并持续报 -235 错误。 | Doris 消费速度过快，或 Kafka 数据流量呈小批量趋势 | 存算分离存算一体 | 暂停 Routine Load Job，并执行以下命令：`ALTER ROUTINE LOAD FOR jobname FROM kafka ("property.enable.partition.eof" = "false");` | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#45528](https://github.com/apache/doris/pull/45528), [#44949](https://github.com/apache/doris/pull/44949), [#39975](https://github.com/apache/doris/pull/39975) |
| Kafka 第三方库析构卡住，导致无法正常消费数据。             | Kafka 删除 Topic（可能不止此条件）         | 存算分离存算一体 | 重启所有 BE 节点。                                         | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#44913](https://github.com/apache/doris/pull/44913)       |
| Routine Load 调度卡住                                      | 当 FE 向 Meta Service 中止事务时发生超时   | 存算分离         | 重启 FE 节点。                                             | <3.0.2        | 3.0.2       | [#41267](https://github.com/apache/doris/pull/41267)       |
| Routine Load 重启问题                                      | 重启 BE 节点                               | 存算分离存算一体 | 手动恢复 Job。                                             | <2.1.7 <3.0.2 | 2.1.7 3.0.2 | [#3727](https://github.com/selectdb/selectdb-core/pull/3727) |

## 默认配置优化

| 优化内容                                 | 合入版本   | 对应 PR                                                     |
| ---------------------------------------- | ---------- | ---------------------------------------------------------- |
| 增加了 Routine Load 的超时时间           | 2.1.7 3.0.3 | [#42042](https://github.com/apache/doris/pull/42042), [#40818](https://github.com/apache/doris/pull/40818) |
| 调整了 max_batch_interval 的默认值       | 2.1.8 3.0.3 | [#42491](https://github.com/apache/doris/pull/42491)       |
| 移除了 max_batch_interval 的限制         | 2.1.5 3.0.0 | [#29071](https://github.com/apache/doris/pull/29071)       |
| 调整了 max_batch_rows 和 max_batch_size 的默认值 | 2.1.5 3.0.0 | [#36632](https://github.com/apache/doris/pull/36632)       |

## 可观测优化

| 优化内容                | 合入版本 | 对应 PR                                                     |
| ----------------------- | -------- | ---------------------------------------------------------- |
| 增加了可观测性相关的 Metrics 指标 | 3.0.5    | [#48209](https://github.com/apache/doris/pull/48209), [#48171](https://github.com/apache/doris/pull/48171), [#48963](https://github.com/apache/doris/pull/48963) |
