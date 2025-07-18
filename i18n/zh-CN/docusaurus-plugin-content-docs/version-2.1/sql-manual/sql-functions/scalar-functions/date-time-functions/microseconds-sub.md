---
{
    "title": "MICROSECONDS_SUB",
    "language": "zh-CN"
}
---

## 描述

从日期时间值中减去指定的微秒数，返回一个新的日期时间值。

## 语法

```sql
MICROSECONDS_SUB(<basetime>, <delta>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<basetime>` | 输入的日期时间值，类型为 DATETIMEV2 |
| `<delta>` | 要减去的微秒数，类型为 INT，1 秒 = 1,000,000 微秒 |

## 返回值

返回类型为 DATETIMEV2，返回以输入日期时间为基准，减去指定微秒数后的时间值。返回值的精度与输入参数 basetime 的精度相同。

## 举例

```sql
SELECT NOW(3) AS current_time, MICROSECONDS_SUB(NOW(3), 100000) AS after_sub;
```

```text
+-------------------------+----------------------------+
| current_time            | after_sub                  |
+-------------------------+----------------------------+
| 2025-01-16 11:52:22.296 | 2025-01-16 11:52:22.196000 |
+-------------------------+----------------------------+
```

注意：
- `NOW(3)` 返回精度为 3 位小数的当前时间
- 减去 100000 微秒（0.1 秒）后，时间减少了 0.1 秒
- 函数的计算结果与输入时间的精度有关