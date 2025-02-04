---
{
    "title": "ARRAY_APPLY",
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

Filter array to match specific binary condition

## Syntax

```sql
ARRAY_APPLY(<arr>, <op>, <val>)
```

## Parameters
| Parameter | Description |
|---|---|
| `<arr>` | Input array |
| `<op>` | Filter condition, including `=`, `>=`, `<=`, `>`, `<`, `!=` |
| `<val>` | Filter value. If `null`, the result will be `null`. Only constant values are supported. |

## Return Value

The filtered array matched with condition.

## Example

```sql
select array_apply([1, 2, 3, 4, 5], ">=", 2);
```
```text
+--------------------------------------------+
| array_apply(ARRAY(1, 2, 3, 4, 5), '>=', 2) |
+--------------------------------------------+
| [2, 3, 4, 5]                               |
+--------------------------------------------+
```
```sql
select array_apply([1000000, 1000001, 1000002], "=", "1000002");
```
```text
+-------------------------------------------------------------+
| array_apply(ARRAY(1000000, 1000001, 1000002), '=', 1000002) |
+-------------------------------------------------------------+
| [1000002]                                                   |
+-------------------------------------------------------------+
```