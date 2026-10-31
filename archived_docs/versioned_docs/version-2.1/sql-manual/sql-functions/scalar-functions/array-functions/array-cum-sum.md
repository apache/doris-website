---
{
    "title": "ARRAY_CUM_SUM",
    "language": "en",
    "description": "Get the cumulative sum of an array (NULL values are skipped). If the array contains NULL values,"
}
---

## Description

Get the cumulative sum of an array (`NULL` values are skipped).
If the array contains `NULL` values, then `NULL` is set at the same position in the result array.

## Syntax

```sql
ARRAY_CUM_SUM(<arr>)
```

## Parameters

| Parameter | Description |
|---|---|
| `<arr>` | The array to calculate the cumulative sum from |

## Return Value

Returns an array. Special cases:
- `NULL` values in the array are skipped, and `NULL` is set at the same position in the result array.


## Example

```sql
create table array_type_table(
    k1 INT, 
    k2 Array<int>
) 
duplicate key (k1) 
distributed by hash(k1) buckets 1 
properties(
    'replication_num' = '1'
);
insert into array_type_table values (0, []), 
(1, [NULL]), 
(2, [1, 2, 3, 4]), 
(3, [1, NULL, 3, NULL, 5]);
select k2, array_cum_sum(k2) from array_type_table;
```
```text
+-----------------------+-----------------------+
| k2                    | array_cum_sum(`k2`)   |
+-----------------------+-----------------------+
| []                    | []                    |
| [NULL]                | [NULL]                |
| [1, 2, 3, 4]          | [1, 3, 6, 10]         |
| [1, NULL, 3, NULL, 5] | [1, NULL, 4, NULL, 9] |
+-----------------------+-----------------------+
```