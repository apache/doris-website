---
{
    "title": "column_privileges",
    "language": "zh-CN",
    "description": "此表仅用于兼容 MySQL 行为，永远为空。并不能真实反映 Doris 的列权限信息。"
}
---

## 概述

此表仅用于兼容 MySQL 行为，永远为空。并不能真实反映 Doris 的列权限信息。

## 所属数据库


`information_schema`


## 表信息

| 列名           | 类型         | 说明 |
| :------------- | :----------- | :--- |
| GRANTEE        | varchar(128) |      |
| TABLE_CATALOG  | varchar(512) |      |
| TABLE_SCHEMA   | varchar(64)  |      |
| TABLE_NAME     | varchar(64)  |      |
| COLUMN_NAME    | varchar(64)  |      |
| PRIVILEGE_TYPE | varchar(64)  |      |
| IS_GRANTABLE   | varchar(3)   |      |