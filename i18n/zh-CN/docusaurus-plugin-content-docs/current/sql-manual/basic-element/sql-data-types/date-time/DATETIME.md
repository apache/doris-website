---
{
    "title": "DATETIME",
    "language": "zh-CN",
    "description": "DATETIME(p) 类型存储日期时间，其中 p 为精度，p 的取值范围为 [0, 6]，缺省值为 0。即 DATETIME 等同于 DATETIME(0)。"
}
---

## 描述

DATETIME(p) 类型存储日期时间，其中 p 为精度，p 的取值范围为 `[0, 6]`，缺省值为 0。即 DATETIME 等同于 DATETIME(0)。

取值范围是 `[0000-01-01 00:00:00.000..., 9999-12-31 23:59:59.999...]`, 默认的输出格式为 'yyyy-MM-dd HH:mm:ss.SSS...'。其中小数点后共 p 位。例如，DATETIME(6) 的 取值范围为 `[0000-01-01 00:00:00.000000, 9999-12-31 23:59:59.999999]`。

Doris 中使用公历日期规范，公历中存在的日期与 Doris 中存在的日期一一对应，其中 0000 年表示 1BC（公元前 1 年）。无论日期位于哪一天，时间部分的范围总是 `['00:00:00.000...', '23:59:59.999...']`，且不存在重复的时间，即没有闰秒。

DATETIME 类型可以作为主键、分区列、分桶列。一个 DATETIME 类型字段在 Doris 中实际占用 8 字节。DATETIME 在运行中实际按照年、月、日、时、分、秒、毫秒分别存储，因此在 DATETIME 列上执行 `months_add` 运算实际比 `unix_timestamp` 更加高效。

如何将其他类型转换为 DATETIME，及转换时接受的输入，请见 [转换为 DATETIME](../conversion/datetime-conversion.md)。

日期时间类型均不支持直接使用数学运算符进行四则运算，执行数学运算的实质是首先将日期时间类型隐式转换为数字类型，再行运算。如需对时间类型进行加减、取整，请考虑使用 [DATE_ADD](../../../sql-functions/scalar-functions/date-time-functions/date-add.md), [DATE_SUB](../../../sql-functions/scalar-functions/date-time-functions/date-sub.md), [TIMESTAMPDIFF](../../../sql-functions/scalar-functions/date-time-functions/timestampdiff.md), [DATE_TRUNC](../../../sql-functions/scalar-functions/date-time-functions/date-trunc.md) 等函数。

DATETIME 类型不存储时区，即会话变量 `time_zone` 的变化不影响存储的 DATETIME 类型的值。

## 举例

```sql
select cast('2020-01-02' as datetime);
```

```text
+--------------------------------+
| cast('2020-01-02' as datetime) |
+--------------------------------+
| 2020-01-02 00:00:00            |
+--------------------------------+
```

```sql
select cast('2020-01-02' as datetime(6));
```

```text
+-----------------------------------+
| cast('2020-01-02' as datetime(6)) |
+-----------------------------------+
| 2020-01-02 00:00:00.000000        |
+-----------------------------------+
```

```sql
select cast('0000-12-31 22:21:20.123456' as datetime(4));
```

```text
+---------------------------------------------------+
| cast('0000-12-31 22:21:20.123456' as datetime(4)) |
+---------------------------------------------------+
| 0000-12-31 22:21:20.1235                          |
+---------------------------------------------------+
```
