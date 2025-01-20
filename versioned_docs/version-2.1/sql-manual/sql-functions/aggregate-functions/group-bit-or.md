---
{
"title": "GROUP_BIT_OR",
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

## description

Performs a bitwise OR operation on all values in a single integer column or expression.

## Syntax

`GROUP_BIT_OR(expr)`

## Parameters

| Parameter | Description |
| -- | -- |
| `expr` | Supports all INT types |

## Return Value

Returns an integer value

## example

```sql
select * from group_bit;
```

```text
+-------+
| value |
+-------+
|     3 |
|     1 |
|     2 |
|     4 |
+-------+
```

```sql
mysql> select group_bit_or(value) from group_bit;
```

```text
+-----------------------+
| group_bit_or(`value`) |
+-----------------------+
|                     7 |
+-----------------------+
```
