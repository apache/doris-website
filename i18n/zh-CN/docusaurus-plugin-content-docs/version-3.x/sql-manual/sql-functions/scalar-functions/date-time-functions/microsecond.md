---
{
    "title": "MICROSECOND",
    "language": "zh-CN"
}
---

## 描述

从日期时间值中提取微秒部分的值。返回的范围是 0 到 999999。

## 语法

```sql
MICROSECOND(<date>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date>` | 输入的日期时间值，类型为 DATETIMEV2，精度需要大于 0 |

## 返回值

返回类型为 INT，返回日期时间值中的微秒部分。取值范围为 0 到 999999。对于精度小于 6 的输入，不足的位数补 0。

## 举例

```sql
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.000123' AS DATETIMEV2(6))) AS microsecond;
```

```text
+-------------+
| microsecond |
+-------------+
|         123 |
+-------------+
```
