---
{
    "title": "workload_group_privileges",
    "language": "zh-CN",
    "description": "存储 Workload Group 的权限信息"
}
---

## 概述

存储 Workload Group 的权限信息

## 所属数据库


`information_schema`


## 表信息

| 列名                | 类型         | 说明                   |
| :------------------ | :----------- | :--------------------- |
| GRANTEE             | varchar(64)  | 被赋权用户             |
| WORKLOAD_GROUP_NAME | varchar(256) | Workload Group 的名字  |
| PRIVILEGE_TYPE      | varchar(64)  | 权限类别               |
| IS_GRANTABLE        | varchar(3)   | 是否可以授权给其他用户 |