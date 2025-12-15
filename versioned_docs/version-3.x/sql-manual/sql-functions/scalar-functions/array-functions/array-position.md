---
{
    "title": "ARRAY_POSITION",
    "language": "en"
}
---

## description

Returns a position/index of first occurrence of the `value` in the given array.

## Syntax

```sql
ARRAY_POSITION(<arr>, <value>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<arr>` | ARRAY array |
| `<value>` | Element to search for |

## Return Value

The position of the value in the array (starting from 1). Special cases:
- 0, if the value does not exist in the array.
- NULL, if the array is NULL.

## example

```sql
CREATE TABLE array_test (
                            id INT,
                            c_array ARRAY<INT>,
                            array_position INT
)
    duplicate key (id)
distributed by hash(id) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_test (id, c_array, array_position) VALUES
                                                         (1, [1, 2, 3, 4, 5], 5),
                                                         (2, [6, 7, 8], 0),
                                                         (3, [], 0),
                                                         (4, NULL, NULL);
SELECT id,c_array,array_position(c_array, 5) FROM `array_test`;
```
```text
+------+-----------------+------------------------------+
| id   | c_array         | array_position(`c_array`, 5) |
+------+-----------------+------------------------------+
|    1 | [1, 2, 3, 4, 5] |                            5 |
|    2 | [6, 7, 8]       |                            0 |
|    3 | []              |                            0 |
|    4 | NULL            |                         NULL |
+------+-----------------+------------------------------+
```
```sql
select array_position([1, null], null);
```
```text
+--------------------------------------+
| array_position(ARRAY(1, NULL), NULL) |
+--------------------------------------+
|                                    2 |
+--------------------------------------+
```

