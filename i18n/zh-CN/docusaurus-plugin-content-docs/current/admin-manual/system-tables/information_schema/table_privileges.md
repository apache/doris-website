---
{
    "title": "table_privileges",
    "language": "zh-CN",
    "description": "查看表的赋权信息。"
}
---

## 概述

查看表的赋权信息。

## 所属数据库


`information_schema`


## 表信息

| 列名           | 类型         | 说明                   |
| :------------- | :----------- | :--------------------- |
| GRANTEE        | varchar(81)  | 被授权用户             |
| TABLE_CATALOG  | varchar(512) | Catalog 名称           |
| TABLE_SCHEMA   | varchar(64)  | Database 名称          |
| TABLE_NAME     | varchar(64)  | Table 名称             |
| PRIVILEGE_TYPE | varchar(64)  | 权限类型               |
| IS_GRANTABLE   | varchar(3)   | 是否可以给其他用户授权 |