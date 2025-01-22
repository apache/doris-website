---
{
    "title": "GET_JSON_STRING",
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

This function is used to extract a field's value from a JSON document and convert it to `STRING` type. It returns the field value at the specified path. If the value cannot be converted to a string, or if the field at the specified path does not exist, it returns `NULL`.

## Syntax

```sql
GET_JSON_STRING( <json_str>, <json_path>)
```

## Required Parameters

| Parameter   | Description                                           |
|-------------|-------------------------------------------------------|
| `<json_str>` | The JSON string from which data needs to be extracted. |
| `<json_path>` | JSON path that specifies the field's location. The path can use dot notation. |

## Return Value
It returns the `STRING` value of the field at the specified path.
If the specified path does not point to a valid field or the field value cannot be converted to a `STRING` type, it returns `NULL`.

## Usage Notes

Parses and retrieves the string content of the specified path in the JSON string.
The `<json_path>` must start with the `$` symbol, using `.` as the path delimiter. If the path contains a `.`, it should be enclosed in double quotes.
Use `[ ]` to indicate array indices, starting from 0.
The path should not contain `", [`, and `]`.
If the `<json_str>` format is incorrect, or if the `<json_path>` format is invalid, or if no matching field is found, `NULL` is returned.

Additionally, it is recommended to use the `jsonb` type and `jsonb_extract_XXX` functions to achieve the same functionality.

Special case handling as follows:
- If the field specified by `<json_path>` does not exist in the JSON, return `NULL`.
- If the actual type of the field specified by `<json_path>` differs from the type expected by `json_extract_t`, if it can be losslessly converted to the expected type, it will return the specified type. Otherwise, it will return `NULL`.

## Examples

1. Get the value for key "k1"

```sql

SELECT get_json_string('{"k1":"v1", "k2":"v2"}', "$.k1");
```

```sql
+---------------------------------------------------+
| get_json_string('{"k1":"v1", "k2":"v2"}', '$.k1') |
+---------------------------------------------------+
| v1                                                |
+---------------------------------------------------+
```
2. Get the second element of the array for key "my.key"

``` sql
SELECT get_json_string('{"k1":"v1", "my.key":["e1", "e2", "e3"]}', '$."my.key"[1]');

```
```sql
+------------------------------------------------------------------------------+
| get_json_string('{"k1":"v1", "my.key":["e1", "e2", "e3"]}', '$."my.key"[1]') |
+------------------------------------------------------------------------------+
| e2                                                                           |
+------------------------------------------------------------------------------+

```
3. Get the first element of the array in the secondary path k1.key -> k2


```sql
 SELECT get_json_string('{"k1.key":{"k2":["v1", "v2"]}}', '$."k1.key".k2[0]');

```

```sql

+-----------------------------------------------------------------------+
| get_json_string('{"k1.key":{"k2":["v1", "v2"]}}', '$."k1.key".k2[0]') |
+-----------------------------------------------------------------------+
| v1                                                                    |
+-----------------------------------------------------------------------+

```