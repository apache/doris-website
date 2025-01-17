---
{
    "title": "STRUCT",
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

construct an struct with variadic elements and return it, Tn could be column or literal

## Syntax

```sql
STRUCT( <expr1> [ , <expr2> ... ] )
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Construct the input content for the struct |

## Return Value

construct an struct with variadic elements and return it, Tn could be column or literal

## Example

```sql
select struct(1, 'a', "abc"),struct(null, 1, null),struct(cast('2023-03-16' as datetime));
```

```text
+--------------------------------------+--------------------------------------+---------------------------------------------+
| struct(1, 'a', 'abc')                | struct(NULL, 1, NULL)                | struct(cast('2023-03-16' as DATETIMEV2(0))) |
+--------------------------------------+--------------------------------------+---------------------------------------------+
| {"col1":1, "col2":"a", "col3":"abc"} | {"col1":null, "col2":1, "col3":null} | {"col1":"2023-03-16 00:00:00"}              |
+--------------------------------------+--------------------------------------+---------------------------------------------+
```
