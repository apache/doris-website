---
{
    "title": "COUNT_SUBSTRINGS",
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

The COUNT_SUBSTRINGS function counts the number of occurrences of a specified substring within a string. Note: The current implementation continues searching after shifting by the length of the substring when a match is found. For example, when str='ccc' and pattern='cc', the result returned is 1.

## Syntax

```sql
COUNT_SUBSTRINGS(<str>, <pattern>)
```

## Parameters
| Parameter | Description                             |
| --------- | --------------------------------------- |
| `<str>` | The string to be searched. Type: STRING |
| `<pattern>` | The substring to match. Type: STRING    |

## Return Value

Returns an INT type, representing the number of times the substring appears in the string.

Special cases:
- If str is NULL, returns NULL
- If pattern is an empty string, returns 0
- If str is an empty string, returns 0

## Examples

1. Basic usage
```sql
SELECT count_substrings('a1b1c1d', '1');
```
```text
+----------------------------------+
| count_substrings('a1b1c1d', '1') |
+----------------------------------+
|                                3 |
+----------------------------------+
```

2. Case with consecutive commas
```sql
SELECT count_substrings(',,a,b,c,', ',');
```
```text
+-----------------------------------+
| count_substrings(',,a,b,c,', ',') |
+-----------------------------------+
|                                 5 |
+-----------------------------------+
```

3. Case with overlapping substrings
```sql
SELECT count_substrings('ccc', 'cc');
```
```text
+--------------------------------+
| count_substrings('ccc', 'cc')  |
+--------------------------------+
|                              1 |
+--------------------------------+
```

4. NULL value handling
```sql
SELECT count_substrings(NULL, ',');
```
```text
+-----------------------------+
| count_substrings(NULL, ',') |
+-----------------------------+
|                        NULL |
+-----------------------------+
```

5. Empty string handling
```sql
SELECT count_substrings('a,b,c,abcde', '');
```
```text
+-------------------------------------+
| count_substrings('a,b,c,abcde', '') |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```