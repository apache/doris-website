---
{
    "title": "GROUP_ARRAY_INTERSECT",
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

## group_array_intersect
### description
#### Syntax

`expr GROUP_ARRAY_INTERSECT(expr)`

求出所有行中输入数组中的交集元素，返回一个新的数组

### example

```
mysql> select c_array_string from group_array_intersect_test where id in (18, 20);
+--------------------------------+
| c_array_string                 |
+--------------------------------+
| ["a", "b", "c", "d", "e", "f"] |
| ["a", null]                    |
+--------------------------------+
2 rows in set (0.02 sec)

mysql> select group_array_intersect(c_array_string) from group_array_intersect_test where id in (18, 20);
+---------------------------------------+
| group_array_intersect(c_array_string) |
+---------------------------------------+
| ["a"]                                 |
+---------------------------------------+
1 row in set (0.03 sec)
```

### keywords
GROUP_ARRAY_INTERSECT, ARRAY
