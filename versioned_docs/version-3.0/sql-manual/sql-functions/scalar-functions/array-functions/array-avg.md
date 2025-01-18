---
{
    "title": "ARRAY_AVG",
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
Get the average of all elements in an array (`NULL` values are skipped).
When the array is empty or all elements in the array are `NULL` values, the function returns `NULL`.

## Syntax
```sql
ARRAY_AVG(<arr>)
```

## Parameters
| Parameter | Description |
|---|---|
| `<arr>` | ARRAY |

## Return Value

Returns a constant. Special cases:
- `NULL` values in the array will be skipped.
- Strings and varchar in the array will be skipped.

## Example

```sql
create table array_type_table(
    k1 INT, 
    k2 Array<int>
) 
duplicate key (k1)
distributed by hash(k1) buckets 1 
properties(
    'replication_num' = '1'
);
insert into array_type_table values (0, []), (1, [NULL]), (2, [1, 2, 3]), (3, [1, NULL, 3]);
select k2, array_avg(k2) from array_type_table;
```
```text
+--------------+-----------------+
| k2           | array_avg(`k2`) |
+--------------+-----------------+
| []           |            NULL |
| [NULL]       |            NULL |
| [1, 2, 3]    |               2 |
| [1, NULL, 3] |               2 |
+--------------+-----------------+
```
```sql
select array_avg(['test',2,1,null]);
```
```text
+------------------------------------------------------------+
| array_avg(cast(['test', '2', '1', NULL] as ARRAY<DOUBLE>)) |
+------------------------------------------------------------+
|                                                        1.5 |
+------------------------------------------------------------+
```