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
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The column or expression to be aggregated. |

## Return Value

Returns any non-NULL value if a non-NULL value exists, otherwise returns NULL.
The return type is consistent with the input expr type.

## Example

```sql
-- setup
create table t1(
        k1 int,
        k2 varchar(100)
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple'),
    (1, 'banana'),
    (2, 'orange'),
    (2, null),
    (3, null);
```

```sql
select k1, any_value(k2) from t1 group by k1;
```

For each group, returns any non-NULL value. For the k1=1 group, it may return 'apple' or 'banana'.

```text
+------+---------------+
| k1   | any_value(k2) |
+------+---------------+
|    1 | apple         |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```


```sql
select any_value(k2) from t1 where k1 = 3;
```

When all values in the group are NULL, returns NULL.

```text
+---------------+
| any_value(k2) |
+---------------+
|          NULL |
+---------------+
```

```sql
select k1, any(k2) from t1 group by k1;
```

Using the alias ANY has the same effect as ANY_VALUE.

```text
+------+--------+
| k1   | any(k2) |
+------+--------+
|    1 | apple  |
|    2 | orange |
|    3 | NULL   |
+------+--------+
```
