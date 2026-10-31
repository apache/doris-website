---
{
    "title": "MONTHNAME",
    "language": "zh-CN"
}
---

## monthname
## 描述
## 语法

`VARCHAR MONTHNAME(DATE)`


返回日期对应的月份名字

参数为Date或者Datetime类型

## 举例

```
mysql> select monthname('2008-02-03 00:00:00');
+----------------------------------+
| monthname('2008-02-03 00:00:00') |
+----------------------------------+
| February                         |
+----------------------------------+
```

### keywords

    MONTHNAME
