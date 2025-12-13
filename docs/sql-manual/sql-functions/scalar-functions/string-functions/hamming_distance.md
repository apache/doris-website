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

Returns the Hamming distance between two strings, i.e., the number of positions at which the corresponding characters are different. The two input strings must have the same length; otherwise, the function returns NULL.

## Syntax

```sql
HAMMING_DISTANCE(<string1>, <string2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<string1>` | The first string parameter (VARCHAR or STRING) |
| `<string2>` | The second string parameter (VARCHAR or STRING) |

## Return Value

Returns a BIGINT value representing the Hamming distance between the two input strings. Returns NULL if:
- Either input string is NULL
- The two strings have different lengths

## Examples

```sql
select hamming_distance('abc', 'abc');
```

```text
+--------------------------+
| hamming_distance('abc', 'abc') |
+--------------------------+
|                         0 |
+--------------------------+
```

```sql
select hamming_distance('abc', 'axc');
```

```text
+--------------------------+
| hamming_distance('abc', 'axc') |
+--------------------------+
|                         1 |
+--------------------------+
```

```sql
select hamming_distance('abc', 'xyz');
```

```text
+--------------------------+
| hamming_distance('abc', 'xyz') |
+--------------------------+
|                         3 |
+--------------------------+
```

```sql
select hamming_distance('hello', 'hallo');
```

```text
+-------------------------------+
| hamming_distance('hello', 'hallo') |
+-------------------------------+
|                              1 |
+-------------------------------+
```

```sql
select hamming_distance('abc', 'abcd');
```

```text
+-------------------------------+
| hamming_distance('abc', 'abcd') |
+-------------------------------+
|                           NULL |
+-------------------------------+
```

```sql
select hamming_distance('', '');
```

```text
+--------------------------+
| hamming_distance('', '') |
+--------------------------+
|                         0 |
+--------------------------+
```

```sql
select hamming_distance('abc', NULL);
```

```text
+-------------------------------+
| hamming_distance('abc', NULL) |
+-------------------------------+
|                           NULL |
+-------------------------------+
```

