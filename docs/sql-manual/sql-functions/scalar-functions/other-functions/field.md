---
{
    "title": "FIELD",
    "language": "en",
    "description": "Returns the position of the first occurrence of <expr> in the list of values <param> [, ...]. If <expr> is not found, the function returns 0."
}
---

## Description

Returns the position of the first occurrence of `<expr>` in the list of values `<param> [, ...]`.  
If `<expr>` is not found, the function returns `0`. This function is commonly used in `ORDER BY` to implement custom sorting.

## Syntax

```sql
FIELD(<expr>, <param> [, ...])
```

## Parameters

| Parameter  | Description                                             |
|------------|---------------------------------------------------------|
| `<expr>`   | The value to be searched in the list of parameters.     |
| `<param>`  | A sequence of values to compare against `<expr>`.       |

## Return Value

- Returns the position (1-based index) of `<expr>` in the list of `<param>` values.  
- If `<expr>` is not found, returns `0`.  
- If `<expr>` is `NULL`, returns `0`.

## Examples

```sql
-- setup
CREATE TABLE baseall (k1 INT, k7 VARCHAR(64))
DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO baseall VALUES
    (1, 'wangjing04'),
    (2, 'wangyu14'),
    (3, 'yuanyuan06');

CREATE TABLE class_test (class_name VARCHAR(64))
DISTRIBUTED BY HASH(class_name) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO class_test VALUES
    ('Suzi'), ('Suzi'),
    ('Ben'), ('Ben'),
    ('Henry'), ('Henry'),
    (NULL);
```

```sql
SELECT FIELD(2, 3, 1, 2, 5);
```

```text
+----------------------+
| FIELD(2, 3, 1, 2, 5) |
+----------------------+
|                    3 |
+----------------------+
```

```sql
SELECT k1, k7 FROM baseall WHERE k1 IN (1,2,3) ORDER BY FIELD(k1, 2, 1, 3);
```

```text
+------+------------+
| k1   | k7         |
+------+------------+
|    2 | wangyu14   |
|    1 | wangjing04 |
|    3 | yuanyuan06 |
+------+------------+
```

Custom string ordering. `FIELD` returns `0` for values not in the list — including `NULL`, which is why the `NULL` row sorts to the top in the ascending default:

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry');
```

```text
+------------+
| class_name |
+------------+
| NULL       |
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```

Descending — `NULL` (FIELD = 0) is now last:

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry') DESC;
```

```text
+------------+
| class_name |
+------------+
| Henry      |
| Henry      |
| Ben        |
| Ben        |
| Suzi       |
| Suzi       |
| NULL       |
+------------+
```

You can also use `NULLS FIRST` / `NULLS LAST` to control `NULL` placement independently of the sort direction:

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry') NULLS FIRST;
```

```text
+------------+
| class_name |
+------------+
| NULL       |
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```