---
{
    "title": "REPEAT",
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

The REPEAT function is used to repeat a string a specified number of times.

## Syntax

```sql
REPEAT( <str>, <count> )
```

## Parameters

| Parameter | Description                                                                                                               |
|-----------|---------------------------------------------------------------------------------------------------------------------------|
| `<str>`   | The string to be repeated.                                                                                                |
| `<count>` | The number of times to repeat. It must be a non-negative integer. If it is less than 1, an empty string will be returned. |

## Return Value

Returns the string repeated the specified number of times. Special cases:

- If any Parameter is NULL, NULL will be returned.

## Examples

```sql
SELECT repeat("a", 3);
```

```text
+----------------+
| repeat('a', 3) |
+----------------+
| aaa            |
+----------------+
```

```sql
SELECT repeat("a", -1);
```

```text
+-----------------+
| repeat('a', -1) |
+-----------------+
|                 |
+-----------------+
```
