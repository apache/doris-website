---
{
    "title": "EXPLODE_SPLIT",
    "language": "en",
    "description": "The explodesplit table function is used to split a string into multiple substrings based on a specified delimiter and expand each substring into a "
}
---

## Description

The `explode_split` table function is used to split a string into multiple substrings based on a specified delimiter and expand each substring into a separate row. Each substring is returned as an individual row, and it is typically used with LATERAL VIEW to break down long strings into individual parts for more granular queries.

`explode_split_outer` is similar to `explode_split`, but it differs in the way it handles empty or NULL strings.

## Syntax

```sql
EXPLODE_SPLIT(<str>, <delimiter>)
EXPLODE_SPLIT_OUTER(<str>, <delimiter>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | String type |
| `<delimiter>` | Delimiter |

## Return Value

Returns a sequence of the split substrings. If the string is empty or NULL, no rows are returned.

## Examples

```sql
select * from example1 order by k1;
```

```text
+------+---------+
| k1   | k2      |
+------+---------+
|    1 |         |
|    2 | NULL    |
|    3 | ,       |
|    4 | 1       |
|    5 | 1,2,3   |
|    6 | a, b, c |
+------+---------+
```

```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 1 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    1 |      |
+------+------+
```

```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 2 order by k1, e1;
Empty set
```

```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 3 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    3 |      |
+------+------+
```

```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 4 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    4 | 1    |
+------+------+
```

```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 5 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    5 | 2    |
|    5 | 3    |
|    5 | 1    |
+------+------+
```

```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 6 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    6 |  b   |
|    6 |  c   |
|    6 | a    |
+------+------+
```

```sql
CREATE TABLE example2 (
    id INT,
    str string null
)DUPLICATE KEY(id)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
"replication_allocation" = "tag.location.default: 1");
```

```sql
insert into example2 values (1,''),(2,NUll),(3,"1"),(4,"1,2,3"),(5,"a,b,c");
```

```sql
select id, e1 from example2 lateral view explode_split(str, ',') tmp1 as e1 where id = 2 order by id, e1;
Empty set (0.02 sec)
```

```sql
select id, e1 from example2 lateral view explode_split_outer(str, ',') tmp1 as e1 where id = 2 order by id, e1;
```

```text
+------+------+
| id   | e1   |
+------+------+
|    2 | NULL |
+------+------+
```