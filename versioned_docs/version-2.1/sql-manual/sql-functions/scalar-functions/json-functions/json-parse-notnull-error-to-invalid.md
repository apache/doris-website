---
{
    "title": "JSON_PARSE_NOTNULL_ERROR_TO_INVALID",
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

This function is used to parse a JSON string. If the JSON string is malformed or a parsing error occurs, the function will return an invalid JSON object (usually `{}`). The main purpose of this function is to ensure that when a JSON format error occurs, a safe default value is returned, preventing query failures due to parsing errors.

## Aliases

- JSONB_PARSE_NOTNULL_ERROR_TO_INVALID

## Syntax

```sql
JSON_PARSE_NOTNULL_ERROR_TO_INVALID( <str> )
```

## Required Parameters

| parameters| described|
|------|------|
| `<str>`| The JSON string to be parsed. This parameter should be a valid string containing JSON-formatted data. If the JSON format is invalid, the function will return an invalid JSON object. |

## Return Value
Returns an invalid JSON object (usually `{}`).

## Examples

```sql

SELECT JSON_PARSE_NOTNULL_ERROR_TO_INVALID('{"name": "Alice", "age": 30}') AS parsed_json;

```

```sql
+---------------------------+
| parsed_json               |
+---------------------------+
| {"name":"Alice","age":30} |
+---------------------------+

```
