---
{
    "title": "MEDIAN",
    "language": "zh-CN"
}
---

## 描述

MEDIAN 函数返回表达式的中位数

## 语法

```sql
MEDIAN(<expr>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 需要获取值的表达式 |

## 返回值

返回与输入表达式相同的数据类型。

## 举例
```sql
select median(scan_rows) from log_statis group by datetime;
```

```text
+---------------------+
| median(`scan_rows`) |
+---------------------+
|                 50 |
+---------------------+
```