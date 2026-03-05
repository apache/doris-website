---
{
    "title": "LAST_DAY",
    "language": "zh-CN",
    "description": "返回输入日期所在月份的最后一天的日期。根据不同月份，返回日期的具体日期值为："
}
---

## 描述

返回输入日期所在月份的最后一天的日期。根据不同月份，返回日期的具体日期值为：

- 28 日：非闰年的二月
- 29 日：闰年的二月
- 30 日：四月、六月、九月、十一月
- 31 日：一月、三月、五月、七月、八月、十月、十二月

该函数与 mysql 中的 [last_day 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_last-day) 行为一致。

## 语法

```sql
LAST_DAY(`<date_or_time_expr>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date_or_time_expr>` | 参数是合法的日期表达式，支持输入 date/datetime 类型,具体 datetime，date格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## 返回值

返回 DATE 类型的值，表示输入日期所在月份的最后一天（格式为 YYYY-MM-DD）。

- 若输入参数为 NULL，返回 NULL。

## 举例

```sql

---输入 DATE 类型，返回闰年二月最后一天
mysql> SELECT LAST_DAY('2000-02-03');
+------------------------+
| LAST_DAY('2000-02-03') |
+------------------------+
| 2000-02-29             |
+------------------------+

---输入 DATETIME 类型，忽略时间部分
mysql> SELECT LAST_DAY('2023-04-15 12:34:56');
+---------------------------------+
| LAST_DAY('2023-04-15 12:34:56') |
+---------------------------------+
| 2023-04-30                      |
+---------------------------------+

---非闰年的二月
mysql> SELECT LAST_DAY('2021-02-01');
+------------------------+
| LAST_DAY('2021-02-01') |
+------------------------+
| 2021-02-28             |
+------------------------+

---大月（31 天）示例
mysql> SELECT LAST_DAY('2023-01-10');
+------------------------+
| LAST_DAY('2023-01-10') |
+------------------------+
| 2023-01-31             |
+------------------------+

---输入为 NULL，返回 NULL
mysql> SELECT LAST_DAY(NULL);
+----------------+
| LAST_DAY(NULL) |
+----------------+
| NULL           |
+----------------+
```