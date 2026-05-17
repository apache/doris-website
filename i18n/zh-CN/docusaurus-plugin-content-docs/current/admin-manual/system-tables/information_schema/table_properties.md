---
{
    "title": "table_properties",
    "language": "zh-CN",
    "description": "用于查看表（包括内表和外表）的属性信息。"
}
---

## 概述

用于查看表（包括内表和外表）的属性信息。

## 所属数据库


`information_schema`


## 表信息

| 列名           | 类型        | 说明            |
| :------------- | :---------- | :-------------- |
| TABLE_CATALOG  | varchar(64) | 表所属 Catalog  |
| TABLE_SCHEMA   | varchar(64) | 表所属 Database |
| TABLE_NAME     | varchar(64) | 表名            |
| PROPERTY_NAME  | string      | 属性名称        |
| PROPERTY_VALUE | string      | 属性值          |