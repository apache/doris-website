---
{
    "title": "TO_BASE64",
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

The TO_BASE64 function is used to convert an input string to Base64 encoded format. Base64 encoding can convert any binary data into a string composed of 64 characters.

## Syntax

```sql
VARCHAR TO_BASE64(VARCHAR str)
```

## Parameters
| Parameter | Description                                    |
| --------- | ---------------------------------------------- |
| str       | The string to be Base64 encoded. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the Base64 encoded string.

Special cases:
- If input is NULL, returns NULL
- If input is an empty string, returns an empty string

## Examples

1. Single character encoding
```sql
SELECT to_base64('1');
```
```text
+----------------+
| to_base64('1') |
+----------------+
| MQ==           |
+----------------+
```

2. Multiple character encoding
```sql
SELECT to_base64('234');
```
```text
+------------------+
| to_base64('234') |
+------------------+
| MjM0             |
+------------------+
```