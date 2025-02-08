---
{
    "title": "ARRAY_ZIP",
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

Merges all arrays into a single array. The resulting array contains corresponding elements from the source arrays, grouped in the order of the argument list.

## Syntax

```sql
ARRAY_ZIP(<array>[, <array> ])
```

## Parameters

| Parameter | Description |
|--|--|
| `<array>` | Input array |

## Return Value

Returns an array with the elements from the source array grouped into a structure. The data types in the structure are the same as the input array and are in the order in which the array was passed.

## Example

```sql
SELECT ARRAY_ZIP(['a', 'b', 'c'], [1, 2, 3]);
```

```text
+--------------------------------------------------------+
| array_zip(['a', 'b', 'c'], [1, 2, 3])                  |
+--------------------------------------------------------+
| [{"1":"a", "2":1}, {"1":"b", "2":2}, {"1":"c", "2":3}] |
+--------------------------------------------------------+
```
