---
{
"title": "SUBSTR",
"language": "zh-CN"
}
---

## substr
## 描述
## 语法

`VARCHAR substr(VARCHAR content, INT start, INT length)`

求子字符串，返回第一个参数描述的字符串中从start开始长度为len的部分字符串。首字母的下标为1。

## 举例

```
mysql> select substr("Hello doris", 2, 1);
+-----------------------------+
| substr('Hello doris', 2, 1) |
+-----------------------------+
| e                           |
+-----------------------------+
mysql> select substr("Hello doris", 1, 2);
+-----------------------------+
| substr('Hello doris', 1, 2) |
+-----------------------------+
| He                          |
+-----------------------------+
```
### keywords
    SUBSTR
