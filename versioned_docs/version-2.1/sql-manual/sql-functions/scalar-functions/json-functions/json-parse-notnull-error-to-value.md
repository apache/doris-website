---
{
    "title": "JSON_PARSE_NOTNULL_ERROR_TO_VALUE",
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

Function to parse JSON strings. If the JSON string format is invalid or a parsing error occurs, the function returns the default value specified by the user instead of returning an invalid JSON object. The main purpose of this function is to provide a default value that can be used to replace invalid results in case of parsing errors, ensuring that the query returns a reasonable value.

## Syntax

```sql
JSON_PARSE_NOTNULL_ERROR_TO_VALUE(< str >, <default_value>)
```

## Alias

- JSONB_PARSE_NOTNULL_ERROR_TO_VALUE

## Required Parameters

| parameters| described|
|------|------|
| `<str>` | The JSON string to parse. This parameter should be a valid JSON string. If the JSON format is invalid, the function returns default_value. |
| `<default_value>` | The default value returned when parsing the error. This parameter can be of any type and is used to replace invalid JSON-formatted data. |


## Return Value

Return a JSON object. If the input JSON string is valid, the parsed JSON object is returned. If invalid, return the user-specified default_value.


## Examples

```sql
SELECT JSON_PARSE_NOTNULL_ERROR_TO_VALUE('{"name": "Alice", "age": 30}', '{"name": "Unknown", "age":  0}') AS parsed_json;

```

```sql
+-------------------------------------------+
| parsed_json                               |
+-------------------------------------------+
| {"name":"Alice","age":30}                 |
+-------------------------------------------+
```
