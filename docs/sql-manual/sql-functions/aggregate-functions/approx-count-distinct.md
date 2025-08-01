---
{
    "title": "APPROX_COUNT_DISTINCT",
    "language": "en"
}
---

## Description

Returns the number of distinct non-NULL elements.
This function is implemented based on the HyperLogLog algorithm, which uses a fixed size of memory to estimate the column base. The algorithm is based on the assumption of a null distribution in the tails, and the accuracy depends on the data distribution. Based on the fixed bucket size used by Doris, the relative standard error of the algorithm is 0.8125%.
For a more detailed and specific analysis, see [related paper](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)

## Syntax

```sql
APPROX_COUNT_DISTINCT(<expr>)
NDV(<expr>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr>` | The expression to get the value. Supported types are String, Date, DateTime, IPv4, IPv6, Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal. |

## Return Value

Returns a value of type BIGINT.

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
select approx_count_distinct(k_string) from t1;
```

String type: Calculate the approximate distinct count of all k_string values, NULL values are not included in the calculation.

```text
+---------------------------------+
| approx_count_distinct(k_string) |
+---------------------------------+
|                               4 |
+---------------------------------+
```

```sql
select approx_count_distinct(k_date) from t1;
```

Date type: Calculate the approximate distinct count of all k_date values.

```text
+-------------------------------+
| approx_count_distinct(k_date) |
+-------------------------------+
|                             4 |
+-------------------------------+
```

```sql
select approx_count_distinct(k_datetime) from t1;
```

DateTime type: Calculate the approximate distinct count of all k_datetime values.

```text
+-----------------------------------+
| approx_count_distinct(k_datetime) |
+-----------------------------------+
|                                 4 |
+-----------------------------------+
```

```sql
select approx_count_distinct(k_ipv4) from t1;
```

IPv4 type: Calculate the approximate distinct count of all k_ipv4 values.

```text
+-------------------------------+
| approx_count_distinct(k_ipv4) |
+-------------------------------+
|                             4 |
+-------------------------------+
```

```sql
select approx_count_distinct(k_ipv6) from t1;
```

IPv6 type: Calculate the approximate distinct count of all k_ipv6 values.

```text
+-------------------------------+
| approx_count_distinct(k_ipv6) |
+-------------------------------+
|                             4 |
+-------------------------------+
```

```sql
select approx_count_distinct(k_bool) from t1;
```

Bool type: Calculate the approximate distinct count of all k_bool values.

```text
+-------------------------------+
| approx_count_distinct(k_bool) |
+-------------------------------+
|                             2 |
+-------------------------------+
```

```sql
select approx_count_distinct(k_tinyint) from t1;
```

TinyInt type: Calculate the approximate distinct count of all k_tinyint values.

```text
+----------------------------------+
| approx_count_distinct(k_tinyint) |
+----------------------------------+
|                                5 |
+----------------------------------+
```

```sql
select approx_count_distinct(k_smallint) from t1;
```

SmallInt type: Calculate the approximate distinct count of all k_smallint values.

```text
+-----------------------------------+
| approx_count_distinct(k_smallint) |
+-----------------------------------+
|                                 5 |
+-----------------------------------+
```

```sql
select approx_count_distinct(k1) from t1;
```

Integer type: Calculate the approximate distinct count of all k1 values.

```text
+---------------------------+
| approx_count_distinct(k1) |
+---------------------------+
|                         3 |
+---------------------------+
```

```sql
select approx_count_distinct(k_bigint) from t1;
```

BigInt type: Calculate the approximate distinct count of all k_bigint values.

```text
+---------------------------------+
| approx_count_distinct(k_bigint) |
+---------------------------------+
|                               5 |
+---------------------------------+
```

```sql
select approx_count_distinct(k_largeint) from t1;
```

LargeInt type: Calculate the approximate distinct count of all k_largeint values.

```text
+-----------------------------------+
| approx_count_distinct(k_largeint) |
+-----------------------------------+
|                                 5 |
+-----------------------------------+
```

```sql
select approx_count_distinct(k_float) from t1;
```

Float type: Calculate the approximate distinct count of all k_float values.

```text
+--------------------------------+
| approx_count_distinct(k_float) |
+--------------------------------+
|                              5 |
+--------------------------------+
```

```sql
select approx_count_distinct(k_double) from t1;
```

Double type: Calculate the approximate distinct count of all k_double values.

```text
+---------------------------------+
| approx_count_distinct(k_double) |
+---------------------------------+
|                               5 |
+---------------------------------+
```

```sql
select approx_count_distinct(k_decimal) from t1;
```

Decimal type: Calculate the approximate distinct count of all k_decimal values.

```text
+----------------------------------+
| approx_count_distinct(k_decimal) |
+----------------------------------+
|                                5 |
+----------------------------------+
```

```sql
select k1, approx_count_distinct(k_string) from t1 group by k1;
```

Group by k1 and calculate the approximate distinct count of k_string in each group. When all records in the group are NULL, returns 0.

```text
+------+---------------------------------+
| k1   | approx_count_distinct(k_string) |
+------+---------------------------------+
|    1 |                               2 |
|    2 |                               2 |
|    3 |                               0 |
+------+---------------------------------+
```

```sql
select ndv(k_string) from t1;
```

Using alias NDV has the same effect as APPROX_COUNT_DISTINCT.

```text
+---------------+
| ndv(k_string) |
+---------------+
|             4 |
+---------------+
```

```sql
select approx_count_distinct(k_string) from t1 where k1 = 999;
```

When the query result is empty, returns 0.

```text
+---------------------------------+
| approx_count_distinct(k_string) |
+---------------------------------+
|                               0 |
+---------------------------------+
```
