---
{
    "title": "FROM_BASE64",
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

Returns the result of Base64 decoding the input string. Special cases:

- When the input string is incorrect (a string that is not possible after Base64 encoding appears), NULL will be returned

## Syntax

```sql
FROM_BASE64 ( <str> )
```

## Parameters

| Parameters | Description |
|------------|-----------------|
| `<str>`    | The string to be Base64 decoded |

## Return value

Parameter <str> The result of Base64 decoding. Special cases:

- When the input string is incorrect (a string that is not possible after Base64 encoding appears), NULL will be returned.

## Example

```sql
SELECT FROM_BASE64('MQ=='),FROM_BASE64('MjM0'),FROM_BASE64(NULL)
```

```text
+---------------------+---------------------+-------------------+
| from_base64('MQ==') | from_base64('MjM0') | from_base64(NULL) |
+---------------------+---------------------+-------------------+
| 1                   | 234                 | NULL              |
+---------------------+---------------------+-------------------+
```