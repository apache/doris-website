---
{
    "title": "功能详情",
    "language": "zh-CN",
    "description": "Doris 中的跨集群复制 (CCR) 功能，主要用于在多个集群之间高效同步数据，从而增强业务连续性和容灾能力。CCR 支持 Doris 中的多种操作，确保数据在不同集群间保持一致性。以下是 CCR 支持的主要 Doris 操作的详细情况。"
}
---

Doris 中的跨集群复制 (CCR) 功能，主要用于在多个集群之间高效同步数据，从而增强业务连续性和容灾能力。CCR 支持 Doris 中的多种操作，确保数据在不同集群间保持一致性。以下是 CCR 支持的主要 Doris 操作的详细情况。

:::note

1. Doris Version 中的 `-` 表示 Doris 2.0 及以上版本，CCR 所有版本。建议使用 Doris 使用 2.0.15 或者 2.1.6 或者更新的版本。
2. CCR Syncer 和 Doris 的版本要求：Syncer Version >= 下游 Doris Version >= 上游 Doris Version。因此升级前先升 Syncer，再升下游 Doris，最后升上游 Doris。
3. CCR 目前不支持存算分离模式。

:::

## 库

### 库属性

库级别任务在 Full Sync 时会同步库的属性。

| 属性                   | 是否支持 | Doris version | 同步方式  | 说明 |
| ---------------------- | -------- | ------------- | --------- | ---- |
| replication_allocation | 支持     | -             | Full Sync |      |
| data quota             | 不支持   |               |           |      |
| replica quota          | 不支持   |               |           |      |

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

| 属性                                      | 是否支持 | Doris version | 同步方式 | 说明                                                     |
| ----------------------------------------- | -------- | ------------- | -------- | -------------------------------------------------------- |
| 表模型（duplicate，unique，aggregate）          | 支持     | -             | SQL      |                                                          |
| 分区分桶                                  | 支持     | -             | SQL      |                                                          |
| replication_num                           | 支持     | -             | SQL      |                                                          |
| replication_allocation（resource group） | 支持     | -             | SQL      | 上游必须与下游一致，BE tag 必须一致，否则 CCR 任务会失败 |
| colocate_with                             | 不支持   |               |             |          |                                                          |
| storage_policy                            | 不支持   |               |             |          |                                                          |
| dynamic_partition                         | 支持     | -             | SQL      |                                                          |
| storage_medium                            | 支持     | -             | SQL      |                                                          |
| auto_bucket                               | 支持     | -             | SQL      |                                                          |
| group_commit 系列                         | 支持     | -             | SQL      |                                                          |
| enable_unique_key_merge_on_write          | 支持     | -             | SQL      |                                                          |
| enable_single_replica_compaction          | 支持     | -             | SQL      |                                                          |
| disable_auto_compaction                   | 支持     | -             | SQL      |                                                          |
| compaction_policy                         | 支持     | -             | SQL      |                                                          |
| time_series_compaction 系列               | 支持     | -             | SQL      |                                                          |
| binlog 系列                               | 支持     | -             | SQL      | |
| variant_enable_flatten_nested             | 支持     | -             | SQL      |                                                          |
| skip_write_index_on_load                  | 支持     | -             | SQL      |                                                          |
| row_strore 系列                            | 支持     | -             | SQL      |                                                          |
| seq 列                                    | 支持     | -             | SQL      |                                                          |
| enable_light_schema_change                | 支持     | -             | SQL      |                                                          |
| compression_type                          | 支持     | -             | SQL      |                                                          |
| index                                      | 支持     | -            | SQL      |                                                          |
| bloom_filter_columns                      | 支持     | -             | SQL      |                                                          |
| bloom_filter_fpp                          | 支持   |               |          |                                                          |
| storage_cooldown_time                     | 不支持   |               |          |                                                          |
| generated column                          | 支持     | -            | SQL      |                                                          |
| 自增 id                                   | 不支持   |               | | 有问题                                               |

### 基础表操作

| 操作 | 是否支持 | Doris version | 同步方式 | 下游是否可以单独操作 | 说明 |
| -------------- | ------------------------------- | ----------------------- | ---------------------------------- | ----------------------------- | ------------------------------------- |
| create table   | 支持 | - | SQL/Partial Sync | 不支持操作 CCR 任务同步的表。 | 属性参考创建表部分；大部分情况下使用 SQL 同步；部分操作，比如用户建表时设置了打开了某些 session variables，或建表语句中有倒排索引，则使用部分同步 |
| drop table     | 支持 | - | SQL/Full Sync | 同上 | 2.0.15/2.1.6 前：Full Sync，之后：SQL |
| rename table   | 表级别任务不支持库级别任务支持 | 2.1.8/3.0.4 | SQL | 同上 | 表级别任务 rename 会导致 CCR 任务停止 |
| replace table  | 支持 | 2.1.8/3.0.4 | SQL/Full Sync| 同上 | DB 级别使用 SQL 同步；表级别触发全量同步 |
| truncate table | 支持 | - | SQL | 同上 | |
| restore table  | 不支持 | | | 同上 | |

