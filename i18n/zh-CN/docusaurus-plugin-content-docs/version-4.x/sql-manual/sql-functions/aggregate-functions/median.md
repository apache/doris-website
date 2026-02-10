---
{
    "title": "MEDIAN",
    "language": "zh-CN",
    "description": "MEDIAN 函数返回表达式的中位数，等价于 percentile(expr, 0.5)。"
}
---

## 描述

MEDIAN 函数返回表达式的中位数，等价于 percentile(expr, 0.5)。

## 语法

```sql
MEDIAN(<expr>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 需要获取值的表达式，支持类型：Double、Float、LargeInt、BigInt、Int、SmallInt、TinyInt。 |

## 返回值

返回与输入表达式相同的数据类型。
如果组内没有合法数据，则返回 NULL 。

## 举例

```sql
-- setup
create table log_statis(
    datetime datetime,
    scan_rows int
) distributed by hash(datetime) buckets 1
properties ("replication_num"="1");
insert into log_statis values
    ('2025-08-25 10:00:00', 10),
    ('2025-08-25 10:00:00', 50),
    ('2025-08-25 10:00:00', 100),
    ('2025-08-25 11:00:00', 20),
    ('2025-08-25 11:00:00', 30),
    ('2025-08-25 11:00:00', 40);
```

```sql
select datetime,median(scan_rows) from log_statis group by datetime;
```

```text
select datetime, median(scan_rows) from log_statis group by datetime;
+---------------------+-------------------+
| datetime            | median(scan_rows) |
+---------------------+-------------------+
| 2025-08-25 10:00:00 |                50 |
| 2025-08-25 11:00:00 |                30 |
+---------------------+-------------------+
```

```sql
select median(scan_rows) from log_statis group by datetime;
```

```text
select median(scan_rows) from log_statis where scan_rows is null;
+-------------------+
| median(scan_rows) |
+-------------------+
|              NULL |
+-------------------+
```


