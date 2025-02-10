---
{
    "title": "JSON_REPLACE",
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
The JSON_REPLACE function is used to update data in a JSON and return the result.

## Syntax
```sql
JSON_REPLACE (<json_str>, <path>, <val>[, <jsonPath>, <val>, ...])
```

## Parameters
| Parameter           | Description                                                                                          |
|--------------|---------------------------------------------------------------------------------------------|
| `<json_str>`  | The JSON data to be replaced. It can be a JSON object with elements of any type, including NULL. If no elements are specified, an empty array is returned. If json_str is not a valid JSON, an error will be returned. |
| `<path>` | The JSON path to be replaced.                                                          |
| `<val>`      | The value to replace the value corresponding to the JSON_PATH Key. If it is NULL, then a NULL value will be inserted at the corresponding position.                     |

## Return Values

`json_replace` function updates data in a JSON and returns the result.Returns NULL if `json_str` or `path` is NULL. Otherwise, an error occurs if the `json_str` argument is not a valid JSON or any path argument is not a valid path expression or contains a * wildcard.

The path-value pairs are evaluated left to right.

A path-value pair for an existing path in the json overwrites the existing json value with the new value.

Otherwise, a path-value pair for a nonexisting path in the json is ignored and has no effect.

### Examples

```sql
select json_replace(null, null, null);
```
```text
+----------------------------------+
| json_replace(NULL, NULL, 'NULL') |
+----------------------------------+
| NULL                             |
+----------------------------------+
```
```sql
select json_replace('{"k": 1}', "$.k", 2);
```
```text
+----------------------------------------+
| json_replace('{\"k\": 1}', '$.k', '2') |
+----------------------------------------+
| {"k":2}                                |
+----------------------------------------+
```
```sql
select json_replace('{"k": 1}', "$.j", 2);
```
```text
+----------------------------------------+
| json_replace('{\"k\": 1}', '$.j', '2') |
+----------------------------------------+
| {"k":1}                                |
+----------------------------------------+
```
```sql
select json_replace(null, null, 's');
```
```text
+--------------------------------------+
| json_replace(NULL, NULL, 's', '006') |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```
