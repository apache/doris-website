---
{
    "title": "processlist",
    "language": "zh-CN",
    "description": "查看当前的全部连接"
}
---

## 概述

查看当前的全部连接

## 所属数据库


`information_schema`


## 表信息

| 列名              | 类型           | 说明                          |
| :---------------- | :------------- | :---------------------------- |
| CURRENT_CONNECTED | varchar(16)    | 已废弃，永远为 No             |
| ID                | largeint       | 连接 ID                       |
| USER              | varchar(32)    | 连接用户                      |
| HOST              | varchar(261)   | 连接地址                      |
| LOGIN_TIME        | datetime       | 登录时间                      |
| CATALOG           | varchar(64)    | 当前 Catalog                  |
| DB                | varchar(64)    | 当前 Database                 |
| COMMAND           | varchar(16)    | 当前发送的 MySQL Command 类型 |
| TIME              | int            | 最后一次查询的执行时间        |
| STATE             | varchar(64)    | 最后一次查询的状态            |
| QUERY_ID          | varchar(256)   | 最后一次查询的 ID             |
| INFO              | varchar(65533) | 最后一次查询的查询语句        |
| FE                | varchar(64)    | 连接的 FE                     |
| COMPUTE_GROUP     | varchar(64)    | 使用的 Compute Group 名字     |
