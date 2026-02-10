---
{
"title": "SUB_REPLACE",
"language": "zh-CN"
}
---

## sub_replace
## 描述
## 语法

`VARCHAR sub_replace(VARCHAR str, VARCHAR new_str, INT start[, INT len])`

返回用new_str字符串替换str中从start开始长度为len的新字符串。
其中start,len为负整数，返回NULL, 且len的默认值为new_str的长度。

## 举例

```
mysql> select sub_replace("this is origin str","NEW-STR",1);
+-------------------------------------------------+
| sub_replace('this is origin str', 'NEW-STR', 1) |
+-------------------------------------------------+
| tNEW-STRorigin str                              |
+-------------------------------------------------+

mysql> select sub_replace("doris","***",1,2);
+-----------------------------------+
| sub_replace('doris', '***', 1, 2) |
+-----------------------------------+
| d***is                            |
+-----------------------------------+
```
### keywords
    SUB_REPLACE
