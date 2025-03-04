---
{
    "title": "BITMAP_SUBSET_IN_RANGE",
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

返回 Bitmap 指定范围内的子集 (不包括范围结束)。

## 语法

```sql
bitmap_subset_in_range(<bitmap>, <range_start_include>, <range_end_exclude>)
```

## 参数

| 参数        | 描述        |
|-----------|-----------|
| `<bitmap>` | Bitmap 值  |
| `<range_start_include>` | 范围开始（包含）  |
| `<range_end_exclude>` | 范围结束（不包含） |

## 返回值

指定范围的子集 Bitmap。

## 示例

获取 Bitmap 中位于范围 0 到 9 内的子集：

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 0, 9)) value;
```

结果如下：

```text
+-----------+
| value     |
+-----------+
| 1,2,3,4,5 |
+-----------+
```

获取 Bitmap 中位于范围 2 到 3 内的子集：

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, 3)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| 2     |
+-------+
```
