---
{
    "title": "MAP",
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

Constructs a [`Map<K, V>`](../../../basic-element/sql-data-types/semi-structured/MAP.md) of a specific type using some set of key-value pairs

## Syntax

```sql
MAP( <key1> , <value1> [, <key2>,<value2> ... ])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<key>` | Constructing the key of the map |
| `<value>` | Constructing the value of the map |

## Return Value

Returns a specific type `Map<K, V>` constructed from a number of key-value pairs

## Example

```sql
select map(1, "100", 0.1, 2),map(1, "100", 0.1, 2)[1];
```

```text
+-----------------------+--------------------------+
| map(1, "100", 0.1, 2) | map(1, "100", 0.1, 2)[1] |
+-----------------------+--------------------------+
| {1.0:"100", 0.1:"2"}  | 100                      |
+-----------------------+--------------------------+
```

* If there are duplicate keys, they will be deduplicated：
```sql
select map(1, 2, 2, 11, 1, 3);
```
```text
+------------------------+
| map(1, 2, 2, 11, 1, 3) |
+------------------------+
| {2:11, 1:3}            |
+------------------------+
```
> There are two sets of parameters with the key 1 (1, 2 and 1, 3), only 1, 3 is retained.