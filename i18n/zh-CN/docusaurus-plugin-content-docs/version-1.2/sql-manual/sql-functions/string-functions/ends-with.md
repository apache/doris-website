---
{
    "title": "ENDS_WITH",
    "language": "zh-CN"
}
---

## ends_with
## 描述
## 语法

`BOOLEAN ENDS_WITH(VARCHAR str, VARCHAR suffix)`

如果字符串以指定后缀结尾，返回true。否则，返回false。任意参数为NULL，返回NULL。

## 举例

```
mysql> select ends_with("Hello doris", "doris");
+-----------------------------------+
| ends_with('Hello doris', 'doris') |
+-----------------------------------+
|                                 1 | 
+-----------------------------------+

mysql> select ends_with("Hello doris", "Hello");
+-----------------------------------+
| ends_with('Hello doris', 'Hello') |
+-----------------------------------+
|                                 0 | 
+-----------------------------------+
```
### keywords
    ENDS_WITH
