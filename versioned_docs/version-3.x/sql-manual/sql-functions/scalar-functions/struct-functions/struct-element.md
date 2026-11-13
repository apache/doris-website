---
{
    "title": "STRUCT_ELEMENT",
    "language": "en",
    "description": "Return a specific field within a data column of a struct."
}
---

## Description

Return a specific field within a data column of a struct.

## Syntax

```sql
STRUCT_ELEMENT( <struct>, '<filed_location>/<filed_name>')
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<struct>` | If the input struct column is null, return null |
| `<filed_location>` | The position of the field starts from 1, and only constants are supported |
| `<filed_name>` | The field name must be a constant, case sensitive |

## Return Value

Return the specified field column, with the type being any type

## Example

```sql
select struct_element(named_struct('f1', 1, 'f2', 'a'), 'f2'),struct_element(named_struct('f1', 1, 'f2', 'a'), 1);
```

```text
+--------------------------------------------------------+-----------------------------------------------------+
| struct_element(named_struct('f1', 1, 'f2', 'a'), 'f2') | struct_element(named_struct('f1', 1, 'f2', 'a'), 1) |
+--------------------------------------------------------+-----------------------------------------------------+
| a                                                      |                                                   1 |
+--------------------------------------------------------+-----------------------------------------------------+
```

```sql
CREATE TABLE test_struct (
    id INT,
    struct_col STRUCT<f1: BIGINT, f2: BIGINT, f3: BIGINT, f4: BIGINT, f5: BIGINT>
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_struct VALUES
(1, NAMED_STRUCT('f1', 1, 'f2', 2, 'f3', 3, 'f4', 4, 'f5', 5)),
(2, NAMED_STRUCT('f1', 1, 'f2', 1000, 'f3', 10000000, 'f4', 100000000000, 'f5', 100000000000)),
(3, NAMED_STRUCT('f1', 5, 'f2', 4, 'f3', 3, 'f4', 2, 'f5', 1)),
(4, NULL),
(5, NAMED_STRUCT('f1', 1, 'f2', NULL, 'f3', 3, 'f4', NULL, 'f5', 5));

SELECT struct_col, STRUCT_ELEMENT(struct_col, 'f1') AS f1
FROM test_struct
ORDER BY id;
```

```text
+--------------------------------------------------------------------------+------+
| struct_col                                                               | f1   |
+--------------------------------------------------------------------------+------+
| {"f1":1, "f2":2, "f3":3, "f4":4, "f5":5}                                 | 1    |
| {"f1":1, "f2":1000, "f3":10000000, "f4":100000000000, "f5":100000000000} | 1    |
| {"f1":5, "f2":4, "f3":3, "f4":2, "f5":1}                                 | 5    |
| NULL                                                                     | NULL |
| {"f1":1, "f2":null, "f3":3, "f4":null, "f5":5}                           | 1    |
+--------------------------------------------------------------------------+------+
```
