---
{
"title": "EXPLODE_JSON_ARRAY_INT",
"language": "en"
}
---

## Description

The `explode_json_array_int` table function accepts a JSON array, where each element is of integer type, and expands each integer in the array into multiple rows, with each row containing one integer. It is used in conjunction with LATERAL VIEW.

`explode_json_array_int_outer` is similar to `explode_json_array_int`, but the handling of NULL values is different.

If the JSON string itself is NULL, the `OUTER` version will return one row, with the value as NULL. The normal version will completely ignore such records.

If the JSON array is empty, the `OUTER` version will return one row, with the value as NULL. The normal version will return no results.

## Syntax
```sql
EXPLODE_JSON_ARRAY_INT(<json>)
EXPLODE_JSON_ARRAY_INT_OUTER(<json>)
```

## Return Value

| Parameter | Description |
| -- | -- |
| `<json>` | json type |

## Parameters

Expands the JSON array, creating a row for each element, returning an integer column.

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
LATERAL VIEW EXPLODE_JSON_ARRAY_INT(json_array) tmp1 AS e1
WHERE id = 1;
```

```text
+------+------+
| id   | e1   |
+------+------+
|    1 |    1 |
|    1 |    2 |
|    1 |    3 |
|    1 |    4 |
|    1 |    5 |
+------+------+
```

```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_INT(json_array) tmp1 AS e1
WHERE id = 5;
Empty set (0.01 sec)
```

```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_INT_OUTER(json_array) tmp1 AS e1
WHERE id = 5;
```

```text
+------+------+
| id   | e1   |
+------+------+
|    5 | NULL |
+------+------+
```