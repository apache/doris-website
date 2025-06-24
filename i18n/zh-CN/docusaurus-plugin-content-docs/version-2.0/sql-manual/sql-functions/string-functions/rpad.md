---
{
    "title": "RPAD",
    "language": "zh-CN"
}
---

## rpad
## 描述
## 语法

`VARCHAR rpad(VARCHAR str, INT len, VARCHAR pad)`


返回 str 中长度为 len（从首字母开始算起）的字符串。如果 len 大于 str 的长度，则在 str 的后面不断补充 pad 字符，直到该字符串的长度达到 len 为止。如果 len 小于 str 的长度，该函数相当于截断 str 字符串，只返回长度为 len 的字符串。len 指的是字符长度而不是字节长度。

除包含 NULL 值外，如果 pad 为空，则返回值为空串。

## 举例

```
mysql> SELECT rpad("hi", 5, "xy");
+---------------------+
| rpad('hi', 5, 'xy') |
+---------------------+
| hixyx               |
+---------------------+

mysql> SELECT rpad("hi", 1, "xy");
+---------------------+
| rpad('hi', 1, 'xy') |
+---------------------+
| h                   |
+---------------------+

mysql> SELECT rpad("", 0, "");
+-----------------+
| rpad('', 0, '') |
+-----------------+
|                 |
+-----------------+
```

### keywords
    RPAD
