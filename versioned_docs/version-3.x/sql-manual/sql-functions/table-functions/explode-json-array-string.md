---
{
    "title": "EXPLODE_JSON_ARRAY_STRING",
    "language": "en",
    "description": "The explodejsonarraystring table function accepts a JSON array, where each element is of string type,"
}
---

## Description

The `explode_json_array_string` table function accepts a JSON array, where each element is of string type, and expands each string in the array into multiple rows, with each row containing one string. It is used in conjunction with LATERAL VIEW.

`explode_json_array_string_outer` is similar to `explode_json_array_string`, but the handling of NULL values is different.

If the JSON string itself is NULL, the `OUTER` version will return one row, with the value as NULL. The normal version will completely ignore such records.

If the JSON array is empty, the `OUTER` version will return one row, with the value as NULL. The normal version will return no results.

## Syntax
```sql
EXPLODE_JSON_ARRAY_STRING(<json>)
EXPLODE_JSON_ARRAY_STRING_OUTER(<json>)
```

## Return Value

| Parameter | Description |
| -- | -- |
| `<json>` | json type |

## Parameters

Expands the JSON array, creating a row for each element, returning a string column.

## Examples

```sql
CREATE TABLE json_array_example (
    id INT,
    json_array STRING
)DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS AUTO
PROPERTIES (
"replication_allocation" = "tag.location.default: 1");
```

```sql
INSERT INTO json_array_example (id, json_array) VALUES
(1, '[1, 2, 3, 4, 5]'),
(2, '[1.1, 2.2, 3.3, 4.4]'),
(3, '["apple", "banana", "cherry"]'),
(4, '[{"a": 1}, {"b": 2}, {"c": 3}]'),
(5, '[]'),
(6, 'NULL');
```

```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_STRING(json_array) tmp1 AS e1
WHERE id = 3;
```

```text
+------+--------+
| id   | e1     |
+------+--------+
|    3 | apple  |
|    3 | banana |
|    3 | cherry |
+------+--------+
```

```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_STRING(json_array) tmp1 AS e1
WHERE id = 6;
Empty set (0.02 sec)
```

```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_STRING_OUTER(json_array) tmp1 AS e1
WHERE id = 6;
```

```text
+------+------+
| id   | e1   |
+------+------+
|    6 | NULL |
+------+------+
```