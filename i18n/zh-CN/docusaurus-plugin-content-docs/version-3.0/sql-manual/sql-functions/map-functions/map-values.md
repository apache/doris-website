---
{
    "title": "MAP_VALUES",
    "language": "zh-CN"
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

### Description

#### Syntax

`ARRAY<K> map_values(Map<K, V> map)`

将给定 `map` 的值提取成一个对应类型的 `ARRAY`

### Example

```sql
mysql> select map_values(map(1, "100", 0.1, 2));
+---------------------------------------------------------------------------------------------------+
| map_values(map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT))) |
+---------------------------------------------------------------------------------------------------+
| ["100", "2"]                                                                                      |
+---------------------------------------------------------------------------------------------------+
1 row in set (0.12 sec)

mysql> select map_values(map());
+-------------------+
| map_values(map()) |
+-------------------+
| []                |
+-------------------+
1 row in set (0.11 sec)
```

### Keywords

MAP, VALUES, MAP_VALUES
