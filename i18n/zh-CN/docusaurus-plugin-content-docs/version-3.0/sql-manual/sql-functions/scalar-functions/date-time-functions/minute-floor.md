---
{
    "title": "MINUTE_FLOOR",
    "language": "zh-CN"
}
---

## 描述

将日期时间向下取整到最近的指定分钟周期。如果指定了起始时间（origin），则以该时间为基准计算周期。

## 语法

```sql
MINUTE_FLOOR(<datetime>)
MINUTE_FLOOR(<datetime>, <origin>)
MINUTE_FLOOR(<datetime>, <period>)
MINUTE_FLOOR(<datetime>, <period>, <origin>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<datetime>` | 需要向下取整的日期时间值，类型为 DATETIME 或 DATETIMEV2 |
| `<period>` | 分钟周期值，类型为 INT，表示每个周期包含的分钟数 |
| `<origin>` | 周期的起始时间点，类型为 DATETIME 或 DATETIMEV2，默认值为 0001-01-01 00:00:00 |

## 返回值

返回类型为 DATETIMEV2，表示向下取整后的日期时间值。

## 举例

```sql
SELECT MINUTE_FLOOR("2023-07-13 22:28:18", 5);
```

```text
+---------------------------------------------------------------+
| minute_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+---------------------------------------------------------------+
| 2023-07-13 22:25:00                                           |
+---------------------------------------------------------------+
```

注意：
- 不指定 period 时，默认以 1 分钟为周期
- period 必须为正整数
- 结果总是向过去时间取整
- 与 MINUTE_CEIL 相反，MINUTE_FLOOR 总是舍去超出周期的部分

## 最佳实践

还可参阅 [date_floor](./date-floor)
