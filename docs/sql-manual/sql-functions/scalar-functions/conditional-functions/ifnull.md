---
{
    "title": "IFNULL",
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

Returns `<expr1>` if it is not `NULL`; otherwise, returns `<expr2>`.

## Alias

- NVL

## Syntax

```sql
IFNULL(<expr1>, <expr2>)
```

## Parameters

| Parameter  | Description |
|-----------|-------------|
| `<expr1>` | The first expression to check for `NULL`. |
| `<expr2>` | The value to return if `<expr1>` is `NULL`. |

## Return Value

- Returns `<expr1>` if it is not `NULL`.  
- Otherwise, returns `<expr2>`.

## Examples

```sql
SELECT IFNULL(1, 0);
```

```text
+--------------+
| IFNULL(1, 0) |
+--------------+
|            1 |
+--------------+
```

```sql
SELECT IFNULL(NULL, 10);
```

```text
+------------------+
| IFNULL(NULL, 10) |
+------------------+
|               10 |
+------------------+
```