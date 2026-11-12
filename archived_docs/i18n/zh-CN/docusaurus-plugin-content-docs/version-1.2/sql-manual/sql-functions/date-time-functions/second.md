---
{
    "title": "SECOND",
    "language": "zh-CN"
}
---

## second
## 描述
## 语法

`INT SECOND(DATETIME date)`


获得日期中的秒的信息，返回值范围从0-59。

参数为Date或者Datetime类型

## 举例

```
mysql> select second('2018-12-31 23:59:59');
+-----------------------------+
| second('2018-12-31 23:59:59') |
+-----------------------------+
|                          59 |
+-----------------------------+
```
### keywords
    SECOND
