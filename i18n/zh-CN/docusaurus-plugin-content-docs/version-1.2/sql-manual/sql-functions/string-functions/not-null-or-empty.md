---
{
    "title": "NOT_NULL_OR_EMPTY",
    "language": "zh-CN"
}
---

## not_null_or_empty
## 描述
## 语法

`BOOLEAN NOT_NULL_OR_EMPTY (VARCHAR str)`

如果字符串为空字符串或者NULL，返回false。否则，返回true。

## 举例

```
MySQL [(none)]> select not_null_or_empty(null);
+-------------------------+
| not_null_or_empty(NULL) |
+-------------------------+
|                       0 |
+-------------------------+

MySQL [(none)]> select not_null_or_empty("");
+-----------------------+
| not_null_or_empty('') |
+-----------------------+
|                     0 |
+-----------------------+

MySQL [(none)]> select not_null_or_empty("a");
+------------------------+
| not_null_or_empty('a') |
+------------------------+
|                      1 |
+------------------------+
```
### keywords
    NOT_NULL_OR_EMPTY
