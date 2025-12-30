---
{
    "title": "ARRAY_CONCAT",
    "language": "en",
    "description": "Concat all arrays passed in the arguments"
}
---

## Description

Concat all arrays passed in the arguments

## Syntax
```sql
ARRAY_CONCAT(<arr1> [,<arr2> , ...])
```

## Parameters
| Parameter | Description    |
|---|---|
| `<arr1>` | The source array |
| `<arr2>` | The array to be appended to arr1 |

## Return Value

The concatenated array. Special cases:
- If an array is NULL (not `[NULL]`), the function returns NULL.

## Example

```sql
select array_concat([1, 2], [7, 8], [5, 6]);
```
```text
+-----------------------------------------------------+
| array_concat(ARRAY(1, 2), ARRAY(7, 8), ARRAY(5, 6)) |
+-----------------------------------------------------+
| [1, 2, 7, 8, 5, 6]                                  |
+-----------------------------------------------------+
```
```sql
select array_concat([1, 2], [7, 8], [5, 6], NULL);
```
```text
+--------------------------------------------+
| array_concat([1, 2], [7, 8], [5, 6], NULL) |
+--------------------------------------------+
| NULL                                       |
+--------------------------------------------+
```

```sql
CREATE TABLE array_test (
    id int,
    col2 ARRAY<INT>,
    col3 ARRAY<INT>
)
duplicate key (id)
distributed by hash(id) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_test (id, col2, col3) VALUES
(1,[1, 2, 3], [3, 4, 5]),
(2,[1, NULL, 2], [NULL]),
(3,[1, 2, 3], NULL),
(4,[], []);

select col2, col3, array_concat(col2, col3) from array_test;
```
```text
+--------------+-----------+------------------------------+
| col2         | col3      | array_concat(`col2`, `col3`) |
+--------------+-----------+------------------------------+
| [1, 2, 3]    | [3, 4, 5] | [1, 2, 3, 3, 4, 5]           |
| [1, NULL, 2] | [NULL]    | [1, NULL, 2, NULL]           |
| [1, 2, 3]    | NULL      | NULL                         |
| []           | []        | []                           |
+--------------+-----------+------------------------------+
```