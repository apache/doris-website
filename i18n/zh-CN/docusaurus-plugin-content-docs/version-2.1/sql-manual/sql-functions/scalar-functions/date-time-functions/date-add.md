---
{
    "title": "DATE_ADD",
    "language": "zh-CN",
    "description": "向日期添加指定的时间间隔。"
}
---

## 描述

向日期添加指定的时间间隔。

## 别名

- date_add
- days_add
- adddate

## 语法

```sql
DATE_ADD(<date>, <expr> <time_unit>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date>` | 合法的日期值 |
| `<expr>` | 希望添加的时间间隔 |
| `<time_unit>` | 枚举值：YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND |

## 返回值

返回计算后的日期。

## 举例

```sql
select date_add('2010-11-30 23:59:59', INTERVAL 2 DAY);
```

```text
+-------------------------------------------------+
| date_add('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-12-02 23:59:59                             |
+-------------------------------------------------+
```