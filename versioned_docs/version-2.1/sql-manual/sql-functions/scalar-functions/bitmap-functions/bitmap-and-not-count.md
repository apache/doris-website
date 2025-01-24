---
{
    "title": "BITMAP_AND_NOT_COUNT,BITMAP_ANDNOT_COUNT",
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

Performs a NOT operation on two BITMAPs and returns the number of elements in the result set. The first input parameter is called `base BITMAP` and the second is called `exclusion BITMAP`.

## Alias

- BITMAP_ANDNOT_COUNT

## Syntax

```sql
BITMAP_AND_NOT_COUNT(<bitmap1>, <bitmap2>)
```

## Parameters

| Parameter   | Description                      |
|-------------|----------------------------------|
| `<bitmap1>` | `Base BITMAP` to be negated      |
| `<bitmap2>` | `Exclusion BITMAP` to be negated |

## Return Value

Returns an integer.
- If the parameter has a null value, returns NULL

## Examples

```sql
select bitmap_and_not_count(null, bitmap_from_string('1,2,3')) banc1, bitmap_and_not_count(bitmap_from_string('1,2,3') ,null) banc2;
```

```text
+-------+-------+
| banc1 | banc2 |
+-------+-------+
|     0 |     0 |
+-------+-------+
```

```sql
select bitmap_and_not_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) banc;
```

```text
+------+
| banc |
+------+
|    2 |
+------+
```