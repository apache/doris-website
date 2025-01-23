---
{
    "title": "STRUCT_ELEMENT",
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

Return a specific field within a data column of a struct.

## Syntax

```sql
STRUCT_ELEMENT( <struct>, `<filed_location>/<filed_name>`)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<struct>` | If the input struct column is null, return null |
| `<filed_location>` | The position of the field starts from 1, and only constants are supported |
| `<filed_name>` | The field name must be a constant |

## Return Value

Return the specified field column, with the type being any type

## Example

```sql
select struct_element(named_struct('f1', 1, 'f2', 'a'), 'f2'),struct_element(named_struct('f1', 1, 'f2', 'a'), 1);
```

```text
+--------------------------------------------------------+-----------------------------------------------------+
| struct_element(named_struct('f1', 1, 'f2', 'a'), 'f2') | struct_element(named_struct('f1', 1, 'f2', 'a'), 1) |
+--------------------------------------------------------+-----------------------------------------------------+
| a                                                      |                                                   1 |
+--------------------------------------------------------+-----------------------------------------------------+
```

```sql
select struct_col, struct_element(struct_col, 'f1') from test_struct;
```

```text
+-------------------------------------------------+-------------------------------------+
| struct_col                                      | struct_element(`struct_col `, 'f1') |
+-------------------------------------------------+-------------------------------------+
| {1, 2, 3, 4, 5}                                 |                                   1 |
| {1, 1000, 10000000, 100000000000, 100000000000} |                                   1 |
| {5, 4, 3, 2, 1}                                 |                                   5 |
| NULL                                            |                                NULL |
| {1, NULL, 3, NULL, 5}                           |                                   1 |
+-------------------------------------------------+-------------------------------------+
```
