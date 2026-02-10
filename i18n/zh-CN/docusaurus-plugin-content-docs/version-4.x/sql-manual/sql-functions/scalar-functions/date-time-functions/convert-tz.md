---
{
    "title": "CONVERT_TZ",
    "language": "zh-CN",
    "description": "转换 datetime 值，从 fromtz 给定时区转到 totz 给定时区，并返回结果值，时区设置请查看 时区管理 文档。"
}
---

## 描述

转换 datetime 值，从 from_tz 给定时区转到 to_tz 给定时区，并返回结果值，时区设置请查看 [时区管理](../../../../admin-manual/cluster-management/time-zone) 文档。

该函数与 mysql 中的 [convert_tz 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_convert_tz) 行为一致

## 语法

```sql
CONVERT_TZ(<date_or_time_expr>, <from_tz>, <to_tz>)
```

## 参数

| 参数 | 说明 |
| -- | -- | 
| `<date_or_time_expr>` | 需要被转换的值，为 datetime 或者 date 类型，具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)) |
| `<from_tz>` | dt 的原始时区，该参数为 `varchar` 类型 |
| `<to_tz>` | 需要转换的时区，该参数为 `varchar` 类型|

## 返回值

- 转换后的值，类型为 datetime
- 返回的 scale 跟输入的 scale 相同
  - 不带有 scale 的 datetime 输入，返回结果也不带有 scale
  - 带有 scale 的输入，返回的结果带有相同的 scale

特殊情况:
- 如果任何参数为 NULL。返回 NULL。
- 当输入的时区不合法的时候，返回错误，时区的设置参考 [时区管理](../../../../admin-manual/cluster-management/time-zone)。
- 输入为 date 类型，时间部分自动转换为 00:00:00

## 示例

```sql
-- 中国上海时间转换到美国洛杉矶
mysql> select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATETIME), 'Asia/Shanghai', 'America/Los_Angeles');
+---------------------------------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03', 'Asia/Shanghai', 'America/Los_Angeles') |
+---------------------------------------------------------------------------+
| 2019-07-31 22:21:03                                                       |
+---------------------------------------------------------------------------+

-- 将 东八区（+08:00）的时间 '2019-08-01 13:21:03' 转换为 美国洛杉矶
select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATETIME), '+08:00', 'America/Los_Angeles');

+--------------------------------------------------------------------+
| convert_tz('2019-08-01 13:21:03', '+08:00', 'America/Los_Angeles') |
+--------------------------------------------------------------------+
| 2019-07-31 22:21:03                                                |
+--------------------------------------------------------------------+

-- 输入为 date 类型,输出为 datetime 类型，时间部分自动转换为 00:00:00
mysql> select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATE), 'Asia/Shanghai', 'America/Los_Angeles');
+-------------------------------------------------------------------------------------------+
| CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATEV2), 'Asia/Shanghai', 'America/Los_Angeles') |
+-------------------------------------------------------------------------------------------+
| 2019-07-31 09:00:00                                                                       |
+-------------------------------------------------------------------------------------------+

-- 转换时间为NULL,输出NULL
mysql> select CONVERT_TZ(NULL, 'Asia/Shanghai', 'America/New_York');
+-------------------------------------------------------+
| CONVERT_TZ(NULL, 'Asia/Shanghai', 'America/New_York') |
+-------------------------------------------------------+
| NULL                                                  |
+-------------------------------------------------------+

-- 任一时区为NULL，返回NULL
mysql> select CONVERT_TZ('2019-08-01 13:21:03', NULL, 'America/Los_Angeles');
+----------------------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03', NULL, 'America/Los_Angeles') |
+----------------------------------------------------------------+
| NULL                                                           |
+----------------------------------------------------------------+

mysql> select CONVERT_TZ('2019-08-01 13:21:03', '+08:00', NULL);
+---------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03', '+08:00', NULL) |
+---------------------------------------------------+
| NULL                                              |
+---------------------------------------------------+

-- 带有 scale 的时间
mysql> select CONVERT_TZ('2019-08-01 13:21:03.636', '+08:00', 'America/Los_Angeles');
+------------------------------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03.636', '+08:00', 'America/Los_Angeles') |
+------------------------------------------------------------------------+
| 2019-07-31 22:21:03.636                                                |
+------------------------------------------------------------------------+

-- 当输入的时区不合法的时候，返回错误
select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATETIME), '+08:00', 'America/Los_Anges');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT][E33] Operation convert_tz invalid timezone: America/Los_Anges
```