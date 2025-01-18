---
{
"title": "JSON_LENGTH",
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
The JSON_LENGTH function returns the length or number of elements of a given JSON document. If the JSON document is an array, the number of elements in the array is returned; if the JSON document is an object, the number of key-value pairs in the object is returned. Returns NULL if the JSON document is empty or invalid.

## Syntax
`JSON_LENGTH(JSON <json_str>, <json_path>)`

## Required Parameters

| parameters| described|
|------|------|
| `<json_str>`| The length of the JSON string needs to be checked. |

## Optional Parameters
| parameters| described|
|------|------|
| `<rhs>`| If a path is specified, the JSON_LENGTH() function returns the length of the data that matches the path in the JSON document, otherwise it returns the length of the JSON document|

## Usage Notes
This function calculates the length of a JSON document based on the following rules:
- The length of the scalar is 1. For example: '1','"x "','true',' false', and 'null' are all of length 1.
- The length of an array is the number of array elements. For example: '[1,2]' has length 2.
- The length of an object is the number of object members. For example: '{"x": 1}' has length 1

## Return Value

- For a JSON array, returns the number of elements in the array.
- For JSON objects, returns the number of key-value pairs in the object.
- Returns NULL for invalid JSON strings.
- For other types (such as strings, numbers, booleans, null, etc.), NULL is returned.

## Examples

```sql
SELECT json_length('{"k1":"v31","k2":300}');
```

```sql
+--------------------------------------+
| json_length('{"k1":"v31","k2":300}') |
+--------------------------------------+
| 2 |
+--------------------------------------+
```
```sql
SELECT json_length('"abc"');
```
```sql
+----------------------+
| json_length('"abc"') |
+----------------------+
| 1 |
+----------------------+
```
```sql
SELECT json_length('{"x": 1, "y": [1, 2]}', '$.y');
```
```sql
+---------------------------------------------+
| json_length('{"x": 1, "y": [1, 2]}', '$.y') |
+---------------------------------------------+
| 2 |
+---------------------------------------------+
```