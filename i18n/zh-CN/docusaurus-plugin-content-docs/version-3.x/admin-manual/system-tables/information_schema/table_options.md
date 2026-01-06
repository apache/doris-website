---
{
    "title": "table_options",
    "language": "zh-CN",
    "description": "此表仅用于兼容 MySQL 行为。永远为空。"
}
---

## 概述

此表仅用于兼容 MySQL 行为。永远为空。

## 所属数据库


`information_schema`


## 表信息

| 列名            | 类型        | 说明 |
| :-------------- | :---------- | :--- |
| TABLE_CATALOG   | varchar(64) |      |
| TABLE_SCHEMA    | varchar(64) |      |
| TABLE_NAME      | varchar(64) |      |
| TABLE_MODEL     | text        |      |
| TABLE_MODEL_KEY | text        |      |
| DISTRIBUTE_KEY  | text        |      |
| DISTRIBUTE_TYPE | text        |      |
| BUCKETS_NUM     | int         |      |
| PARTITION_NUM   | int         |      |