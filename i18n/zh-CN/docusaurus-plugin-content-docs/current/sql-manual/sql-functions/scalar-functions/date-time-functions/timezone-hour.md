---
{
    "title": "TIMEZONE_HOUR",
    "language": "zh-CN",
    "description": "返回 TIMESTAMPTZ 值在会话时区下时区偏移的小时部分"
}
---

## 描述

返回给定 `TIMESTAMPTZ` 值在会话时区下的时区偏移的小时部分。偏移量以该值所代表的时刻为基准，在 UTC 时间与会话时区之间计算，UTC 以西的时区偏移为负数。

该函数与 Trino 中的 [timezone_hour](https://trino.io/docs/current/functions/datetime.html#timezone_hour) 函数保持一致，但 Doris 中的 `TIMESTAMPTZ` 值本身不携带时区信息，因此使用会话时区。关于 `TIMESTAMPTZ` 数据类型，请参考 [TIMESTAMPTZ](../../../../sql-manual/basic-element/sql-data-types/date-time/TIMESTAMPTZ)。关于时区设置，请参考 [时区管理](../../../../admin-manual/cluster-management/time-zone)。

## 语法

```sql
TIMEZONE_HOUR(<timestamp>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<timestamp>` | 需要返回时区偏移小时的 `TIMESTAMPTZ` 值 |

## 返回值

返回 `BIGINT` 类型的时区偏移的小时部分。偏移量以该值所代表的时刻为基准在会话时区下计算。

- 如果参数为 NULL，返回 NULL。

## 示例

```sql
-- Asia/Shanghai 时区为 UTC+8
mysql> SET time_zone = '+08:00';
mysql> SELECT timezone_hour(CAST('2024-01-15 12:00:00' AS TIMESTAMPTZ));
+-------------------------------------------------------------+
| timezone_hour(CAST('2024-01-15 12:00:00' AS TIMESTAMPTZ))   |
+-------------------------------------------------------------+
|                                                           8 |
+-------------------------------------------------------------+

-- 夏令时期间，America/New_York 的偏移为 UTC-4
mysql> SET time_zone = 'America/New_York';
mysql> SELECT timezone_hour(CAST('2024-07-01 12:00:00' AS TIMESTAMPTZ));
+-------------------------------------------------------------+
| timezone_hour(CAST('2024-07-01 12:00:00' AS TIMESTAMPTZ))   |
+-------------------------------------------------------------+
|                                                          -4 |
+-------------------------------------------------------------+

-- TIMESTAMPTZ 值只存储 UTC 时刻，不存储输入时区，因此即使输入携带
-- '-04:30'，返回的仍是会话时区的偏移。Trino 对该输入会返回 -4。
mysql> SET time_zone = '+08:00';
mysql> SELECT timezone_hour(CAST('2024-01-15 12:00:00-04:30' AS TIMESTAMPTZ));
+--------------------------------------------------------------------+
| timezone_hour(CAST('2024-01-15 12:00:00-04:30' AS TIMESTAMPTZ))    |
+--------------------------------------------------------------------+
|                                                                  8 |
+--------------------------------------------------------------------+

-- 当输入为 NULL 时，返回 NULL
mysql> SELECT timezone_hour(CAST(NULL AS TIMESTAMPTZ));
+------------------------------------------+
| timezone_hour(CAST(NULL AS TIMESTAMPTZ)) |
+------------------------------------------+
|                                     NULL |
+------------------------------------------+
```
