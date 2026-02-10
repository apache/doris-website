---
{
    "title": "views",
    "language": "zh-CN",
    "description": "存储所有的视图信息。"
}
---

## 概述

存储所有的视图信息。

## 所属数据库


`information_schema`


## 表信息

| 列名                 | 类型          | 说明                         |
| :------------------- | :------------ | :--------------------------- |
| TABLE_CATALOG        | varchar(512)  | Catalog 名称                 |
| TABLE_SCHEMA         | varchar(64)   | Database 名称                 |
| TABLE_NAME           | varchar(64)   | View 名称                    |
| VIEW_DEFINITION      | varchar(8096) | View 定义语句                |
| CHECK_OPTION         | varchar(8)    | 无实际作用，仅用于兼容 MySQL |
| IS_UPDATABLE         | varchar(3)    | 无实际作用，仅用于兼容 MySQL |
| DEFINER              | varchar(77)   | 无实际作用，仅用于兼容 MySQL |
| SECURITY_TYPE        | varchar(7)    | 无实际作用，仅用于兼容 MySQL |
| CHARACTER_SET_CLIENT | varchar(32)   | 无实际作用，仅用于兼容 MySQL |
| COLLATION_CONNECTION | varchar(32)   | 无实际作用，仅用于兼容 MySQL |