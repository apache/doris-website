---
{
    "title": "APPROX_COUNT_DISTINCT",
    "language": "zh-CN"
}
---

## 描述

返回非 NULL 的不同元素数量。
基于 HyperLogLog 算法实现，使用固定大小的内存估算列基数。
该算法基于尾部零分布假设进行计算，具体精确程度取决于数据分布。基于 Doris 使用的固定桶大小，该算法相对标准误差为 0.8125%
更详细具体的分析，详见[相关论文](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)

## 语法

```sql
APPROX_COUNT_DISTINCT(<expr>)
NDV(<expr>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 需要获取值的表达式，支持类型为 String，Date，DateTime，IPv4，IPv6，Bool，TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal。|

## 返回值

返回 BIGINT 类型的值。

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
    (1, 'apple', '2023-01-01', '2023-01-01 10:00:00', '192.168.1.1', '::1', true, 10, 100, 1000, 10000, 1.1, 1.11, 10.01),
    (2, 'orange', '2023-02-01', '2023-02-01 12:00:00', '10.0.0.1', '2001:db8::2', true, 30, 300, 3000, 30000, 3.3, 3.33, 30.03),
    (2, 'orange', '2023-02-01', '2023-02-01 12:00:00', '10.0.0.1', '2001:db8::2', false, 40, 400, 4000, 40000, 4.4, 4.44, 40.04),
    (2, 'grape', '2023-02-02', '2023-02-02 13:00:00', '10.0.0.2', '2001:db8::3', true, 50, 500, 5000, 50000, 5.5, 5.55, 50.05),
    (3, null, null, null, null, null, null, null, null, null, null, null, null, null);
```

```sql
select approx_count_distinct(k_string) from t1;
```

String 类型：计算所有 k_string 值的近似去重数量，NULL 值不参与计算。

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

Date 类型：计算所有 k_date 值的近似去重数量。

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

DateTime 类型：计算所有 k_datetime 值的近似去重数量。

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

IPv4 类型：计算所有 k_ipv4 值的近似去重数量。

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

IPv6 类型：计算所有 k_ipv6 值的近似去重数量。

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

Bool 类型：计算所有 k_bool 值的近似去重数量。

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

TinyInt 类型：计算所有 k_tinyint 值的近似去重数量。

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

SmallInt 类型：计算所有 k_smallint 值的近似去重数量。

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

Integer 类型：计算所有 k1 值的近似去重数量。

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

BigInt 类型：计算所有 k_bigint 值的近似去重数量。

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

LargeInt 类型：计算所有 k_largeint 值的近似去重数量。

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

Float 类型：计算所有 k_float 值的近似去重数量。

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

Double 类型：计算所有 k_double 值的近似去重数量。

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

Decimal 类型：计算所有 k_decimal 值的近似去重数量。

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

按 k1 分组，计算每组中 k_string 的近似去重数量。组内记录都为 NULL 时，返回 0。

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

使用别名 NDV 的效果与 APPROX_COUNT_DISTINCT 相同。

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

当查询结果为空时，返回 0。

```text
+---------------------------------+
| approx_count_distinct(k_string) |
+---------------------------------+
|                               0 |
+---------------------------------+
```
