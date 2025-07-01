---
{
    "title": "CONCAT",
    "language": "zh-CN"
}
---

## concat
## 描述
## 语法

`VARCHAR concat(VARCHAR,...)`


将多个字符串连接起来, 如果参数中任意一个值是 NULL，那么返回的结果就是 NULL

## 举例

```
mysql> select concat("a", "b");
+------------------+
| concat('a', 'b') |
+------------------+
| ab               |
+------------------+

mysql> select concat("a", "b", "c");
+-----------------------+
| concat('a', 'b', 'c') |
+-----------------------+
| abc                   |
+-----------------------+

mysql> select concat("a", null, "c");
+------------------------+
| concat('a', NULL, 'c') |
+------------------------+
| NULL                   |
+------------------------+
```
### keywords
    CONCAT
