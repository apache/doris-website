---
{
    "title": "DAYNAME",
    "language": "zh-CN"
}
---

## dayname
## 描述
## 语法

`VARCHAR DAYNAME(DATE)`


返回日期对应的日期名字

参数为Date或者Datetime类型

## 举例

```
mysql> select dayname('2007-02-03 00:00:00');
+--------------------------------+
| dayname('2007-02-03 00:00:00') |
+--------------------------------+
| Saturday                       |
+--------------------------------+
```

### keywords
    DAYNAME
