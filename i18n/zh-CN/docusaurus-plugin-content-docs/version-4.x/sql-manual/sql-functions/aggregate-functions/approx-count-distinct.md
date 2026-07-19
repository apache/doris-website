---
{
    "title": "APPROX_COUNT_DISTINCT",
    "language": "zh-CN",
    "description": "返回非 NULL 的不同元素数量。 基于 HyperLogLog 算法实现，使用固定大小的内存估算列基数。 该算法基于尾部零分布假设进行计算，具体精确程度取决于数据分布。基于 Doris 使用的固定桶大小，该算法相对标准误差为 0.8125% 更详细具体的分析，详见相关论文"
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
| `<expr>` | 用于计算的表达式。支持的类型包括 String、Date、DateTime、Timestamptz、IPv4、IPv6、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal。|

## 返回值

返回 BIGINT 类型的值。

## 举例

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_tinyint tinyint
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', 10),
    (1, 'banana', 20),
    (1, 'apple', 10),
    (2, 'orange', 30),
    (2, 'orange', 40),
    (2, 'grape', 50),
    (3, null, null);
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
