---
{
    "title": "procs_priv",
    "language": "zh-CN",
    "description": "此表仅用于兼容 MySQL 行为。永远为空。"
}
---

## 概述

此表仅用于兼容 MySQL 行为。永远为空。

## 所属数据库


`mysql`


## 表信息

| 列名         | 类型     | 说明 |
| :----------- | :------- | :--- |
| host         | char(60) |      |
| db           | char(64) |      |
| user         | char(32) |      |
| routine_name | char(64) |      |
| routine_type | char(9)  |      |
| grantor      | char(93) |      |
| proc_priv    | char(16) |      |
| timestamp    | char(1)  |      |