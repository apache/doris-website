---
{
    "title": "NULL_OR_EMPTY",
    "language": "zh-CN"
}
---

## null_or_empty
## 描述
## 语法

`BOOLEAN NULL_OR_EMPTY (VARCHAR str)`

如果字符串为空字符串或者NULL，返回true。否则，返回false。

## 举例

```
MySQL [(none)]> select null_or_empty(null);
+---------------------+
| null_or_empty(NULL) |
+---------------------+
|                   1 |
+---------------------+

MySQL [(none)]> select null_or_empty("");
+-------------------+
| null_or_empty('') |
+-------------------+
|                 1 |
+-------------------+

MySQL [(none)]> select null_or_empty("a");
+--------------------+
| null_or_empty('a') |
+--------------------+
|                  0 |
+--------------------+
```
### keywords
    NULL_OR_EMPTY
