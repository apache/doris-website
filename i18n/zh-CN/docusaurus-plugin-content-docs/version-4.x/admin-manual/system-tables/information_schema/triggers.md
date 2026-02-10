---
{
    "title": "triggers",
    "language": "zh-CN",
    "description": "此表仅用于兼容 MySQL 行为。永远为空。"
}
---

## 概述

此表仅用于兼容 MySQL 行为。永远为空。

## 所属数据库


`information_schema`


## 表信息

| 列名                       | 类型          | 说明 |
| :------------------------- | :------------ | :--- |
| TRIGGER_CATALOG            | varchar(512)  |      |
| TRIGGER_SCHEMA             | varchar(64)   |      |
| TRIGGER_NAME               | varchar(64)   |      |
| EVENT_MANIPULATION         | varchar(6)    |      |
| EVENT_OBJECT_CATALOG       | varchar(512)  |      |
| EVENT_OBJECT_SCHEMA        | varchar(64)   |      |
| EVENT_OBJECT_TABLE         | varchar(64)   |      |
| ACTION_ORDER               | varchar(4)    |      |
| ACTION_CONDITION           | varchar(512)  |      |
| ACTION_STATEMENT           | varchar(512)  |      |
| ACTION_ORIENTATION         | varchar(9)    |      |
| ACTION_TIMING              | varchar(6)    |      |
| ACTION_REFERENCE_OLD_TABLE | varchar(64)   |      |
| ACTION_REFERENCE_NEW_TABLE | varchar(64)   |      |
| ACTION_REFERENCE_OLD_ROW   | varchar(3)    |      |
| ACTION_REFERENCE_NEW_ROW   | varchar(3)    |      |
| CREATED                    | datetime      |      |
| SQL_MODE                   | varchar(8192) |      |
| DEFINER                    | varchar(77)   |      |
| CHARACTER_SET_CLIENT       | varchar(32)   |      |
| COLLATION_CONNECTION       | varchar(32)   |      |
| DATABASE_COLLATION         | varchar(32)   |      |