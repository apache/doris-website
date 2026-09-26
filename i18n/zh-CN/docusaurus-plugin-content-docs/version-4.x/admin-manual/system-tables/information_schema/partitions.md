---
{
    "title": "partitions",
    "language": "zh-CN",
    "description": "查看数据库中所有表的 Partition 情况。"
}
---

## 概述

查看数据库中所有表的 Partition 情况。

## 所属数据库

`information_schema`

## 表信息

| 列名                          | 类型          | 说明                 |
| :---------------------------- | :------------ | :------------------- |
| PARTITION_ID                  | bigint        |                      |
| TABLE_CATALOG                 | varchar(64)   | Catalog 名字         |
| TABLE_SCHEMA                  | varchar(64)   | Database 名字        |
| TABLE_NAME                    | varchar(64)   | Table 名字           |
| PARTITION_NAME                | varchar(64)   | Partition 名字       |
| SUBPARTITION_NAME             | varchar(64)   | 永远为空             |
| PARTITION_ORDINAL_POSITION    | int           | Partition 的序号     |
| SUBPARTITION_ORDINAL_POSITION | int           | 永远为空             |
| PARTITION_METHOD              | varchar(13)   | Partition 的分区方法 |
| SUBPARTITION_METHOD           | varchar(13)   | 永远为空             |
| PARTITION_EXPRESSION          | varchar(2048) | Partition 的表达式   |
| SUBPARTITION_EXPRESSION       | varchar(2048) | 永远为空             |
| PARTITION_DESCRIPTION         | text          | Parititon 的描述信息 |
| TABLE_ROWS                    | bigint        |                      |
| AVG_ROW_LENGTH                | bigint        |                      |
| DATA_LENGTH                   | bigint        |                      |
| MAX_DATA_LENGTH               | bigint        |                      |
| INDEX_LENGTH                  | bigint        |                      |
| DATA_FREE                     | bigint        |                      |
| CREATE_TIME                   | bigint        |                      |
| UPDATE_TIME                   | datetime      |                      |
| CHECK_TIME                    | datetime      |                      |
| CHECKSUM                      | bigint        |                      |
| PARTITION_COMMENT             | text          |                      |
| NODEGROUP                     | varchar(256)  |                      |
| TABLESPACE_NAME               | varchar(268)  |                      |
| LOCAL_DATA_SIZE               | text	        | Partition 本地数据大小。存算分离模式下通常为 `0`，详见下方说明 |
| REMOTE_DATA_SIZE              | text          | Partition 远端数据大小(cloud) |
| STATE                         | text	        | Partition 的状态      |
| REPLICA_ALLOCATION            | text	        | 描述 tablet 的副本分布。存算分离模式下为 `NULL` |
| REPLICA_NUM                   | int 	        | Partition 的副本数    |
| STORAGE_POLICY                | text          | 存储策略              |
| STORAGE_MEDIUM                | text          | 存储介质              |
| COOLDOWN_TIME_MS              | text          | 冷却时间              |
| LAST_CONSISTENCY_CHECK_TIME   | text          | 最后检查一致性的时间    |
| BUCKET_NUM                    | int           | 桶数                 |
| COMMITTED_VERSION             | bigint        | 最近一次被提交的版本    |
| VISIBLE_VERSION               | bigint        | 当前可见版本           |
| PARTITION_KEY                 | text          | Partition 的键       |
| RANGE                         | text          | 分区的范围（最大最小值）|
| DISTRIBUTION                  | text          | 分区类型              |

## 存算分离模式下的数据大小语义

<!-- 知识类型: 行为说明 -->
<!-- 适用场景: 存算分离容量核对 / 分区数据量统计 -->

:::caution 版本行为变更（4.0.8）

自 4.0.8 版本起，存算分离模式下分区的数据量统一按**远端数据**语义上报：副本统计中未单独记录远端大小的数据量，会被计入 `REMOTE_DATA_SIZE`，对应的 `LOCAL_DATA_SIZE` 显示为 `0`。因此存算分离集群中通常看到 `LOCAL_DATA_SIZE` 为 `0`，分区的实际数据量体现在 `REMOTE_DATA_SIZE` 上。

在 4.0.8 之前，这部分数据量会被记入 `LOCAL_DATA_SIZE`，导致 `information_schema.partitions`、[`SHOW TABLETS`](../../../sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET) 与 [`information_schema.backend_tablets`](./backend_tablets) 三者的本地/远端口径互相矛盾。该变更只调整展示口径，不改变数据的实际存储位置与总量。

同一变更中，存算分离模式下 `information_schema.partitions` 的 `REPLICA_ALLOCATION` 显示为 `NULL`（此前显示为内部占位符 `\N`）。副本分布由存算分离架构自行管理，不再沿用存算一体的副本分配语义。

:::

统计分区实际占用空间时，存算分离模式下应以 `REMOTE_DATA_SIZE` 为准：

```sql
SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    PARTITION_NAME,
    LOCAL_DATA_SIZE,
    REMOTE_DATA_SIZE
FROM information_schema.partitions
WHERE TABLE_SCHEMA = 'your_db';
```
