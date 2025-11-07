---
{
"title": "SUBSTRING_INDEX",
"language": "en"
}
---

## substring_index

### Name

:::tip Tips
This function is supported since the Apache Doris 1.2. version
:::

SUBSTRING_INDEX



### description

#### Syntax

`VARCHAR substring_index(VARCHAR content, VARCHAR delimiter, INT field)`

Split `content` to two parts at position where the `field`s of `delimiter` stays, return one of them according to below rules:
if `field` is positive, return the left part;
else if `field` is negative, return the right part;
if `field` is zero, return an empty string when `content` is not null, else will return null.

- `delimiter` is case sensitive and multi-byte safe.
- `delimiter` and `field` parameter should be constant.


### example

```
mysql> select substring_index("hello world", " ", 1);
+----------------------------------------+
| substring_index("hello world", " ", 1) |
+----------------------------------------+
| hello                                  |
+----------------------------------------+
mysql> select substring_index("hello world", " ", 2);
+----------------------------------------+
| substring_index("hello world", " ", 2) |
+----------------------------------------+
| hello world                            |
+----------------------------------------+
mysql> select substring_index("hello world", " ", -1);
+-----------------------------------------+
| substring_index("hello world", " ", -1) |
+-----------------------------------------+
| world                                   |
+-----------------------------------------+
mysql> select substring_index("hello world", " ", -2);
+-----------------------------------------+
| substring_index("hello world", " ", -2) |
+-----------------------------------------+
| hello world                             |
+-----------------------------------------+
mysql> select substring_index("hello world", " ", -3);
+-----------------------------------------+
| substring_index("hello world", " ", -3) |
+-----------------------------------------+
| hello world                             |
+-----------------------------------------+
mysql> select substring_index("hello world", " ", 0);
+----------------------------------------+
| substring_index("hello world", " ", 0) |
+----------------------------------------+
|                                        |
+----------------------------------------+
```
### keywords

    SUBSTRING_INDEX, SUBSTRING