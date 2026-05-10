---
{
    "title": "COVAR_SAMP",
    "language": "zh-CN",
    "description": "计算两个变量之间的样本协方差，如果输入变量存在 NULL，则该行不计入统计数据。"
}
---

## 描述

计算两个变量之间的样本协方差，如果输入变量存在 NULL，则该行不计入统计数据。

## 语法

```sql
COVAR_SAMP(<expr1>, <expr2>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr1>` | 用于计算的表达式之一，支持类型为 Double 。 |
| `<expr2>` | 用于计算的表达式之一，支持类型为 Double 。 |

## 返回值

返回 expr1 和 expr2 的样本协方差，返回类型为 Double。
如果组内没有有效数据，返回 NULL 。

## 举例

```sql
-- setup
create table baseall(
    id int,
    x double,
    y double
) distributed by hash(id) buckets 1
properties ("replication_num"="1");

insert into baseall values
    (1, 1.0, 2.0),
    (2, 2.0, 3.0),
    (3, 3.0, 4.0),
    (4, 4.0, NULL),
    (5, NULL, 5.0);
```

```sql
select covar_samp(x,y) from baseall;
```

```text
+-----------------+
| covar_samp(x,y) |
+-----------------+
|               1 |
+-----------------+
```

```sql
select id, covar_samp(x, y) from baseall group by id;
```

```text
+------+------------------+
| id   | covar_samp(x, y) |
+------+------------------+
|    1 |                0 |
|    2 |                0 |
|    3 |                0 |
|    4 |             NULL |
|    5 |             NULL |
+------+------------------+
```
