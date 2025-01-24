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

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<bitmap_column>` | 需要获取第一个值的表达式 |
| `<column_to_filter>` | 可选。需要进行过滤的维度列 |
| `<filter_values>` | 可选。过滤维度列的不同取值 |

## 返回值

返回 BIGINT 类型的值。

## 举例

```sql
select dt,bitmap_to_string(user_id) from pv_bitmap where dt in (3,4);
```

```text
+------+-----------------------------+
| dt   | bitmap_to_string(`user_id`) |
+------+-----------------------------+
| 4    | 1,2,3                       |
| 3    | 1,2,3,4,5                   |
+------+-----------------------------+
```

```sql
select intersect_count(user_id,dt,3,4) from pv_bitmap;
```

```text
+----------------------------------------+
| intersect_count(`user_id`, `dt`, 3, 4) |
+----------------------------------------+
|                                      3 |
+----------------------------------------+
```
