---
{
    "title": "profiling",
    "language": "zh-CN",
    "description": "此表仅用于兼容 MySQL 行为。永远为空。"
}
---

## 概述

此表仅用于兼容 MySQL 行为。永远为空。

## 所属数据库


`information_schema`


## 表信息

| 列名                | 类型        | 说明 |
| :------------------ | :---------- | :--- |
| QUERY_ID            | int         |      |
| SEQ                 | int         |      |
| STATE               | varchar(30) |      |
| DURATION            | double      |      |
| CPU_USER            | double      |      |
| CPU_SYSTEM          | double      |      |
| CONTEXT_VOLUNTARY   | int         |      |
| CONTEXT_INVOLUNTARY | int         |      |
| BLOCK_OPS_IN        | int         |      |
| BLOCK_OPS_OUT       | int         |      |
| MESSAGES_SENT       | int         |      |
| MESSAGES_RECEIVED   | int         |      |
| PAGE_FAULTS_MAJOR   | int         |      |
| PAGE_FAULTS_MINOR   | int         |      |
| SWAPS               | int         |      |
| SOURCE_FUNCTION     | varchar(30) |      |
| SOURCE_FILE         | varchar(20) |      |
| SOURCE_LINE         | int         |      |