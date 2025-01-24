---
{
    "title": "SPACE",
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

Generate a string consisting of a specified number of spaces.

## Syntax

```sql
SPACE ( <len> )
```

## Parameters

| Parameter | Description                      |
|-----------|----------------------------------|
| `<len>`   | The number of spaces to generate |

## Return Value

Returns a string consisting of the specified number of spaces. Special cases:

- If any Parameter is NULL, NULL will be returned.
- When `<len>` is less than 0, an empty string is returned.

## Examples

```sql
SELECT space(10);
```

```text
+------------+
| space(10)  |
+------------+
|            |
+------------+
```

```sql
SELECT space(null);
```

```text
+-------------+
| space(NULL) |
+-------------+
| NULL        |
+-------------+
```
