---
{
    "title": "CONCAT",
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

Concatenate multiple strings. Special cases:

- If any of the parameter values ​​is NULL, the result returned is NULL

## Syntax

```sql
concat(STRING <expr1> [ ,STRING <expr2> ... ])
```

## Parameters

| Parameter | Description |
| -- |--------------|
| `<expr1>` | The string to be concatenated |

## Return value

Parameter list expr1 The string to be concatenated. Special cases:

- If any of the parameter values ​​is NULL, the result returned is NULL

## Example

```sql
select concat("a", "b"),concat("a", "b", "c"),concat("a", null, "c")
```

```text
+------------------+-----------------------+------------------------+
| concat('a', 'b') | concat('a', 'b', 'c') | concat('a', NULL, 'c') |
+------------------+-----------------------+------------------------+
| ab               | abc                   | NULL                   |
+------------------+-----------------------+------------------------+
```