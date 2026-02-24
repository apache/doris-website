---
{
    "title": "schema_privileges",
    "language": "zh-CN",
    "description": "查看数据库的赋权信息"
}
---

## 概述

查看数据库的赋权信息

## 所属数据库


`information_schema`


## 表信息

| 列名           | 类型         | 说明                     |
| :------------- | :----------- | :----------------------- |
| GRANTEE        | varchar(81)  | 被授权用户               |
| TABLE_CATALOG  | varchar(512) | Catalog 名字，永远为 def |
| TABLE_SCHEMA   | varchar(64)  | Database 名字            |
| PRIVILEGE_TYPE | varchar(64)  | 权限类型                 |
| IS_GRANTABLE   | varchar(3)   | 是否可以给其他用户授权   |

