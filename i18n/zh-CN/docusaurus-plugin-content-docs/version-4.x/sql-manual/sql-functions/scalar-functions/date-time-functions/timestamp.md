---
{
    "title": "TIMESTAMP",
    "language": "zh-CN",
    "description": "TIMESTAMP 将 符合 datetime 格式的字符串转换为 DATETIME 类型"
}
---

## 描述

TIMESTAMP 将 符合 datetime 格式的字符串转换为 DATETIME 类型
如果存在第二个时间类型的参数，则计算两参数相加的结果，然后以DATETIME类型的格式返回。

具体 datetime 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion).

该函数与 mysql 中的 [timestamp 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestamp) 行为相同。

:::note
两个参数版本从4.0.3开始支持
:::

## 语法

```sql
TIMESTAMP(<date_or_datetime_string>[, <time_string>])
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `date_or_datetime_string` | 日期时间字符串类型 |
| `time_string` | 时间字符串类型 |

## 返回值

返回类型为 DATETIME。

当输入参数数量为 1 时，返回将第一个参数转换为 DATETIME 类型的结果。
当输入参数数量为 2 时，返回两参数相加的结果

- 若第一个参数输入为 date 字符串,则时间被设置为 00:00:00
- 任一参数为 NULL或参数类型不匹配时，返回 NULL
## 举例

```sql
-- 将字符串转换为 DATETIME
SELECT TIMESTAMP('2019-01-01 12:00:00');

+------------------------------------+
| timestamp('2019-01-01 12:00:00')   |
+------------------------------------+
| 2019-01-01 12:00:00                |
+------------------------------------+

---输入 date 字符串
SELECT TIMESTAMP('2019-01-01');
+-------------------------+
| TIMESTAMP('2019-01-01') |
+-------------------------+
| 2019-01-01 00:00:00     |
+-------------------------+

--输入 NULL,返回 NULL
SELECT TIMESTAMP(NULL);
+-----------------+
| TIMESTAMP(NULL) |
+-----------------+
| NULL            |
+-----------------+

-- 两个参数，返回两个参数相加的结果(Date/DateTime + Time)
SELECT TIMESTAMP('2025-11-30 23:45:12', '12:34:56'); 
+----------------------------------------------+
| TIMESTAMP('2025-11-30 23:45:12', '12:34:56') |
+----------------------------------------------+
| 2025-12-01 12:20:08                          |
+----------------------------------------------+

-- 第一个参数仅接受Date/Datetime类型，第二个参数仅接受 Time 类型
SELECT TIMESTAMP('12:34:56', '12:34:56');
+-----------------------------------+
| TIMESTAMP('12:34:56', '12:34:56') |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

-- 任一参数为 NULL， 返回 NULL
SELECT TIMESTAMP('2025-12-01', NULL);
+-------------------------------+
| TIMESTAMP('2025-12-01', NULL) |
+-------------------------------+
| NULL                          |
+-------------------------------+
```
