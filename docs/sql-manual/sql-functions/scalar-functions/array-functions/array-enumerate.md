---
{
    "title": "ARRAY_ENUMERATE",
    "language": "en"
}
---

## Description
Returns array sub item indexes e.g. [1, 2, 3, …, length (arr) ]

## Syntax
```sql
ARRAY_ENUMERATE(<arr>)
```

## Parameters
| Parameter | Description |
|---|---|
| `<arr>` | The array that returns array sub item indexes |

## Return Value
Returns an array containing the index of the array.

## Example
```sql
create table array_type_table(
    k1 INT, 
    k2 Array<STRING>
) 
duplicate key (k1)
distributed by hash(k1) buckets 1 
properties(
    'replication_num' = '1'
);
insert into array_type_table values (0, []), 
("1", [NULL]), 
("2", ["1", "2", "3"]), 
("3", ["1", NULL, "3"]), 
("4", NULL);
select k2, array_enumerate(k2) from array_type_table;
```
```text
+------------------+-----------------------+
| k2               | array_enumerate(`k2`) |
+------------------+-----------------------+
| []               | []                    |
| [NULL]           | [1]                   |
| ['1', '2', '3']  | [1, 2, 3]             |
| ['1', NULL, '3'] | [1, 2, 3]             |
| NULL             | NULL                  |
+------------------+-----------------------+
```