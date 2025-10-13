---
{
    "title": "DATE_SUB",
    "language": "zh-CN"
}
---

## 描述

从日期减去指定的时间间隔。

## 别名

- days_sub
- date_sub
- subdate

## 语法

```sql
DATE_ADD(<date>, <expr> <time_unit>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date>` | 合法的日期值 |
| `<expr>` | 希望减去的时间间隔 |
| `<time_unit>` | 枚举值：YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND |

## 返回值

返回计算后的日期。

## 举例

```sql
select date_sub('2010-11-30 23:59:59', INTERVAL 2 DAY);
```

```text
+-------------------------------------------------+
| date_sub('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-11-28 23:59:59                             |
+-------------------------------------------------+
```