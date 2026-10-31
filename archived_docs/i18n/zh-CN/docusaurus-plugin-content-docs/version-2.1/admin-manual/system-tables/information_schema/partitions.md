---
{
    "title": "partitions",
    "language": "zh-CN",
    "description": "查看数据库中所有表的 partition 情况。在 2.1.7（不包含 2.1.7）之前恒为空表。"
}
---

## 概述

查看数据库中所有表的 partition 情况。在 2.1.7（不包含 2.1.7）之前恒为空表。

## 所属数据库

`information_schema`

## 表信息

| 列名                          | 类型          | 说明                 |
| :---------------------------- | :------------ | :------------------- |
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
