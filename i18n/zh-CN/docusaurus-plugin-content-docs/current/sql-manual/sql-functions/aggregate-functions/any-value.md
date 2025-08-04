---
{
    "title": "ANY_VALUE",
    "language": "zh-CN"
}
---

## 描述

返回分组中表达式或列的任意一个值。如果存在非 NULL 值，返回任意非 NULL 值，否则返回 NULL。

## 别名

- ANY

## 语法

```sql
ANY_VALUE(<expr>)
ANY(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要聚合的列或表达式，支持类型为 String，Date，DateTime，IPv4，IPv6，Bool，TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal。 |

## 返回值

如果存在非 NULL 值，返回任意非 NULL 值，否则返回 NULL。
返回值的类型与输入的 expr 类型一致。

## 举例

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_date date,
        k_datetime datetime,
        k_ipv4 ipv4,
        k_ipv6 ipv6,
        k_bool boolean,
        k_tinyint tinyint,
        k_smallint smallint,
        k_bigint bigint,
        k_largeint largeint,
        k_float float,
        k_double double,
        k_decimal decimal(10, 2)
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', '2023-01-01', '2023-01-01 10:00:00', '192.168.1.1', '::1', true, 10, 100, 1000, 10000, 1.1, 1.11, 10.01),
    (1, 'banana', '2023-01-02', '2023-01-02 11:00:00', '192.168.1.2', '2001:db8::1', false, 20, 200, 2000, 20000, 2.2, 2.22, 20.02),
    (2, 'orange', '2023-02-01', '2023-02-01 12:00:00', '10.0.0.1', '2001:db8::2', true, 30, 300, 3000, 30000, 3.3, 3.33, 30.03),
    (2, null, null, null, null, null, null, null, null, null, null, null, null, null),
    (3, null, null, null, null, null, null, null, null, null, null, null, null, null);
```

```sql
select k1, any_value(k_string) from t1 group by k1;
```

String 类型：对于每个分组，返回任意一个非 NULL 值。

```text
+------+-------------------+
| k1   | any_value(k_string) |
+------+-------------------+
|    1 | apple             |
|    2 | orange            |
|    3 | NULL              |
+------+-------------------+
```

```sql
select k1, any_value(k_date) from t1 group by k1;
```

Date 类型：返回任意一个非 NULL 的日期值。

```text
+------+-----------------+
| k1   | any_value(k_date) |
+------+-----------------+
|    1 | 2023-01-01      |
|    2 | 2023-02-01      |
|    3 | NULL            |
+------+-----------------+
```

```sql
select k1, any_value(k_datetime) from t1 group by k1;
```

DateTime 类型：返回任意一个非 NULL 的日期时间值。

```text
+------+---------------------+
| k1   | any_value(k_datetime) |
+------+---------------------+
|    1 | 2023-01-01 10:00:00 |
|    2 | 2023-02-01 12:00:00 |
|    3 | NULL                |
+------+---------------------+
```

```sql
select k1, any_value(k_ipv4) from t1 group by k1;
```

IPv4 类型：返回任意一个非 NULL 的 IPv4 地址值。

```text
+------+-----------------+
| k1   | any_value(k_ipv4) |
+------+-----------------+
|    1 | 192.168.1.1     |
|    2 | 10.0.0.1        |
|    3 | NULL            |
+------+-----------------+
```

```sql
select k1, any_value(k_ipv6) from t1 group by k1;
```

IPv6 类型：返回任意一个非 NULL 的 IPv6 地址值。

```text
+------+-----------------+
| k1   | any_value(k_ipv6) |
+------+-----------------+
|    1 | ::1             |
|    2 | 2001:db8::2     |
|    3 | NULL            |
+------+-----------------+
```

```sql
select k1, any_value(k_bool) from t1 group by k1;
```

Bool 类型：返回任意一个非 NULL 的布尔值。

```text
+------+-----------------+
| k1   | any_value(k_bool) |
+------+-----------------+
|    1 |               1 |
|    2 |               1 |
|    3 |            NULL |
+------+-----------------+
```

```sql
select k1, any_value(k_tinyint) from t1 group by k1;
```

TinyInt 类型：返回任意一个非 NULL 的微小整数值。

```text
+------+--------------------+
| k1   | any_value(k_tinyint) |
+------+--------------------+
|    1 |                 10 |
|    2 |                 30 |
|    3 |               NULL |
+------+--------------------+
```

```sql
select k1, any_value(k_decimal) from t1 group by k1;
```

Decimal 类型：返回任意一个非 NULL 的高精度小数值。

```text
+------+--------------------+
| k1   | any_value(k_decimal) |
+------+--------------------+
|    1 |              10.01 |
|    2 |              30.03 |
|    3 |               NULL |
+------+--------------------+
```

```sql
select any_value(k_string) from t1 where k1 = 3;
```

当组内所有值都为 NULL 时，返回 NULL。

```text
+-------------------+
| any_value(k_string) |
+-------------------+
|              NULL |
+-------------------+
```

```sql
select k1, any(k_string) from t1 group by k1;
```

使用别名 ANY 的效果与 ANY_VALUE 相同。

```text
+------+---------------+
| k1   | any(k_string) |
+------+---------------+
|    1 | apple         |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```
