---
{
    "title": "user_privileges",
    "language": "zh-CN",
    "description": "查看用户赋权信息。"
}
---

## 概述

查看用户赋权信息。

## 所属数据库


`information_schema`


## 表信息

| 列名           | 类型         | 说明                   |
| :------------- | :----------- | :--------------------- |
| GRANTEE        | varchar(81)  | 被授权用户             |
| TABLE_CATALOG  | varchar(512) | 永远为 def             |
| PRIVILEGE_TYPE | varchar(64)  | 权限类型               |
| IS_GRANTABLE   | varchar(3)   | 是否可以给其他用户授权 |