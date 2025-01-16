---
{
"title": "INTERSECT_COUNT",
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


## 描述

INTERSECT_COUNT 函数用于计算 Bitmap 数据结构的交集元素的数量。

## 语法

`BITMAP INTERSECT_COUNT(bitmap_column, column_to_filter, filter_values)`
聚合函数，求bitmap交集大小的函数, 不要求数据分布正交
第一个参数是Bitmap列，第二个参数是用来过滤的维度列，第三个参数是变长参数，含义是过滤维度列的不同取值。
计算 bitmap_column 中符合 column_to_filter 在 filter_values 之内的元素的交集数量，即 bitmap 交集计数。

## 举例

```sql
select dt,bitmap_to_string(user_id) from pv_bitmap where dt in (3,4);
```
mysql [test]>select dt,bitmap_to_string(user_id) from pv_bitmap;
+------+---------------------------+
| dt   | bitmap_to_string(user_id) |
+------+---------------------------+
|    1 | 1,2                       |
|    2 | 2,3                       |
|    4 | 1,2,3,4,5                 |
|    3 | 1,2,3                     |
+------+---------------------------+
4 rows in set (0.02 sec)

mysql [test]>select intersect_count(user_id,dt,3,4) from pv_bitmap;
+------------------------------------+
| intersect_count(user_id, dt, 3, 4) |
+------------------------------------+
|                                  3 |
+------------------------------------+
```
