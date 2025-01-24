---
{
    "title": "JSON_SET",
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
The json_set function inserts or updates data in a JSON and returns the result.

## Syntax
```sql
JSON_SET (<json_str>,  <path>,  <val> [, <path>,  <val>, ...])
```

## Parameters

| Parameter    | Description                                                                                                                      |
|-------|-------------------------------------------------------------------------------------------------------------------------|
| `<jsonStr>` | The JSON object to be inserted. It can be a JSON object with elements of any type, including NULL. If no elements are specified, an empty array is returned. If json_str is not a valid JSON or any path parameter is not a valid path expression or contains a * wildcard, an error is returned. |
| `<jsonPath>` | The JSON path to be inserted. If it is NULL, then return NULL.                                                                                       |
| `<val>` | The value to be inserted into the JSON. If it is NULL, then a NULL value will be inserted at the corresponding position.                                                                    |

## Return Values
Returns a JSON value.

`json_set` function inserts or updates data in a JSON and returns the result.Returns NULL if `json_str` or `path` is NULL. Otherwise, an error occurs if the `json_str` argument is not a valid JSON or any path argument is not a valid path expression or contains a * wildcard.

The path-value pairs are evaluated left to right.

A path-value pair for an existing path in the json overwrites the existing json value with the new value. A path-value pair for a nonexisting path in the json adds the value to the json if the path identifies one of these types of values:

* A member not present in an existing object. The member is added to the object and associated with the new value.

* A position past the end of an existing array. The array is extended with the new value. If the existing value is not an array, it is autowrapped as an array, then extended with the new value.

Otherwise, a path-value pair for a nonexisting path in the json is ignored and has no effect.

## Examples

```sql
select json_set(null, null, null);
```
```text
+------------------------------+
| json_set(NULL, NULL, 'NULL') |
+------------------------------+
| NULL                         |
+------------------------------+
```
```sql
select json_set('{"k": 1}', "$.k", 2);
``` 
```text
+------------------------------------+
| json_set('{\"k\": 1}', '$.k', '2') |
+------------------------------------+
| {"k":2}                            |
+------------------------------------+
```
```sql
select json_set('{"k": 1}', "$.j", 2);
```
```text
+------------------------------------+
| json_set('{\"k\": 1}', '$.j', '2') |
+------------------------------------+
| {"k":1,"j":2}                      |
+------------------------------------+
```
