---
{
    "title": "COALESCE",
    "language": "zh-CN"
}
---

## coalesce
## 描述
## 语法

`coalesce(expr1, expr2, ...., expr_n))`

返回参数中的第一个非空表达式（从左向右）

## 举例

```
mysql> select coalesce(NULL, '1111', '0000');
+--------------------------------+
| coalesce(NULL, '1111', '0000') |
+--------------------------------+
| 1111                           |
+--------------------------------+
```
### keywords

    COALESCE
