---
{
"title": "SUBSTRING_INDEX",
"language": "zh-CN"
}
---

## substring_index

### Name

<version since="1.2">

SUBSTRING_INDEX

</version>

## 描述

## 语法

`VARCHAR substring_index(VARCHAR content, VARCHAR delimiter, INT field)`

返回 content 的子字符串，在 delimiter 出现 field 次的位置按如下规则截取：  
如果 field > 0，则从左边算起，返回截取位置前的子串；  
如果 field < 0，则从右边算起，返回截取位置后的子串；
如果 field = 0，返回一个空串（`content` 不为null）, 或者Null （`content` = null）。

- delimiter 大小写敏感，且是多字节安全的。
- `delimiter` 和 `field` 参数需要是常量, 不支持变量。

## 举例

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