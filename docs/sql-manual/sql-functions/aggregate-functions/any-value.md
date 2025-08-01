---
{
"title": "ANY_VALUE",
"language": "en"
}
---

## Description

Returns any value from the expression or column in the group. If there is a non-NULL value, it returns any non-NULL value; otherwise, it returns NULL.

## Alias

- ANY

## Syntax

```sql
ANY_VALUE(<expr>)
ANY(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The column or expression to be aggregated. Supported types are String, Date, DateTime, IPv4, IPv6, Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal. |

## Return Value

Returns any non-NULL value if a non-NULL value exists, otherwise returns NULL.
The return type is consistent with the input expr type.

## Example

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
    (1, 'apple', '2023-01-01', '2023-01-01 10:00:00', '192.168.1.1', '::1', true, 10, 100, 1000, 10000, 1.1, 1.11, 10.01),
    (2, 'orange', '2023-02-01', '2023-02-01 12:00:00', '10.0.0.1', '2001:db8::2', true, 30, 300, 3000, 30000, 3.3, 3.33, 30.03),
    (2, 'orange', '2023-02-01', '2023-02-01 12:00:00', '10.0.0.1', '2001:db8::2', false, 40, 400, 4000, 40000, 4.4, 4.44, 40.04),
    (2, 'grape', '2023-02-02', '2023-02-02 13:00:00', '10.0.0.2', '2001:db8::3', true, 50, 500, 5000, 50000, 5.5, 5.55, 50.05),
    (3, null, null, null, null, null, null, null, null, null, null, null, null, null);
```

```sql
select any_value(k_string) from t1;
```

String type: Get any value from all k_string values, NULL values are excluded.

```text
+---------------------+
| any_value(k_string) |
+---------------------+
| orange              |
+---------------------+
```

```sql
select any_value(k_date) from t1;
```

Date type: Get any value from all k_date values.

```text
+-------------------+
| any_value(k_date) |
+-------------------+
| 2023-01-01        |
+-------------------+
```

```sql
select any_value(k_datetime) from t1;
```

DateTime type: Get any value from all k_datetime values.

```text
+-----------------------+
| any_value(k_datetime) |
+-----------------------+
| 2023-01-01 10:00:00   |
+-----------------------+
```

```sql
select any_value(k_ipv4) from t1;
```

IPv4 type: Get any value from all k_ipv4 values.

```text
+-------------------+
| any_value(k_ipv4) |
+-------------------+
| 192.168.1.1       |
+-------------------+
```

```sql
select any_value(k_ipv6) from t1;
```

IPv6 type: Get any value from all k_ipv6 values.

```text
+-------------------+
| any_value(k_ipv6) |
+-------------------+
| ::1               |
+-------------------+
```

```sql
select any_value(k_bool) from t1;
```

Bool type: Get any value from all k_bool values.

```text
+-------------------+
| any_value(k_bool) |
+-------------------+
|                 1 |
+-------------------+
```

```sql
select any_value(k_tinyint) from t1;
```

TinyInt type: Get any value from all k_tinyint values.

```text
+----------------------+
| any_value(k_tinyint) |
+----------------------+
|                   10 |
+----------------------+
```

```sql
select any_value(k_smallint) from t1;
```

SmallInt type: Get any value from all k_smallint values.

```text
+-----------------------+
| any_value(k_smallint) |
+-----------------------+
|                   100 |
+-----------------------+
```

```sql
select any_value(k1) from t1;
```

Integer type: Get any value from all k1 values.

```text
+---------------+
| any_value(k1) |
+---------------+
|             1 |
+---------------+
```

```sql
select any_value(k_bigint) from t1;
```

BigInt type: Get any value from all k_bigint values.

```text
+---------------------+
| any_value(k_bigint) |
+---------------------+
|                1000 |
+---------------------+
```

```sql
select any_value(k_largeint) from t1;
```

LargeInt type: Get any value from all k_largeint values.

```text
+-----------------------+
| any_value(k_largeint) |
+-----------------------+
|                 10000 |
+-----------------------+
```

```sql
select any_value(k_float) from t1;
```

Float type: Get any value from all k_float values.

```text
+--------------------+
| any_value(k_float) |
+--------------------+
|                1.1 |
+--------------------+
```

```sql
select any_value(k_double) from t1;
```

Double type: Get any value from all k_double values.

```text
+---------------------+
| any_value(k_double) |
+---------------------+
|                1.11 |
+---------------------+
```

```sql
select any_value(k_decimal) from t1;
```

Decimal type: Get any value from all k_decimal values.

```text
+----------------------+
| any_value(k_decimal) |
+----------------------+
|                10.01 |
+----------------------+
```

```sql
select k1, any_value(k_string) from t1 group by k1;
```

Group by k1 and get any value from k_string in each group. When all records in a group are NULL, returns NULL.

```text
+------+---------------------+
| k1   | any_value(k_string) |
+------+---------------------+
|    1 | apple               |
|    2 | orange              |
|    3 | NULL                |
+------+---------------------+
```

```sql
select any(k_string) from t1;
```

Using alias ANY, same effect as ANY_VALUE.

```text
+---------------+
| any(k_string) |
+---------------+
| orange        |
+---------------+
```

```sql
select any_value(k_string) from t1 where k1 = 999;
```

When query result is empty, returns NULL.

```text
+---------------------+
| any_value(k_string) |
+---------------------+
| NULL                |
+---------------------+
```
