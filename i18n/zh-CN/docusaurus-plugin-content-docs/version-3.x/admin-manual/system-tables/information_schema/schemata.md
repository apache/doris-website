---
{
    "title": "schemata",
    "language": "zh-CN",
    "description": "查看 Database 的相关信息"
}
---

## 概述

查看 Database 的相关信息

## 所属数据库


`information_schema`


## 表信息

| 列名                       | 类型         | 说明                         |
| :------------------------- | :----------- | :--------------------------- |
| CATALOG_NAME               | varchar(512) | Catalog 名字                 |
| SCHEMA_NAME                | varchar(32)  | Database 名字                |
| DEFAULT_CHARACTER_SET_NAME | varchar(32)  | 无实际作用，仅用于兼容 MySQL |
| DEFAULT_COLLATION_NAME     | varchar(32)  | 无实际作用，仅用于兼容 MySQL |
| SQL_PATH                   | varchar(512) | 无实际作用，仅用于兼容 MySQL |
| DEFAULT_ENCRYPTION         | varchar(3)   | 无实际作用，仅用于兼容 MySQL |