---
{
    "title": "MIN",
    "language": "zh-CN"
}
---

## 描述

MIN 函数返回表达式的最小值。

## 语法

```sql
MIN(<expr>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 需要获取值的表达式  |

## 返回值

返回与输入表达式相同的数据类型。

## 举例

```sql
select MIN(scan_rows) from log_statis group by datetime;
```

```text
+------------------+
| MIN(`scan_rows`) |
+------------------+
|                0 |
+------------------+
```
