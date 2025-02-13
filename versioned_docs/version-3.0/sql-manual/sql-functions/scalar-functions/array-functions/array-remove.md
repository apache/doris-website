---
{
    "title": "ARRAY_REMOVE",
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

Removes all specified elements from an array

## Syntax

```sql
ARRAY_REMOVE(<arr>, <val>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<arr>` | Corresponding array |
| `<val>` | Specifying Elements |

## Return Value

Returns the array after removing all specified elements. If the input parameter is NULL, it returns NULL

## Example

```sql
SELECT ARRAY_REMOVE(['test', NULL, 'value'], 'value');
```

```text
+------------------------------------------------+
| array_remove(['test', NULL, 'value'], 'value') |
+------------------------------------------------+
| ["test", null]                                 |
+------------------------------------------------+
```
