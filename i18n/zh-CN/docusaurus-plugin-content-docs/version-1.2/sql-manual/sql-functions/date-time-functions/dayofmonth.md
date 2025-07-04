---
{
    "title": "DAYOFMONTH",
    "language": "zh-CN"
}
---

## dayofmonth
## 描述
## 语法

`INT DAYOFMONTH(DATETIME date)`


获得日期中的天信息，返回值范围从1-31。

参数为Date或者Datetime类型

## 举例

```
mysql> select dayofmonth('1987-01-31');
+-----------------------------------+
| dayofmonth('1987-01-31 00:00:00') |
+-----------------------------------+
|                                31 |
+-----------------------------------+
```

### keywords

    DAYOFMONTH
