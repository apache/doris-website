---
{
"title": "JSON_CONTAINS",
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

This function is used to check whether a JSON document contains a specified JSON element. If the specified element exists in the JSON document, it returns 1; otherwise, it returns 0. If the JSON document or the queried element is invalid, it returns `NULL`.

## Syntax

`JSON_CONTAINS(<json_str>,  <candidate> [,  <json_path>])`

## Required Parameters

| Parameter   | Description                                         |
|-------------|-----------------------------------------------------|
| `<json_str>` | The JSON string to be checked.                      |
| `<candidate>` | The JSON element to check for inclusion.            |

## Optional Parameters

| Parameter   | Description                                         |
|-------------|-----------------------------------------------------|
| `<json_path>` | An optional JSON path to specify the subdocument to check. If not provided, the root document is used by default. |

## Return Value
- If `json_elem` exists in `json_doc`, it returns 1.
- If `json_elem` does not exist in `json_doc`, it returns 0.
- If any parameter is invalid or the JSON document format is incorrect, it returns `NULL`.

## Examples

```sql

SET @j = '{"a": 1, "b": 2, "c": {"d": 4}}';
SET @j2 = '1';
SELECT JSON_CONTAINS(@j, @j2, '$.a');

```

```sql

+-------------------------------+
| JSON_CONTAINS(@j, @j2, '$.a') |
+-------------------------------+
|                             1 |
+-------------------------------+

```
```sql

SELECT JSON_CONTAINS(@j, @j2, '$.b');
+-------------------------------+
| JSON_CONTAINS(@j, @j2, '$.b') |
+-------------------------------+
|                             0 |
+-------------------------------+

```
```sql

SET @j2 = '{"d": 4}';
SELECT JSON_CONTAINS(@j, @j2, '$.a');

```

```sql

+-------------------------------+
| JSON_CONTAINS(@j, @j2, '$.a') |
+-------------------------------+
|                             0 |
+-------------------------------+
```

```sql

SELECT JSON_CONTAINS(@j, @j2, '$.c');

```

```sql

+-------------------------------+
| JSON_CONTAINS(@j, @j2, '$.c') |
+-------------------------------+
|                             1 |
+-------------------------------+

```

```sql

SELECT json_contains('[1, 2, {"x": 3}]', '1');
+----------------------------------------+
| json_contains('[1, 2, {"x": 3}]', '1') |
+----------------------------------------+
|                                      1 |
+----------------------------------------+

```



