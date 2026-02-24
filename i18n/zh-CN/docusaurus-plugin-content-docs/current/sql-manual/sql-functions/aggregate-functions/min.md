---
{
    "title": "MIN",
    "language": "zh-CN",
    "description": "MIN 函数返回表达式的最小非 NULL 值。"
}
---

## 描述

MIN 函数返回表达式的最小非 NULL 值。

## 语法

```sql
MIN(<expr>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 用于计算的表达式。支持的类型包括 String、Time、Date、DateTime、Timestamptz、IPv4、IPv6、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Array。 |

## 返回值

返回与输入表达式相同的数据类型。
如果组内所有记录均为 NULL，则函数返回 NULL。

## 举例

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_decimal decimal(10, 2),
        k_array array<int>
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', 10.01, [10, 20, 30]),
    (1, 'banana', 20.02, [10, 20]),
    (2, 'orange', 30.03, [10, 20, 40]),
    (2, null, null, [10, 20, null]),
    (3, null, null, null);
```

```sql
select k1, min(k_string) from t1 group by k1;
```

String 类型：对于每个分组，返回最小的字符串值。

```text
+------+---------------+
| k1   | min(k_string) |
+------+---------------+
|    1 | apple         |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```

```sql
select k1, min(k_decimal) from t1 group by k1;
```

Decimal 类型：返回最小的高精度小数值。

```text
+------+----------------+
| k1   | min(k_decimal) |
+------+----------------+
|    1 |          10.01 |
|    2 |          30.03 |
|    3 |           NULL |
+------+----------------+
```

```sql
select k1, min(k_array) from t1 group by k1;
```

Array 类型: 返回最小的数组值（逐元素比较大小，null为最小元素）。

```text
+------+----------------+
| k1   | min(k_array)   |
+------+----------------+
|    1 | [10, 20]       |
|    2 | [10, 20, null] |
|    3 | NULL           |
+------+----------------+
```

```sql
select min(k_string) from t1 where k1 = 3;
```

当组内所有值都为 NULL 时，返回 NULL。

```text
+---------------+
| min(k_string) |
+---------------+
| NULL          |
+---------------+
```

```sql
select min(k_string) from t1;
```

返回所有数据的最小值。

```text
+---------------+
| min(k_string) |
+---------------+
| apple         |
+---------------+
```
