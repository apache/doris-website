---
{
    "title": "ORTHOGONAL_BITMAP_UNION_COUNT",
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

ORTHOGONAL_BITMAP_UNION_COUNT 函数返回对 Bitmap 表达式进行并集计算后集合中的元素数量

## 语法

```sql
ORTHOGONAL_BITMAP_UNION_COUNT(<bitmap_column>, <column_to_filter>, <filter_values>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `bitmap_column` | 需要获取值的 Bitmap 类型表达式 |
| `column_to_filter` | 可选。需要进行过滤的维度列 |
| `filter_values` | 可选。变长参数，用于过滤维度列的不同取值 |

## 返回值

返回 BIGINT 类型的值。

## 举例

```sql
select ORTHOGONAL_BITMAP_UNION_COUNT(members) from tag_map where  tag_group in ( 1150000, 1150001, 390006);
```

```text
+------------------------------------------+
| orthogonal_bitmap_union_count(`members`) |
+------------------------------------------+
|                                286957811 |
+------------------------------------------+
```