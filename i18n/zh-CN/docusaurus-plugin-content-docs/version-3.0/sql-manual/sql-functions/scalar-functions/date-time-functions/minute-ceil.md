---
{
  "title": "MINUTE_CEIL",
  "language": "zh-CN"
}
---

## 描述

将日期时间向上取整到最近的指定分钟周期。如果指定了起始时间（origin），则以该时间为基准计算周期。

## 语法

```sql
MINUTE_CEIL(<datetime>)
MINUTE_CEIL(<datetime>, <origin>)
MINUTE_CEIL(<datetime>, <period>)
MINUTE_CEIL(<datetime>, <period>, <origin>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<datetime>` | 需要向上取整的日期时间值，类型为 DATETIME 或 DATETIMEV2 |
| `<period>` | 分钟周期值，类型为 INT，表示每个周期包含的分钟数 |
| `<origin>` | 周期的起始时间点，类型为 DATETIME 或 DATETIMEV2，默认值为 0001-01-01 00:00:00 |

## 返回值

返回类型为 DATETIMEV2，返回以输入日期时间为基准，向上取整到最近的指定分钟周期后的时间值。返回值的精度与输入参数 datetime 的精度相同。

## 举例

```sql
SELECT MINUTE_CEIL("2023-07-13 22:28:18", 5);
```

```text
+--------------------------------------------------------------+
| minute_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+--------------------------------------------------------------+
| 2023-07-13 22:30:00                                          |
+--------------------------------------------------------------+
```

注意：
- 不指定 period 时，默认以 1 分钟为周期
- period 必须为正整数
- 结果总是向未来时间取整

## 最佳实践

还可参阅 [date_ceil](./date-ceil)
