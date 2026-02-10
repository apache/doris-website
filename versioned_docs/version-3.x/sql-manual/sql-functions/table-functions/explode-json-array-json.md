---
{
    "title": "EXPLODE_JSON_ARRAY_JSON",
    "language": "en",
    "description": "The explodejsonarrayjson table function accepts a JSON array, where each element is of JSON object type,"
}
---

## Description

The `explode_json_array_json` table function accepts a JSON array, where each element is of JSON object type, and expands each JSON object in the array into multiple rows, with each row containing one JSON object. It is used in conjunction with LATERAL VIEW.

## Syntax
```sql
EXPLODE_JSON_ARRAY_JSON(<json>)
EXPLODE_JSON_ARRAY_JSON_OUTER(<json>)
```

## Return Value

| Parameter | Description |
| -- | -- |
| `<json>` | json type |

## Parameters

Expands the JSON array, creating a row for each element, returning a JSON object column.

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
LATERAL VIEW EXPLODE_JSON_ARRAY_JSON(json_array) tmp1 AS e1
WHERE id = 4;
```

```text
+------+---------+
| id   | e1      |
+------+---------+
|    4 | {"a":1} |
|    4 | {"b":2} |
|    4 | {"c":3} |
+------+---------+
```