### 修改表属性

同步方式为 SQL。

| 属性                       | 是否支持 | Doris version | 上游是否可以操作 | 下游是否可以操作                           | 说明                                    |
| -------------------------- | -------- | ------------- | ---------------- | ------------------------------------------ | --------------------------------------- |
| colocate                   | 不支持   |               | 可以             | 不可以，触发 full sync 下游操作会丢失       |                                         |
| distribution type          | 不支持   |               | 不可以           | 同上                                       |                                         |
| dynamic partition          | 不支持   |               | 可以             | 同上                                       |                                         |
| replication_num            | 不支持   |               | 不可以           | 不可以                                     |                                         |
| replication_allocation     | 不支持   |               | 不可以           |                                            |                                         |
| storage policy             | 不支持   |               | 不可以           | 不可以                                     |                                         |
| enable_light_schema_change | 不支持   |               |                  |                                            | CCR 只能同步轻量级 schema change 的表。 |
| row_store                  | 支持     | 2.1.8/3.0.4 |                  |                                            | 通过 Partial Sync |
| bloom_filter_columns       |  支持 | 2.1.8/3.0.4 |                  |                                            | 通过 Partial Sync |
| bloom_filter_fpp       |  支持 | 2.1.8/3.0.4 |                  |                                            | 通过 Partial Sync |
| bucket num                 | 不支持   |               | 可以             | 不可以，触发 full sync 下游操作会丢失       |                                         |
| isBeingSynced               | 不支持   |               | 不可以           | 不可以                                     |                                         |
| compaction 系列属性        | 不支持   |               | 可以             | 不可以，触发 full sync 下游操作会丢失不可以 |                                         |
| skip_write_index_on_load   | 不支持   |               | 可以             | 同上                                       |                                         |
| seq 列                     | 支持     | -             | 可以             | 不可以，触发 full sync 下游操作会丢失不可以 |                                         |
| delete sign 列             | 支持     | -             | 可以             | 同上                                       |                                         |
| comment                    | 支持   | 2.1.8/3.0.4 | 可以             | 不可以，触发 full sync 下游操作会丢失不可以 |                                         |

### 列操作

表中 Base Index 上的列操作。

| 操作          | 是否支持 | Doris version | 同步方式                | 下游是否可以操作            | 备注                            |
| ------------- | -------- | ------------- | ----------------------- | --------------------------- | ------------------------------- |
| add key column    | 支持     | -             | Partial Sync           | 不可以，会导致 CCR 任务中断 |                                 |
| add value column    | 支持     | -        | SQL           | 不可以，会导致 CCR 任务中断 |                                 |
| drop key column   | 支持     | -             | Partial Sync | 同上                        |                                 |
| drop value column   | 支持     | -           | SQL                     | 同上                        |                                 |
| modify column | 支持     | -           | Partial Sync | 同上                        |  |
| order by      | 支持     | -            | Partial Sync | 同上                        | |
| rename        | 支持 | 2.1.8/3.0.4 | SQL | 同上                        |                                 |
| comment       | 支持   | 2.1.8/3.0.4 | SQL | 同上                        |                                 |

:::note

add/drop value column 要求建表时设置 property `"light_schema_change" = "true"`。

:::

表中 Rollup Index 上的列操作。

| 操作          | 是否支持 | Doris Version | 同步方式 | 备注              |
| ------------- | -------- | ------------- | ---------- | ----------------- |
| add key column    | 支持     | 2.1.8/3.0.4 | Partial Sync |  |
| add value column  | 支持     | 2.1.8/3.0.4 | SQL | 需要开启 lightning schema change |
| drop column   | 支持     | 2.1.8/3.0.4 | Partial Sync | |
| modify column | 未知     | 2.1.8/3.0.4 | Partial Sync | Doris 不支持直接修改 rollup column 类型 |
| order by      | 支持     | 2.1.8/3.0.4 | Partial sync | |

### Rollup

| 操作          | 是否支持 | Doris Version | 同步方式 | 备注         |
| ------------- | -------- | ------------- | ------- | ------------ |
| add rollup    | 支持   | 2.1.8/3.0.4 | Partial Sync | |
| drop rollup   | 支持   | 2.1.8/3.0.4 | SQL | |
| rename rollup | 支持   | 2.1.8/3.0.4 | SQL | |

### 索引

Inverted Index

| 操作         | 是否支持 | Doris Version | 同步方式 | 备注     |
| ------------ | -------- | ------------- | -------- | --------- |
| create index | 支持     | 2.1.8/3.0.4 | Partial Sync | |
| drop index   | 支持     | 2.1.8/3.0.4 | SQL | |
| build index   | 支持    | 2.1.8/3.0.4 | SQL | |

