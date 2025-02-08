---
{
    "title": "NULLIF",
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

Returns `NULL` if the two input values are equal; otherwise, returns the first input value. This function is equivalent to the following `CASE WHEN` expression:

```sql
CASE
    WHEN <expr1> = <expr2> THEN NULL
    ELSE <expr1>
END
```

## Syntax

```sql
NULLIF(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<expr1>` | The first input value to compare. |
| `<expr2>` | The second input value to compare against the first. |

## Return Value

- Returns `NULL` if `<expr1>` is equal to `<expr2>`.
- Otherwise, returns the value of `<expr1>`.

## Examples

```sql
SELECT NULLIF(1, 1);
```

```text
+--------------+
| NULLIF(1, 1) |
+--------------+
|         NULL |
+--------------+
```

```sql
SELECT NULLIF(1, 0);
```

```text
+--------------+
| NULLIF(1, 0) |
+--------------+
|            1 |
+--------------+
```