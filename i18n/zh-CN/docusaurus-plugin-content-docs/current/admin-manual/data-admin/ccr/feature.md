---
{
    "title": "功能详情",
    "language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, version 2.0 (the
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

`-` 表示 Doris 2.0 及以上版本，CCR 所有版本。建议使用 Doris 使用 2.0.15 或者 2.1.6 或者更新的版本。

## 库

### 库属性

库级别任务在 Full Sync 时会同步库的属性。

| 属性                   | 是否支持 | Doris version | CCR version | 同步方式  | 说明 |
| ---------------------- | -------- | ------------- | ----------- | --------- | ---- |
| replication_allocation | 支持     | -             | -           | FULL SYNC |      |
| data quota             | 不支持   |               |             |           |      |
| replica quota          | 不支持   |               |             |           |      |

### 修改库属性

CCR 任务不同步修改库属性操作。

| 属性                   | 是否支持 | 上游是否可以操作 | 下游是否可以操作 | 说明                              |
| ---------------------- | -------- | ---------------- | ---------------- | --------------------------------- |
| replication_allocation | 不支持   | 不可以           | 不可以           | 上下游各自操作会导致 CCR 任务中断 |
| data quota             | 不支持   | 可以             | 可以             |                                   |
| replica quota          | 不支持   | 可以             | 可以             |                                   |

### 重命名库

不支持对上下游做重命名，如果做了，可能导致视图不能工作。

## 表
### 表属性

| 属性                                      | 是否支持 | Doris version | CCR version | 同步方式 | 说明                                                     |
| ----------------------------------------- | -------- | ------------- | ----------- | -------- | -------------------------------------------------------- |
| 表模型（duplicate，unique，aggregate）          | 支持     | -             | -           | SQL      |                                                          |
| 分区分桶                                  | 支持     | -             | -           | SQL      |                                                          |
| replication_num                           | 支持     | -             | -           | SQL      |                                                          |
| replication_allocation （resource group） | 支持     | -             | -           | SQL      | 上游必须与下游一致，BE tag 必须一致，否则 CCR 任务会失败 |
| colocate_with                             | 不支持   |               |             |          |                                                          |
| storage_policy                            | 不支持   |               |             |          |                                                          |
| dynamic_partition                         | 支持     | -             | -           | SQL      |                                                          |
| storage_medium                            | 支持     | -             | -           | SQL      |                                                          |
| auto_bucket                               | 支持     | -             | -           | SQL      |                                                          |
| group_commit 系列                         | 支持     | -             | -           | SQL      |                                                          |
| enable_unique_key_merge_on_write          | 支持     | -             | -           | SQL      |                                                          |
| enable_single_replica_compaction          | 支持     | -             | -           | SQL      |                                                          |
| disable_auto_compaction                   | 支持     | -             | -           | SQL      |                                                          |
| compaction_policy                         | 支持     | -             | -           | SQL      |                                                          |
| time_series_compaction 系列               | 支持     | -             | -           | SQL      |                                                          |
| binlog 系列                               | 支持     | -             | -           | SQL      | 待确认                                                   |
| variant_enable_flatten_nested             | 支持     | -             | -           | SQL      |                                                          |
| skip_write_index_on_load                  | 支持     | -             | -           | SQL      |                                                          |
| row_strore 系列                            | 支持     | -             | -           | SQL      |                                                          |
| seq 列                                    | 支持     | -             | -           | SQL      |                                                          |
| enable_light_schema_change                | 支持     | -             | -           | SQL      |                                                          |
| compression_type                          | 支持     | -             | -           | SQL      |                                                          |
| index                                      | 支持     | -             | -           | SQL      |                                                          |
| bloom_filter_columns                      | 支持     | -             | -           | SQL      |                                                          |
| bloom_filter_fpp                          | 不支持   |               |             |          |                                                          |
| storage_cooldown_time                     | 不支持   |               |             |          |                                                          |
| generated column                          | 支持     | -            | -         | SQL      |                                                          |
| 自增 id                                   | 不支持   |               |             |          | 有问题                                               |

### 基础表操作

| 操作           | 是否支持                        | Doris version           | CCR version | 同步方式                           | 下游是否可以单独操作          | 说明                                  |
| -------------- | ------------------------------- | ----------------------- | ----------- | ---------------------------------- | ----------------------------- | ------------------------------------- |
| create table   | 支持                            | -                       | -           | SQL                                | 不支持操作 CCR 任务同步的表。 | 属性参考创建表部分                    |
| drop table     | 支持                            | -                       | -           | 2.0.15/2.1.6 前：Full Sync，之后：SQL | 同上                          |                                       |
| rename table   | 表级别任务不支持库级别任务支持 | master(2.0/2.1还不支持) |             | SQL                                | 同上                          | 表级别任务 rename 会导致 CCR 任务停止 |
| replace table  | 不支持                          |                         |             |                                    | 同上                          |                                       |
| truncate table | 支持                            | -                       |             | SQL                                | 同上                          |                                       |
| restore table  | 未知                            |                         |             |                                    | 同上                          |                                       |

### 修改表属性

同步方式为 SQL。

| 属性                       | 是否支持 | Doris version | CCR version | 上游是否可以操作 | 下游是否可以操作                           | 说明                                    |
| -------------------------- | -------- | ------------- | ----------- | ---------------- | ------------------------------------------ | --------------------------------------- |
| colocate                   | 不支持   |               |             | 可以             | 不可以，触发full sync 下游操作会丢失       |                                         |
| distribution type          | 不支持   |               |             | 不可以           | 同上                                       |                                         |
| dynamic partition          | 不支持   |               |             | 可以             | 同上                                       |                                         |
| replication_num            | 不支持   |               |             | 不可以           | 不可以                                     |                                         |
| replication_allocation     | 不支持   |               |             | 不可以           |                                            |                                         |
| storage policy             | 不支持   |               |             | 不可以           | 不可以                                     |                                         |
| enable_light_schema_change | 不支持   |               |             |                  |                                            | CCR 只能同步轻量级 schema change 的表。 |
| row_store                  | 未知     |               |             |                  |                                            |                                         |
| bloom_filter_columns       | 未知     |               |             |                  |                                            |                                         |
| bucket num                 | 不支持   |               |             | 可以             | 不可以，触发full sync 下游操作会丢失       |                                         |
| isBeingSyced               | 不支持   |               |             | 不可以           | 不可以                                     |                                         |
| compaction 系列属性        | 不支持   |               |             | 可以             | 不可以，触发full sync 下游操作会丢失不可以 |                                         |
| skip_write_index_on_load   | 不支持   |               |             | 可以             | 同上                                       |                                         |
| seq 列                     | 支持     | -             | -           | 可以             | 不可以，触发full sync 下游操作会丢失不可以 |                                         |
| delete sign 列             | 支持     | -             | -           | 可以             | 同上                                       |                                         |
| comment                    | 不支持   |               |             | 可以             | 不可以，触发full sync 下游操作会丢失不可以 |                                         |

### 列操作

表中 Base Index 上的列操作。

| 操作          | 是否支持 | Doris version | CCR version | 同步方式                | 下游是否可以操作            | 备注                            |
| ------------- | -------- | ------------- | ----------- | ----------------------- | --------------------------- | ------------------------------- |
| add key column    | 支持     | -             | -           | 库级别任务 Partial Sync, 表级别任务 Partial Sync           | 不可以，会导致 CCR 任务中断 |                                 |
| add value column    | 支持     | -             | -           | SQL           | 不可以，会导致 CCR 任务中断 |                                 |
| drop key column   | 支持     | -             | -           | 库级别任务 Partial Sync, 表级别任务 Partial Sync                         | 同上                        |                                 |
| drop value column   | 支持     | -             | -           | SQL                     | 同上                        |                                 |
| modify column | 支持     | -             | -           | Full Sync / Partial Sync | 同上                        | 在开始前会尝试删除下游的表 |
| order by      | 支持     | -             | -           | Full Sync / Partial Sync | 同上                        | 在开始前会尝试删除下游的表 |
| rename        |          |               |             |                         | 同上                        |                                 |
| comment       | 不支持   |               |             |                         | 同上                        |                                 |


表中 Rollup Index 上的列操作。

| 操作          | 是否支持 | 备注              |
| ------------- | -------- | ----------------- |
| add column    | 未知     | 导致 CCR 任务中断 |
| drop column   | 未知     | 同上              |
| modify column | 未知    | 同上              |
| order by      | 未知   | 同上              |


### Rollup

| 操作          | 是否支持 | 备注         |
| ------------- | -------- | ------------ |
| add rollup    | 不支持   |              |
| drop rollup   | 不支持   |              |
| rename rollup | 不支持   | CCR 任务中断 |

### 索引


Inverted Index

| 操作         | 是否支持             | 备注     |
| ------------ | -------------------- | -------- |
| create index | 不支持               | 影响未知 |
| drop index   | 未知                 | 影响未知 |


Bloom Filter

| 操作         | 是否支持             | 备注     |
| ------------ | -------------------- | -------- |
| add bloom filter | 不支持            | 影响未知   |
| alter bloom filter | 不支持          | 影响未知   |
| drop bloom filter   | 不支持         | 影响未知   |

## 数据

### 导入

| 导入方式     | 是否支持             | Doris version | CCR version | 同步方式 | 下游是否可以操作                                             | 说明                                                 |
| ------------ | -------------------- | ------------- | ----------- | -------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| stream load  | 支持（临时分区除外） | -             | -           | TXN      | 不可以，如果下游导入了，后续触发full或者Partial Sync，下游导入的数据会丢失 | 上游事务可见，即数据可见时生成binlog，下游开始同步。 |
| broker load  | 支持（临时分区除外） | -             | -           | TXN      | 同上                                                         | 同上                                                 |
| routine load | 支持（临时分区除外） | -             | -           | TXN      | 同上                                                         | 同上                                                 |
| mysql load   | 支持（临时分区除外） | -             | -           | TXN      | 同上                                                         | 同上                                                 |
| group commit | 支持（临时分区除外） | 2.1           | 2.1         | TXN      | 同上                                                         | 同上                                                 |

### 数据操作

| 操作                      | 是否支持             | Doris version | CCR version | 同步方式     | 下游是否可以操作                                             | 说明                                                 |
| ------------------------- | -------------------- | ------------- | ----------- | ------------ | ------------------------------------------------------------ | ---------------------------------------------------- |
| delete                    | 支持                 | -             | -           | TXN          | 不可以，如果下游操作，后续触发full或者Partial Sync，下游操作会丢失 | 上游事务可见，即数据可见时生成binlog，下游开始同步。 |
| update                    | 支持                 | -             | -           | TXN          | 同上                                                         | 同上                                                 |
| insert                    | 支持                 | -             | -           | TXN          | 同上                                                         | 同上                                                 |
| insert into overwrite     | 支持（临时分区除外） | 2.1.6         |             | Partial Sync | 同上                                                         | 同上                                                 |
| insert into overwrite     | 支持（临时分区除外） | 2.0           |             | full sync    | 同上                                                         | 同上                                                 |
| 显式事务(3.0)begin commit | 不支持               |               |             |              |                                                              |                                                      |

## 分区操作

| 操作               | 是否支持                        | Doris version | CCR version |        同步方式            | 下游是否可以单独操作                                        | 说明                                                         |
| ------------------ | ------------------------------- | ------------- | ----------- | ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| add partition      | 支持                            | -             | -           | SQL                                | 不能，后续触发Full Sync 或者 Partial Sync 会导致下游操作丢失 | cooldown time 属性及其行为未知                               |
| add temp partition | 不支持                          |               |             |                                    | 同上                                                        |                                                              |
| drop partition     | 支持                            | -             | -           | 2.0.15/2.1.6 前：Full Sync之后：SQL | 同上                                                        |                                                              |
| replace partition  | 支持                            |               |             | Partial Sync                       | 同上                                                        | Partial Sync **只支持 strict range 和 non-tmp partition 的 replace 方式**，否则会触发 Full Sync。 |
| modify partition   | 不支持                          | 未发版本      | 未发版本    | SQL                                | 同上                                                        |  |
| rename partition   | 表级别任务不支持库级别任务支持 | 未发版本      | 未发版本    | SQL                                | 同上                                                        | 表级别任务 rename 会导致 CCR 任务停止                        |

## 视图

| 操作        | 是否支持 | Doris version | CCR version | 同步方式 | 备注                             |
| ----------- | -------- | ------------- | ----------- | -------- | -------------------------------- |
| create view | 支持     | -             | -           | SQL      | 上下游同名时可以工作。 |
| alter view  | 不支持   |               |             |          | 没有binlog                       |
| drop view   | 不支持   |               |             |          |                                  |


## 物化视图

同步物化视图

| 操作                     | 是否支持 | 备注                                                         |
| ------------------------ | -------- | ------------------------------------------------------------ |
| create materialized view | 未知     | 上下游同名时可以工作，不同名时需要下游手动重建 view。 |
| drop materialized view   | 未知     |                                                              |


异步物化视图

| 操作                           | 是否支持 |
| ------------------------------ | -------- |
| create async materialized view | 不支持   |
| alter async materialized view  | 不支持   |
| drop async materialized view   | 不支持   |
| refresh                        | 不支持   |
| pause                          | 不支持   |
| resume                         | 不支持   |


## 统计信息

上下游之间不同步，独立工作。

## 其它

| 操作             | 是否支持 |
| ---------------- | -------- |
| external table   | 不支持   |
| recycle bin      | 不支持   |
| catalog          | 不支持   |
| workload group   | 不支持   |
| job              | 不支持   |
| function         | 不支持   |
| policy           | 不支持   |
| user             | 不支持   |
| cancel alter job | 支持     |