Bloom Filter

| 操作         | 是否支持 | Doris Version | 同步方式 | 备注     |
| ------------ | -------- | ------------- | -------- | --------- |
| add bloom filter | 支持 | 2.1.8/3.0.4 | Partial Sync | |
| alter bloom filter | 支持 | 2.1.8/3.0.4 | Partial Sync | 这里指修改 bloom_filter_columns |
| drop bloom filter   | 支持 | 2.1.8/3.0.4 | Partial Sync | |

## 数据

### 导入

| 导入方式     | 是否支持             | Doris version | 同步方式 | 下游是否可以操作                                             | 说明                                                 |
| ------------ | -------------------- | ------------- | -------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| stream load  | 支持（临时分区除外） | -             | TXN      | 不可以，如果下游导入了，后续触发 full 或者 Partial Sync，下游导入的数据会丢失 | 上游事务可见，即数据可见时生成 binlog，下游开始同步。 |
| broker load  | 支持（临时分区除外） | -             | TXN      | 同上                                                         | 同上                                                 |
| routine load | 支持（临时分区除外） | -             | TXN      | 同上                                                         | 同上                                                 |
| mysql load   | 支持（临时分区除外） | -             | TXN      | 同上                                                         | 同上                                                 |
| group commit | 支持（临时分区除外） | 2.1           | TXN      | 同上                                                         | 同上                                                 |

### 数据操作

| 操作                      | 是否支持             | Doris version | 同步方式     | 下游是否可以操作                                             | 说明                                                 |
| ------------------------- | -------------------- | ------------- | ------------ | ------------------------------------------------------------ | ---------------------------------------------------- |
| delete                    | 支持                 | -             | TXN          | 不可以，如果下游操作，后续触发 full 或者 Partial Sync，下游操作会丢失 | 上游事务可见，即数据可见时生成 binlog，下游开始同步。 |
| update                    | 支持                 | -             | TXN          | 同上                                                         | 同上                                                 |
| insert                    | 支持                 | -             | TXN          | 同上                                                         | 同上                                                 |
| insert into overwrite     | 支持（临时分区除外） | 2.1.6         | Partial Sync | 同上                                                         | 同上                                                 |
| insert into overwrite     | 支持（临时分区除外） | 2.0           | full sync    | 同上                                                         | 同上                                                 |
| 显式事务 (3.0)begin commit | 不支持               |               |              |                                                              |                                                      |

## 分区操作

| 操作               | 是否支持                        | Doris version |        同步方式            | 下游是否可以单独操作                                        | 说明                                                         |
| ------------------ | ------------------------------- | ------------- | ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| add partition      | 支持                            | -             | SQL                                | 不能，后续触发 Full Sync 或者 Partial Sync 会导致下游操作丢失 | cooldown time 属性及其行为未知                               |
| add temp partition | 不支持                          |               |                                    | 同上                                                        | backup 不支持 tmp partition，从 doris 2.1.8/3.0.4 开始，可以修改上游 FE 配置：`ignore_backup_tmp_partitions` 绕过该问题 |
| drop partition     | 支持                            | -             | SQL/Full Sync | 同上                                                        | 2.0.15/2.1.6 前：Full Sync，之后：SQL |
| replace partition  | 支持                            | 2.1.7/3.0.3 | Partial Sync                       | 同上                                                        | Partial Sync **只支持 strict range 和 non-tmp partition 的 replace 方式**，否则会触发 Full Sync。 |
| modify partition   | 不支持                          |  | | 同上                                                        | 指修改 partition 的 property |
| rename partition   | 支持 | 2.1.8/3.0.4 | SQL | 同上                                                        | |

## 视图

| 操作        | 是否支持 | Doris version | 同步方式 | 备注                             |
| ----------- | -------- | ------------- | -------- | -------------------------------- |
| create view | 支持     | -             | SQL      | 上下游同名时可以工作；如果下游已经存在，则会先删除在创建 |
| alter view  | 支持   | 2.1.8/3.0.4  | SQL         | |
| drop view   | 支持   | 2.1.8/3.0.4 | SQL | |

::: note

由于 doris 实现的限制，view 中的 column name/view name 不能和 db name 相同。

:::

## 物化视图

同步物化视图

| 操作                     | 是否支持 | Doris Version | 同步方式 | 备注                                                         |
| ------------------------ | -------- | ------------- | -------- | ------------------------------------------------------------ |
| create materialized view | 支持     | 2.1.8/3.0.4 | Partial Sync | 上下游同名时可以工作，不同名时需要下游手动重建 view。 |
| drop materialized view   | 支持     | 2.1.8/3.0.4 | SQL | |


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
