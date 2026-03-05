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
| LOCAL_DATA_SIZE               | text	        | Partition 本地数据大小 |
| REMOTE_DATA_SIZE              | text          | Partition 远端数据大小(cloud) |
| STATE                         | text	        | Partition 的状态      |
| REPLICA_ALLOCATION            | text	        | 描述 tablet 的副本分布 |
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
