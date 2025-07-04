---
{
    "title": "STARTS_WITH",
    "language": "zh-CN"
}
---

## starts_with
## 描述
## 语法

`BOOLEAN STARTS_WITH(VARCHAR str, VARCHAR prefix)`

如果字符串以指定前缀开头，返回true。否则，返回false。任意参数为NULL，返回NULL。

## 举例

```
MySQL [(none)]> select starts_with("hello world","hello");
+-------------------------------------+
| starts_with('hello world', 'hello') |
+-------------------------------------+
|                                   1 |
+-------------------------------------+

MySQL [(none)]> select starts_with("hello world","world");
+-------------------------------------+
| starts_with('hello world', 'world') |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```
### keywords
    STARTS_WITH
