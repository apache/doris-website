---
{
    "title": "性能",
    "language": "zh_CN"
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

本文档中的性能数据基于默认配置，如果您面临高网络延迟或高吞吐量写入场景，可以参考[操作手册](manual.md)进行优化。

## 测试数据集
- **数据集**：TPC-H 1T

## 测试集群配置

| 配置项   | 上游配置                              | 下游配置                              |
|----------|--------------------------------------|--------------------------------------|
| FE       | 2 核 16 GB                          | 2 核 16 GB                          |
| BE       | 3 个节点，16 核 64 GB，每节点 3*500 GB | 3 个节点，16 核 64 GB，每节点 3*500 GB |

---

## 增量同步性能测试

### 测试步骤

1. 在上游集群创建 TPC-H 1T 的库表信息。
2. 创建 TPC-H 1T 数据库的同步任务。
3. 等待 TPC-H 1T 数据导入完成，记录完成时间。
4. 等待下游数据同步完成，记录完成时间。

### 测试结论
增量同步时间差：33 秒。

---

## 全量同步性能测试

### 测试步骤
1. 在上游集群创建 TPC-H 1T 的库表信息并完成数据导入，记录完成时间。
2. 创建 TPC-H 1T 数据库的同步任务。
3. 等待下游数据同步完成，记录完成时间。

### 测试结论
全量同步时间差：6 分 1 秒。

---

## Flink 同步性能测试

### 测试步骤
1. 上游使用 Flink 导入方式导入 100,000,000 条数据。
2. 创建库表的同步任务。
3. 在每个阶段观察下游同步完成时间与上游导入完成时间的差异（例如：1,000,000 条、2,000,000 条等）。
4. 记录上游最后一次导入完成时间。
5. 记录下游同步完成时间为。

### 测试结论
每个阶段的 **lag 时间** 均保持在 `5 秒内`。

