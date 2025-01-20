---
{
    "title": "TRIM_IN",
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

The TRIM_IN function removes specified characters from both ends of a string. When no character set is specified, it removes leading and trailing spaces by default. When a character set is specified, it removes all specified characters from both ends (regardless of their order in the set).
The key feature of TRIM_IN is that it removes any combination of characters from the specified set, while the TRIM function removes characters based on exact string matching.

## Syntax

```sql
TRIM_IN(VARCHAR <str> [, VARCHAR <rhs>])
```

## Parameters
| Parameter | Description                                                            |
| --------- | ---------------------------------------------------------------------- |
| `<str>` | The string to be processed. Type: VARCHAR                              |
| `<rhs>` | Optional parameter, the set of characters to be removed. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the processed string.

Special cases:
- If str is NULL, returns NULL
- If rhs is not specified, removes all leading and trailing spaces
- If rhs is specified, removes all characters from both ends that appear in rhs until encountering the first character not in rhs

## Examples

1. Remove spaces from both ends:
```sql
SELECT trim_in(' hello ');
```
```text
+------+
| str  |
+------+
| hello|
+------+
```

2. Remove specified character set:
```sql
-- TRIM_IN removes any 'c', 'd', or 'e' characters from both ends
SELECT trim_in('abcd', 'cde');
```
```text
+------+
| str  |
+------+
| ab   |
+------+
```

3. Comparison with TRIM function
```sql
SELECT trim_in('abcd', 'cde'),trim('abcd', 'cde');
```
```text
+------------------------+---------------------+
| trim_in('abcd', 'cde') | trim('abcd', 'cde') |
+------------------------+---------------------+
| ab                     | abcd                |
+------------------------+---------------------+
```