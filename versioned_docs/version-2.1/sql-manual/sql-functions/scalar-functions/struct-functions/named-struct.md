---
{
    "title": "NAMED_STRUCT",
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

Construct and return a struct based on the given strings and values. Notes:

- The number of parameters must be a non-zero even number.The odd-indexed elements are the names of the fields, which must be constant strings.The even-indexed elements are the values of the fields, which can be either multiple columns or constants.

## Syntax

```sql
NAMED_STRUCT( <field_name> , <filed_value> [ , <field_name> , <filed_value> ... ] )
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<field_name>` | The odd-indexed elements in constructing the struct are the field names, which must be constant strings |
| `<filed_value>` | The even-indexed elements in constructing the struct represent the field values, which can be either multiple columns or constants |

## Return Value

Construct and return a struct based on the given strings and values.

## Example

```sql
select named_struct('f1', 1, 'f2', 'a', 'f3', "abc"),named_struct('a', null, 'b', "v");
```

```text
+-----------------------------------------------+-----------------------------------+
| named_struct('f1', 1, 'f2', 'a', 'f3', 'abc') | named_struct('a', NULL, 'b', 'v') |
+-----------------------------------------------+-----------------------------------+
| {"f1":1, "f2":"a", "f3":"abc"}                | {"a":null, "b":"v"}               |
+-----------------------------------------------+-----------------------------------+
```
