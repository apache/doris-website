---
{
    "title": "JSON_PARSE_NULLABLE_ERROR_TO_INVALID",
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

The `JSON_PARSE_NULLABLE_ERROR_TO_INVALID` function is used to parse a JSON string into a valid JSON object. If the input JSON string is invalid, it will return an "invalid JSON" marker (typically `INVALID_JSON`), without throwing an error. If the input is `NULL`, it will also return the `INVALID_JSON` marker.

## Syntax

```sql
JSON_PARSE_NULLABLE_ERROR_TO_INVALID( <str> )
```

## Alias

- JSONB_PARSE_NULLABLE_ERROR_TO_INVALID


## Required Parameters

| Parameter | Description                                             |
|-----------|---------------------------------------------------------|
| `<str>`   | The input string in JSON format to be parsed.           |

## Return Value

| Condition                               | Return Value                       |
|-----------------------------------------|------------------------------------|
| If the input string is a valid JSON     | It returns the corresponding JSON object. |
| If the input string is invalid or NULL  | It returns the `INVALID_JSON` marker. |

## Examples
1. Valid JSON string:

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_INVALID('{"name": "John", "age": 30}');
```

```sql
+----------------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_INVALID('{"name": "John", "age": 30}')  |
+----------------------------------------------------------------------+
| {"name": "John", "age": 30}                                          |
+----------------------------------------------------------------------+
```

2. Invalid JSON string:

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_INVALID('{"name": "John", "age": }');
```

```sql
+-------------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_INVALID('{"name": "John", "age": }') |
+-------------------------------------------------------------------+
| INVALID_JSON                                                      |
+-------------------------------------------------------------------+
```
3. Input is NULL:

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_INVALID(NULL);
```

```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_INVALID(NULL)                    |
+---------------------------------------------------------------+
| INVALID_JSON                                                  |
+---------------------------------------------------------------+
```