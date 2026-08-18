---
{
    "title": "TIMEZONE_MINUTE",
    "language": "zh-CN",
    "description": "返回 TIMESTAMPTZ 值在会话时区下时区偏移的分钟部分"
}
---

## 描述

返回给定 `TIMESTAMPTZ` 值在会话时区下的时区偏移的分钟部分。偏移量以该值所代表的时刻为基准，在 UTC 时间与会话时区之间计算，UTC 以西的时区偏移为负数。

该函数与 Trino 中的 [timezone_minute](https://trino.io/docs/current/functions/datetime.html#timezone_minute) 函数保持一致，但 Doris 中的 `TIMESTAMPTZ` 值本身不携带时区信息，因此使用会话时区。关于 `TIMESTAMPTZ` 数据类型，请参考 [TIMESTAMPTZ](../../../../sql-manual/basic-element/sql-data-types/date-time/TIMESTAMPTZ)。关于时区设置，请参考 [时区管理](../../../../admin-manual/cluster-management/time-zone)。

## 语法

```sql
TIMEZONE_MINUTE(<timestamp>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<timestamp>` | 需要返回时区偏移分钟的 `TIMESTAMPTZ` 值 |

## 返回值

返回 `BIGINT` 类型的时区偏移的分钟部分。偏移量以该值所代表的时刻为基准在会话时区下计算。对于整小时偏移的时区，返回值为 0。

- 如果参数为 NULL，返回 NULL。

## 示例

```sql
-- Asia/Shanghai 时区为 UTC+8，因此分钟部分为 0
mysql> SET time_zone = '+08:00';
mysql> SELECT timezone_minute(CAST('2024-01-15 12:00:00' AS TIMESTAMPTZ));
+---------------------------------------------------------------+
| timezone_minute(CAST('2024-01-15 12:00:00' AS TIMESTAMPTZ))   |
+---------------------------------------------------------------+
|                                                             0 |
+---------------------------------------------------------------+

-- Asia/Kathmandu 的偏移为 UTC+05:45，因此分钟部分为 45
mysql> SET time_zone = 'Asia/Kathmandu';
mysql> SELECT timezone_minute(CAST('2024-01-15 12:00:00' AS TIMESTAMPTZ));
+---------------------------------------------------------------+
| timezone_minute(CAST('2024-01-15 12:00:00' AS TIMESTAMPTZ))   |
+---------------------------------------------------------------+
|                                                            45 |
+---------------------------------------------------------------+

-- 当输入为 NULL 时，返回 NULL
mysql> SELECT timezone_minute(CAST(NULL AS TIMESTAMPTZ));
+--------------------------------------------+
| timezone_minute(CAST(NULL AS TIMESTAMPTZ)) |
+--------------------------------------------+
|                                       NULL |
+--------------------------------------------+
```
