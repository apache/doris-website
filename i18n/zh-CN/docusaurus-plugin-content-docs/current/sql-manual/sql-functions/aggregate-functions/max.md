---
{
    "title": "MAX",
    "language": "zh-CN"
}
---

## 描述

MAX 函数返回表达式的最大值。

## 语法

```sql
MAX(<expr>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 需要获取值的表达式，支持类型为 String，Time，Date，DateTime，IPv4，IPv6，TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal。 |

## 返回值

返回与输入表达式相同的数据类型。

## 举例

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_decimal decimal(10, 2)
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', 10.01),
    (1, 'banana', 20.02),
    (2, 'orange', 30.03),
    (2, null, null),
    (3, null, null);
```

```sql
select k1, max(k_string) from t1 group by k1;
```

String 类型：对于每个分组，返回最大的字符串值。

```text
+------+---------------+
| k1   | max(k_string) |
+------+---------------+
|    1 | banana        |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```

```sql
select k1, max(k_decimal) from t1 group by k1;
```

Decimal 类型：返回最大的高精度小数值。

```text
+------+----------------+
| k1   | max(k_decimal) |
+------+----------------+
|    1 |          20.02 |
|    2 |          30.03 |
|    3 |           NULL |
+------+----------------+
```

```sql
select max(k_string) from t1 where k1 = 3;
```

当组内所有值都为 NULL 时，返回 NULL。

```text
+---------------+
| max(k_string) |
+---------------+
| NULL          |
+---------------+
```

```sql
select max(k_string) from t1;
```

所有数据的最大值。

```text
+---------------+
| max(k_string) |
+---------------+
| orange        |
+---------------+
```
