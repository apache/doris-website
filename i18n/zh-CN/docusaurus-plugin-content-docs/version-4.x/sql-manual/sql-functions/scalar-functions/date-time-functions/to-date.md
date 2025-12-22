---
{
    "title": "TO_DATE",
    "language": "zh-CN",
    "description": "该函数等价于 CAST(<STRING> TO DATE)。"
}
---

## 描述

该函数等价于 `CAST(<STRING> TO DATE)`。

TO_DATE 函数用于将日期时间值转换为 DATE 类型（仅包含年月日，格式为 YYYY-MM-DD）。该函数会自动忽略输入中的时间部分（时、分、秒、微秒），仅提取日期部分进行转换。

## 语法
```sql
TO_DATE(`<datetime_value>`)
```

## 参数
| 参数               | 描述                 |
|------------------|--------------------|
| `<datetime_value>` | DATETIME 类型日期时间，支持 DATETIME ，datetime 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)    |

## 返回值

将输入日期时间提取其中的日期返回，类型为 DATE。
- 若输入 NULL ，返回 NULL
## 举例

```sql
-- 提取 datetime 中的日期部分
select to_date("2020-02-02 00:00:00");

+--------------------------------+
| to_date('2020-02-02 00:00:00') |
+--------------------------------+
| 2020-02-02                     |
+--------------------------------+

-- 输入 date，返回本身
select to_date("2020-02-02");
+-----------------------+
| to_date("2020-02-02") |
+-----------------------+
| 2020-02-02            |
+-----------------------+

-- 输入 NULL，返回 NULL
SELECT TO_DATE(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```