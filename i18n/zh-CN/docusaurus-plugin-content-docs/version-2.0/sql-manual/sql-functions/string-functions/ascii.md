---
{
    "title": "ASCII",
    "language": "zh-CN"
}
---

## ascii
## 描述
## 语法

`INT ascii(VARCHAR str)`


返回字符串第一个字符对应的 ascii 码

## 举例

```
mysql> select ascii('1');
+------------+
| ascii('1') |
+------------+
|         49 |
+------------+

mysql> select ascii('234');
+--------------+
| ascii('234') |
+--------------+
|           50 |
+--------------+
```
### keywords
    ASCII
