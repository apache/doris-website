---
{
    "title": "MONTH",
    "language": "zh-CN"
}
---

## month
## 描述
## 语法

`INT MONTH(DATETIME date)`


返回时间类型中的月份信息，范围是1, 12

参数为Date或者Datetime类型

## 举例

```
mysql> select month('1987-01-01');
+-----------------------------+
| month('1987-01-01 00:00:00') |
+-----------------------------+
|                           1 |
+-----------------------------+
```

### keywords

    MONTH
