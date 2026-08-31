---
{
    "title": "DATE | Date Time Functions",
    "language": "zh-CN",
    "description": "DATE 函数从 DATETIME 或 TIMESTAMP_NS 值中提取日期部分，并忽略时间和小数秒字段；返回值类型为 DATE，输入为 NULL 时返回 NULL。",
    "sidebar_label": "DATE"
}
---

# DATE

## 描述

DATE 函数从 `DATETIME` 或 `TIMESTAMP_NS` 值中提取日期部分，忽略时间和小数秒字段。

该函数与 mysql 中的 [date 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date) 行为一致

## 语法

```sql
DATE(<date_or_time_part>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date_or_time_part>` | `DATETIME` 或 `TIMESTAMP_NS` 表达式。 |

## 返回值

若输入有效，返回 DATE 类型的纯日期值（格式为 YYYY-MM-DD），不含时间部分。

特殊情况：
- 输入为 NULL 时，返回 NULL；

## 举例

```sql
---提取日期时间中的日期部分
mysql> select date(cast('2010-12-02 19:28:30' as datetime));
+-----------------------------------------------+
| date(cast('2010-12-02 19:28:30' as datetime)) |
+-----------------------------------------------+
| 2010-12-02                                    |
+-----------------------------------------------+

--- 提取日期中的日期部分
mysql> select date(cast('2015-11-02' as date));
+----------------------------------+
| date(cast('2015-11-02' as date)) |
+----------------------------------+
| 2015-11-02                       |
+----------------------------------+

---输入为NULL
mysql> select date(NULL);
+------------+
| date(NULL) |
+------------+
| NULL       |
+------------+

```
