---
{
    "title": "GREATEST",
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

Compares multiple expressions and returns the greatest value among them. If any argument is `NULL`, the function returns `NULL`.

## Syntax

```sql
GREATEST(<expr1>, <expr2>, ..., <exprN>)
```

## Parameters

| Parameter   | Description |
|------------|-------------|
| `<expr1>, <expr2>, ..., <exprN>` | A list of expressions to compare. Supports `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `FLOAT`, `DOUBLE`, `STRING`, `DATETIME`, and `DECIMAL` types. |

## Return Value

- Returns the largest value among the given expressions.
- If any argument is `NULL`, returns `NULL`.

## Examples

```sql
SELECT GREATEST(-1, 0, 5, 8);
```

```text
+-----------------------+
| GREATEST(-1, 0, 5, 8) |
+-----------------------+
|                     8 |
+-----------------------+
```

```sql
SELECT GREATEST(-1, 0, 5, NULL);
```

```text
+--------------------------+
| GREATEST(-1, 0, 5, NULL) |
+--------------------------+
| NULL                     |
+--------------------------+
```

```sql
SELECT GREATEST(6.3, 4.29, 7.6876);
```

```text
+-----------------------------+
| GREATEST(6.3, 4.29, 7.6876) |
+-----------------------------+
|                      7.6876 |
+-----------------------------+
```

```sql
SELECT GREATEST('2022-02-26 20:02:11', '2020-01-23 20:02:11', '2020-06-22 20:02:11');
```

```text
+-------------------------------------------------------------------------------+
| GREATEST('2022-02-26 20:02:11', '2020-01-23 20:02:11', '2020-06-22 20:02:11') |
+-------------------------------------------------------------------------------+
| 2022-02-26 20:02:11                                                           |
+-------------------------------------------------------------------------------+
```