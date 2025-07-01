---
{
    "title": "SPLIT_PART",
    "language": "en"
}
---

## split_part
### Description
#### Syntax

`VARCHAR split_part(VARCHAR content, VARCHAR delimiter, INT field)`


Returns the specified partition by splitting the string according to the delimiter. If field is positive, splitting and counting from the beginning of content, otherwise from the ending.

`delimiter` and `field` parameter should be constant.

### example

```
mysql> select split_part("hello world", " ", 1);
+----------------------------------+
| split_part('hello world', ' ', 1) |
+----------------------------------+
| hello                            |
+----------------------------------+


mysql> select split_part("hello world", " ", 2);
+----------------------------------+
| split_part('hello world', ' ', 2) |
+----------------------------------+
| world                             |
+----------------------------------+

mysql> select split_part("2019年7月8号", "月", 1);
+-----------------------------------------+
| split_part('2019年7月8号', '月', 1)     |
+-----------------------------------------+
| 2019年7                                 |
+-----------------------------------------+

mysql> select split_part("abca", "a", 1);
+----------------------------+
| split_part('abca', 'a', 1) |
+----------------------------+
|                            |
+----------------------------+

mysql> select split_part("prefix_string", "_", -1);
+--------------------------------------+
| split_part('prefix_string', '_', -1) |
+--------------------------------------+
| string                               |
+--------------------------------------+


mysql> select split_part("prefix_string", "_", -2);
+--------------------------------------+
| split_part('prefix_string', '_', -2) |
+--------------------------------------+
| prefix                               |
+--------------------------------------+

mysql> select split_part("abc##123###234", "##", -1);
+----------------------------------------+
| split_part('abc##123###234', '##', -1) |
+----------------------------------------+
| 234                                    |
+----------------------------------------+

mysql> select split_part("abc##123###234", "##", -2);
+----------------------------------------+
| split_part('abc##123###234', '##', -2) |
+----------------------------------------+
| 123#                                   |
+----------------------------------------+
```
### keywords
    SPLIT_PART,SPLIT,PART
