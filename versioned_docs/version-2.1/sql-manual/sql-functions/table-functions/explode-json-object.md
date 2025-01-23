---
{
"title": "EXPLODE_JSON_OBJECT",
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

`explode_json_object` expands a JSON object into multiple rows, with each row containing a key-value pair. It is typically used to process JSON data and expand the JSON object into a more queryable format. This function only supports non-empty JSON objects.

`explode_json_object_outer` is similar to `explode_json_object`, but with different behavior when handling empty and NULL values. It can retain empty or NULL JSON objects and return corresponding records.

## Syntax
```sql
EXPLODE_JSON_OBJECT(<json>)
EXPLODE_JSON_OBJECT_OUTER(<json>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<json>` | json type |

## Return Value

When the JSON object is neither empty nor NULL, the return values of `explode_json_object` and `explode_json_object_outer` are the same. Each key-value pair generates one row, with the key as one column and the value as another column.

When the JSON object is empty or NULL:

`explode_json_object` will not return any rows.
`explode_json_object_outer` will return one row, with the expanded columns being NULL.

## Examples

```sql
CREATE TABLE example (
    id INT,
    value_json json
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
"replication_allocation" = "tag.location.default: 1");
```

```sql
INSERT INTO example VALUES
(1, '{"key1": "value1", "key2": "value2"}'),
(2, '{}'),
(3, NULL);
```

```sql
select * from example;
```

```text
+------+-----------------------------------+
| id   | value_json                        |
+------+-----------------------------------+
|    2 | {}                                |
|    1 | {"key1":"value1","key2":"value2"} |
|    3 | NULL                              |
+------+-----------------------------------+
```

```sql
SELECT id, k, v
FROM example
LATERAL VIEW explode_json_object(value_json) exploded_table AS k , v;
```

```text
+------+------+----------+
| id   | k    | v        |
+------+------+----------+
|    1 | key1 | "value1" |
|    1 | key2 | "value2" |
+------+------+----------+
```

```sql
SELECT id, k, v
FROM example
LATERAL VIEW explode_json_object_outer(value_json) exploded_table AS k, v;
```

```text
+------+------+----------+
| id   | k    | v        |
+------+------+----------+
|    3 | NULL | NULL     |
|    1 | key1 | "value1" |
|    1 | key2 | "value2" |
|    2 | NULL | NULL     |
+------+------+----------+
```