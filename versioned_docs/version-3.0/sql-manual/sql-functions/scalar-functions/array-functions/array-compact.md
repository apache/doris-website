---
{
    "title": "ARRAY_COMPACT",
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

Removes consecutive duplicate elements from an array. The order of result values is determined by the order in the source array.

## Syntax
```sql
ARRAY_COMPACT(<arr>)
```

## Parameters
| Parameter | Description |
|---|---|
| `<arr>` | The array to remove consecutive duplicate elements from |

## Return Value

An array without consecutive duplicate elements.

## Example

```sql
select array_compact([1, 2, 3, 3, null, null, 4, 4]);
```
```text
+----------------------------------------------------+
| array_compact(ARRAY(1, 2, 3, 3, NULL, NULL, 4, 4)) |
+----------------------------------------------------+
| [1, 2, 3, NULL, 4]                                 |
+----------------------------------------------------+
```
```sql
select array_compact(['aaa','aaa','bbb','ccc','ccccc',null, null,'dddd']);
```
```text
+-------------------------------------------------------------------------------+
| array_compact(ARRAY('aaa', 'aaa', 'bbb', 'ccc', 'ccccc', NULL, NULL, 'dddd')) |
+-------------------------------------------------------------------------------+
| ['aaa', 'bbb', 'ccc', 'ccccc', NULL, 'dddd']                                  |
+-------------------------------------------------------------------------------+
```
```sql
select array_compact(['2015-03-13','2015-03-13']);
```
```text
+--------------------------------------------------+
| array_compact(ARRAY('2015-03-13', '2015-03-13')) |
+--------------------------------------------------+
| ['2015-03-13']                                   |
+--------------------------------------------------+
```

