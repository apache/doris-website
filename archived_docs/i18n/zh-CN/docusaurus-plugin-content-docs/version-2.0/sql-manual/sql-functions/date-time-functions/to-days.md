---
{
    "title": "TO_DAYS",
    "language": "zh-CN"
}
---

## to_days
## 描述
## 语法

`INT TO_DAYS(DATETIME date)`


返回date距离0000-01-01的天数

参数为Date或者Datetime类型

## 举例

```
mysql> select to_days('2007-10-07');
+-----------------------+
| to_days('2007-10-07') |
+-----------------------+
|                733321 |
+-----------------------+
```

### keywords

    TO_DAYS,TO,DAYS
