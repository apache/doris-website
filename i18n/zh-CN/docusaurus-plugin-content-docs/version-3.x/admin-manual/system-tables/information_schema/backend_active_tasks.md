---
{
    "title": "backend_active_tasks",
    "language": "zh-CN",
    "description": "查看所有 Backend 正在运行中的查询或者导入任务的资源用量。"
}
---

## 概述

查看所有 Backend 正在运行中的查询或者导入任务的资源用量。

## 所属数据库


`information_schema`


## 表信息

| 列名                      | 类型         | 说明                     |
| :------------------------ | :----------- | :----------------------- |
| BE_ID                     | bigint       | 执行任务的 Backend 的 ID |
| FE_HOST                   | varchar(256) | 下发任务的 Frontend 地址 |
| QUERY_ID                  | varchar(256) | 查询的 ID                |
| TASK_TIME_MS              | bigint       | 任务运行时间             |
| TASK_CPU_TIME_MS          | bigint       | 任务运行的 CPU 时间      |
| SCAN_ROWS                 | bigint       | 扫描数据行数             |
| SCAN_BYTES                | bigint       | 扫描数据字节数           |
| BE_PEAK_MEMORY_BYTES      | bigint       | 使用的内存峰值           |
| CURRENT_USED_MEMORY_BYTES | bigint       | 当前使用的内存           |
| SHUFFLE_SEND_BYTES        | bigint       | Shuffle 数据字节数       |
| SHUFFLE_SEND_ROWS         | bigint       | Shuffle 数据行数         |
| QUERY_TYPE                | varchar(256) | 查询类型                 |