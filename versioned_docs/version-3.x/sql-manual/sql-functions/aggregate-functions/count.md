---
{
"title": "COUNT",
"language": "en"
}
---

## Description

Returns the number of non-NULL records in the specified column, or the total number of records.

## Syntax

```sql
COUNT(DISTINCT <expr> [,<expr>,...])
COUNT(*)
COUNT(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Conditional expression (column name) |

## Return Value

The return value is of numeric type. If expr is NULL, there will be no parameter statistics.

## Example

```sql
select * from test_count;
```

```text
+------+------+------+
| id   | name | sex  |
+------+------+------+
|    1 | 1    |    1 |
|    2 | 2    |    1 |
|    3 | 3    |    1 |
|    4 | 0    |    1 |
|    4 | 4    |    1 |
|    5 | NULL |    1 |
+------+------+------+
```

```sql
select count(*) from test_count;
```

```text
+----------+
| count(*) |
+----------+
|        6 |
+----------+
```

```sql
select count(name) from test_insert;
```

```text
+-------------+
| count(name) |
+-------------+
|           5 |
+-------------+
```

```sql
select count(distinct sex) from test_insert;
```

```text
+---------------------+
| count(DISTINCT sex) |
+---------------------+
|                   1 |
+---------------------+
```

```sql
select count(distinct id,sex) from test_insert;
```

```text
+-------------------------+
| count(DISTINCT id, sex) |
+-------------------------+
|                       5 |
+-------------------------+
```
