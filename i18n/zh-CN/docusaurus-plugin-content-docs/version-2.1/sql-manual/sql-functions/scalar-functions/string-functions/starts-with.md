---
{
    "title": "STARTS_WITH",
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

The STARTS_WITH function checks if a string starts with a specified prefix. Returns true if the string starts with the specified prefix; otherwise returns false.

## Syntax

```sql
STARTS_WITH(<str>, <prefix>)
```

## Parameters
| Parameter | Description |
| ------- | ------------------------------ |
| `<str>` | The string to check. Type: VARCHAR |
| `<prefix>` | The prefix string to match. Type: VARCHAR |

## Return Value

Returns BOOLEAN type.

Special cases:
- Returns NULL if any argument is NULL

## Examples

1. Successful match
```sql
SELECT starts_with('hello world', 'hello');
```
```text
+-------------------------------------+
| starts_with('hello world', 'hello') |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
```

2. Failed match
```sql
SELECT starts_with('hello world', 'world');
```
```text
+-------------------------------------+
| starts_with('hello world', 'world') |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```