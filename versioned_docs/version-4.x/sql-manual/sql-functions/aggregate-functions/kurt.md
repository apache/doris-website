---
{
    "title": "KURT,KURT_POP,KURTOSIS",
    "language": "en"
}
---


## Description

The KURTOSIS function calculates the [kurtosis](https://en.wikipedia.org/wiki/Kurtosis) of the data. The formula used is: fourth central moment / (variance squared) - 3.

## Alias

KURT_POP, KURTOSIS

## Syntax

```sql
KURTOSIS(<expr>)
KURT_POP(<expr>)
KURT(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The expression to calculate, type Double supported. |

## Return Value

Returns a DOUBLE value.
Returns NULL when variance is zero.
Returns NULL when there is no valid data in the group.

## Example

```sql
-- setup
create table statistic_test(
    tag int,
    val1 double,
    val2 double
) distributed by hash(tag) buckets 1
properties ("replication_num"="1");
insert into statistic_test values
    (1, -10, -10),
    (2, -20, null),
    (3, 100, null),
    (4, 100, null),
    (5, 1000, 1000);
```

```sql
select kurt(val1), kurt(val2) from statistic_test;
```

```text
+---------------------+------------+
| kurt(val1)          | kurt(val2) |
+---------------------+------------+
| 0.16212458373485106 |         -2 |
+---------------------+------------+
```

```sql
select kurt(val1), kurt(val2) from statistic_test group by tag;
```

```text
+------------+------------+
| kurt(val1) | kurt(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```

