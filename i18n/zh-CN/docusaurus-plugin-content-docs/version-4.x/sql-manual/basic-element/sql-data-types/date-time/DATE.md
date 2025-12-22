---
{
    "title": "DATE",
    "language": "zh-CN",
    "description": "DATE 类型存储日期，取值范围是 [0000-01-01, 9999-12-31], 默认的输出格式为 'yyyy-MM-dd'。"
}
---

## 描述

DATE 类型存储日期，取值范围是 `[0000-01-01, 9999-12-31]`, 默认的输出格式为 'yyyy-MM-dd'。

Doris 中使用公历日期规范，公历中存在的日期与 Doris 中存在的日期一一对应，其中 `0000` 年表示 1BC（公元前 1 年）。

DATE 类型可以作为主键、分区列、分桶列。一个 DATE 类型字段在 Doris 中实际占用 4 字节。DATE 在运行中实际按照年、月、日分别存储，因此在 DATE 列上执行 `months_add` 运算实际比 `unix_timestamp` 更加高效。

如何将其他类型转换为 DATE，及转换时接受的输入，请见 [转换为 DATE](../conversion/date-conversion.md)。

日期时间类型均不支持直接使用数学运算符进行四则运算，执行数学运算的实质是首先将日期时间类型隐式转换为数字类型，再行运算。如需对时间类型进行加减、取整，请考虑使用 [DATE_ADD](../../../sql-functions/scalar-functions/date-time-functions/date-add.md), [DATE_SUB](../../../sql-functions/scalar-functions/date-time-functions/date-sub.md), [TIMESTAMPDIFF](../../../sql-functions/scalar-functions/date-time-functions/timestampdiff.md), [DATE_TRUNC](../../../sql-functions/scalar-functions/date-time-functions/date-trunc.md) 等函数。

DATE 类型不存储时区，即会话变量 `time_zone` 的变化不影响存储的 DATE 类型的值。

## 举例

```sql
select cast('2020-01-02' as date);
```

```text
+----------------------------+
| cast('2020-01-02' as date) |
+----------------------------+
| 2020-01-02                 |
+----------------------------+
```

```sql
select cast('0120-02-29' as date);
```

```text
+----------------------------+
| cast('0120-02-29' as date) |
+----------------------------+
| 0120-02-29                 |
+----------------------------+
```
