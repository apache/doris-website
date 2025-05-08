---
{
    "title": "JSON_EXISTS_PATH",
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

It is used to judge whether the field specified by json_path exists in the JSON data. If it exists, it returns TRUE, and if it does not exist, it returns FALSE

## Syntax

```sql
JSON_EXISTS_PATH (<json_str>,  <path>)
```

## Alias

* JSONB_EXISTS_PATH

## Parameters
| Parameter           | Description                                                     |
|--------------|--------------------------------------------------------|
| `<json_str>` | The element to be included in the JSON array. It can be a value of any type, including NULL. If no element is specified, an empty array is returned.
| `<path>`     | The JSON path to be judged. If it is NULL, then return NULL.                      |

## Return Values
If it exists, return TRUE; if it does not exist, return FALSE.

## Examples

```sql
SELECT JSON_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.name');
```
```text
+---------------------------------------------------------------------------+
| jsonb_exists_path(cast('{"id": 123, "name": "doris"}' as JSON), '$.name') |
+---------------------------------------------------------------------------+
|                                                                         1 |
+---------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.age');
```
```text
+--------------------------------------------------------------------------+
| jsonb_exists_path(cast('{"id": 123, "name": "doris"}' as JSON), '$.age') |
+--------------------------------------------------------------------------+
|                                                                        0 |
+--------------------------------------------------------------------------+
```
```sql
SELECT JSONB_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.age');
```
```text
+--------------------------------------------------------------------------+
| jsonb_exists_path(cast('{"id": 123, "name": "doris"}' as JSON), '$.age') |
+--------------------------------------------------------------------------+
|                                                                        0 |
+--------------------------------------------------------------------------+
```

