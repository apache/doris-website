---
{
    "title": "MINUTE",
    "language": "zh-CN"
}
---

## minute
## 描述
## 语法

`INT MINUTE(DATETIME date)`


获得日期中的分钟的信息，返回值范围从0-59。

参数为Date或者Datetime类型

## 举例

```
mysql> select minute('2018-12-31 23:59:59');
+-----------------------------+
| minute('2018-12-31 23:59:59') |
+-----------------------------+
|                          59 |
+-----------------------------+
```
### keywords
    MINUTE
