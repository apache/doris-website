---
{
    "title": "JSON_EXTRACT",
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
JSON_EXTRACT is a series of functions that extract the field specified by json_path from JSON data and provide different series of functions according to the type of the field to be extracted.

* JSON_EXTRACT returns the VARCHAR type for a json string of the VARCHAR type.
* JSON_EXTRACT_NO_QUOTES returns the VARCHAR type for a json string of the VARCHAR type, if the value of a JSON field is a string, the double quotes will be removed.
* JSON_EXTRACT_ISNULL returns the BOOLEAN type indicating whether it is a json null.
* JSON_EXTRACT_BOOL returns the BOOLEAN type.
* JSON_EXTRACT_INT returns the INT type.
* JSON_EXTRACT_BIGINT returns the BIGINT type.
* JSON_EXTRACT_LARGEINT returns the LARGEINT type.
* JSON_EXTRACT_DOUBLE returns the DOUBLE type.
* JSON_EXTRACT_STRING returns the STRING type.

:::tip
Note
The `JSON_EXTRACT_NO_QUOTES` function has been supported since version 3.0.6. 
:::

## Alias
* JSONB_EXTRACT is the same as JSON_EXTRACT.
* JSON_EXTRACT_NO_QUOTES is the same as JSON_EXTRACT_NO_QUOTES.
* JSONB_EXTRACT_ISNULL is the same as JSON_EXTRACT_ISNULL.
* JSONB_EXTRACT_BOOL is the same as JSON_EXTRACT_BOOL.
* JSONB_EXTRACT_INT is the same as JSON_EXTRACT_INT.
* JSONB_EXTRACT_BIGINT is the same as JSON_EXTRACT_BIGINT.
* JSONB_EXTRACT_LARGEINT is the same as JSON_EXTRACT_LARGEINT.
* JSONB_EXTRACT_DOUBLE is the same as JSON_EXTRACT_DOUBLE.
* JSONB_EXTRACT_STRING is the same as JSON_EXTRACT_STRING.

## Syntax
```sql
JSON_EXTRACT (<json_str>, <path>[, path] ...)
```
```sql
JSON_EXTRACT_NO_QUOTES (<json_str>, <path>[, path] ...)
```
```sql
JSON_EXTRACT_ISNULL (<json_str>, <path>)
```
```sql
JSON_EXTRACT_BOOL (<json_str>, <path>)
```
```sql
JSON_EXTRACT_INT (<json_str>, <path>)
```
```sql
JSON_EXTRACT_BIGINT (<json_str>, <path>)
```
```sql
JSON_EXTRACT_LARGEINT (<json_str>, <path>)
```
```sql
JSON_EXTRACT_DOUBLE (<json_str>, <path>)
```
```sql
JSON_EXTRACT_STRING (<json_str>, <path>)
```
Alias functions have the same syntax and usage as the above functions, except for the function names.

## Parameters
| Parameter           | Description                          |
|--------------|-----------------------------|
| `<json_str>` | The JSON-type parameter or field to be extracted.         |
| `<path>`     | The JSON path to extract the target element from the target JSON. |
json path syntax:
- '$' for json document root
- '.k1' for element of json object with key 'k1'
  - If the key column value contains ".", double quotes are required in json_path, For example: SELECT json_extract('{"k1.a":"abc","k2":300}', '$."k1.a"');
- '[i]' for element of json array at index i
  - Use '$[last]' to get the last element of json_array, and '$[last-1]' to get the penultimate element, and so on.

## Return Values
According to the type of the field to be extracted, return the data type of the specified JSON_PATH in the target JSON. Special case handling is as follows:
* If the field specified by json_path does not exist in the JSON, return NULL.
* If the actual type of the field specified by json_path in the JSON is inconsistent with the type specified by json_extract_t.
* if it can be losslessly converted to the specified type, return the specified type t; if not, return NULL.



## Examples
```sql
SELECT json_extract('{"id": 123, "name": "doris"}', '$.id');
```

```text
+------------------------------------------------------+
| json_extract('{"id": 123, "name": "doris"}', '$.id') |
+------------------------------------------------------+
| 123                                                  |
+------------------------------------------------------+
```
```sql
SELECT json_extract('[1, 2, 3]', '$.[1]');
```
```text
+------------------------------------+
| json_extract('[1, 2, 3]', '$.[1]') |
+------------------------------------+
| 2                                  |
+------------------------------------+
```
```sql
SELECT json_extract('{"k1": "v1", "k2": { "k21": 6.6, "k22": [1, 2] } }', '$.k1', '$.k2.k21', '$.k2.k22', '$.k2.k22[1]');
```
```text
+-------------------------------------------------------------------------------------------------------------------+
| json_extract('{"k1": "v1", "k2": { "k21": 6.6, "k22": [1, 2] } }', '$.k1', '$.k2.k21', '$.k2.k22', '$.k2.k22[1]') |
+-------------------------------------------------------------------------------------------------------------------+
| ["v1",6.6,[1,2],2]                                                                                                |
+-------------------------------------------------------------------------------------------------------------------+
```
```sql
SELECT json_extract('{"id": 123, "name": "doris"}', '$.aaa', '$.name');
```
```text
+-----------------------------------------------------------------+
| json_extract('{"id": 123, "name": "doris"}', '$.aaa', '$.name') |
+-----------------------------------------------------------------+
| [null,"doris"]                                                  |
+-----------------------------------------------------------------+
```
```sql
SELECT json_extract_no_quotes('{"id": 123, "name": "doris"}', '$.name');
```
```text
+------------------------------------------------------------------+
| json_extract_no_quotes('{"id": 123, "name": "doris"}', '$.name') |
+------------------------------------------------------------------+
| doris                                                            |
+------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_ISNULL('{"id": 123, "name": "doris"}', '$.id');
```
```text
+----------------------------------------------------------------------------+
| jsonb_extract_isnull(cast('{"id": 123, "name": "doris"}' as JSON), '$.id') |
+----------------------------------------------------------------------------+
|                                                                          0 |
+----------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_BOOL('{"id": 123, "name": "NULL"}', '$.id');
```
```text
+-------------------------------------------------------------------------+
| jsonb_extract_bool(cast('{"id": 123, "name": "NULL"}' as JSON), '$.id') |
+-------------------------------------------------------------------------+
|                                                                    NULL |
+-------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_INT('{"id": 123, "name": "NULL"}', '$.id');
```
```text
+------------------------------------------------------------------------+
| jsonb_extract_int(cast('{"id": 123, "name": "NULL"}' as JSON), '$.id') |
+------------------------------------------------------------------------+
|                                                                    123 |
+------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_INT('{"id": 123, "name": "doris"}', '$.name');
```
```text
+---------------------------------------------------------------------------+
| jsonb_extract_int(cast('{"id": 123, "name": "doris"}' as JSON), '$.name') |
+---------------------------------------------------------------------------+
|                                                                      NULL |
+---------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_STRING('{"id": 123, "name": "doris"}', '$.name');
```
```text
+------------------------------------------------------------------------------+
| jsonb_extract_string(cast('{"id": 123, "name": "doris"}' as JSON), '$.name') |
+------------------------------------------------------------------------------+
| doris                                                                        |
+------------------------------------------------------------------------------+
```