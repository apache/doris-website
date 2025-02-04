---
{
    "title": "JSON_PARSE",
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
Parse the original JSON string into JSON binary format. To meet the needs of different abnormal data processing, different JSON_PARSE series functions are provided as follows:
* JSON_PARSE: Parse the JSON string, and report an error when the input string is not a valid JSON string.
* JSON_PARSE_ERROR_TO_INVALID: Parse the JSON string, and return NULL when the input string is not a valid JSON string.
* JSON_PARSE_ERROR_TO_NULL: Parse the JSON string, and return NULL when the input string is not a valid JSON string.
* JSON_PARSE_ERROR_TO_VALUE: Parse the JSON string, and return the default value specified by the parameter default_json_str when the input string is not a valid JSON string.
* JSON_PARSE_NOTNULL: Parse the JSON string, and return NULL when the input string is not a valid JSON string.

## Alias
* JSONB_PARSE is the same as JSON_PARSE
* JSONB_PARSE_ERROR_TO_INVALID is the same as JSON_PARSE_ERROR_TO_INVALID
* JSONB_PARSE_ERROR_TO_NULL is the same as JSON_PARSE_ERROR_TO_NULL
* JSONB_PARSE_ERROR_TO_VALUE is the same as JSON_PARSE_ERROR_TO_VALUE
* JSONB_PARSE_NOTNULL is the same as JSON_PARSE_NOTNULL

## Syntax

```sql
JSON_PARSE (<json_str>)
```
```sql
JSON_PARSE_ERROR_TO_INVALID (<json_str>)
```
```sql
JSON_PARSE_ERROR_TO_NULL (<json_str>)
```

```sql
JSON_PARSE_ERROR_TO_VALUE (<json_str>, <default_json_str>)
```
```sql
JSONB_PARSE_NOTNULL (<json_str>)
```

## Parameters
| Parameter           | Description                          |
|--------------|-----------------------------|
| `<json_str>` | The JSON type parameter or field to be extracted.         |
| `<default_json_str>`    | When the input string is not a valid JSON string, return the default value specified by the parameter default_json_str. |                                                                                                                     |

## Return Values
json_parse functions parse JSON string to binary format. A series of functions are provided to satisfy different demand for exception handling.
- all return NULL if json_str is NULL
- if json_str is not valid
  - json_parse will report error
  - json_parse_error_to_invalid will return NULL
  - json_parse_error_to_null will return NULL
  - json_parse_error_to_value will return the value specified by default_json_str
  - json_parse_notnull will return NULL

### Examples
1. Parse valid JSON string
```sql
SELECT json_parse('{"k1":"v31","k2":300}');
```
```text
+--------------------------------------+
| json_parse('{"k1":"v31","k2":300}') |
+--------------------------------------+
| {"k1":"v31","k2":300}                |
+--------------------------------------+
```
```sql
SELECT json_parse_error_to_invalid('{"k1":"v31","k2":300}');
```
```text
+-------------------------------------------------------+
| jsonb_parse_error_to_invalid('{"k1":"v31","k2":300}') |
+-------------------------------------------------------+
| {"k1":"v31","k2":300}                                 |
+-------------------------------------------------------+
```
```sql
SELECT json_parse_notnull('{"a":"b"}');
```
```text
+----------------------------------+
| jsonb_parse_notnull('{"a":"b"}') |
+----------------------------------+
| {"a":"b"}                        |
+----------------------------------+
```
```sql
SELECT json_parse_error_to_value('{"k1":"v31","k2":300}','{}');
```
```text
+-----------------------------------------------------------+
| jsonb_parse_error_to_value('{"k1":"v31","k2":300}', '{}') |
+-----------------------------------------------------------+
| {"k1":"v31","k2":300}                                     |
+-----------------------------------------------------------+
```
2. Parse invalid JSON string
```sql
SELECT json_parse('invalid json');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = json parse error: Invalid document: document must be an object or an array for value: invalid json
```
```sql
SELECT json_parse_error_to_invalid('invalid json');
```
```text
+----------------------------------------------+
| jsonb_parse_error_to_invalid('invalid json') |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```
```sql
SELECT json_parse_notnull('invalid json');
```
```text
+-------------------------------------------+
| jsonb_parse_error_to_null('invalid json') |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```
```sql
SELECT json_parse_error_to_value('invalid json', '{}');
```
```text
+--------------------------------------------------+
| json_parse_error_to_value('invalid json', '{}') |
+--------------------------------------------------+
| {}                                               |
+--------------------------------------------------+
```
