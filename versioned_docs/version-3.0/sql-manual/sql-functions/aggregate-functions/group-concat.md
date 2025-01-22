---
{
    "title": "GROUP_CONCAT",
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

The GROUP_CONCAT function concatenates multiple rows of results in the result set into a string.

## Syntax

```sql
GROUP_CONCAT([DISTINCT] <str>[, <sep>] [ORDER BY { <col_name> | <expr>} [ASC | DESC]])
```

## Parameters

| Parameters | Description |
| ------------ | ---------------------- |
| `<str>`      | Required. The expression of the value to be concatenated. |
| `<sep>`      | Optional. The separator between strings. |
| `<col_name>` | Optional. The column used for sorting.   |
| `<expr>`     | Optional. The expression used for sorting. |

## Return Value

Returns a value of type VARCHAR.

## Example

```sql
select value from test;
```

```text
+-------+
| value |
+-------+
| a     |
| b     |
| c     |
| c     |
+-------+
```

```sql
select GROUP_CONCAT(value) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c, c            |
+-----------------------+
```

```sql
select GROUP_CONCAT(DISTINCT value) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c               |
+-----------------------+
```

```sql 
select GROUP_CONCAT(value, " ") from test;
```

```text
+----------------------------+
| GROUP_CONCAT(`value`, ' ') |
+----------------------------+
| a b c c                    |
+----------------------------+
```

```sql
select GROUP_CONCAT(value, NULL) from test;
```

```text
+----------------------------+
| GROUP_CONCAT(`value`, NULL)|
+----------------------------+
| NULL                       |
+----------------------------+
```