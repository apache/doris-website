---
{
    "title": "MAX",
    "language": "zh-CN",
    "description": "MAX 函数返回表达式的最大值。"
}
---

## 描述

MAX 函数返回表达式的最大值。

## 语法

```sql
MAX(<expr>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `expr` | 需要获取值的表达式  |

## 返回值

返回与输入表达式相同的数据类型。

## 举例

```sql
select max(scan_rows) from log_statis group by datetime;
```

```text
+------------------+
| max(`scan_rows`) |
+------------------+
|          4671587 |
+------------------+
```
