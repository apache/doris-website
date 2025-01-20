---
{
    "title": "SUBSTRING",
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

The SUBSTRING function is used to extract a substring from a string. You can specify the starting position and length, supporting both forward and backward extraction. The position of the first character in the string is 1.

## Alias

SUBSTR

## Syntax

```sql
SUBSTRING(VARCHAR <str>, INT <pos> [, INT <len>])
```

## Parameters
| Parameter | Description                                      |
| --------- | ------------------------------------------------ |
| `<str>` | Source string. Type: VARCHAR                     |
| `<pos>` | Starting position, can be negative. Type: INT    |
| `<len>` | Optional parameter, length to extract. Type: INT |

## Return Value

Returns VARCHAR type, representing the extracted substring.

Special cases:
- If any parameter is NULL, returns NULL
- If pos is 0, returns an empty string
- If pos is negative, counts from the end of the string backwards
- If pos exceeds the string length, returns an empty string
- If len is not specified, returns all characters from pos to the end of the string

## Examples

1. Basic usage (specify starting position)
```sql
SELECT substring('abc1', 2);
```
```text
+-----------------------------+
| substring('abc1', 2)        |
+-----------------------------+
| bc1                         |
+-----------------------------+
```

2. Using negative position
```sql
SELECT substring('abc1', -2);
```
```text
+-----------------------------+
| substring('abc1', -2)       |
+-----------------------------+
| c1                          |
+-----------------------------+
```

3. Case when position is 0
```sql
SELECT substring('abc1', 0);
```
```text
+----------------------+
| substring('abc1', 0) |
+----------------------+
|                      |
+----------------------+
```

4. Position exceeds string length
```sql
SELECT substring('abc1', 5);
```
```text
+-----------------------------+
| substring('abc1', 5)        |
+-----------------------------+
|                             |
+-----------------------------+
```

5. Specifying length parameter
```sql
SELECT substring('abc1def', 2, 2);
```
```text
+-----------------------------+
| substring('abc1def', 2, 2)  |
+-----------------------------+
| bc                          |
+-----------------------------+
```