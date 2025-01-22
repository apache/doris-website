---
{
    "title": "ARRAY_SIZE",
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

Count the number of elements in an array

## Aliases

- SIZE
- CARDINALITY

## Syntax

```sql
ARRAY_SIZE(<arr>) 
```

## Parameters

| Parameter | Description |
|--|--|
| `<arr>` | The array to be calculated |

## Return Value

Returns the number of elements in the array. If the input array is NULL, it returns NULL.

## Example

```sql
SELECT ARRAY_SIZE(['a', 'b', 'c']),ARRAY_SIZE([NULL]),ARRAY_SIZE([]);
```

```text
+------------------------------+---------------------+-----------------+
| cardinality(['a', 'b', 'c']) | cardinality([NULL]) | cardinality([]) |
+------------------------------+---------------------+-----------------+
|                            3 |                   1 |               0 |
+------------------------------+---------------------+-----------------+
```
