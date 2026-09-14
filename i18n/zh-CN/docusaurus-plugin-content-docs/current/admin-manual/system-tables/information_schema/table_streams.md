---
{
    "title": "table_streams",
    "language": "zh-CN",
    "description": "记录集群中所有 Table Stream 的定义与状态"
}
---

## 概述

记录集群中所有 Table Stream 的定义与状态。每行对应一个 Stream。使用方法见 [Table Stream 基础](../../../data-operate/incremental/table-stream)。

## 所属数据库

`information_schema`

## 表信息

| 列名 | 类型 | 说明 |
| :--- | :--- | :--- |
| DB_NAME | varchar(64) | Stream 所在的数据库 |
| STREAM_NAME | varchar(64) | Stream 名称 |
| STREAM_ID | bigint | Stream ID |
| STREAM_TYPE | varchar(64) | Stream 类型，内表上的 Stream 为 `OLAP_TABLE_STREAM` |
| CONSUME_TYPE | varchar(64) | 消费类型：`APPEND_ONLY`、`MIN_DELTA`、`DETAIL` |
| STREAM_COMMENT | string | Stream 的注释 |
| BASE_TABLE_NAME | varchar(64) | 基表名称 |
| BASE_TABLE_DB | varchar(64) | 基表所在的数据库 |
| BASE_TABLE_CTL | varchar(64) | 基表所在的 Catalog |
| BASE_TABLE_TYPE | varchar(64) | 基表类型 |
| ENABLED | boolean | Stream 是否可用 |
| IS_STALE | boolean | Stream 是否已失效（例如变更记录已被清理，无法继续从消费位点读取） |
| STALE_REASON | string | 失效原因，未失效时为 `N/A` |

## 示例

```sql
SELECT STREAM_NAME, CONSUME_TYPE, BASE_TABLE_DB, BASE_TABLE_NAME, ENABLED, IS_STALE, STALE_REASON
FROM information_schema.table_streams
WHERE DB_NAME = 'demo';
```

```text
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| STREAM_NAME   | CONSUME_TYPE | BASE_TABLE_DB | BASE_TABLE_NAME | ENABLED | IS_STALE | STALE_REASON |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| orders_stream | MIN_DELTA    | demo          | orders          |       1 |        0 | N/A          |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
```
