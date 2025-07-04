---
{
    "title": "YEAR_OF_WEEK",
    "language": "zh-CN"
}
---

## year_of_week

year_of_week

## 描述

求 `ISO week date` 标准的周年，与年的区别可以参见 [ISO周日历](https://zh.wikipedia.org/wiki/ISO%E9%80%B1%E6%97%A5%E6%9B%86) 。

## 别名

- yow

## 语法


```sql
SMALLINT year_of_week(DATE value)
```


## 参数

| 参数 | 说明 |
| -- | -- |
| `<value>` | 需要求周年的日期 |

## 返回值

返回 `ISO week date` 标准的周年。

## 举例

```
mysql> select year_of_week('2005-01-01');
+-----------------------------+
| year_of_week('2005-01-01')  |
+-----------------------------+
|                        2004 |
+-----------------------------+
```

### keywords

    YEAR_OF_WEEK
