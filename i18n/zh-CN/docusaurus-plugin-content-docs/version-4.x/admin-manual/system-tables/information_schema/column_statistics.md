---
{
    "title": "column_statistics",
    "language": "zh-CN",
    "description": "此表仅用于兼容 MySQL 行为，永远为空。并不能真实反映 Doris 内数据的统计信息。如需查看 Doris 收集的统计信息，请查看统计信息章节。"
}
---

## 概述

此表仅用于兼容 MySQL 行为，永远为空。并不能真实反映 Doris 内数据的统计信息。如需查看 Doris 收集的统计信息，请[查看统计信息章节](../../../query-acceleration/optimization-technology-principle/statistics#查看统计信息)。

## 所属数据库


`information_schema`


## 表信息

| 列名        | 类型        | 说明 |
| :---------- | :---------- | :--- |
| SCHEMA_NAME | varchar(64) |      |
| TABLE_NAME  | varchar(64) |      |
| COLUMN_NAME | varchar(64) |      |
| HISTOGRAM   | json        |      |