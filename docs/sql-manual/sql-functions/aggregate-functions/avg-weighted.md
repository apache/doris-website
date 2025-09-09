---
{
"title": "AVG_WEIGHTED",
"language": "en"
}
---

## Description

Calculates the weighted arithmetic mean, i.e., the result is the sum of the products of corresponding values and weights, divided by the total sum of weights. If the total sum of weights is 0, it will return NaN. The calculation is always performed using Double type.

## Syntax

```sql
AVG_WEIGHTED(<x>, <weight>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | It is the numeric expression for which the average needs to be calculated, and can be a column name, constant, or a complex numeric expression. Supported type is Double. |
| `<weight>` | It is a numeric expression, typically a column name, constant, or the result of another numeric calculation. Supported type is Double. |

## Return Value

The sum of the products of corresponding values and weights is accumulated, divided by the total sum of weights. If the total sum of weights equals 0, NaN will be returned.
The return type is always Double.

## Example

```sql
-- setup
create table t1(
        k1 int,
        k2 int,
        k3 decimal(10, 2),
        k4 double,
        category varchar(50)
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (10, 100, 5.5, 1.0, 'A'),
    (20, 200, 10.0, 2.0, 'A'),
    (30, 300, 15.5, 3.0, 'B'),
    (40, 400, 20.0, 4.0, 'B'),
    (50, 0, 25.0, 0.0, 'C'),
    (60, 600, 30.0, 5.0, 'C');
```

```sql
select avg_weighted(k2, k1) from t1;
```

Calculate the weighted average of all records: (100*10 + 200*20 + 300*30 + 400*40 + 0*50 + 600*60) / (10+20+30+40+50+60) ≈ 314.2857

```text
+----------------------+
| avg_weighted(k2, k1) |
+----------------------+
|    314.2857142857143 |
+----------------------+
```

```sql
select category, avg_weighted(k2, k1) from t1 group by category;
```

Group by category and calculate the weighted average for each group.

```text
+----------+----------------------+
| category | avg_weighted(k2, k1) |
+----------+----------------------+
| A        |   166.66666666666666 |
| B        |   357.14285714285717 |
| C        |   327.27272727272725 |
+----------+----------------------+
```

```sql
select avg_weighted(k2, 0) from t1;
```

When all weights are 0, returns NaN.

```text
+---------------------+
| avg_weighted(k2, 0) |
+---------------------+
|                 NaN |
+---------------------+
```

```sql
select avg_weighted(k2, k1) from t1 where k1 > 100;
```

When the query result is empty, returns NULL.

```text
+----------------------+
| avg_weighted(k2, k1) |
+----------------------+
|                 NULL |
+----------------------+
```
