---
{
    "title": "active_queries",
    "language": "zh-CN",
    "description": "用于查看当前正在执行的查询"
}
---

## 概述

用于查看当前正在执行的查询

## 所属数据库


`information_schema`


## 表信息

| 列名              | 类型         | 说明                               |
| :---------------- | :----------- | :--------------------------------- |
| QUERY_ID          | varchar(256) | 查询的 ID                           |
| QUERY_START_TIME  | varchar(256) | 查询开始时间                       |
| QUERY_TIME_MS     | bigint       | 查询执行时间                       |
| WORKLOAD_GROUP_ID | bigint       | 查询所属 Workload Group 的 ID      |
| DATABASE          | varchar(256) | 查询执行时所在的 Database          |
| FRONTEND_INSTANCE | varchar(256) | 接收查询请求的 Frontend 实例 IP    |
| QUEUE_START_TIME  | varchar(256) | 开始排队时间，为空表示没有经过排队 |
| QUEUE_END_TIME    | varchar(256) | 结束排队时间，为空表示没有经过排队 |
| QUERY_STATUS      | varchar(256) | 查询状态                           |
| SQL               | text         | 查询语句文本                       |