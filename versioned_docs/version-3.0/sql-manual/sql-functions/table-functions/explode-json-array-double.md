---
{
"title": "EXPLODE_JSON_ARRAY_DOUBLE",
"language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Description

The `explode_json_array_double` table function accepts a JSON array, where each element is of double-precision floating-point type, and expands each floating-point number in the array into multiple rows, with each row containing one floating-point number. It is used in conjunction with LATERAL VIEW.

`explode_json_array_double_outer` is similar to `explode_json_array_double`, but the handling of NULL values is different.

If the JSON string itself is NULL, the `OUTER` version will return one row, with the value as NULL. The normal version will completely ignore such records.

If the JSON array is empty, the `OUTER` version will return one row, with the value as NULL. The normal version will return no results.

## Syntax
```sql
EXPLODE_JSON_ARRAY_DOUBLE(<json>)
EXPLODE_JSON_ARRAY_DOUBLE_OUTER(<json>)
```

## Return Value

| Parameter | Description |
| -- | -- |
| `<json>` | json type |

## Parameters

Expands the JSON array, creating a row for each element, returning a double-precision floating-point column.

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
LATERAL VIEW EXPLODE_JSON_ARRAY_DOUBLE(json_array) tmp1 AS e1
WHERE id = 2;
```

```text
+------+------+
| id   | e1   |
+------+------+
|    2 |  1.1 |
|    2 |  2.2 |
|    2 |  3.3 |
|    2 |  4.4 |
+------+------+
```

```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_DOUBLE(json_array) tmp1 AS e1
WHERE id = 6;
Empty set (0.01 sec)
```

```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_DOUBLE_OUTER(json_array) tmp1 AS e1
WHERE id = 6;
```

```text
+------+------+
| id   | e1   |
+------+------+
|    6 | NULL |
+------+------+
```