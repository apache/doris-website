---
{
    "title": "BITMAP_HASH",
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

Computes the 32-bit hash value of any input type and returns a Bitmap containing that hash value.

## Syntax

```sql
BITMAP_HASH(<expr>)
```

## Parameters

| Parameter | Description           |
|-----------|-----------------------|
| `<expr>`  | Any value or field expression |

## Return Value

Returns a Bitmap containing the 32-bit hash value of the parameter `<expr>`.

::: note

The hash algorithm used is MurMur3.  
MurMur3 is a high-performance, low-collision hashing algorithm that produces values close to a random distribution and can pass chi-squared distribution tests. Note that the hash values computed may differ across different hardware platforms and seed values.  
For more details on the performance of this algorithm, see the [Smhasher](http://rurban.github.io/smhasher/) benchmark.

:::

## Examples

To compute the MurMur3 hash of a value, you can use:

```sql
select bitmap_to_array(bitmap_hash('hello'))[1];
```

The result will be:

```text
+-------------------------------------------------------------+
| %element_extract%(bitmap_to_array(bitmap_hash('hello')), 1) |
+-------------------------------------------------------------+
|                                                  1321743225 |
+-------------------------------------------------------------+
```

To count the distinct values in a column using bitmaps, which can be more efficient than `count distinct` in some scenarios:

```sql
select bitmap_count(bitmap_union(bitmap_hash(`word`))) from `words`;
```

The result will be:

```text
+-------------------------------------------------+
| bitmap_count(bitmap_union(bitmap_hash(`word`))) |
+-------------------------------------------------+
|                                        33263478 |
+-------------------------------------------------+
```
